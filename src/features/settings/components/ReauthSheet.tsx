import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';

interface ReauthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function ReauthSheet({ isOpen, onClose, onSuccess, title = "Confirm Security", description = "Please enter your current password to continue." }: ReauthSheetProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setLoading(true);
    setError('');

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password
        });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      console.error("Reauth error:", err);
      setError(err.message || "Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 50, 
              stiffness: 1000, 
              mass: 0.3,
              restDelta: 0.01 
            }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] z-[301] rounded-t-[32px] border-t border-[var(--border-color)] flex flex-col overflow-hidden shadow-2xl safe-bottom max-w-md mx-auto"
          >
            <div className="w-full flex justify-center py-2">
              <div className="w-10 h-1 bg-[var(--border-color)] rounded-full opacity-40" />
            </div>

            <div className="px-6 py-2 flex items-center justify-between">
              <h3 className="text-[20px] leading-[18px] font-black text-[var(--text-primary)] tracking-tight">{title}</h3>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--bg-main)] rounded-full transition-colors text-[var(--text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-[var(--text-secondary)]">
                {description}
              </p>

              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Current Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]/40 transition-all text-[var(--text-primary)]"
                    required
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 rounded-lg">
                    {error}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="w-full bg-[var(--primary)] text-white text-sm font-bold py-4 rounded-xl transition-all disabled:opacity-70 active:scale-[0.98] shadow-sm shadow-[var(--primary)]/20 shadow-lg"
                >
                  {loading ? 'Verifying...' : 'Verify Password'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
