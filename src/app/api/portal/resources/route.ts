import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';
import { TrainingResource, TrainingResourceType } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/resources
 * Fetches learning materials.
 * - Public / students: returns all active resources + current user's watched IDs.
 * - Admin mode (?admin=true): requires manager access and returns all resources (including inactive).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdminView = searchParams.get('admin') === 'true';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If admin view requested, verify manager access
    if (isAdminView) {
      const access = await requireAmbassadorPortalAccess();
      if (access instanceof NextResponse) return access;
      if (access.role !== 'admin' && !access.canManageResources) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Resource management permission required.' },
          { status: 403 }
        );
      }
    }

    const adminClient = createAdminClient();

    let query = adminClient
      .from('training_resources')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!isAdminView) {
      query = query.eq('is_active', true);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('Error fetching training resources:', error);
      return NextResponse.json({ success: true, resources: [], watchedIds: [], modules: [] });
    }

    // Fetch watched IDs for the current user if logged in
    let watchedIds: string[] = [];
    if (user?.id) {
      const { data: progressRows } = await adminClient
        .from('student_resource_progress')
        .select('resource_id')
        .eq('student_id', user.id);

      if (progressRows) {
        watchedIds = progressRows.map((p) => p.resource_id);
      }
    }

    // Extract distinct modules in order
    const modulesSet = new Set<string>();
    (resources || []).forEach((r) => {
      if (r.module) modulesSet.add(r.module);
    });

    return NextResponse.json({
      success: true,
      resources: resources || [],
      watchedIds,
      modules: Array.from(modulesSet),
    });
  } catch (err: any) {
    console.error('Fatal error in GET /api/portal/resources:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/resources
 * Creates a new learning resource.
 * Admin / Resource Manager only.
 */
export async function POST(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;

    if (access.role !== 'admin' && !access.canManageResources) {
      return NextResponse.json(
        { success: false, error: 'Resource management permission required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description = '',
      module,
      type,
      url,
      storage_path = null,
      thumbnail_url = null,
      file_size_bytes = null,
      sort_order = 0,
      is_active = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Resource title is required.' },
        { status: 400 }
      );
    }

    if (!module || !module.trim()) {
      return NextResponse.json(
        { success: false, error: 'Module/Topic name is required.' },
        { status: 400 }
      );
    }

    const validTypes: TrainingResourceType[] = ['pdf', 'video', 'link', 'audio'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Resource URL or file is required.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: created, error } = await adminClient
      .from('training_resources')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        module: module.trim(),
        type,
        url: url.trim(),
        storage_path: storage_path || null,
        thumbnail_url: thumbnail_url ? thumbnail_url.trim() : null,
        file_size_bytes: file_size_bytes ? Number(file_size_bytes) : null,
        sort_order: Number(sort_order) || 0,
        is_active: Boolean(is_active),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create training resource:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, resource: created });
  } catch (err: any) {
    console.error('Fatal error in POST /api/portal/resources:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portal/resources
 * Updates an existing learning resource.
 * Admin / Resource Manager only.
 */
export async function PUT(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;

    if (access.role !== 'admin' && !access.canManageResources) {
      return NextResponse.json(
        { success: false, error: 'Resource management permission required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required.' },
        { status: 400 }
      );
    }

    const payload: Partial<TrainingResource> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.module !== undefined) payload.module = updates.module.trim();
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.url !== undefined) payload.url = updates.url.trim();
    if (updates.storage_path !== undefined) payload.storage_path = updates.storage_path || null;
    if (updates.thumbnail_url !== undefined) payload.thumbnail_url = updates.thumbnail_url ? updates.thumbnail_url.trim() : null;
    if (updates.file_size_bytes !== undefined) payload.file_size_bytes = updates.file_size_bytes ? Number(updates.file_size_bytes) : null;
    if (updates.sort_order !== undefined) payload.sort_order = Number(updates.sort_order);
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);

    const adminClient = createAdminClient();
    const { data: updated, error } = await adminClient
      .from('training_resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update training resource:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, resource: updated });
  } catch (err: any) {
    console.error('Fatal error in PUT /api/portal/resources:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/resources
 * Deletes a learning resource and cleans up storage if uploaded.
 * Admin / Resource Manager only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;

    if (access.role !== 'admin' && !access.canManageResources) {
      return NextResponse.json(
        { success: false, error: 'Resource management permission required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if resource has storage_path to clean up
    const { data: resource } = await adminClient
      .from('training_resources')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();

    if (resource?.storage_path) {
      try {
        await adminClient.storage
          .from('training-resources')
          .remove([resource.storage_path]);
      } catch (cleanErr) {
        console.warn('Storage cleanup warning:', cleanErr);
      }
    }

    const { error } = await adminClient
      .from('training_resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete training resource:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Resource deleted successfully.' });
  } catch (err: any) {
    console.error('Fatal error in DELETE /api/portal/resources:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
