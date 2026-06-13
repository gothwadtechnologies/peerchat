import React from 'react';
import { motion } from 'motion/react';
import { Camera, Video, Mic, FileText } from 'lucide-react';

interface ReplyHeaderProps {
  resolvedReplyTo: any;
  actualIsMe: boolean;
  currentUser: any;
  receiver: any;
  onJumpToMessage?: (messageId: string) => void;
}

export const ReplyHeader: React.FC<ReplyHeaderProps> = ({
  resolvedReplyTo,
  actualIsMe,
  currentUser,
  receiver,
  onJumpToMessage,
}) => {
  if (!resolvedReplyTo || typeof resolvedReplyTo !== 'object' || Array.isArray(resolvedReplyTo) || !resolvedReplyTo.id) {
    return null;
  }

  const senderName = resolvedReplyTo.sender_id === currentUser?.id 
    ? 'You' 
    : (resolvedReplyTo.sender?.full_name || receiver?.fullName || 'Contact');

  const mediaUrl = resolvedReplyTo.media_url || resolvedReplyTo.imageUrl || resolvedReplyTo.fileUrl;
  const mediaType = resolvedReplyTo.media_type || resolvedReplyTo.type;
  const fileName = resolvedReplyTo.file_name;

  // Build the message preview content
  let previewIcon = null;
  let previewText = resolvedReplyTo.content || resolvedReplyTo.text || '';

  if (mediaUrl) {
    if (mediaType === 'image') {
      previewIcon = <Camera size={11} className="inline mr-1" />;
      if (!previewText) previewText = 'Photo';
    } else if (mediaType === 'video') {
      previewIcon = <Video size={11} className="inline mr-1" />;
      if (!previewText) previewText = 'Video';
    } else if (mediaType === 'audio') {
      previewIcon = <Mic size={11} className="inline mr-1" />;
      previewText = 'Voice Message';
    } else if (mediaType === 'file') {
      previewIcon = <FileText size={11} className="inline mr-1" />;
      previewText = fileName || 'Document';
    }
  }

  return (
    <motion.div 
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (resolvedReplyTo.id && onJumpToMessage) {
          onJumpToMessage(resolvedReplyTo.id);
        }
      }}
      className={`mb-2 rounded-lg border-l-[4px] bg-black/8 dark:bg-black/30 text-xs cursor-pointer hover:bg-black/15 dark:hover:bg-black/40 transition-all text-left flex items-stretch justify-between select-none overflow-hidden max-w-full min-h-[44px] ${
        actualIsMe 
          ? 'border-l-teal-400 dark:border-l-[var(--primary)] text-[var(--bubble-text-own)]/90' 
          : 'border-l-[var(--primary)] text-[var(--bubble-text-other)]/90'
      }`}
    >
      {/* Text Info Side */}
      <div className="flex-1 min-w-0 py-1.5 px-3 flex flex-col justify-center leading-normal">
        <p className={`font-bold text-[11.5px] tracking-tight leading-tight mb-0.5 truncate ${actualIsMe ? 'text-teal-300 dark:text-cyan-400' : 'text-[var(--primary)]'}`}>
          {senderName}
        </p>
        <p className="truncate opacity-85 font-normal leading-tight text-[11px] flex items-center text-zinc-300">
          {previewIcon && <span className="inline-flex mr-1 items-center">{previewIcon}</span>}
          <span className="truncate">{previewText}</span>
        </p>
      </div>

      {/* Media Image Thumbnail Side (WhatsApp Style) */}
      {mediaUrl && (mediaType === 'image' || mediaType === 'video') && (
        <div className="w-12 self-stretch shrink-0 bg-black/25 flex items-center justify-center overflow-hidden border-l border-white/5">
          {mediaType === 'image' ? (
            <img 
              src={mediaUrl} 
              alt="Reply preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="relative w-full h-full">
              <video 
                src={mediaUrl} 
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Video size={11} className="text-white drop-shadow" />
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
