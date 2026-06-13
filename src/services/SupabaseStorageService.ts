import { getSupabase } from '../lib/supabase';

/**
 * Service for handling file uploads using Supabase Storage
 */
export const SupabaseStorageService = {
  /**
   * Uploads a file to a Supabase bucket
   * @param file The file object to upload
   * @param bucket The name of the bucket (defaults to 'chat-media')
   * @param folder Optional folder path inside the bucket
   * @returns The public URL of the uploaded file
   */
  uploadFile: async (
    file: File,
    bucket: string = 'chat-media',
    folder: string = 'general'
  ): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }

    // Generate a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    try {
      // 1. Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw error;
    }
  },

  /**
   * Specifically for documents (PDF, APK, ZIP, etc.)
   */
  uploadDocument: async (file: File): Promise<string> => {
    return SupabaseStorageService.uploadFile(file, 'chat-media', 'documents');
  },

  /**
   * Specifically for images
   */
  uploadImage: async (file: File, onProgress?: (progress: number) => void, bucket: string = 'chat-media'): Promise<string> => {
    return SupabaseStorageService.uploadFile(file, bucket, 'images');
  },

  /**
   * Specifically for videos
   */
  uploadVideo: async (file: File, onProgress?: (progress: number) => void, bucket: string = 'chat-media'): Promise<string> => {
    return SupabaseStorageService.uploadFile(file, bucket, 'videos');
  },

  /**
   * Specifically for audio
   */
  uploadAudio: async (file: File | Blob, onProgress?: (progress: number) => void): Promise<string> => {
    const audioFile = file instanceof File ? file : new File([file], `audio_${Date.now()}.webm`, { type: file.type });
    return SupabaseStorageService.uploadFile(audioFile, 'chat-media', 'audio');
  },

  /**
   * Deletes a file from Supabase Storage
   */
  deleteFile: async (filePath: string, bucket: string = 'chat-media'): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase Storage Delete Error:', error);
      throw error;
    }
  }
};
