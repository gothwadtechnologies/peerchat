import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Activity, 
  Database,
  RefreshCw
} from 'lucide-react';
import { loggerService, LogEntry } from '../services/ConsoleLoggerService';

interface DeveloperConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperConsole({ isOpen, onClose }: DeveloperConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const logBottomRef = useRef<HTMLDivElement>(null);

  // Safely read from localStorage inside sandbox environment
  const safeGetLocalStorage = (key: string): string => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return 'Not supported';
      }
      return window.localStorage.getItem(key) || 'Not found';
    } catch (_) {
      return 'Access Denied';
    }
  };

  // Diagnostic State Check variables
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseAnonKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localStorageUser = safeGetLocalStorage('grix_cached_user');
  const localStorageUserData = safeGetLocalStorage('grix_cached_userdata');
  const connectionHealth = navigator.onLine ? 'Connected' : 'Disconnected';

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to loggerService updates
    const unsubscribe = loggerService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Auto-scroll to bottom of logs on new logs or filter shifts
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [logs.length, filter, isOpen]);

  // Filtering logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCopyLogs = () => {
    const diagnosticsHead = `===========================================
GRIXCHAT DEV CONSOLE DIAGNOSTICS REPORT
Generated: ${new Date().toLocaleString()}
Connection: ${connectionHealth}
Supabase Endpoint: ${hasSupabaseUrl ? 'Configured' : 'Missing'}
Supabase Anon Key: ${hasSupabaseAnonKey ? 'Configured' : 'Missing'}
Cached User ID: ${localStorageUser === 'Access Denied' ? 'Access Denied (Sandbox/Iframe Restriction)' : localStorageUser !== 'Not found' ? 'Present (Locked/Encrypted)' : 'None'}
Cached User Info: ${localStorageUserData === 'Access Denied' ? 'Access Denied (Sandbox/Iframe Restriction)' : localStorageUserData !== 'Not found' ? 'Cached' : 'None'}
User Agent: ${navigator.userAgent}
===========================================\n\n`;

    const logsBody = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message} ${l.details ? `\nDetails: ${l.details}` : ''}`).join('\n');
    
    navigator.clipboard.writeText(diagnosticsHead + logsBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    loggerService.logCustom('success', 'Logs copied to client clipboard successfully.');
  };

  const handleCreateTestLog = () => {
    const types: ('info' | 'warn' | 'error' | 'success')[] = ['info', 'success', 'warn', 'error'];
    const msgs = [
      'Diagnostic Test: Handshaking with Supabase servers...',
      'Auth State Change Triggered: event="INITIAL_SESSION" session=valid',
      'Potential Session Cache Slowload / Local cookie might delay state.',
      'Unhandled fetch latency warning - Retrying connection pool.'
    ];
    const randomIndex = Math.floor(Math.random() * types.length);
    loggerService.logCustom(types[randomIndex], msgs[randomIndex], 'Simulated test detail object metadata trace.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col md:p-4 text-slate-100 font-sans animate-fade-in">
      <div className="flex-1 bg-[#1a1c1e] md:rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        
        {/* Console Header */}
        <div className="bg-[#26292b] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-cyan-400" />
            <h2 className="font-bold text-sm tracking-wide uppercase text-slate-200">
              In-App Developer Console
            </h2>
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono">
              Live Inspector
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-700/50 rounded-full transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Diagnostics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#111214] border-b border-slate-800 text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/20 rounded">
            <Activity size={12} className={navigator.onLine ? "text-emerald-400" : "text-amber-500"} />
            <span>Connection: <strong className="text-slate-200">{connectionHealth}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/20 rounded">
            <Database size={12} className="text-cyan-400" />
            <span>Supabase: <strong className={hasSupabaseUrl ? "text-emerald-400" : "text-red-400"}>{hasSupabaseUrl ? "Ready" : "Missing"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/20 rounded truncate">
            <span className="text-violet-400">👤</span>
            <span className="truncate">Cache: <strong className="text-slate-200">{localStorageUser === 'Access Denied' ? "Blocked" : localStorageUser !== 'Not found' ? "Active" : "None"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/20 rounded truncate">
            <span className="text-yellow-400">⏱</span>
            <span className="truncate">Time: <strong className="text-slate-200">{new Date().toLocaleTimeString()}</strong></span>
          </div>
        </div>

        {/* Filters and Controls Header */}
        <div className="p-3 bg-[#1e2022] border-b border-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
          
          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${filter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${filter === 'info' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-blue-400'}`}
            >
              <Info size={11} /> Logs ({logs.filter(l => l.type === 'info').length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${filter === 'success' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'}`}
            >
              <Check size={11} /> Success ({logs.filter(l => l.type === 'success').length})
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${filter === 'warn' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'}`}
            >
              <AlertTriangle size={11} /> Warns ({logs.filter(l => l.type === 'warn').length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${filter === 'error' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-rose-400'}`}
            >
              <AlertCircle size={11} /> Errors ({logs.filter(l => l.type === 'error').length})
            </button>
          </div>

          {/* Search container */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1 pl-8 text-xs font-mono text-slate-100 placeholder-slate-500 w-full sm:w-44 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Logs Terminal Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0d0e10] font-mono text-xs leading-relaxed space-y-1.5 custom-scrollbar min-h-0">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-10">
              <Terminal size={32} className="text-slate-600 mb-2" />
              <p>No console messages captured corresponding to this filter.</p>
              {searchQuery && <p className="text-[11px] mt-1">Try resetting search string query.</p>}
            </div>
          ) : (
            filteredLogs.map((log) => {
              // Decide log formatting class based on code type
              let textClass = 'text-slate-300';
              let logIcon = '📝';
              
              if (log.type === 'warn') {
                textClass = 'text-amber-400 bg-amber-500/5';
                logIcon = '⚠️';
              } else if (log.type === 'error') {
                textClass = 'text-rose-400 bg-rose-500/5';
                logIcon = '❌';
              } else if (log.type === 'success') {
                textClass = 'text-emerald-400 bg-emerald-500/5';
                logIcon = '✅';
              } else {
                textClass = 'text-cyan-100';
                logIcon = '⚙️';
              }

              return (
                <div key={log.id} className={`p-1.5 rounded border border-slate-900/10 ${textClass} hover:border-slate-800 transition-colors group/item`}>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 select-none text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>
                    <span className="shrink-0 text-[10px] scale-90">{logIcon}</span>
                    <div className="flex-1 break-all whitespace-pre-wrap">
                      {log.message}
                      {log.details && (
                        <div className="text-[10px] text-slate-400 mt-1 pl-4 border-l border-slate-700 bg-black/25 p-1 rounded font-mono select-text">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={logBottomRef} />
        </div>

        {/* Footer Actions Panel */}
        <div className="p-3 bg-[#1a1c1e] border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateTestLog}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-300 font-mono py-1.5 px-3 rounded flex items-center gap-1.5 transition-all w-fit cursor-pointer"
              title="Test log systems"
            >
              <RefreshCw size={13} className="animate-spin-hover" />
              Emit Dummy Log
            </button>
            <button
              onClick={() => loggerService.clearLogs()}
              className="bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 active:scale-95 text-xs text-slate-300 font-mono py-1.5 px-3 rounded flex items-center gap-1.5 transition-all w-fit cursor-pointer"
            >
              <Trash2 size={13} />
              Clear Console
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className={`text-xs font-mono py-1.5 px-3.5 rounded flex items-center gap-1.5 transition-all active:scale-95 w-fit cursor-pointer ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold'}`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied Details!' : 'Copy Debug Log'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
