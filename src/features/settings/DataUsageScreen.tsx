import React, { useState } from 'react';
import { 
  Wifi, 
  Database, 
  Smartphone, 
  ChevronRight, 
  Trash2, 
  HardDrive,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

export default function DataUsageScreen() {
  const [proxyEnabled, setProxyEnabled] = useState(false);

  const usageData = [
    { label: 'Media', sent: '124 MB', received: '890 MB', icon: HardDrive, color: 'text-blue-500' },
    { label: 'Messages', sent: '12 MB', received: '45 MB', icon: Database, color: 'text-indigo-500' },
    { label: 'Calls', sent: '0 MB', received: '0 MB', icon: Activity, color: 'text-emerald-500' },
  ];

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-primary' : 'bg-zinc-300'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      <SettingHeader title="Storage and data" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* Network Usage */}
        <h3 className="px-6 mb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Network Usage</h3>
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)] mb-8">
           <div className="p-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-50/10 rounded-full flex items-center justify-center mb-4 text-primary">
                 <Wifi size={32} />
              </div>
              <div className="grid grid-cols-2 gap-8 w-full">
                 <div className="text-center">
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Sent</p>
                    <div className="flex items-center justify-center gap-1.5 text-lg font-black text-[var(--text-primary)]">
                       <ArrowUpCircle size={18} className="text-rose-500" />
                       136 MB
                    </div>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Received</p>
                    <div className="flex items-center justify-center gap-1.5 text-lg font-black text-[var(--text-primary)]">
                       <ArrowDownCircle size={18} className="text-emerald-500" />
                       935 MB
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="border-t border-[var(--border-color)]/20">
              {usageData.map((item, index) => (
                <div key={item.label} className={`px-6 py-4 flex items-center justify-between ${index !== usageData.length - 1 ? 'border-b border-[var(--border-color)]/20' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-zinc-50/10 ${item.color}`}>
                       <item.icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--text-primary)]">{item.received} ⬇️</p>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]">{item.sent} ⬆️</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Media Auto-Download */}
        <h3 className="px-6 mb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Media Auto-Download</h3>
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)] mb-8">
           <button className="w-full flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]/20">
              <span className="text-sm font-bold text-[var(--text-primary)]">When using mobile data</span>
              <div className="flex items-center gap-2">
                 <span className="text-[11px] text-[var(--text-secondary)] font-medium">None</span>
                 <ChevronRight size={16} className="text-zinc-300" />
              </div>
           </button>
           <button className="w-full flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]/20">
              <span className="text-sm font-bold text-[var(--text-primary)]">When connected on Wi-Fi</span>
              <div className="flex items-center gap-2">
                 <span className="text-[11px] text-[var(--text-secondary)] font-medium">All media</span>
                 <ChevronRight size={16} className="text-zinc-300" />
              </div>
           </button>
           <button className="w-full flex items-center justify-between px-6 py-4">
              <span className="text-sm font-bold text-[var(--text-primary)]">When roaming</span>
              <div className="flex items-center gap-2">
                 <span className="text-[11px] text-[var(--text-secondary)] font-medium">None</span>
                 <ChevronRight size={16} className="text-zinc-300" />
              </div>
           </button>
        </div>

        {/* Proxy */}
        <h3 className="px-6 mb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Proxy Settings</h3>
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)] mb-8">
           <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Use Proxy</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">Only use if you're unable to connect</p>
              </div>
              <Toggle active={proxyEnabled} onClick={() => setProxyEnabled(!proxyEnabled)} />
           </div>
        </div>

        <div className="px-8 text-center opacity-40 py-10">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)] leading-relaxed">
              Statistics collected since <br/>
              installation of GrixChat 
           </p>
        </div>
      </div>
    </div>
  );
}
