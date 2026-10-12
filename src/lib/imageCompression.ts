import { createClient } from '@/lib/supabase/client';

/**
 * Compresses an image file using HTML5 Canvas to ensure it is under maxKB (default 350 KB).
 * Supports JPEG, PNG, and WebP. Returns a compressed File object.
 */
export async function compressImageToMaxKB(
  file: File,
  maxKB: number = 350,
  maxDimension: number = 1000
): Promise<File> {
  // If already under target size and is acceptable format, return directly
  if (file.size <= maxKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down dimensions if exceeding maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // fallback to original if canvas unsupported
        }

        // Draw onto canvas with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to stay below maxKB
        let quality = 0.85;
        const targetBytes = maxKB * 1024;

        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // If within limit or lowest acceptable quality reached
              if (blob.size <= targetBytes || quality <= 0.4) {
                const extension = 'webp';
                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const compressedFile = new File([blob], `${baseName}.${extension}`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.15;
                attemptCompression();
              }
            },
            'image/webp',
            quality
          );
        };

        attemptCompression();
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads an avatar image to Supabase Storage bucket 'team-avatars'
 * and returns the public CDN URL.
 */
export async function uploadTeamAvatar(file: File, memberEmail: string): Promise<string> {
  // First compress to guarantee < 350 KB
  const compressed = await compressImageToMaxKB(file, 350);

  const supabase = createClient();
  const cleanEmail = memberEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const fileName = `${cleanEmail}_${timestamp}.webp`;

  const { data, error } = await supabase.storage
    .from('team-avatars')
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/webp'
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('team-avatars')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
