const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'survey-analytics', 'route.ts');
let code = fs.readFileSync(filePath, 'utf8');
const hasCRLF = code.includes('\r\n');
if (hasCRLF) code = code.replace(/\r\n/g, '\n');

// ── Helper function to add (at top of file after imports) ──
const helperFn = `
// Paginated fetch: bypasses PostgREST max_rows=1000 server cap
async function fetchAllRows(
  admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>,
  table: string,
  columns: string,
  pageSize = 1000
): Promise<any[]> {
  const allRows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await (admin.from(table) as any)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(\`fetchAllRows(\${table}): \${error.message}\`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break; // last page
    from += pageSize;
  }
  return allRows;
}
`;

// Insert helper right before `export async function GET`
const insertBefore = 'export async function GET(req: NextRequest)';
if (!code.includes(insertBefore)) {
  console.error('Cannot find insertion point for helper'); process.exit(1);
}
code = code.replace(insertBefore, helperFn + '\n' + insertBefore);
console.log('Helper function inserted.');

// ── Replace the 5 limited queries with paginated calls ──

// 1. student_surveys
code = code.replace(
  `admin.from('student_surveys').select('id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at').limit(10000)`,
  `fetchAllRows(admin, 'student_surveys', 'id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at')`
);

// 2. teacher_surveys
code = code.replace(
  `admin.from('teacher_surveys').select('id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at').limit(10000)`,
  `fetchAllRows(admin, 'teacher_surveys', 'id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at')`
);

// 3. quiz_attempts
code = code.replace(
  `admin.from('quiz_attempts').select('id, score, total_questions, passing_score, passed, completed_at').limit(10000)`,
  `fetchAllRows(admin, 'quiz_attempts', 'id, score, total_questions, passing_score, passed, completed_at')`
);

// 4. certificates (had .order() + .limit())
code = code.replace(
  `admin.from('certificates').select('id, certificate_id, recipient_name, department, completion_date, created_at').order('created_at', { ascending: false }).limit(10000)`,
  `fetchAllRows(admin, 'certificates', 'id, certificate_id, recipient_name, department, completion_date, created_at')`
);

// 5. department_mappings
code = code.replace(
  `admin.from('department_mappings').select('code, standard_dept_name, faculty_name, faculty_code').limit(500)`,
  `fetchAllRows(admin, 'department_mappings', 'code, standard_dept_name, faculty_name, faculty_code')`
);

// ── The Promise.all destructuring now gets plain arrays, not {data, error} objects ──
// Before the fix, it destructured as: [studentRes, teacherRes, ...]
// and then accessed studentRes.data. Now fetchAllRows returns arrays directly.
// We need to update the destructuring + usage.

// Fix the Promise.all block destructuring
code = code.replace(
  `    ] = await Promise.all([
      fetchAllRows(admin, 'student_surveys', 'id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      fetchAllRows(admin, 'teacher_surveys', 'id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      fetchAllRows(admin, 'department_mappings', 'code, standard_dept_name, faculty_name, faculty_code'),
      fetchAllRows(admin, 'quiz_attempts', 'id, score, total_questions, passing_score, passed, completed_at'),
      fetchAllRows(admin, 'certificates', 'id, certificate_id, recipient_name, department, completion_date, created_at'),
      admin.from('system_settings').select('value').eq('key', 'survey_dashboard_chart_permissions').maybeSingle()
    ]);`,
  `    ] = await Promise.all([
      fetchAllRows(admin, 'student_surveys', 'id, student_email, full_name, survey_type, dept_code, semester, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      fetchAllRows(admin, 'teacher_surveys', 'id, teacher_email, full_name, survey_type, dept_code, designation, teaching_experience, hours_saved_category, ai_familiarity_rating, answers, submitted_at'),
      fetchAllRows(admin, 'department_mappings', 'code, standard_dept_name, faculty_name, faculty_code'),
      fetchAllRows(admin, 'quiz_attempts', 'id, score, total_questions, passing_score, passed, completed_at'),
      fetchAllRows(admin, 'certificates', 'id, certificate_id, recipient_name, department, completion_date, created_at'),
      admin.from('system_settings').select('value').eq('key', 'survey_dashboard_chart_permissions').maybeSingle(),
    ]);`
);

// Fix Promise.all variable declarations — they were named Res not data directly
const oldDestructure = `    const [
      studentRes,
      teacherRes,
      deptRes,
      quizRes,
      certRes,
      permRes
    ] = await Promise.all([`;

const newDestructure = `    const [
      studentRows,
      teacherRows,
      deptRows,
      quizRows,
      certRows,
      permRes
    ] = await Promise.all([`;

code = code.replace(oldDestructure, newDestructure);

// Fix the lines that accessed .data on the old Res variables
code = code.replace(
  `    const studentRows = studentRes.data || [];\n    const teacherRows = teacherRes.data || [];\n    const deptRows = deptRes.data || [];\n    const quizRows = quizRes.data || [];\n    const certRows = certRes.data || [];\n    const chartPermissions = permRes.data?.value || {};`,
  `    // studentRows, teacherRows, deptRows, quizRows, certRows are already full arrays from fetchAllRows\n    const chartPermissions = permRes.data?.value || {};`
);

// Now certRows was originally ordered by created_at DESC - re-sort in memory
const certUsage = `    const chartPermissions = permRes.data?.value || {};`;
code = code.replace(certUsage, `    const chartPermissions = permRes.data?.value || {};\n    // Re-sort certificates by created_at DESC (since fetchAllRows doesn't guarantee order)\n    certRows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());`);

if (hasCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, code, 'utf8');
console.log('DONE. File updated with paginated fetchAllRows.');
