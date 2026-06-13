import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Sparkles, Zap, Cpu, ArrowLeft, Phone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService, AIMessage, AIModelType } from '../../services/AIService.ts';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../providers/AuthProvider.tsx';

import ChatHeader from '../../components/layout/ChatHeader.tsx';
import ChatBottom from '../../components/layout/ChatBottom.tsx';
import { MessageList } from '../chat/components/MessageList';

// Sub-component modular imports
import { GrixAIThinking } from './components/GrixAIThinking';
import { MessageQualityBadge } from './components/MessageQualityBadge';
import { getActiveChatsContext } from './utils/grixaiHelpers';
import { GrixAISettingsSheet } from './components/GrixAISettingsSheet';
import { GrixAITelemetryOverlay } from './components/GrixAITelemetryOverlay';

export default function GrixAIScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chatBackground } = useTheme();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModelType>(aiService.getCurrentModel());
  const [isSending, setIsSending] = useState(false);
  
  const [activeMessageMenu, setActiveMessageMenu] = useState<any | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Telemetry Console state
  const [selectedTelemetryMsg, setSelectedTelemetryMsg] = useState<AIMessage | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(aiService.getMessages());
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages, isTyping, scrollToBottom]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || newMessage;
    if (!textToSend.trim() || isSending) return;

    if (!customText) setNewMessage('');
    setIsSending(true);

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      text: textToSend,
      senderId: 'user',
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    aiService.saveMessages(newMessages);
    setIsTyping(true);

    try {
      const chatContext = getActiveChatsContext(user?.id || '');
      const responseText = await aiService.sendMessage(textToSend, chatContext);
      
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        senderId: 'ai',
        timestamp: Date.now()
      };
      
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      aiService.saveMessages(finalMessages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handlePillClick = (action: 'analyze' | 'important') => {
    const query = action === 'analyze' 
      ? 'Analyse my chats and state who I talked to today on GrixChat.' 
      : 'Are there any updates, locked records, or important message events I need to pay attention to?';
    handleSendMessage(undefined, query);
  };

  const clearChat = () => {
    if (window.confirm('Clear all messages with Grix AI?')) {
      aiService.clearMessages();
      setMessages(aiService.getMessages());
      setShowOptions(false);
    }
  };

  const toggleModel = (model: AIModelType) => {
    aiService.setModel(model);
    setCurrentModel(model);
    setShowOptions(false);
  };

  const aiReceiver = {
    uid: 'grix-ai',
    fullName: currentModel === 'grix-ai-pro' ? 'Grix AI Pro' : 'Grix AI',
    username: 'grixai',
    photoURL: '/assets/favicon.png',
    status: 'online'
  };

  const chatMessages = messages.map(m => {
    const isMe = m.senderId === 'user';
    const sId = isMe ? (user?.id || 'user') : 'grix-ai';
    return {
      id: m.id,
      text: m.text,
      content: (
        <div className="flex flex-col gap-1.5">
          {!isMe && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTelemetryMsg(m);
              }}
              className="mr-auto mb-1.5 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/5 dark:text-indigo-600 border border-indigo-500/15 hover:bg-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer leading-none"
            >
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              ⚡ Working: Tap to See
            </button>
          )}
          <span>{m.text}</span>
          {isMe && <MessageQualityBadge text={m.text} />}
        </div>
      ) as any,
      sender_id: sId,
      senderId: sId,
      created_at: new Date(m.timestamp).toISOString(),
      timestamp: m.timestamp,
      type: 'text'
    };
  });

  // Inject Google AI Studio style thinking inline bubble inside message thread stream
  if (isTyping) {
    chatMessages.push({
      id: 'grix-ai-thinking-placeholder',
      text: '',
      content: (
        <GrixAIThinking 
          onTap={() => setSelectedTelemetryMsg({ id: 'pending', text: 'Analysing neural consensus grids in real time with parallel models...', senderId: 'ai', timestamp: Date.now() })} 
        />
      ) as any,
      sender_id: 'grix-ai',
      senderId: 'grix-ai',
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'text'
    });
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-[var(--bg-main)] overflow-hidden relative">
      <ChatHeader 
        receiver={aiReceiver}
        receiverId="grix-ai"
        formatLastSeen={() => "Always Online"}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        isMuted={false}
        setIsMuted={() => {}}
        deleteChat={clearChat}
        hideChat={() => {}}
        archiveChat={() => {}}
        isHidden={false}
        isArchived={false}
        optionsRef={{ current: null } as any}
        isTyping={isTyping}
        receiverStatus="online"
        receiverActiveChatId={null}
        currentUserId={user?.id}
        type="direct"
      />

      <AnimatePresence>
        {showOptions && (
          <GrixAISettingsSheet 
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            currentModel={currentModel}
            toggleModel={toggleModel}
            messagesCount={messages.length}
            clearChat={clearChat}
          />
        )}
      </AnimatePresence>

      <MessageList 
        scrollContainerRef={scrollContainerRef}
        messagesEndRef={messagesEndRef}
        handleScroll={() => {}}
        chatBackground={chatBackground}
        loadingMore={false}
        loading={false}
        messages={chatMessages}
        messageLimit={999}
        convType="direct"
        receiver={aiReceiver}
        activeMessageMenu={activeMessageMenu}
        setActiveMessageMenu={setActiveMessageMenu}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        showReactionPicker={showReactionPicker}
        setShowReactionPicker={setShowReactionPicker}
        receiverStatus="online"
        handleMessageTap={(e, msg) => {
          if (e && e.stopPropagation) e.stopPropagation();
          let x = window.innerWidth / 2;
          let y = window.innerHeight / 2;
          if (e) {
            if (e.clientX !== undefined && e.clientY !== undefined) {
              x = e.clientX;
              y = e.clientY;
            } else if (e.touches && e.touches[0]) {
              x = e.touches[0].clientX;
              y = e.touches[0].clientY;
            }
          }
          msg._clickPos = { x, y };
          setActiveMessageMenu(activeMessageMenu?.id === msg.id ? null : msg);
        }}
        performReactToMessage={() => {}}
        isOtherTyping={false}
      />      {/* Suggestion Chips Panel directly above Typing bar */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth shrink-0 border-t border-[var(--border-color)]/30 bg-[var(--bg-card)]/50 backdrop-blur-md">
        <button 
          onClick={() => handlePillClick('analyze')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] font-bold hover:border-indigo-500 hover:text-indigo-400 active:scale-95 transition-all text-left cursor-pointer"
        >
          <span>🔍</span> Analyze my chats
        </button>
        <button 
          onClick={() => handlePillClick('important')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] font-bold hover:border-indigo-500 hover:text-indigo-400 active:scale-95 transition-all text-left cursor-pointer"
        >
          <span>⚠️</span> Important messages?
        </button>
      </div>

      <ChatBottom 
        activeMessageMenu={activeMessageMenu}
        setActiveMessageMenu={setActiveMessageMenu}
        setReplyingTo={setReplyingTo}
        startEdit={() => {}}
        deleteMessage={() => {}}
        currentUserUid={user?.id}
        setShowReactionPicker={setShowReactionPicker}
        editingMessage={null}
        setEditingMessage={() => {}}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        replyingTo={replyingTo}
        receiver={aiReceiver}
        handleSendMessage={handleSendMessage}
        fileInputRef={{ current: null } as any}
        imageInputRef={{ current: null } as any}
        handleFileChange={() => {}}
        showPlusMenu={false}
        setShowPlusMenu={() => {}}
        plusMenuRef={{ current: null } as any}
        chatId="grix-ai"
        filePreviewUrls={[]}
        isUploading={false}
        uploadProgress={0}
        setSelectedFiles={() => {}}
        setFilePreviewUrls={() => {}}
        textareaRef={textareaRef}
        handleTyping={() => {}}
        showEmojiPicker={false}
        setShowEmojiPicker={() => {}}
        emojiPickerRef={{ current: null } as any}
        isSending={isSending}
        selectedFiles={[]}
        placeholder={`Ask Grix AI...`}
      />

      {/* Popups & Full-screen Overlays */}
      <AnimatePresence>
        {selectedTelemetryMsg && (
          <GrixAITelemetryOverlay 
            onClose={() => setSelectedTelemetryMsg(null)}
            messageId={selectedTelemetryMsg.id}
            messageText={selectedTelemetryMsg.text}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
