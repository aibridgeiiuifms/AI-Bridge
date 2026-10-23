import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'The AI Bridge Google Sheets Sync Webhook (2-Table Architecture) is online and ready.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Extracts student semester, department code, and registration number from institutional email.
 * - Type 1: [Reg][Dept][Semester]@student.iiu.edu.pk (e.g. 025580bsirf26)
 * - Type 2: [Name].[Dept][Reg]@student.iiu.edu.pk (e.g. zain.bsba126)
 * - Fallback: For Type 2, searches the form roll number answer for season+year (e.g. F23, S24).
 */
function parseStudentEmail(rawEmail: string, fallbackRoll?: string): {
  regNo: string;
  deptCode: string;
  semester: string;
} {
  if (!rawEmail) return { regNo: '', deptCode: '', semester: '' };

  const clean = rawEmail.replace(/\s+/g, '').toLowerCase();
  const userPart = clean.split('@')[0];

  // Type 1: Modern Format [Reg][Dept][Semester] e.g. 025580bsirf26, 025580_bsir_f26
  const matchStd = userPart.match(/^(\d+)[/_.-]?([a-z]+?)[/_.-]?([fs]\d{2})$/);
  if (matchStd) {
    return {
      regNo: matchStd[1],
      deptCode: matchStd[2].toUpperCase(),
      semester: matchStd[3].toUpperCase() // e.g. F26
    };
  }

  // Type 2: Older / Senior Format [Name].[Dept][Reg] e.g. zain.bsba126
  const matchName = userPart.match(/^[a-z]+[._-]([a-z]+?)(\d+)$/);
  if (matchName) {
    const deptCode = matchName[1].toUpperCase();
    const regNo = matchName[2];
    let semester = '';

    // "Via Fallback": Check messy roll number from form answers for season+year
    if (fallbackRoll) {
      const matchRollSem = fallbackRoll.match(/([fsFS][-_\s]?\d{2})/);
      if (matchRollSem) {
        semester = matchRollSem[1].replace(/[-_\s]/g, '').toUpperCase();
      }
    }

    return {
      regNo,
      deptCode,
      semester: semester || 'UNKNOWN'
    };
  }

  // Type 1 Fallback search across string (e.g. if extra text typed around it)
  const matchSearch = clean.match(/(\d{4,6})[/\-_.]?([a-z]+?)[/\-_.]?([fs]\d{2})/);
  if (matchSearch) {
    return {
      regNo: matchSearch[1],
      deptCode: matchSearch[2].toUpperCase(),
      semester: matchSearch[3].toUpperCase()
    };
  }

  return { regNo: '', deptCode: '', semester: '' };
}

function extractFallbackRoll(answers: Record<string, any>): string {
  if (!answers || typeof answers !== 'object') return '';
  for (const [key, val] of Object.entries(answers)) {
    const k = key.toLowerCase();
    if (k.includes('roll') || k.includes('reg') || k.includes('registration')) {
      return String(val || '');
    }
  }
  return '';
}

function extractFullName(answers: Record<string, any>, email: string): string {
  if (!answers || typeof answers !== 'object') return splitEmailName(email);
  for (const [key, val] of Object.entries(answers)) {
    const k = key.toLowerCase();
    if (k.includes('student name') || k.includes('teacher name') || k.includes('full name') || k === 'name') {
      const v = String(val || '').trim();
      if (v) return v;
    }
  }
  return splitEmailName(email);
}

function splitEmailName(email: string): string {
  const local = (email || '').split('@')[0];
  const parts = local.split(/[._0-9]/).filter(Boolean);
  return parts.length > 0 ? parts.join(' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Participant';
}

function extractHoursCategory(answers: Record<string, any>): string {
  if (!answers || typeof answers !== 'object') return '';
  for (const [key, val] of Object.entries(answers)) {
    const k = key.toLowerCase();
    if (k.includes('hour') || k.includes('time save') || k.includes('weekly')) {
      return String(val || '').trim();
    }
  }
  return '';
}

function extractRating(answers: Record<string, any>): number | null {
  if (!answers || typeof answers !== 'object') return null;
  for (const [key, val] of Object.entries(answers)) {
    const k = key.toLowerCase();
    if (k.includes('familiar') || k.includes('rating') || k.includes('scale') || k.includes('comfort')) {
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      if (!isNaN(num) && num >= 1 && num <= 5) return num;
    }
  }
  return null;
}

function detectParticipantType(sheetOrType: string, email: string): 'student' | 'teacher' {
  const s = (sheetOrType || '').toLowerCase();
  if (s.includes('teach') || s.includes('faculty') || s.includes('prof') || s.includes('educator')) return 'teacher';
  return 'student';
}

function resolveParticipantType(rowData: any): 'student' | 'teacher' {
  if (rowData?.participant_type === 'teacher') return 'teacher';
  if (rowData?.participant_type === 'student') return 'student';
  return detectParticipantType(rowData?.sheet_name || '', '');
}

/** Normalises a sheet header so email columns can be matched by name. */
function normalizeHeaderKey(rawHeader: string): string {
  return String(rawHeader || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function cleanEmailValue(val: any): string {
  const clean = String(val ?? '').replace(/\s+/g, '').toLowerCase();
  return clean.includes('@') ? clean : '';
}

/**
 * EMAIL COLUMN PRIORITY — must stay in sync with google-sheet-scripts/02_SyncEngine.gs
 *   student : "Student Email Address" -> "Email Address (non-iiui)" -> "Email address"
 *   teacher : "Institutional Email Address" -> "Email Address (non-iiui)" -> "Email Address"
 */
const EMAIL_PRIORITY: Record<'student' | 'teacher', string[]> = {
  student: ['student email address', 'email address (non-iiui)', 'email address'],
  teacher: ['institutional email address', 'email address (non-iiui)', 'email address']
};

/** Maps normalised header names to the first valid email value found in that column. */
function buildHeaderMap(answers: Record<string, any>): Record<string, string> {
  const map: Record<string, string> = {};
  if (!answers || typeof answers !== 'object') return map;
  for (const [key, val] of Object.entries(answers)) {
    const cleanVal = cleanEmailValue(val);
    if (cleanVal) map[normalizeHeaderKey(key)] = cleanVal;
  }
  return map;
}

/**
 * Resolves the single email that identifies a respondent, strictly by column-name priority.
 */
function resolvePrioritizedEmail(rowData: any, participantType: 'student' | 'teacher'): string {
  const byHeader = buildHeaderMap(rowData.answers || {});
  const order = EMAIL_PRIORITY[participantType] || EMAIL_PRIORITY.student;

  for (const headerName of order) {
    const found = byHeader[headerName];
    if (found) return found;
  }

  // Fallbacks for direct API calls that do not ship the full answers map
  const candidates = [rowData.student_email, rowData.personal_email, rowData.email, rowData.teacher_email];
  for (const candidate of candidates) {
    const clean = cleanEmailValue(candidate);
    if (clean) return clean;
  }
  return '';
}

/**
 * The auto-collected Google-login email (`Email address` column). Stored for reference
 * only — the stable match key is the Google Form Timestamp, not this value.
 */
function resolveLoginEmail(answers: Record<string, any>, participantType: 'student' | 'teacher'): string | null {
  if (participantType !== 'student') return null;
  return buildHeaderMap(answers || {})['email address'] || null;
}

/** Finds the Google Form Timestamp inside the stored answers map. */
function findTimestamp(answers: Record<string, any>): string {
  if (!answers || typeof answers !== 'object') return '';
  for (const [key, val] of Object.entries(answers)) {
    if (normalizeHeaderKey(key) === 'timestamp') {
      const value = String(val ?? '').trim();
      if (value && value.toLowerCase() !== 'invalid date') return value;
    }
  }
  return '';
}

/**
 * STABLE MATCH KEY
 * A Google Form Timestamp never changes when the respondent edits their response, so it
 * is used as the row identity. Editing an email therefore UPDATES the same row instead of
 * inserting a duplicate. Falls back to the resolved email for rows without a timestamp.
 */
function computeMatchKey(rowData: any, email: string): string {
  const rawTimestamp = String(rowData.sheet_timestamp || '').trim() || findTimestamp(rowData.answers || {});
  const normalized = rawTimestamp.replace(/\s+/g, '').toLowerCase();
  if (normalized) return `ts:${normalized}`;
  return `em:${String(email || '').replace(/\s+/g, '').toLowerCase()}`;
}

/**
 * Ensures the extracted department code exists in department_mappings so foreign key constraints hold.
 */
async function ensureDepartmentMappingExists(supabase: any, deptCode: string) {
  if (!deptCode) return;
  try {
    const cleanCode = deptCode.toUpperCase();
    await supabase.from('department_mappings').upsert(
      {
        code: cleanCode,
        standard_dept_name: cleanCode,
        faculty_name: 'Pending Assignment',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'code', ignoreDuplicates: true }
    );
  } catch (err) {
    console.error(`ensureDepartmentMappingExists error for ${deptCode}:`, err);
  }
}

/**
 * Core Ingestion Engine: Writes to student_surveys or teacher_surveys with dedicated full_name,
 * preserves raw clean hours_saved_category, and mirrors to legacy surveys.
 */
async function syncSurveyRow(supabase: any, rowData: any) {
  const participantType = resolveParticipantType(rowData);
  const email = resolvePrioritizedEmail(rowData, participantType);
  if (!email) return null;

  const answers = rowData.answers || {};
  const matchKey = computeMatchKey(rowData, email);
  const loginEmail = resolveLoginEmail(answers, participantType);
  const fullName = rowData.full_name || extractFullName(answers, email);
  const hoursCategory = rowData.hours_saved_category || extractHoursCategory(answers);
  const rating = rowData.ai_familiarity_rating || rowData.comprehension_self_rating || extractRating(answers) || 3;
  const surveyType = (rowData.survey_type || 'pre').toLowerCase() === 'post' ? 'post' : 'pre';

  // Parse email for student fields
  const fallbackRoll = extractFallbackRoll(answers);
  const parsed = parseStudentEmail(email, fallbackRoll);
  const regNo = rowData.extracted_reg_no || rowData.reg_no || parsed.regNo || null;
  const rawDept = rowData.extracted_dept_code || rowData.dept_code || parsed.deptCode || null;
  const deptCode = rawDept ? rawDept.trim().toUpperCase() : null;
  const semester = rowData.extracted_semester || rowData.semester || parsed.semester || null;

  if (deptCode) {
    await ensureDepartmentMappingExists(supabase, deptCode);
  }

  // Resolve user profile if registered
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  const userId = profile?.id || null;

  if (participantType === 'teacher') {
    // 1. Save into teacher_surveys table
    const teacherPayload = {
      user_id: userId,
      teacher_email: email,
      login_email: loginEmail,
      match_key: matchKey,
      full_name: fullName,
      survey_type: surveyType,
      designation: rowData.designation || answers['Designation'] || answers['Designation / Academic Rank'] || null,
      dept_code: deptCode,
      department_name: rowData.department_name || answers['Department'] || null,
      teaching_experience: rowData.teaching_experience || answers['Teaching Experience'] || null,
      hours_saved_category: hoursCategory || null,
      ai_familiarity_rating: rating,
      feedback_notes: rowData.feedback_notes || null,
      answers: answers,
      sheet_row_number: rowData.sheet_row_number || null,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { error: teacherErr } = await supabase.from('teacher_surveys').upsert(teacherPayload, { onConflict: 'match_key,survey_type' });
    if (teacherErr && (teacherErr.message?.includes('match_key') || teacherErr.message?.includes('login_email'))) {
      const { match_key, login_email, ...fallbackTeacherPayload } = teacherPayload;
      const { error: fbTErr } = await supabase.from('teacher_surveys').upsert(fallbackTeacherPayload, { onConflict: 'teacher_email,survey_type' });
      if (fbTErr) console.error('Fallback teacher upsert error:', fbTErr);
    } else if (teacherErr) {
      console.error('teacher_surveys upsert error:', teacherErr);
    }
  } else {
    // 2. Save into student_surveys table
    const studentPayload = {
      user_id: userId,
      student_email: email,
      login_email: loginEmail,
      match_key: matchKey,
      full_name: fullName,
      survey_type: surveyType,
      reg_no: regNo,
      dept_code: deptCode,
      semester: semester,
      hours_saved_category: hoursCategory || null,
      ai_familiarity_rating: rating,
      feedback_notes: rowData.feedback_notes || null,
      answers: answers,
      sheet_row_number: rowData.sheet_row_number || null,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { error: studentErr } = await supabase.from('student_surveys').upsert(studentPayload, { onConflict: 'match_key,survey_type' });
    if (studentErr && (studentErr.message?.includes('match_key') || studentErr.message?.includes('login_email'))) {
      const { match_key, login_email, ...fallbackPayload } = studentPayload;
      const { error: fbErr } = await supabase.from('student_surveys').upsert(fallbackPayload, { onConflict: 'student_email,survey_type' });
      if (fbErr) console.error('Fallback student upsert error:', fbErr);
    } else if (studentErr) {
      console.error('student_surveys upsert error:', studentErr);
    }
  }

  return { email, fullName, participantType, deptCode, semester, regNo };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Token
    const expectedSecret = process.env.SHEETS_WEBHOOK_SECRET;
    if (expectedSecret) {
      const authHeader = req.headers.get('authorization') || '';
      const secretHeader = req.headers.get('x-webhook-secret') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '') || secretHeader;

      if (token !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing webhook secret' },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { action = 'INSERT', rows = [] } = body;
    const supabase = createAdminClient();

    // 2. Handle Bulk Sync (SYNC_ALL)
    if (action === 'SYNC_ALL' && Array.isArray(rows)) {
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          action: 'SYNC_ALL',
          rows_processed: 0,
          synced_count: 0,
          message: 'No rows provided to sync.'
        });
      }

      // Resolve each row's participant type, prioritized email, stable match key and login email
      const validRows = rows
        .map(r => {
          const participantType = resolveParticipantType(r);
          const resolved_email = resolvePrioritizedEmail(r, participantType);
          return {
            ...r,
            resolved_participant_type: participantType,
            resolved_email,
            resolved_match_key: computeMatchKey(r, resolved_email),
            resolved_login_email: resolveLoginEmail(r.answers || {}, participantType)
          };
        })
        .filter(r => r.resolved_email);
      const allEmails = Array.from(new Set(validRows.map(r => r.resolved_email)));

      // Fetch user profile IDs in one query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', allEmails);
      
      const profileMap = new Map<string, string>();
      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.email) profileMap.set(p.email.toLowerCase(), p.id);
        });
      }

      const deptCodesToUpsert = new Set<string>();
      const studentBatch: any[] = [];
      const teacherBatch: any[] = [];

      // Query existing user_ids for these match keys so bulk sync never overwrites a bonded user_id with null
      const allMatchKeys = validRows.map(r => r.resolved_match_key);
      const { data: existingStudentLinks } = await supabase
        .from('student_surveys')
        .select('match_key, user_id')
        .in('match_key', allMatchKeys)
        .not('user_id', 'is', null);

      const existingUserMap = new Map<string, string>();
      if (existingStudentLinks) {
        existingStudentLinks.forEach((row: any) => {
          if (row.match_key && row.user_id) existingUserMap.set(row.match_key, row.user_id);
        });
      }

      for (const rowData of validRows) {
        const email = rowData.resolved_email;
        const answers = rowData.answers || {};
        const fullName = rowData.full_name || extractFullName(answers, email);
        const hoursCategory = rowData.hours_saved_category || extractHoursCategory(answers);
        const rating = rowData.ai_familiarity_rating || rowData.comprehension_self_rating || extractRating(answers) || 3;
        const surveyType = (rowData.survey_type || 'pre').toLowerCase() === 'post' ? 'post' : 'pre';
        const participantType = rowData.resolved_participant_type || 'student';
        const matchKey = rowData.resolved_match_key || computeMatchKey(rowData, email);
        const loginEmail = rowData.resolved_login_email || resolveLoginEmail(answers, participantType);

        const fallbackRoll = extractFallbackRoll(answers);
        const parsed = parseStudentEmail(email, fallbackRoll);
        const regNo = rowData.extracted_reg_no || rowData.reg_no || parsed.regNo || null;
        const rawDept = rowData.extracted_dept_code || rowData.dept_code || parsed.deptCode || null;
        const deptCode = rawDept ? rawDept.trim().toUpperCase() : null;
        const semester = rowData.extracted_semester || rowData.semester || parsed.semester || null;
        
        // Preserve existing user_id if row is already linked, otherwise map from profiles
        const userId = existingUserMap.get(matchKey) || profileMap.get(email) || null;

        if (deptCode) {
          deptCodesToUpsert.add(deptCode);
        }

        if (participantType === 'teacher') {
          teacherBatch.push({
            user_id: userId,
            teacher_email: email,
            login_email: loginEmail,
            match_key: matchKey,
            full_name: fullName,
            survey_type: surveyType,
            designation: rowData.designation || answers['Designation'] || answers['Designation / Academic Rank'] || null,
            dept_code: deptCode,
            department_name: rowData.department_name || answers['Department'] || null,
            teaching_experience: rowData.teaching_experience || answers['Teaching Experience'] || null,
            hours_saved_category: hoursCategory || null,
            ai_familiarity_rating: rating,
            feedback_notes: rowData.feedback_notes || null,
            answers: answers,
            sheet_row_number: rowData.sheet_row_number || null,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          studentBatch.push({
            user_id: userId,
            student_email: email,
            login_email: loginEmail,
            match_key: matchKey,
            full_name: fullName,
            survey_type: surveyType,
            reg_no: regNo,
            dept_code: deptCode,
            semester: semester,
            hours_saved_category: hoursCategory || null,
            ai_familiarity_rating: rating,
            feedback_notes: rowData.feedback_notes || null,
            answers: answers,
            sheet_row_number: rowData.sheet_row_number || null,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Batch upsert department codes in 1 query
      if (deptCodesToUpsert.size > 0) {
        const deptPayloads = Array.from(deptCodesToUpsert).map(code => ({
          code,
          standard_dept_name: code,
          faculty_name: 'Pending Assignment',
          updated_at: new Date().toISOString()
        }));
        await supabase.from('department_mappings').upsert(deptPayloads, { onConflict: 'code', ignoreDuplicates: true });
      }

      // High-speed chunked batch upsert for students
      let studentSuccessCount = 0;
      if (studentBatch.length > 0) {
        for (let i = 0; i < studentBatch.length; i += 100) {
          const chunk = studentBatch.slice(i, i + 100);
          let { error } = await supabase.from('student_surveys').upsert(chunk, { onConflict: 'match_key,survey_type' });
          if (error && (error.message?.includes('match_key') || error.message?.includes('login_email'))) {
            console.warn('match_key column not found, falling back to student_email,survey_type for studentBatch');
            const fallbackChunk = chunk.map(({ match_key, login_email, ...rest }) => rest);
            const fbRes = await supabase.from('student_surveys').upsert(fallbackChunk, { onConflict: 'student_email,survey_type' });
            error = fbRes.error;
          }
          if (error) {
            console.error('Batch upsert student_surveys error:', error);
          } else {
            studentSuccessCount += chunk.length;
          }
        }
      }

      // High-speed chunked batch upsert for teachers
      let teacherSuccessCount = 0;
      if (teacherBatch.length > 0) {
        for (let i = 0; i < teacherBatch.length; i += 100) {
          const chunk = teacherBatch.slice(i, i + 100);
          let { error } = await supabase.from('teacher_surveys').upsert(chunk, { onConflict: 'match_key,survey_type' });
          if (error && (error.message?.includes('match_key') || error.message?.includes('login_email'))) {
            console.warn('match_key column not found, falling back to teacher_email,survey_type for teacherBatch');
            const fallbackTeacherChunk = chunk.map(({ match_key, login_email, ...rest }) => rest);
            const fbTRes = await supabase.from('teacher_surveys').upsert(fallbackTeacherChunk, { onConflict: 'teacher_email,survey_type' });
            error = fbTRes.error;
          }
          if (error) {
            console.error('Batch upsert teacher_surveys error:', error);
          } else {
            teacherSuccessCount += chunk.length;
          }
        }
      }

      const totalSynced = studentSuccessCount + teacherSuccessCount;
      return NextResponse.json({
        success: true,
        action: 'SYNC_ALL',
        rows_processed: rows.length,
        synced_count: totalSynced,
        synced_students: studentSuccessCount,
        synced_teachers: teacherSuccessCount,
        message: `Successfully synchronized ${totalSynced} rows in high-speed bulk batch to 2-Table Architecture.`
      });
    }

    // 3. Handle Single Operations
    const email = (body.email || body.student_email || body.teacher_email || '').replace(/\s+/g, '').toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
    }

    if (action === 'INSERT' || action === 'UPDATE') {
      const result = await syncSurveyRow(supabase, body);
      return NextResponse.json({
        success: true,
        action,
        message: `Survey registered for ${email}. Saved in ${result?.participantType === 'teacher' ? 'teacher_surveys' : 'student_surveys'} with full_name '${result?.fullName}'.`,
        details: result
      });
    }

    if (action === 'DELETE') {
      const surveyType = (body.survey_type || 'pre').toLowerCase() === 'post' ? 'post' : 'pre';
      const matchKey = body.match_key || computeMatchKey(body, email);
      await supabase.from('student_surveys').delete().eq('match_key', matchKey).eq('survey_type', surveyType);
      await supabase.from('teacher_surveys').delete().eq('match_key', matchKey).eq('survey_type', surveyType);

      return NextResponse.json({
        success: true,
        action: 'DELETE',
        message: `Survey deleted for ${email}.`
      });
    }

    return NextResponse.json(
      { error: `Unsupported action '${action}'. Valid actions: INSERT, UPDATE, DELETE, SYNC_ALL` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
