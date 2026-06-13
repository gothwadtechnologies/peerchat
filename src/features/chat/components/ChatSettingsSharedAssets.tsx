import React, { useState } from 'react';
import { ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';

type TabType = 'media' | 'files' | 'links';

interface ChatSettingsSharedAssetsProps {
  sharedMedia: string[];
  sharedFiles: { name: string; size: string; url: string }[];
  sharedLinks: { url: string; title: string }[] | null;
}

export default function ChatSettingsSharedAssets({
  sharedMedia,
  sharedFiles,
  sharedLinks
}: ChatSettingsSharedAssetsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('media');
  
  const links = sharedLinks || [];
  const mediaCount = sharedMedia.length;
  const filesCount = sharedFiles.length;
  const linksCount = links.length;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-color)]/50 shadow-sm flex flex-col">
      
      {/* Premium Segmented Segment Controller Buttons with icons and solid contours */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900/40 p-1.5 border-b border-[var(--border-color)]/30 gap-2 rounded-t-2xl">
        {(['media', 'files', 'links'] as const).map((tab) => {
          const active = activeTab === tab;
          const count = tab === 'media' ? mediaCount : tab === 'files' ? filesCount : linksCount;
          
          const tabIcon = tab === 'media' 
            ? <ImageIcon size={13} className="shrink-0" /> 
            : tab === 'files' 
              ? <FileText size={13} className="shrink-0" /> 
              : <LinkIcon size={13} className="shrink-0" />;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              id={`btn_tab_asset_${tab}`}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer shadow-xs border ${
                active 
                  // Background is now the solid primary theme color, text is white, and slightly scale-popped
                  ? 'bg-[var(--primary)] text-white border-blue-400/20 scale-[1.01] font-black shadow-md'
                  : 'bg-white dark:bg-zinc-800 text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tabIcon}
                <span className="font-extrabold">{tab}</span>
                <span className={`text-[9px] px-1.5 py-0.5 font-mono rounded-md ${
                  active ? 'bg-white/25 text-white' : 'bg-zinc-150 dark:bg-zinc-700/60 text-[var(--text-secondary)]'
                }`}>
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Shared asset list section */}
      <div className="p-4 min-h-[160px] max-h-[300px] overflow-y-auto no-scrollbar">
        {activeTab === 'media' && (
          mediaCount > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {sharedMedia.map((url, idx) => (
                <a 
                  key={idx} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="aspect-square bg-[var(--bg-main)] rounded-xl overflow-hidden shadow-sm hover:scale-[1.03] transition-transform duration-200 block border border-[var(--border-color)]/20"
                >
                  <img 
                    src={url} 
                    className="w-full h-full object-cover" 
                    alt="Shared asset" 
                    referrerPolicy="no-referrer"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full mb-2">
                <ImageIcon size={22} />
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">No media shared</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Shared pictures display here</p>
            </div>
          )
        )}

        {activeTab === 'files' && (
          filesCount > 0 ? (
            <div className="flex flex-col gap-2">
              {sharedFiles.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-[var(--bg-main)] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left border border-[var(--border-color)]/30"
                >
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
                    <p className="text-[9px] text-[var(--text-secondary)] uppercase mt-0.5">{file.size} • FILE</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full mb-2">
                <FileText size={22} />
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">No shared files</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Documents sent will show up here</p>
            </div>
          )
        )}

        {activeTab === 'links' && (
          linksCount > 0 ? (
            <div className="flex flex-col gap-2">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-[var(--bg-main)] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left border border-[var(--border-color)]/30"
                >
                  <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                    <LinkIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sky-500 truncate">{link.title}</p>
                    <p className="text-[9px] text-[var(--text-secondary)] truncate">{link.url}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full mb-2">
                <LinkIcon size={22} />
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">No shared links</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Web anchors linked in messages show here</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
