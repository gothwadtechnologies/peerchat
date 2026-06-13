import { SupabaseStorageService } from './SupabaseStorageService';

/**
 * Service for handling audio uploads using Supabase Storage
 */

export const AudioService = {
  /**
   * Uploads an audio file to Supabase Storage
   * @param file The audio file to upload
   * @param onProgress Callback for upload progress
   * @returns The public URL of the uploaded audio
   */
  uploadAudio: async (file: File | Blob, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      if (onProgress) onProgress(20);
      const url = await SupabaseStorageService.uploadAudio(file, onProgress);
      if (onProgress) onProgress(100);
      return url;
    } catch (error) {
      console.error('Supabase audio upload error:', error);
      throw error;
    }
  },

  /**
   * Fallback (still concepts related to uploads but now using Supabase)
   */
  uploadViaProxy: async (file: File | Blob): Promise<string> => {
    return AudioService.uploadAudio(file);
  }
};
