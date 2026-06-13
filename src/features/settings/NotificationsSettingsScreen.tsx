import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Phone, 
  Users, 
  Volume2, 
  Vibrate, 
  ChevronRight, 
  AlertCircle,
  ChevronLeft,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function NotificationsSettingsScreen() {
  const { user, userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [settings, setSettings] = useState({
    conversationTones: userData?.settings?.notifications?.conversationTones ?? true,
    highPriority: userData?.settings?.notifications?.highPriority ?? true,
    reactionNotifications: userData?.settings?.notifications?.reactionNotifications ?? true,
    groupHighPriority: userData?.settings?.notifications?.groupHighPriority ?? true,
    vibrate: userData?.settings?.notifications?.vibrate ?? true,
  });

  useEffect(() => {
    if (userData?.settings?.notifications) {
      setSettings(prev => ({
        ...prev,
        ...userData.settings?.notifications
      }));
    }
  }, [userData]);

  const updateServerSettings = async (newSettings: any) => {
    if (!user || !supabase) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          settings: {
            ...userData?.settings,
            notifications: newSettings
          }
        } as any)
        .eq('id', user.id);
      
      if (error) throw error;
      await refreshUserData();
    } catch (e) {
      console.error('Failed to update notification settings:', e);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateServerSettings(newSettings);
  };

  const [isSendingTest, setIsSendingTest] = useState(false);
  const isIframe = window.self !== window.top;
  const [diag, setDiag] = useState<any>(null);

  const runDiagnosis = async () => {
    const results: any = {
      browserSupport: typeof Notification !== 'undefined',
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
      iframe: window.self !== window.top,
      swRegistered: false,
      fcmSupported: false,
      hasToken: !!userData?.fcmTokens?.length,
      config: {
        hasVapid: !!import.meta.env.VITE_FIREBASE_VAPID_KEY
      }
    };

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      results.swRegistered = regs.some(r => r.active && r.active.scriptURL.includes('sw.js'));
    }

    setDiag(results);
  };

  const sendTestNotification = async () => {
    if (!userData?.fcmTokens?.length) {
      alert("No FCM tokens found. Ensure notifications are allowed.");
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: userData.fcmTokens,
          title: "Test Notification",
          body: "Hello! This is a test notification from GrixChat 🚀",
          data: { type: 'test' }
        })
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseErr) {
        console.warn(`FCM Settings: Non-JSON response received. Status: ${response.status}. Body: ${responseText}`);
        throw new Error(`Unexpected server response format: ${responseText.substring(0, 100) || '(empty)'}`);
      }

      if (data && data.success) {
        alert("Test notification dispatched instantly! Check device system tray.");
      } else {
        throw new Error((data && data.error) || "Failed to send test notification");
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error dispatching alert: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleMasterToggle = async () => {
    if (typeof Notification === 'undefined') {
      alert("This browser doesn't support push notifications");
      return;
    }

    if (permission === 'granted') {
      alert("Browser permissions are already granted. Securely adjust via browser location parameters.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'denied') {
      alert("Notifications are locked at system level. Enable via device browser properties.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Premium visual aligned header bar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)] font-sans">Notifications & Sounds</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-6 pb-24">
        {isIframe && (
          <div className="px-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-600 dark:text-amber-400 leading-snug">
                <b>Iframe Isolation:</b> Push signaling may be isolated in this developer sandbox. 
                For active verification, please <button onClick={() => window.open(window.location.href, '_blank')} className="font-bold underline cursor-pointer">Open in New Tab</button>.
              </p>
            </div>
          </div>
        )}

        {/* Master Push Switch */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Master Push Signaling
            </h3>
          </div>
          <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/5">
            <div className="flex items-center justify-between px-4 py-3 h-16">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm ${
                  permission === 'granted' ? 'text-emerald-500' : 'text-[var(--text-secondary)] opacity-85'
                }`}>
                  <Bell size={20} className="stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14.5px] font-semibold text-[var(--text-primary)] leading-none mb-0.5">Allow Notification Alerts</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal leading-tight opacity-75">Receive alerts on incoming messages & active channels</p>
                </div>
              </div>
              <button 
                onClick={handleMasterToggle}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                  permission === 'granted' ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                  permission === 'granted' ? 'left-[22px]' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Test signaling action */}
        {permission === 'granted' && (
          <div className="px-4">
            <button 
              onClick={sendTestNotification}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-card)] border border-[var(--border-color)]/20 hover:bg-[var(--border-color)]/5 rounded-xl text-xs font-bold text-[var(--text-primary)] disabled:opacity-50 transition-all cursor-pointer border-none outline-none select-none"
            >
              <Activity size={14} className={isSendingTest ? "animate-pulse text-[#0494f4]" : "text-[#0494f4]"} />
              <span>{isSendingTest ? 'Sending Signal Test...' : 'Send Test Notification'}</span>
            </button>
          </div>
        )}

        {/* Conversation Tones */}
        <div className="px-4">
          <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4 flex flex-col gap-3.5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0494f4]/15 text-[#0494f4] shrink-0 border border-[#0494f4]/10">
                <Volume2 size={18} className="stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-[#0494f4] block mb-0.5 tracking-wider font-sans">
                  Conversation Tones
                </span>
                <p className="text-[12px] text-[var(--text-secondary)] font-normal leading-relaxed opacity-95">
                  Play quick audio tones for send-receive actions while directly in conversational views.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)]/20 rounded-xl px-4 py-3">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Sound Effects Enabled</span>
              <button 
                onClick={() => toggleSetting('conversationTones')}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                  settings.conversationTones ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                  settings.conversationTones ? 'left-[22px]' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Message Settings List */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Direct Message Alerts
            </h3>
          </div>
          <div className="flex flex-col bg-[var(--bg-card)] divide-y divide-[var(--border-color)]/5">
            <div className="w-full flex items-center justify-between px-4 py-3 h-16 select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm shrink-0">
                  <Vibrate size={20} className="text-[var(--text-secondary)] stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">Vibrate</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Haptic buzz triggers on inbox events</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('vibrate')}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                  settings.vibrate ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                  settings.vibrate ? 'left-[22px]' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="w-full flex items-center justify-between px-4 py-3 h-16 select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm shrink-0">
                  <MessageSquare size={20} className="text-[var(--text-secondary)] stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">High Priority Headers</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Display rich banners at top of screen</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('highPriority')}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                  settings.highPriority ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                  settings.highPriority ? 'left-[22px]' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Group Settings List */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Group Notification Setup
            </h3>
          </div>
          <div className="flex flex-col bg-[var(--bg-card)] divide-y divide-[var(--border-color)]/5">
            <div className="w-full flex items-center justify-between px-4 py-3 h-16 select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm shrink-0">
                  <Users size={20} className="text-[var(--text-secondary)] stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">Group Alerts Tone</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Default (Breeze ringtone)</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15" />
            </div>

            <div className="w-full flex items-center justify-between px-4 py-3 h-16 select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm shrink-0">
                  <MessageSquare size={20} className="text-[var(--text-secondary)] stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">Group High Priority</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Display previews on channels & group chats</p>
                </div>
              </div>
              <button 
                onClick={() => toggleSetting('groupHighPriority')}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer outline-none border-none shrink-0 ${
                  settings.groupHighPriority ? 'bg-[#0494f4]' : 'bg-zinc-700/60'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
                  settings.groupHighPriority ? 'left-[22px]' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Diagnosis tool display trigger */}
        <div className="px-4">
          <button 
            onClick={runDiagnosis}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-card)] border border-[var(--border-color)]/20 hover:bg-[var(--border-color)]/5 rounded-xl text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer border-none outline-none select-none"
          >
            <AlertCircle size={14} className="text-[#0494f4] stroke-[2.2]" />
            <span>Troubleshoot & Diagnose Push Connection</span>
          </button>
          
          {diag && (
            <div className="mt-4 p-4 bg-zinc-950/90 rounded-2xl border border-[var(--border-color)]/10 font-mono text-[10.5px] text-zinc-300 space-y-1.5 overflow-x-auto shadow-inner">
               <p className="text-[#0494f4] font-black mb-2 uppercase tracking-wider">DIAGNOSIS REPORT:</p>
               <p>• Browser Support: <span className={diag.browserSupport ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{String(diag.browserSupport)}</span></p>
               <p>• Sign permission: <span className={diag.permission === 'granted' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{diag.permission}</span></p>
               <p>• In Sandbox Iframe: <span className={diag.iframe ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>{String(diag.iframe)}</span></p>
               <p>• SW Worker Presence: <span className={diag.swRegistered ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{String(diag.swRegistered)}</span></p>
               <p>• Client Token Check: <span className={diag.hasToken ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{diag.hasToken ? 'ACTIVE' : 'INACTIVE'}</span></p>
               {diag.iframe && (
                 <p className="text-amber-400 mt-2 font-sans font-semibold text-[11px] leading-tight uppercase">
                   ⚠️ Open GrixChat in a dedicated tab to active-verify diagnostic tests.
                 </p>
               )}
            </div>
          )}
        </div>

        {/* Calls Section */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Incoming Calls
            </h3>
          </div>
          <div className="flex flex-col bg-[var(--bg-card)] border-y border-[var(--border-color)]/5">
            <button className="w-full flex items-center justify-between px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                  <Phone size={20} className="text-[var(--text-secondary)] stroke-[2.2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">System Ringtone</h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">Default (GrixChat Custom ringtone)</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 transition-all duration-200" />
            </button>
          </div>
        </div>

        <div className="py-4 text-center select-none">
            <p className="text-[9px] text-zinc-400 leading-relaxed max-w-[200px] mx-auto uppercase tracking-[0.2em] font-black font-mono opacity-25">
                GrixCloud Signaling v2.4.0 <br/>
                Host: AIS-PRE-442
            </p>
        </div>
      </div>
    </div>
  );
}
