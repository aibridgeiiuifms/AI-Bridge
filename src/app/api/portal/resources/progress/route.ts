import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/portal/resources/progress
 * Toggles "watched" / "completed" state for a training resource.
 * Safe for authenticated students.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to track progress.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { resource_id } = body;

    if (!resource_id) {
      return NextResponse.json(
        { success: false, error: 'resource_id is required.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if already watched
    const { data: existing } = await adminClient
      .from('student_resource_progress')
      .select('id')
      .eq('student_id', user.id)
      .eq('resource_id', resource_id)
      .maybeSingle();

    if (existing) {
      // Unmark (delete)
      await adminClient
        .from('student_resource_progress')
        .delete()
        .eq('id', existing.id);

      return NextResponse.json({
        success: true,
        watched: false,
        resource_id,
        message: 'Marked as unwatched.',
      });
    } else {
      // Mark as watched (insert)
      const { data: inserted, error: insertErr } = await adminClient
        .from('student_resource_progress')
        .insert({
          student_id: user.id,
          resource_id: resource_id,
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        watched: true,
        resource_id,
        watched_at: inserted.watched_at,
        message: 'Marked as watched.',
      });
    }
  } catch (err: any) {
    console.error('Fatal error in POST /api/portal/resources/progress:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
