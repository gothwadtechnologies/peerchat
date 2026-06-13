// Infinite-mesh peer-to-peer real-time coordinator (P2PService)
// Relays signalling messages over the local Node.js Express/WebSocket port,
// establishes RTCPeerConnection, and synchronizes data off-grid via RTCDataChannel.

import { supabase, safeLocalStorage } from '../lib/supabase';

interface P2PMessage {
  id: string;
  senderPeerId: string;
  senderName: string;
  text: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  replyTo?: string;
  createdAt: string;
}

class P2PServiceCoordinator {
  private ws: WebSocket | null = null;
  private peerId: string = '';
  private peerName: string = '';
  private roomId: string = '';
  
  // Connection state trackers
  public wsStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  public rtcConnectionStatus: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' = 'new';
  public connectedPeers: Map<string, { peerName: string; pc: RTCPeerConnection; channel?: RTCDataChannel }> = new Map();
  public logs: string[] = [];

  // Listeners
  private statusListeners: Set<() => void> = new Set();
  
  // WebRTC configuration
  private rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  constructor() {
    this.addLog("P2P coordinator initialized.");
  }

  public addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift(`[${timestamp}] ${msg}`);
    if (this.logs.length > 50) this.logs.pop();
    this.triggerListeners();
  }

  public registerStatusListener(cb: () => void) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private triggerListeners() {
    this.statusListeners.forEach(cb => { try { cb(); } catch (_) {} });
  }

  // Initialize and connect WS signaling
  public init() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.peerId = safeLocalStorage.getItem('grix_peer_id') || 'peer-' + Math.random().toString(36).substring(2, 9);
    this.peerName = safeLocalStorage.getItem('grix_peer_name') || 'GrixPeer_Guest';
    
    // Save locally
    safeLocalStorage.setItem('grix_peer_id', this.peerId);
    safeLocalStorage.setItem('grix_peer_name', this.peerName);

    // Derive host location matching parent context
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; 
    const wsUrl = `${protocol}//${host}`;

    this.addLog(`Connecting to signaling bridge: ${wsUrl}`);
    this.wsStatus = 'connecting';
    this.triggerListeners();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.addLog("Signaling bridge established!");
        this.wsStatus = 'connected';
        this.triggerListeners();
        
        // Auto join active room if exist in storage
        const activeRoom = safeLocalStorage.getItem('grix_active_room_id');
        if (activeRoom) {
          this.joinRoom(activeRoom);
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleSignalingMessage(msg);
        } catch (e) {
          console.error("Failed to parse signaling packet:", e);
        }
      };

      this.ws.onclose = () => {
        this.addLog("Signaling bridge disconnected. Retrying in 4s...");
        this.wsStatus = 'disconnected';
        this.connectedPeers.clear();
        this.triggerListeners();
        setTimeout(() => this.init(), 4000);
      };

      this.ws.onerror = (err) => {
        console.warn("Signaling socket error:", err);
        this.wsStatus = 'disconnected';
        this.triggerListeners();
      };
    } catch (e: any) {
      this.addLog(`Signaling startup failed: ${e.message}`);
    }
  }

  // Join serverless P2P room by ID
  public joinRoom(room: string) {
    if (!room) return;
    this.roomId = room;
    safeLocalStorage.setItem('grix_active_room_id', room);
    
    this.addLog(`Joining room: ${room}`);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join-room',
        roomId: room,
        peerId: this.peerId,
        peerName: this.peerName
      }));
    }
    
    // Ensure this conversation exists in local mock database so that it renders in the chat feed
    this.ensureLocalRoom(room);
  }

  // Helper: setup local database mock entries
  private async ensureLocalRoom(room: string) {
    try {
      const { data: existing } = await supabase.from('conversations').select('*').eq('id', room).maybeSingle();
      if (!existing) {
        await supabase.from('conversations').insert({
          id: room,
          name: `Room: ${room.substring(0, 8)}...`,
          type: 'group',
          last_message_at: new Date().toISOString()
        } as any);
        
        await supabase.from('conversation_participants').insert({
          conversation_id: room,
          user_id: this.peerId
        } as any);
      }
    } catch (e) {
      console.warn("ensureLocalRoom fail:", e);
    }
  }

  private handleSignalingMessage(msg: any) {
    switch (msg.type) {
      case 'peer-joined':
        this.addLog(`New peer joined: ${msg.peerName} (${msg.peerId})`);
        this.initiateP2PConnection(msg.peerId, msg.peerName);
        break;

      case 'peer-exists':
        this.addLog(`Existing peer found: ${msg.peerName} (${msg.peerId})`);
        this.initiateP2PConnection(msg.peerId, msg.peerName, false); // newcomer waits for offers
        break;

      case 'peer-left':
        this.addLog(`Peer departed: ${msg.peerId}`);
        const connection = this.connectedPeers.get(msg.peerId);
        if (connection) {
          connection.pc.close();
          this.connectedPeers.delete(msg.peerId);
        }
        this.triggerListeners();
        break;

      case 'signal':
        this.handleWebRTCSignal(msg.senderPeerId, msg.data);
        break;

      case 'chat-message':
        this.saveIncomingMessage(msg);
        break;

      case 'call-signal':
        this.handleCallSignal(msg.senderPeerId, msg.signalType);
        break;
    }
  }

  // Set up RTCPeerConnection
  private initiateP2PConnection(targetId: string, targetName: string, isOfferer: boolean = true) {
    if (this.connectedPeers.has(targetId)) return;

    this.addLog(`Configuring WebRTC connection channel to ${targetName}...`);
    const pc = new RTCPeerConnection(this.rtcConfig);

    let dataChannel: RTCDataChannel | undefined;

    if (isOfferer) {
      dataChannel = pc.createDataChannel('grix-data-channel', { ordered: true });
      this.bindDataChannelEvents(dataChannel, targetId);
    }

    pc.ondatachannel = (event) => {
      this.addLog(`P2P WebRTC connection confirmed by ${targetName}!`);
      this.bindDataChannelEvents(event.channel, targetId);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'signal',
          roomId: this.roomId,
          targetPeerId: targetId,
          senderPeerId: this.peerId,
          data: { candidate: event.candidate }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      this.rtcConnectionStatus = pc.connectionState as any;
      this.addLog(`WebRTC state change: ${pc.connectionState}`);
      this.triggerListeners();
    };

    this.connectedPeers.set(targetId, { peerName: targetName, pc, channel: dataChannel });

    if (isOfferer) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'signal',
              roomId: this.roomId,
              targetPeerId: targetId,
              senderPeerId: this.peerId,
              data: { sdp: pc.localDescription }
            }));
          }
        })
        .catch(err => console.error("Error creating WebRTC offer:", err));
    }
  }

  private handleWebRTCSignal(senderId: string, data: any) {
    const connection = this.connectedPeers.get(senderId);
    if (!connection) return;

    const pc = connection.pc;

    if (data.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => {
          if (pc.remoteDescription?.type === 'offer') {
            return pc.createAnswer()
              .then(answer => pc.setLocalDescription(answer))
              .then(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(JSON.stringify({
                    type: 'signal',
                    roomId: this.roomId,
                    targetPeerId: senderId,
                    senderPeerId: this.peerId,
                    data: { sdp: pc.localDescription }
                  }));
                }
              });
          }
        })
        .catch(err => console.error("Error handling SDP:", err));
    } else if (data.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        .catch(err => console.error("Error adding IceCandidate:", err));
    }
  }

  private bindDataChannelEvents(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      this.addLog(`RTCDataChannel connection active to: ${peerId}`);
      this.triggerListeners();
    };

    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.saveIncomingMessage(msg);
      } catch (e) {
        console.warn("Error processing RTC data message:", e);
      }
    };

    channel.onclose = () => {
      this.addLog(`RTCDataChannel closed with peer ${peerId}`);
      this.triggerListeners();
    };
  }

  // Save peer message and trigger local UI updates
  private async saveIncomingMessage(msg: any) {
    const activeRoom = this.roomId || localStorage.getItem('grix_active_room_id');
    const senderId = msg.senderPeerId;
    const senderName = msg.senderName;
    const text = msg.text;

    this.addLog(`Message received from ${senderName}: ${text}`);

    // Standard structural payload matching db messages schema
    const dataMessage = {
      id: msg.id || Math.random().toString(36).substring(2, 11),
      conversation_id: activeRoom,
      sender_id: senderId,
      sender_name: senderName,
      text: text,
      file_url: msg.fileUrl,
      file_type: msg.fileType,
      file_name: msg.fileName,
      reply_to: msg.replyTo,
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      // Direct insertion to persistent emulated database
      await supabase.from('messages').insert(dataMessage as any);
      
      // Upsert conversation details to bubble up the chat list
      await supabase.from('conversations').upsert({
        id: activeRoom,
        last_message_at: new Date().toISOString()
      } as any);

      // Create a local peer contact listing to make profile screen seamless
      const { data: userProfile } = await supabase.from('users').select('*').eq('id', senderId).maybeSingle();
      if (!userProfile) {
        await supabase.from('users').insert({
          id: senderId,
          username: senderName.toLowerCase().replace(/\s+/g, '_'),
          full_name: senderName,
          photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${senderId}`
        } as any);
      }

    } catch (e) {
      console.warn("Failed syncing incoming message:", e);
    }
  }

  // Direct serverless message dispatch (DataChannel primarily with live Websocket Fallback)
  public async sendMessage(text: string, fileAttributes?: { url: string; type: string; name: string }, replyTo?: string, msgIdOverride?: string) {
    const activeRoom = this.roomId || safeLocalStorage.getItem('grix_active_room_id');
    if (!activeRoom) {
      this.addLog("Error: Join a Room first!");
      return;
    }

    const msgId = msgIdOverride || Math.random().toString(36).substring(2, 11);
    
    const payload = {
      type: 'chat-message',
      id: msgId,
      roomId: activeRoom,
      senderPeerId: this.peerId,
      senderName: this.peerName,
      text,
      fileUrl: fileAttributes?.url,
      fileType: fileAttributes?.type,
      fileName: fileAttributes?.name,
      replyTo,
      createdAt: new Date().toISOString()
    };

    this.addLog(`Sending message: ${text}`);

    // Dual-routing: 1. Send P2P via WebRTC RTCDataChannel to all active peers
    let sentViaRTC = false;
    this.connectedPeers.forEach((peer, pid) => {
      if (peer.channel && peer.channel.readyState === 'open') {
        peer.channel.send(JSON.stringify(payload));
        sentViaRTC = true;
      }
    });

    // 2. Transmit via WebSocket signaling relay as absolute fallback if RTC is blocked or connecting
    if (!sentViaRTC && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      this.addLog("Sent via WebSocket fallback channel.");
    }

    // 3. Write locally instantly (only if no override existed)
    if (!msgIdOverride) {
      const localMsg = {
        id: msgId,
        conversation_id: activeRoom,
        sender_id: this.peerId,
        sender_name: this.peerName,
        text,
        file_url: fileAttributes?.url,
        file_type: fileAttributes?.type,
        file_name: fileAttributes?.name,
        reply_to: replyTo,
        is_read: true,
        created_at: new Date().toISOString()
      };

      await supabase.from('messages').insert(localMsg as any);
      await supabase.from('conversations').upsert({
        id: activeRoom,
        last_message_at: new Date().toISOString()
      } as any);
    }
  }

  // Calls signalling methods
  public triggerCallEvent(targetPeerId: string, signalType: 'ping' | 'hangup' | 'accept') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'call-signal',
        roomId: this.roomId,
        targetPeerId,
        senderPeerId: this.peerId,
        signalType
      }));
    }
  }

  private handleCallSignal(senderId: string, signalType: string) {
    // Relays calls hooks internally
    const event = new CustomEvent('p2p_call_signal', {
      detail: { senderId, signalType }
    });
    window.dispatchEvent(event);
  }
}

export const P2PService = new P2PServiceCoordinator();
