import React, { useState } from 'react';
import { Phone, Video, Search, X, User } from 'lucide-react';
import Avatar from '../../../components/common/Avatar';

interface ContactRecord {
  id: string;
  username: string;
  fullName: string;
  photoURL: string;
  isOnline: boolean;
}

interface CallsContactsListProps {
  contacts: ContactRecord[];
  loading: boolean;
  onCall: (userId: string, type: 'voice' | 'video') => void;
  searchTerm?: string;
}

export const CallsContactsList: React.FC<CallsContactsListProps> = ({
  contacts,
  loading,
  onCall,
  searchTerm
}) => {
  const [query, setQuery] = useState('');

  const activeSearch = searchTerm !== undefined ? searchTerm : query;

  const filtered = contacts.filter((c) =>
    (c.fullName || '').toLowerCase().includes(activeSearch.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(activeSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* Premium Search Bar with high-contrast active bounds - Show only if parent is not controlling searching */}
      {searchTerm === undefined && (
        <div className="px-4">
          <div className="relative flex items-center bg-[var(--bg-main)] hover:bg-[var(--bg-main)]/90 focus-within:bg-[var(--bg-main)] rounded-xl px-3.5 h-10 border border-[var(--border-color)]/45 focus-within:border-[#0494f4]/80 focus-within:ring-2 focus-within:ring-[#0494f4]/15 shadow-sm transition-all duration-200">
            <Search size={15} className="text-[var(--text-secondary)] mr-2.5 opacity-75 shrink-0 transition-opacity focus-within:text-[#0494f4]" />
            <input
              type="text"
              placeholder="Search contact name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-extrabold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 shrink-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X size={13} className="text-[var(--text-secondary)]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="flex flex-col bg-[var(--bg-card)] pb-8 shrink-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin" />
            <p className="text-[9px] font-black tracking-wider text-[var(--text-secondary)] uppercase">
              Loading Friends...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6">
            <div className="flex flex-col items-center justify-center py-16 text-center select-none bg-[var(--bg-card)]/50 border border-[var(--border-color)]/25 rounded-2xl p-6 shadow-sm">
              <User size={24} className="text-[#0494f4]/60 mb-2" />
              <p className="text-xs font-black text-[var(--text-primary)]">No contacts found</p>
              <p className="text-[10px] text-[var(--text-secondary)]/70 mt-1 max-w-[200px] leading-relaxed">
                Navigate to the Search Tab to follow users and create mutual Grixchat friends!
              </p>
            </div>
          </div>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-all border-b border-[var(--border-color)]/5 last:border-0 group cursor-pointer select-none"
            >
              <Avatar url={contact.photoURL} name={contact.username} isOnline={contact.isOnline} />
              
              {/* Detailed Row matching ChatUserList specifications */}
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="text-[14.5px] truncate font-semibold text-[var(--text-primary)]">
                    {contact.fullName || contact.username}
                  </h4>
                  <p className="text-[13px] text-[var(--text-secondary)] opacity-75 mt-0.5">
                    @{contact.username}
                  </p>
                </div>
                {/* Elegant Action Buttons on the Right matching official Avatar proportions and styling exactly */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Voice Call Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(contact.id, 'voice');
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#0494f4] hover:bg-[var(--border-color)]/10 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
                    title="Voice Call"
                  >
                    <Phone size={22} className="stroke-[2.2]" />
                  </button>
 
                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(contact.id, 'video');
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#0494f4] hover:bg-[var(--border-color)]/10 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
                    title="Video Call"
                  >
                    <Video size={22} className="stroke-[2.2]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
