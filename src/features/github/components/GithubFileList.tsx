import React, { useState, useEffect } from 'react';
import { Search, FolderOpen, Trash2, Edit2, CheckCircle2, AlertCircle, FilePlus2, RefreshCw } from 'lucide-react';
import { calculateGitHubBlobSha, isFileModifiedLocally } from '../utils/githubSha';
import GithubFileEditorModal from './GithubFileEditorModal';

interface ExtractedFile {
  path: string;
  name: string;
  content: string; // Base64
  sha: string;
  size: number;
}

interface RemoteFileRef {
  path: string;
  sha: string;
}

interface GithubFileListProps {
  files: ExtractedFile[];
  remoteFiles: RemoteFileRef[];
  onUpdateFile: (index: number, updated: ExtractedFile) => void;
  onRemoveFile: (index: number) => void;
  selectedPaths: string[];
  onTogglePath: (path: string) => void;
}

export default function GithubFileList({
  files,
  remoteFiles,
  onUpdateFile,
  onRemoveFile,
  selectedPaths,
  onTogglePath
}: GithubFileListProps) {
  const [fileSearch, setFileSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'changed' | 'new' | 'unchanged'>('all');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [calculatingShas, setCalculatingShas] = useState(true);

  // Compute local Git SHAs for unzipped files
  useEffect(() => {
    const computeLocalShas = async () => {
      setCalculatingShas(true);
      for (let i = 0; i < files.length; i++) {
        if (!files[i].sha) {
          const sha = await calculateGitHubBlobSha(files[i].content);
          onUpdateFile(i, { ...files[i], sha });
        }
      }
      setCalculatingShas(false);
    };
    computeLocalShas();
  }, [files, onUpdateFile]);

  // Determine status color & label
  const getFileState = (file: ExtractedFile) => {
    const matchingRemote = remoteFiles.find(rf => rf.path === file.path);
    if (!matchingRemote) return { label: 'New', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', isDiff: true };
    
    const isMod = isFileModifiedLocally(file.sha, matchingRemote.sha);
    if (isMod) return { label: 'Modified', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', isDiff: true };
    
    return { label: 'Up to date', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', isDiff: false };
  };

  const getFilteredFiles = () => {
    return files.map((file, index) => ({ file, index, state: getFileState(file) }))
      .filter(({ file, state }) => {
        const matchesSearch = file.path.toLowerCase().includes(fileSearch.toLowerCase());
        if (!matchesSearch) return false;
        
        if (activeFilter === 'changed') return state.isDiff;
        if (activeFilter === 'new') return state.label === 'New';
        if (activeFilter === 'unchanged') return !state.isDiff;
        return true;
      });
  };

  if (calculatingShas) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]/60 text-center flex flex-col items-center justify-center space-y-2">
        <RefreshCw size={22} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-[var(--text-primary)]">Evaluating local repository files...</p>
        <p className="text-[10px] text-[var(--text-secondary)]">Comparing hashes to isolate changed codebase files...</p>
      </div>
    );
  }

  const processedList = getFilteredFiles();
  const changedCount = files.filter(f => getFileState(f).isDiff).length;

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]/60 p-3 space-y-3 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search unzipped files..."
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="w-full text-xs py-2 pl-8 pr-3 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--box-text)] rounded-xl focus:outline-none focus:border-primary/50"
          />
          <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>

        {/* Sync Filters Header */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {(['all', 'changed', 'new', 'unchanged'] as const).map(f => {
            const isActive = activeFilter === f;
            const count = f === 'all' ? files.length : f === 'changed' ? changedCount : f === 'new' ? files.filter(fl => getFileState(fl).label === 'New').length : files.filter(fl => !getFileState(fl).isDiff).length;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
                  isActive 
                    ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:text-black dark:border-white' 
                    : 'bg-[var(--bg-main)]/60 border-[var(--border-color)]/50 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Files */}
      <div className="max-h-64 overflow-y-auto border border-[var(--border-color)]/30 rounded-2xl divide-y divide-[var(--border-color)]/10 bg-[var(--bg-card)] no-scrollbar">
        {processedList.length === 0 ? (
          <div className="p-8 text-center space-y-1.5">
            <FolderOpen size={20} className="text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-[var(--text-primary)]">No matching files</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Adjust your search or category filters.</p>
          </div>
        ) : (
          processedList.map(({ file, index, state }) => {
            const isChecked = selectedPaths.includes(file.path);
            return (
              <div 
                key={file.path} 
                className={`flex items-center justify-between p-3 transition-colors ${isChecked ? 'bg-primary/[0.02]' : ''}`}
              >
                <div 
                  onClick={() => onTogglePath(file.path)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Done via div onClick
                    className="rounded border-[var(--border-color)] text-primary h-3.5 w-3.5 focus:ring-0 shrink-0 select-none pointer-events-none"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                      {file.path}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 border rounded-md shrink-0 ${state.color}`}>
                        {state.label}
                      </span>
                      <span className="text-[9px] text-[var(--text-secondary)] font-mono font-bold">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Action Controls (Edit & Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="p-1.5 hover:bg-black/5 text-[var(--text-secondary)] hover:text-primary rounded-lg transition-colors cursor-pointer"
                    title="Edit File"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="p-1.5 hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    title="Remove from Sync Queue"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Render Editor overlay if active */}
      {editingIndex !== null && files[editingIndex] && (
        <GithubFileEditorModal
          file={files[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSave={(updated) => onUpdateFile(editingIndex, updated)}
        />
      )}
    </div>
  );
}
