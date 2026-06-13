import React from 'react';

interface CallTimerProps {
  seconds: number;
  className?: string;
}

export const CallTimer: React.FC<CallTimerProps> = ({ seconds, className = "" }) => {
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span className={`font-mono text-xs tracking-wider font-extrabold ${className}`}>
      {formatTime(seconds)}
    </span>
  );
};
export default CallTimer;
