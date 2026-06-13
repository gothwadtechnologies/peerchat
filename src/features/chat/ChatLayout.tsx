import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ChatsTab from './ChatsTab';
import { motion } from 'motion/react';
import { APP_CONFIG } from '../../config/appConfig';

export default function ChatLayout() {
  const location = useLocation();
  const isChatActive = location.pathname.startsWith('/chat/') && location.pathname !== '/chat/';

  return (
    <div className="h-full flex overflow-hidden bg-[var(--bg-main)]">
      {/* Mobile-style View: Either Chat List or Active Chat */}
      {!isChatActive ? (
        <div className="w-full h-full flex flex-col bg-[var(--bg-card)] shrink-0">
          <ChatsTab />
        </div>
      ) : (
        <div className="flex-1 h-full flex flex-col bg-[var(--bg-chat)] relative">
          <Outlet />
        </div>
      )}
    </div>
  );
}
