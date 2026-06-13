import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { P2PService } from '../../services/P2PService';
import { useConversations } from './hooks/useConversations';
import { supabase, safeLocalStorage } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Copy, 
  Check, 
  File, 
  Image, 
  Send, 
  Paperclip, 
  FolderLock, 
  UserPlus, 
  Activity, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  Info, 
  Cpu, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import CommonSearchBar from '../../components/common/CommonSearchBar';

interface LocalTransferLog {
  id: string;
  sender_name: string;
  receiver_name: string;
  file_name: string;
  file_size: string;
  file_type: string;
  file_url: string;
  direction: 'sent' | 'received';
  timestamp: string;
}

export default function ShareTab() {
  const { user: authUser } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState('');
  const [selectedPeerName, setSelectedPeerName] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [transferLogs, setTransferLogs] = useState<LocalTransferLog[]>([]);
  
  // Track continuous WebRTC connection metrics
  const [wsStatus, setWsStatus] = useState(P2PService.wsStatus);
  const [rtcStatus, setRtcStatus] = useState(P2PService.rtcConnectionStatus);
  const [connectedPeersCount, setConnectedPeersCount] = useState(P2PService.connectedPeers.size);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat contacts to find previous companions
  const { conversations, loading: contactsLoading } = useConversations('Chats');

  // Filter contacts by search query
  const availableContacts = conversations.filter(c => {
    if (c.type === 'group') return false; // purely direct chats
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return (c.user || '').toLowerCase().includes(term) || (c.username || '').toLowerCase().includes(term);
  });

  // Keep WebRTC connection status fully reactive inside the component
  useEffect(() => {
    const unsubscribe = P2PService.registerStatusListener(() => {
      setWsStatus(P2PService.wsStatus);
      setRtcStatus(P2PService.rtcConnectionStatus);
      setConnectedPeersCount(P2PService.connectedPeers.size);
    });

    // Populate custom files transferred through messages table in local Supabase mock
    const fetchTransfers = async () => {
      try {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .not('file_url', 'is', null)
          .order('created_at', { ascending: false });

        if (messages) {
          const formatted: LocalTransferLog[] = messages.map(m => {
            const isSent = m.sender_id === authUser?.id;
            const fileSizeText = m.text?.match(/Size:\s*([^\s)]+)/)?.[1] || 'Unknown';
            return {
              id: m.id,
              sender_name: isSent ? 'Me' : m.sender_name || 'Partner',
              receiver_name: isSent ? (m.sender_name || 'Recipient') : 'Me',
              file_name: m.file_name || 'attachment_file',
              file_size: fileSizeText,
              file_type: m.file_type || 'file',
              file_url: m.file_url,
              direction: isSent ? 'sent' : 'received',
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          });
          setTransferLogs(formatted);
        }
      } catch (err) {
        console.warn("Could not query files transfers:", err);
      }
    };

    fetchTransfers();

    // Re-check periodically
    const timer = setInterval(fetchTransfers, 3500);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [authUser?.id]);

  const handleCopyPeerId = () => {
    const peerId = safeLocalStorage.getItem('grix_peer_id') || '';
    if (!peerId) return;
    navigator.clipboard.writeText(peerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const triggerUploadFile = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDirectPeerSelection = (contact: any) => {
    setSelectedPeerId(contact.otherUserId);
    setSelectedPeerName(contact.user);
    setSelectedConversationId(contact.id);
  };

  const handleSendP2PFile = async () => {
    if (!selectedFile) return;
    if (!selectedPeerId) {
      alert("Please select a recipient before sending!");
      return;
    }

    setSending(true);
    setUploadProgress(10);

    try {
      // 1. Convert file locally to base64 so it travels purely offline over WebRTC
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        setUploadProgress(40);
        const dataUrl = event.target?.result as string;
        
        setUploadProgress(70);
        // Save the active room locally so it targets the right connection session
        const previousActiveRoom = safeLocalStorage.getItem('grix_active_room_id');
        
        // Temporarily swap active room in P2P coordinator to route to selected partner conversation
        safeLocalStorage.setItem('grix_active_room_id', selectedConversationId);
        
        const fileObj = {
          url: dataUrl,
          type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
          name: selectedFile.name
        };

        const fileSizeText = formatBytes(selectedFile.size);
        const textPayload = `Shared a file: ${selectedFile.name} (Size: ${fileSizeText})`;

        // Broadcast file package instantly
        await P2PService.sendMessage(textPayload, fileObj);

        // Restore historical active room
        if (previousActiveRoom) {
          safeLocalStorage.setItem('grix_active_room_id', previousActiveRoom);
        }

        setUploadProgress(100);
        setTimeout(() => {
          setSending(false);
          setSelectedFile(null);
          setUploadProgress(0);
        }, 8000);
      };

      reader.readAsDataURL(selectedFile);

    } catch (e) {
      console.error("WebRTC File Transfer Fail:", e);
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] min-h-[100dvh] pb-32 overflow-y-auto no-scrollbar">

      <div className="p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">

        {/* Diagonal Identity Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Identity Box */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[130px]">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none text-blue-500">
              <Cpu size={120} strokeWidth={1} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] flex items-center gap-1">
                <Sparkles size={11} className="text-yellow-500" />
                My Peer Identifier
              </p>
              <h2 className="text-lg font-black text-[var(--text-primary)] mt-1 tracking-tight">
                {authUser?.user_metadata?.full_name || 'GrixPeer_Guest'}
              </h2>
              <code className="text-xs text-blue-500 font-mono mt-1 block select-all break-all bg-zinc-950/40 p-1.5 rounded-lg border border-[var(--border-color)]/10">
                {authUser?.id || 'Generating identifier...'}
              </code>
            </div>
            <button 
              onClick={handleCopyPeerId}
              className="mt-3 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-[var(--text-primary)] font-bold flex items-center justify-center gap-1.5 border border-zinc-700/30 transition-all self-start active:scale-95 shadow-sm"
            >
              {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedId ? 'Copied to clipboard' : 'Copy Share Identifier'}</span>
            </button>
          </div>

          {/* WebRTC Diagnostics Panel */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md flex flex-col gap-4 justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500 animate-pulse" />
              WebRTC Diagnostics
            </h3>
            
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--text-secondary)]">Signaling Bridge:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  wsStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  {wsStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--text-secondary)]">Data Channels:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  rtcStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {rtcStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--text-secondary)]">Direct Peer-Mesh:</span>
                <span className="text-white bg-blue-500/20 px-2 py-0.5 rounded text-[10px] font-black">
                  {connectedPeersCount} Active Connected
                </span>
              </div>
            </div>

            <p className="text-[9px] text-[var(--text-secondary)] italic font-medium leading-normal bg-zinc-950/20 p-2 rounded-lg">
              Files are transferred peer-to-peer using high velocity RTCPeerConnection channels.
            </p>
          </div>

        </div>

        {/* Step 1: Select Chat Peer */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-3">
            <span className="bg-blue-500 text-black w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center">1</span>
            Select Recipients From Chats
          </h2>

          <CommonSearchBar 
            placeholder="Filter previous chat mates..."
            value={searchText}
            onChange={setSearchText}
            onClear={() => setSearchText('')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-h-[160px] overflow-y-auto no-scrollbar">
            {availableContacts.length === 0 ? (
              <div className="col-span-2 py-6 text-center text-xs text-[var(--text-secondary)] font-bold">
                No active chat connections found. Chat with someone first!
              </div>
            ) : (
              availableContacts.map(c => {
                const isSelected = selectedPeerId === c.otherUserId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleDirectPeerSelection(c)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      isSelected 
                        ? 'bg-blue-500/10 border-blue-500/80 shadow-md text-white' 
                        : 'bg-zinc-900/40 border-[var(--border-color)]/10 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <Avatar 
                      url={c.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.otherUserId}`}
                      name={c.user || 'Peer'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-[var(--text-primary)]">
                        {c.user}
                      </p>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                        @{c.username || 'peer_agent'}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="p-1.5 bg-blue-500 text-black rounded-lg">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: File Selector & Transmitter */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <span className="bg-blue-500 text-black w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center">2</span>
            Secured Attachment Port
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerUploadFile}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
              dragging 
                ? 'border-blue-500 bg-blue-500/5' 
                : 'border-[var(--border-color)]/20 hover:border-zinc-600 bg-zinc-950/20'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <div className="p-4 bg-zinc-900 rounded-full text-[var(--text-secondary)] mb-3 shadow-md border border-[var(--border-color)]/10">
              <Paperclip size={24} className="opacity-80" />
            </div>

            {selectedFile ? (
              <div className="max-w-md">
                <p className="text-xs font-bold text-white mb-0.5 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-blue-400 font-black uppercase">{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-black text-[var(--text-primary)]">Drag & drop files here, or tap to browse</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">Supports screens, PDFs, code files, APKs, or audio bundles</p>
              </div>
            )}
          </div>

          {/* Action trigger button */}
          <div className="flex flex-col gap-3">
            {sending && (
              <div className="w-full">
                <div className="flex justify-between text-[10px] font-extrabold uppercase mb-1">
                  <span className="text-blue-500">Converting and Sending over WebRTC...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-blue-500 rounded-full" 
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSendP2PFile}
              disabled={sending || !selectedFile || !selectedPeerId}
              className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                !selectedFile || !selectedPeerId
                  ? 'bg-zinc-800 text-[var(--text-secondary)] cursor-not-allowed opacity-60'
                  : 'bg-blue-500 hover:bg-blue-600 text-black shadow-lg shadow-blue-500/20 font-sans'
              }`}
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>TRANSMITTING PEER-TO-PEER</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Share P2P File Securely</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 3: Files Transfer Logs */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <FolderLock size={14} className="text-emerald-500" />
              Decentralized Transfer History
            </h2>
            <span className="text-[10px] font-black text-[var(--text-secondary)] bg-zinc-950/40 px-2 py-0.5 rounded">
              {transferLogs.length} Files Shared
            </span>
          </div>

          {transferLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-secondary)] font-bold bg-zinc-950/10 rounded-xl border border-dashed border-[var(--border-color)]/10">
              No files shared yet in this device session. Try sharing a file!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[290px] overflow-y-auto no-scrollbar">
              {transferLogs.map(log => {
                const isSent = log.direction === 'sent';
                return (
                  <div 
                    key={log.id} 
                    className="p-3 bg-zinc-900/30 rounded-xl border border-[var(--border-color)]/10 flex items-center justify-between gap-3 hover:border-[var(--border-color)]/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg text-xs flex items-center justify-center ${
                        isSent ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isSent ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-white truncate max-w-[210px]">{log.file_name}</p>
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded uppercase font-bold text-center">
                            {log.file_size}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">
                          {isSent ? `To: ${log.receiver_name}` : `From: ${log.sender_name}`} • {log.timestamp}
                        </p>
                      </div>
                    </div>

                    <a 
                      href={log.file_url} 
                      download={log.file_name}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 rounded-lg text-[10px] font-extrabold text-blue-400 hover:text-blue-300 transition-all border border-[var(--border-color)]/10 flex items-center gap-1"
                    >
                      <Download size={11} />
                      <span>Download</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
