export type CallType = 'voice' | 'video';

export type CallStatus = 'connecting' | 'ringing' | 'connected' | 'ended' | 'denied' | 'error' | 'offline';

export interface CallRecord {
  id: string;
  otherUserId: string;
  user: string;
  avatar: string;
  type: CallType;
  isIncoming: boolean;
  isMissed: boolean;
  time: string;
}

export interface CallContact {
  id: string;
  username: string;
  fullName: string;
  photoURL: string;
  isOnline: boolean;
}

export interface CallCandidate {
  id: string;
  call_id: string;
  user_id: string;
  candidate: any;
  type: 'offer' | 'answer';
  created_at: string;
}
