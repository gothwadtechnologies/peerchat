import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Delete, ArrowRight, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LockService } from '../../services/LockService.ts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../providers/AuthProvider';
import { storage, safeSessionStorage } from '../../services/StorageService';

export default function VerifyLockScreen() {
  const navigate = useNavigate();
  const { userData, refreshUserData } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const lockData = LockService.getLockDataFromProfile(userData);
  const isNumeric = lockData.type === 'pin4' || lockData.type === 'pin6';
  const maxLength = lockData.type === 'pin4' ? 4 : lockData.type === 'pin6' ? 6 : 20;

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

  const handleVerify = async () => {
    if (verifying) return;
    
    if (LockService.verifyLock(value, lockData.hash)) {
      setVerifying(true);
      try {
        await LockService.disableLock();
        safeSessionStorage.removeItem('grix_session_unlocked');
        await refreshUserData();
        navigate('/app-lock');
      } catch (err) {
        setError('Failed to disable lock');
        setVerifying(false);
        console.error(err);
      }
    } else {
      setError('Incorrect ' + (isNumeric ? 'PIN' : 'Password'));
      setValue('');
    }
  };

  const renderKeypad = () => {
    if (!isNumeric) return null;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'check', '0', 'delete'];
    return (
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[270px] mt-8 justify-items-center">
        {keys.map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === 'check') handleVerify();
              else if (key === 'delete') handleKeyPress('delete');
              else if (key) handleKeyPress(key);
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold transition-all active:scale-90 shadow-sm cursor-pointer ${
              key === 'check' 
              ? 'bg-[#0494f4] text-white shadow-md' 
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]/10 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            {key === 'delete' ? <Delete size={20} /> : key === 'check' ? <Check size={20} /> : key}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)]/50 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-full transition-colors text-[var(--text-primary)]">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-black text-[var(--text-primary)] tracking-tight">
          Verify Lock
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center w-full">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-6 border border-[var(--primary)]/10">
            <Lock size={32} />
          </div>
          
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2 text-center">
            Confirm to Disable
          </h2>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-8 text-center">
            Enter your current {isNumeric ? 'PIN' : 'Password'}
          </p>

          {isNumeric ? (
            <div className="flex gap-3 mb-4">
              {[...Array(maxLength)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    value.length > i 
                    ? 'bg-[var(--primary)] border-[var(--primary)] scale-110 shadow-sm shadow-[var(--primary-shadow)]' 
                    : 'border-[var(--border-color)]'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="w-full max-w-[280px] mb-4">
              <input 
                type="password"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-center text-lg font-black tracking-widest outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)]"
                placeholder="••••••••"
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-4 animate-bounce">
              {error}
            </p>
          )}

          {renderKeypad()}

          <button 
            onClick={handleVerify}
            disabled={value.length === 0}
            className="mt-12 w-full max-w-[280px] bg-[var(--text-primary)] text-[var(--bg-main)] py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            Verify & Disable
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center gap-1 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)] text-[9px] font-black tracking-[0.2em] uppercase">Security Verification</span>
        </div>
      </div>
    </div>
  );
}
