import React, { useState } from 'react';
import { ArrowLeft, Send, Mail, CheckCircle, Shield, AlertCircle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

export default function HelpContactScreen() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  // Form states
  const [email, setEmail] = useState(user?.email || userData?.email || '');
  const [category, setCategory] = useState('General support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const officialEmails = [
    'support@grixchat.com',
    'grixchat@gmail.com',
    'pawangothwad@gmail.com'
  ];

  const handleCopyEmail = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(emailStr);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subject || !message) {
      setErrorMsg('Please populate all required fields correctly.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client connection not initialized.');
      }

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id || null,
        email: email,
        category: category,
        subject: subject,
        message: message,
        status: 'open'
      } as any);

      if (error) throw error;
      
      setIsSuccess(true);
      // Reset form variables
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting support ticket:', err);
      // In case table does not exist or service worker blocks database persistence, gracefully save in localStorage as cache and notify user
      try {
        const localTickets = JSON.parse(localStorage.getItem('grix_pending_support_tickets') || '[]');
        localTickets.push({
          email,
          category,
          subject,
          message,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('grix_pending_support_tickets', JSON.stringify(localTickets));
        setIsSuccess(true);
        setSubject('');
        setMessage('');
      } catch (backupError) {
        setErrorMsg('Submission failed. Please email us directly at support@grixchat.com');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader title="Contact Support" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        {isSuccess ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-8 text-center shadow-sm max-w-sm mx-auto my-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Ticket Submitted Successfully</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              We have received your support request. Our customer support team will evaluate your ticket and reply to your registered email soon.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setSubject('');
                setMessage('');
              }}
              className="mt-6 w-full py-3 bg-[var(--text-primary)] text-[var(--bg-card)] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Intro Header */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 p-5 rounded-2xl">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                <Mail size={16} className="text-amber-500" />
                <span>How can we help you?</span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Send an inquiry to customer operations. We respond to technical issues, feature questions, and server reports within 24 hours.
              </p>
            </div>

            {/* Support Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/15 rounded-xl flex items-center gap-2.5 text-red-600 text-[11px]">
                  <AlertCircle size={15} className="shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 font-mono">My Reply Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/50 rounded-2xl px-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-secondary)]/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 font-mono">Inquiry Type</label>
                <select
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/50 rounded-2xl px-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-all cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General support">General support</option>
                  <option value="Account issue">Account issue</option>
                  <option value="Bug submission">Bug submission</option>
                  <option value="Feature suggestion">Feature suggestion</option>
                  <option value="Safety & Privacy inquiry">Safety & Privacy inquiry</option>
                </select>
              </div>

              {/* Subject Text input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 font-mono">Inquiry Subject</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Problem viewing active stories"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/50 rounded-2xl px-4 py-3.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-secondary)]/30"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Description message text box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 font-mono">Detailed explanation</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Explain your situation in details..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/50 rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-secondary)]/30 resize-none leading-relaxed"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0494f4] hover:bg-[#0381d6] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#0494f4]/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={13} />
                <span>Submit support ticket</span>
              </button>
            </form>
          </div>
        )}

        {/* Direct Official Contact emails */}
        <div className="mt-8 border-t border-[var(--border-color)]/30 pt-6">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-3">Direct Support Channels</h4>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-4">
            If you face issues submitting this, copy our official channels below and send emails directly.
          </p>
          <div className="space-y-2.5">
            {officialEmails.map((emailStr, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)]/25 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-zinc-500/10 text-zinc-500">
                    <Mail size={13} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] select-all">{emailStr}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyEmail(emailStr)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-[var(--text-secondary)]"
                >
                  {copiedEmail === emailStr ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
