import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';

// Import split modular sub-components
import ChatSettingsHeader from './components/ChatSettingsHeader';
import ChatSettingsDetails from './components/ChatSettingsDetails';
import ChatSettingsSharedAssets from './components/ChatSettingsSharedAssets';

export default function ChatSettingsScreen() {
  const { id: receiverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Shared assets state
  const [sharedMedia, setSharedMedia] = useState<string[]>([]);
  const [sharedLinks, setSharedLinks] = useState<{ url: string; title: string }[]>([]);
  const [sharedFiles, setSharedFiles] = useState<{ name: string; size: string; url: string }[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUserId = user?.id;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  useEffect(() => {
    if (!receiverId || !currentUserId || !supabase) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Receiver info
        const { data: recData } = await supabase
          .from('users')
          .select('id, username, full_name, photo_url, bio, settings, email')
          .eq('id', receiverId)
          .single();
        
        if (recData) {
          setReceiver({
            uid: recData.id,
            username: recData.username,
            fullName: recData.full_name,
            photoURL: recData.photo_url,
            bio: recData.bio || 'Hey there! I am using GrixChat.',
            settings: recData.settings,
            phone: recData.settings?.phone || '',
            email: recData.email || ''
          });
        }

        // 2. Fetch User's Settings for this chat
        const { data: settsData } = await supabase
          .from('chat_settings')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('receiver_id', receiverId)
          .single();
        
        if (settsData) {
          setNickname(settsData.nickname || '');
          setCustomPhotoUrl(settsData.custom_photo_url || '');
          setIsMuted(settsData.is_muted || false);
        }

        // 3. Fetch shared conversation data & message assets with robust fallback
        let convId: string | null = null;
        try {
          const { data, error } = await supabase.rpc('get_direct_conversation_id', { 
            u1: currentUserId, 
            u2: receiverId 
          });
          if (!error && data) {
            convId = data;
          }
        } catch (rpcErr) {
          console.warn("RPC direct conversation check failed in settings:", rpcErr);
        }

        // Fallback check if RPC returned null or failed
        if (!convId) {
          try {
            const { data: u1Convs } = await supabase
              .from('conversation_participants')
              .select('conversation_id, conversation:conversations(id, type)')
              .eq('user_id', currentUserId);

            if (u1Convs) {
              const directConvIds = u1Convs
                .filter(item => item.conversation && (item.conversation as any).type === 'direct')
                .map(item => item.conversation_id);

              if (directConvIds.length > 0) {
                const { data: matched } = await supabase
                  .from('conversation_participants')
                  .select('conversation_id')
                  .in('conversation_id', directConvIds)
                  .eq('user_id', receiverId)
                  .limit(1);

                if (matched && matched.length > 0) {
                  convId = matched[0].conversation_id;
                }
              }
            }
          } catch (fallbackErr) {
            console.error("Fallback query for conversation discovery failed:", fallbackErr);
          }
        }
        
        if (convId) {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('text, media_url, media_type, file_url, type, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false });

          if (messagesData) {
            const media: string[] = [];
            const links: { url: string; title: string }[] = [];
            const files: { name: string; size: string; url: string }[] = [];

            messagesData.forEach((m: any) => {
              const rawUrl = m.media_url || m.file_url || m.imageUrl;
              const rawType = m.media_type || m.type;

              if (rawUrl) {
                const lower = rawUrl.toLowerCase();
                const isImage = rawType === 'image' || lower.match(/\.(jpg|jpeg|png|webp|gif|svg)/);
                const isVideo = rawType === 'video' || lower.match(/\.(mp4|mov|webm|avi|mkv|3gp)/);
                
                if (isImage || isVideo) {
                  media.push(rawUrl);
                } else {
                  let fileName = 'Shared Document';
                  try {
                    const rawName = rawUrl.split('/').pop();
                    if (rawName) fileName = decodeURIComponent(rawName);
                  } catch (decErr) {
                    fileName = rawUrl.split('/').pop() || 'Shared Document';
                  }

                  files.push({
                    name: fileName,
                    size: rawType ? rawType.toUpperCase() : 'FILE',
                    url: rawUrl
                  });
                }
              }
              
              if (m.text) {
                const textStr = m.text.trim();
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = textStr.match(urlRegex);
                if (matches) {
                  matches.forEach((url: string) => {
                    links.push({
                      url,
                      title: url.replace(/https?:\/\/(www\.)?/, '').substring(0, 32) + (url.length > 32 ? '...' : '')
                    });
                  });
                }

                if (textStr.match(/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
                  media.push(textStr);
                }
              }
            });

            setSharedMedia(media);
            setSharedLinks(links);
            setSharedFiles(files);
          }
        }
      } catch (err) {
        console.error("Error fetching chat settings detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [receiverId, currentUserId]);

  const updateSettings = async (updates: any) => {
    if (!currentUserId || !receiverId || !supabase) return;
    try {
      const dbUpdates: any = {
        user_id: currentUserId,
        receiver_id: receiverId
      };
      if ('nickname' in updates) dbUpdates.nickname = updates.nickname;
      if ('customPhotoUrl' in updates) dbUpdates.custom_photo_url = updates.customPhotoUrl;
      if ('isMuted' in updates) dbUpdates.is_muted = updates.isMuted;

      const { error } = await supabase
        .from('chat_settings')
        .upsert(dbUpdates, { onConflict: 'user_id,receiver_id' });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleNicknameSave = async () => {
    await updateSettings({ nickname });
    setShowNicknameModal(false);
    showToast("Personal nickname updated!");
  };

  const handlePhotoSave = async () => {
    await updateSettings({ customPhotoUrl });
    setShowPhotoModal(false);
    showToast("Custom profile photo saved!");
  };

  const handleClearHistory = async () => {
    if (!currentUserId || !receiverId || !supabase) return;
    try {
      let convId: string | null = null;
      try {
        const { data } = await supabase.rpc('get_direct_conversation_id', { 
          u1: currentUserId, 
          u2: receiverId 
        });
        if (data) convId = data;
      } catch (_) {}

      if (!convId) {
        const { data: u1Convs } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversation:conversations(id, type)')
          .eq('user_id', currentUserId);

        if (u1Convs) {
          const directConvIds = u1Convs
            .filter(item => item.conversation && (item.conversation as any).type === 'direct')
            .map(item => item.conversation_id);

          if (directConvIds.length > 0) {
            const { data: matched } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .in('conversation_id', directConvIds)
              .eq('user_id', receiverId)
              .limit(1);

            if (matched && matched.length > 0) {
              convId = matched[0].conversation_id;
            }
          }
        }
      }

      if (convId) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', convId);
        
        if (error) throw error;
        setSharedMedia([]);
        setSharedLinks([]);
        setSharedFiles([]);
        showToast("Conversation messages cleared");
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Error clearing chat messages:", err);
      showToast("Failed to clear messages");
    }
  };

  const handleMuteToggle = async () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    await updateSettings({ isMuted: nextMuteState });
    showToast(nextMuteState ? "Notifications Muted" : "Notifications Enabled");
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const displayName = nickname || receiver?.fullName || 'GrixChat User';
  const displayPhoto = customPhotoUrl || receiver?.photoURL || '';
  const phone = receiver?.phone || '';
  const email = receiver?.email || '';

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans relative select-none">
      
      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-xs font-semibold px-4.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-white/5 backdrop-blur-md"
          >
            <Check size={14} className="text-[var(--primary)]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Android Custom Header - centered name only */}
      <ChatSettingsHeader
        displayName={displayName}
        onBack={() => navigate(-1)}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        onSetNickname={() => setShowNicknameModal(true)}
        onSetPhoto={() => setShowPhotoModal(true)}
        onClearHistory={() => setShowDeleteConfirm(true)}
        dropdownRef={dropdownRef}
      />

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 flex flex-col gap-4">
        
        {/* Profile Card and Info Details */}
        <ChatSettingsDetails
          displayName={displayName}
          displayPhoto={displayPhoto}
          username={receiver?.username}
          bio={receiver?.bio}
          phone={phone}
          email={email}
          isMuted={isMuted}
          onPhotoEdit={() => setShowPhotoModal(true)}
          onMessage={() => navigate(`/chat/${receiverId}`)}
          onVoice={() => navigate(`/call/${receiverId}?type=voice`)}
          onVideo={() => navigate(`/call/${receiverId}?type=video`)}
          onMuteToggle={handleMuteToggle}
          onCopyToClipboard={handleCopyToClipboard}
        />

        {/* Shared Media, Links & Files Assets filters */}
        <ChatSettingsSharedAssets
          sharedMedia={sharedMedia}
          sharedFiles={sharedFiles}
          sharedLinks={sharedLinks}
        />

      </div>

      {/* MODAL SHEET SYSTEM */}
      
      {/* 1. Set Nickname Sheet */}
      <AnimatePresence>
        {showNicknameModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-inner"
              onClick={() => setShowNicknameModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 25, stiffness: 350 } }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-t-[24px] sm:rounded-2xl p-6 shadow-2xl border border-[var(--border-color)] pb-safe z-50 text-left"
            >
              <h3 className="text-base font-bold mb-1.5 text-[var(--text-primary)]">Set Chat Nickname</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                This nickname is your personal alias for this contact and keeps direct messaging private.
              </p>
              <input 
                type="text"
                value={nickname || ''}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname..."
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-semibold text-xs text-[var(--text-primary)]"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNicknameModal(false)}
                  className="flex-1 py-3 font-semibold text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-xl active:scale-95 border border-[var(--border-color)] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleNicknameSave}
                  className="flex-1 py-3 font-bold text-white bg-[var(--primary)] rounded-xl shadow-md active:scale-95 text-xs cursor-pointer"
                >
                  Save Alias
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Custom Photo URL Sheet */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-inner"
              onClick={() => setShowPhotoModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 25, stiffness: 350 } }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-t-[24px] sm:rounded-2xl p-6 shadow-2xl border border-[var(--border-color)] pb-safe z-50 text-left"
            >
              <h3 className="text-base font-bold mb-1.5 text-[var(--text-primary)]">Custom Chat Avatar</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                Provide a custom URL to set a designated profile picture for this direct recipient.
              </p>
              <input 
                type="text"
                value={customPhotoUrl || ''}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-medium text-xs text-[var(--text-primary)]"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="flex-1 py-3 font-semibold text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-xl active:scale-95 border border-[var(--border-color)] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handlePhotoSave}
                  className="flex-1 py-3 font-bold text-white bg-[var(--primary)] rounded-xl shadow-md active:scale-95 text-xs cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Confirm Clear History Alert */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 25, stiffness: 350 } }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-t-[24px] sm:rounded-2xl p-6 shadow-2xl border border-[var(--border-color)] text-center pb-safe z-[130]"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-500/5">
                <Trash2 size={22} />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Clear Chat History</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1.5 max-w-xs mx-auto">
                Are you sure you want to delete all messages in this conversation? This operation cannot be undone.
              </p>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 font-semibold text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-xl active:scale-95 border border-[var(--border-color)] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleClearHistory}
                  className="flex-1 py-3 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md active:scale-95 text-xs cursor-pointer"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
