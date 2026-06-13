import React, { useState, useRef, useEffect } from 'react';
import { X, SendHorizontal, Loader2, Mic, MicOff, StopCircle, Trash2, Camera as CameraIcon, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChatMessageMenu, 
  ChatEditPreview, 
  ChatReplyPreview, 
  EmojiPickerMenu 
} from '../../components/ChatUIComponents.tsx';
import { useTheme } from '../../contexts/ThemeContext';
import CameraCaptureModal from '../chat-ui/CameraCaptureModal';

interface ChatBottomProps {
  activeMessageMenu: any;
  setActiveMessageMenu: (msg: any) => void;
  setReplyingTo: (msg: any) => void;
  startEdit: (msg: any) => void;
  deleteMessage: (id: string) => void;
  currentUserUid: string | undefined;
  setShowReactionPicker: (msg: any) => void;
  performReactToMessage?: (id: string, emoji: string) => void;
  editingMessage: any;
  setEditingMessage: (msg: any) => void;
  newMessage: string;
  setNewMessage: (text: string | ((prev: string) => string)) => void;
  replyingTo: any;
  receiver: any;
  handleSendMessage: (e: React.FormEvent | { preventDefault: () => void }) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPlusMenu: boolean;
  setShowPlusMenu: (show: boolean) => void;
  plusMenuRef: React.RefObject<HTMLDivElement | null>;
  chatId: string | undefined;
  filePreviewUrls: string[];
  isUploading: boolean;
  uploadProgress: number;
  setSelectedFiles: (files: File[]) => void;
  setFilePreviewUrls: (urls: string[]) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleTyping: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  isSending: boolean;
  selectedFiles: File[];
  placeholder?: string;
  onForwardClick?: (msg: any) => void;
  onSelectClick?: (msg: any) => void;
  onPinClick?: (msg: any) => void;
}

export default function ChatBottom({
  activeMessageMenu,
  setActiveMessageMenu,
  setReplyingTo,
  startEdit,
  deleteMessage,
  currentUserUid,
  setShowReactionPicker,
  performReactToMessage,
  editingMessage,
  setEditingMessage,
  newMessage,
  setNewMessage,
  replyingTo,
  receiver,
  handleSendMessage,
  fileInputRef,
  imageInputRef,
  handleFileChange,
  showPlusMenu,
  setShowPlusMenu,
  plusMenuRef,
  chatId,
  filePreviewUrls,
  isUploading,
  uploadProgress,
  setSelectedFiles,
  setFilePreviewUrls,
  textareaRef,
  handleTyping,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  isSending,
  selectedFiles,
  placeholder = "Message",
  onForwardClick,
  onSelectClick,
  onPinClick
}: ChatBottomProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fallbackImageInputRef = useRef<HTMLInputElement>(null);
  const actualImageInputRef = imageInputRef || fallbackImageInputRef;

  const handleCameraCapture = (file: File, captionText: string) => {
    setSelectedFiles([...selectedFiles, file]);
    setFilePreviewUrls([...filePreviewUrls, URL.createObjectURL(file)]);
    if (captionText.trim()) {
      setNewMessage(captionText);
    }
  };
  const isDark = resolvedTheme === 'dark';
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Automatically focus on replyingTo
  useEffect(() => {
    if (replyingTo && textareaRef?.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo, textareaRef]);

  // Global keydown listeners for quick autofocus on typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Don't intercept if focusing an editable element already
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      // Check if it's a typing key (length is 1, e.g. letters, numbers, spaces, punctuation)
      if (e.key.length === 1 && textareaRef?.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [textareaRef]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ].find(type => MediaRecorder.isTypeSupported(type));

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = mimeType || 'audio/webm';
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type });
          const file = new File([audioBlob], 'voice_message.webm', { type });
          setSelectedFiles([file]);
          setFilePreviewUrls([URL.createObjectURL(audioBlob)]);
        }
        stream.getTracks().forEach(track => track.stop());
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
      };

      mediaRecorder.start(200); // 200ms timeslice for better reliability
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear the onstop handler first so we don't save the cancelled message
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop tracks manually
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  };

  const formatRecTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMicMode = !newMessage.trim() && selectedFiles.length === 0 && !isRecording;

  return (
    <div className="shrink-0 bg-transparent px-2 pb-safe z-50 relative w-full max-w-full">
      <CameraCaptureModal 
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
      <ChatMessageMenu 
        activeMessageMenu={activeMessageMenu}
        setActiveMessageMenu={setActiveMessageMenu}
        setReplyingTo={setReplyingTo}
        startEdit={startEdit}
        deleteMessage={deleteMessage}
        currentUserUid={currentUserUid}
        setShowReactionPicker={setShowReactionPicker}
        performReactToMessage={performReactToMessage}
        onForwardClick={onForwardClick}
        onSelectClick={onSelectClick}
        onPinClick={onPinClick}
      />

      <ChatEditPreview 
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        setNewMessage={(text) => setNewMessage(text)}
      />

      <ChatReplyPreview 
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        receiver={receiver}
        currentUserUid={currentUserUid}
      />

      <div className="flex items-end gap-2 w-full max-w-full relative pb-2 pt-1">
        <div className={`flex-1 min-w-0 rounded-[24px] px-1 sm:px-2 flex flex-col transition-all shadow-sm ${
          isDark ? 'bg-[#2a2c30]' : 'bg-[#f0f2f5]'
        } ${isRecording ? 'animate-pulse' : ''}`}>
          {selectedFiles.length > 0 && !isRecording && (
            <div className="mt-2 mb-1 px-2 relative w-full overflow-x-auto">
              <div className="flex items-center gap-2 pb-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-md w-[80px] h-[80px] bg-black/20 p-1 flex items-center justify-center">
                    {filePreviewUrls[index] ? (
                      file.type.startsWith('video/') ? (
                        <video src={filePreviewUrls[index]} className="w-full h-full object-cover rounded-lg" muted />
                      ) : (
                        <img src={filePreviewUrls[index]} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Paperclip className="text-white/60" size={18} />
                        <p className="text-[8px] text-white/60 font-bold truncate w-[60px] text-center">{file.name}</p>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => {
                        const newFiles = [...selectedFiles];
                        const newUrls = [...filePreviewUrls];
                        newFiles.splice(index, 1);
                        newUrls.splice(index, 1);
                        setSelectedFiles(newFiles);
                        setFilePreviewUrls(newUrls);
                      }}
                      className="absolute top-0.5 right-0.5 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all shadow-sm z-10"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-end w-full min-h-[48px] pb-0.5">
            {isRecording ? (
              <div className="flex-1 min-w-0 flex items-center justify-between py-2.5 px-3 self-center">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  <span className={`text-[15px] font-medium ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{formatRecTime(recordingTime)}</span>
                </div>
                <button 
                  onClick={cancelRecording}
                  className={`px-3 py-1 text-[12px] active:scale-95 transition-all ${isDark ? 'text-white/60' : 'text-black/60'}`}
                >
                  Swipe to cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center shrink-0 mb-1">
                  <EmojiPickerMenu 
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    emojiPickerRef={emojiPickerRef}
                    onEmojiSelect={(emoji) => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                  />
                </div>

                <textarea 
                  ref={textareaRef}
                  placeholder={placeholder}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  rows={1}
                  className={`flex-1 bg-transparent text-[17px] focus:outline-none py-2.5 px-2 resize-none max-h-[120px] leading-tight ${
                    isDark 
                      ? 'text-zinc-100 placeholder:text-zinc-500' 
                      : 'text-zinc-800 placeholder:text-zinc-400'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isMicMode) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                />

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pr-1 mb-1 self-end">
                  {!newMessage.trim() && selectedFiles.length === 0 && (
                    <button 
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className={`p-2 transition-colors flex items-center justify-center rounded-full ${
                        isDark 
                          ? 'text-[#a0aab8] hover:text-white hover:bg-white/5' 
                          : 'text-[#64748b] hover:text-black hover:bg-black/5'
                      }`}
                      title="Camera"
                    >
                      <CameraIcon size={22} />
                    </button>
                  )}

                  <input 
                    type="file" 
                    ref={actualImageInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    multiple
                  />

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="*/*"
                    multiple
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 transition-colors flex items-center justify-center rounded-full ${
                      isDark 
                        ? 'text-[#a0aab8] hover:text-white hover:bg-white/5' 
                        : 'text-[#64748b] hover:text-black hover:bg-black/5'
                    }`}
                    title="Attach"
                  >
                    <Paperclip size={22} className="-rotate-45" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <button 
          type="button" 
          onClick={(e) => {
            if (isRecording) {
              stopRecording();
            } else if (isMicMode) {
              startRecording();
            } else {
              handleSendMessage(e as any);
            }
          }}
          disabled={((!newMessage.trim() && selectedFiles.length === 0) && !isMicMode && !isRecording) || isSending}
          className={`shrink-0 w-[48px] h-[48px] flex items-center justify-center rounded-full transition-all active:scale-95 text-white shadow-md ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-40'
          }`}
        >
          {isSending ? (
            <Loader2 size={24} className="animate-spin text-white" />
          ) : isRecording ? (
            <StopCircle size={24} />
          ) : isMicMode ? (
            <Mic size={24} />
          ) : (
            <SendHorizontal size={24} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

