import { supabase } from './supabase';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 */
export async function uploadImage(file: File, bucket: string = 'experiences'): Promise<string | null> {
  try {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large (max 5MB)');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`[Storage] Upload failed for bucket "${bucket}":`, {
        message: uploadError.message,
        path: filePath
      });
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error in uploadImage:', error);
    return null;
  }
}
