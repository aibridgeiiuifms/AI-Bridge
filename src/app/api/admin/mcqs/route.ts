import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

/**
 * Append an entry to the persistent MCQ audit log in system_settings
 */
async function recordMCQAudit(supabase: any, entry: {
  mcq_id: string;
  question_snippet: string;
  action: 'toggle_status' | 'edit_question' | 'create_question' | 'deactivate_question';
  performed_by: string;
  details?: Record<string, any>;
}) {
  try {
    const { data: existing } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'mcq_audit_logs')
      .maybeSingle();

    const logs: any[] = Array.isArray(existing?.value) ? existing.value : [];
    const newEntry = {
      id: crypto.randomUUID(),
      ...entry,
      performed_at: new Date().toISOString(),
    };

    // Keep the most recent 100 entries for fast loading
    const updated = [newEntry, ...logs].slice(0, 100);

    await supabase
      .from('system_settings')
      .upsert({ key: 'mcq_audit_logs', value: updated, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch (err) {
    console.warn('MCQ audit logging warning:', err);
  }
}

/**
 * GET /api/admin/mcqs
 * Allows Admins, Managers, Moderators, and Viewers to search and view questions.
 * If ?audit=true, returns the recent audit trail.
 */
export async function GET(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  // Level 1 Requirement: Must have at least Viewer access
  if (!access.canViewMCQs) {
    return NextResponse.json(
      { success: false, error: 'MCQ Question Pool viewing access is restricted.' },
      { status: 403 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);

    // Return audit logs if requested
    if (searchParams.get('audit') === 'true') {
      const { data: auditRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'mcq_audit_logs')
        .maybeSingle();

      return NextResponse.json({
        success: true,
        audit_logs: Array.isArray(auditRow?.value) ? auditRow.value : [],
      });
    }

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
      user_access_level: access.mcqAccessLevel,
      can_toggle: access.canToggleMCQs,
      can_edit: access.canEditMCQs,
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
 * Create a new question in the mcq_pool.
 * Level 3 Requirement: Only Managers and Admins can create questions.
 */
export async function POST(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  if (!access.canEditMCQs) {
    return NextResponse.json(
      { success: false, error: 'MCQ Manager permission required to add new questions to the pool.' },
      { status: 403 }
    );
  }

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
    const nowIso = new Date().toISOString();

    const basePayload: Record<string, any> = {
      question_text: question_text.trim(),
      options: cleanedOptions,
      correct_option_index: correctIndex,
      explanation: explanation?.trim() || null,
      category: category.trim() || 'General',
      difficulty: ['easy', 'intermediate', 'advanced'].includes(difficulty) ? difficulty : 'intermediate',
      is_active: Boolean(is_active),
    };

    // Attempt insert with audit fields
    let { data: created, error } = await supabase
      .from('mcq_pool')
      .insert({
        ...basePayload,
        last_updated_by: access.userEmail,
        updated_at: nowIso,
      })
      .select()
      .single();

    // Resilient fallback if audit columns don't exist yet
    if (error && (error.message?.includes('last_updated_by') || error.message?.includes('updated_at'))) {
      const fallbackResult = await supabase
        .from('mcq_pool')
        .insert(basePayload)
        .select()
        .single();
      created = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Insert mcq error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Record persistent audit log
    await recordMCQAudit(supabase, {
      mcq_id: created.id,
      question_snippet: question_text.substring(0, 70),
      action: 'create_question',
      performed_by: access.userEmail,
      details: { category, difficulty },
    });

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
 * Update an existing question (or toggle active status).
 * - Toggling status only (is_active) requires Level 2 (Moderator or Manager).
 * - Editing question content requires Level 3 (Manager or Admin).
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

    // Determine if this is purely a status toggle
    const updateKeys = Object.keys(updates);
    const isStatusToggleOnly = updateKeys.length === 1 && updateKeys[0] === 'is_active';

    if (isStatusToggleOnly) {
      // Level 2 Requirement: Moderator or Manager
      if (!access.canToggleMCQs) {
        return NextResponse.json(
          { success: false, error: 'MCQ Moderator or Manager access required to activate/deactivate questions.' },
          { status: 403 }
        );
      }
    } else {
      // Level 3 Requirement: Manager or Admin for content edits
      if (!access.canEditMCQs) {
        return NextResponse.json(
          { success: false, error: 'MCQ Manager access required to modify question content.' },
          { status: 403 }
        );
      }
    }

    const supabase = createAdminClient();
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

    const nowIso = new Date().toISOString();

    // Attempt update with audit tracking fields
    let { data: updated, error } = await supabase
      .from('mcq_pool')
      .update({
        ...updatePayload,
        last_updated_by: access.userEmail,
        updated_at: nowIso,
      })
      .eq('id', id)
      .select()
      .single();

    // Resilient fallback if audit columns don't exist yet
    if (error && (error.message?.includes('last_updated_by') || error.message?.includes('updated_at'))) {
      const fallbackResult = await supabase
        .from('mcq_pool')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      updated = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Update mcq error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Record audit entry
    await recordMCQAudit(supabase, {
      mcq_id: id,
      question_snippet: updated?.question_text ? updated.question_text.substring(0, 70) : id,
      action: isStatusToggleOnly ? 'toggle_status' : 'edit_question',
      performed_by: access.userEmail,
      details: {
        is_active: updated?.is_active,
        modified_fields: updateKeys,
      },
    });

    return NextResponse.json({
      success: true,
      message: isStatusToggleOnly
        ? (updated.is_active ? 'Question activated for quizzes.' : 'Question deactivated safely.')
        : 'Question updated successfully.',
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
 * Safe deactivation requires Level 2 (Moderator).
 * Permanent deletion requires Level 3 (Manager or Admin).
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

    if (permanent) {
      // Level 3 Requirement: Manager only
      if (!access.canEditMCQs) {
        return NextResponse.json({ success: false, error: 'MCQ Manager permission required to permanently delete.' }, { status: 403 });
      }
    } else {
      // Level 2 Requirement: Moderator can deactivate
      if (!access.canToggleMCQs) {
        return NextResponse.json({ success: false, error: 'MCQ Moderator permission required to deactivate questions.' }, { status: 403 });
      }
    }

    const supabase = createAdminClient();

    if (permanent) {
      const { error } = await supabase.from('mcq_pool').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      await recordMCQAudit(supabase, {
        mcq_id: id,
        question_snippet: `Permanent Delete (${id})`,
        action: 'deactivate_question',
        performed_by: access.userEmail,
        details: { permanent: true },
      });

      return NextResponse.json({ success: true, message: 'Question permanently deleted.' });
    } else {
      // Safe deactivation
      const nowIso = new Date().toISOString();
      let { data: deactivated, error } = await supabase
        .from('mcq_pool')
        .update({ is_active: false, last_updated_by: access.userEmail, updated_at: nowIso })
        .eq('id', id)
        .select()
        .single();

      if (error && (error.message?.includes('last_updated_by') || error.message?.includes('updated_at'))) {
        const fallback = await supabase
          .from('mcq_pool')
          .update({ is_active: false })
          .eq('id', id)
          .select()
          .single();
        deactivated = fallback.data;
        error = fallback.error;
      }

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      await recordMCQAudit(supabase, {
        mcq_id: id,
        question_snippet: deactivated?.question_text ? deactivated.question_text.substring(0, 70) : id,
        action: 'deactivate_question',
        performed_by: access.userEmail,
        details: { is_active: false },
      });

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
