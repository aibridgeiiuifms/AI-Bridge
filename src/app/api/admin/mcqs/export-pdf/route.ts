import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';
import { generateMcqPoolPdf } from '@/lib/mcqs/pdf-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/mcqs/export-pdf
 * Exports the active MCQ question bank as an executive, publication-grade PDF document.
 * Suitable for attaching to weekly management reports for Deans and Upper Management.
 *
 * Query Params (Optional):
 * - category: filter to a single category (default: all)
 * - status: 'active' | 'all' (default: 'active')
 */
export async function GET(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  // Level 1 Requirement: Must have at least Viewer access
  if (!access.canViewMCQs) {
    return NextResponse.json(
      { success: false, error: 'MCQ Question Pool viewing access is required to export reports.' },
      { status: 403 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category')?.trim() || '';
    const status = searchParams.get('status')?.trim() || 'active'; // Default active questions

    let query = supabase
      .from('mcq_pool')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: questions, error } = await query;

    if (error || !questions) {
      console.error('Error fetching questions for PDF export:', error);
      return NextResponse.json(
        { success: false, error: error?.message || 'Failed to fetch question pool' },
        { status: 500 }
      );
    }

    // Fetch quiz category configuration for current exam settings
    const { data: configRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'quiz_category_config')
      .maybeSingle();

    const config = configRow?.value || { total_questions: 12, passing_score: 9, cooldown_seconds: 300, categories: [] };

    const pdfBytes = await generateMcqPoolPdf(questions, {
      totalExamQuestions: Number(config.total_questions) || 12,
      passingScore: Number(config.passing_score) || 9,
      generatedBy: access.userEmail,
      categoryDrawConfig: Array.isArray(config.categories) ? config.categories : [],
      cooldownMinutes: Math.round((Number(config.cooldown_seconds) || 300) / 60),
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const safeFilename = `AI_Bridge_Assessment_MCQ_Question_Bank_${dateStr}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('GET /api/admin/mcqs/export-pdf error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error generating MCQ PDF report' },
      { status: 500 }
    );
  }
}
