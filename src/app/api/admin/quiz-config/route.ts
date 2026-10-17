import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'quiz_category_config';

/**
 * Default configuration mirrors the hardcoded clusters in the quiz route.
 * Used as fallback when no config exists in system_settings.
 */
const DEFAULT_CONFIG = {
  total_questions: 12,
  passing_score: 9,
  cooldown_seconds: 300,
  categories: [
    { category: 'NotebookLM Foundations', count: 1 },
    { category: 'AI Foundations', count: 1 },
    { category: 'Audio Overviews', count: 1 },
    { category: 'Structured Outputs', count: 1 },
    { category: 'Educational Applications', count: 1 },
    { category: 'Prompt Crafting', count: 1 },
    { category: 'AI Ethics & Integrity', count: 1 },
    { category: 'SDG Literacy', count: 1 },
    { category: 'The AI Bridge Platform', count: 1 },
    { category: 'Project Governance', count: 1 },
    { category: 'Project Metrics', count: 1 },
    { category: 'AI Foundations', count: 1 },
  ]
};

/**
 * GET /api/admin/quiz-config
 * Returns the current quiz configuration from system_settings.
 * Falls back to DEFAULT_CONFIG if not set.
 */
export async function GET(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;
    const { role, userId } = access;

    // Check MCQ permission for members
    const adminSupabase = createAdminClient();
    if (role === 'member') {
      const { data: perm } = await adminSupabase
        .from('member_permissions')
        .select('can_manage_mcqs')
        .eq('member_id', userId)
        .maybeSingle();
      if (!perm?.can_manage_mcqs) {
        return NextResponse.json({ success: false, error: 'MCQ management permission required.' }, { status: 403 });
      }
    }

    const { data, error } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch quiz config:', error);
      return NextResponse.json({ success: true, config: DEFAULT_CONFIG, is_default: true });
    }

    const config = data?.value ?? DEFAULT_CONFIG;
    return NextResponse.json({ success: true, config, is_default: !data });
  } catch (err: any) {
    console.error('GET /api/admin/quiz-config error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/quiz-config
 * Saves updated quiz configuration to system_settings (upsert).
 * Validates that category counts sum to total_questions.
 */
export async function POST(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;
    const { role, userId } = access;

    const adminSupabase = createAdminClient();

    // Check MCQ permission for members
    if (role === 'member') {
      const { data: perm } = await adminSupabase
        .from('member_permissions')
        .select('can_manage_mcqs')
        .eq('member_id', userId)
        .maybeSingle();
      if (!perm?.can_manage_mcqs) {
        return NextResponse.json({ success: false, error: 'MCQ management permission required.' }, { status: 403 });
      }
    }


    const body = await req.json();
    const { total_questions, passing_score, cooldown_seconds, categories } = body;

    // Validate
    if (!total_questions || total_questions < 1 || total_questions > 50) {
      return NextResponse.json({ success: false, error: 'Total questions must be between 1 and 50.' }, { status: 400 });
    }
    if (!passing_score || passing_score < 1 || passing_score > total_questions) {
      return NextResponse.json({ success: false, error: 'Passing score must be between 1 and total_questions.' }, { status: 400 });
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one category entry is required.' }, { status: 400 });
    }

    // Validate sum of counts
    const sum = categories.reduce((acc: number, c: any) => acc + (Number(c.count) || 0), 0);
    if (sum !== total_questions) {
      return NextResponse.json({
        success: false,
        error: `Category counts must sum to ${total_questions}. Current sum: ${sum}.`
      }, { status: 400 });
    }

    // Filter out zero-count rows, validate each row
    const cleanCategories = categories
      .filter((c: any) => c.category && Number(c.count) > 0)
      .map((c: any) => ({ category: String(c.category).trim(), count: Number(c.count) }));

    const config = {
      total_questions: Number(total_questions),
      passing_score: Number(passing_score),
      cooldown_seconds: Number(cooldown_seconds) || 300,
      categories: cleanCategories
    };

    const { error: upsertError } = await adminSupabase
      .from('system_settings')
      .upsert({ key: CONFIG_KEY, value: config }, { onConflict: 'key' });

    if (upsertError) {
      console.error('Failed to save quiz config:', upsertError);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    if (err.message?.includes('401') || err.message?.includes('403')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }
    console.error('POST /api/admin/quiz-config error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
