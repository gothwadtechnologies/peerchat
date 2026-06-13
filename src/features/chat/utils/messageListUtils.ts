export const getStatusString = (msg: any): string => {
  if (msg.status === 'sending') {
    return 'Sending...';
  }

  const isRead = msg.is_read;
  const rawTime = isRead ? (msg.updated_at || msg.created_at) : msg.created_at;
  if (!rawTime) return isRead ? 'Seen' : 'Sent';

  let dateVal: Date;
  try {
    dateVal = new Date(rawTime);
    if (isNaN(dateVal.getTime())) {
      return isRead ? 'Seen' : 'Sent';
    }
  } catch (e) {
    return isRead ? 'Seen' : 'Sent';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateVal.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);

  const prefix = isRead ? 'Seen' : 'Sent';

  if (diffSec < 60) {
    return `${prefix} Just now`;
  } else if (diffMin === 1) {
    return `${prefix} 1m ago`;
  } else if (diffMin === 2) {
    return `${prefix} 2m ago`;
  } else if (diffMin === 3) {
    return `${prefix} 3m ago`;
  } else if (diffMin === 4) {
    return `${prefix} 4m ago`;
  } else if (diffMin === 5) {
    return `${prefix} 5m ago`;
  } else {
    return `${prefix} long time ago`;
  }
};
