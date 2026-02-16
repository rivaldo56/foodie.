import { supabase } from './supabase';

/**
 * Converts a File to a Base64 string for direct database storage.
 * This is used instead of cloud storage as per user requirement.
 */
export async function uploadImage(file: File, bucket: string = 'images'): Promise<string | null> {
  try {
    // Check file size (recommend limit for base64 to avoid DB bloat)
    if (file.size > 2 * 1024 * 1024) {
      console.error('File too large for database storage (max 2MB)');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        console.error('Base64 conversion error:', error);
        reject(null);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Unexpected error in uploadImage:', error);
    return null;
  }
}
