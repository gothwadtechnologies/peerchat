import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  Archive, 
  Lock, 
  EyeOff, 
  Palette, 
  Check, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { ImageService } from '../../services/ImageService';
import { storage } from '../../services/StorageService';
import BubbleCustomizer from './components/BubbleCustomizer.tsx';

export default function ChatSettingsMainScreen() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { theme, setTheme, chatBackground, setChatBackground } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const archivedCount = userData?.archivedChats?.length || 0;
  const hiddenCount = userData?.hiddenChats?.length || 0;

  const themes: { id: Theme; label: string; sub: string }[] = [
    { id: 'system', label: 'System Default', sub: 'Matches device themes automatically' },
    { id: 'light', label: 'Light Classic', sub: 'Bright visual setting preset' },
    { id: 'dark', label: 'Dark Cosmic', sub: 'Super relaxed low-contrast style' }
  ];

  const backgrounds = [
    { id: '', label: 'Classic Space', color: 'bg-zinc-800' },
    { id: 'bg-blue-500/10', label: 'Sky Blue', color: 'bg-blue-500/20 border-blue-500/30' },
    { id: 'bg-emerald-500/10', label: 'Aurora Teal', color: 'bg-emerald-500/20 border-emerald-500/30' },
    { id: 'bg-rose-500/10', label: 'Blush Pink', color: 'bg-rose-500/20 border-rose-500/30' },
    { id: 'bg-amber-500/10', label: 'Warm Sunset', color: 'bg-amber-500/20 border-amber-500/30' },
    { id: 'bg-indigo-500/10', label: 'Cosmic Violet', color: 'bg-indigo-500/20 border-indigo-500/30' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await ImageService.uploadImage(file);
      setChatBackground(`url(${url})`);
    } catch (error: any) {
      showToast(error.message || "Failed to upload wallpaper image.");
    } finally {
      setUploading(false);
    }
  };

  const handleClearCache = () => {
    setClearing(true);
    setTimeout(() => {
      storage.removeItem('gx_user_cache');
      setClearing(false);
      showToast("Local chat index Cache cleared!");
    }, 800);
  };

  const isUrlBackground = chatBackground.startsWith('url(');

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Premium header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Chat Customizer</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-6 pb-24">
        {/* Safe Folders list */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none font-sans">
              Privacy Folders
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
            <button 
              onClick={() => navigate('/chats/archived')}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <Archive size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  Archived Chat Folder
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  {archivedCount > 0 ? `${archivedCount} conversations archived` : 'No archived chat logs'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {archivedCount > 0 && (
                  <span className="text-[10px] bg-[#0494f4] text-white font-black px-2 py-0.5 rounded-full select-none">
                    {archivedCount}
                  </span>
                )}
                <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1" />
              </div>
            </button>

            <button 
              onClick={() => navigate('/chats/hidden')}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <Lock size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  Hidden Safe Locker
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  {hiddenCount > 0 ? `${hiddenCount} security-masked logs` : 'Access via personal lock passcode'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {hiddenCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full select-none">
                    {hiddenCount}
                  </span>
                )}
                <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1" />
              </div>
            </button>

            <button 
              onClick={() => navigate('/chats/hidden/settings')}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <EyeOff size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  Locker Settings
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  Configure passcode credentials, mask settings
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
            </button>
          </div>
        </div>

        {/* Dynamic Bubble Customizer integration */}
        <div className="px-4">
          <BubbleCustomizer />
        </div>

        {/* Chat Wallpaper Customizer panel */}
        <div className="px-4">
          <div className="mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none font-sans">
              Chat Wallpaper & Background
            </h3>
          </div>
          <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setChatBackground(bg.id)}
                  className="flex flex-col items-center gap-1 group cursor-pointer border-none outline-none"
                >
                  <div className={`w-full aspect-[3/4] rounded-xl border-2 transition-all duration-150 flex items-center justify-center text-[#0494f4] ${
                    chatBackground === bg.id 
                    ? 'border-[#0494f4] scale-[1.02] shadow' 
                    : 'border-transparent bg-zinc-900/40 hover:bg-zinc-900/60'
                  } ${bg.color} shadow-sm group-active:scale-95`}>
                    {chatBackground === bg.id && <Check size={18} className="stroke-[2.5]" />}
                  </div>
                  <span className={`text-[10px] font-black tracking-tight ${
                    chatBackground === bg.id ? 'text-[#0494f4]' : 'text-[var(--text-secondary)] opacity-75'
                  }`}>
                    {bg.label}
                  </span>
                </button>
              ))}

              {isUrlBackground && (
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-full aspect-[3/4] rounded-xl border-2 border-[#0494f4] shadow-sm flex items-center justify-center bg-cover bg-center"
                    style={{ backgroundImage: chatBackground }}
                  >
                    <Check size={18} className="text-[#0494f4] stroke-[2.5] drop-shadow-md" />
                  </div>
                  <span className="text-[10px] font-black text-[#0494f4]">Custom Wallpaper</span>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />

            <button 
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-card)] border border-[var(--border-color)]/20 hover:bg-[var(--border-color)]/5 rounded-xl text-xs font-bold text-[var(--text-primary)] disabled:opacity-50 transition-all cursor-pointer border-none outline-none select-none"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin text-[#0494f4]" />
              ) : (
                <ImageIcon size={14} className="text-[#0494f4]" />
              )}
              <span>{uploading ? 'Uploading custom wallpaper...' : 'Upload custom wallpaper'}</span>
            </button>
          </div>
        </div>

        {/* Database memory cache manager */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none font-sans">
              Device Data Storage
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
            <button 
              onClick={handleClearCache}
              disabled={clearing}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-red-500/5 active:bg-red-500/10 transition-colors group text-left cursor-pointer border-none outline-none select-none disabled:opacity-50"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                {clearing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} className="stroke-[2.2]" />}
              </div>
              <div className="flex-grow min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-red-500 leading-tight">
                  Clear Local Cache index
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  Free up client-side temporary browser index memory instantly
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg opacity-90 transition-all pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
