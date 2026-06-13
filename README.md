# 🌌 GrixChat — Secure Social & Real-Time Messaging Platform

GrixChat is a ultra-modern, high-performance messaging, private calling, and short-form video application designed for lightning-fast speeds and low-cost scalability. Delivering a hybrid visual experience—blending **60% unique Dark Cosmic identity**, **20% Telegram performance micro-animations**, and **20% WhatsApp communication mechanics**—it runs perfectly as a PWA and Google Play TWA.

---

## 🏗 Core Architecture Blueprint

* **Backend, Storage & Real-Time Sync**: Driven **100% by Supabase**. Includes custom PostgreSQL procedures, storage buckets, and filtered `postgres_changes` listeners.
* **Push Notifications**: **Firebase Cloud Messaging (FCM)** is strictly restricted to background mobile notifications so database egress loads remain at exactly zero.
* **Direct Private Calling**: Peer-to-peer audio/video calling powered by **WebRTC** with automatic 45-second persistent dialing, Web Audio API sound synths, and background conversation survival.
* **Aesthetic Visual Blend**: Custom display typography of *Space Grotesk* paired with *Inter* and *JetBrains Mono*, complete with WhatsApp-style delivery double-ticks, custom context sliders, and selection highlights.

---

## 💸 Cost-Optimization & 50K Free User Scalability

To support more than 50,000 active users comfortably on Supabase's free tier, database operations obey strict efficiency guidelines:
1. **Unfiltered Listeners Banned**: All real-time channel listeners are strictly targeted and filtered based on keys (e.g. `receiver_id=eq.${userId}`). We never listen to entire tables globally to protect egress.
2. **Lightweight WebSocket Broadcasts**: High-frequency, fleeting events—such as typing feedback, read ticks, or calling connection states—are routed via Supabase Broadcast and Presence channels, avoiding heavy relational database queries.
3. **Optimized Local Caching**: State managers cache local messages and profiles before triggering remote syncs, delivering a persistent offline-first experience.
4. **Range constraints & Pagination**: Initial list loading feeds only the vital 20-30 conversational records.

---

## 🛠 Feature Profile

- **Background Video/Voice Calling**: Integrated RTC signalling that lives inside the global React Context. You can back out from a call to write messages, and a beautiful WhatsApp-style pulsing green calling line continues to tick beneath the main navigation bar.
- **Micro-Animations**: Staggered transition arrays and slide-out logout menus engineered via `motion/react` for smooth, native-like user flows.
- **Interactive Multi-Tab Setup**: Visited views are retained using a custom keep-alive container pattern to prevent visual reloads.
- **Secure App Lock**: Secure PIN screen and privacy toggles to protect chats.

---

## 📁 System Registry Map

- `/src/providers`: Application context singletons (Supabase `AuthProvider`, global WebRTC `CallProvider`).
- `/src/features`: Modular screens broken into focus zones (`chat`, `call`, `profile`, `search`, `reels`).
- `/src/components`: UI layouts, bottom/top navigation components, and global drop-downs.
- `/sql`: Hardcoded schema upgrades, PostgreSQL functions, row-level security definitions, and indices:
  - `grixchat_latest_db_updates.sql`: Incremental delta adjustments.
  - `supabase_schema.sql`: Core baseline tables (users, messages, conversations, calls).
  - `supabase_posts_schema.sql`: Reels and posts mechanics.
  - `supabase_support_tickets_schema.sql`: Support logs.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configure Credentials
Duplicate `.env.example` as `.env` and configure your API details:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Hot Dev Server
```bash
npm run dev
```

### 4. Build Stands
```bash
npm run build
```

---
Crafted under high-precision directives for the GrixChat Mobile Ecosystem. 🌌
