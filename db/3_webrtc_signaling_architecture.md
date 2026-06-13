# GrixChat WebRTC Database Signaling Architecture

This document details how **GrixChat** implements real-time peer-to-peer audio and video calls on top of our **Supabase** backend. 

---

## 1. The Core Issue: Why Calls Got Stuck on "Ringing"
When a user initiated a call, the receiver would hear the ringtone and successfully click "accept". However, the caller's interface would remain stuck on the **"Ringing..."** phase with no active voice or video feed. 

### Key Diagnostic Root Cause:
* **The Missing Realtime Publication:** Supabase's realtime client listens to table changes via standard PostgreSQL replication. 
* Although the frontend code registered `.on('postgres_changes', ...)` listeners on both `calls` and `call_candidates` tables, **the tables had not been added to Supabase’s `supabase_realtime` publication group in PostgreSQL**.
* Consequently, when the receiver modified the status to `'accepted'` and wrote their Session Description (SDP Answer) or appended network ICE Candidates, the PostgreSQL engine did not broadcast these rows over the websocket connection to the caller.
* By executing the updated dynamic `ALTER PUBLICATION` scripts, the socket pipeline instantly starts serving these payload-rich state modifications, bridging the handshake.

---

## 2. Peer-to-Peer Webrtc Handshake Sequence

Below is the structured step-by-step connection flow coordinated between **Caller** and **Receiver** via GrixChat's database-backed signaling layer:

```
[ Caller ]                                                    [ Receiver ]
    │                                                              │
    ├─► 1. getUserMedia (Camera/Mic stream acquired)                │
    ├─► 2. Creates RTCPeerConnection & sets local SDP Offer        │
    ├─► 3. INSERTS to public.calls (status: 'ringing', offer)       │
    │      (Dispatches push notification via Cloud FCM API)         │
    │                                                              │
    │      ────────────────► Realtime Stream ────────────────►      │
    │                                                              │
    │                                                              ├─► 4. Receives incoming call
    │                                                              │      Ringtone triggers
    │                                                              │      User clicks "Accept"
    │                                                              │
    │                                                              ├─► 5. getUserMedia triggers
    │                                                              ├─► 6. Sets remote SDP Offer from DB
    │                                                              ├─► 7. Generates SDP Answer
    │                                                              ├─► 8. UPDATES public.calls
    │                                                              │      (status: 'accepted', answer)
    │                                                              │
    │      ◄──────────────── Realtime Stream ◄────────────────      │
    │                                                              │
    ├─► 9. Receives SDP Answer via DB changes                      │
    ├─► 10. Sets remote description                                │
    │                                                              │
    │             (Simultaneously on both endpoints)               │
    ├─► 11. Generates local network configurations (ICE Candidates)│
    ├─► 12. INSERTS candidates to public.call_candidates           │
    │                                                              │
    │      ◄── Stream Caller Candidates / Stream Receiver Candidates ──►
    │                                                              │
    ├─► 13. PeerConnection established successfully                ◄─┤
    │       Direct voice/video stream streams on screen             │
```

---

## 3. Database Table Definitions & Signaling Payloads

### A. The Core Control Row (`public.calls`)
Stores the top-level state of a direct call. Any change triggers an instant update across both client UIs:

| Attribute | Data Type | Purpose |
| :--- | :--- | :--- |
| `id` | `UUID (Primary Key)` | Unique call room identifier. |
| `caller_id` | `UUID (Foreign Key)` | Tracks who initiated the transmission. |
| `receiver_id` | `UUID (Foreign Key)` | Target participant answering the call. |
| `type` | `TEXT ('audio' \| 'video')` | Medium chosen for communication. |
| `status` | `TEXT` | `ringing` ➔ `accepted`/`rejected` ➔ `ended` or `error`. |
| `offer` | `JSONB` | SD Session Description (Offer) created by Caller's PeerConnection browser engine. |
| `answer` | `JSONB` | SD Session Description (Answer) created by Receiver's PeerConnection browser engine. |

### B. Network Negotiation Transients (`public.call_candidates`)
To traverse Firewalls, NAT routers, and cellular carriers, both clients find various public-facing routing pathways (ICE Candidates) and exchange them:

* **Columns:**
  * `call_id` (`UUID`): Associated call.
  * `user_id` (`UUID`): Author of this network route option.
  * `candidate` (`JSONB`): Encapsulated ICE parameters containing IP addresses, protocols (UDP/TCP), and open ports.
  * `type` (`TEXT`): Origin category (e.g. `offer` or `answer`).

---

## 4. Multi-User/Group Calls Signaling Extension

To safely scale GrixChat to support group audio/video calling without placing a heavy CPU burden on clients, a multipoint signaling table structure `group_call_participants` has been added. 

### Group Signaling Implementation Strategy:
1. **P2P Mesh vs. SFU:** For simple group screens, users form a **Mesh network** where each participant establishes individual `RTCPeerConnection` paths to all other active members in the group chat.
2. **Coordinating Handshakes:** When a group participant joins:
   - They insert their custom configuration status inside `group_call_participants` table.
   - Other users listen to `inserts` on `group_call_participants` filtered by `conversation_id=eq.{id}`. 
   - Upon detecting a new peer joining, existing peers automatically trigger a connection handshake specifically targeting the new participant's UUID, keeping peer links separate and highly reliable.

---

## 5. Security Safeguards (RLS Rules)
To guarantee 100% security and keep user communication private:
* Only the authorized `caller_id` or `receiver_id` of a row inside `public.calls` is granted permission to fetch or alter states.
* Direct reads/writes to `call_candidates` are fully restricted unless the requesting user matches the participant IDs on the parent call.
* Cross-tenant surveillance is completely blocked by PostgreSQL Row Level Security (RLS) policies.
