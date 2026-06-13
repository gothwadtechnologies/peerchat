import React from 'react';
import { 
  User, 
  Phone, 
  Video, 
  Bell, 
  BellOff, 
  Camera, 
  Smartphone, 
  Mail,
  Info as InfoIcon,
  MessageSquare
} from 'lucide-react';

import Avatar from '../../../components/common/Avatar';

interface ChatSettingsDetailsProps {
  displayName: string;
  displayPhoto: string;
  username: string;
  bio: string;
  phone: string;
  email: string;
  isMuted: boolean;
  onPhotoEdit: () => void;
  onMessage: () => void;
  onVoice: () => void;
  onVideo: () => void;
  onMuteToggle: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

export default function ChatSettingsDetails({
  displayName,
  displayPhoto,
  username,
  bio,
  phone,
  email,
  isMuted,
  onPhotoEdit,
  onMessage,
  onVoice,
  onVideo,
  onMuteToggle,
  onCopyToClipboard
}: ChatSettingsDetailsProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Centered Profile Card */}
      <div className="flex flex-col items-center text-center bg-[var(--bg-card)] py-6 px-5 rounded-2xl border border-[var(--border-color)]/60 shadow-sm relative overflow-hidden">
        
        {/* Avatar with dynamic ring and soft shadow */}
        <div className="relative mb-3.5 group shrink-0">
          <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[var(--primary)] to-cyan-500 flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[var(--bg-main)]">
              <Avatar url={displayPhoto} type="direct" size="custom" customSizeClass="w-full h-full" name={displayName} />
            </div>
          </div>
          <button 
            type="button"
            onClick={onPhotoEdit}
            id="btn_edit_chat_photo"
            className="absolute bottom-0 right-0 p-2 bg-[var(--primary)] text-white rounded-full border border-[var(--bg-card)] shadow-md active:scale-90 transition-all cursor-pointer hover:bg-[var(--primary)]/90 hover:scale-105 duration-150"
            title="Change photo"
          >
            <Camera size={14} />
          </button>
        </div>

        {/* Display Name */}
        <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight max-w-xs truncate">
          {displayName}
        </h2>
        
        {/* Professional, elegant username presentation - no bulky badges, clean Inter/sans font */}
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-1 tracking-wide">
          @{username || 'grixchat_member'}
        </p>

        {/* High-quality GrixChat Quick Actions */}
        <div className="flex items-center justify-around w-full mt-6 border-t border-[var(--border-color)]/30 pt-5 pr-1.5 pl-1.5">
          {/* Message Action */}
          <button 
            onClick={onMessage}
            id="btn_chat_settings_action_msg"
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform cursor-pointer focus:outline-none"
          >
            <div className="w-11 h-11 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-all duration-150 shadow-sm">
              <MessageSquare size={19} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Chat</span>
          </button>

          {/* Voice Action */}
          <button 
            onClick={onVoice}
            id="btn_chat_settings_action_voice"
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform cursor-pointer focus:outline-none"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-150 shadow-sm">
              <Phone size={19} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Voice</span>
          </button>

          {/* Video Action */}
          <button 
            onClick={onVideo}
            id="btn_chat_settings_action_video"
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform cursor-pointer focus:outline-none"
          >
            <div className="w-11 h-11 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-150 shadow-sm">
              <Video size={19} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Video</span>
          </button>

          {/* Mute Toggle Action */}
          <button 
            onClick={onMuteToggle}
            id="btn_chat_settings_action_mute"
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform cursor-pointer focus:outline-none"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm ${
              isMuted 
                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/10' 
                : 'bg-amber-500/10 text-amber-500'
            } group-hover:opacity-90`}>
              {isMuted ? <BellOff size={19} className="stroke-[2.2]" /> : <Bell size={19} className="stroke-[2.2]" />}
            </div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              {isMuted ? 'Muted' : 'Mute'}
            </span>
          </button>
        </div>
      </div>

      {/* Info details group */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 flex flex-col border border-[var(--border-color)]/50 shadow-sm">
        <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2.5 pl-1.5 opacity-90 block">
          Contact Details
        </span>
        
        {/* Phone detail */}
        {phone ? (
          <div 
            onClick={() => onCopyToClipboard(phone, "Phone number")}
            id="row_info_phone"
            className="flex items-start gap-4 py-2.5 hover:bg-[var(--bg-main)]/50 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
          >
            <Smartphone size={18} className="text-[var(--text-secondary)] mt-0.5 shrink-0 group-hover:text-[var(--primary)] transition-colors duration-150" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-[var(--text-primary)] tracking-wide">{phone}</p>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">Mobile Phone</p>
            </div>
          </div>
        ) : (
          <div 
            id="row_info_phone_none"
            className="flex items-start gap-4 py-2.5 px-2 rounded-xl text-left select-none"
          >
            <Smartphone size={18} className="text-[var(--text-secondary)] opacity-55 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-secondary)] italic">No phone number shared</p>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">Mobile Phone</p>
            </div>
          </div>
        )}

        <div className="h-px bg-[var(--border-color)]/40 my-1 ml-11" />

        {/* Email detail */}
        {email && (
          <>
            <div 
              onClick={() => onCopyToClipboard(email, "Email id")}
              id="row_info_email"
              className="flex items-start gap-4 py-2.5 hover:bg-[var(--bg-main)]/50 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
            >
              <Mail size={18} className="text-[var(--text-secondary)] mt-0.5 shrink-0 group-hover:text-[var(--primary)] transition-colors duration-150" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{email}</p>
                <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">Email URL</p>
              </div>
            </div>
            
            <div className="h-px bg-[var(--border-color)]/40 my-1 ml-11" />
          </>
        )}

        {/* Username detail */}
        <div 
          onClick={() => onCopyToClipboard(`@${username}`, "Username")}
          id="row_info_username"
          className="flex items-start gap-4 py-2.5 hover:bg-[var(--bg-main)]/50 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <User size={18} className="text-[var(--text-secondary)] mt-0.5 shrink-0 group-hover:text-[var(--primary)] transition-colors duration-150" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-[var(--primary)] truncate">@{username || 'grixchat_user'}</p>
            <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">Username</p>
          </div>
        </div>

        <div className="h-px bg-[var(--border-color)]/40 my-1 ml-11" />

        {/* Bio detail */}
        <div 
          onClick={() => onCopyToClipboard(bio || "Hey there! I am using GrixChat.", "Bio")}
          id="row_info_bio"
          className="flex items-start gap-4 py-2.5 hover:bg-[var(--bg-main)]/50 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <InfoIcon size={18} className="text-[var(--text-secondary)] mt-0.5 shrink-0 group-hover:text-[var(--primary)] transition-colors duration-150" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-relaxed break-words">
              {bio || "Hey there! I am using GrixChat."}
            </p>
            <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">Bio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
