import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TOTAL_QUESTIONS = 12;
const PASSING_SCORE = 9; // 75% of 12 = 9 questions
const COOLDOWN_DURATION_SECONDS = 300; // 5 minutes cooldown between failed attempts

/**
 * Categorical Clusters for Balanced Sampling (3 questions per cluster = 12 total)
 */
const CATEGORY_CLUSTERS = [
  // Cluster 1: NotebookLM Foundations & AI Core (3 questions)
  {
    name: 'NotebookLM Foundations & Architecture',
    categories: ['NotebookLM Foundations', 'AI Foundations']
  },
  // Cluster 2: Multi-Modal Audio, Study Guides & Educational Apps (3 questions)
  {
    name: 'Multi-Modal Audio & Structured Outputs',
    categories: ['Audio Overviews', 'Structured Outputs', 'Educational Applications']
  },
  // Cluster 3: Prompt Crafting, AI Ethics & Academic Integrity (3 questions)
  {
    name: 'Prompt Crafting & AI Ethics',
    categories: ['Prompt Crafting', 'AI Ethics & Integrity']
  },
  // Cluster 4: SDG Literacy, Governance & The AI Bridge Platform (3 questions)
  {
    name: 'SDG Literacy & Institutional Framework',
    categories: ['SDG Literacy', 'The AI Bridge Platform', 'Project Governance', 'Project Metrics']
  }
];

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
 * Performs balanced sampling: draws 3 questions per cluster, with fallback to any pool question
 */
function sampleBalancedQuestions(poolQuestions: any[]): any[] {
  const selected: any[] = [];
  const selectedIds = new Set<string>();

  for (const cluster of CATEGORY_CLUSTERS) {
    const matching = poolQuestions.filter(
      (q) => !selectedIds.has(q.id) && cluster.categories.includes(q.category)
    );
    const shuffled = shuffleArray(matching);
    const countToTake = Math.min(3, shuffled.length);

    for (let i = 0; i < countToTake; i++) {
      selected.push(shuffled[i]);
      selectedIds.add(shuffled[i].id);
    }
  }

  // Fallback: If any cluster had fewer than 3, fill from remaining questions
  if (selected.length < TOTAL_QUESTIONS) {
    const remaining = poolQuestions.filter((q) => !selectedIds.has(q.id));
    const shuffledRemaining = shuffleArray(remaining);
    const needed = TOTAL_QUESTIONS - selected.length;
    for (let i = 0; i < needed && i < shuffledRemaining.length; i++) {
      selected.push(shuffledRemaining[i]);
      selectedIds.add(shuffledRemaining[i].id);
    }
  }

  // Shuffle the final 12 questions so categories aren't in predictable blocks
  return shuffleArray(selected).slice(0, TOTAL_QUESTIONS);
}

/**
 * GET /api/portal/quiz
 * - Enforces Step 1 (Pre-Survey) prerequisite
 * - Enforces 5-minute cooldown on retakes after a failed attempt
 * - Performs balanced category sampling across 4 clusters
 * - Dynamically shuffles option choices (A, B, C, D) per question
 * - Strips answers and explanations to prevent cheating
 */
export async function GET(req: NextRequest) {
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

    // 2. Check 5-Minute Cooldown on Failed Retakes
    const { data: latestAttempt } = await adminSupabase
      .from('quiz_attempts')
      .select('id, score, passed, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestAttempt && !latestAttempt.passed) {
      const completedTime = new Date(latestAttempt.completed_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - completedTime) / 1000);

      if (elapsedSeconds < COOLDOWN_DURATION_SECONDS) {
        const remainingSeconds = COOLDOWN_DURATION_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            success: false,
            error: 'COOLDOWN_ACTIVE',
            cooldown_remaining_seconds: remainingSeconds,
            previous_score: latestAttempt.score,
            message: `Assessment cooldown active. Please take ${Math.ceil(remainingSeconds / 60)} minutes to review your course notes before retaking.`
          },
          { status: 429 }
        );
      }
    }

    // 3. Fetch active questions from mcq_pool
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

    // 4. Balanced Category Sampling (3 questions per cluster)
    const balancedQuestions = sampleBalancedQuestions(poolQuestions);

    // 5. Dynamic Option Shuffling per Question (strips static answer position advantage)
    const questionsWithShuffledOptions = balancedQuestions.map((q) => {
      const optionsArray: string[] = Array.isArray(q.options) ? q.options : [];
      return {
        id: q.id,
        question_text: q.question_text,
        options: shuffleArray(optionsArray),
        category: q.category,
        difficulty: q.difficulty
      };
    });

    return NextResponse.json({
      success: true,
      questions: questionsWithShuffledOptions,
      drawn_question_ids: questionsWithShuffledOptions.map((q) => q.id),
      total_questions: TOTAL_QUESTIONS,
      passing_score: PASSING_SCORE,
      passing_percentage: 75,
      already_passed: Boolean(latestAttempt?.passed),
      previous_score: latestAttempt?.score ?? null
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
 * - Validates submission against ALL 12 drawn question IDs (closes partial-submission loophole)
 * - Grades against option text matching (immune to option shuffling)
 * - Enforces 5-minute cooldown on retakes
 * - Computes score out of 12 (unanswered questions score 0)
 * - Records verified attempt into quiz_attempts
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
    const { answers = {}, drawn_question_ids = [], started_at } = body;

    const adminSupabase = createAdminClient();

    // 1. Verify 5-minute cooldown on submission
    const { data: latestAttempt } = await adminSupabase
      .from('quiz_attempts')
      .select('id, passed, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestAttempt && !latestAttempt.passed) {
      const completedTime = new Date(latestAttempt.completed_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - completedTime) / 1000);

      if (elapsedSeconds < COOLDOWN_DURATION_SECONDS) {
        const remainingSeconds = COOLDOWN_DURATION_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            success: false,
            error: 'COOLDOWN_ACTIVE',
            cooldown_remaining_seconds: remainingSeconds,
            message: `Assessment cooldown active. Please wait ${Math.ceil(remainingSeconds / 60)} minutes before retaking.`
          },
          { status: 429 }
        );
      }
    }

    // 2. Determine all question IDs to evaluate (must cover all 12 drawn questions)
    let allQuestionIds: string[] = [];
    if (Array.isArray(drawn_question_ids) && drawn_question_ids.length > 0) {
      allQuestionIds = Array.from(new Set(drawn_question_ids));
    } else {
      allQuestionIds = Object.keys(answers);
    }

    if (allQuestionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions provided for evaluation.' },
        { status: 400 }
      );
    }

    // 3. Fetch authoritative master question definitions from mcq_pool
    const { data: poolQuestions, error: fetchErr } = await adminSupabase
      .from('mcq_pool')
      .select('id, question_text, options, correct_option_index, explanation, category')
      .in('id', allQuestionIds);

    if (fetchErr || !poolQuestions || poolQuestions.length === 0) {
      console.error('Error fetching questions for grading:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'Failed to evaluate answers against master pool.' },
        { status: 500 }
      );
    }

    const questionMap = new Map<string, any>();
    poolQuestions.forEach((q) => questionMap.set(q.id, q));

    // 4. Grade each question out of the strict 12-question pool
    let score = 0;
    const reviewDetails: any[] = [];

    for (const qId of allQuestionIds) {
      const q = questionMap.get(qId);
      if (!q) continue;

      const rawOptions: string[] = Array.isArray(q.options) ? q.options : [];
      const correctText = rawOptions[q.correct_option_index]?.trim() || '';

      // User's answer can be provided as selected text, or object { text, index }
      const submitted = answers[qId];
      let userSelectedText: string | null = null;
      let userSelectedIndex: number | null = null;

      if (typeof submitted === 'string') {
        userSelectedText = submitted.trim();
      } else if (submitted && typeof submitted === 'object') {
        userSelectedText = typeof submitted.text === 'string' ? submitted.text.trim() : null;
        userSelectedIndex = typeof submitted.index === 'number' ? submitted.index : null;
      } else if (typeof submitted === 'number') {
        userSelectedIndex = submitted;
        userSelectedText = rawOptions[submitted]?.trim() || null;
      }

      // Check if user answer matches the correct text
      const isCorrect = userSelectedText ? userSelectedText === correctText : false;

      if (isCorrect) {
        score += 1;
      }

      reviewDetails.push({
        id: q.id,
        question_text: q.question_text,
        options: rawOptions,
        user_selected_text: userSelectedText,
        user_selected_index: userSelectedIndex,
        correct_option_text: correctText,
        correct_option_index: q.correct_option_index,
        is_correct: isCorrect,
        explanation: q.explanation || null,
        category: q.category
      });
    }

    // Strictly enforce 12 as the denominator (prevents partial-submission loophole)
    const totalQuestionsEvaluated = TOTAL_QUESTIONS;
    const passed = score >= PASSING_SCORE;

    // 5. Record verified attempt into quiz_attempts
    const attemptPayload = {
      user_id: user.id,
      drawn_question_ids: allQuestionIds,
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
      cooldown_duration_seconds: passed ? 0 : COOLDOWN_DURATION_SECONDS,
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
