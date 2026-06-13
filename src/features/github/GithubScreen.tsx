import React, { useState, useEffect } from 'react';
import { ArrowLeft, Github, Link, RefreshCw, Key, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import GithubProfileHeader from './components/GithubProfileHeader';
import GithubRepoList from './components/GithubRepoList';
import { storage } from '../../services/StorageService';

interface GitHubProfile {
  login: string;
  avatar_url: string;
  name: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  html_url: string;
}

export default function GithubScreen() {
  const navigate = useNavigate();
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [authUrlLoading, setAuthUrlLoading] = useState(false);
  const [commitSuccessUrl, setCommitSuccessUrl] = useState<string | null>(null);

  // Load token on mount
  useEffect(() => {
    const token = storage.getItem('github_token');
    if (token) {
      setGithubToken(token);
      fetchGithubProfile(token);
    }
  }, []);

  const fetchGithubProfile = async (token: string) => {
    setLoadingProfile(true);
    try {
      const response = await axios.get<GitHubProfile>('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      setProfile(response.data);
    } catch (err: any) {
      console.error('Invalid token or GitHub unavailable', err);
      if (err.response?.status === 401) {
        // Clear expired/broken token
        storage.removeItem('github_token');
        setGithubToken(null);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // OAuth popup opener
  const handleOauthConnect = async () => {
    setAuthUrlLoading(true);
    try {
      const res = await axios.get('/api/github/auth-url');
      if (res.data && res.data.url) {
        // Open authorization popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          res.data.url, 
          'github-auth', 
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );

        // Add cross-window listener
        const handleMessageEvent = (event: MessageEvent) => {
          if (event.data && event.data.type === 'GITHUB_AUTH_SUCCESS') {
            const token = event.data.token;
            storage.setItem('github_token', token);
            setGithubToken(token);
            fetchGithubProfile(token);
            window.removeEventListener('message', handleMessageEvent);
          }
        };

        window.addEventListener('message', handleMessageEvent);
      }
    } catch (err) {
      console.error('Failed to get GitHub auth url', err);
      setShowManualInput(true); // Fallback to token
    } finally {
      setAuthUrlLoading(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    const token = manualToken.trim();
    storage.setItem('github_token', token);
    setGithubToken(token);
    fetchGithubProfile(token);
    setManualToken('');
  };

  const handleDisconnect = () => {
    storage.removeItem('github_token');
    setGithubToken(null);
    setProfile(null);
    setCommitSuccessUrl(null);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader title="GitHub Sync" />

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 pb-24">
        {/* Connection status section */}
        {!githubToken ? (
          <div className="space-y-4">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]/60 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Github size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[var(--text-primary)]">Sync with GitHub</h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
                  Securely link your account to sync your database templates, SQL files, and custom schemas directory straight into your remote repository.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleOauthConnect}
                  disabled={authUrlLoading}
                  className="w-full h-11 bg-zinc-900 border border-zinc-800 text-white active:scale-95 hover:bg-black transition-all rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {authUrlLoading ? (
                    <RefreshCw size={13} className="animate-spin text-white" />
                  ) : (
                    <Github size={14} className="fill-current" />
                  )}
                  <span>Connect GitHub Authorization</span>
                </button>

                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-xs text-[var(--text-secondary)] font-bold decoration-dotted underline cursor-pointer"
                >
                  Have a Personal Access Token? (PAT)
                </button>
              </div>
            </div>

            {showManualInput && (
              <form onSubmit={handleManualTokenSubmit} className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]/60 space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-black uppercase">
                  <Key size={13} className="text-amber-500" />
                  <span>Paste GitHub Access Token</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] leading-normal">
                  If the auth callback is restricted in PWA container, paste a token with <strong className="font-bold">repo</strong> scope here.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--box-text)] focus:outline-none placeholder:opacity-50 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all"
                  >
                    Load
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : loadingProfile ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="animate-spin text-emerald-500" size={24} />
            <span className="text-xs text-[var(--text-secondary)] font-bold">Verifying connected credentials...</span>
          </div>
        ) : (
          profile && (
            <div className="space-y-4">
              <GithubProfileHeader profile={profile} onDisconnect={handleDisconnect} />
              
              {commitSuccessUrl && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-emerald-600 font-semibold shadow-sm">
                  <CheckCircle size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p>Repository syncing complete! Your commits have been safely applied.</p>
                    <a 
                      href={commitSuccessUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-500 font-extrabold underline cursor-pointer"
                    >
                      View Commit on GitHub <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              <GithubRepoList token={githubToken} onSuccess={(url) => setCommitSuccessUrl(url)} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
