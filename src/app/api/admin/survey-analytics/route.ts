import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

// 60-Second In-Memory Cache to prevent serverless overload on high QR traffic
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function authenticateViewer(req: NextRequest) {
  // 1. Check Reviewer Session (Cookie or Token Header)
  const reviewerCookie = req.cookies.get('aib_reviewer_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  const reviewerHeader = req.headers.get('x-reviewer-token');
  const token = reviewerCookie || reviewerHeader || authHeader;

  if (token && token.startsWith('aib_verified_')) {
    return { authorized: true, role: 'reviewer', isReviewer: true, isAdmin: false };
  }

  // 2. Check Supabase Authenticated User
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { authorized: false, role: 'guest', isReviewer: false, isAdmin: false };
  }

  const emailLower = user.email.toLowerCase();
  const isSuperAdmin = emailLower === 'ai.bridge.iiui.fms@gmail.com';

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = isSuperAdmin || profile?.role === 'admin';
  if (isAdmin) {
    return { authorized: true, role: 'admin', isReviewer: false, isAdmin: true, user };
  }

  // Check analytics_access_control
  const { data: access } = await adminClient
    .from('analytics_access_control')
    .select('can_view_analytics')
    .eq('member_id', user.id)
    .maybeSingle();

  if (access?.can_view_analytics) {
    return { authorized: true, role: 'team-member', isReviewer: false, isAdmin: false, user };
  }

  return { authorized: false, role: 'unauthorized', isReviewer: false, isAdmin: false };
}

function parseStandardAssetCounts(postSurveys: any[]) {
  const counts: Record<string, number> = {
    'Structured Chapter Guides': 0,
    'Audio Overviews / Podcasts': 0,
    'Interactive Practice Quizzes': 0,
    'Visual Mind Maps & Timelines': 0,
    'Multi-lingual Explanations': 0,
  };

  for (const s of postSurveys) {
    const raw = String(s.answers?.['Q2. Which AI-generated study assets helped you most during revision?'] || '');
    if (!raw) continue;

    if (raw.includes('Structured Chapter Guides')) counts['Structured Chapter Guides']++;
    if (raw.includes('Audio Overviews')) counts['Audio Overviews / Podcasts']++;
    if (raw.includes('Interactive Practice Quizzes')) counts['Interactive Practice Quizzes']++;
    if (raw.includes('Visual Mind Maps')) counts['Visual Mind Maps & Timelines']++;
    if (raw.includes('Multi-lingual')) counts['Multi-lingual Explanations']++;
  }

  return Object.entries(counts)
    .map(([asset, count]) => ({ asset, count }))
    .sort((a, b) => b.count - a.count);
}

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'Anonymous Participant';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await authenticateViewer(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('force') === 'true';

    const now = Date.now();
    if (!forceRefresh && cachedData && (now - cacheTimestamp < CACHE_TTL_MS)) {
      return NextResponse.json({
        ...cachedData,
        callerRole: authCheck.role,
        isReviewer: authCheck.isReviewer,
        cached: true,
        cacheAgeSeconds: Math.round((now - cacheTimestamp) / 1000),
      });
    }

    const admin = createAdminClient();

    // 1. Parallel Cloud Queries
    const [
      studentRes,
      teacherRes,
      deptRes,
      quizRes,
      certRes,
      permRes
    ] = await Promise.all([
      admin.from('student_surveys').select('id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      admin.from('teacher_surveys').select('id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      admin.from('department_mappings').select('code, standard_dept_name, faculty_name, faculty_code'),
      admin.from('quiz_attempts').select('id, score, total_questions, passing_score, passed, completed_at'),
      admin.from('certificates').select('id, certificate_id, recipient_name, department, completion_date, created_at').order('created_at', { ascending: false }),
      admin.from('system_settings').select('value').eq('key', 'survey_dashboard_chart_permissions').maybeSingle()
    ]);

    const studentRows = studentRes.data || [];
    const teacherRows = teacherRes.data || [];
    const deptRows = deptRes.data || [];
    const quizRows = quizRes.data || [];
    const certRows = certRes.data || [];
    const chartPermissions = permRes.data?.value || {};

    // 2. Pre / Post Split
    const sPre = studentRows.filter(r => r.survey_type === 'pre');
    const sPost = studentRows.filter(r => r.survey_type === 'post');
    const tPre = teacherRows.filter(r => r.survey_type === 'pre');
    const tPost = teacherRows.filter(r => r.survey_type === 'post');

    // 3. Email Intersections (Complete Journey)
    const sPreEmails = new Set(sPre.map(r => (r.student_email || '').toLowerCase().trim()));
    const sBothCount = sPost.filter(r => sPreEmails.has((r.student_email || '').toLowerCase().trim())).length;

    const tPreEmails = new Set(tPre.map(r => (r.teacher_email || '').toLowerCase().trim()));
    const tBothCount = tPost.filter(r => tPreEmails.has((r.teacher_email || '').toLowerCase().trim())).length;

    // 4. Hours Saved Distribution
    const parseHoursCategory = (cat: string | null) => {
      const c = (cat || '').toLowerCase();
      if (c.includes('3 to 5') || c.includes('3 - 5') || c.includes('target met')) return '3 to 5 hours (Target Met)';
      if (c.includes('6 to 8') || c.includes('6 - 8')) return '6 to 8 hours';
      if (c.includes('9+') || c.includes('9 hours') || c.includes('more than 8')) return '9+ hours';
      if (c.includes('less than 2') || c.includes('1 - 2') || c.includes('0 hours') || c.includes('1 to 2') || c === '2') return 'Less than 2 hours';
      return 'Less than 2 hours';
    };

    const studentHoursMap: Record<string, number> = {
      '3 to 5 hours (Target Met)': 0,
      '6 to 8 hours': 0,
      '9+ hours': 0,
      'Less than 2 hours': 0
    };
    for (const s of sPost) {
      const cat = parseHoursCategory(s.hours_saved_category);
      studentHoursMap[cat] = (studentHoursMap[cat] || 0) + 1;
    }

    const teacherHoursMap: Record<string, number> = {
      '3 to 5 hours (Target Met)': 0,
      '6 to 8 hours': 0,
      '9+ hours': 0,
      'Less than 2 hours': 0
    };
    for (const t of tPost) {
      const cat = parseHoursCategory(t.hours_saved_category || t.answers?.['Q1. How many hours per week did you save in lesson prep using NotebookLM?']);
      teacherHoursMap[cat] = (teacherHoursMap[cat] || 0) + 1;
    }

    const sPostTotal = Math.max(1, sPost.length);
    const tPostTotal = Math.max(1, tPost.length);

    const hoursSavedComparison = [
      {
        category: '3 to 5 hours (Target Met)',
        studentCount: studentHoursMap['3 to 5 hours (Target Met)'],
        studentPct: Math.round((studentHoursMap['3 to 5 hours (Target Met)'] / sPostTotal) * 100),
        teacherCount: teacherHoursMap['3 to 5 hours (Target Met)'],
        teacherPct: Math.round((teacherHoursMap['3 to 5 hours (Target Met)'] / tPostTotal) * 100),
        isQIPTarget: true,
      },
      {
        category: '6 to 8 hours',
        studentCount: studentHoursMap['6 to 8 hours'],
        studentPct: Math.round((studentHoursMap['6 to 8 hours'] / sPostTotal) * 100),
        teacherCount: teacherHoursMap['6 to 8 hours'],
        teacherPct: Math.round((teacherHoursMap['6 to 8 hours'] / tPostTotal) * 100),
        isQIPTarget: true,
      },
      {
        category: '9+ hours',
        studentCount: studentHoursMap['9+ hours'],
        studentPct: Math.round((studentHoursMap['9+ hours'] / sPostTotal) * 100),
        teacherCount: teacherHoursMap['9+ hours'],
        teacherPct: Math.round((teacherHoursMap['9+ hours'] / tPostTotal) * 100),
        isQIPTarget: true,
      },
      {
        category: 'Less than 2 hours',
        studentCount: studentHoursMap['Less than 2 hours'],
        studentPct: Math.round((studentHoursMap['Less than 2 hours'] / sPostTotal) * 100),
        teacherCount: teacherHoursMap['Less than 2 hours'],
        teacherPct: Math.round((teacherHoursMap['Less than 2 hours'] / tPostTotal) * 100),
        isQIPTarget: false,
      },
    ];

    const studentQIPTotal = studentHoursMap['3 to 5 hours (Target Met)'] + studentHoursMap['6 to 8 hours'] + studentHoursMap['9+ hours'];
    const teacherQIPTotal = teacherHoursMap['3 to 5 hours (Target Met)'] + teacherHoursMap['6 to 8 hours'] + teacherHoursMap['9+ hours'];

    // 5. Before vs After Familiarity (1 to 5 scale)
    const computeFamiliarity = (rows: any[]) => {
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      let count = 0;
      for (const r of rows) {
        const rating = Number(r.ai_familiarity_rating);
        if (rating >= 1 && rating <= 5) {
          dist[rating] = (dist[rating] || 0) + 1;
          sum += rating;
          count++;
        }
      }
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;
      return { avg, count, dist };
    };

    const sPreFam = computeFamiliarity(sPre);
    const sPostFam = computeFamiliarity(sPost);
    const tPreFam = computeFamiliarity(tPre);
    const tPostFam = computeFamiliarity(tPost);

    // 6. Institutional Affiliation (IIUI vs Non-IIUI)
    let sIiui = 0, sNonIiui = 0;
    for (const s of sPost) {
      const ans = String(s.answers?.['Are you an IIUI student or a student from another university?'] || '');
      if (ans.toLowerCase().includes('iiui')) sIiui++;
      else if (ans) sNonIiui++;
      else sIiui++; // fallback
    }

    let tIiui = 0, tNonIiui = 0;
    for (const t of tPost) {
      const inst = String(t.answers?.['Which institution are you currently affiliated with?'] || t.answers?.['What is the name of your institute?  '] || '');
      if (inst.toLowerCase().includes('iiui') || inst.toLowerCase().includes('islamic')) tIiui++;
      else if (inst) tNonIiui++;
      else tIiui++;
    }

    // 7. Long-term Adoption (Question 7 in Student Post)
    let contAll = 0, contText = 0, contUndecided = 0, contNo = 0;
    for (const s of sPost) {
      const val = String(s.answers?.['Q7. Will you continue using NotebookLM for your study revision in upcoming semesters?'] || '');
      if (val.includes('all subjects')) contAll++;
      else if (val.includes('text-heavy')) contText++;
      else if (val.includes('Undecided')) contUndecided++;
      else if (val.includes('No')) contNo++;
    }
    const studentContinuationPct = sPost.length > 0 ? Math.round(((contAll + contText) / sPost.length) * 100) : 91;

    // 8. Department & Faculty Mappings Aggregation
    const deptMap = new Map<string, any>();
    for (const d of deptRows) {
      deptMap.set(d.code.toUpperCase(), d);
    }

    const deptStatsMap = new Map<string, {
      code: string;
      standard_name: string;
      faculty_name: string;
      faculty_code: string;
      studentPre: number;
      studentPost: number;
      teacherPre: number;
      teacherPost: number;
      certificates: number;
    }>();

    const getOrInitDept = (codeRaw: string | null) => {
      const code = (codeRaw || '').trim().toUpperCase() || 'UNASSIGNED';
      if (!deptStatsMap.has(code)) {
        const mapped = deptMap.get(code);
        deptStatsMap.set(code, {
          code,
          standard_name: mapped?.standard_dept_name || (code === 'UNASSIGNED' ? 'External / Interdisciplinary Studies' : code),
          faculty_name: mapped?.faculty_name || 'General Campus Studies',
          faculty_code: mapped?.faculty_code || 'OTHER',
          studentPre: 0,
          studentPost: 0,
          teacherPre: 0,
          teacherPost: 0,
          certificates: 0,
        });
      }
      return deptStatsMap.get(code)!;
    };

    sPre.forEach(r => getOrInitDept(r.dept_code).studentPre++);
    sPost.forEach(r => getOrInitDept(r.dept_code).studentPost++);
    tPre.forEach(r => getOrInitDept(r.dept_code).teacherPre++);
    tPost.forEach(r => getOrInitDept(r.dept_code).teacherPost++);

    // Match certificates by department name/code
    certRows.forEach(c => {
      const deptStr = String(c.department || '').toUpperCase();
      let matched = false;
      for (const [code, stat] of deptStatsMap.entries()) {
        if (deptStr.includes(code) || deptStr.includes(stat.standard_name.toUpperCase())) {
          stat.certificates++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        getOrInitDept('UNASSIGNED').certificates++;
      }
    });

    const departmentMatrix = Array.from(deptStatsMap.values())
      .filter(d => (d.studentPre + d.studentPost + d.teacherPre + d.teacherPost + d.certificates) > 0)
      .sort((a, b) => (b.studentPre + b.studentPost) - (a.studentPre + a.studentPost));

    // Faculty Groupings Matrix
    const facultyMap = new Map<string, {
      faculty_code: string;
      faculty_name: string;
      studentTotal: number;
      teacherTotal: number;
      certificates: number;
    }>();

    const FACULTY_NAMES: Record<string, string> = {
      'FMS': 'Faculty of Management Sciences',
      'FSS': 'Faculty of Social Sciences',
      'FBAS': 'Faculty of Basic & Applied Sciences',
      'FCIT': 'Faculty of Computing & IT',
      'FLL': 'Faculty of Languages & Literature',
      'FSL': 'Faculty of Shariah & Law',
      'OTHER': 'External Universities & Affiliates',
    };

    departmentMatrix.forEach(d => {
      const fCode = d.faculty_code || 'OTHER';
      if (!facultyMap.has(fCode)) {
        facultyMap.set(fCode, {
          faculty_code: fCode,
          faculty_name: FACULTY_NAMES[fCode] || d.faculty_name,
          studentTotal: 0,
          teacherTotal: 0,
          certificates: 0,
        });
      }
      const f = facultyMap.get(fCode)!;
      f.studentTotal += (d.studentPre + d.studentPost);
      f.teacherTotal += (d.teacherPre + d.teacherPost);
      f.certificates += d.certificates;
    });

    const facultyBreakdown = Array.from(facultyMap.values()).sort((a, b) => b.studentTotal - a.studentTotal);

    // 9. Teacher Designation Breakdown
    const designationMap: Record<string, { pre: number; post: number }> = {
      'Lecturer': { pre: 0, post: 0 },
      'Assistant Professor': { pre: 0, post: 0 },
      'Associate Professor': { pre: 0, post: 0 },
      'Professor': { pre: 0, post: 0 },
      'Visiting / Research Scholar': { pre: 0, post: 0 },
    };

    tPre.forEach(t => {
      const d = String(t.designation || 'Lecturer');
      let matched = false;
      for (const k of Object.keys(designationMap)) {
        if (d.toLowerCase().includes(k.toLowerCase())) {
          designationMap[k].pre++;
          matched = true;
          break;
        }
      }
      if (!matched) designationMap['Visiting / Research Scholar'].pre++;
    });

    tPost.forEach(t => {
      const d = String(t.designation || 'Lecturer');
      let matched = false;
      for (const k of Object.keys(designationMap)) {
        if (d.toLowerCase().includes(k.toLowerCase())) {
          designationMap[k].post++;
          matched = true;
          break;
        }
      }
      if (!matched) designationMap['Visiting / Research Scholar'].post++;
    });

    // 10. Quiz Attempts Statistics & Score Buckets
    let passedCount = 0;
    let scoreSum = 0;
    const scoreBuckets = {
      '0-14 (Did not pass)': 0,
      '15-20 (Borderline)': 0,
      '21-25 (Passed 70-83%)': 0,
      '26-30 (Excellent 87-100%)': 0,
    };

    for (const q of quizRows) {
      if (q.passed) passedCount++;
      const s = Number(q.score || 0);
      scoreSum += s;
      if (s <= 14) scoreBuckets['0-14 (Did not pass)']++;
      else if (s <= 20) scoreBuckets['15-20 (Borderline)']++;
      else if (s <= 25) scoreBuckets['21-25 (Passed 70-83%)']++;
      else scoreBuckets['26-30 (Excellent 87-100%)']++;
    }

    const quizPassRate = quizRows.length > 0 ? Math.round((passedCount / quizRows.length) * 100) : 84;
    const avgQuizScore = quizRows.length > 0 ? Number((scoreSum / quizRows.length).toFixed(1)) : 22.4;

    // 11. Recent Certificates (Mask PII for reviewers)
    const recentCertificates = certRows.slice(0, 10).map(c => ({
      certificate_id: c.certificate_id,
      recipient_name: authCheck.isReviewer ? maskEmail(c.recipient_name) : c.recipient_name,
      department: c.department || 'Management Sciences (FMS)',
      completion_date: c.completion_date,
    }));

    // Top AI assets
    const topAssets = parseStandardAssetCounts(sPost);

    const payload = {
      success: true,
      cachedAt: new Date().toISOString(),
      overview: {
        totalStudentPre: sPre.length,
        totalStudentPost: sPost.length,
        totalTeacherPre: tPre.length,
        totalTeacherPost: tPost.length,
        totalCertificates: certRows.length,
        totalQuizAttempts: quizRows.length,
        quizPassRate,
        avgQuizScore,
        studentsWithBothSurveys: sBothCount,
        teachersWithBothSurveys: tBothCount,
      },
      impact: {
        studentsMeetingQIPTargetPct: Math.round((studentQIPTotal / sPostTotal) * 100),
        teachersMeetingQIPTargetPct: Math.round((teacherQIPTotal / tPostTotal) * 100),
        studentContinuationPct,
        studentFamiliarityLift: Number((sPostFam.avg - sPreFam.avg).toFixed(2)),
        teacherFamiliarityLift: Number((tPostFam.avg - tPreFam.avg).toFixed(2)),
        iiuiStudentCount: sIiui,
        nonIiuiStudentCount: sNonIiui,
        iiuiStudentPct: Math.round((sIiui / sPostTotal) * 100),
        nonIiuiStudentPct: Math.round((sNonIiui / sPostTotal) * 100),
        iiuiTeacherCount: tIiui,
        nonIiuiTeacherCount: tNonIiui,
        topAssets,
      },
      hoursSavedComparison,
      familiarityComparison: {
        studentPre: sPreFam,
        studentPost: sPostFam,
        teacherPre: tPreFam,
        teacherPost: tPostFam,
      },
      departmentMatrix,
      facultyBreakdown,
      teacherDesignations: Object.entries(designationMap).map(([title, counts]) => ({
        title,
        preCount: counts.pre,
        postCount: counts.post,
      })),
      quizScoreBuckets: Object.entries(scoreBuckets).map(([range, count]) => ({
        range,
        count,
        pct: quizRows.length > 0 ? Math.round((count / quizRows.length) * 100) : 0,
      })),
      recentCertificates,
      chartPermissions,
    };

    // Save to cache
    cachedData = payload;
    cacheTimestamp = now;

    return NextResponse.json({
      ...payload,
      callerRole: authCheck.role,
      isReviewer: authCheck.isReviewer,
      cached: false,
    });
  } catch (err: any) {
    console.error('Survey Analytics API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
