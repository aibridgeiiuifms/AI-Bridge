import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TOTAL_QUESTIONS = 12;
const PASSING_SCORE = 9; // 75% of 12 = 9 questions

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * GET /api/portal/quiz
 * Fetches 12 randomly sampled active questions from mcq_pool.
 * Strips correct_option_index and explanation so students cannot inspect and cheat.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access the assessment.' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();
    const userEmail = (user.email || '').trim().toLowerCase();

    // 1. Verify User Has Completed Step 1 (Pre-Survey)
    let hasPre = false;

    // Check student_surveys table
    const { data: preStudent } = await adminSupabase
      .from('student_surveys')
      .select('id')
      .or(`user_id.eq.${user.id},student_email.ilike.${userEmail}`)
      .eq('survey_type', 'pre')
      .maybeSingle();

    if (preStudent) {
      hasPre = true;
    } else {
      // Check fallback student answers JSONB
      const { data: preByAnswers } = await adminSupabase
        .from('student_surveys')
        .select('id')
        .filter('answers->>Student Email Address', 'ilike', userEmail)
        .eq('survey_type', 'pre')
        .maybeSingle();

      if (preByAnswers) {
        hasPre = true;
      } else {
        // Check teacher_surveys table
        const { data: preTeacher } = await adminSupabase
          .from('teacher_surveys')
          .select('id')
          .or(`user_id.eq.${user.id},teacher_email.ilike.${userEmail}`)
          .eq('survey_type', 'pre')
          .maybeSingle();

        if (preTeacher) {
          hasPre = true;
        } else {
          // Check legacy surveys table
          const { data: legacyPre } = await adminSupabase
            .from('surveys')
            .select('id')
            .or(`user_id.eq.${user.id},respondent_email.ilike.${userEmail}`)
            .eq('survey_type', 'pre')
            .maybeSingle();

          if (legacyPre) hasPre = true;
        }
      }
    }

    if (!hasPre) {
      return NextResponse.json(
        {
          success: false,
          error: 'PRE_SURVEY_REQUIRED',
          message: 'You must complete Step 1 (Pre-Training Assessment Survey) before attempting this exam.'
        },
        { status: 403 }
      );
    }

    // 2. Check if user already passed
    const { data: existingAttempt } = await adminSupabase
      .from('quiz_attempts')
      .select('id, score, passed, completed_at')
      .eq('user_id', user.id)
      .eq('passed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch active questions from mcq_pool (EXCLUDING correct_option_index and explanation)
    const { data: poolQuestions, error: poolError } = await adminSupabase
      .from('mcq_pool')
      .select('id, question_text, options, category, difficulty')
      .eq('is_active', true);

    if (poolError || !poolQuestions || poolQuestions.length === 0) {
      console.error('Failed to load MCQ pool:', poolError);
      return NextResponse.json(
        { success: false, error: 'Questions pool is temporarily unavailable. Please try again in a moment.' },
        { status: 500 }
      );
    }

    // 4. Randomly sample 12 questions
    const shuffled = shuffleArray(poolQuestions);
    const selectedQuestions = shuffled.slice(0, TOTAL_QUESTIONS);

    return NextResponse.json({
      success: true,
      questions: selectedQuestions,
      total_questions: selectedQuestions.length,
      passing_score: PASSING_SCORE,
      passing_percentage: 75,
      already_passed: Boolean(existingAttempt?.passed),
      previous_score: existingAttempt?.score ?? null
    });
  } catch (err: any) {
    console.error('GET /api/portal/quiz error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while fetching quiz.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/quiz
 * Grades the submitted answers securely on the server against mcq_pool.
 * Records the attempt into quiz_attempts and returns verified pass/fail results.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to submit quiz.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { answers, started_at } = body;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No answers provided for evaluation.' },
        { status: 400 }
      );
    }

    const questionIds = Object.keys(answers);
    const adminSupabase = createAdminClient();

    // Fetch correct options and explanations for the submitted question IDs
    const { data: poolQuestions, error: fetchErr } = await adminSupabase
      .from('mcq_pool')
      .select('id, question_text, options, correct_option_index, explanation, category')
      .in('id', questionIds);

    if (fetchErr || !poolQuestions) {
      console.error('Error fetching questions for grading:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'Failed to evaluate answers against master pool.' },
        { status: 500 }
      );
    }

    // Build question map
    const questionMap = new Map<string, any>();
    poolQuestions.forEach((q) => questionMap.set(q.id, q));

    // Grade each question
    let score = 0;
    const reviewDetails: any[] = [];

    for (const qId of questionIds) {
      const q = questionMap.get(qId);
      if (!q) continue;

      const userSelectedIndex = answers[qId];
      const isCorrect = userSelectedIndex === q.correct_option_index;

      if (isCorrect) {
        score += 1;
      }

      reviewDetails.push({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        user_selected_index: userSelectedIndex,
        correct_option_index: q.correct_option_index,
        is_correct: isCorrect,
        explanation: q.explanation || null,
        category: q.category
      });
    }

    const totalQuestionsEvaluated = questionIds.length;
    const passed = score >= PASSING_SCORE;

    // Record into quiz_attempts
    const attemptPayload = {
      user_id: user.id,
      drawn_question_ids: questionIds,
      user_answers: answers,
      score: score,
      total_questions: totalQuestionsEvaluated,
      passing_score: PASSING_SCORE,
      passed: passed,
      started_at: started_at || new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    const { data: savedAttempt, error: insertErr } = await adminSupabase
      .from('quiz_attempts')
      .insert(attemptPayload)
      .select('id, score, total_questions, passing_score, passed, completed_at')
      .single();

    if (insertErr) {
      console.error('Failed to save quiz attempt:', insertErr);
      return NextResponse.json(
        { success: false, error: 'Failed to record quiz results in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt_id: savedAttempt.id,
      score: score,
      total_questions: totalQuestionsEvaluated,
      passing_score: PASSING_SCORE,
      percentage: Math.round((score / totalQuestionsEvaluated) * 100),
      passed: passed,
      review: reviewDetails,
      message: passed
        ? `Congratulations! You scored ${score}/${totalQuestionsEvaluated} (>= 75%) and successfully passed the course assessment!`
        : `You scored ${score}/${totalQuestionsEvaluated}. A minimum score of ${PASSING_SCORE}/${totalQuestionsEvaluated} (75%) is required to pass.`
    });
  } catch (err: any) {
    console.error('POST /api/portal/quiz error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while grading quiz.' },
      { status: 500 }
    );
  }
}
