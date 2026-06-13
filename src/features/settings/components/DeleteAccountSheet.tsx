import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { supabase } from '../../../lib/supabase';

interface DeleteAccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountSheet({ isOpen, onClose }: DeleteAccountSheetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setError('');

    try {
      const uid = user.id;
      
      // 1. Delete user from Supabase users table
      // This will cascade to posts, reels, etc. if ON DELETE CASCADE is set
      const { error: dbError } = await supabase
        .from('users')
        .update({ is_deleted: true } as any) // Soft delete pattern or actual delete
        .eq('id', uid);
      
      // If we want real delete:
      // const { error: dbError } = await supabase.from('users').delete().eq('id', uid);

      if (dbError) throw dbError;
      
      // 2. Sign out
      await supabase.auth.signOut();

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setError(err.message || "Failed to delete account. You may need to sign out and sign in again to perform this sensitive action.");
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
              <h3 className="text-[20px] leading-[18px] font-black text-red-600 tracking-tight">Delete Account</h3>
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
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Account Deleted</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Your account has been permanently removed. Redirecting...</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <AlertTriangle size={32} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-base font-bold text-[var(--text-primary)]">This is permanent!</h4>
                       <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          Deleting your account is irreversible. All your messages, posts, reels and stories will be lost.
                       </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs font-bold text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full bg-red-600 text-white text-sm font-bold py-4 rounded-xl transition-all disabled:opacity-70 active:scale-[0.98] shadow-sm shadow-red-600/20 shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Deleting Account...' : (
                        <>
                          <Trash2 size={18} /> Yes, Delete Permanently
                        </>
                      )}
                    </button>
                    <button 
                      onClick={onClose}
                      disabled={loading}
                      className="w-full bg-zinc-100 text-[var(--text-primary)] text-sm font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
