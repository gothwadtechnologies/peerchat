/**
 * Utility to determine if a user is truly online based on both is_online value
 * and the last_seen heartbeat timestamp.
 * 
 * Scalably keeps users in offline status if they closed the PWA/browser,
 * since database status might remain stuck if the browser closed abruptly.
 */
export function isUserOnline(isOnline: boolean | undefined | null, lastSeenStr: string | undefined | null): boolean {
  if (!isOnline) return false;
  if (!lastSeenStr) return false;
  
  try {
    const lastSeenDate = new Date(lastSeenStr);
    const now = new Date();
    // Allow a 2.5 minutes buffer (150 seconds / 150000 ms)
    // because GrixChat's active client heartbeats every 60 seconds
    const diffMs = now.getTime() - lastSeenDate.getTime();
    return diffMs < 150000;
  } catch (_) {
    return false;
  }
}

/**
 * Formats a user's relative idle time into a professional active status label
 */
export function formatLastSeen(isOnline: boolean | undefined | null, lastSeenStr: string | undefined | null): string {
  const online = isUserOnline(isOnline, lastSeenStr);
  if (online) return 'Online';
  if (!lastSeenStr) return 'Offline';
  
  try {
    const lastSeenDate = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    
    if (diffMs < 0) return 'Online'; // Catch potential timezone offsets
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Active just now';
    if (minutes < 60) return `Active ${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Active yesterday';
    return `Active ${days}d ago`;
  } catch (_) {
    return 'Offline';
  }
}
