import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { X, Loader2, Music, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from '../../components/common/Avatar';

export default function StoryWatcherScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*, users:user_id(username, photo_url)')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setStories(data.map(s => ({
            ...s,
            username: s.users?.username || 'User',
            photoURL: s.users?.photo_url || '',
            imageUrl: s.media_url
          })));

          if (data.length === 0) {
            navigate('/chats');
          }
        } else {
          navigate('/chats');
        }
      } catch (err) {
        console.error('Error fetching stories for watcher:', err);
        navigate('/chats');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [userId]);

  // Handle active story music track playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const currentStory = stories[currentIndex];
    const trackUrl = currentStory?.music_url;
    
    if (trackUrl) {
      const audio = new Audio(trackUrl);
      audio.volume = 0.5;
      audio.loop = true;
      audioRef.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("Audio autoplay was prevented/interrupted: ", err);
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, stories]);

  useEffect(() => {
    // Logic for tracking viewers could be added here if needed in Supabase
  }, [currentIndex, stories]);

  // Auto-advance
  useEffect(() => {
    if (stories.length > 0) {
      const timer = setTimeout(() => {
        handleNext();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigate('/chats');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Loader2 className="text-white animate-spin" size={48} />
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans select-none">
      {/* Progress Bars */}
      <div className="absolute top-4 left-0 right-0 px-2 flex gap-1 z-20">
        {stories.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full' : 'w-0'}`}
              style={{ transitionDuration: idx === currentIndex ? '5000ms' : '0ms' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Avatar url={currentStory?.photoURL} name={currentStory?.username} size="sm" className="border border-white/20" />
          <span className="text-white font-extrabold text-xs tracking-wider">@{currentStory?.username}</span>
        </div>
        <button onClick={() => navigate('/chats')} className="text-white p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStory?.type === 'text' ? (
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              style={{ background: currentStory.bg_color || '#111' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <p className={`text-white text-[24px] font-black leading-snug max-w-md ${currentStory.filter_applied || 'font-sans'}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                {currentStory.text_content}
              </p>
            </motion.div>
          ) : (
            <motion.img 
              key={currentStory?.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              src={currentStory?.imageUrl} 
              className={`w-full h-full object-contain`}
              style={{ filter: currentStory?.filter_applied || 'none' }}
            />
          )}
        </AnimatePresence>

        {/* Music Indicator Layer */}
        {currentStory?.music_title && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full py-1.5 px-4 flex items-center gap-2 border border-white/10 z-30 max-w-[280px]">
            <Music size={12} className="text-[#0494f4] animate-spin" />
            <span className="text-[10px] font-extrabold text-white truncate max-w-[150px]">
              {currentStory.music_title}
            </span>
            <span className="text-[9px] text-zinc-400 truncate">
              • {currentStory.music_artist}
            </span>
          </div>
        )}

        {/* Navigation Overlays */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" onClick={handlePrev} />
          <div className="flex-1" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
}
