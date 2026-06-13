/**
 * Truncates a string to a maximum number of characters.
 */
export function truncateToChars(text: string, maxChars: number = 100): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

/**
 * Returns the length of a string.
 */
export function countChars(text: string): number {
  if (!text) return 0;
  return text.length;
}

