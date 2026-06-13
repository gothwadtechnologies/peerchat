import React from 'react';
import { FileText, Sparkles, AlertCircle, ShieldAlert, CheckCircle, Mail } from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

export default function TermsAndConditionsScreen() {
  const officialContacts = [
    { label: 'Grix Team Support', email: 'support@grixchat.com' },
    { label: 'General Inbox', email: 'grixchat@gmail.com' },
    { label: 'Grix Admin Pawandev', email: 'pawangothwad@gmail.com' }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-main)] flex flex-col font-sans no-scrollbar pb-10">
      <SettingHeader title="Terms of Service" />
      
      <div className="w-full px-5 pt-6 z-10 flex flex-col min-h-full">
        {/* Header Intro Card */}
        <div className="text-center mb-8 mt-4 bg-[var(--bg-card)] border border-[var(--border-color)]/35 p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-14 bg-indigo-500/10 text-indigo-500 flex items-center justify-center rounded-2xl mx-auto mb-3">
            <FileText size={26} />
          </div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">Grix Terms & Conditions</h2>
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mt-1.5 font-mono">
            Effective Date: May 2026
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed max-w-[280px] mx-auto">
            Please parse our terms carefully before registering on the GrixChat real-time messaging client app.
          </p>
        </div>

        {/* Content body blocks */}
        <div className="space-y-5 text-[var(--text-primary)] leading-relaxed text-xs">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle size={13} className="text-indigo-500" />
              <span>1. Intellectual Agreement</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              By setting up an active account on GrixChat, you represent that you hold standard legitimate rights to access the layout resources. All original logos, specific fonts, styles, and configurations belong strictly to the GrixChat Team and authorized creators.
            </p>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-rose-500" />
              <span>2. Code of User Conduct</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-1">
              To keep our scaling group-chats, broadcast channels, and public interactions safe for up to 50k+ active users, you represent that:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[var(--text-secondary)] font-medium">
              <li>You shall not distribute malware or disrupt server integrity</li>
              <li>You shall not masquerade as another individual or write false usernames</li>
              <li>You shall respect user boundaries, blocks, and privacy settings</li>
              <li>You shall not publish explicit, illegal, or harassing visual assets or stories</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-500" />
              <span>3. Service Limitations</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              GrixChat provides client applications and server syncing as-is. Under the scalable free backend structure we deploy, we perform standard platform updates, periodic cache cleanups, and maintenance windows, which may cause short transient offline states.
            </p>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#0494f4]" />
              <span>4. Indian Jurisdiction & Law</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              These terms are established in general alignment with standard laws database schemas, specifically governed by the information security regulations under regional forums in the Union of India.
            </p>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Mail size={13} className="text-indigo-500" />
              <span>5. Grix Legal Representatives</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              If you have suggestions, dispute resolutions, copyright reporting, or specific questions about registration agreements, mail us at:
            </p>
            <div className="space-y-1.5 pt-1">
              {officialContacts.map((contact, index) => (
                <div key={index} className="flex justify-between items-center text-[11px] text-[var(--text-secondary)] border-b border-[var(--border-color)]/20 pb-1 w-full flex-wrap">
                  <span className="font-bold text-[var(--text-primary)]">{contact.label}:</span>
                  <a href={`mailto:${contact.email}`} className="text-[#0494f4] font-mono select-all hover:underline">{contact.email}</a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Closing trust banner */}
        <div className="mt-8 text-center opacity-30 select-none pb-6">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-primary)]">GrixChat Legal Operations</span>
        </div>
      </div>
    </div>
  );
}
