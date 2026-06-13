import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { safeLocalStorage } from '../lib/supabase';
import { UserProfile } from '../types';

interface CustomUser {
  id: string;
  uid: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
  aud?: string;
  role?: string;
  app_metadata?: any;
}

interface AuthContextType {
  user: CustomUser | null;
  userData: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  refreshUserData: () => Promise<void>;
  followingIds: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Setup default peer if not set
  const [peerId, setPeerId] = useState(() => {
    let id = safeLocalStorage.getItem('grix_peer_id');
    if (!id) {
      id = 'peer-' + Math.random().toString(36).substring(2, 9);
      safeLocalStorage.setItem('grix_peer_id', id);
    }
    return id;
  });

  const [peerName, setPeerName] = useState(() => {
    let name = safeLocalStorage.getItem('grix_peer_name');
    if (!name) {
      name = 'GrixPeer_' + Math.floor(1000 + Math.random() * 9000);
      safeLocalStorage.setItem('grix_peer_name', name);
    }
    return name;
  });

  // Re-sync peerName/peerId when local storage changes or is edited
  useEffect(() => {
    const handleStorageUpdate = () => {
      const currentId = safeLocalStorage.getItem('grix_peer_id') || peerId;
      const currentName = safeLocalStorage.getItem('grix_peer_name') || peerName;
      setPeerId(currentId);
      setPeerName(currentName);
    };

    window.addEventListener('p2p_auth_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('p2p_auth_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [peerId, peerName]);

  // Derive Mock Auth User Object
  const user = useMemo<CustomUser>(() => {
    return {
      id: peerId,
      uid: peerId,
      email: `${peerName.toLowerCase().replace(/\s+/g, '')}@grix.local`,
      user_metadata: {
        full_name: peerName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${peerId}`
      },
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {}
    };
  }, [peerId, peerName]);

  // Derive Mock profile details
  const userData = useMemo<UserProfile>(() => {
    return {
      id: peerId,
      uid: peerId,
      email: user.email,
      fullName: peerName,
      username: peerName.toLowerCase().replace(/\s+/g, '_'),
      photoURL: user.user_metadata.avatar_url,
      bio: 'Serverless P2P WebRTC Peer',
      status: 'online',
      followers: [],
      following: [],
      blockedUsers: [],
      privacy: {
        lastSeen: 'everyone',
        profilePhoto: 'everyone',
        about: 'everyone',
        groups: 'everyone'
      },
      settings: {
        notifications: {
          conversationTones: true,
          highPriority: true,
          reactionNotifications: true,
          groupHighPriority: true,
          vibrate: true
        }
      },
      preferences: {
        theme: 'dark',
        fontSize: 'medium'
      }
    };
  }, [peerId, peerName, user]);

  const refreshUserData = async () => {
    // Already reactive
  };

  const authContextValue = useMemo(() => ({
    user,
    userData,
    loading: false,
    isAuthReady: true,
    refreshUserData,
    followingIds: []
  }), [user, userData]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
