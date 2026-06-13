import React from 'react';

interface SystemMessageProps {
  text: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ text }) => {
  return (
    <div className="flex justify-center my-2.5 w-full select-none animate-fadeIn">
      <div className="bg-zinc-150 dark:bg-zinc-800/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-zinc-200/50 dark:border-white/5 shadow-sm max-w-[90%]">
        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center justify-center text-center gap-1.5 uppercase">
          {text}
        </p>
      </div>
    </div>
  );
};
