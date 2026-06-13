import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Bell, 
  MessageSquare, 
  Sliders, 
  Star, 
  VolumeX, 
  UserMinus, 
  HelpCircle, 
  Lock, 
  ChevronRight,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { CommonSearchBar } from '../../../components/common/CommonSearchBar';
import Avatar from '../../../components/common/Avatar';
import { truncateToChars } from '../../../utils/bioHelper';

export default function ProfileSettingsContent() {
  const { user: authUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsItems = [
    { icon: Users, label: 'Account Settings', sub: 'Change email, password, delete account', onClick: () => navigate('/account-settings') },
    { icon: Lock, label: 'Privacy Settings', sub: userData?.isPrivate ? 'Private Account' : 'Public Account', onClick: () => navigate('/privacy-settings') },
    { icon: Shield, label: 'App Lock PIN', sub: 'Enable PIN/Passcode protection', onClick: () => navigate('/app-lock') },
    { icon: Bell, label: 'Notifications & Sounds', sub: 'Ringtones, Vibrations & Alerts', onClick: () => navigate('/notifications-settings') },
    { icon: MessageSquare, label: 'Chat Customizer & Wallpaper', sub: 'Bubbles shape, text size, wallpapers', onClick: () => navigate('/chat-settings') },
    { icon: Sliders, label: 'System Preferences', sub: 'App theme, network download, local database Backups', onClick: () => navigate('/app-preferences') },
    { icon: Star, label: 'Favorites Feed', sub: 'Manage star list curation', onClick: () => navigate('/favorites') },
    { icon: VolumeX, label: 'Muted Accounts', sub: 'Silenced chat channels', onClick: () => navigate('/muted-accounts') },
    { icon: UserMinus, label: 'Blocked Accounts', sub: 'Banned chat list users', onClick: () => navigate('/blocked-accounts') },
    { icon: HelpCircle, label: 'Grixvibe FAQ & Support', sub: 'Knowledgebase and system status', onClick: () => navigate('/help') },
    { icon: InfoIcon, label: 'About App', sub: 'Grixvibe V1.2.0 Stable Build', onClick: () => navigate('/app-info') },
  ];

  const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const profilePic = userData?.photoURL || (userData as any)?.photo_url || authUser?.user_metadata?.avatar_url || DEFAULT_LOGO;

  const filteredItems = settingsItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sub && item.sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col bg-[var(--bg-card)] overflow-hidden animate-fade-in touch-pan-y">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-[var(--bg-card)]">
        {/* Scrollable Reusable Search Bar */}
        <CommonSearchBar 
          placeholder="Search settings..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Settings options list */}
        <div className="flex flex-col mt-1 divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
          {searchQuery === '' && (
            <>
              {/* Profile card click element */}
              <div 
                onClick={() => navigate('/edit-profile')}
                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer select-none"
              >
                <Avatar 
                  url={profilePic} 
                  type="direct" 
                  name={userData?.fullName || userData?.username || 'GrixChat User'} 
                  isOnline={false} 
                />
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-[14.5px] truncate font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight mb-0.5">
                    {userData?.fullName || 'GrixChat User'}
                  </h3>
                  <p className="text-[13px] truncate leading-snug text-[var(--text-secondary)] opacity-75">
                    @{userData?.username || 'username'}
                  </p>
                </div>
                <ChevronRightIcon size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
              </div>

              {/* Bio block display */}
              {userData?.bio && (
                <div 
                  onClick={() => navigate('/edit-profile')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer select-none"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                    <InfoIcon size={20} className="stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="text-[10px] font-black text-[#0494f4] uppercase tracking-wider block mb-0.5 font-sans opacity-95">
                      Bio
                    </span>
                    <p className="text-[13px] text-[var(--text-primary)] leading-normal break-words font-medium italic">
                      "{truncateToChars(userData.bio)}"
                    </p>
                  </div>
                  <ChevronRightIcon size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
                </div>
              )}
            </>
          )}

          {/* Render filtered settings option list */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 select-none px-4">
              <p className="text-[13px] font-bold text-[var(--text-secondary)]">No settings matched your search</p>
              <p className="text-[11px] text-[var(--text-secondary)]/60 max-w-xs">Try searching for app preferences, account, password, sound, block etc.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <button 
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer select-none border-none outline-none"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                  <item.icon size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-[14.5px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                    {item.label}
                  </h4>
                  {item.sub && (
                    <p className="text-[13px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                      {item.sub}
                    </p>
                  )}
                </div>
                <ChevronRightIcon size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
