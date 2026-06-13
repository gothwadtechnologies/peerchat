import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { MessageCircle, Share2, Search, Phone, UserCircle, Settings, Bell } from 'lucide-react';
import { motion } from 'motion/react';

export default function DesktopSidebar() {
  const location = useLocation();
  const { id } = useParams();
  const isChatActive = !!id;

  const navItems = [
    { icon: MessageCircle, path: '/chats', label: 'Chats' },
    { icon: Share2, path: '/share', label: 'Share' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: Phone, path: '/calls', label: 'Calls' },
    { icon: UserCircle, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="hidden lg:flex w-16 h-full flex-col items-center py-4 bg-[var(--bg-card)] border-r border-[var(--border-color)]/30 shrink-0 z-[60]">
      <div className="flex-1 flex flex-col items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/chats' && location.pathname.startsWith('/chat/'));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              title={item.label}
              className={`p-3 rounded-xl transition-all relative group ${isActive ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105' : 'text-[var(--nav-text)]/60 hover:bg-[var(--border-color)]/50 hover:text-[var(--text-primary)]'}`}
            >
              <Icon size={24} />
              {!isActive && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-4 mt-auto">
        <Link 
          to="/notifications" 
          title="Notifications"
          className={`p-3 rounded-xl transition-all relative group ${location.pathname === '/notifications' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105' : 'text-[var(--nav-text)]/60 hover:bg-[var(--border-color)]/50 hover:text-[var(--text-primary)]'}`}
        >
          <Bell size={24} />
          {location.pathname !== '/notifications' && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Notifications
            </div>
          )}
        </Link>
        <Link 
          to="/settings" 
          title="Settings"
          className={`p-3 rounded-xl transition-all relative group ${location.pathname === '/settings' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105' : 'text-[var(--nav-text)]/60 hover:bg-[var(--border-color)]/30 hover:text-[var(--text-primary)]'}`}
        >
          <Settings size={24} />
          {location.pathname !== '/settings' && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
