const fs = require('fs');
const path = require('path');

// ─── 1. survey-analytics/route.ts ───────────────────────────────────────────
const surveyFile = path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'survey-analytics', 'route.ts');
let survey = fs.readFileSync(surveyFile, 'utf8');

// Add .limit(10000) to all 5 core table fetches in the Promise.all block
// Each of these is a plain .select(...) with no existing .limit()
const targets = [
  // student_surveys
  {
    from: `admin.from('student_surveys').select('id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at')`,
    to: `admin.from('student_surveys').select('id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at').limit(10000)`,
  },
  // teacher_surveys
  {
    from: `admin.from('teacher_surveys').select('id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at')`,
    to: `admin.from('teacher_surveys').select('id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at').limit(10000)`,
  },
  // department_mappings (small table, but add limit anyway)
  {
    from: `admin.from('department_mappings').select('code, standard_dept_name, faculty_name, faculty_code')`,
    to: `admin.from('department_mappings').select('code, standard_dept_name, faculty_name, faculty_code').limit(500)`,
  },
  // quiz_attempts
  {
    from: `admin.from('quiz_attempts').select('id, score, total_questions, passing_score, passed, completed_at')`,
    to: `admin.from('quiz_attempts').select('id, score, total_questions, passing_score, passed, completed_at').limit(10000)`,
  },
  // certificates - already has .order(), add .limit() after it
  {
    from: `admin.from('certificates').select('id, certificate_id, recipient_name, department, completion_date, created_at').order('created_at', { ascending: false })`,
    to: `admin.from('certificates').select('id, certificate_id, recipient_name, department, completion_date, created_at').order('created_at', { ascending: false }).limit(10000)`,
  },
];

let changed = 0;
for (const t of targets) {
  if (survey.includes(t.from)) {
    survey = survey.replace(t.from, t.to);
    changed++;
  } else {
    console.warn('WARN: target not found:', t.from.substring(0, 60));
  }
}

fs.writeFileSync(surveyFile, survey, 'utf8');
console.log(`survey-analytics/route.ts: ${changed}/5 replacements applied.`);

// ─── 2. analytics/route.ts ──────────────────────────────────────────────────
const analyticsFile = path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'analytics', 'route.ts');
let analytics = fs.readFileSync(analyticsFile, 'utf8');

// The sampleEvents already has .limit(3000) — bump it to 10000
analytics = analytics.replace('.limit(3000)', '.limit(10000)');
// recentEvents already has .limit(50) - keep it (it's intentional for the feed)

fs.writeFileSync(analyticsFile, analytics, 'utf8');
console.log('analytics/route.ts: sampleEvents limit bumped to 10000.');

console.log('DONE — all Supabase 1000-row caps removed.');
