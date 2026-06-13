import React, { useState, useCallback } from 'react';
import { Loader2, MessageCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageBubble } from './MessageBubble';
import { useAuth } from '../../../providers/AuthProvider.tsx';

const getGroupDateLabel = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
};

interface MessageListProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  chatBackground: string | undefined;
  loadingMore: boolean;
  loading: boolean;
  messages: any[];
  messageLimit: number;
  convType: 'direct' | 'group';
  receiver: any;
  activeMessageMenu: any;
  setActiveMessageMenu: (msg: any) => void;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  showReactionPicker: any;
  setShowReactionPicker: (msg: any) => void;
  receiverStatus: string;
  handleMessageTap: (e: any, msg: any) => void;
  performReactToMessage: (id: string, emoji: string) => void;
  isOtherTyping: boolean;
  selectedMsgIds?: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
  scrollContainerRef,
  messagesEndRef,
  handleScroll,
  chatBackground,
  loadingMore,
  loading,
  messages,
  messageLimit,
  convType,
  receiver,
  activeMessageMenu,
  setActiveMessageMenu,
  replyingTo,
  setReplyingTo,
  showReactionPicker,
  setShowReactionPicker,
  receiverStatus,
  handleMessageTap,
  performReactToMessage,
  isOtherTyping,
  selectedMsgIds = []
}) => {
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const { user } = useAuth();

  const onJumpToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      
      // Vibrate on jump
      if (window.navigator.vibrate) try { window.navigator.vibrate(15); } catch(e){}

      // Clear highlight after animation
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    } else {
      console.warn("Message element not found to jump to:", messageId);
    }
  }, [scrollContainerRef]);

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 relative no-scrollbar touch-pan-y w-full max-w-full ${chatBackground || 'bg-[var(--bg-main)]'}`} 
      onClick={() => { setActiveMessageMenu(null); }}
    >
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}></div>
      
      <div className="relative z-10 flex flex-col gap-1 w-full max-w-full overflow-hidden">
        {loadingMore && (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 size={20} className="text-[var(--primary)] animate-spin" />
            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest">Loading older messages...</p>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em] animate-pulse">Loading Messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageCircle size={32} className="text-[var(--primary)]/40" />
            </div>
            <p className="text-sm font-bold text-zinc-500">No messages yet</p>
            <p className="text-[11px] text-zinc-400 mt-1">Say hi to start the conversation!</p>
          </div>
        ) : (() => {
          // Use all messages or limit if specified
          const currentMessages = messageLimit > 0 ? messages.slice(-messageLimit) : messages;
          
          // Deduplicate messages on the fly to prevent any runtime dupe-key issues under high network concurrency
          const seenIds = new Set<string>();
          const uniqueMessages = currentMessages.filter(msg => {
            if (!msg || !msg.id) return false;
            if (seenIds.has(msg.id)) return false;
            seenIds.add(msg.id);
            return true;
          });

          let lastDateLabel = '';
          const items: React.ReactNode[] = [];

          // Add encryption banner at the very beginning of messages list
          items.push(
            <div key="e2ee-banner" className="mx-auto my-4 max-w-[300px] bg-amber-500/[0.04] dark:bg-amber-500/[0.02] border border-amber-500/15 dark:border-amber-500/10 rounded-2xl p-3 text-center text-[10.5px] text-amber-800/90 dark:text-amber-200/80 shadow-sm flex flex-col items-center gap-1 select-none animate-fadeIn">
              <div className="flex items-center gap-1.5 font-semibold tracking-wide text-amber-700 dark:text-amber-300/90">
                <Lock size={12} className="text-amber-600/90 dark:text-amber-400/80" />
                <span>Messages are end-to-end encrypted</span>
              </div>
              <p className="text-[9.5px] leading-relaxed text-amber-700/75 dark:text-amber-400/60 font-medium">
                No one outside of this chat, not even Grixchat, can read or listen to them.
              </p>
            </div>
          );

          uniqueMessages.forEach((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = index > 0 ? uniqueMessages[index - 1] : null;
            const isSameSender = prevMsg?.sender_id === msg.sender_id;

            const dateLabel = getGroupDateLabel(msg.created_at);
            const showDateSeparator = dateLabel !== lastDateLabel;
            lastDateLabel = dateLabel;

            if (showDateSeparator && dateLabel) {
              items.push(
                <div key={`date-sep-${dateLabel}-${index}`} className="flex justify-center my-3 select-none">
                  <div className="bg-[var(--bg-card)]/90 backdrop-blur-sm border border-[var(--border-color)]/30 text-[10px] text-[var(--text-secondary)] px-3 py-1 rounded-full shadow-sm font-semibold tracking-wide uppercase">
                    {dateLabel}
                  </div>
                </div>
              );
            }

            items.push(
              <MessageBubble 
                key={msg.id}
                msg={msg}
                isMe={isMe}
                isSameSender={isSameSender}
                convType={convType}
                receiver={receiver}
                activeMessageMenu={activeMessageMenu}
                setActiveMessageMenu={setActiveMessageMenu}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                showReactionPicker={showReactionPicker}
                setShowReactionPicker={setShowReactionPicker}
                receiverStatus={receiverStatus}
                handleMessageTap={handleMessageTap}
                performReactToMessage={performReactToMessage}
                onJumpToMessage={onJumpToMessage}
                isHighlighted={highlightedMessageId === msg.id}
                isLatestMessage={index === currentMessages.length - 1}
                isSelected={selectedMsgIds.includes(msg.id)}
                allMessages={uniqueMessages}
              />
            );
          });

          return items;
        })()}
        
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start mt-2 mb-4"
            >
              <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 border border-zinc-100">
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
                </div>
                <span className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">Typing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
