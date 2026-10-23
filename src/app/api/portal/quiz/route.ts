import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'quiz_category_config';

/** Fallback constants when no config exists in system_settings */
const DEFAULT_TOTAL_QUESTIONS = 12;
const DEFAULT_PASSING_SCORE = 9;
const DEFAULT_COOLDOWN_SECONDS = 300;

/** Fallback clusters when no DB config found */
const DEFAULT_CATEGORY_CLUSTERS = [
  { name: 'NotebookLM Foundations & Architecture', categories: ['NotebookLM Foundations', 'AI Foundations'], count: 3 },
  { name: 'Multi-Modal Audio & Structured Outputs', categories: ['Audio Overviews', 'Structured Outputs', 'Educational Applications'], count: 3 },
  { name: 'Prompt Crafting & AI Ethics', categories: ['Prompt Crafting', 'AI Ethics & Integrity'], count: 3 },
  { name: 'SDG Literacy & Institutional Framework', categories: ['SDG Literacy', 'The AI Bridge Platform', 'Project Governance', 'Project Metrics'], count: 3 }
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
 * Performs dynamic category-based sampling.
 * categoryConfig: array of { category, count } — one entry per category, with how many to draw.
 * Falls back to remaining pool questions if a category has fewer than configured.
 */
function sampleBalancedQuestions(
  poolQuestions: any[],
  categoryConfig: { category: string; count: number }[],
  totalQuestions: number
): any[] {
  const selected: any[] = [];
  const selectedIds = new Set<string>();

  for (const entry of categoryConfig) {
    const needed = Number(entry.count) || 0;
    if (needed <= 0) continue;
    const matching = poolQuestions.filter(
      (q) => !selectedIds.has(q.id) && q.category === entry.category
    );
    const shuffled = shuffleArray(matching);
    const countToTake = Math.min(needed, shuffled.length);
    for (let i = 0; i < countToTake; i++) {
      selected.push(shuffled[i]);
      selectedIds.add(shuffled[i].id);
    }
  }

  // Fallback: if any category was short, fill from remaining active pool
  if (selected.length < totalQuestions) {
    const remaining = poolQuestions.filter((q) => !selectedIds.has(q.id));
    const shuffledRemaining = shuffleArray(remaining);
    const needed = totalQuestions - selected.length;
    for (let i = 0; i < needed && i < shuffledRemaining.length; i++) {
      selected.push(shuffledRemaining[i]);
      selectedIds.add(shuffledRemaining[i].id);
    }
  }

  // Final shuffle so category order is not predictable
  return shuffleArray(selected).slice(0, totalQuestions);
}

/**
 * GET /api/portal/quiz
 * - Fetches quiz configuration from system_settings (quiz_category_config), falls back to defaults
 * - Enforces Step 1 (Pre-Survey) prerequisite
 * - Enforces cooldown on retakes after a failed attempt
 * - Performs per-category question sampling per admin configuration
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

    // 0. Fetch dynamic quiz configuration from system_settings (with fallback)
    let TOTAL_QUESTIONS = DEFAULT_TOTAL_QUESTIONS;
    let PASSING_SCORE = DEFAULT_PASSING_SCORE;
    let COOLDOWN_DURATION_SECONDS = DEFAULT_COOLDOWN_SECONDS;
    let categoryConfig: { category: string; count: number }[];

    try {
      const { data: configRow } = await adminSupabase
        .from('system_settings')
        .select('value')
        .eq('key', CONFIG_KEY)
        .maybeSingle();

      if (configRow?.value) {
        const cfg = configRow.value as any;
        if (cfg.total_questions) TOTAL_QUESTIONS = Number(cfg.total_questions);
        if (cfg.passing_score) PASSING_SCORE = Number(cfg.passing_score);
        if (cfg.cooldown_seconds) COOLDOWN_DURATION_SECONDS = Number(cfg.cooldown_seconds);
        if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
          categoryConfig = cfg.categories.map((c: any) => ({
            category: String(c.category),
            count: Number(c.count) || 0
          }));
        } else {
          // Build flat config from default clusters
          categoryConfig = DEFAULT_CATEGORY_CLUSTERS.flatMap((cl) =>
            cl.categories.map((cat, i) => ({ category: cat, count: i === 0 ? cl.count : 0 }))
          ).filter((e) => e.count > 0);
        }
      } else {
        // Build flat config from default clusters
        categoryConfig = DEFAULT_CATEGORY_CLUSTERS.flatMap((cl) =>
          cl.categories.map((cat, i) => ({ category: cat, count: i === 0 ? cl.count : 0 }))
        ).filter((e) => e.count > 0);
      }
    } catch {
      categoryConfig = DEFAULT_CATEGORY_CLUSTERS.flatMap((cl) =>
        cl.categories.map((cat, i) => ({ category: cat, count: i === 0 ? cl.count : 0 }))
      ).filter((e) => e.count > 0);
    }

    // 1. Verify User Has Completed Step 1 (Pre-Survey)
    let hasPre = false;

    // Check student_surveys table using authenticated client (fallback to admin client)
    const dbClient = supabase || adminSupabase;
    const { data: preStudent } = await dbClient
      .from('student_surveys')
      .select('id')
      .or(`user_id.eq.${user.id},student_email.ilike.${userEmail}`)
      .eq('survey_type', 'pre')
      .maybeSingle();

    if (preStudent) {
      hasPre = true;
    } else {
      // Check fallback student answers JSONB
      const { data: preByAnswers } = await dbClient
        .from('student_surveys')
        .select('id')
        .filter('answers->>Student Email Address', 'ilike', userEmail)
        .eq('survey_type', 'pre')
        .maybeSingle();

      if (preByAnswers) {
        hasPre = true;
      } else {
        // Check teacher_surveys table
        const { data: preTeacher } = await dbClient
          .from('teacher_surveys')
          .select('id')
          .or(`user_id.eq.${user.id},teacher_email.ilike.${userEmail}`)
          .eq('survey_type', 'pre')
          .maybeSingle();

        if (preTeacher) {
          hasPre = true;
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

    // 4. Per-Category Sampling (admin-configured counts per category)
    const balancedQuestions = sampleBalancedQuestions(poolQuestions, categoryConfig, TOTAL_QUESTIONS);

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

    const passingPercentage = TOTAL_QUESTIONS > 0
      ? Math.round((PASSING_SCORE / TOTAL_QUESTIONS) * 100)
      : 75;

    return NextResponse.json({
      success: true,
      questions: questionsWithShuffledOptions,
      drawn_question_ids: questionsWithShuffledOptions.map((q) => q.id),
      total_questions: TOTAL_QUESTIONS,
      passing_score: PASSING_SCORE,
      passing_percentage: passingPercentage,
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

    // 0. Fetch quiz config from system_settings (for cooldown + total questions)
    let TOTAL_QUESTIONS = DEFAULT_TOTAL_QUESTIONS;
    let PASSING_SCORE = DEFAULT_PASSING_SCORE;
    let COOLDOWN_DURATION_SECONDS = DEFAULT_COOLDOWN_SECONDS;
    try {
      const { data: configRow } = await adminSupabase
        .from('system_settings')
        .select('value')
        .eq('key', CONFIG_KEY)
        .maybeSingle();
      if (configRow?.value) {
        const cfg = configRow.value as any;
        if (cfg.total_questions) TOTAL_QUESTIONS = Number(cfg.total_questions);
        if (cfg.passing_score) PASSING_SCORE = Number(cfg.passing_score);
        if (cfg.cooldown_seconds) COOLDOWN_DURATION_SECONDS = Number(cfg.cooldown_seconds);
      }
    } catch { /* use defaults */ }

    // 1. Verify cooldown on submission
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
