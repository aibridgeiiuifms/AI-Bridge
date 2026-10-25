import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 52428800; // 50MB

const ALLOWED_MIME_PREFIXES = [
  'application/pdf',
  'audio/',
  'video/mp4',
  'video/webm',
  'image/',
];

/**
 * POST /api/portal/resources/upload
 * Securely uploads training files (PDF, Audio, MP4) to the 'training-resources' Supabase bucket.
 * Manager/Admin access required.
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum 50MB limit.' },
        { status: 400 }
      );
    }

    const fileType = file.type || '';
    const isAllowed = ALLOWED_MIME_PREFIXES.some(prefix => fileType.startsWith(prefix)) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.m4a') ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.webp');

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${fileType || file.name}. Allowed: PDF, MP3, WAV, M4A, MP4, PNG, JPG, WEBP.` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Sanitize filename and create storage path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${Date.now()}-${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from('training-resources')
      .upload(storagePath, buffer, {
        contentType: fileType || 'application/octet-stream',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = adminClient.storage
      .from('training-resources')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      publicUrl: publicUrlData.publicUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: fileType,
    });
  } catch (err: any) {
    console.error('Fatal error in POST /api/portal/resources/upload:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
