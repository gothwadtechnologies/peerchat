import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Trash2, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function HideChatSettings() {
  const navigate = useNavigate();
  const { userData, user, refreshUserData } = useAuth();
  
  const [secretCode, setSecretCode] = useState(userData?.hiddenChatSettings?.secretCode || '');
  const [showMenuEntry, setShowMenuEntry] = useState(userData?.hiddenChatSettings?.showMenuEntry !== false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setMessage(null);

    const payload = {
      secretCode: secretCode.trim() || null,
      showMenuEntry: showMenuEntry
    };

    try {
      // Try dedicated columns first
      const { error: primaryError } = await supabase
        .from('users')
        .update({
          hidden_chat_settings: payload
        } as any)
        .eq('id', user.uid);

      if (primaryError) {
        console.warn("Dedicated column missing or failed, trying nested settings fallback...", primaryError);
        // Fallback to storing inside the general JSONB 'settings' column
        const { error: fallbackError } = await supabase
          .from('users')
          .update({
            settings: {
              ...(userData?.settings || {}),
              hidden_chat_settings: payload
            }
          } as any)
          .eq('id', user.uid);

        if (fallbackError) throw fallbackError;
      }

      await refreshUserData();

      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 min-h-[56px] pt-safe pb-1.5 bg-[var(--header-bg)] z-50 shadow-sm border-b border-[var(--border-color)]/35 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft size={22} className="text-[var(--header-text)]" />
          </button>
          <h1 className="text-xl font-black text-[var(--header-text)] tracking-tight">
            Hidden Chat Settings
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="p-2 bg-[var(--primary)] text-white rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Secret Code Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Lock size={18} className="text-[var(--primary)]" />
            <h2 className="text-sm font-black uppercase tracking-widest">Secret Code</h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Create a secret code to find your hidden chats. When you type this code in the chat list search bar, your hidden chats will appear.
          </p>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter secret code (e.g. #786)" 
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all shadow-sm"
            />
          </div>
          {secretCode && (
            <button 
              onClick={() => setSecretCode('')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500"
            >
              <Trash2 size={12} /> Clear secret code
            </button>
          )}
        </section>

        {/* Visibility Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Eye size={18} className="text-[var(--primary)]" />
            <h2 className="text-sm font-black uppercase tracking-widest">Visibility</h2>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
            <button 
              onClick={() => setShowMenuEntry(!showMenuEntry)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-main)] transition-all"
            >
              <div className="flex flex-col items-start text-left gap-1 pr-4">
                <span className="text-sm font-bold text-[var(--text-primary)]">Hide Hidden Chats</span>
                <span className="text-[10px] text-[var(--text-secondary)] leading-tight">
                  Remove the "Hidden chats" entry point from the main menu. They will only be accessible via your secret code.
                </span>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${!showMenuEntry ? 'bg-[var(--primary)]' : 'bg-zinc-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${!showMenuEntry ? 'left-7' : 'left-1'}`}></div>
              </div>
            </button>
          </div>
        </section>

        {/* Info Card */}
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3 items-start">
          <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={18} />
          <p className="text-[11px] text-indigo-600 font-medium leading-relaxed">
            Hidden chats provide an extra layer of privacy for your most sensitive conversations. Make sure to remember your secret code if you decide to hide the entry point.
          </p>
        </div>
      </div>
    </div>
  );
}
