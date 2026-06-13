/**
 * Service for interacting with Gofile.io API
 * Documentation: https://gofile.io/api
 */

export const GofileService = {
  /**
   * Uploads a file to Catbox.moe via our server proxy
   * @param file The file to upload
   * @returns The direct download link for the uploaded file
   */
  uploadFile: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Server returned non-JSON response:', responseText);
        throw new Error(`Server error: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      if (!data.downloadUrl) {
        throw new Error('Upload successful but no download URL returned');
      }
      
      return data.downloadUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
};
