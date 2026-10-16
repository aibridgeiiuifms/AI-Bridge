import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateEmailSimilarity } from '@/lib/survey-similarity';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const surveyType = (searchParams.get('survey_type') || 'pre').toLowerCase() === 'post' ? 'post' : 'pre';
    const userEmail = user.email.replace(/\s+/g, '').toLowerCase();

    // Fetch unlinked surveys using Admin Client to ensure complete visibility of orphan records
    const adminSupabase = createAdminClient();

    const [studentRes, teacherRes] = await Promise.all([
      adminSupabase
        .from('student_surveys')
        .select('id, student_email, full_name, survey_type, submitted_at')
        .is('user_id', null)
        .eq('survey_type', surveyType),
      adminSupabase
        .from('teacher_surveys')
        .select('id, teacher_email, full_name, survey_type, submitted_at')
        .is('user_id', null)
        .eq('survey_type', surveyType)
    ]);

    const candidates: Array<{
      id: string;
      survey_type: string;
      participant_type: 'student' | 'teacher';
      survey_email: string;
      full_name: string | null;
      similarity: number;
    }> = [];

    // Evaluate student surveys
    if (studentRes.data) {
      for (const row of studentRes.data) {
        if (!row.student_email) continue;
        const sim = calculateEmailSimilarity(userEmail, row.student_email);
        if (sim >= 0.80) {
          candidates.push({
            id: row.id,
            survey_type: row.survey_type,
            participant_type: 'student',
            survey_email: row.student_email,
            full_name: row.full_name || null,
            similarity: sim,
          });
        }
      }
    }

    // Evaluate teacher surveys
    if (teacherRes.data) {
      for (const row of teacherRes.data) {
        if (!row.teacher_email) continue;
        const sim = calculateEmailSimilarity(userEmail, row.teacher_email);
        if (sim >= 0.80) {
          candidates.push({
            id: row.id,
            survey_type: row.survey_type,
            participant_type: 'teacher',
            survey_email: row.teacher_email,
            full_name: row.full_name || null,
            similarity: sim,
          });
        }
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ hasSuggestion: false });
    }

    // Sort by highest similarity
    candidates.sort((a, b) => b.similarity - a.similarity);
    const top = candidates[0];

    return NextResponse.json({
      hasSuggestion: true,
      suggestion: {
        id: top.id,
        survey_type: top.survey_type,
        participant_type: top.participant_type,
        survey_email: top.survey_email,
        full_name: top.full_name,
        similarity_percentage: Math.round(top.similarity * 100)
      }
    });
  } catch (err: any) {
    console.error('Error in /api/portal/survey-suggestions:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
