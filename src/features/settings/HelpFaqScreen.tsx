import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageSquare, Shield, HelpCircle, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingHeader from '../../components/layout/SettingHeader.tsx';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'account' | 'chats' | 'safety';
}

export default function HelpFaqScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'account' | 'chats' | 'safety'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: 'What is GrixChat?',
      answer: 'GrixChat is a ultra-modern full-featured messaging app designed with a sleek mobile interface inspired by WhatsApp and Instagram. It supports secure real-time messaging, audio/video calls, horizontal stories, group chats, hidden conversations, offline state capabilities, and custom settings.'
    },
    {
      category: 'general',
      question: 'Is GrixChat free to use?',
      answer: 'Yes! GrixChat is fully free. Built on a highly cost-efficient serverless backend with Supabase, GrixChat is architected to handle up to 50k users on a free-tier resource allocation, making it highly scalable and light-weight.'
    },
    {
      category: 'account',
      question: 'How do I change my profile avatar or bio?',
      answer: 'Navigate to the Profile tab from the bottom navigation. Tap directly on your Profile Card or the pencil edit icon to open the Edit Profile screen. From there you can upload your custom photo, customize username, input full name and bio details.'
    },
    {
      category: 'chats',
      question: 'How do I add or share a dynamic story?',
      answer: 'Go to your primary Chats list. Tap the "+" plus symbol or your profile avatar circle at the start of the "Your Story" horizon bar. It opens a system image picker instantly. Select any image from your device gallery to share it immediately as an active story.'
    },
    {
      category: 'chats',
      question: 'How does the Story Viewer work?',
      answer: 'Stories appear horizontally in circles near the top of the chat view. Simply tap on any profile circle to watch their active stories. Once you have active stories shared, other users can tap your circle in your chats list or directly on your user profile pages to view them.'
    },
    {
      category: 'chats',
      question: 'Can I archive or hide individual chats?',
      answer: 'Yes! Slide a chat or open Chat Options directly from the active chat view. By selecting Hidden or Archived, you can clean your inbox. Hidden chats can be set with a secret passcode, which unlocks them when inputted into the search box!'
    },
    {
      category: 'safety',
      question: 'How do I configure a pin/passcode lock for my app?',
      answer: 'Go to the Profile tab, tap "Privacy & Security" or "App Lock" under Account settings. Here, you can enable a safe App-wide PIN/Passcode protection, so your personal conversations remain strictly inaccessible to anyone else.'
    },
    {
      category: 'safety',
      question: 'Is GrixChat secure and encrypted?',
      answer: 'Absolutely. All direct interactions, messaging operations, and personal assets are served over encrypted parameters. Our PostgreSQL database is safeguarded by strict Row Level Security (RLS) rules in Supabase to block unauthorized read or write operations.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'general', label: 'General', icon: Sparkles },
    { id: 'account', label: 'My Account', icon: Star },
    { id: 'chats', label: 'Chats & Stories', icon: MessageSquare },
    { id: 'safety', label: 'Security & Safety', icon: Shield }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader title="FAQ & FAQs" />

      {/* Header Search Banner */}
      <div className="bg-[var(--bg-card)] px-5 py-4 border-b border-[var(--border-color)]/30">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)]/55 rounded-2xl py-3 pl-11 pr-4 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-secondary)]/50"
            placeholder="Search help questions, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-[var(--text-secondary)] opacity-50" size={15} />
        </div>
      </div>

      {/* Categories horizontal list */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-5 py-3 border-b border-[var(--border-color)]/20 shrink-0 bg-[var(--bg-card)]">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                setExpandedIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                isActive 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                  : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]/20'
              }`}
            >
              <Icon size={12} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div 
                key={index} 
                className={`bg-[var(--bg-card)] border rounded-2xl transition-all overflow-hidden ${
                  isExpanded ? 'border-[var(--primary)]/30 ring-2 ring-[var(--primary)]/5' : 'border-[var(--border-color)]/40 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <span className="p-1 rounded-full bg-[var(--bg-main)] text-[var(--text-secondary)] shrink-0">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/20 bg-zinc-50/5 font-medium">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border-color)] mb-4 shadow-sm text-[var(--text-secondary)]">
              <Search size={22} className="opacity-30" />
            </div>
            <h4 className="text-sm font-extrabold text-[var(--text-primary)]">No matching questions</h4>
            <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mt-1">
              Try searching with another keyword or pick one of the active categories above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
