import React from 'react';
import { Sparkles } from 'lucide-react';
import { getMessageQualityScore } from '../utils/grixaiHelpers';

interface MessageQualityBadgeProps {
  text: string;
}

export const MessageQualityBadge: React.FC<MessageQualityBadgeProps> = ({ text }) => {
  const score = getMessageQualityScore(text);
  
  // Decide badge colors
  let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  let ratingText = "Perfect";
  
  if (score < 85) {
    colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    ratingText = "Good";
  } else if (score < 95) {
    colorClass = "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
    ratingText = "Amazing";
  }

  return (
    <div className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black tracking-wide uppercase select-none w-fit transition-all duration-300 ${colorClass}`}>
      <Sparkles size={8} />
      <span>Quality: {score}% • {ratingText}</span>
    </div>
  );
};
