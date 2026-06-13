import React, { useEffect, useState, useRef } from 'react';
import { APP_CONFIG } from './config/appConfig';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LockService } from './services/LockService.ts';
import { CacheService } from './services/CacheService.ts';
import NotificationHandler from './components/NotificationHandler.tsx';
import DesktopSidebar from './components/layout/DesktopSidebar';
import IncomingCallNotification from './components/incoming-call/IncomingCallNotification.tsx';
import { motion } from 'motion/react';
import { useAuth } from './providers/AuthProvider';
import { useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from 'react-error-boundary';
import SplashScreen from './components/SplashScreen';
import DeveloperConsole from './components/DeveloperConsole';

function ErrorFallback({ error }: { error: any }) {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg-main)] p-6 text-center">
      <div className="w-16 h-16 bg-red-100/10 text-red-600 rounded-full flex items-center justify-center mb-4">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <img src={APP_CONFIG.LOGO_URL} className="w-10 h-10 object-contain grayscale opacity-50" alt="Error" />
        </motion.div>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">{error.message}</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
      >
        Restart App
      </button>
    </div>
  );
}

import ProfileTab from './features/profile/ProfileTab';

// Lazy Loading Features & Screens
const ChatsTab = React.lazy(() => import('./features/chat/ChatsTab'));
const ShareTab = React.lazy(() => import('./features/chat/ShareTab'));
const SearchTab = React.lazy(() => import('./features/search/SearchTab'));
const ChatLayout = React.lazy(() => import('./features/chat/ChatLayout'));
const ChatScreen = React.lazy(() => import('./features/chat/ChatScreen'));
const MessagesListScreen = React.lazy(() => import('./features/chat/MessagesListScreen'));
const HideChatScreen = React.lazy(() => import('./features/chat/HideChatScreen'));
const ArchivedChatScreen = React.lazy(() => import('./features/chat/ArchivedChatScreen'));
const HideChatSettings = React.lazy(() => import('./features/chat/HideChatSettings'));
const MessageRequestsScreen = React.lazy(() => import('./features/chat/MessageRequestsScreen'));
const SearchUserScreen = React.lazy(() => import('./features/chat/SearchUserScreen'));
const GrixAIScreen = React.lazy(() => import('./features/grixai/GrixAIScreen'));
const ChatSettingsScreen = React.lazy(() => import('./features/chat/ChatSettingsScreen'));

const FriendsScreen = React.lazy(() => import('./features/search/FriendsScreen'));

const StoryWatcherScreen = React.lazy(() => import('./features/stories/StoryWatcherScreen'));
const StoryCreationScreen = React.lazy(() => import('./features/stories/StoryCreationScreen'));
const NotificationsScreen = React.lazy(() => import('./features/notifications/NotificationsScreen.tsx'));
const LikeNotificationsScreen = React.lazy(() => import('./features/notifications/LikeNotificationsScreen.tsx'));

// ProfileTab directly imported above
const EditProfileScreen = React.lazy(() => import('./features/profile/EditProfileScreen'));
const UserProfileScreen = React.lazy(() => import('./features/profile/UserProfileScreen'));
const GrixAIProfile = React.lazy(() => import('./features/grixai/GrixAIProfile'));


const CallsTab = React.lazy(() => import('./features/call/CallsTab'));

const PrivacySettingsScreen = React.lazy(() => import('./features/settings/PrivacySettingsScreen'));
const SettingsMainScreen = React.lazy(() => import('./features/settings/SettingsMainScreen'));
const AppPreferencesScreen = React.lazy(() => import('./features/settings/AppPreferencesScreen'));
const ChatSettingsMainScreen = React.lazy(() => import('./features/settings/ChatSettingsMainScreen'));
// SettingsScreen directly imported above
const AccountSettingsScreen = React.lazy(() => import('./features/settings/AccountSettingsScreen'));
const ActiveSessionsScreen = React.lazy(() => import('./features/settings/ActiveSessionsScreen'));
const NotificationsSettingsScreen = React.lazy(() => import('./features/settings/NotificationsSettingsScreen'));
const HelpScreen = React.lazy(() => import('./features/settings/HelpScreen'));
const HelpFaqScreen = React.lazy(() => import('./features/settings/HelpFaqScreen'));
const HelpContactScreen = React.lazy(() => import('./features/settings/HelpContactScreen'));
const AppInfoScreen = React.lazy(() => import('./features/settings/AppInfoScreen'));
const GithubScreen = React.lazy(() => import('./features/github/GithubScreen'));
const FavoritesScreen = React.lazy(() => import('./features/settings/FavoritesScreen'));
const BlockedAccountsScreen = React.lazy(() => import('./features/settings/BlockedAccountsScreen'));
const MutedAccountsScreen = React.lazy(() => import('./features/settings/MutedAccountsScreen'));
const DataUsageScreen = React.lazy(() => import('./features/settings/DataUsageScreen'));



const PrivacyPolicyScreen = React.lazy(() => import('./features/legal/PrivacyPolicyScreen'));
const TermsAndConditionsScreen = React.lazy(() => import('./features/legal/TermsAndConditionsScreen'));

const AppLockScreen = React.lazy(() => import('./features/lock/AppLockScreen'));
const SetupLockScreen = React.lazy(() => import('./features/lock/SetupLockScreen'));
const VerifyLockScreen = React.lazy(() => import('./features/lock/VerifyLockScreen'));
const GlobalLockScreen = React.lazy(() => import('./features/lock/GlobalLockScreen'));

const CallScreen = React.lazy(() => import('./features/call/CallScreen'));

import { storage, safeSessionStorage } from './services/StorageService.ts';
import MainLayout from './components/layout/MainLayout.tsx';
import { LayoutProvider } from './contexts/LayoutContext.tsx';
import { NavProvider } from './contexts/NavContext.tsx';

const ImagePreviewScreen = React.lazy(() => import('./features/chat/ImagePreviewScreen'));

export default function App() {
  const { user, userData, loading: authLoading, isAuthReady } = useAuth();
  const { resolvedTheme } = useTheme();
  const [splashLoading, setSplashLoading] = useState(true);
  const [isDevConsoleOpen, setDevConsoleOpen] = useState(false);
  const location = useLocation();
  const initialMountCheckedRef = useRef(false);

  // Handle Event / Key triggers for Dev Console
  useEffect(() => {
    const handleToggle = () => setDevConsoleOpen(prev => !prev);
    window.addEventListener('toggle-dev-console', handleToggle);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDevConsoleOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('toggle-dev-console', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync visual viewport height for mobile keyboards / emoji section height changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--true-height', `${height}px`);
      
      // Auto-counter any rogue scrolls triggered by native inputs inside iframes
      if (vv && vv.offsetTop > 0) {
        window.scrollTo(0, 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    } else {
      window.addEventListener('resize', handleViewportResize);
    }

    handleViewportResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      } else {
        window.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  // Centralized Document Title Management
  useEffect(() => {
    const titles: { [key: string]: string } = {
      '/': 'Chats',
      '/chats': 'Chats',
      '/calls': 'Calls',
      '/reels': 'Reels',
      '/groups': 'Groups',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/login': 'Login',
      '/signup': 'Sign up',
      '/notifications': 'Notifications',
      '/create': 'New Post',
      '/stories/create': 'New Story',
      '/reels/create': 'New Reel',
      '/search': 'Search',
      '/grix-ai': 'Grix AI',
      '/verify-email': 'Verify Email',
      '/complete-profile': 'Complete Profile',
      '/forgot-password': 'Reset Password',
      '/app-lock': 'App Lock',
      '/privacy-policy': 'Privacy Policy',
      '/terms': 'Terms & Conditions',
      '/app-preferences': 'Preferences',
      '/app-info': 'About GrixChat',
      '/help': 'Help Center'
    };
    
    const path = location.pathname;
    let pageTitle = titles[path];

    // Handle dynamic paths
    if (!pageTitle) {
      if (path.startsWith('/user/')) pageTitle = 'User Profile';
      else if (path.startsWith('/chat/')) pageTitle = 'Chat';
      else if (path.startsWith('/stories/view/')) pageTitle = 'Story';
    }
    
    const suffix = 'GrixChat';
    if (pageTitle && path !== '/') {
      document.title = `${pageTitle} • ${suffix}`;
    } else {
      document.title = suffix;
    }
  }, [location]);

  // In-memory tab active unlock keeper (does NOT survive browser refresh/restorations)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return false; // Force lock validation on every fresh boot/load for absolute security
  });
  const [initialLockCheckDone, setInitialLockCheckDone] = useState(false);

  // Throttled user activity tracker using mouse, touch, scroll, keys
  useEffect(() => {
    let lastUpdate = 0;
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 3000) { // update at most every 3 seconds
        lastUpdate = now;
        storage.setItem('gx_last_active', now.toString());
      }
    };

    updateActivity(); // run once on tab boot

    const docEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    docEvents.forEach(evt => {
      window.addEventListener(evt, updateActivity, { passive: true });
    });

    return () => {
      docEvents.forEach(evt => {
        window.removeEventListener(evt, updateActivity);
      });
    };
  }, []);

  // Main app lock verification logic
  useEffect(() => {
    if (!isAuthReady) return;

    const performLockCheck = (source: 'mount' | 'focus' | 'interval') => {
      const lockData = LockService.getLockDataFromProfile(userData);
      
      // If lock is disabled, unlock immediately
      if (!lockData || !lockData.isEnabled) {
        setIsUnlocked(true);
        setInitialLockCheckDone(true);
        return;
      }

      const timeoutStr = storage.getItem('app-lock-timeout') || '0'; // default: '0' (immediate)

      if (timeoutStr === 'never') {
        const currentlyUnlocked = safeSessionStorage.getItem('grix_session_unlocked') === 'true';
        setIsUnlocked(currentlyUnlocked);
      } else if (timeoutStr === '0') {
        // Immediate Lock rules:
        if (source === 'mount') {
          // Fresh page refresh/load always triggers lock to respect "lock on refresh"
          setIsUnlocked(false);
          safeSessionStorage.removeItem('grix_session_unlocked');
        } else if (source === 'focus') {
          // Returning from background/blur. 
          // Check activity grace period (Issue 6) - 15 second grace to select files or allow popups without locking.
          const lastActiveStr = storage.getItem('gx_last_active');
          if (lastActiveStr) {
            const lastActive = parseInt(lastActiveStr, 10);
            const elapsed = (Date.now() - lastActive) / 1000;
            if (elapsed > 15) {
              setIsUnlocked(false);
              safeSessionStorage.removeItem('grix_session_unlocked');
            } else {
              // Within grace period (e.g. file upload or prompt is open), stay unlocked
              setIsUnlocked(true);
            }
          } else {
            setIsUnlocked(false);
          }
        } else {
          // Active interval inside the app viewing stay unlocked
          const currentlyUnlocked = safeSessionStorage.getItem('grix_session_unlocked') === 'true';
          setIsUnlocked(currentlyUnlocked);
        }
      } else {
        // Idle timeout limits: 60s (1m) or 300s (5m)
        const lastActiveStr = storage.getItem('gx_last_active');
        const timeoutSeconds = parseInt(timeoutStr, 10);
        
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr, 10);
          const elapsed = (Date.now() - lastActive) / 1000;
          
          if (elapsed > timeoutSeconds) {
            safeSessionStorage.removeItem('grix_session_unlocked');
            setIsUnlocked(false);
          } else {
            const currentlyUnlocked = safeSessionStorage.getItem('grix_session_unlocked') === 'true';
            setIsUnlocked(currentlyUnlocked);
          }
        } else {
          // Fallback lock
          setIsUnlocked(false);
        }
      }

      setInitialLockCheckDone(true);
    };

    // 1. Initial lock evaluation on load (only run 'mount' check once)
    if (!initialMountCheckedRef.current) {
      initialMountCheckedRef.current = true;
      performLockCheck('mount');
    } else {
      performLockCheck('interval');
    }

    // 2. Tab Visibility and Focus State Updates
    const handleStateChange = () => {
      if (document.hidden) {
        storage.setItem('gx_last_active', Date.now().toString());
      } else {
        performLockCheck('focus');
      }
    };

    const handleFocus = () => {
      performLockCheck('focus');
    };

    document.addEventListener('visibilitychange', handleStateChange);
    window.addEventListener('focus', handleFocus);

    // 3. Robust realtime inactivity checker
    const activeInterval = setInterval(() => {
      if (!document.hidden) {
        performLockCheck('interval');
      }
    }, 4000);

    return () => {
      document.removeEventListener('visibilitychange', handleStateChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(activeInterval);
    };
  }, [isAuthReady, userData]);

  useEffect(() => {
    const loadCount = parseInt(storage.getItem('loadCount') || '0');
    storage.setItem('loadCount', (loadCount + 1).toString());
    console.log(`App Load Count: ${loadCount + 1}`);
    console.log(`Current Auth State: ${user ? 'Logged In' : 'Logged Out'}`);
    console.log(`Auth Ready: ${isAuthReady}`);
    
    CacheService.clearOldCache();
  }, [user]);

  // Dynamic theme-color meta tag sync
  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    const color = isDark ? '#202124' : '#ffffff';
    
    // Synchronize all theme-color tags (including with media queries)
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    if (metaThemeColors.length > 0) {
      metaThemeColors.forEach(meta => {
        const media = meta.getAttribute('media');
        if (!media) {
          meta.setAttribute('content', color);
        } else if (media.includes('dark') && isDark) {
          meta.setAttribute('content', '#202124');
        } else if (media.includes('light') && !isDark) {
          meta.setAttribute('content', '#ffffff');
        }
      });
    }

    // Update Windows tile and browser nav colors
    const msTile = document.querySelector('meta[name="msapplication-TileColor"]');
    if (msTile) msTile.setAttribute('content', color);
    
    const msNav = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (msNav) msNav.setAttribute('content', color);

    // Synchronize custom navigation-color tags
    const metaNavColors = document.querySelectorAll('meta[name="navigation-color"]');
    metaNavColors.forEach(meta => {
      const media = meta.getAttribute('media');
      if (!media) {
        meta.setAttribute('content', color);
      } else if (media.includes('dark') && isDark) {
        meta.setAttribute('content', '#202124');
      } else if (media.includes('light') && !isDark) {
        meta.setAttribute('content', '#ffffff');
      }
    });
  }, [resolvedTheme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Global Back Button Handler for Mobile
  useEffect(() => {
    if (window.history.length === 1) {
      window.history.pushState({ entry: 1 }, '');
    }
    const handlePopState = () => {};
    window.addEventListener('popstate', handlePopState);
    
    // Disable Context Menu Globally
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu on input and textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const loading = !isAuthReady || authLoading || splashLoading;

  if (loading || !initialLockCheckDone) {
    return (
      <SplashScreen />
    );
  }

  if (!isUnlocked) {
    return (
      <GlobalLockScreen 
        onUnlock={() => {
          safeSessionStorage.setItem('grix_session_unlocked', 'true');
          setIsUnlocked(true);
        }} 
      />
    );
  }

  // Guard Logic
  const needsVerification = false;
  const needsProfileCompletion = false;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NavProvider>
        <LayoutProvider>
          <div className="app-container">
            {user && <IncomingCallNotification />}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
              {user && <NotificationHandler />}
              <div className="flex-1 h-full relative overflow-hidden">
              <React.Suspense fallback={
                  <div className="h-full flex items-center justify-center bg-[var(--bg-main)]">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }>
                  <Routes>
                    {/* Main Layout Routes */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={
                        !user ? <Navigate to="/login" replace /> : 
                        needsVerification ? <Navigate to="/verify-email" replace /> :
                        needsProfileCompletion ? <Navigate to="/complete-profile" replace /> :
                        <Navigate to="/chats" replace />
                      } />
                      <Route path="/chats" element={
                        !user ? <Navigate to="/login" replace /> : 
                        needsVerification ? <Navigate to="/verify-email" replace /> :
                        needsProfileCompletion ? <Navigate to="/complete-profile" replace /> :
                        <ChatsTab />
                      } />
                      <Route path="/chats/archived" element={user ? <ArchivedChatScreen /> : <Navigate to="/login" />} />
                      <Route path="/chats/requests" element={user ? <MessageRequestsScreen /> : <Navigate to="/login" />} />
                      <Route path="/chats/hidden" element={user ? <HideChatScreen /> : <Navigate to="/login" />} />
                      <Route path="/chats/hidden/settings" element={user ? <HideChatSettings /> : <Navigate to="/login" />} />
                      <Route path="/share" element={user ? <ShareTab /> : <Navigate to="/chats" replace />} />
                      <Route path="/search" element={user ? <SearchTab /> : <Navigate to="/login" />} />
                      <Route path="/updates" element={<Navigate to="/search" replace />} />
                      <Route path="/channels" element={<Navigate to="/search" replace />} />
                      <Route path="/profile/friends" element={user ? <FriendsScreen /> : <Navigate to="/login" />} />
                      <Route element={<ChatLayout />}>
                        <Route path="/chat/grix-ai" element={user ? <GrixAIScreen /> : <Navigate to="/login" />} />
                        <Route path="/chat/:id" element={user ? <ChatScreen /> : <Navigate to="/login" />} />
                        <Route path="/chat/:id/settings" element={user ? <ChatSettingsScreen /> : <Navigate to="/login" />} />
                      </Route>
                      <Route path="/calls" element={user ? <CallsTab /> : <Navigate to="/login" />} />
                      <Route path="/profile" element={user ? <ProfileTab /> : <Navigate to="/login" />} />
                      
                      {/* Sub routes nested in MainLayout to support clean split layouts on Desktop */}
                      <Route path="/notifications" element={user ? <NotificationsScreen /> : <Navigate to="/login" />} />
                      <Route path="/notifications/likes" element={user ? <LikeNotificationsScreen /> : <Navigate to="/login" />} />
                      <Route path="/settings" element={user ? <SettingsMainScreen /> : <Navigate to="/login" />} />
                      <Route path="/edit-profile" element={user ? <EditProfileScreen /> : <Navigate to="/login" />} />
                      <Route path="/privacy-settings" element={user ? <PrivacySettingsScreen /> : <Navigate to="/login" />} />
                      <Route path="/chat-settings" element={user ? <ChatSettingsMainScreen /> : <Navigate to="/login" />} />
                      <Route path="/app-preferences" element={user ? <AppPreferencesScreen /> : <Navigate to="/login" />} />
                      <Route path="/account-settings" element={user ? <AccountSettingsScreen /> : <Navigate to="/login" />} />
                      <Route path="/active-sessions" element={user ? <ActiveSessionsScreen /> : <Navigate to="/login" />} />
                      <Route path="/app-lock" element={user ? <AppLockScreen /> : <Navigate to="/login" />} />
                      <Route path="/setup-lock/:type" element={user ? <SetupLockScreen /> : <Navigate to="/login" />} />
                      <Route path="/verify-lock" element={user ? <VerifyLockScreen /> : <Navigate to="/login" />} />
                      <Route path="/notifications-settings" element={user ? <NotificationsSettingsScreen /> : <Navigate to="/login" />} />
                      <Route path="/data-usage" element={user ? <DataUsageScreen /> : <Navigate to="/login" />} />
                      <Route path="/help" element={user ? <HelpScreen /> : <Navigate to="/login" />} />
                      <Route path="/help/faq" element={user ? <HelpFaqScreen /> : <Navigate to="/login" />} />
                      <Route path="/help/contact" element={user ? <HelpContactScreen /> : <Navigate to="/login" />} />
                      <Route path="/app-info" element={user ? <AppInfoScreen /> : <Navigate to="/login" />} />
                      <Route path="/github" element={user ? <GithubScreen /> : <Navigate to="/login" />} />
                      <Route path="/favorites" element={user ? <FavoritesScreen /> : <Navigate to="/login" />} />
                      <Route path="/blocked-accounts" element={user ? <BlockedAccountsScreen /> : <Navigate to="/login" />} />
                      <Route path="/muted-accounts" element={user ? <MutedAccountsScreen /> : <Navigate to="/login" />} />
                      <Route path="/messages" element={user ? <MessagesListScreen /> : <Navigate to="/login" />} />
                      <Route path="/user/:id" element={user ? <UserProfileScreen /> : <Navigate to="/login" />} />
                      <Route path="/chat/preview" element={user ? <ImagePreviewScreen /> : <Navigate to="/login" />} />
                      <Route path="/profile/grix-ai" element={user ? <GrixAIProfile /> : <Navigate to="/login" />} />
                    </Route>
    
                    {/* Other Routes */}
                    <Route path="/verify-email" element={
                      <Navigate to="/chats" replace />
                    } />
                    <Route path="/complete-profile" element={
                      <Navigate to="/chats" replace />
                    } />
                    <Route path="/call/:id" element={user ? <CallScreen /> : <Navigate to="/chats" replace />} />
                    <Route path="/stories/view/:userId" element={user ? <StoryWatcherScreen /> : <Navigate to="/chats" replace />} />
                    <Route path="/stories/create" element={user ? <StoryCreationScreen /> : <Navigate to="/chats" replace />} />
                    <Route path="/login" element={<Navigate to="/chats" replace />} />
                    <Route path="/signup" element={<Navigate to="/chats" replace />} />
                    <Route path="/forgot-password" element={<Navigate to="/chats" replace />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
                    <Route path="/terms" element={<TermsAndConditionsScreen />} />
                    <Route path="/search-user" element={<Navigate to="/profile" replace />} />
                    <Route path="*" element={<Navigate to="/chats" replace />} />
                  </Routes>
                </React.Suspense>
              </div>
            </div>
          </div>
        </LayoutProvider>
      </NavProvider>
      <DeveloperConsole isOpen={isDevConsoleOpen} onClose={() => setDevConsoleOpen(false)} />
    </ErrorBoundary>
  );
}
