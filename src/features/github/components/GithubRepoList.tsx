import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, Search, RefreshCw, FolderClosed, Layers, FileArchive, CheckSquare, Square, Folder, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import GithubZipUploader from './GithubZipUploader';
import GithubFileList from './GithubFileList';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
}

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

interface GithubRepoListProps {
  token: string;
  onSuccess: (url: string) => void;
}

export default function GithubRepoList({ token, onSuccess }: GithubRepoListProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('sync: deploy custom code via GrixChat');
  const [syncType, setSyncType] = useState<'app' | 'zip'>('zip'); // Default to ZIP upload per user request
  
  // File state structures
  const [zipFiles, setZipFiles] = useState<ExtractedFile[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<RemoteFileRef[]>([]);
  
  // App codebase selection state
  const [appCodeFiles, setAppCodeFiles] = useState<string[]>([]);
  const [selectedAppFiles, setSelectedAppFiles] = useState<string[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [loadingAppFiles, setLoadingAppFiles] = useState(false);
  
  const [isPushing, setIsPushing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [noChangesWarning, setNoChangesWarning] = useState(false);

  // Load repository directories on token change
  useEffect(() => {
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const response = await axios.get<Repository[]>('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: { Authorization: `token ${token}` }
        });
        setRepos(response.data || []);
      } catch (err: any) {
        setErrorMessage('Failed to fetch key repositories. Check token or connectivity.');
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [token]);

  // Load codebase directories on mount for local backup mode
  useEffect(() => {
    const fetchLocalFilesList = async () => {
      setLoadingAppFiles(true);
      try {
        const res = await axios.get('/api/github/list-files');
        if (res.data && res.data.files) {
          const files = res.data.files.filter((f: string) => !f.includes('package-lock.json') && !f.includes('node_modules') && !f.includes('dist'));
          setAppCodeFiles(files);
          const defaults = files.filter((f: string) => f.includes('schema') || f.includes('.env.example') || f === 'package.json');
          setSelectedAppFiles(defaults.length > 0 ? defaults : files.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed listing current code files', err);
      } finally {
        setLoadingAppFiles(false);
      }
    };
    fetchLocalFilesList();
  }, []);

  // Fetch remote SHA hashes when depository details change to establish diffs
  const fetchRemoteHashes = async (owner: string, repoName: string, targetBranch: string) => {
    try {
      const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/branches/${targetBranch}`, {
        headers: { Authorization: `token ${token}` }
      });
      const baseTreeSha = branchRes.data.commit.commit.tree.sha;
      const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/git/trees/${baseTreeSha}?recursive=1`, {
        headers: { Authorization: `token ${token}` }
      });
      if (treeRes.data && treeRes.data.tree) {
        const refs = treeRes.data.tree
          .filter((n: any) => n.type === 'blob')
          .map((n: any) => ({ path: n.path, sha: n.sha }));
        setRemoteFiles(refs);
      }
    } catch (e) {
      console.warn('Unable to query remote codebase index tree. Assuming initial push.', e);
      setRemoteFiles([]);
    }
  };

  useEffect(() => {
    if (selectedRepo) {
      fetchRemoteHashes(selectedRepo.owner.login, selectedRepo.name, branch);
    }
  }, [selectedRepo, branch]);

  const handleZipFilesReady = (filesReady: ExtractedFile[]) => {
    setZipFiles(filesReady);
    setSelectedPaths(filesReady.map(f => f.path)); // Auto check all
    setNoChangesWarning(false);
  };

  const handlePush = async () => {
    if (!selectedRepo) return;
    
    // Choose what list to process
    let finalPayload: { path: string, content: string }[] = [];
    setIsPushing(true);
    setErrorMessage('');
    setNoChangesWarning(false);

    try {
      if (syncType === 'zip') {
        if (selectedPaths.length === 0) {
          throw new Error('Please select at least one file to commit to the repository.');
        }
        finalPayload = zipFiles
          .filter(zf => selectedPaths.includes(zf.path))
          .map(zf => ({ path: zf.path, content: zf.content }));
      } else {
        if (selectedAppFiles.length === 0) {
          throw new Error('Choose at least one local source file to back up.');
        }
        setStatusMessage('Compressing and loading codebase files...');
        for (const pathStr of selectedAppFiles) {
          const res = await axios.get(`/api/github/get-file-content?path=${encodeURIComponent(pathStr)}`);
          if (res.data && res.data.content) {
            finalPayload.push({ path: pathStr, content: res.data.content });
          }
        }
      }

      setStatusMessage('Analyzing files differences client-side...');
      const pushRes = await axios.post('/api/github/push-batch', {
        token,
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        files: finalPayload,
        message: commitMessage,
        branch: branch
      });

      if (pushRes.data) {
        if (pushRes.data.noChanges) {
          setNoChangesWarning(true);
        } else {
          onSuccess(pushRes.data.html_url || `https://github.com/${selectedRepo.full_name}`);
        }
      }
    } catch (err: any) {
      const detail = err.response?.data?.message || err.message;
      setErrorMessage(detail);
    } finally {
      setIsPushing(false);
    }
  };

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()));
  const filteredAppFiles = appCodeFiles.filter(f => f.toLowerCase().includes(fileSearch.toLowerCase()));

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3 text-xs font-bold flex gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {noChangesWarning && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-amber-600 font-semibold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="font-extrabold text-xs">Everything is already up-to-date!</p>
            <p>Your local ZIP/Codebase directory content matches the remote repository exactly. No modifications to commit.</p>
          </div>
        </div>
      )}

      {/* Repository search picker */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] ml-1">
          Select Target Repository
        </label>
        {loadingRepos ? (
          <div className="flex items-center gap-2 text-xs py-3 text-[var(--text-secondary)]">
            <RefreshCw size={13} className="animate-spin text-primary" />
            <span>Retrieving repositories list...</span>
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]/60 p-3 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter repositories..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                className="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--box-text)] focus:outline-none"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>

            <div className="max-h-36 overflow-y-auto no-scrollbar border border-[var(--border-color)]/30 rounded-xl divide-y divide-[var(--border-color)]/10">
              {filteredRepos.length === 0 ? (
                <p className="text-[10px] text-[var(--text-secondary)] text-center py-4">No matching repositories found</p>
              ) : (
                filteredRepos.map(r => {
                  const isSelected = selectedRepo?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRepo(r);
                        setBranch(r.default_branch || 'main');
                        setZipFiles([]);
                      }}
                      className={`w-full text-left p-2.5 text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'bg-primary/10 text-primary animate-pulse' : 'text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50'}`}
                    >
                      <span className="truncate">{r.full_name}</span>
                      {isSelected && <span className="text-[9px] bg-primary text-white font-black uppercase px-1.5 py-0.5 rounded">Selected</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {selectedRepo && (
        <>
          {/* Choice of upload sync methodology */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] ml-1">
              Backup Upload Methodology
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-2xl">
              <button
                type="button"
                onClick={() => setSyncType('zip')}
                className={`py-2 px-3 rounded-xl font-black text-[11px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${syncType === 'zip' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <FileArchive size={13} />
                <span>Upload ZIP File</span>
              </button>
              <button
                type="button"
                onClick={() => setSyncType('app')}
                className={`py-2 px-3 rounded-xl font-black text-[11px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${syncType === 'app' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <FolderClosed size={13} />
                <span>Local App Codebase</span>
              </button>
            </div>
          </div>

          {/* Branch configuration */}
          <div className="grid grid-cols-2 gap-3 bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-2xl p-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                Target Branch
              </label>
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                <GitBranch size={13} className="text-emerald-500" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold w-full p-0 shrink"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                Connected Repo
              </label>
              <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                {selectedRepo.name}
              </div>
            </div>
          </div>

          {/* Core file selector body */}
          {syncType === 'zip' ? (
            <div className="space-y-3">
              {zipFiles.length === 0 ? (
                <GithubZipUploader onFilesExtracted={handleZipFilesReady} />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                      Extracted ZIP Dashboard
                    </span>
                    <button
                      onClick={() => setZipFiles([])}
                      className="text-[10px] font-black text-rose-500 uppercase cursor-pointer hover:underline"
                    >
                      Reset ZIP File
                    </button>
                  </div>
                  <GithubFileList
                    files={zipFiles}
                    remoteFiles={remoteFiles}
                    onUpdateFile={(index, updated) => {
                      const copy = [...zipFiles];
                      copy[index] = updated;
                      setZipFiles(copy);
                    }}
                    onRemoveFile={(index) => {
                      const copy = zipFiles.filter((_, idx) => idx !== index);
                      setZipFiles(copy);
                    }}
                    selectedPaths={selectedPaths}
                    onTogglePath={(path) => {
                      if (selectedPaths.includes(path)) {
                        setSelectedPaths(selectedPaths.filter(p => p !== path));
                      } else {
                        setSelectedPaths([...selectedPaths, path]);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            // Local app codebase checklist
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  GrixChat Code Files ({selectedAppFiles.length}/{appCodeFiles.length})
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedAppFiles(selectedAppFiles.length === filteredAppFiles.length ? [] : filteredAppFiles)}
                  className="text-[10px] font-black text-primary uppercase cursor-pointer"
                >
                  Toggle All
                </button>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-2xl p-3 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter standard codebase files..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="w-full text-xs py-2 pl-8 pr-3 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--box-text)] rounded-xl focus:outline-none"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>

                {loadingAppFiles ? (
                  <div className="text-center py-4 text-xs text-[var(--text-secondary)]">Scanning...</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-[var(--border-color)]/30 rounded-xl divide-y divide-[var(--border-color)]/10 font-mono text-[10px] no-scrollbar">
                    {filteredAppFiles.map(file => {
                      const isChecked = selectedAppFiles.includes(file);
                      return (
                        <div
                          key={file}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedAppFiles(selectedAppFiles.filter(a => a !== file));
                            } else {
                              setSelectedAppFiles([...selectedAppFiles, file]);
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-[var(--bg-main)]/50 transition-colors cursor-pointer select-none"
                        >
                          <button className="text-[var(--text-secondary)] shrink-0">
                            {isChecked ? <CheckSquare size={13} className="text-primary" /> : <Square size={13} />}
                          </button>
                          <Folder size={11} className="text-amber-500 shrink-0" />
                          <span className="truncate text-[var(--text-primary)] font-semibold">{file}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commit Message Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] ml-1">
              Commit Message Description
            </label>
            <input
              type="text"
              placeholder="Commit custom sync codebase"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]/60 text-[var(--box-text)] focus:outline-none font-bold"
            />
          </div>

          <button
            onClick={handlePush}
            disabled={isPushing || (syncType === 'zip' && zipFiles.length === 0)}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-zinc-700/50 text-white font-black text-xs uppercase h-11 rounded-xl shadow-md transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isPushing ? (
              <>
                <RefreshCw size={13} className="animate-spin text-white" />
                <span>{statusMessage}</span>
              </>
            ) : (
              <>
                <GitCommit size={14} />
                <span>Publish Smart Delta Commit</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
