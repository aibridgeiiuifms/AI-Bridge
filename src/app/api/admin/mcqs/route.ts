import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

/**
 * Administrative API endpoint for Master MCQ Question Pool Management
 * Allows Admins (and authorized SDG Ambassadors) to search, create, update, and toggle questions.
 */
export async function GET(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const category = searchParams.get('category')?.trim() || '';
    const difficulty = searchParams.get('difficulty')?.trim() || '';
    const status = searchParams.get('status')?.trim() || ''; // 'active', 'inactive', 'all'

    let query = supabase
      .from('mcq_pool')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching mcq_pool:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Client-side text search if provided
    let filtered = questions || [];
    if (search) {
      filtered = filtered.filter((q) => {
        const textMatch = q.question_text?.toLowerCase().includes(search);
        const catMatch = q.category?.toLowerCase().includes(search);
        const optionsMatch = Array.isArray(q.options) && q.options.some((opt: string) => opt.toLowerCase().includes(search));
        return textMatch || catMatch || optionsMatch;
      });
    }

    // Extract distinct categories
    const categoriesSet = new Set<string>();
    (questions || []).forEach((q) => {
      if (q.category) categoriesSet.add(q.category);
    });

    return NextResponse.json({
      success: true,
      mcqs: filtered,
      total_count: (questions || []).length,
      filtered_count: filtered.length,
      categories: Array.from(categoriesSet).sort(),
    });
  } catch (err: any) {
    console.error('GET /api/admin/mcqs error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error fetching MCQs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mcqs
 * Create a new question in the mcq_pool
 */
export async function POST(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const body = await req.json();
    const {
      question_text,
      options,
      correct_option_index,
      explanation = '',
      category = 'NotebookLM Foundations',
      difficulty = 'intermediate',
      is_active = true,
    } = body;

    // Validation
    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      return NextResponse.json({ success: false, error: 'Question text is required.' }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json({ success: false, error: 'Exactly 4 option choices are required.' }, { status: 400 });
    }

    const cleanedOptions = options.map((opt) => String(opt || '').trim());
    if (cleanedOptions.some((opt) => opt.length === 0)) {
      return NextResponse.json({ success: false, error: 'All 4 option choices must have text.' }, { status: 400 });
    }

    const correctIndex = Number(correct_option_index);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return NextResponse.json({ success: false, error: 'Correct option index must be between 0 and 3.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const payload = {
      question_text: question_text.trim(),
      options: cleanedOptions,
      correct_option_index: correctIndex,
      explanation: explanation?.trim() || null,
      category: category.trim() || 'General',
      difficulty: ['easy', 'intermediate', 'advanced'].includes(difficulty) ? difficulty : 'intermediate',
      is_active: Boolean(is_active),
    };

    const { data: created, error } = await supabase
      .from('mcq_pool')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Insert mcq error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question created successfully.',
      mcq: created,
    });
  } catch (err: any) {
    console.error('POST /api/admin/mcqs error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error creating MCQ' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/mcqs
 * Update an existing question (or toggle active status)
 */
export async function PATCH(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Prepare update payload
    const updatePayload: Record<string, any> = {};

    if (updates.is_active !== undefined) {
      updatePayload.is_active = Boolean(updates.is_active);
    }

    if (updates.question_text !== undefined) {
      updatePayload.question_text = String(updates.question_text).trim();
    }

    if (updates.options !== undefined) {
      if (!Array.isArray(updates.options) || updates.options.length !== 4) {
        return NextResponse.json({ success: false, error: 'Exactly 4 option choices are required.' }, { status: 400 });
      }
      updatePayload.options = updates.options.map((opt: string) => String(opt || '').trim());
    }

    if (updates.correct_option_index !== undefined) {
      const idx = Number(updates.correct_option_index);
      if (isNaN(idx) || idx < 0 || idx > 3) {
        return NextResponse.json({ success: false, error: 'Correct option index must be between 0 and 3.' }, { status: 400 });
      }
      updatePayload.correct_option_index = idx;
    }

    if (updates.explanation !== undefined) {
      updatePayload.explanation = updates.explanation ? String(updates.explanation).trim() : null;
    }

    if (updates.category !== undefined) {
      updatePayload.category = String(updates.category).trim() || 'General';
    }

    if (updates.difficulty !== undefined) {
      updatePayload.difficulty = ['easy', 'intermediate', 'advanced'].includes(updates.difficulty)
        ? updates.difficulty
        : 'intermediate';
    }

    const { data: updated, error } = await supabase
      .from('mcq_pool')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update mcq error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully.',
      mcq: updated,
    });
  } catch (err: any) {
    console.error('PATCH /api/admin/mcqs error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error updating MCQ' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/mcqs
 * Safe deactivation of a question (or delete if safe)
 */
export async function DELETE(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (permanent) {
      // Hard delete
      const { error } = await supabase.from('mcq_pool').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Question permanently deleted.' });
    } else {
      // Safe deactivation
      const { error } = await supabase.from('mcq_pool').update({ is_active: false }).eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Question deactivated safely.' });
    }
  } catch (err: any) {
    console.error('DELETE /api/admin/mcqs error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error deleting MCQ' },
      { status: 500 }
    );
  }
}
