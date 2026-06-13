import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Smartphone, Mail, Lock, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import ReauthSheet from './components/ReauthSheet';
import ChangeEmailSheet from './components/ChangeEmailSheet';
import ChangePasswordSheet from './components/ChangePasswordSheet';
import DeleteAccountSheet from './components/DeleteAccountSheet';

export default function AccountSettingsScreen() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
  const [isPasswordSheetOpen, setIsPasswordSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [reauthCallback, setReauthCallback] = useState<'email' | 'password' | 'delete' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isPasswordUser = authUser?.id ? true : false;

  const handleReauthSuccess = () => {
    setIsReauthOpen(false);
    if (reauthCallback === 'email') {
      setIsEmailSheetOpen(true);
    } else if (reauthCallback === 'password') {
      setIsPasswordSheetOpen(true);
    } else if (reauthCallback === 'delete') {
      setIsDeleteSheetOpen(true);
    }
    setReauthCallback(null);
  };

  const accountItems = [
    { 
      icon: Shield, 
      label: 'Security Notifications', 
      sub: 'Get notified of critical security changes', 
      onClick: () => showToast("Security notifications are active globally for your protection.") 
    },
    { 
      icon: Smartphone, 
      label: "Where You're Logged In", 
      sub: 'Manage other active device sessions', 
      onClick: () => navigate('/active-sessions') 
    },
    { 
      icon: Mail, 
      label: 'Change Email Address', 
      sub: authUser?.email || 'Update your key login credentials', 
      onClick: () => {
        if (!isPasswordUser) {
          showToast("You are using a social account login provider.");
          return;
        }
        setReauthCallback('email');
        setIsReauthOpen(true);
      }
    },
    { 
      icon: Lock, 
      label: 'Change Account Password', 
      sub: 'Update your localized login password secure hash', 
      onClick: () => {
        if (!isPasswordUser) {
          showToast("Password cannot be updated for social accounts.");
          return;
        }
        setReauthCallback('password');
        setIsReauthOpen(true);
      }
    },
    { 
      icon: UserX, 
      label: 'Delete Account Credentials', 
      sub: 'Permanently remove your identity & backups', 
      onClick: () => {
        setReauthCallback('delete');
        setIsReauthOpen(true);
      }
    },
  ];

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Header element to perfectly match settings main screen */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Account Settings</span>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar py-2">
        <div className="flex flex-col divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
          {accountItems.map((item) => (
            <button 
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <item.icon size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  {item.label}
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  {item.sub}
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
            </button>
          ))}
        </div>

        <div className="p-6 mt-4">
          <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4">
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed text-center opacity-85">
              Your account security is our priority. GrixChat operates exclusively with end-to-end encrypted databases and real-time network signatures to guarantee identity protection across sessions.
            </p>
          </div>
        </div>
      </div>

      <ReauthSheet 
        isOpen={isReauthOpen} 
        onClose={() => setIsReauthOpen(false)} 
        onSuccess={handleReauthSuccess}
      />

      <ChangeEmailSheet 
        isOpen={isEmailSheetOpen} 
        onClose={() => setIsEmailSheetOpen(false)} 
        onSuccess={() => {}} 
      />

      <ChangePasswordSheet 
        isOpen={isPasswordSheetOpen} 
        onClose={() => setIsPasswordSheetOpen(false)} 
        onSuccess={() => {}} 
      />

      <DeleteAccountSheet 
        isOpen={isDeleteSheetOpen} 
        onClose={() => setIsDeleteSheetOpen(false)} 
      />

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg opacity-90 transition-all pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
