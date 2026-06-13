
/**
 * Safely converts a potential Firestore timestamp (or other date formats) to a JavaScript Date object.
 * Handles Firestore Timestamp objects, plain objects with seconds/nanoseconds, 
 * Date objects, numbers (ms), and ISO strings.
 */
export function toDate(timestamp: any): Date | null {
  if (!timestamp) return null;

  // 1. Firestore Timestamp object
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // 2. Plain object with seconds/nanoseconds (e.g., from localStorage/cache)
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }

  // 3. JavaScript Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // 4. Number (milliseconds)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  // 5. String (ISO date)
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Formats a timestamp into a human-readable 12-hour time string with AM/PM (e.g., "01:19 PM").
 */
export function formatTime(timestamp: any): string {
  const date = toDate(timestamp);
  if (!date) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = hours < 10 ? '0' + hours : hours;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Formats a timestamp into a human-readable last seen string.
 */
export function formatLastSeen(timestamp: any): string {
  const date = toDate(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `last seen at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } else if (isYesterday) {
    return 'last seen at Yesterday';
  } else {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-GB', options); // e.g., "1 Oct 2024"
    return `last seen at ${formattedDate}`;
  }
}
