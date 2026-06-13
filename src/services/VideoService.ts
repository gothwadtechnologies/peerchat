import { SupabaseStorageService } from './SupabaseStorageService';

/**
 * Service for handling video uploads using Supabase Storage
 */

export const VideoService = {
  /**
   * Uploads a video to Supabase Storage
   * @param file The video file to upload
   * @param onProgress Callback for upload progress
   * @returns The public URL of the uploaded video
   */
  uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      if (onProgress) onProgress(20);
      const url = await SupabaseStorageService.uploadVideo(file, onProgress);
      if (onProgress) onProgress(100);
      return url;
    } catch (error) {
      console.error('Supabase video upload error:', error);
      throw error;
    }
  },

  /**
   * Fallback (still concepts related to uploads but now using Supabase)
   */
  uploadViaProxy: async (file: File): Promise<string> => {
    return VideoService.uploadVideo(file);
  }
};
