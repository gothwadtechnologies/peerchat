import React, { useState } from 'react';
import { X, Check, FileText, Settings, AlertTriangle } from 'lucide-react';

interface ExtractedFile {
  path: string;
  name: string;
  content: string; // Base64
  sha: string;
  size: number;
}

interface GithubFileEditorModalProps {
  file: ExtractedFile;
  onClose: () => void;
  onSave: (updatedFile: ExtractedFile) => void;
}

export default function GithubFileEditorModal({ file, onClose, onSave }: GithubFileEditorModalProps) {
  const [filePath, setFilePath] = useState(file.path);
  const [textContent, setTextContent] = useState(() => {
    try {
      return decodeURIComponent(escape(window.atob(file.content)));
    } catch (e) {
      // If it fails to decode, we treat it as binary or raw
      return '';
    }
  });
  
  const isBinary = !textContent && file.content.length > 0;
  const [errorMsg, setErrorMsg] = useState('');

  const handleApply = () => {
    if (!filePath.trim()) {
      setErrorMsg('Target file path cannot be empty.');
      return;
    }

    try {
      let finalBase64 = file.content;
      if (!isBinary) {
        // Safe conversion from UTF-8 back to Base64
        finalBase64 = window.btoa(unescape(encodeURIComponent(textContent)));
      }

      onSave({
        ...file,
        path: filePath.trim(),
        name: filePath.split('/').pop() || file.name,
        content: finalBase64,
        size: finalBase64.length * 0.75
      });
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to process string encoding safely. Double check for invalid characters.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl border border-[var(--border-color)] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        
        {/* Header bar */}
        <div className="px-4 py-3.5 border-b border-[var(--border-color)]/60 flex items-center justify-between bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <FileText size={15} />
            </div>
            <div>
              <h3 className="text-xs font-black text-[var(--test-primary)]">Edit File Configuration</h3>
              <p className="text-[9px] text-[var(--text-secondary)] font-mono">{file.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-[var(--text-secondary)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 p-2.5 rounded-xl text-[11px] font-bold flex gap-1.5 items-center">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form input: Path */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider ml-1">
              Commit File Path
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. src/index.ts"
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--box-text)] font-semibold font-mono focus:outline-none"
            />
          </div>

          {/* Code Textarea editor */}
          <div className="space-y-1 flex-1 flex flex-col">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                File Content
              </label>
              <span className="text-[9px] text-[var(--text-secondary)] font-mono font-bold">
                {isBinary ? 'BINARY DETECTED' : `${textContent.split('\n').length} lines`} • {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>

            {isBinary ? (
              <div className="bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]/60 text-center p-8 space-y-2">
                <AlertTriangle className="text-amber-500 mx-auto" size={24} />
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Binary Content Suspended</h4>
                <p className="text-[10px] text-[var(--text-secondary)] max-w-xs mx-auto">
                  This target is an image, font, or compiled binary resource. You can safely change its repository path, but raw content edits must occur in your local workspace.
                </p>
              </div>
            ) : (
              <div className="relative border border-[var(--border-color)]/60 rounded-xl overflow-hidden flex flex-col h-72">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full h-full p-3 font-mono text-[10px] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none resize-none leading-relaxed overflow-y-auto select-text"
                  spellCheck={false}
                  placeholder="Insert custom code files..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-[var(--border-color)]/60 flex justify-end gap-2 bg-[var(--bg-main)]/50">
          <button
            onClick={onClose}
            className="px-3.5 h-9 border border-[var(--border-color)]/80 text-[var(--text-primary)] hover:bg-black/5 rounded-xl font-bold text-[11px] uppercase transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 h-9 bg-primary text-white hover:bg-primary-hover rounded-xl font-black text-[11px] uppercase transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Check size={14} />
            <span>Apply Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
