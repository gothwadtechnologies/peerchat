import React from 'react';
import { 
  HelpCircle, 
  FileText, 
  Shield, 
  Mail, 
  ChevronRight,
  MessageSquare,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

export default function HelpScreen() {
  const navigate = useNavigate();

  const supportRoutes = [
    {
      icon: HelpCircle,
      label: 'Grix FAQ & Guides',
      sub: 'Search commonly asked questions',
      color: 'bg-emerald-500/10 text-emerald-500',
      path: '/help/faq'
    },
    {
      icon: Mail,
      label: 'Contact Support Form',
      sub: 'Submit inquiry tickets directly',
      color: 'bg-[#0494f4]/10 text-[#0494f4]',
      path: '/help/contact'
    },
    {
      icon: FileText,
      label: 'Terms of Use',
      sub: 'Read Grix terms and service structure',
      color: 'bg-indigo-500/10 text-indigo-500',
      path: '/terms'
    },
    {
      icon: Shield,
      label: 'Privacy Policy guidelines',
      sub: 'Understand how we protect details',
      color: 'bg-purple-500/10 text-purple-500',
      path: '/privacy-policy'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader title="Grix Support Hub" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* Banner Section */}
        <div className="px-5 mb-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm">
            <div className="space-y-1 z-10 max-w-[70%]">
              <span className="text-[9px] font-black tracking-widest text-[#0494f4] uppercase font-mono flex items-center gap-1">
                <Sparkles size={10} />
                <span>Self-Service Centre</span>
              </span>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">Grix Help & Support</h2>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                Need help setting up stories, hiding chats, or securing your profile account?
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-400/10 text-amber-500 rounded-full flex items-center justify-center shadow-inner">
              <HeartHandshake size={28} />
            </div>
          </div>
        </div>

        {/* List of sections */}
        <h3 className="px-6 mb-2.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">SUPPORT SECTIONS</h3>
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/30 mb-8 divide-y divide-[var(--border-color)]/25">
          {supportRoutes.map((item) => (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-zinc-500/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{item.label}</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-40 shrink-0" />
            </button>
          ))}
        </div>

        {/* Quick Contacts Banner */}
        <div className="px-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 text-center">
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Contacting us via Email directly?</h4>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-1.5 max-w-[280px] mx-auto">
              Our support channels can be directly mailed via <strong className="text-[var(--text-primary)] font-bold">support@grixchat.com</strong> or our fallback Gmail accounts.
            </p>
            <button
              onClick={() => navigate('/help/contact')}
              className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-zinc-100 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-transform inline-block"
            >
              Go to Contacts
            </button>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="py-12 flex flex-col items-center gap-1 opacity-30 select-none">
          <span className="text-[var(--text-primary)] font-black tracking-[0.25em] uppercase text-[9px] font-mono">GrixChat Customer Care</span>
          <span className="text-[8px] text-[var(--text-secondary)] mt-0.5">V 1.0.0 Global Standard Build</span>
        </div>
      </div>
    </div>
  );
}
