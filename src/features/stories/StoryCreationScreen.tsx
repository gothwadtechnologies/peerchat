import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { ImageService } from '../../services/ImageService';
import { X, Image, Type, Palette, Music, Sparkles, Loader2, ArrowLeft, Check, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MusicSearchSheet from './components/MusicSearchSheet';
import { Track } from './utils/musicData';

const PRESET_BG_COLORS = [
  'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)', // Midnight Sunset
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Oceanic
  'linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)', // Aurora Orange
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Emerald Green
  'linear-gradient(135deg, #2c3e50 0%, #000000 100%)', // Obsidian Gray
  '#0a0f18', // Cyber Slate Deep
  '#e94560', // Neon Crimson
  '#7209b7', // Velvet Purple
];

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(1)' },
  { name: 'Vintage Sepia', value: 'sepia(0.8) contrast(0.95)' },
  { name: 'Cyber Neon', value: 'hue-rotate(240deg) saturate(1.8) contrast(1.1)' },
  { name: 'Warm Warmth', value: 'contrast(1.15) brightness(1.05) sepia(0.2)' },
  { name: 'Cool Hue', value: 'hue-rotate(120deg) saturate(1.2)' },
];

export default function StoryCreationScreen() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [storyType, setStoryType] = useState<'image' | 'text'>('image');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  
  // Customizations
  const [bgColor, setBgColor] = useState(PRESET_BG_COLORS[0]);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  
  // Interaction/UI states
  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!supabase || !authUser?.id) return;
    if (storyType === 'image' && !selectedImage) {
      alert('Please select an image first.');
      return;
    }
    if (storyType === 'text' && !textContent.trim()) {
      alert('Please write something in your story.');
      return;
    }

    setIsPublishing(true);
    try {
      let mediaUrl = null;
      if (storyType === 'image' && selectedImage) {
        mediaUrl = await ImageService.uploadImage(selectedImage, undefined, 'chat-media');
      }

      const { error } = await supabase.from('stories').insert({
        user_id: authUser.id,
        type: storyType,
        media_url: mediaUrl,
        text_content: storyType === 'text' ? textContent.trim() : null,
        bg_color: storyType === 'text' ? bgColor : null,
        filter_applied: storyType === 'image' ? selectedFilter : null,
        music_title: selectedTrack?.title || null,
        music_artist: selectedTrack?.artist || null,
        music_url: selectedTrack?.url || null
      });

      if (error) throw error;
      navigate('/chats');
    } catch (err) {
      console.error('Failed to create story:', err);
      alert('Failed to publish story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0c0f14] z-50 flex flex-col font-sans text-white select-none">
      {/* Header Panel */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-15">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/chats')}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={22} className="text-zinc-300" />
          </button>
          <span className="font-extrabold text-[15px] uppercase tracking-[0.15em] text-white">
            New Story
          </span>
        </div>

        {/* Story Type Selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setStoryType('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              storyType === 'image' 
                ? 'bg-[#0494f4] text-white shadow' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Image size={13} />
            <span>Image</span>
          </button>
          <button
            onClick={() => setStoryType('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              storyType === 'text' 
                ? 'bg-[#0494f4] text-white shadow' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Type size={13} />
            <span>Text</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex items-center gap-1 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
        >
          {isPublishing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} strokeWidth={3} />
          )}
          <span>{isPublishing ? 'Sharing...' : 'Share'}</span>
        </button>
      </div>

      {/* Main Studio Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 bg-[#07090d]">
        <AnimatePresence mode="wait">
          {storyType === 'image' ? (
            <motion.div 
              key="image-canvas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl relative flex flex-col items-center justify-center"
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Story preview"
                  className="w-full h-full object-cover transition-all"
                  style={{ filter: selectedFilter }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#0494f4] shadow-inner">
                    <Image size={32} />
                  </div>
                  <h4 className="font-extrabold text-[14px] text-white">Capture or Upload Media</h4>
                  <p className="text-[11px] text-zinc-400 max-w-[200px] leading-relaxed">
                    Select any picture from your library to share as an atmospheric photo story.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 bg-[#0494f4] hover:bg-[#037cc9] text-white font-black text-[11px] uppercase tracking-widest px-5 h-9 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md shadow-[#0494f4]/10"
                  >
                    Choose Photo
                  </button>
                </div>
              )}

              {/* Invisible change photo trigger */}
              {imagePreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-white/10"
                >
                  Change
                </button>
              )}

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </motion.div>
          ) : (
            <motion.div 
              key="text-canvas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              style={{ background: bgColor }}
              className="w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col items-center justify-center p-8 text-center"
            >
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={200}
                placeholder="What's on your mind? Type a story..."
                className="w-full bg-transparent border-none outline-none text-white text-[22px] font-black leading-snug text-center placeholder:text-white/40 resize-none h-48 focus:ring-0"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              />

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-black tracking-widest text-white/50 bg-black/20 px-2 py-1 rounded-full uppercase">
                  {textContent.length} / 200
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music Track Badge overlay on canvas if loaded */}
        {selectedTrack && (
          <div className="absolute top-22 bg-black/60 backdrop-blur-md rounded-2xl py-2 px-4 flex items-center gap-2 border border-white/10 max-w-[280px] shadow-lg">
            <Music size={14} className="text-[#0494f4] animate-spin" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-extrabold text-white truncate max-w-[150px]">
                {selectedTrack.title}
              </span>
              <span className="text-[9px] text-zinc-400 truncate">
                {selectedTrack.artist}
              </span>
            </div>
            <button 
              onClick={() => setSelectedTrack(null)}
              className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer-none ml-1.5"
            >
              <Trash size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Controls Bar */}
      <div className="bg-black/40 border-t border-white/5 px-4 py-3 pb-safe shrink-0 flex flex-col gap-3">
        {/* Sub-selectors (Filters or Bg Presets) */}
        {storyType === 'image' && imagePreview && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">
              Select Lens Filter
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {FILTERS.map(f => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFilter(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                    selectedFilter === f.value 
                      ? 'bg-white text-black border-white font-black shadow-md' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {storyType === 'text' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">
              Choose Canvas Accent
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {PRESET_BG_COLORS.map((bg, idx) => (
                <button
                  key={idx}
                  onClick={() => setBgColor(bg)}
                  style={{ background: bg }}
                  className={`w-9 h-9 rounded-full cursor-pointer transition-transform shrink-0 ${
                    bgColor === bg ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#0c0f14]' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Global actions: Soundtrack selection */}
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles size={14} className="text-[#0494f4] animate-pulse" />
            <span className="text-[11px] font-bold">Soundtrack is {selectedTrack ? 'attached' : 'empty'}</span>
          </div>

          <button
            onClick={() => setShowMusicSheet(true)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedTrack 
                ? 'bg-[#0494f4] text-white' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10'
            }`}
          >
            <Music size={13} />
            <span>{selectedTrack ? 'Change Track' : 'Add Track'}</span>
          </button>
        </div>
      </div>

      {/* Music Search Sheet modal overlay */}
      {showMusicSheet && (
        <MusicSearchSheet
          selectedTrack={selectedTrack}
          onSelectTrack={(track) => setSelectedTrack(track)}
          onClose={() => setShowMusicSheet(false)}
        />
      )}
    </div>
  );
}
