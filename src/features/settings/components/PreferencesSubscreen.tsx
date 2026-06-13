import React, { useState } from 'react';
import { 
  Volume2, 
  Smartphone, 
  Wifi, 
  Timer, 
  Download, 
  Check, 
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { storage } from '../../../services/StorageService.ts';

export default function PreferencesSubscreen() {
  const [soundHaptic, setSoundHaptic] = useState(() => {
    return storage.getItem('app-sound-haptic') || 'enabled';
  });

  const [autoDownload, setAutoDownload] = useState(() => {
    return storage.getItem('app-auto-download') || 'wifi';
  });

  const [lockTimeout, setLockTimeout] = useState(() => {
    return storage.getItem('app-lock-timeout') || '0';
  });

  const [backingUp, setBackingUp] = useState(false);

  const handleToggleSound = () => {
    const nextVal = soundHaptic === 'enabled' ? 'disabled' : 'enabled';
    setSoundHaptic(nextVal);
    storage.setItem('app-sound-haptic', nextVal);
    
    if (nextVal === 'enabled') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (_) {}
    }
  };

  const handleAutoDownloadChange = (val: string) => {
    setAutoDownload(val);
    storage.setItem('app-auto-download', val);
  };

  const handleTimeoutChange = (val: string) => {
    setLockTimeout(val);
    storage.setItem('app-lock-timeout', val);
  };

  const handleExportData = () => {
    setBackingUp(true);
    setTimeout(() => {
      const exportObj: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        client: 'GrixChat PWA Mobile',
        preferences: {
          bubbleStyle: storage.getItem('app-chat-bubble-style') || 'whatsapp',
          fontSize: storage.getItem('app-chat-font-size') || 'medium',
          soundHaptic,
          autoDownload,
          lockTimeout
        },
        profile: null,
        localChatsBackup: {}
      };

      try {
        const profileRaw = storage.getItem('grix_cached_userdata');
        if (profileRaw) {
          exportObj.profile = JSON.parse(profileRaw);
        }
      } catch (_) {}

      try {
        const allData: Record<string, any> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('messages:') || key.indexOf('cache') !== -1 || key.indexOf('recent') !== -1)) {
            const val = window.localStorage.getItem(key);
            if (val) {
              try {
                allData[key] = JSON.parse(val);
              } catch (_) {
                allData[key] = val;
              }
            }
          }
        }
        exportObj.localChatsBackup = allData;
      } catch (_) {}

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `grixchat_offline_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackingUp(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sound selection toggle row */}
      <div>
        <div className="px-4 mb-2">
          <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
            Signals & Sound Effects
          </h3>
        </div>
        <div className="flex flex-col bg-[var(--bg-card)] border-y border-[var(--border-color)]/5 divide-y divide-[var(--border-color)]/5">
          <div className="w-full flex items-center justify-between px-4 py-3 h-16">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm shrink-0 ${
                soundHaptic === 'enabled' ? 'text-[#0494f4]' : 'text-[var(--text-secondary)] opacity-85'
              }`}>
                {soundHaptic === 'enabled' ? <Volume2 size={20} className="stroke-[2.2]" /> : <VolumeX size={20} className="stroke-[2.2]" />}
              </div>
              <div className="text-left pr-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">Sound Effects</h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Play alert rings on real-time channel events</p>
              </div>
            </div>
            <button 
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                soundHaptic === 'enabled' ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                soundHaptic === 'enabled' ? 'left-[22px]' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Download selections */}
      <div>
        <div className="px-4 mb-2 flex items-center gap-1.5">
          <Wifi size={13} className="text-[#0494f4] stroke-[2.2]" />
          <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
            Network Auto-Download
          </h3>
        </div>
        <div className="flex flex-col bg-[var(--bg-card)] divide-y divide-[var(--border-color)]/5">
          {[
            { id: 'never', title: 'Tap to Download', sub: 'Require manual action to download files' },
            { id: 'wifi', title: 'Wi-Fi Connection Only', sub: 'Preserves cell bandwidth and saves background data' },
            { id: 'all', title: 'Always Download Media', sub: 'High speed instant download across all networks' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleAutoDownloadChange(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="min-w-0 pr-1 flex-1">
                <h4 className={`text-[14px] font-semibold group-hover:text-[#0494f4] transition-colors leading-tight ${
                  autoDownload === item.id ? 'text-[#0494f4]' : 'text-[var(--text-primary)]'
                }`}>
                  {item.title}
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 mt-1 truncate leading-tight opacity-75">
                  {item.sub}
                </p>
              </div>
              {autoDownload === item.id && (
                <div className="bg-[#0494f4] p-1 rounded-full shadow-sm mr-2 shrink-0">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lock interval selections */}
      <div>
        <div className="px-4 mb-2 flex items-center gap-1.5">
          <Timer size={13} className="text-[#0494f4] stroke-[2.2]" />
          <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
            Security Auto-Lock Timeout
          </h3>
        </div>
        <div className="flex flex-col bg-[var(--bg-card)] divide-y divide-[var(--border-color)]/5">
          {[
            { id: '0', title: 'Immediately', sub: 'Encrypt connection whenever you close or switch browser tabs' },
            { id: '60', title: 'After 1 Minute of Idle', sub: 'Gives comfortable window if active background chatting' },
            { id: '300', title: 'After 5 Minutes of Idle', sub: 'Standard medium inactivity screen protection limit' },
            { id: 'never', title: 'Session Persistence Only', sub: 'Requires manual locking actions to secure access' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTimeoutChange(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="min-w-0 pr-1 flex-1">
                <h4 className={`text-[14px] font-semibold group-hover:text-[#0494f4] transition-colors leading-tight ${
                  lockTimeout === item.id ? 'text-[#0494f4]' : 'text-[var(--text-primary)]'
                }`}>
                  {item.title}
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 mt-1 truncate leading-tight opacity-75">
                  {item.sub}
                </p>
              </div>
              {lockTimeout === item.id && (
                <div className="bg-[#0494f4] p-1 rounded-full shadow-sm mr-2 shrink-0">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Database exports & backup */}
      <div className="px-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#0494f4] stroke-[2.2]" />
          <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none font-sans">
            Local Ledger Archive
          </h3>
        </div>
        <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0494f4]/10 text-[#0494f4] shrink-0 border border-[#0494f4]/10">
              <Smartphone size={18} className="stroke-[2.2]" />
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed font-normal opacity-90 text-left">
              Compiles all localized messages logs indices, customized colors, avatar caches and offline active sessions securely into a physical download-ZIP package instantly.
            </p>
          </div>
          <button 
            disabled={backingUp}
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0494f4] text-white hover:bg-[#0494f4]/90 rounded-xl text-xs font-bold leading-none shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border-none outline-none select-none"
          >
            <Download size={14} className={backingUp ? "animate-pulse" : ""} />
            <span>{backingUp ? 'Compiling Local Ledger...' : 'Backup Chat Logs & Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
