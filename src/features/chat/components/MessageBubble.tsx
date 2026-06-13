import React from 'react';
import { motion, useMotionValue, AnimatePresence, useTransform } from 'motion/react';
import { 
  CornerUpRight,
  ChevronsRight,
  CheckCheck,
  Clock,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { formatTime } from '../../../utils/dateUtils.ts';
import { storage } from '../../../services/StorageService.ts';
import { isUserOnline } from '../../../utils/presence';
import { ChatMessageReactions } from '../../../components/ChatUIComponents';

// Modular split files
import { SystemMessage } from './message-bubble/SystemMessage';
import { ReplyHeader } from './message-bubble/ReplyHeader';
import { MessageMedia } from './message-bubble/MessageMedia';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  isSameSender: boolean;
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
  onJumpToMessage?: (messageId: string) => void;
  isHighlighted?: boolean;
  isLatestMessage?: boolean;
  isSelected?: boolean;
  allMessages?: any[];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isMe,
  isSameSender,
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
  onJumpToMessage,
  isHighlighted,
  isLatestMessage,
  isSelected,
  allMessages
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const x = useMotionValue(0);
  const [swipeActive, setSwipeActive] = React.useState(false);
  const hasVibratedRef = React.useRef(false);

  const replyIconOpacity = useTransform(x, [0, 35], [0, 1]);
  const replyIconScale = useTransform(x, [0, 45], [0.55, 1.15]);
  const replyIconRotate = useTransform(x, [0, 45], [-45, 0]);
  const replyIconX = useTransform(x, [0, 45, 75], [-42, 12, 16]);

  React.useEffect(() => {
    if (!x) return;
    const handler = (latestValue: number) => {
      if (latestValue > 42) {
        setSwipeActive(true);
        if (!hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (window.navigator && window.navigator.vibrate) {
            try { window.navigator.vibrate(14); } catch (err) {}
          }
        }
      } else {
        setSwipeActive(false);
        if (latestValue < 5) {
          hasVibratedRef.current = false;
        }
      }
    };
    if (typeof (x as any).on === 'function') {
      return (x as any).on("change", handler);
    } else if (typeof (x as any).onChange === 'function') {
      return (x as any).onChange(handler);
    }
  }, [x]);

  const [tick, setTick] = React.useState(0);

  const bubbleStyleSetting = storage.getItem('app-chat-bubble-style') || 'whatsapp';
  const fontSizeSetting = storage.getItem('app-chat-font-size') || 'medium';

  const contentFontClass = 
    fontSizeSetting === 'small' ? 'text-[12px] leading-relaxed font-normal' :
    fontSizeSetting === 'large' ? 'text-[15.5px] leading-relaxed font-normal' :
    fontSizeSetting === 'extra-large' ? 'text-[17.5px] leading-relaxed font-medium' :
    'text-[14px] leading-snug font-normal'; // medium default is standard visual crispiness

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); // update relative presence or status tick
    return () => clearInterval(timer);
  }, []);

  // Resolve reply reference
  let resolvedReplyTo = msg.reply_to;
  if (resolvedReplyTo) {
    if (typeof resolvedReplyTo === 'string' || typeof resolvedReplyTo === 'number') {
      const parentMsg = allMessages?.find((m: any) => m.id === resolvedReplyTo);
      if (parentMsg) {
        resolvedReplyTo = {
          id: parentMsg.id,
          sender_id: parentMsg.sender_id,
          content: parentMsg.content || parentMsg.text || '',
          text: parentMsg.text || parentMsg.content || '',
          sender: parentMsg.sender,
          media_url: parentMsg.media_url || parentMsg.imageUrl || parentMsg.fileUrl || null,
          media_type: parentMsg.media_type || parentMsg.type || null,
          file_name: parentMsg.file_name || null
        };
      }
    } else if (typeof resolvedReplyTo === 'object') {
      const pUrl = resolvedReplyTo.media_url || resolvedReplyTo.imageUrl || resolvedReplyTo.fileUrl;
      const pType = resolvedReplyTo.media_type || resolvedReplyTo.type;
      resolvedReplyTo = {
        ...resolvedReplyTo,
        media_url: pUrl || null,
        media_type: pType || null,
      };
    }
  }
  
  // Render System message directly
  if (msg.type === 'system' || msg.media_type === 'system') {
    const systemText = msg.text || msg.content || '';
    return <SystemMessage text={systemText} />;
  }

  const rawTextContent = typeof msg.content === 'string' ? msg.content : (msg.text || '');
  const isMsgDeleted = msg.is_deleted === true || rawTextContent.includes('🚫 This message was deleted') || rawTextContent.includes('This message was deleted');

  const mediaUrl = isMsgDeleted ? null : (msg.media_url || msg.imageUrl || msg.fileUrl);
  const mediaType = msg.media_type || msg.type;

  const isForwardedMany = !isMsgDeleted && rawTextContent.startsWith('\u200B[FWD_MANY]\u200B');
  const isForwarded = !isMsgDeleted && (isForwardedMany || rawTextContent.startsWith('\u200B[FWD]\u200B'));
  const cleanRawText = isMsgDeleted 
    ? (isMe ? '🚫 You deleted this message' : '🚫 This message was deleted')
    : rawTextContent
        .replace('\u200B[FWD_MANY]\u200B', '')
        .substring(0) 
        .replace('\u200B[FWD]\u200B', '');
  const isGrixAiMessage = !isMsgDeleted && cleanRawText.startsWith('🤖 Grix AI:');
  const actualIsMe = isGrixAiMessage ? false : isMe;

  // Modern, ios, retro, or classic-style shapes
  let bubbleShapeClass = 'rounded-2xl';
  if (bubbleStyleSetting === 'modern') {
    if (isSameSender) {
      bubbleShapeClass = 'rounded-[18px]';
    } else {
      bubbleShapeClass = actualIsMe ? 'rounded-[18px] rounded-tr-[4px]' : 'rounded-[18px] rounded-tl-[4px]';
    }
  } else if (bubbleStyleSetting === 'ios') {
    if (isSameSender) {
      bubbleShapeClass = 'rounded-[20px]';
    } else {
      bubbleShapeClass = actualIsMe ? 'rounded-[20px] rounded-tr-[5px]' : 'rounded-[20px] rounded-tl-[5px]';
    }
  } else if (bubbleStyleSetting === 'retro') {
    bubbleShapeClass = 'rounded-none border-2 border-[var(--border-color)]';
  } else { 
    if (isSameSender) {
      bubbleShapeClass = 'rounded-xl';
    } else {
      bubbleShapeClass = actualIsMe ? 'rounded-xl rounded-tr-none' : 'rounded-xl rounded-tl-none';
    }
  }

  let renderedContent = cleanRawText;
  if (isGrixAiMessage) {
    renderedContent = cleanRawText.replace(/^🤖 Grix AI:\s*/i, '');
  }

  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0 && !isMsgDeleted;
  const hasReplyHeader = !!resolvedReplyTo;
  const isTextString = typeof renderedContent === 'string';
  const isLongOrMultiLine = isTextString && (renderedContent.length > 55 || renderedContent.includes('\n'));
  const isShortWithReply = hasReplyHeader && isTextString && !isLongOrMultiLine;
  
  // NOTE: Space reduction critical enhancement!
  // We remove '|| hasReplyHeader' from block layout check so that text-only replied messages
  // can use the inline-timestamp layout, preventing giant empty spacer gaps!
  const useBlockFormat = (!!mediaUrl || !isTextString || isLongOrMultiLine) && !isShortWithReply;

  const isReceiverOnlineNow = receiver && isUserOnline(
    receiver.isOnline !== undefined ? receiver.isOnline : receiver.is_online,
    receiver.lastSeen !== undefined ? receiver.lastSeen : receiver.last_seen
  );
  let wasReceiverOnlineAfterMessage = false;
  if (receiver && (receiver.lastSeen || receiver.last_seen)) {
    try {
      const lastSeenTime = new Date(receiver.lastSeen || receiver.last_seen).getTime();
      const msgTime = new Date(msg.created_at).getTime();
      wasReceiverOnlineAfterMessage = lastSeenTime >= msgTime;
    } catch (e) {}
  }
  const isMessageDelivered = isReceiverOnlineNow || wasReceiverOnlineAfterMessage;

  return (
    <div id={`msg-${msg.id}`} className={`flex flex-col w-full max-w-full ${actualIsMe ? 'items-end' : 'items-start'} ${!isSameSender ? 'mt-3.5' : 'mt-0.5'} ${hasReactions ? 'mb-3.5' : 'mb-0.5'} relative transition-all duration-200`}>
      <AnimatePresence>
        {isHighlighted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--primary)] z-0 pointer-events-none"
            style={{ margin: '-2px -16px' }}
          />
        )}
      </AnimatePresence>
      
      <div className={`relative group max-w-[85%] lg:max-w-[70%] min-w-0 flex items-center gap-2 ${isHighlighted ? 'z-10' : ''}`}>
        {!isSameSender && bubbleStyleSetting === 'whatsapp' && (
          <div className={`absolute top-0 w-2 h-2 ${actualIsMe ? '-right-1.5 bg-[var(--bubble-own)]' : '-left-1.5 bg-[var(--bubble-other)]'}`} 
               style={{ clipPath: actualIsMe ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }}>
          </div>
        )}

        {/* Smooth WhatsApp/Telegram sliding background reply indicator */}
        <motion.div 
          style={{ 
            x: replyIconX,
            opacity: replyIconOpacity,
            scale: replyIconScale,
            rotate: replyIconRotate,
          }}
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md pointer-events-none z-0 transition-colors duration-100 ${
            swipeActive 
              ? 'bg-[var(--primary)] text-neutral-900 scale-110 shadow-lg shadow-[var(--primary)]/30 border-none' 
              : 'bg-black/10 dark:bg-zinc-800/80 text-teal-400 border border-white/5'
          }`}
        >
          <CornerUpRight size={13} className={`stroke-[3.2] ${swipeActive ? 'scale-110' : ''}`} />
        </motion.div>

        <motion.div 
          style={{ x }}
          drag="x"
          dragDirectionLock={true}
          dragConstraints={{ left: 0, right: 80 }}
          dragElastic={{ left: 0, right: 0.25 }}
          dragTransition={{ bounceStiffness: 950, bounceDamping: 25 }}
          dragSnapToOrigin
          onDragStart={(e) => {
            e.stopPropagation();
            hasVibratedRef.current = false;
          }}
          onDragEnd={(_, info) => {
            if (swipeActive || info.offset.x > 42) {
              setReplyingTo(msg);
              if (window.navigator && window.navigator.vibrate) {
                try { window.navigator.vibrate(10); } catch(e){}
              }
            }
            setSwipeActive(false);
            hasVibratedRef.current = false;
          }}
          onClick={(e) => {
            if (isMsgDeleted) return;
            handleMessageTap(e as any, msg);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (isMsgDeleted) return;
            handleMessageTap(e as any, msg);
          }}
          whileTap={{ scale: 0.992 }}
          animate={isHighlighted ? { 
            backgroundColor: actualIsMe ? 'var(--bubble-own)' : 'var(--bubble-other)',
            scale: [1, 1.02, 1],
            transition: { duration: 0.5, repeat: 1 }
          } : {}}
          className={`px-3 pt-2 pb-[19px] ${hasReactions ? 'pb-[27px]' : ''} ${resolvedReplyTo ? 'min-w-[190px]' : 'min-w-[70px]'} shadow-sm border border-neutral-800/10 dark:border-white/5 relative cursor-pointer select-none max-w-full overflow-visible touch-pan-y w-fit transition-colors duration-200 ${bubbleShapeClass} ${
            activeMessageMenu?.id === msg.id ? 'z-50 ring-2.5 ring-[var(--primary)]/45 scale-[1.01] shadow-lg' : 'z-10'
          } ${
            actualIsMe 
              ? 'bg-gradient-to-b from-[var(--bubble-own)] to-[var(--bubble-own)]/98 text-[var(--bubble-text-own)] ml-auto border-r-0 font-light' 
              : 'bg-gradient-to-b from-[var(--bubble-other)] to-[var(--bubble-other)]/98 text-[var(--bubble-text-other)] mr-auto border-l-0 font-light'
          } ${isSelected ? 'ring-3 ring-[#0494f4]/80 bg-[#0494f4]/20 scale-[1.02] shadow-cyan-500/10' : ''} hover:brightness-[1.02]`}
        >
          {isForwardedMany ? (
            <p className="text-[9px] text-sky-400 font-extrabold italic mb-1 flex items-center gap-1 select-none tracking-wide">
              <ChevronsRight size={10} className="text-sky-400" />
              <span>Forwarded many times</span>
            </p>
          ) : isForwarded ? (
            <p className="text-[9px] text-zinc-400 font-bold italic mb-0.5 flex items-center gap-1 select-none tracking-wide">
              <CornerUpRight size={10} className="text-zinc-400" />
              <span>Forwarded</span>
            </p>
          ) : null}

          {isGrixAiMessage && (
            <div className="flex items-center gap-1 mb-1 py-0.5 px-1.5 bg-indigo-500/15 border border-indigo-500/25 rounded text-[8px] font-black text-indigo-400 uppercase tracking-wider leading-none w-fit select-none">
              <span className="relative flex h-1 w-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1 w-1 bg-indigo-500"></span>
              </span>
              🤖 Grix AI Verified
            </div>
          )}

          {convType === 'group' && !actualIsMe && !isSameSender && !isGrixAiMessage && (
            <p className="text-[9.5px] font-extrabold text-rose-500 mb-0.5 uppercase tracking-wider leading-none">
              {msg.sender?.full_name || msg.senderName || 'User'}
            </p>
          )}

          {showReactionPicker?.id === msg.id && (
            <ChatMessageReactions 
              onReact={(emoji) => performReactToMessage(msg.id, emoji)}
              onClose={() => setShowReactionPicker(null)}
              position={isMe ? 'right' : 'left'}
            />
          )}

          {/* Replied message block rendered in compact structure */}
          {resolvedReplyTo && (
            <ReplyHeader 
              resolvedReplyTo={resolvedReplyTo} 
              actualIsMe={actualIsMe} 
              currentUser={user} 
              receiver={receiver} 
              onJumpToMessage={onJumpToMessage} 
            />
          )}

          <div className="flex flex-col min-w-[50px] max-w-full">
            {/* Media Attachment Player (Image, Video, Voice, Document) */}
            <MessageMedia 
              mediaUrl={mediaUrl} 
              mediaType={mediaType} 
              isMe={isMe} 
              receiver={receiver} 
              fileName={msg.file_name} 
            />
            
            {renderedContent && (
              typeof renderedContent === 'string' ? (
                <p className={`${isMsgDeleted ? 'italic text-zinc-400 dark:text-zinc-500 font-normal select-none text-[12.5px] opacity-75' : contentFontClass} break-words whitespace-pre-wrap overflow-visible [word-break:normal] text-left leading-normal`}>
                  {renderedContent}
                </p>
              ) : (
                renderedContent
              )
            )}

            {/* Always-fixed bottom-right corner timestamp & tick (WhatsApp perfect alignment style) */}
            <div className="absolute bottom-[4px] right-[10px] flex items-center gap-0.5 select-none pointer-events-none leading-none z-20">
              <span className={`text-[9.5px] font-medium tracking-tight whitespace-nowrap ${actualIsMe ? 'text-[var(--bubble-text-own)]/55' : 'text-[var(--bubble-text-other)]/55'}`}>
                {formatTime(msg.created_at)}
                {msg.is_edited && ' • Ed'}
              </span>
              {actualIsMe && (
                <span className="shrink-0 flex items-center ml-0.5">
                  {msg.status === 'sending' ? (
                    <Clock size={10} className="text-[var(--bubble-text-own)]/55 animate-pulse" />
                  ) : msg.is_read ? (
                    <CheckCheck size={13} className="text-[#34b7f1]" strokeWidth={2.8} />
                  ) : (convType === 'group' || isMessageDelivered) ? (
                    <CheckCheck size={13} className={`${actualIsMe ? 'text-[var(--bubble-text-own)]/40' : 'text-[var(--bubble-text-other)]/40'}`} strokeWidth={2.8} />
                  ) : (
                    <Check size={13} className={`${actualIsMe ? 'text-[var(--bubble-text-own)]/40' : 'text-[var(--bubble-text-other)]/40'}`} strokeWidth={2.8} />
                  )}
                </span>
              )}
            </div>
          </div>

          {msg.reactions && Object.keys(msg.reactions).length > 0 && !isMsgDeleted && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`absolute -bottom-2.5 ${actualIsMe ? 'right-2' : 'left-2'} flex items-center gap-1 bg-zinc-900/90 dark:bg-zinc-800/95 backdrop-blur-md rounded-full px-2 py-0.5 shadow-md border border-white/10 z-20 select-none`}
            >
              <div className="flex items-center -space-x-0.5">
                {Object.entries(msg.reactions).slice(0, 3).map(([uid, emoji]) => (
                  <span key={uid} className="text-[10px] filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{emoji as string}</span>
                ))}
              </div>
              {Object.keys(msg.reactions).length > 1 && (
                <span className="text-[9px] font-black tracking-wide text-white opacity-90 pl-0.5">{Object.keys(msg.reactions).length}</span>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
