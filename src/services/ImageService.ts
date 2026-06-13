/**
 * ImageService handles image uploads to ImgBB.
 * This is used as an alternative to Firebase Storage.
 */

import { SupabaseStorageService } from './SupabaseStorageService';

export class ImageService {
  /**
   * Uploads an image file to Supabase Storage and returns the public URL.
   * @param file The image file to upload.
   * @param onProgress Callback for upload progress.
   * @returns The public URL of the uploaded image.
   */
  static async uploadImage(
    file: File, 
    onProgress?: (progress: number) => void,
    bucket: string = 'chat-media'
  ): Promise<string> {
    try {
      if (onProgress) onProgress(20);
      const url = await SupabaseStorageService.uploadImage(file, onProgress, bucket);
      if (onProgress) onProgress(100);
      return url;
    } catch (error) {
      console.error("Supabase Image Upload Error:", error);
      throw error;
    }
  }

  /**
   * Fallback to server proxy for image upload (still kept but redirects to Supabase conceptually)
   */
  static async uploadViaProxy(file: File, onProgress?: (progress: number) => void, bucket: string = 'chat-media'): Promise<string> {
    return this.uploadImage(file, onProgress, bucket);
  }

  /**
   * Converts a base64 string or data URL to a File object.
   */
  static dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
}
