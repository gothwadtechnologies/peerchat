import React, { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Lock, Info, X, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { LockService } from '../../services/LockService.ts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../providers/AuthProvider';

interface GlobalLockScreenProps {
  onUnlock: () => void;
}

export default function GlobalLockScreen({ onUnlock }: GlobalLockScreenProps) {
  const { userData } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  const lockData = LockService.getLockDataFromProfile(userData);
  const isNumeric = lockData.type === 'pin4' || lockData.type === 'pin6';
  const maxLength = lockData.type === 'pin4' ? 4 : lockData.type === 'pin6' ? 6 : 20;

  // Auto-verify logic
  useEffect(() => {
    if (value.length > 0) {
      if (isNumeric) {
        if (value.length === maxLength) {
          if (LockService.verifyLock(value, lockData.hash)) {
            onUnlock();
          } else {
            setError('Incorrect PIN');
            setValue('');
          }
        }
      } else {
        // For alphabetical, we check if it matches the stored password
        if (value.length >= 4 && LockService.verifyLock(value, lockData.hash)) {
          onUnlock();
        }
      }
    }
  }, [value, isNumeric, maxLength, onUnlock, lockData.hash]);

  const handleKeyPress = (key: string) => {
    setError('');
    if (key === 'delete') {
      setValue(value.slice(0, -1));
    } else if (value.length < maxLength) {
      setValue(value + key);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.length > 0) {
      handleVerify();
    }
  };

  const handleVerify = () => {
    if (LockService.verifyLock(value, lockData.hash)) {
      onUnlock();
    } else {
      setError('Incorrect ' + (isNumeric ? 'PIN' : 'Password'));
      setValue('');
    }
  };

  const renderKeypad = () => {
    if (!isNumeric) return null;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'info', '0', 'delete'];
    return (
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[270px] mt-8 justify-items-center">
        {keys.map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === 'info') setShowHelp(true);
              else if (key === 'delete') handleKeyPress('delete');
              else if (key) handleKeyPress(key);
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold transition-all active:scale-90 shadow-sm cursor-pointer ${
              key === 'info' 
              ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]' 
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]/10 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            {key === 'delete' ? <Delete size={20} /> : key === 'info' ? <Info size={18} /> : key}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[var(--bg-main)] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center w-full"
        >
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-xl shadow-[var(--primary-shadow)]">
            <Lock size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2 text-center">
            App Locked
          </h2>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-12 text-center">
            Enter your security {isNumeric ? 'PIN' : 'Password'} to continue
          </p>

          <div className="h-24 flex flex-col items-center justify-center w-full">
            {isNumeric ? (
              <div className="flex gap-4">
                {[...Array(maxLength)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                      value.length > i 
                      ? 'bg-primary border-primary scale-110 shadow-lg shadow-[var(--primary-shadow)]' 
                      : 'border-[var(--border-color)]'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full">
                <div className="relative">
                  <input 
                    type="password"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-center text-xl font-black tracking-widest outline-none focus:border-primary shadow-sm text-[var(--text-primary)]"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    <Info size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="h-6 mt-4">
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-black text-red-500 uppercase tracking-wider"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {renderKeypad()}
        </motion.div>
      </div>

      <div className="p-12 flex flex-col items-center gap-2 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)] text-[10px] font-black tracking-[0.2em] uppercase">GrixChat Security</span>
        </div>
        <span className="text-[var(--text-secondary)] text-[8px] uppercase tracking-widest">End-to-End Local Protection</span>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-2xl border border-[var(--border-color)]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <ShieldAlert size={24} />
                </div>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-zinc-50/10 rounded-full transition-colors">
                  <X size={24} className="text-[var(--text-secondary)]" />
                </button>
              </div>

              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-4">Forgot Password?</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-zinc-50/10 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                    <LogOut size={16} />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed">
                    Uninstall the app and download it again from the official source.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-zinc-50/10 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                    <RefreshCw size={16} />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed">
                    Alternatively, clear the app data from your device settings and relogin.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowHelp(false)}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-main)] py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
