import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { aiService } from '../../../services/AIService';

interface UseChatFormHandlerProps {
  chatId: string;
  receiverId: string;
  user: any;
  addOptimisticMessage: (msg: any) => string;
  confirmOptimisticMessage: (tempId: string, dbMessage: any) => void;
  performSendMessage: (args: { text: string; file?: File; localPreviewUrl?: string; replyTo?: any }) => Promise<any>;
  performEditMessage: (msgId: string, text: string) => Promise<any>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useChatFormHandler({
  chatId,
  receiverId,
  user,
  addOptimisticMessage,
  confirmOptimisticMessage,
  performSendMessage,
  performEditMessage,
  textareaRef,
  scrollToBottom
}: UseChatFormHandlerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<any | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<any | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [uploadProgress] = useState<number>(0);
  const [isUploading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;
    
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviewUrls: string[] = [];
    for (const file of files) {
      try {
        const url = URL.createObjectURL(file);
        newPreviewUrls.push(url);
      } catch (err) {
        console.warn("Could not create local URL for file:", file.name, err);
        newPreviewUrls.push('');
      }
    }
    setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    if (e.target) e.target.value = '';
  }, [user]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user || isSending) return;
    
    const textToSend = newMessage;
    const replyContext = replyingTo;
    const editMsg = editingMessage;
    const filesToSend = [...selectedFiles];
    
    setNewMessage('');
    setReplyingTo(null);
    setEditingMessage(null);
    setSelectedFiles([]);
    setFilePreviewUrls([]);
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSending(true);

    try {
      if (editMsg) {
        await performEditMessage(editMsg.id, textToSend);
      } else {
        if (textToSend) {
          const tempId = addOptimisticMessage({
            content: textToSend,
            type: 'text',
            reply_to: filesToSend.length === 0 ? replyContext : null
          });
          
          performSendMessage({
            text: textToSend,
            replyTo: filesToSend.length === 0 ? replyContext : null
          }).then(async result => {
            if (result && tempId) {
              confirmOptimisticMessage(tempId, result);
            }
            
            // Check if user is asking the Grix AI shortcut
            const trimmed = textToSend.trim();
            if (trimmed.toLowerCase().startsWith('/ai')) {
              // Extract original prompt after /ai
              const promptQuery = trimmed.replace(/^\/ai\s*/i, '').trim();
              if (promptQuery) {
                try {
                  const replyText = await aiService.sendMessage(
                    promptQuery,
                    "Keep your response concise, as this is happening inside a standard text thread. Always keep formatting beautifully flat and user-focused."
                  );
                  
                  // Post AI message live into the database using a custom prefix for client detection 
                  await performSendMessage({
                    text: `🤖 Grix AI: ${replyText}`,
                    replyTo: result || null
                  });
                } catch (grixErr) {
                  console.error("Grix AI inline shortcut error:", grixErr);
                }
              }
            }
          }).catch(err => {
            console.error("Error sending text:", err);
          });
        }
        
        for (let i = 0; i < filesToSend.length; i++) {
          const file = filesToSend[i];
          const localUrl = filePreviewUrls[i];
          const fileType = file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') ? 'video' : 
                           file.type.startsWith('audio/') ? 'audio' : 'file';

          const tempId = addOptimisticMessage({
            content: '',
            media_url: localUrl,
            media_type: fileType,
            type: fileType,
            reply_to: i === 0 && !textToSend ? replyContext : null
          });
          
          performSendMessage({
            text: '',
            file,
            localPreviewUrl: localUrl,
            replyTo: i === 0 && !textToSend ? replyContext : null
          }).then(result => {
            if (result && tempId) {
              confirmOptimisticMessage(tempId, result);
            }
          }).catch(err => console.error("Error sending file:", err));
        }
      }
    } catch (error) {
      console.error("Error sendMessage:", error);
    } finally {
      setIsSending(false);
    }
  }, [
    newMessage, 
    selectedFiles, 
    user, 
    isSending, 
    replyingTo, 
    editingMessage, 
    filePreviewUrls, 
    performEditMessage, 
    performSendMessage, 
    addOptimisticMessage, 
    confirmOptimisticMessage, 
    textareaRef
  ]);

  const handleMessageTap = useCallback((e: any, msg: any) => {
    if (e && e.type === 'touchstart' && e.cancelable) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Support left and right clicks, capturing exact coordinates for the floating menu
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    
    if (e) {
      if (e.clientX !== undefined && e.clientY !== undefined) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (e.nativeEvent) {
        const ne = e.nativeEvent;
        if (ne.clientX !== undefined && ne.clientY !== undefined) {
          x = ne.clientX;
          y = ne.clientY;
        } else if (ne.touches && ne.touches[0]) {
          x = ne.touches[0].clientX;
          y = ne.touches[0].clientY;
        }
      }
    }

    // Attach coordinates directly to message menu item object so UI can anchor nicely
    msg._clickPos = { x, y };
    
    setActiveMessageMenu(msg);
    setShowReactionPicker(null);
    
    try {
      if (window.navigator?.vibrate) window.navigator.vibrate(5);
    } catch (err) {
      // Ignore vibration errors
    }
  }, []);

  const handleSetReplyingTo = useCallback((msg: any) => {
    setReplyingTo(msg);
    if (msg) {
      setEditingMessage(null);
      setNewMessage('');
    }
  }, [setEditingMessage, setNewMessage]);

  const startEdit = useCallback((msg: any) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setNewMessage(msg.content || msg.text || '');
    setActiveMessageMenu(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const val = msg.content || msg.text || '';
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(val.length, val.length);
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 100);
  }, [textareaRef, setNewMessage, setEditingMessage, setActiveMessageMenu, setReplyingTo]);

  return {
    showOptions,
    setShowOptions,
    showPlusMenu,
    setShowPlusMenu,
    isMuted,
    setIsMuted,
    replyingTo,
    setReplyingTo: handleSetReplyingTo,
    editingMessage,
    setEditingMessage,
    activeMessageMenu,
    setActiveMessageMenu,
    showReactionPicker,
    setShowReactionPicker,
    showEmojiPicker,
    setShowEmojiPicker,
    isSending,
    selectedFiles,
    setSelectedFiles,
    filePreviewUrls,
    setFilePreviewUrls,
    uploadProgress,
    isUploading,
    newMessage,
    setNewMessage,
    handleFileChange,
    handleSendMessage,
    handleMessageTap,
    startEdit
  };
}
