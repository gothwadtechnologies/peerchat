import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';

interface ChangeEmailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeEmailSheet({ isOpen, onClose, onSuccess }: ChangeEmailSheetProps) {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      
      // 1. Update in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;
      
      // 2. Update in Supabase users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ email: newEmail } as any)
        .eq('id', user.id);

      if (dbError) throw dbError;

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        setNewEmail('');
      }, 2000);
    } catch (err: any) {
      console.error("Email update error:", err);
      setError(err.message || "Failed to update email. Ensure you have recently signed in.");
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
              <h3 className="text-[20px] leading-[18px] font-black text-[var(--text-primary)] tracking-tight">Change Email</h3>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--bg-main)] rounded-full transition-colors text-[var(--text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {isSuccess ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 space-y-4"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Email Updated!</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Your email has been changed successfully.</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Current Email</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{user?.email}</p>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="relative group">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        type="email" 
                        placeholder="New Email Address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]/40 transition-all text-[var(--text-primary)]"
                        required
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 rounded-lg">
                        {error}
                      </p>
                    )}

                    <button 
                      type="submit"
                      disabled={loading || !newEmail || newEmail === user?.email}
                      className="w-full bg-[var(--primary)] text-white text-sm font-bold py-4 rounded-xl transition-all disabled:opacity-70 active:scale-[0.98] shadow-sm shadow-[var(--primary)]/20 shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Updating...' : (
                        <>
                          Update Email <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
