import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateEmailSimilarity } from '@/lib/survey-similarity';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { surveyId, participantType = 'student' } = body;

    if (!surveyId) {
      return NextResponse.json({ error: 'Missing surveyId' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const userEmail = user.email.replace(/\s+/g, '').toLowerCase();
    const targetTable = participantType === 'teacher' ? 'teacher_surveys' : 'student_surveys';
    const emailField = participantType === 'teacher' ? 'teacher_email' : 'student_email';

    // 1. Fetch survey
    const { data: survey, error: fetchErr } = await adminSupabase
      .from(targetTable)
      .select('*')
      .eq('id', surveyId)
      .maybeSingle();

    if (fetchErr || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // 2. If already claimed by another user
    if (survey.user_id && survey.user_id !== user.id) {
      return NextResponse.json({ error: 'This survey is already linked to another account.' }, { status: 409 });
    }

    // 3. Strict Server-Side Similarity Verification (80% threshold)
    const recordedEmail = survey[emailField] || '';
    const similarity = calculateEmailSimilarity(userEmail, recordedEmail);

    if (similarity < 0.80) {
      return NextResponse.json({
        error: 'Security verification failed: Survey email does not match your login email closely enough (minimum 80% similarity required).'
      }, { status: 403 });
    }

    // 4. Link survey to user_id and standardize student_email to user's verified login email
    const updatedAnswers = {
      ...(survey.answers || {}),
      _original_form_email: recordedEmail,
      _linked_at: new Date().toISOString(),
      _similarity_ratio: Math.round(similarity * 100),
    };

    const updatePayload: Record<string, any> = {
      user_id: user.id,
      [emailField]: userEmail, // Standardize to clean verified login email
      answers: updatedAnswers,
      updated_at: new Date().toISOString()
    };

    const { error: updateErr } = await adminSupabase
      .from(targetTable)
      .update(updatePayload)
      .eq('id', surveyId);

    if (updateErr) {
      console.error('Error linking survey:', updateErr);
      return NextResponse.json({ error: 'Failed to update survey link.' }, { status: 500 });
    }



    return NextResponse.json({
      success: true,
      message: 'Survey successfully linked to your account.',
      linkedSurveyId: surveyId
    });
  } catch (err: any) {
    console.error('Error in /api/portal/link-survey:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
