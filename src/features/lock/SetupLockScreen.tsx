import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Delete, ArrowRight, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LockService, LockType } from '../../services/LockService.ts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../providers/AuthProvider';
import { storage, safeSessionStorage } from '../../services/StorageService';

export default function SetupLockScreen() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [value, setValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isNumeric = type === 'pin4' || type === 'pin6';
  const maxLength = type === 'pin4' ? 4 : type === 'pin6' ? 6 : 20;

  const handleKeyPress = (key: string) => {
    setError('');
    const currentVal = step === 'enter' ? value : confirmValue;
    const setter = step === 'enter' ? setValue : setConfirmValue;

    if (key === 'delete') {
      setter(currentVal.slice(0, -1));
    } else if (currentVal.length < maxLength) {
      setter(currentVal + key);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const setter = step === 'enter' ? setValue : setConfirmValue;
    setter(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (step === 'enter' ? value : confirmValue).length > 0) {
      handleNext();
    }
  };

  const handleNext = async () => {
    if (step === 'enter') {
      if (isNumeric && value.length < maxLength) {
        setError(`Please enter a ${maxLength}-digit PIN`);
        return;
      }
      if (!isNumeric && value.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      setStep('confirm');
    } else {
      if (value === confirmValue) {
        try {
          await LockService.enableLock(type as LockType, value);
          safeSessionStorage.setItem('grix_session_unlocked', 'true');
          await refreshUserData();
          setSuccess(true);
          setTimeout(() => {
            navigate('/privacy-settings');
          }, 1500);
        } catch (err) {
          setError('Failed to setup lock. Please try again.');
          console.error(err);
        }
      } else {
        setError('Codes do not match. Try again.');
        setConfirmValue('');
      }
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
              if (key === 'check') handleNext();
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
        <span className="text-base font-black text-[var(--text-primary)] tracking-tight">
          Setup {type === 'alpha' ? 'Password' : 'PIN'}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-100">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Lock Enabled!</h2>
              <p className="text-xs font-bold text-[var(--text-secondary)] mt-2">Your app is now secure.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.3em] mb-2">
                Step {step === 'enter' ? '1' : '2'} of 2
              </span>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-8">
                {step === 'enter' ? 'Enter' : 'Confirm'} {type === 'alpha' ? 'Password' : 'PIN'}
              </h2>

              {isNumeric ? (
                <div className="flex gap-3 mb-4">
                  {[...Array(maxLength)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        (step === 'enter' ? value : confirmValue).length > i 
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
                    value={step === 'enter' ? value : confirmValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-center text-lg font-bold tracking-widest outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)]"
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
                onClick={handleNext}
                disabled={(step === 'enter' ? value : confirmValue).length === 0}
                className="mt-12 w-full max-w-[280px] bg-[var(--primary)] text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {step === 'enter' ? 'Next' : 'Confirm'}
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 flex flex-col items-center gap-1 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)] text-[9px] font-bold tracking-[0.2em] uppercase">Encrypted Local Storage</span>
        </div>
      </div>
    </div>
  );
}
