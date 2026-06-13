import React from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export const VoiceMessage: React.FC<{
  fileUrl: string;
  isMe: boolean;
}> = ({ fileUrl, isMe }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity || time < 0) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      if (audio.duration === Infinity) {
        // Trick for WebM duration: seek to a very far point
        audio.currentTime = 1e101;
        audio.onseeking = () => {
          if (audio.duration !== Infinity && !isNaN(audio.duration)) {
             setDuration(audio.duration);
             audio.currentTime = 0;
             audio.onseeking = null;
          }
        };
      } else if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 min-w-[240px] w-full ${isMe ? 'text-white' : 'text-zinc-800'}`}>
      <audio 
        ref={audioRef}
        src={fileUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onCanPlay={() => {
          if (audioRef.current && (duration === 0 || duration === Infinity)) {
            handleLoadedMetadata();
          }
        }}
        onDurationChange={() => {
           if (audioRef.current && audioRef.current.duration !== Infinity) {
             setDuration(audioRef.current.duration);
           }
        }}
        preload="auto"
        crossOrigin="anonymous"
        className="hidden"
      />
      
      <div className="shrink-0">
        <button 
          onClick={togglePlay}
          className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform ${isMe ? 'text-white' : 'text-[#0494f4]'}`}
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center w-full h-8 px-1">
          <input
            type="range"
            min="0"
            max={duration || 0.01}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className={`w-full h-1 rounded-full appearance-none cursor-pointer accent-current ${isMe ? 'bg-white/20' : 'bg-black/10'}`}
            style={{
              background: `linear-gradient(to right, ${isMe ? '#fff' : '#0494f4'} ${(currentTime / (duration || 0.01)) * 100}%, ${isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} ${(currentTime / (duration || 0.01)) * 100}%)`
            }}
          />
        </div>
        <div className="flex justify-between items-center -mt-1 px-1">
          <span className="text-[11px] font-medium opacity-60">
            {formatTime(currentTime)}
          </span>
          <span className="text-[11px] font-medium opacity-60">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/5 flex items-center justify-center ring-1 ring-black/5">
          <Mic size={18} className={isMe ? 'text-white/40' : 'text-[#0494f4] opacity-50'} />
        </div>
        <div className={`absolute bottom-0 right-0 rounded-full p-0.5 border border-white/10 ${isMe ? 'bg-[#005c4b]' : 'bg-[#2b3943]'}`}>
           <Mic size={10} className={isMe ? 'text-white/80' : 'text-[#0494f4]'} />
        </div>
      </div>
    </div>
  );
};
