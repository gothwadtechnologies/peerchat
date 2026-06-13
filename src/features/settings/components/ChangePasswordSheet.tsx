import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ChangePasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordSheet({ isOpen, onClose, onSuccess }: ChangePasswordSheetProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || "Failed to update password. Ensure you have recently signed in.");
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
              <h3 className="text-[20px] leading-[18px] font-black text-[var(--text-primary)] tracking-tight">Change Password</h3>
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
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Password Secure!</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Your password has been changed successfully.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]/40 transition-all text-[var(--text-primary)]"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="relative group">
                      <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]/40 transition-all text-[var(--text-primary)]"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-[var(--primary)] flex items-center gap-2 px-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                  </button>

                  {error && (
                    <p className="text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <button 
                    type="submit"
                    disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full bg-[var(--primary)] text-white text-sm font-bold py-4 rounded-xl transition-all disabled:opacity-70 active:scale-[0.98] shadow-sm shadow-[var(--primary)]/20 shadow-lg"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
