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
  Info as InfoIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { CommonSearchBar } from '../../../components/common/CommonSearchBar';

interface SettingsListProps {
  showHeader?: boolean;
}

export default function SettingsList({ showHeader = false }: SettingsListProps) {
  const { userData } = useAuth();
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

  const filteredItems = settingsItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sub && item.sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col bg-[var(--bg-card)]">
      {/* Search component */}
      <CommonSearchBar 
        placeholder="Search settings..."
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Main mapping layout with high-polished style requested by user */}
      <div className="flex flex-col mt-1 divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
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
              className="w-full flex items-center gap-3.5 px-4 py-2.5 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer select-none border-none outline-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <item.icon size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  {item.label}
                </h4>
                {item.sub && (
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                    {item.sub}
                  </p>
                )}
              </div>
              <ChevronRight 
                size={16} 
                className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" 
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
