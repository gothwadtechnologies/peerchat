/**
 * Utility to calculate standard Git blob hashes (SHA-1)
 * matching GitHub's internal commit hashes exactly.
 */

export async function calculateGitHubBlobSha(contentBase64: string): Promise<string> {
  try {
    const binaryString = window.atob(contentBase64);
    const size = binaryString.length;
    const header = `blob ${size}\0`;
    
    // Combine header and content data in standard binary array
    const uint8 = new Uint8Array(header.length + size);
    for (let i = 0; i < header.length; i++) {
      uint8[i] = header.charCodeAt(i);
    }
    for (let i = 0; i < size; i++) {
      uint8[header.length + i] = binaryString.charCodeAt(i);
    }
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', uint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error calculating Git blob SHA-1:', error);
    return '';
  }
}

/**
 * Utility to verify if a file has changes compared to the remote GitHub tree hash
 */
export function isFileModifiedLocally(localSha: string, remoteSha: string | undefined): boolean {
  if (!remoteSha) return true; // file is totally new
  return localSha !== remoteSha;
}
