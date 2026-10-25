# Product Requirements Document (PRD)

## Project: Setu Connect — Secure Real-Time Chat
**Author:** Neetesh Dixit  
**Status:** APPROVED (Updated v2.0 — August 2026)  
**Target Architecture:** Java Full Stack (Spring Boot + React)  
**Key Update:** Redis removed. Presence managed in-memory.

---

## 1. Executive Summary & Objective

Setu Connect is a high-performance, real-time messaging application built for enterprise teams. It provides WhatsApp-level user experience with enterprise-grade security and privacy controls.

### What makes Setu Connect unique?

| Feature | Standard Chat Apps | Setu Connect |
|---|---|---|
| Message encryption | Server-side (or none) | AES-256 client-side before sending |
| Emergency privacy | No panic wipe | One-click purge of all messages |
| Call integration | Third-party SDK | WebRTC P2P, no external call server |

---

## 2. Tech Stack Definition (Current v2.0)

| Component | Technology | Version | Role |
|---|---|---|---|
| **Backend Framework** | Spring Boot (Java 17) | 3.3.0 | Core logic, REST APIs, WebSocket |
| **Frontend UI** | React.js + Vite | React 19, Vite 8 | Single-page application |
| **Styling** | Vanilla CSS (CSS Variables) | — | Theme system, dark/light mode |
| **Primary Database** | PostgreSQL | Latest | Users, messages, contacts, calls, etc. |
| **Real-time Protocol** | STOMP over WebSockets (SockJS) | — | Messaging, presence, call signaling |
| **Authentication** | JWT (HMAC-SHA256) | jjwt 0.11.5 | Stateless token auth |
| **Build Tools** | Maven + npm | — | Backend + Frontend dependency management |
| **Deployment** | Vercel (Frontend) + Render (Backend) | — | Production hosting |

> **⚠️ Removed Dependencies vs. v1.0 PRD:**
> - ~~Redis~~ — Presence now managed in-memory (`ConcurrentHashMap`). Typing indicators via WebSocket TTL (client-side). Trade-off: presence resets on backend restart.
> - ~~TypeScript~~ — Frontend uses plain JavaScript (JSX).
> - ~~Tailwind CSS~~ — Replaced with Vanilla CSS + CSS custom properties.

---

## 3. Core Features & Functional Requirements

### 3.1. User Onboarding & Security
*   **Registration:** Username + Email + Phone + Password. BCrypt hashed storage.
*   **Authentication:** JWT token (24h expiry). Token used for both REST API and WebSocket authentication.
*   **Session Restore:** `GET /api/users/me` validates token and restores session on page refresh.
*   **Account Management:** Edit profile, update about text, upload profile picture (JPG/PNG, max 5MB).
*   **Account Delete:** `DELETE /api/users/me` — removes user, contacts, privacy settings from DB.

### 3.2. Real-Time Chat Engine
*   **One-to-One Messaging:** AES-256 encrypted message sent via WebSocket STOMP. Both users receive via topic subscriptions.
*   **Group Chat Messaging:** Messages sent with groupId, broadcast to all members.
*   **Message Lifecycle Status:**
    - `sent` (✓) — Written to DB
    - `delivered` (✓✓) — Received by client subscription (implicit on message arrival)
    - `read` (🔵✓✓) — Explicit `POST /api/messages/read/{sender}` call
*   **Offline Queuing:** Messages typed while WebSocket is down queued in `localStorage`. Flushed on reconnect.
*   **Message Persistence:** All messages cached in `localStorage` key `setu_chat_history_v2`. Chat never lost on page refresh.

### 3.3. Advanced Message Features
*   **Reply (Quote):** Reply to specific messages with parent message preview.
*   **Forward:** Forward message to another contact.
*   **Star:** Bookmark important messages. View all starred in StarredModal.
*   **Pin:** Pin messages to top of chat.
*   **Emoji Reactions:** React to any message with any emoji. Multiple users can react.
*   **Delete:** Delete own message within 15 minutes (broadcasts deletion to both parties).
*   **Self-Destruct:** Set expiry timer on message (auto-deleted by backend scheduler after expiry).
*   **Priority Flag:** Mark message as priority/important.
*   **Location Share:** Send latitude/longitude in message.
*   **Panic Wipe:** Emergency purge of ALL user messages from DB + real-time broadcast.

### 3.4. Media Sharing
*   **File Types:** Images, videos, documents, audio files.
*   **Upload:** `POST /api/media/upload` (multipart). Stored in `/uploads/` directory.
*   **Download/Preview:** Inline image/video preview. Document shows filename + download button.

### 3.5. Live Presence & Indicators (In-Memory)
*   **Online Status:** WebSocket connection tracked in `ConcurrentHashMap<sessionId, username>`.
*   **Typing Indicator:** Client-side 3-second timer. WebSocket broadcast on keypress.
*   **Last Seen:** Stored in DB on WebSocket disconnect.
*   **Privacy Controls:** Per-user visibility settings for last seen, online status, profile photo, about text.

### 3.6. Voice & Video Calls (WebRTC)
*   **Call Types:** Audio call, Video call.
*   **Signaling:** WebSocket STOMP topic `/topic/calls/{username}` for offer/answer/ICE candidate exchange.
*   **P2P Connection:** RTCPeerConnection direct between browsers — no media server needed.
*   **Call Record:** Saved to DB on call end with status (COMPLETED/MISSED/REJECTED/BUSY/CANCELLED/OFFLINE).
*   **Call History:** Shown in Calls tab with direction (incoming/outgoing), duration, peer avatar.
*   **System Message:** Call end auto-generates a call summary message in the chat (e.g., "📞 Audio Call • 2:25").

### 3.7. Status/Stories (WhatsApp-Style)
*   Post text, image, or video statuses with 24-hour expiry.
*   View contacts' active statuses in Status tab.
*   Status viewer with progress bar, caption, timestamp.
*   Text statuses support custom background colors.

### 3.8. Group Chats
*   Create group with custom name and multiple members.
*   Group messages broadcast to all members in real-time.
*   Group info: member list, group name (editable).

### 3.9. Scheduled Messages
*   Compose a message with a future send time.
*   Backend Spring `@Scheduled` task checks every minute and auto-sends.

### 3.10. Vanish Mode
*   Enable per-conversation — messages auto-deleted after being read.
*   Backend service + scheduler handles deletion.

### 3.11. Privacy & Security Controls
*   Per-field visibility: Last Seen, Online, Profile Photo, About, Read Receipts, Group Add, Call Privacy.
*   Options: EVERYONE / CONTACTS / NOBODY.
*   Server enforces these rules — not just UI hints.

### 3.12. Analytics Dashboard
*   Total messages sent/received count.
*   Total calls made + total duration.
*   Most active contacts list.

### 3.13. Contact Management
*   Add contacts by phone number or username search.
*   Custom display names for contacts.
*   Remove contacts.

---

## 4. Database Schema (Implemented via JPA/Hibernate)

All tables created automatically via `spring.jpa.hibernate.ddl-auto=update`.

```
users:              id, username, email, phone_number, password (BCrypt), profile_pic_url, about, last_seen
messages:           id, sender_id, receiver_id, group_id, content, timestamp, status, 
                    parent_message_id, parent_message_text, parent_message_sender,
                    is_forwarded, is_starred, is_pinned, reactions,
                    is_media, media_url, media_type, file_name, file_size, message_type,
                    call_type, call_status, call_duration, call_started_at, call_ended_at,
                    iv (AES IV), self_destruct_seconds, expires_at, read_at, 
                    is_priority, latitude, longitude
contacts:           id, owner_id, contact_user_id, custom_name
chat_groups:        id, name, members (ManyToMany → users)
call_records:       id, caller_id, receiver_id, call_type, status, duration_seconds, timestamp, started_at, ended_at
statuses:           id, user_id, media_url, caption, type, text_background, expires_at, created_at
privacy_settings:   id, user_id, last_seen_visibility, online_visibility, profile_photo_visibility, 
                    about_visibility, read_receipts, group_privacy, call_privacy
scheduled_messages: id, sender_id, receiver_id, content, send_at, sent
conversation_vanish_mode: id, user1_id, user2_id, enabled
```

---

## 5. System Architecture & All Endpoints

### 5.1. REST API — Complete Endpoint Reference

**Auth:**
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, get JWT

**Users:**
- `GET /api/users/me` — Get current user
- `GET /api/users` — List all users
- `GET /api/users/search?query=...` — Search by phone/username
- `PUT /api/users/profile` — Update profile fields
- `PUT /api/users/about` — Update about text
- `GET /api/users/{username}/profile` — Get profile (privacy-filtered)
- `GET /api/users/privacy` — Get privacy settings
- `PUT /api/users/privacy` — Update privacy settings
- `POST /api/users/profile-image` — Upload profile picture
- `GET /api/users/profile-image/{filename}` — Serve profile picture
- `DELETE /api/users/me` — Delete account

**Messages:**
- `GET /api/messages/{u1}/{u2}` — Get chat history
- `GET /api/messages/partners/{username}` — Get chat partner list with last message
- `POST /api/messages/read/{senderUsername}` — Mark messages as read
- `DELETE /api/messages/{id}` — Delete message (15 min limit)
- `POST /api/messages/star/{id}` — Toggle star
- `POST /api/messages/pin/{id}` — Toggle pin
- `POST /api/messages/react/{id}` — Add/remove emoji reaction
- `DELETE /api/messages/panic-wipe` — Emergency wipe all messages
- `GET /api/users/online` — Get set of online usernames

**Contacts:**
- `GET /api/contacts` — Get contacts
- `POST /api/contacts` — Add contact
- `DELETE /api/contacts/{id}` — Remove contact

**Groups:**
- `GET /api/groups` — Get user's groups
- `POST /api/groups` — Create group

**Calls:**
- `GET /api/calls` — Get call history
- `POST /api/calls` — Save call record

**Statuses:**
- `GET /api/statuses` — Get active statuses of contacts
- `POST /api/statuses` — Post new status

**Scheduled Messages:**
- `GET /api/scheduled` — Get scheduled messages
- `POST /api/scheduled` — Create scheduled message

**Vanish Mode:**
- `GET /api/vanish-mode/{u1}/{u2}` — Check vanish mode
- `POST /api/vanish-mode` — Enable/disable vanish mode

**Analytics:**
- `GET /api/analytics/messages` — Message stats
- `GET /api/analytics/calls` — Call stats

**Media:**
- `POST /api/media/upload` — Upload file

### 5.2. WebSocket Topic Directory (STOMP)
- **Connect endpoint:** `/ws` (SockJS + native WebSocket)
- **Send message:** PUBLISH → `/app/chat`
- **Receive messages:** SUBSCRIBE → `/topic/messages/{username}`
- **Typing indicator:** PUBLISH → `/app/chat/typing` | SUBSCRIBE → `/topic/typing/{username}`
- **Call signaling:** PUBLISH → `/app/call/signal` | SUBSCRIBE → `/topic/calls/{username}`
- **Call history update:** SUBSCRIBE → `/topic/callhistory/{username}`
- **Read receipts:** SUBSCRIBE → `/topic/messages/read/{username}`
- **Presence connect:** PUBLISH → `/app/presence/connect`

---

## 6. Implementation Status (What's Built)

| Phase | Feature Area | Status |
|---|---|---|
| Phase 1 | Auth (register/login/JWT) | ✅ Complete |
| Phase 2 | Real-time messaging + read receipts | ✅ Complete |
| Phase 3 | Presence (in-memory, no Redis) | ✅ Complete |
| Phase 4 | React Frontend (full UI) | ✅ Complete |
| Phase 5 | Voice/Video calls (WebRTC) | ✅ Complete |
| Phase 6 | Groups, Status, Analytics | ✅ Complete |
| Phase 7 | Privacy settings + Panic Wipe | ✅ Complete |
| Phase 8 | Scheduled messages + Vanish mode | ✅ Complete |
| Phase 9 | AES-256 message encryption | ✅ Complete |
| Phase 10 | Vercel + Render deployment | ✅ Complete |

---

## 7. Edge Cases & System Resilience

*   **WebSocket Disconnect:** STOMP client auto-reconnects. Offline messages queued in localStorage, flushed on reconnect.
*   **Message Delete Time Exceeded:** Backend checks timestamp + 15 minutes. Returns HTTP 400 if exceeded.
*   **Call to Offline User:** `offlineNotice` toast shown. `POST /api/calls` saves with status "offline".
*   **File Upload Too Large:** Backend validates size before saving. Returns HTTP 400.
*   **Backend Restart:** All in-memory presence data lost. Users appear offline until they reconnect (within seconds for active users).
