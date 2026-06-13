# Product Requirements Document (PRD)

## Project: WhatsApp Clone with Local AI Integration (Ollama)
**Author:** Neetesh Dixit 
**Status:** DRAFT (Under Review)  
**Target Architecture:** Java Full Stack (Spring Boot + React)  

---

## 1. Executive Summary & Objective

This document outlines the product requirements and architectural design for a high-performance, real-time messaging application similar to WhatsApp. 

### What makes this project unique?
Traditional chat apps rely on expensive, third-party cloud APIs (like OpenAI or Gemini) for smart features, exposing private conversation data to external companies. This project implements a **Self-Hosted, Privacy-First AI Architecture** where:
*   Real-time chat is powered by **Spring Boot WebSockets** and cached via **Redis**.
*   AI features (such as chat summarization and action-item tracking) are processed locally on the host machine using **Ollama** (via **Spring AI**).
*   Messages are protected using advanced data-privacy patterns (transient decrypted syncing) to ensure private chat logs are never permanently stored in plaintext on any server.

---

## 2. Tech Stack Definition

| Component | Technology | Role / Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot 3.x (Java 17/21) | Core application logic, security, REST APIs, WebSockets. |
| **Frontend UI** | React.js (Vite, TypeScript, Tailwind CSS) | Dynamic, single-page application mimicking WhatsApp Web. |
| **Primary Database** | PostgreSQL | Persistent relational storage for Users, Chats, and Messages. |
| **In-Memory Store** | Redis | Low-latency storage for user presence (online status) and typing indicators. |
| **Real-time Protocol** | STOMP over WebSockets (SockJS) | Message broadcasting, read receipts, and streaming events. |
| **AI Integration Engine** | Spring AI + Local Ollama (Phi-3/Llama-3) | Local NLP engine for summary generation and task extraction. |
| **Build Tools** | Maven & npm | Package and dependency management. |

---

## 3. Core Features & Functional Requirements

### 3.1. User Onboarding & Security
*   **Registration & Authentication:** Email/username-based sign-up with password hashing (BCrypt) and JWT-based authentication.
*   **Session Management:** JWT tokens returned on login. Tokens will be validated during both HTTP REST calls and WebSocket connection handshakes.

### 3.2. Real-Time Chat Engine
*   **One-to-One Messaging:** Instantly send/receive private text messages between two online users via WebSocket.
*   **Group Chat Messaging:** Multiple members can join a group conversation. Messages sent to the group channel are broadcast to all online group participants.
*   **Message Lifecycle Status (Delivery Ticks):**
    *   `SENT` (✓) - Message successfully written to the server's PostgreSQL DB.
    *   `DELIVERED` (✓✓) - Client's device acknowledges receipt of the incoming WebSocket packet.
    *   `READ` (🔵✓✓) - Recipient actively opens/views the chat view.
*   **Offline Support (Queueing):** If a recipient is offline, the backend keeps the message database state as `SENT`. Upon the recipient establishing a WebSocket handshake, all pending messages are fetched and flushed down the socket channel.

### 3.3. Live Presence & Indicators (Redis-Backed)
*   **Online/Offline Status:** User's connection state. Managed in Redis via active WebSocket connections and client-sent heartbeat pings.
*   **Last Seen Timestamp:** Updated in PostgreSQL whenever a user disconnects or stops sending heartbeats.
*   **Typing... Indicator:** Dynamic indicator displaying when a user is writing. Keys expire automatically from Redis after 3 seconds of inactivity.

### 3.4. Local AI Summarization (The USP)
*   **Trigger Mechanism:** A button inside the chat window: "Summarize Conversation".
*   **Transient Decrypted Flow:**
    1.  The React frontend decrypts the local message logs.
    2.  The React app sends the plain text of the last $N$ messages to `/api/ai/summarize`.
    3.  Spring Boot passes this text to the local Ollama instance running the **Llama-3** or **Phi-3** model.
    4.  The response is returned to the user, and the backend wipes the plain text from the server's volatile memory.
*   **Streaming UI:** Long-running summarizations are streamed token-by-token over WebSockets or SSE (Server-Sent Events) to keep the client UI responsive.

---

## 4. Database Schema Design (PostgreSQL)

```sql
-- 1. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_pic_url VARCHAR(255),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chats (Conversations) Table
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'ONE_TO_ONE' or 'GROUP'
    name VARCHAR(100), -- Null for one-to-one, custom name for groups
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chat Members Table (Mapping Users to Chats)
CREATE TABLE chat_members (
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chat_id, user_id)
);

-- 4. Messages Table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'READ'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Performance Indexes
CREATE INDEX idx_messages_chat_timestamp ON messages (chat_id, sent_at DESC);
CREATE INDEX idx_users_username ON users (username);
```

---

## 5. System Architecture Flow & Endpoints

### 5.1. REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user account | No |
| **POST** | `/api/auth/login` | Login and return JWT Token | No |
| **GET** | `/api/chats` | Retrieve list of all conversations for current user | Yes (JWT) |
| **POST** | `/api/chats` | Create a new Chat (One-to-One or Group) | Yes (JWT) |
| **GET** | `/api/chats/{chatId}/messages` | Paginated message logs for a specific chat (Keyset based) | Yes (JWT) |
| **POST**| `/api/ai/summarize` | Send transient chat logs to Ollama for summary | Yes (JWT) |

### 5.2. WebSocket Topic Directory (STOMP Client Subscriptions)

*   **Inbound Channel:** Send message: `/app/chat.send`
*   **Outbound Subscription:** Private messages & Receipts: `/user/queue/messages`
*   **Group Subscription:** Broadcast channel: `/topic/chat/{chatId}`
*   **Presence Subscription:** User status updates: `/topic/presence`

---

## 6. Implementation Roadmap (Step-by-Step Plan)

### Phase 1: Core Setup & REST API
1.  Initialize Spring Boot 3 with Web, PostgreSQL JPA, Validation, and Lombok dependencies.
2.  Set up local PostgreSQL DB (configured via `application.properties`).
3.  Write the user registration/login flow and secure all other endpoints using Spring Security JWT.

### Phase 2: WebSocket Messaging Core
1.  Configure Spring WebSocket with STOMP message broker.
2.  Build the message persistence handler: intercept incoming WebSocket payloads, write them to PostgreSQL as `SENT`, and push them to recipient subscription.
3.  Implement delivery tick feedbacks (`SENT` -> `DELIVERED`).

### Phase 3: High-Performance Cache (Redis Integration)
1.  Set up local Redis connection inside Spring Boot.
2.  Write the online/offline presence status tracker using Redis keys with short TTLs.
3.  Build the typing indicator mechanism with Redis auto-expiry keys.

### Phase 4: Local Ollama & Spring AI Pipeline
1.  Integrate `spring-ai-ollama` starter inside the backend dependencies.
2.  Configure prompt templates for summaries and action items.
3.  Implement asynchronous controller with Spring's `@Async` and reactive streaming for the token-by-token summarizer.

### Phase 5: Responsive React Frontend
1.  Setup React (Vite + TypeScript) and Tailwind CSS.
2.  Build the login, user list, and chat screen UI.
3.  Connect to the STOMP server using SockJS.
4.  Implement local state management for pagination, message ticks, typing triggers, and the AI summary box.

---

## 7. Crucial Edge Cases & Risks
*   **Ollama Server Unavailability:** If Ollama is offline or crashes on the host machine, the backend must return a friendly error message (*"AI summarizer is offline, please try later"*) without breaking the core chat functions.
*   **WebSocket Disconnects during LLM stream:** If the user closes the window while the AI is streaming a summary, the backend should detect the canceled stream and stop requesting tokens from Ollama to save system RAM/CPU.
