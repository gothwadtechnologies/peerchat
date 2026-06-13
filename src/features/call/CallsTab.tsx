import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { CallsHistoryList } from './components/CallsHistoryList';
import { CallsContactsList } from './components/CallsContactsList';
import { LocalDataCache } from '../../services/LocalDataCache';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreVertical, 
  History, 
  PhoneMissed, 
  Users, 
  LogIn, 
  Video, 
  PhoneCall 
} from 'lucide-react';

// Modular Call Module elements
import { StatusFilterOption } from './components/CallsQuickActions';
import { CommonSearchBar } from '../../components/common/CommonSearchBar';
import { MeetingView } from './components/MeetingView';
import { JoinView } from './components/JoinView';

export default function CallsTab() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  
  // Instant load calls history from Cache
  const [calls, setCalls] = useState<any[]>(() => {
    if (authUser?.id) {
      const cached = LocalDataCache.get<any[]>(`gx_calls_history_${authUser.id}`);
      if (cached && Array.isArray(cached)) return cached;
    }
    return [];
  });
  
  const [callsLoading, setCallsLoading] = useState(() => {
    if (authUser?.id) {
      const cached = LocalDataCache.get<any[]>(`gx_calls_history_${authUser.id}`);
      if (cached && Array.isArray(cached) && cached.length > 0) return false;
    }
    return true;
  });

  // Instant load contacts from Cache
  const [contacts, setContacts] = useState<any[]>(() => {
    if (authUser?.id) {
      const cached = LocalDataCache.get<any[]>(`gx_calls_contacts_${authUser.id}`);
      if (cached && Array.isArray(cached)) return cached;
    }
    return [];
  });

  const [contactsLoading, setContactsLoading] = useState(() => {
    if (authUser?.id) {
      const cached = LocalDataCache.get<any[]>(`gx_calls_contacts_${authUser.id}`);
      if (cached && Array.isArray(cached) && cached.length > 0) return false;
    }
    return true;
  });

  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);

  // Keep references to current calls and contacts to prevent state-reset loop
  const callsRef = useRef(calls);
  const contactsRef = useRef(contacts);

  useEffect(() => {
    callsRef.current = calls;
  }, [calls]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(() => {
    try {
      return (localStorage.getItem('grixchat-calls-filter') as StatusFilterOption) || 'calls';
    } catch (e) {
      return ((window as any).__fallbackStorage?.['grixchat-calls-filter'] as StatusFilterOption) || 'calls';
    }
  });
  const [meetingCopied, setMeetingCopied] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.filter) {
        setStatusFilter(customEvent.detail.filter as StatusFilterOption);
        setSearchTerm('');
      }
    };

    const handleCreateMeeting = () => {
      handleOpenMeeting();
    };

    window.addEventListener('calls-tab-filter-change', handleFilterChange);
    window.addEventListener('calls-tab-create-meeting', handleCreateMeeting);

    return () => {
      window.removeEventListener('calls-tab-filter-change', handleFilterChange);
      window.removeEventListener('calls-tab-create-meeting', handleCreateMeeting);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state with Cache when authUser becomes resolved to eliminate blinking/white flashes
  useEffect(() => {
    if (authUser?.id) {
      const cachedCalls = LocalDataCache.get<any[]>(`gx_calls_history_${authUser.id}`);
      if (cachedCalls && Array.isArray(cachedCalls) && cachedCalls.length > 0) {
        setCalls(cachedCalls);
        setCallsLoading(false);
      }
      const cachedContacts = LocalDataCache.get<any[]>(`gx_calls_contacts_${authUser.id}`);
      if (cachedContacts && Array.isArray(cachedContacts) && cachedContacts.length > 0) {
        setContacts(cachedContacts);
        setContactsLoading(false);
      }
    }
  }, [authUser?.id]);

  const authUserZone = () => {
    return authUser && authUser.id;
  };

  const handleOpenMeeting = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(`GRX-MEET-${randomSuffix}`);
    setJoinCode('');
    setMeetingCopied(false);
    setStatusFilter('meeting');
  };

  const handleCopyMeetingLink = (code: string) => {
    const link = `https://grixchat.com/call/room-${code.toLowerCase()}?type=video`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setMeetingCopied(true);
        setTimeout(() => setMeetingCopied(false), 2000);
      }).catch(() => {
        setMeetingCopied(true);
        setTimeout(() => setMeetingCopied(false), 2000);
      });
    } else {
      setMeetingCopied(true);
      setTimeout(() => setMeetingCopied(false), 2000);
    }
  };

  const handleJoinMeeting = (input: string) => {
    if (!input.trim()) return;
    
    let code = input.trim();
    // Support parsing path if full URL is pasted
    if (code.includes('/call/')) {
      const parts = code.split('/call/');
      const afterCall = parts[parts.length - 1];
      code = afterCall.split('?')[0]; // strip query parameters
    } else if (code.includes('?')) {
      code = code.split('?')[0];
    }
    
    const cleanCode = code.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    navigate(`/call/${cleanCode}?type=video`);
  };

  const fetchCalls = React.useCallback(async () => {
    if (!authUser?.id || !supabase) return;
    try {
      const cached = LocalDataCache.get<any[]>(`gx_calls_history_${authUser.id}`);
      const currentCalls = callsRef.current;
      const hasData = (currentCalls && currentCalls.length > 0) || (cached && cached.length > 0);
      
      if (isPaginating) {
        setLoadingMore(true);
      } else if (limit === 15) {
        if (!hasData) {
          setCallsLoading(true);
        }
      }

      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:users!calls_caller_id_fkey (id, username, photo_url, full_name),
          receiver:users!calls_receiver_id_fkey (id, username, photo_url, full_name)
        `)
        .or(`caller_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (!error && data) {
        let hasMoreData = false;
        let queryData = data || [];
        if (queryData.length > limit) {
          hasMoreData = true;
          queryData = queryData.slice(0, limit);
        }
        setHasMore(hasMoreData);

        const callList = queryData.map((c: any) => {
          const isCaller = c.caller_id === authUser.id;
          const otherUser = isCaller ? c.receiver : c.caller;
          
          return {
            id: c.id,
            otherUserId: isCaller ? c.receiver_id : c.caller_id,
            user: otherUser?.full_name || otherUser?.username || 'GrixChat User',
            avatar: otherUser?.photo_url || `https://cdn-icons-png.flaticon.com/512/149/149071.png`,
            type: c.type === 'audio' ? 'voice' : c.type,
            isIncoming: !isCaller,
            isMissed: c.is_missed || false,
            time: c.created_at ? new Date(c.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'
          };
        });
        setCalls(callList);
        LocalDataCache.set(`gx_calls_history_${authUser.id}`, callList);
      }
    } catch (e) {
      console.error("Error fetching calls:", e);
    } finally {
      setCallsLoading(false);
      setLoadingMore(false);
      setIsPaginating(false);
    }
  }, [authUser?.id, limit, isPaginating]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrollable = target.scrollHeight > target.clientHeight;
    // Safer threshold: scrolling within 100px of bottom
    const closeToBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 100;
    if (isScrollable && target.scrollTop > 5 && closeToBottom) {
      if (hasMore && !loadingMore && !callsLoading && statusFilter !== 'contacts') {
        setIsPaginating(true);
        setLimit(prev => prev + 15);
      }
    }
  };

  const fetchContacts = React.useCallback(async () => {
    if (!authUserZone() || !supabase) return;
    try {
      const cached = LocalDataCache.get<any[]>(`gx_calls_contacts_${authUser?.id}`);
      const currentContacts = contactsRef.current;
      const hasData = (currentContacts && currentContacts.length > 0) || (cached && cached.length > 0);
      if (!hasData) {
        setContactsLoading(true);
      }
      
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${authUser?.id},following_id.eq.${authUser?.id}`);
      
      if (followError) throw followError;

      const IFollow = new Set<string>();
      const FollowsMe = new Set<string>();

      followRows?.forEach((row: any) => {
        if (row.follower_id === authUser?.id) {
          IFollow.add(row.following_id);
        }
        if (row.following_id === authUser?.id) {
          FollowsMe.add(row.follower_id);
        }
      });

      const mutualIds = Array.from(IFollow).filter(id => FollowsMe.has(id));
      
      if (mutualIds.length > 0) {
        const { data: friendsData, error: friendsError } = await supabase
          .from('users')
          .select('id, username, full_name, photo_url, is_online, last_seen')
          .in('id', mutualIds)
          .limit(100);
        
        if (friendsError) throw friendsError;

        if (friendsData) {
          const formatted = friendsData.map(f => {
            const lastSeen = f.last_seen;
            const isOnline = !!(f.is_online && lastSeen && (new Date().getTime() - new Date(lastSeen).getTime()) < 65000);
            return {
              id: f.id,
              username: f.username,
              fullName: f.full_name || f.username,
              photoURL: f.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              isOnline
            };
          });
          setContacts(formatted);
          LocalDataCache.set(`gx_calls_contacts_${authUser?.id}`, formatted);
        }
      } else {
        setContacts([]);
        LocalDataCache.set(`gx_calls_contacts_${authUser?.id}`, []);
      }
    } catch (err) {
      console.error('Error fetching friends contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchCalls();
    fetchContacts();

    if (!supabase || !authUserZone()) return;

    const channel = supabase
      .channel('calls-updates-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls',
        filter: `caller_id=eq.${authUser?.id}`
      }, () => fetchCalls())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls',
        filter: `receiver_id=eq.${authUser?.id}`
      }, () => fetchCalls())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [authUser?.id, fetchCalls, fetchContacts]);

  useEffect(() => {
    if (statusFilter === 'contacts') {
      fetchContacts();
    }
  }, [statusFilter, fetchContacts]);

  const startCallDirectly = (userId: string, callType: 'voice' | 'video') => {
    navigate(`/call/${userId}?type=${callType}`);
  };

  const getFilteredCalls = () => {
    let filtered = calls;
    if (statusFilter === 'missed') {
      filtered = calls.filter(c => c.isMissed);
    }
    if (searchTerm) {
      filtered = filtered.filter(c => 
        (c.user || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  return (
    <div 
      className="flex flex-col h-full bg-bg-card font-sans relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      
      {/* 1. Full-Screen Overlay for Meetings */}
      {statusFilter === 'meeting' && (
        <MeetingView 
          roomCode={roomCode}
          meetingCopied={meetingCopied}
          onBack={() => setStatusFilter('calls')}
          onCopy={handleCopyMeetingLink}
          onJoin={handleJoinMeeting}
          onNavigateToJoin={() => {
            setJoinCode('');
            setStatusFilter('join');
          }}
        />
      )}

      {/* 2. Full-Screen Overlay for Join with Link */}
      {statusFilter === 'join' && (
        <JoinView 
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          onBack={() => setStatusFilter('calls')}
          onJoin={handleJoinMeeting}
          onNavigateToCreate={handleOpenMeeting}
        />
      )}

      {/* 3. Base Calls List Layout (Always mounted to prevent unmounting flashes) */}
      <div 
        className="flex-1 flex flex-col min-h-0 bg-bg-card"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-bg-card"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Search bar inside scroll viewport */}
          <CommonSearchBar 
            placeholder={statusFilter === 'contacts' ? "Search contact name..." : "Search calls..."}
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
          />

          {/* List display area */}
          <div className="mt-1">
            {statusFilter === 'contacts' ? (
              <CallsContactsList 
                contacts={contacts} 
                loading={contactsLoading} 
                onCall={startCallDirectly} 
                searchTerm={searchTerm}
              />
            ) : (
              <>
                <CallsHistoryList 
                  calls={getFilteredCalls()} 
                  loading={callsLoading} 
                  onCall={startCallDirectly} 
                  onReset={fetchCalls}
                />
                {loadingMore && (
                  <div className="flex items-center justify-center py-4 gap-2 bg-[var(--bg-card)]">
                    <div className="w-4 h-4 border-2 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin" />
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Loading more calls...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
