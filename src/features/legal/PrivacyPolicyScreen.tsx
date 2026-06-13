import React from 'react';
import { Shield, Sparkles, Mail, Lock, Key, Heart } from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

export default function PrivacyPolicyScreen() {
  const officialContacts = [
    { label: 'Primary Support', email: 'support@grixchat.com' },
    { label: 'Grix Team', email: 'grixchat@gmail.com' },
    { label: 'Technical Administrator', email: 'pawangothwad@gmail.com' }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-main)] flex flex-col font-sans no-scrollbar pb-10">
      <SettingHeader title="Privacy Policy" />
      
      <div className="w-full px-5 pt-6 z-10 flex flex-col min-h-full">
        {/* Policy Intro Badge Header */}
        <div className="text-center mb-8 mt-4 bg-[var(--bg-card)] border border-[var(--border-color)]/35 p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-14 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-2xl mx-auto mb-3">
            <Shield size={26} />
          </div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">Grix Privacy Guidelines</h2>
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mt-1.5 font-mono">
            Last Updated: May 2026
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed max-w-[280px] mx-auto">
            Your personal communication, chats, call operations, and shared media assets are secured under strict rules.
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-5 text-[var(--text-primary)] leading-relaxed text-xs">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Lock size={13} className="text-emerald-500" />
              <span>1. Overview of Grix Safety</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              At GrixChat, user security is paramount. Since our application operates with serverless Supabase architectures, your messages and shared horizontal stories are locked safely using Row Level Security (RLS) standards to secure user data from third-party interception.
            </p>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Key size={13} className="text-[#0494f4]" />
              <span>2. Data We Collect & Sync</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-1">
              We collect minimal information to enable chat, calls, and stories syncing:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[var(--text-secondary)]">
              <li>Profile information (Username, Display Name, Bio, and Avatar Photo)</li>
              <li>Authentication emails for security credentials</li>
              <li>Encrypted chat message streams and media assets shared directly</li>
              <li>Required browser permissions for optional local media (e.g., system gallery and sounds)</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>3. Encryption Policies</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              All messaging pipelines, metadata parameters, voice call channels, and custom settings layouts are synchronized through SSL connections. Media assets uploaded by users to Grix are fully processed with end-to-end parameters to guarantee confidentiality.
            </p>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Heart size={13} className="text-pink-500" />
              <span>4. Indian Standard Compliance</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              We conform strictly to global standard data laws and Indian IT Act provisions for safeguarding personal user messages, with standard secure hosting.
            </p>
          </section>

          {/* Official Contact Details */}
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Mail size={13} className="text-[#0494f4]" />
              <span>5. Official Protection Officers</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              If you have any questions, safety comments, or inquiries regarding your profile, feel free to directly contact our official team channels:
            </p>
            <div className="space-y-1.5 pt-1.5">
              {officialContacts.map((contact, index) => (
                <div key={index} className="flex justify-between items-center text-[11px] text-[var(--text-secondary)] border-b border-[var(--border-color)]/20 pb-1 w-full flex-wrap">
                  <span className="font-bold text-[var(--text-primary)]">{contact.label}:</span>
                  <a href={`mailto:${contact.email}`} className="text-[#0494f4] font-mono select-all hover:underline">{contact.email}</a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Closing copyright block */}
        <div className="mt-8 text-center opacity-30 select-none pb-6">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-primary)]">GrixChat Trust & Privacy Group</span>
        </div>
      </div>
    </div>
  );
}
