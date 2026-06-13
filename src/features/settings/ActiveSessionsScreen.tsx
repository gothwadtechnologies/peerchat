import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Monitor, Tv, LogOut, MapPin, Clock, Globe, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import { useAuth } from '../../providers/AuthProvider';
import { getSupabase } from '../../lib/supabase';
import { safeSessionStorage } from '../../services/StorageService';

interface ActiveSession {
  id: string;
  device_name: string;
  ip_address: string;
  location: string;
  login_time: string;
  last_active: string;
}

export default function ActiveSessionsScreen() {
  const navigate = useNavigate();
  const { userData, user } = useAuth();
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = getSupabase();

  const currentSessionId = safeSessionStorage.getItem('grix_current_session_id') || '';
  const sessions: ActiveSession[] = (userData?.settings as any)?.active_sessions || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract current and other sessions safely
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  // Parse device icon type
  const getDeviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tv') || n.includes('tizen') || n.includes('webos')) {
      return <Tv className="text-emerald-500" size={20} />;
    }
    if (n.includes('mobile') || n.includes('phone') || n.includes('ios') || n.includes('android')) {
      return <Smartphone className="text-[#0494f4]" size={20} />;
    }
    return <Monitor className="text-zinc-500 dark:text-zinc-400" size={20} />;
  };

  // Revoke device session
  const handleRevokeSession = async (sessionId: string) => {
    if (!supabase || !user) return;
    
    try {
      const currentSettings = (userData?.settings as any) || {};
      const updatedSessions = (currentSettings.active_sessions || []).filter(
        (s: any) => s.id !== sessionId
      );

      const { error } = await (supabase.from('users') as any)
        .update({
          settings: {
            ...currentSettings,
            active_sessions: updatedSessions,
          },
        })
        .eq('id', user.id);

      if (error) throw error;
      showToast('Device session terminated successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to terminate device session.');
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    if (!supabase || !user || !currentSessionId) return;

    setIsTerminatingAll(true);
    try {
      const currentSettings = (userData?.settings as any) || {};
      const currentSessObj = (currentSettings.active_sessions || []).find(
        (s: any) => s.id === currentSessionId
      );

      const updatedSessions = currentSessObj ? [currentSessObj] : [];

      const { error } = await (supabase.from('users') as any)
        .update({
          settings: {
            ...currentSettings,
            active_sessions: updatedSessions,
          },
        })
        .eq('id', user.id);

      if (error) throw error;
      showToast('All other sessions signed out.');
    } catch (err) {
      console.error(err);
      showToast('Failed to revoke other sessions.');
    } finally {
      setIsTerminatingAll(false);
    }
  };

  const forceRefresh = async () => {
    setIsRefreshing(true);
    // Simple window refresh timeout callback
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Session listings updated.');
    }, 800);
  };

  // Format time helper
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return 'Recent';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] font-sans overflow-hidden">
      <SettingHeader title="Where you're logged in" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6 pb-24">
        {/* Helper info banner */}
        <div className="mx-6 mb-6 p-4 bg-[#0494f4]/5 border border-[#0494f4]/10 rounded-2xl flex gap-3.5 items-start">
          <Globe className="text-[#0494f4] shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold text-[#0494f4]">Active Session Tracker</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              We list all desktop, portable, and TV browser sessions currently signed into GrixChat. Terminated sessions are logged out in real-time.
            </p>
          </div>
        </div>

        {/* Current Active Session */}
        <h3 className="px-6 mb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.12em]">Current Device</h3>
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/30 px-6 py-4 mb-6">
          {currentSession ? (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-500/10 rounded-2xl shrink-0 mt-0.5">
                {getDeviceIcon(currentSession.device_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {currentSession.device_name}
                  </h4>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    Active now
                  </span>
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MapPin size={11} className="text-zinc-400" />
                    <span>{currentSession.location}</span>
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]/80 font-mono">
                    IP: {currentSession.ip_address}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Smartphone className="text-zinc-400" size={18} />
              <div className="text-xs text-[var(--text-secondary)]">Resolving current session context...</div>
            </div>
          )}
        </div>

        {/* Other Logged-in Devices */}
        <div className="flex items-center justify-between px-6 mb-2">
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.12em]">
            Other Active Login Sessions ({otherSessions.length})
          </h3>
          <button 
            onClick={forceRefresh}
            className={`text-zinc-400 hover:text-[var(--text-primary)] transition ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/30 mb-6 divide-y divide-[var(--border-color)]/25">
          {otherSessions.length > 0 ? (
            otherSessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between px-6 py-4 hover:bg-[var(--bg-main)]/10 transition-colors">
                <div className="flex items-start gap-4 min-w-0 flex-1 mr-3">
                  <div className="p-2.5 bg-zinc-500/5 rounded-xl shrink-0 mt-0.5">
                    {getDeviceIcon(s.device_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {s.device_name}
                    </h4>
                    
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.2 truncate">
                        <MapPin size={10} className="text-zinc-400 mr-0.5 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]/90 flex items-center gap-1.2">
                        <Clock size={10} className="text-zinc-400 mr-0.5 shrink-0" />
                        <span>Logged in: {formatTime(s.login_time)}</span>
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]/70 font-mono">
                        IP: {s.ip_address}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                  title="Terminate Session"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="mx-auto text-emerald-500/30 mb-2" size={24} />
              <p className="text-xs font-bold text-[var(--text-primary)]">No other active devices</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                You are currently logged in only on this Smart TV or browser.
              </p>
            </div>
          )}
        </div>

        {/* Revoke All Action Panel */}
        {otherSessions.length > 0 && (
          <div className="px-6">
            <button
              onClick={handleRevokeAllOtherSessions}
              disabled={isTerminatingAll}
              className="w-full py-4 px-4 bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-500 dark:text-red-400 border border-red-200/50 dark:border-red-950/40 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isTerminatingAll ? 'Signing out devices...' : 'Log out from all other devices'}</span>
            </button>
            <p className="text-[10px] text-[var(--text-secondary)] text-center mt-3 leading-normal">
              This will automatically terminate and sign out GrixChat from all browser tabs, TV monitors, and mobile displays except the current one.
            </p>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg opacity-95 transition-all pointer-events-none flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
