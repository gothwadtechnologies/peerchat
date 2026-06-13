# GrixChat Developer & AI Agent Guidelines (System Instructions)

This file contains the strict development, architectural, and design constraints for GrixChat. As an AI Agent, you **must** read and adhere to these guidelines during every turn.

---

## 1. Core Architectural Blueprint
* **Backend, Database, Storage, and Sync:** Built **100% on Supabase**. Do not introduce any secondary server-side database stores or standard polling endpoints unless explicit.
* **Push Notifications:** **Firebase Cloud Messaging (FCM)** is strictly used *only* for native background notification delivery. No other Firebase features (Auth, Firestore, Storage) should be used.
* **Calling & Streaming:** Web RTC signaling is managed through lightweight Supabase channels. Keep media channels clean.
* **Platform Delivery:** Deployed primarily as a **Progressive Web App (PWA)** and **Trusted Web Activity (TWA)** on Android. 
  * The UX must feel native.
  * Use safe-area paddings for navigation bars/status headers (`pb-[safe]`, `h-[100dvh]` dynamic viewport sizing to prevent mobile browser scroll bouncing).
  * Hover events must gracefully degrade, and touch targets must be minimum `44px` on mobile wrappers.

---

## 2. Ultra-Low Costs & Egress Optimization (50k Free-Plan Mandate)
To comfortably support more than 50k users on Supabase's free tier, database operations and API calls must be kept highly optimized:

### A. Real-time Subscription Safeguards
* **No Unfiltered Postgres Listeners:** Never listen to entire tables globally. A subscriber must always filter listeners to their own active context:
  * ❌ *Bad (High Egress):* `.on('postgres_changes', { table: 'follows' })`
  * ✅ *Good (Filtered):* `.on('postgres_changes', { table: 'follows', filter: 'follower_id=eq.' + userId })`
* **Transients via Broadcast Channels:** Use lightweight WebSocket broadcasts instead of standard database inserts for highly transient actions (such as real-time typing indicators, active call signaling, online presence updates, and read confirmations). This retains a 0B database egress load.
* **Consolidated Tab Bars:** Never poll the database to update message feeds or list indicators across background screens. Listen directly to local cache updates from the `LocalDataCache` inside global headers and bottom navigation controllers.

### B. Intelligent Rendering & Caching
* **Offline Cache (`LocalDataCache`):** Always write conversational states dynamically to local storage/local memory cache. Feed views locally before loading the network.
* **Pruning and Batch Counts:** Keep initial load ranges restricted (e.g., paging size of `20-30` messages). Automatically prune deep DOM elements and maintain clean lists to minimize local runtime footprint.

---

## 3. UI Design & UX Mix
GrixChat has a highly polished, aesthetic modern visual blend:
* **20% Telegram:** Micro-animations (`motion/react`), high velocity, clean chat bubble swipe gestures, dynamic typing feedback running instantly under avatars.
* **20% WhatsApp:** Simple, intuitive messaging mechanics:
  * **Message Ticks:** Live delivery state visually synced:
    * `✓` **Single Tick (Gray):** Message sent securely.
    * `✓✓` **Double Tick (Gray):** Message delivered (Recipient is online).
    * `✓✓` **Blue Tick:** Message read by recipient.
  * **Selection Highlight Aesthetic:** Selecting chats in selection mode changes background shade and adds an elegant left-colored border (`border-l-[4px] border-l-[var(--primary)] text-[var(--primary)]/10`) instead of displaying intrusive checkboxes or moving the avatar block.
  * **Header Context Menu:** All bulk action bars (archives, deletes, mutes) reside cleanly inside the `TabHeader` to keep the bottom navigation bar neat and clutter-free.
* **60% Unique Identity:** Elegant Dark Cosmic theme styled with deep charcoal tones, rich borders, bold Display typography (Space Grotesk, Inter), and customizable UI gradients.

---

## 4. Code Structuring Rules
* Keep code modular. Do not bloat files like `App.tsx` or `ChatScreen.tsx`. Extract helpers, individual sheets, and custom tabs to independent folders.
* Always execute `/src` actions with high type-safety using standard standard TypeScript types and strictly avoid compiling failures.
* **SQL Registry Structure:** All database schemas, incremental migration updates, row-level security (RLS) definitions, triggers, and indices must be kept updated and strictly stored inside the `/sql` folder at the root level. Running developers/AI agents must keep the `/sql` directory perfectly updated at all times.
