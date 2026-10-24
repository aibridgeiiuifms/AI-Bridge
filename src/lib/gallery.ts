import { createClient } from '@/lib/supabase/client';
import { compressImageToMaxKB } from '@/lib/imageCompression';
import { 
  GalleryFolder, 
  GalleryFolderWithEvents, 
  GalleryEvent, 
  GalleryEventWithPictures, 
  GalleryPicture,
  GalleryPictureWithTags, 
  TaggedMemberInfo 
} from '@/types/database';

// ============================================================================
// Static sample content retained for design previews; public gallery queries use Supabase only.
// ============================================================================
export const SEED_GALLERY_FOLDERS: GalleryFolderWithEvents[] = [
  {
    id: 'seed-folder-1',
    title: 'The AI Bridge Campus Launch & Awareness',
    slug: 'campus-awareness-drive',
    description: 'Initial institutional rollout across Central Library & Faculty of Management Sciences at IIUI. Raising awareness on source-grounded AI.',
    thumbnail_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    display_order: 1,
    is_published: true,
    is_archived: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    events_count: 1,
    events: [
      {
        id: 'seed-event-1',
        folder_id: 'seed-folder-1',
        title: 'Launch & Campus Awareness Drive at Central Library',
        slug: 'library-fms-launch',
        location: 'Central Library & Faculty of Management Sciences, IIUI',
        event_date: '2026-10-05',
        is_date_visible: true,
        description_markdown: `Official initiation of **The AI Bridge** under the *Hum Hain Pakistan SDG Youth Campaign*. 

### Key Highlights
- Distributing awareness flyers and introducing **NotebookLM** capabilities to undergraduate and postgraduate scholars.
- Launching the baseline **pre-assessment survey** across departments.
- Demonstrating source grounding, instant citation verification, and academic integrity protocols.`,
        external_links: [
          { label: 'Campaign Announcement', url: 'https://iiu.edu.pk' },
          { label: 'SDG Youth Portal', url: 'https://sdgs.un.org' }
        ],
        display_order: 1,
        is_published: true,
        is_archived: false,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pictures: [
          {
            id: 'seed-pic-1',
            event_id: 'seed-event-1',
            image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-1.webp',
            caption: 'Opening briefing outside IIUI Central Library with campus ambassadors.',
            display_order: 1,
            is_cover: true,
            created_at: new Date().toISOString(),
            tags: []
          },
          {
            id: 'seed-pic-2',
            event_id: 'seed-event-1',
            image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-2.webp',
            caption: 'Interactive student walkthrough of source-grounded research assistants.',
            display_order: 2,
            is_cover: false,
            created_at: new Date().toISOString(),
            tags: []
          },
          {
            id: 'seed-pic-3',
            event_id: 'seed-event-1',
            image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-3.webp',
            caption: 'Field ambassadors engaging faculty members on campus boulevard.',
            display_order: 3,
            is_cover: false,
            created_at: new Date().toISOString(),
            tags: []
          }
        ]
      }
    ]
  },
  {
    id: 'seed-folder-2',
    title: 'Faculty Hands-On Workshops Series',
    slug: 'faculty-workshops',
    description: 'Intensive practical training sessions for non-IT educators from Sharia & Law, Usuluddin, and Social Sciences.',
    thumbnail_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    display_order: 2,
    is_published: true,
    is_archived: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    events_count: 1,
    events: [
      {
        id: 'seed-event-2',
        folder_id: 'seed-folder-2',
        title: 'NotebookLM for Non-IT Educators Workshop',
        slug: 'notebooklm-fms-workshop',
        location: 'FMS Executive Seminar Hall, IIUI',
        event_date: '2026-10-08',
        is_date_visible: true,
        description_markdown: `Intensive practical training session led by departmental leadership and master trainers.

### Focus Areas
1. **Source Grounding**: Uploading institutional syllabi and course readings without hallucinations.
2. **Audio Overviews**: Generating deep-dive podcast discussions to support student retention.
3. **Automated Study Guides**: Curating multi-perspective assessments for non-computing disciplines.`,
        external_links: [
          { label: 'Workshop Slides & Guide', url: 'https://notebooklm.google.com' }
        ],
        display_order: 1,
        is_published: true,
        is_archived: false,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pictures: [
          {
            id: 'seed-pic-4',
            event_id: 'seed-event-2',
            image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-4.webp',
            caption: 'Faculty members interacting with source synthesis prompts in FMS Seminar Hall.',
            display_order: 1,
            is_cover: true,
            created_at: new Date().toISOString(),
            tags: []
          },
          {
            id: 'seed-pic-5',
            event_id: 'seed-event-2',
            image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-5.webp',
            caption: 'Dr. Abdul Zahid Khan addressing educators during practical training module.',
            display_order: 2,
            is_cover: false,
            created_at: new Date().toISOString(),
            tags: []
          }
        ]
      }
    ]
  },
  {
    id: 'seed-folder-3',
    title: 'Institutional SDG Walk & National Gala',
    slug: 'national-sdg-gala',
    description: 'Showcasing digital verification, student certificate verification, and final impact analytics to university leadership.',
    thumbnail_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    display_order: 3,
    is_published: true,
    is_archived: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    events_count: 1,
    events: [
      {
        id: 'seed-event-3',
        folder_id: 'seed-folder-3',
        title: 'Institutional SDG Walk & Live Verification Stall',
        slug: 'sdg-walk-demo-stall',
        location: 'IIUI Main Boulevard & National SDG Gala Venue',
        event_date: '2026-11-15',
        is_date_visible: false, // Intentionally hidden as requested by spec!
        description_markdown: `Showcasing **The AI Bridge** digital platform, real-time QR verification of student certificates, and final analytical impact report to university leadership and national campaign evaluators.

> *"Equipping non-technical disciplines with grounded AI bridges the digital divide and accelerates SDG 4 (Quality Education) and SDG 10 (Reduced Inequalities)."*`,
        external_links: [
          { label: 'Live Verification Demo', url: '/verify' }
        ],
        display_order: 1,
        is_published: true,
        is_archived: false,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pictures: [
          {
            id: 'seed-pic-6',
            event_id: 'seed-event-3',
            image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
            storage_path: 'seed/pic-6.webp',
            caption: 'Live demonstration of dynamic QR-coded certificates to university leadership.',
            display_order: 1,
            is_cover: true,
            created_at: new Date().toISOString(),
            tags: []
          }
        ]
      }
    ]
  }
];

// ============================================================================
// Storage & Image Upload
// ============================================================================

/**
 * Uploads an image to Supabase Storage bucket 'event-gallery' after client-side compression.
 */
export async function uploadGalleryImage(file: File, folderPrefix: string = 'events'): Promise<{ publicUrl: string; storagePath: string }> {
  // Compress to max 450 KB and 1600px width/height for optimal web delivery
  const compressed = await compressImageToMaxKB(file, 450, 1600);
  
  const supabase = createClient();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  const storagePath = `${folderPrefix}/${timestamp}_${random}_${cleanName.replace(/\.[^/.]+$/, '')}.webp`;

  const { data, error } = await supabase.storage
    .from('event-gallery')
    .upload(storagePath, compressed, {
      cacheControl: '31536000',
      upsert: true,
      contentType: 'image/webp'
    });

  if (error) {
    throw new Error(`Failed to upload to event-gallery: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('event-gallery')
    .getPublicUrl(storagePath);

  return {
    publicUrl: publicUrlData.publicUrl,
    storagePath
  };
}

// ============================================================================
// Public Queries
// ============================================================================

/**
 * Fetches all published, non-archived folders for the `/events` landing page.
 */
export async function fetchPublishedFolders(): Promise<GalleryFolderWithEvents[]> {
  const supabase = createClient();
  const { data: folders, error } = await supabase
    .from('gallery_folders')
    .select('*, gallery_events(id)')
    .eq('is_published', true)
    .eq('is_archived', false)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (folders || []).map((f: any) => ({
    ...f,
    events_count: f.gallery_events ? f.gallery_events.length : 0
  }));
}

/**
 * Fetches a single folder by slug with its events, pictures, and tagged members.
 */
export async function fetchFolderWithEventsBySlug(slug: string): Promise<GalleryFolderWithEvents | null> {
  const supabase = createClient();
  const { data: folder, error: folderErr } = await supabase
    .from('gallery_folders')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_archived', false)
    .maybeSingle();

  if (folderErr) throw folderErr;
  if (!folder) return null;

  const { data: events, error: eventsErr } = await supabase
    .from('gallery_events')
    .select(`
      *,
      pictures:gallery_pictures(
        *,
        tags:gallery_picture_tags(
          id,
          member:members(id, full_name, avatar_url, designation, team_tag)
        )
      )
    `)
    .eq('folder_id', folder.id)
    .eq('is_published', true)
    .eq('is_archived', false)
    .order('display_order', { ascending: true });

  if (eventsErr) throw eventsErr;

  const formattedEvents: GalleryEventWithPictures[] = (events || []).map((evt: any) => {
    const rawPics = Array.isArray(evt.pictures) ? evt.pictures : [];
    rawPics.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    return {
      ...evt,
      pictures: rawPics
    };
  });

  return {
    ...folder,
    events_count: formattedEvents.length,
    events: formattedEvents
  };
}

/**
 * Fetches team members list for the photo tagging selector.
 */
export async function fetchTeamMembersForTagging(): Promise<TaggedMemberInfo[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, avatar_url, designation, team_tag')
      .eq('is_published', true)
      .order('position_order', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Error fetching members for tagging:', err);
    return [];
  }
}

// ============================================================================
// Admin & Manager CRUD Operations
// ============================================================================

export async function adminFetchAllFolders(): Promise<GalleryFolder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_folders')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function adminCreateFolder(folder: Partial<GalleryFolder>): Promise<GalleryFolder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_folders')
    .insert([folder])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateFolder(id: string, updates: Partial<GalleryFolder>): Promise<GalleryFolder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_folders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adminArchiveFolder(id: string, isArchived: boolean = true): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('gallery_folders')
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function adminFetchEventsByFolder(folderId: string): Promise<GalleryEventWithPictures[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_events')
    .select(`
      *,
      pictures:gallery_pictures(
        *,
        tags:gallery_picture_tags(
          id,
          member:members(id, full_name, avatar_url, designation, team_tag)
        )
      )
    `)
    .eq('folder_id', folderId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map((evt: any) => {
    const rawPics = Array.isArray(evt.pictures) ? evt.pictures : [];
    rawPics.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    return {
      ...evt,
      pictures: rawPics
    };
  });
}

export async function adminCreateEvent(event: Partial<GalleryEvent>): Promise<GalleryEvent> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateEvent(id: string, updates: Partial<GalleryEvent>): Promise<GalleryEvent> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gallery_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adminArchiveEvent(id: string, isArchived: boolean = true): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('gallery_events')
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function adminAddPicture(
  eventId: string, 
  imageUrl: string, 
  storagePath: string, 
  caption: string | null = null,
  isCover: boolean = false,
  displayOrder: number = 0,
  taggedMemberIds: string[] = []
): Promise<GalleryPicture> {
  const supabase = createClient();

  // If this is set as cover, unset other covers in this event
  if (isCover) {
    await supabase
      .from('gallery_pictures')
      .update({ is_cover: false })
      .eq('event_id', eventId);
  }

  const { data: picture, error } = await supabase
    .from('gallery_pictures')
    .insert([{
      event_id: eventId,
      image_url: imageUrl,
      storage_path: storagePath,
      caption,
      is_cover: isCover,
      display_order: displayOrder
    }])
    .select()
    .single();

  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from('event-gallery')
      .remove([storagePath]);
    if (cleanupError) {
      throw new Error(`Failed to save uploaded image: ${error.message}. Uploaded file cleanup also failed: ${cleanupError.message}`);
    }
    throw error;
  }

  // Add tags if provided
  if (taggedMemberIds.length > 0) {
    const tagRows = taggedMemberIds.map(memberId => ({
      picture_id: picture.id,
      member_id: memberId
    }));

    await supabase
      .from('gallery_picture_tags')
      .insert(tagRows);
  }

  return picture;
}

export async function adminUpdatePicture(id: string, updates: Partial<GalleryPicture>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('gallery_pictures')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function adminSetPictureCover(pictureId: string, eventId: string): Promise<void> {
  const supabase = createClient();
  // Unset all in event
  await supabase
    .from('gallery_pictures')
    .update({ is_cover: false })
    .eq('event_id', eventId);

  // Set selected
  const { error } = await supabase
    .from('gallery_pictures')
    .update({ is_cover: true })
    .eq('id', pictureId);

  if (error) throw error;
}

export async function adminReorderPictures(pictureIdsInOrder: string[]): Promise<void> {
  const supabase = createClient();
  const promises = pictureIdsInOrder.map((id, index) => 
    supabase
      .from('gallery_pictures')
      .update({ display_order: index })
      .eq('id', id)
  );
  await Promise.all(promises);
}

export async function adminDeletePicture(pictureId: string, storagePath?: string): Promise<void> {
  const supabase = createClient();
  
  // 1. Delete DB record (picture_tags cascade automatically via DB FK)
  const { error } = await supabase
    .from('gallery_pictures')
    .delete()
    .eq('id', pictureId);

  if (error) throw error;

  // 2. Delete storage file if path provided
  if (storagePath) {
    await supabase.storage
      .from('event-gallery')
      .remove([storagePath]);
  }
}

export async function adminSetPictureTags(pictureId: string, memberIds: string[]): Promise<void> {
  const supabase = createClient();

  // 1. Delete existing tags for picture
  await supabase
    .from('gallery_picture_tags')
    .delete()
    .eq('picture_id', pictureId);

  // 2. Insert new tags
  if (memberIds.length > 0) {
    const rows = memberIds.map(mid => ({
      picture_id: pictureId,
      member_id: mid
    }));
    const { error } = await supabase
      .from('gallery_picture_tags')
      .insert(rows);

    if (error) throw error;
  }
}
