import React from 'react';
import { motion } from 'motion/react';
import { FileIcon, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VoiceMessage } from '../../../../components/ChatUIComponents';

interface MessageMediaProps {
  mediaUrl: string;
  mediaType: string;
  isMe: boolean;
  receiver: any;
  fileName?: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({
  mediaUrl,
  mediaType,
  isMe,
  receiver,
  fileName,
}) => {
  const navigate = useNavigate();

  if (!mediaUrl) return null;

  if (mediaType === 'image') {
    return (
      <motion.div 
        className="mb-1 rounded-xl overflow-hidden border border-white/5 dark:border-white/10 shadow-md cursor-pointer relative group-hover:scale-[1.01] transition-transform duration-250"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          navigate('/chat/preview', { 
            state: { 
              imageUrl: mediaUrl, 
              senderName: isMe ? 'You' : receiver?.fullName 
            } 
          });
        }}
      >
        <img 
          src={mediaUrl} 
          alt="Sent image" 
          className="max-w-full h-auto max-h-64 object-cover hover:opacity-95 transition-opacity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="mb-1 rounded-xl overflow-hidden border border-white/5 dark:border-white/10 aspect-video w-64 bg-black group/video relative shadow-md">
        <video 
          src={mediaUrl} 
          className="w-full h-full object-cover opacity-90 group-hover/video:opacity-100 transition-opacity"
          playsInline
          controls
        />
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <div className="mb-1 w-full flex justify-center relative">
        <VoiceMessage fileUrl={mediaUrl} isMe={isMe} />
      </div>
    );
  }

  if (mediaType === 'file') {
    return (
      <div className="mb-1.5 p-2 rounded-xl bg-black/10 dark:bg-black/15 border border-white/10 flex items-center gap-3 relative overflow-hidden shadow-sm group/file w-full min-w-[200px] hover:bg-black/15 transition-all">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/90 text-white flex items-center justify-center shadow-md shrink-0">
          <FileIcon size={16} className="stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-bold truncate text-[var(--bubble-text-own)] leading-tight">
            {fileName || 'Document File'}
          </p>
          <p className="text-[8px] opacity-70 font-semibold tracking-wide uppercase mt-0.5">
            {mediaUrl.split('.').pop()?.toUpperCase() || 'FILE'} • DOCUMENT
          </p>
        </div>
        <a 
          href={mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-1.5 bg-white/10 hover:bg-white/15 rounded-full text-white transition-all active:scale-90 flex items-center justify-center shadow whitespace-nowrap shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={11} className="stroke-[2.5]" />
        </a>
      </div>
    );
  }

  return null;
};
