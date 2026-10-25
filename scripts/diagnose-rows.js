const { createClient } = require('@supabase/supabase-js');

const url = 'https://ijwucoxajmlzpkcqvrpw.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env not set');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

async function diagnose() {
  console.log('\n=== SUPABASE ROW LIMIT DIAGNOSIS ===\n');

  // 1. Count total rows via COUNT (bypasses row limits)
  const { count: totalStudents, error: e1 } = await admin
    .from('student_surveys')
    .select('id', { count: 'exact', head: true });

  const { count: totalTeachers, error: e2 } = await admin
    .from('teacher_surveys')
    .select('id', { count: 'exact', head: true });

  const { count: totalCerts, error: e3 } = await admin
    .from('certificates')
    .select('id', { count: 'exact', head: true });

  const { count: totalQuiz, error: e4 } = await admin
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true });

  console.log('ACTUAL ROW COUNTS IN SUPABASE:');
  console.log('  student_surveys:', totalStudents, e1?.message || '');
  console.log('  teacher_surveys:', totalTeachers, e2?.message || '');
  console.log('  certificates:   ', totalCerts, e3?.message || '');
  console.log('  quiz_attempts:  ', totalQuiz, e4?.message || '');

  // 2. Test how many rows .select() actually returns with limit(10000)
  console.log('\nACTUAL ROWS RETURNED BY SELECT WITH limit(10000):');

  const { data: s1, error: se1 } = await admin
    .from('student_surveys')
    .select('id')
    .limit(10000);
  console.log('  student_surveys:', s1?.length, se1?.message || '');

  const { data: s2, error: se2 } = await admin
    .from('teacher_surveys')
    .select('id')
    .limit(10000);
  console.log('  teacher_surveys:', s2?.length, se2?.message || '');

  const { data: s3, error: se3 } = await admin
    .from('certificates')
    .select('id')
    .limit(10000);
  console.log('  certificates:   ', s3?.length, se3?.message || '');

  const { data: s4, error: se4 } = await admin
    .from('quiz_attempts')
    .select('id')
    .limit(10000);
  console.log('  quiz_attempts:  ', s4?.length, se4?.message || '');

  // 3. Test with range header (override PostgREST max_rows)
  console.log('\nACTUAL ROWS RETURNED WITH range(0, 4999):');
  const { data: r1 } = await admin
    .from('student_surveys')
    .select('id')
    .range(0, 4999);
  console.log('  student_surveys:', r1?.length);

  console.log('\n=== DIAGNOSIS DONE ===');
}

diagnose().catch(console.error);
