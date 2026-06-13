import React, { useState, useEffect } from 'react';
import { loggerService, LogEntry } from '../services/ConsoleLoggerService';

export default function TermuxConsoleButton() {
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const checkLogs = (logs: LogEntry[]) => {
      const errors = logs.filter(l => l.type === 'error');
      setErrorCount(errors.length);
    };
    
    checkLogs(loggerService.getLogs());

    const unsubscribe = loggerService.subscribe(checkLogs);
    return () => unsubscribe();
  }, []);

  const handleToggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-dev-console'));
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--header-text)] rounded-full transition-colors cursor-pointer group flex items-center justify-center relative font-mono text-base md:text-lg font-bold"
      title="Open Terminal Diagnostics Console"
      id="termux-console-trigger"
    >
      <div className="flex items-center gap-[2px] group-active:scale-110 transition-transform tracking-tight select-none">
        <span className="text-emerald-500 font-bold">&gt;</span>
        <span className="text-medium-emphasis animate-pulse font-extrabold opacity-90">-</span>
      </div>

      {errorCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
