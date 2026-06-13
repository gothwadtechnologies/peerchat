import React, { useState, useRef, useEffect } from 'react';
import { Search, Music, Play, Pause, Check, Volume2, X } from 'lucide-react';
import { TRACKS, CATEGORIES, Track } from '../utils/musicData';

interface MusicSearchSheetProps {
  onSelectTrack: (track: Track | null) => void;
  selectedTrack: Track | null;
  onClose: () => void;
}

export default function MusicSearchSheet({ onSelectTrack, selectedTrack, onClose }: MusicSearchSheetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(err => console.error("Audio playback interrupted", err));
      setPlayingTrackId(track.id);

      audioRef.current.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  const filteredTracks = TRACKS.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || track.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-[#0c0f14]/95 text-white z-[60] flex flex-col font-sans">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-5 shrink-0">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Music size={22} className="text-[#0494f4]" />
          <span>Add Music Track</span>
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
          <X size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 shrink-0">
        <div className="relative flex items-center bg-white/5 rounded-2xl border border-white/10 focus-within:border-[#0494f4]/40 transition-colors h-11 px-3.5">
          <Search size={18} className="text-zinc-500 shrink-0 mr-2.5" />
          <input
            type="text"
            placeholder="Search songs, artists, genres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Categories Horizontal Scroller */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === category 
                ? 'bg-[#0494f4] text-white shadow-md' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2">
        {filteredTracks.length > 0 ? (
          filteredTracks.map(track => {
            const isSelected = selectedTrack?.id === track.id;
            const isPlaying = playingTrackId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  onSelectTrack(track);
                  onClose();
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#0494f4]/15 border-[#0494f4] shadow-md shadow-[#0494f4]/5' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                }`}
              >
                {/* Cover Image */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={(e) => handleTogglePlay(e, track)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"
                  >
                    {isPlaying ? <Pause size={18} className="animate-pulse" /> : <Play size={18} />}
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-extrabold text-white truncate block">
                    {track.title}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-bold block truncate">
                    {track.artist}
                  </span>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 pr-1">
                    {track.duration}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[#0494f4] text-white' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500">
            <Music size={44} className="opacity-40 animate-pulse" />
            <p className="text-xs font-bold">No tracks match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
