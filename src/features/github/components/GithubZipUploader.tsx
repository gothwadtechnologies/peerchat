import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import JSZip from 'jszip';

interface ExtractedFile {
  path: string;
  name: string;
  content: string; // Base64 encoding
  sha: string;
  size: number;
}

interface GithubZipUploaderProps {
  onFilesExtracted: (files: ExtractedFile[]) => void;
}

export default function GithubZipUploader({ onFilesExtracted }: GithubZipUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processZipFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setErrorMsg('Invalid file format. Please upload a structured .zip file only.');
      return;
    }

    setFileName(file.name);
    setExtracting(true);
    setErrorMsg('');

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const tempFiles: ExtractedFile[] = [];

      // Read each entry async
      const promises: Promise<void>[] = [];

      loadedZip.forEach((relativePath, zipEntry) => {
        // Skip directories and metadata/hidden folder elements
        if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.split('/').some(p => p.startsWith('.')) || relativePath.includes('node_modules')) {
          return;
        }

        const prom = zipEntry.async('base64').then((base64Content) => {
          tempFiles.push({
            path: relativePath,
            name: zipEntry.name.split('/').pop() || zipEntry.name,
            content: base64Content,
            sha: '', // Computed later on list load
            size: base64Content.length * 0.75 // approximate raw size from base64
          });
        });
        promises.push(prom);
      });

      await Promise.all(promises);

      if (tempFiles.length === 0) {
        throw new Error('This ZIP archive appears to contain no valid code files.');
      }

      onFilesExtracted(tempFiles);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to extract ZIP. Please verify the archive is valid.');
    } finally {
      setExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg('');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files.length > 0) {
      processZipFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl p-3 flex gap-2 items-center">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer text-center space-y-3 ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[0.99]' 
            : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]/50 bg-[var(--bg-card)]'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".zip" 
          className="hidden" 
        />

        {extracting ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <RefreshCw size={26} className="animate-spin text-primary" />
            <p className="text-xs font-extrabold text-[var(--text-primary)]">Extracting ZIP contents client-side...</p>
            <p className="text-[10px] text-[var(--text-secondary)] italic">Analyzing directory structure...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              {fileName ? <FileArchive size={24} /> : <UploadCloud size={24} />}
            </div>
            <div className="space-y-1">
              {fileName ? (
                <p className="text-xs font-black text-[var(--text-primary)] truncate max-w-xs mx-auto">
                  {fileName}
                </p>
              ) : (
                <p className="text-xs font-black text-[var(--text-primary)]">
                  Drag & Drop codebase .zip file here
                </p>
              )}
              <p className="text-[10px] text-[var(--text-secondary)]">
                {fileName ? 'Click here to replace the archive' : 'or browse files (accepts only structured zip)'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
