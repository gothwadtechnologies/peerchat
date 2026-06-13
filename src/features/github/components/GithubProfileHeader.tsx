import React from 'react';
import { LogOut, User, GitFork, BookOpen } from 'lucide-react';

interface GitHubProfile {
  login: string;
  avatar_url: string;
  name: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  html_url: string;
}

interface GithubProfileHeaderProps {
  profile: GitHubProfile;
  onDisconnect: () => void;
}

export default function GithubProfileHeader({ profile, onDisconnect }: GithubProfileHeaderProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]/60 shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <img 
          src={profile.avatar_url} 
          alt={profile.login} 
          className="w-16 h-16 rounded-full border border-[var(--border-color)] object-cover bg-zinc-100"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-[var(--text-primary)] truncate">
            {profile.name || profile.login}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-mono truncate">
            @{profile.login}
          </p>
          {profile.bio && (
            <p className="text-[11px] text-[var(--text-secondary)]/90 leading-normal line-clamp-2 mt-1">
              {profile.bio}
            </p>
          )}
        </div>
        <button
          onClick={onDisconnect}
          className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="Disconnect Account"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color)]/30">
        <div className="bg-[var(--bg-main)]/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center border border-[var(--border-color)]/10">
          <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
            <BookOpen size={13} className="text-blue-500" />
            {profile.public_repos}
          </span>
          <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-extrabold mt-0.5">
            Public Repos
          </span>
        </div>
        <div className="bg-[var(--bg-main)]/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center border border-[var(--border-color)]/10">
          <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
            <User size={13} className="text-emerald-500" />
            {profile.followers}
          </span>
          <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-extrabold mt-0.5">
            Followers
          </span>
        </div>
      </div>
    </div>
  );
}
