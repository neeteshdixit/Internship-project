# Product Requirements Document (PRD)

## Project: Setu Connect — Secure Real-Time Chat with Multi-Provider AI
**Author:** Neetesh Dixit  
**Status:** APPROVED (Updated v2.0 — August 2026)  
**Target Architecture:** Java Full Stack (Spring Boot + React)  
**Key Update:** Migrated from Ollama-only AI to Multi-Provider AI system (Device → Ollama → Gemini). Redis removed. Presence managed in-memory.

---

## 1. Executive Summary & Objective

Setu Connect is a high-performance, real-time messaging application built for enterprise teams. It provides WhatsApp-level user experience with enterprise-grade security, privacy controls, and AI-powered productivity features.

### What makes Setu Connect unique?

| Feature | Standard Chat Apps | Setu Connect |
|---|---|---|
| AI data privacy | Silently sends to cloud AI | Full transparency report on every AI call |
| AI provider | Single cloud provider | Multi-tier: Device → Ollama → Gemini |
| Message encryption | Server-side (or none) | AES-256 client-side before sending |
| Emergency privacy | No panic wipe | One-click purge of all messages |
| Call integration | Third-party SDK | WebRTC P2P, no external call server |
| AI cost | Per-token cloud billing | Local AI = $0 per token |

---

## 2. Tech Stack Definition (Current v2.0)

| Component | Technology | Version | Role |
|---|---|---|---|
| **Backend Framework** | Spring Boot (Java 17) | 3.3.0 | Core logic, REST APIs, WebSocket |
| **Frontend UI** | React.js + Vite | React 19, Vite 8 | Single-page application |
| **Styling** | Vanilla CSS (CSS Variables) | — | Theme system, dark/light mode |
| **Primary Database** | PostgreSQL | Latest | Users, messages, contacts, calls, etc. |
| **Real-time Protocol** | STOMP over WebSockets (SockJS) | — | Messaging, presence, call signaling |
| **AI Provider 1** | Device AI (Browser/OS) | — | Local, zero-network AI (placeholder) |
| **AI Provider 2** | Ollama (local server) | Via Spring AI | Optional local AI (llama3.2, etc.) |
| **AI Provider 3** | Google Gemini Flash 1.5 | REST API | Cloud AI fallback |
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

### 3.7. Multi-Provider AI Features (The Core USP)

**AI Provider Selection Logic (AiProviderManager):**
```
AUTO mode (default):
  1. DeviceAiProvider.isAvailable()? → use device AI
  2. OllamaAiProvider.isAvailable()? → ping localhost:11434 → use if running
  3. GeminiAiProvider.isAvailable()? → check if API key configured → use cloud
  4. All fail → return "AI Unavailable"
```

**16 AI Features Available:**
1. **Chat Summarize** — Bullet summary + key points + decisions
2. **Smart Reply** — 3 context-aware reply suggestions
3. **Rewrite Message** — Change tone (formal/casual/professional)
4. **Grammar Fix** — Correct spelling & grammar
5. **Translate** — Translate to any language
6. **Extract Tasks** — Pull action items from conversation
7. **Detect Meeting** — Find meeting schedules (structured JSON)
8. **Set Reminder** — Extract reminder info (structured JSON)
9. **Generate Chat Title** — 4-word topic title
10. **Detect Mood** — Emotional analysis (JSON + confidence score)
11. **Convert to Notes** — Structured notes from conversation
12. **Explain Simply** — Simplify technical/long text (by level)
13. **Draft Email** — Professional email from chat context
14. **Improve Message** — Improve clarity before sending
15. **Daily Summary** — Day's messaging + calling activity
16. **AI Chat Assistant** — Multi-turn conversational AI

**Privacy Transparency (Every AI Response):**
```json
{
  "provider": "Gemini | Ollama | Device | None",
  "processingMode": "Cloud | Local | N/A",
  "sentOutsideDevice": true | false,
  "temporaryBufferReleased": true,
  "processingTimeSeconds": 2.3,
  "status": "Completed | Failed | Unavailable"
}
```

### 3.8. Status/Stories (WhatsApp-Style)
*   Post text, image, or video statuses with 24-hour expiry.
*   View contacts' active statuses in Status tab.
*   Status viewer with progress bar, caption, timestamp.
*   Text statuses support custom background colors.

### 3.9. Group Chats
*   Create group with custom name and multiple members.
*   Group messages broadcast to all members in real-time.
*   Group info: member list, group name (editable).

### 3.10. Scheduled Messages
*   Compose a message with a future send time.
*   Backend Spring `@Scheduled` task checks every minute and auto-sends.

### 3.11. Vanish Mode
*   Enable per-conversation — messages auto-deleted after being read.
*   Backend service + scheduler handles deletion.

### 3.12. Privacy & Security Controls
*   Per-field visibility: Last Seen, Online, Profile Photo, About, Read Receipts, Group Add, Call Privacy.
*   Options: EVERYONE / CONTACTS / NOBODY.
*   Server enforces these rules — not just UI hints.

### 3.13. Analytics Dashboard
*   Total messages sent/received count.
*   Total calls made + total duration.
*   AI features usage tracking.
*   Most active contacts list.

### 3.14. Contact Management
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
ai_settings:        id (always 1), preferred_provider, ask_permission_every_time, 
                    always_allow_cloud, disable_cloud_ai, prefer_local_processing,
                    never_automatically_send_to_cloud, show_privacy_notice_before_cloud
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

**AI:**
- `GET /api/ai/status` — Current provider status
- `GET /api/ai/preflight` — Pre-flight check (cloud permission needed?)
- `GET /api/ai/settings` — Get AI settings
- `POST /api/ai/settings` — Save AI settings
- `GET /api/ai/summarize/{u1}/{u2}` — Summarize a conversation
- `POST /api/ai/summarize` — Summarize (custom text)
- `POST /api/ai/smart-reply` — Get smart replies
- `POST /api/ai/rewrite` — Rewrite message
- `POST /api/ai/grammar` — Fix grammar
- `POST /api/ai/translate` — Translate message
- `POST /api/ai/tasks` — Extract action items
- `POST /api/ai/meetings` — Detect meeting
- `POST /api/ai/reminders` — Extract reminders
- `POST /api/ai/title` — Generate chat title
- `POST /api/ai/mood` — Detect mood
- `POST /api/ai/notes` — Convert to notes
- `POST /api/ai/explain` — Explain text
- `POST /api/ai/email` — Draft email
- `POST /api/ai/improve` — Improve message
- `POST /api/ai/daily-summary` — Daily activity summary
- `POST /api/ai/chat` — Conversational AI

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
| Phase 4 | AI Integration (multi-provider) | ✅ Complete |
| Phase 5 | React Frontend (full UI) | ✅ Complete |
| Phase 6 | Voice/Video calls (WebRTC) | ✅ Complete |
| Phase 7 | Groups, Status, Analytics | ✅ Complete |
| Phase 8 | Privacy settings + Panic Wipe | ✅ Complete |
| Phase 9 | Scheduled messages + Vanish mode | ✅ Complete |
| Phase 10 | AES-256 message encryption | ✅ Complete |
| Phase 11 | Vercel + Render deployment | ✅ Complete |

---

## 7. Edge Cases & System Resilience

*   **Ollama Unavailable:** `OllamaAiProvider.isAvailable()` catches exceptions. AUTO mode falls through to Gemini. Core chat unaffected.
*   **Gemini API Key Not Set:** `GeminiAiProvider.isAvailable()` checks for non-blank API key. Returns null provider if not set.
*   **All AI Providers Fail:** `AiService.executeWithReport()` receives null provider → returns graceful "AI Unavailable" response.
*   **WebSocket Disconnect:** STOMP client auto-reconnects. Offline messages queued in localStorage, flushed on reconnect.
*   **Message Delete Time Exceeded:** Backend checks timestamp + 15 minutes. Returns HTTP 400 if exceeded.
*   **Call to Offline User:** `offlineNotice` toast shown. `POST /api/calls` saves with status "offline".
*   **File Upload Too Large:** Backend validates size before saving. Returns HTTP 400.
*   **Backend Restart:** All in-memory presence data lost. Users appear offline until they reconnect (within seconds for active users).
