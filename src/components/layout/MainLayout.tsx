import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff } from 'lucide-react';
import { useCall } from '../../providers/CallProvider';
import TopNav from './TopNav.tsx';
import TabBottom from './TabBottom.tsx';
import ResourcesNav, { TabType } from './ResourcesNav.tsx';
import { useNav } from '../../contexts/NavContext.tsx';
import PWAInstallPrompt from './PWAInstallPrompt.tsx';
import { useAuth } from '../../providers/AuthProvider';
import DesktopSidebar from './DesktopSidebar';
import DesktopWelcome from './DesktopWelcome';

// Lazy loading our tabs for keep-alive container
const ChatsTab = React.lazy(() => import('../../features/chat/ChatsTab'));
const ShareTab = React.lazy(() => import('../../features/chat/ShareTab'));
const SearchTab = React.lazy(() => import('../../features/search/SearchTab'));
const CallsTab = React.lazy(() => import('../../features/call/CallsTab'));
const ProfileTab = React.lazy(() => import('../../features/profile/ProfileTab'));
const SettingsMainScreen = React.lazy(() => import('../../features/settings/SettingsMainScreen'));
const NotificationsScreen = React.lazy(() => import('../../features/notifications/NotificationsScreen'));

// Paths where BottomNav should be visible
const TAB_PATHS = ['/', '/chats', '/share', '/search', '/calls', '/profile', '/notifications', '/reels'];
const MAIN_TABS = ['/', '/chats', '/share', '/search', '/calls', '/profile'];

const getDesktopParentPane = (pathname: string): 'chats' | 'share' | 'settings' | 'notifications' | null => {
  // If exactly on a main list screen, return null to direct-route in middle list pane
  if (pathname === '/chats' || 
      pathname === '/share' || 
      pathname === '/search' || 
      pathname === '/calls' || 
      pathname === '/profile' || 
      pathname === '/settings' || 
      pathname === '/notifications') {
    return null;
  }

  // Chats details paths
  if (pathname.startsWith('/chat/') || 
      pathname.startsWith('/chats/') || 
      pathname === '/messages') {
    return 'chats';
  }

  // Share details paths
  if (pathname.startsWith('/share/')) {
    return 'share';
  }

  // Notifications details paths
  if (pathname.startsWith('/notifications/')) {
    return 'notifications';
  }

  // Settings sub-details paths
  const settingsPaths = [
    '/edit-profile',
    '/privacy-settings',
    '/chat-settings',
    '/app-preferences',
    '/account-settings',
    '/active-sessions',
    '/app-lock',
    '/setup-lock',
    '/verify-lock',
    '/notifications-settings',
    '/data-usage',
    '/help',
    '/app-info',
    '/github',
    '/favorites',
    '/blocked-accounts',
    '/muted-accounts',
    '/user/'
  ];
  if (settingsPaths.some(path => pathname.startsWith(path))) {
    return 'settings';
  }

  return null;
};

export default function MainLayout() {
  const location = useLocation();
  const { isResourcesNavOpen, setIsResourcesNavOpen } = useNav();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { activeCall, endCall, timer } = useCall();

  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  
  const isChatScreen = location.pathname.startsWith('/chat/') && !location.pathname.endsWith('/settings');
  const showBottomNav = TAB_PATHS.includes(location.pathname);
  
  // Paths where TopNav should be visible
  const showTopNav = TAB_PATHS.includes(location.pathname);
  
  // Keep-Alive state
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const path = location.pathname;
    if (user && MAIN_TABS.includes(path)) {
      setVisitedTabs((prev) => {
        if (prev[path]) return prev;
        return { ...prev, [path]: true };
      });
    }
  }, [location.pathname, user]);

  const isMainTab = !!user && MAIN_TABS.includes(location.pathname);

  // Determine current tab for ResourcesNav
  const getTab = (path: string): TabType | null => {
    return null;
  };

  const currentTab = getTab(location.pathname);

  // Reset visibility on tab change - Keep it open by default only on main tabs
  useEffect(() => {
    if (TAB_PATHS.includes(location.pathname)) {
      setIsResourcesNavOpen(true);
    } else {
      setIsResourcesNavOpen(false);
    }
  }, [location.pathname, setIsResourcesNavOpen]);

  // Handle Desktop Rendering path
  if (isDesktop && user) {
    const parentType = getDesktopParentPane(location.pathname);
    const isDesktopDetailActive = !!parentType;

    const renderDesktopParentComponent = () => {
      switch (parentType) {
        case 'chats':
          return <ChatsTab />;
        case 'share':
          return <ShareTab />;
        case 'settings':
          return <SettingsMainScreen />;
        case 'notifications':
          return <NotificationsScreen />;
        default:
          return null;
      }
    };

    return (
      <div className="h-[100dvh] w-screen flex flex-row overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
        {/* Leftmost slim toolbar - WhatsApp Web style */}
        <DesktopSidebar />

        {/* Middle Column Pane (Sidebar list / menu panel) */}
        {/* We use [transform:translate(0,0)] so that position:fixed elements are bounded inside this column */}
        <div className="w-[380px] h-full flex flex-col border-r border-[var(--border-color)]/20 bg-[var(--bg-card)] shrink-0 overflow-hidden relative [transform:translate3d(0,0,0)] z-20">
          
          {/* Realtime Call indicator on desktop */}
          {activeCall && (
            <div className="bg-emerald-600 text-white px-4 py-2 border-b border-emerald-500/25 flex items-center justify-between z-30 shrink-0">
              <Link 
                to={`/call/${activeCall.otherUserId}?type=${activeCall.type}&role=${activeCall.role}&callId=${activeCall.id}`}
                className="flex-1 text-left"
              >
                <p className="text-[10px] font-black tracking-wider uppercase leading-none">📞 Active Call</p>
                <p className="text-[11px] font-medium leading-none opacity-90 mt-1 truncate">
                  With {activeCall.receiver?.full_name || 'Grixvibe User'} • {formatTimer(timer)}
                </p>
              </Link>
              <button 
                onClick={endCall} 
                className="p-1 px-2 border border-white/20 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-[10px] font-bold"
              >
                Hang up
              </button>
            </div>
          )}

          {/* Render active list component with a dynamic Suspense state */}
          <div className="flex-1 overflow-hidden relative h-full">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-[var(--bg-card)]">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              {isDesktopDetailActive ? renderDesktopParentComponent() : <Outlet />}
            </Suspense>
          </div>
        </div>

        {/* Right Column Pane (Detail workspace panel / active ChatScreen / subpage) */}
        {/* We use [transform:translate(0,0)] so that position:fixed elements are bounded inside this column */}
        <div className="flex-grow h-full bg-[var(--bg-main)] overflow-hidden relative [transform:translate3d(0,0,0)] z-10 border-l border-[var(--border-color)]/10">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-[var(--bg-main)]">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            {isDesktopDetailActive ? <Outlet /> : <DesktopWelcome />}
          </Suspense>
        </div>

        {/* Optional background PWA launcher prompt */}
        <PWAInstallPrompt />
      </div>
    );
  }

  // Mobile Rendering path (keeps original horizontal tab keep-alive system unchanged)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {showTopNav && <TopNav />}
      
      {/* Active Call Floating Bar (WhatsApp-Style) */}
      <AnimatePresence>
        {activeCall && !location.pathname.includes('/call/') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between border-b border-emerald-500/35 overflow-hidden shadow-md z-[51]"
          >
            <Link 
              to={`/call/${activeCall.otherUserId}?type=${activeCall.type}&role=${activeCall.role}&callId=${activeCall.id}`} 
              className="flex-1 px-4 py-2 flex items-center gap-3 active:bg-emerald-700/50 transition-colors"
            >
              <div className="relative flex items-center justify-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-tight leading-none truncate">
                  {activeCall.type === 'video' ? '📺 Video Call' : '📞 Voice Call'} active with {activeCall.receiver?.full_name || 'Grixvibe User'}
                </p>
                <p className="text-[10px] font-mono leading-none opacity-80 mt-1">
                  Tap to return • {formatTimer(timer)}
                </p>
              </div>
            </Link>
            <div className="px-3 border-l border-emerald-500/20 py-1.5 flex items-center">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  endCall();
                }}
                className="bg-rose-500 hover:bg-rose-600 active:scale-90 p-1.5 rounded-full shadow-md text-white transition-all cursor-pointer"
                title="Hang up"
              >
                <PhoneOff size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Static header bar without any slide heights and delays */}
      {showTopNav && currentTab && isResourcesNavOpen && (
        <div className="shrink-0 z-40 bg-[var(--bg-card)]">
          <ResourcesNav tab={currentTab} />
        </div>
      )}
      
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-x-hidden relative no-scrollbar ${isChatScreen || TAB_PATHS.includes(location.pathname) ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
      >
          {/* Keep-Alive Tabs: once loaded, we keep them persistent and mounted with isolated Suspense boundaries */}
          {(visitedTabs['/'] || visitedTabs['/chats']) && (
            <div 
              className={`h-full w-full absolute inset-0 ${(location.pathname === '/' || location.pathname === '/chats') ? 'visible z-10 pointer-events-auto opacity-100' : 'invisible z-0 pointer-events-none opacity-0'}`}
            >
              <Suspense fallback={null}>
                <ChatsTab />
              </Suspense>
            </div>
          )}

          {visitedTabs['/share'] && (
            <div 
              className={`h-full w-full absolute inset-0 ${location.pathname === '/share' ? 'visible z-10 pointer-events-auto opacity-100' : 'invisible z-0 pointer-events-none opacity-0'}`}
            >
              <Suspense fallback={null}>
                <ShareTab />
              </Suspense>
            </div>
          )}

          {visitedTabs['/search'] && (
            <div 
              className={`h-full w-full absolute inset-0 ${location.pathname === '/search' ? 'visible z-10 pointer-events-auto opacity-100' : 'invisible z-0 pointer-events-none opacity-0'}`}
            >
              <Suspense fallback={null}>
                <SearchTab />
              </Suspense>
            </div>
          )}
          
          {visitedTabs['/calls'] && (
            <div 
              className={`h-full w-full absolute inset-0 ${location.pathname === '/calls' ? 'visible z-10 pointer-events-auto opacity-100' : 'invisible z-0 pointer-events-none opacity-0'}`}
            >
              <Suspense fallback={null}>
                <CallsTab />
              </Suspense>
            </div>
          )}
          
          {visitedTabs['/profile'] && (
            <div 
              className={`h-full w-full absolute inset-0 ${location.pathname === '/profile' ? 'visible z-10 pointer-events-auto opacity-100' : 'invisible z-0 pointer-events-none opacity-0'}`}
            >
              <Suspense fallback={null}>
                <ProfileTab />
              </Suspense>
            </div>
          )}

        {/* Regular Routes render inside Outlet ONLY when not a main tab */}
        {!isMainTab && <Outlet />}
      </div>
      
      {showBottomNav && <TabBottom />}
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
