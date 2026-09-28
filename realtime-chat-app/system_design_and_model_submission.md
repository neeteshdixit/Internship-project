# 🏛️ PROJECT SUBMISSION REPORT
## Proposed System Design, Model Architecture, Code Implementation & Running Model Submission

**Project Title:** Setu Connect — Enterprise Real-Time Chat & AI Collaboration Platform  
**Version:** 2.0 (Gemini AI & WebRTC Edition)  
**Submission Category:** Full-Stack Web Development, Real-Time Distributed Systems & Cloud Integration  
**Live Frontend (Vercel):** https://internship-project-xi.vercel.app  
**Live Backend (Render):** https://internship-project-mywr.onrender.com  

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Proposed System Design & Block Diagrams](#2-proposed-system-design--block-diagrams)
3. [Data Flow Diagrams (DFD Level 0, Level 1, Level 2)](#3-data-flow-diagrams-dfd)
4. [Process Flowcharts](#4-process-flowcharts)
5. [Entity-Relationship (ER) Diagram & Database Schema](#5-entity-relationship-er-diagram--database-schema)
6. [Key Algorithms & Mathematical Formulations](#6-key-algorithms--mathematical-formulations)
7. [Code Implementation Details (Backend & Frontend)](#7-code-implementation-details)
8. [Submission of Running Model & Operational Guide](#8-submission-of-running-model--operational-guide)
9. [Verification, Quality Assurance & UAT Test Results](#9-verification-quality-assurance--uat-test-results)

---

## 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT

### 1.1 Project Overview
**Setu Connect** is an enterprise-grade, privacy-first real-time messaging and team collaboration web application. It combines WhatsApp-style synchronous instant messaging with client-side zero-knowledge encryption (AES-GCM-256), peer-to-peer WebRTC voice/video calls, and an intelligent multi-tiered AI assistant (Device-level Web AI → Local Ollama → Google Gemini 1.5 Flash fallback).

### 1.2 Core Problems Solved
| Traditional Team Chat Issues | Setu Connect Solution |
|---|---|
| Sensitive enterprise data exposed to cloud AI APIs | Multi-tiered AI with on-device/local-first execution and strict privacy controls |
| Lack of audit trails and call logs | Comprehensive analytics dashboard and call session history |
| High external LLM API cost & rate limits | Tiered fallback mechanism (Device AI $\rightarrow$ Ollama $\rightarrow$ Gemini API) |
| Vulnerable centralized chat data stores | Zero-knowledge client-side AES-GCM-256 End-to-End Encryption (E2EE) |
| Ephemeral messaging without auto-cleanup | Vanish Mode with auto-destruct timers and 24-hour status stories |

---

## 2. PROPOSED SYSTEM DESIGN & BLOCK DIAGRAMS

### 2.1 High-Level Architecture Block Diagram

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (React 19 SPA)"]
        UI["Modern UI / Responsive Theme Engine"]
        CryptoEngine["Web Crypto API (AES-GCM-256 E2EE)"]
        STOMPClient["STOMP / SockJS WebSocket Client"]
        WebRTCClient["WebRTC Audio/Video Engine"]
        ContextHub["State Hubs (Auth, Chat, Socket, Call, AI)"]
        
        UI <--> CryptoEngine
        UI <--> ContextHub
        ContextHub <--> STOMPClient
        ContextHub <--> WebRTCClient
    end

    subgraph GatewayLayer ["Network & Edge Gateway Layer"]
        HTTPS_LB["Vercel Edge / Reverse Proxy (HTTPS/WSS)"]
        CORS_Filter["Spring Security CORS & JWT Filter"]
    end

    subgraph BackendLayer ["Application Server (Spring Boot 3.3.0)"]
        AuthCtrl["Auth & User Controller"]
        MsgCtrl["Message & Vanish Mode Controller"]
        CallCtrl["WebRTC Signaling & Call Controller"]
        StatusCtrl["Status & Media Controller"]
        AnalyticsCtrl["Conversation Analytics Controller"]
        
        subgraph MessageBroker ["In-Memory STOMP Message Broker"]
            TopicSub["/topic/messages, /topic/status"]
            QueueSub["/queue/notifications, /user/queue/calls"]
        end
        
        subgraph AISubsystem ["Multi-Tier AI Routing Subsystem"]
            AIEngine["AI Orchestrator"]
            DeviceAI["Tier 1: Device Web AI (Window.ai)"]
            OllamaAI["Tier 2: Local Ollama (Llama 3 / Mistral)"]
            GeminiAI["Tier 3: Google Gemini 1.5 Flash Cloud"]
        end
    end

    subgraph DataLayer ["Persistence & Storage Layer"]
        PostgresDB[("PostgreSQL Relational DB (Hibernate/JPA)")]
        MediaStorage["Local / CDN Media Blob Store"]
    end

    UI -->|HTTPS REST| HTTPS_LB
    STOMPClient -->|WSS SockJS| HTTPS_LB
    HTTPS_LB --> CORS_Filter
    CORS_Filter --> AuthCtrl & MsgCtrl & CallCtrl & StatusCtrl & AnalyticsCtrl
    MsgCtrl <--> MessageBroker
    CallCtrl <--> MessageBroker
    
    AuthCtrl & MsgCtrl & CallCtrl & StatusCtrl & AnalyticsCtrl --> PostgresDB
    StatusCtrl --> MediaStorage
    
    AIEngine --> DeviceAI
    AIEngine --> OllamaAI
    AIEngine --> GeminiAI
    MsgCtrl <--> AIEngine
```

### 2.2 Component & Tier Architecture
1. **Presentation Tier (Frontend):** Built with React 19 and Vite. Utilizes Vanilla CSS design tokens for ultra-responsive dark/light themes without CSS runtime overhead.
2. **Security & Cryptography Tier:** Native Web Crypto API execution in browser memory for zero-knowledge key generation, derivation (PBKDF2), and symmetric message encryption (AES-GCM-256).
3. **Transport & Real-Time Tier:** WebSocket full-duplex protocol running over STOMP/SockJS with heartbeat monitoring and automatic reconnection backoff.
4. **Application Tier (Backend):** Java 17 + Spring Boot 3.3.0 running stateless Spring Security 6 with JWT token verification.
5. **Data Persistence Tier:** PostgreSQL managed database utilizing Hibernate ORM with optimistic locking and indexed relational mapping.

---

## 3. DATA FLOW DIAGRAMS (DFD)

### 3.1 DFD Level 0 (Context Diagram)

```mermaid
flowchart LR
    UserA((User A))
    UserB((User B))
    SetuSystem[Setu Connect Platform]
    GeminiCloud[(Google Gemini Cloud API)]
    PostgresStore[(PostgreSQL Database)]

    UserA -->|1. Credentials, Encrypted Messages, Media, WebRTC Signals| SetuSystem
    SetuSystem -->|2. Real-Time Messages, Push Notifications, Call Feeds| UserA

    UserB -->|3. Credentials, Encrypted Messages, Read Receipts| SetuSystem
    SetuSystem -->|4. Push Delivery, WebRTC Signals, Online Status| UserB

    SetuSystem <-->|5. Smart Replies, Summarization, Translation Requests| GeminiCloud
    SetuSystem <-->|6. Persist Chats, Users, Contacts, Call Logs, Analytics| PostgresStore
```

### 3.2 DFD Level 1 (Functional Subsystems Decomposition)

```mermaid
flowchart TD
    User((Active User))

    subgraph DFD_Level1 ["Setu Connect Subsystems"]
        P1["1.0 Authentication & Session Management"]
        P2["2.0 Real-Time Messaging & E2EE Broker"]
        P3["3.0 WebRTC Call Signaling Engine"]
        P4["4.0 Multi-Tier AI Assistant Pipeline"]
        P5["5.0 Status, Media & Ephemeral Dispatch"]
        P6["6.0 Conversation Analytics Engine"]
    end

    D1[("D1: Users & Auth Store")]
    D2[("D2: Messages & Vanish Store")]
    D3[("D3: Call Records Store")]
    D4[("D4: Status & Media Store")]
    ExternalAI["External LLM (Gemini 1.5 Flash)"]

    User -->|Credentials| P1
    P1 -->|Generate JWT & Validate| D1
    P1 -->|Auth Token & Profile| User

    User -->|Encrypted Payload| P2
    P2 -->|Save Message Metadata| D2
    P2 -->|STOMP Dispatch| User

    User -->|SDP Offer / Answer / ICE| P3
    P3 -->|Relay Signaling & Log Call| D3
    P3 -->|Signal Stream| User

    User -->|Prompt / Chat Context| P4
    P4 <-->|Query Fallback Model| ExternalAI
    P4 -->|AI Suggestions / Summaries| User

    User -->|Story / Media File| P5
    P5 -->|Store Blob & Metadata| D4
    P5 -->|24h Ephemeral Broadcast| User

    User -->|Interaction Event| P6
    P6 -->|Compute Metrics & Streaks| D2
    P6 -->|Analytics Dashboard Data| User
```

### 3.3 DFD Level 2 (Real-Time Messaging & Dispatch Subsystem)

```mermaid
flowchart TD
    Sender((Sender Client))
    Receiver((Receiver Client))

    subgraph MsgSubsystem ["Process 2.0: Real-Time Messaging Deep-Dive"]
        P2_1["2.1 E2EE Encryption & Frame Builder"]
        P2_2["2.2 STOMP Inbound Dispatcher (/app/chat.sendMessage)"]
        P2_3["2.3 Persistence & Status Controller (SENT)"]
        P2_4["2.4 Recipient Presence & Routing Gate"]
        P2_5["2.5 Delivery & Read Receipt Synchronizer"]
        P2_6["2.6 Ephemeral & Vanish Mode Reaper"]
    end

    DB_Msg[("Database: Messages Table")]

    Sender -->|Plaintext + Key| P2_1
    P2_1 -->|Ciphertext Payload| P2_2
    P2_2 --> P2_3
    P2_3 -->|INSERT Message Record| DB_Msg
    P2_3 -->|Emit Single Tick ACK| Sender
    P2_3 --> P2_4

    P2_4 -->|Online: Push to /user/queue/messages| Receiver
    P2_4 -->|Offline: Flag for Sync on Connect| DB_Msg

    Receiver -->|Emit Delivery Receipt ACK| P2_5
    Receiver -->|Emit Read Receipt ACK on Focus| P2_5
    P2_5 -->|UPDATE Status = DELIVERED/READ| DB_Msg
    P2_5 -->|Relay Double/Blue Tick Status| Sender

    P2_6 -->|Scheduled Cron: Purge Expired Vanish Messages| DB_Msg
```

---

## 4. PROCESS FLOWCHARTS

### 4.1 User Authentication & Session Handshake Flowchart

```mermaid
flowchart TD
    Start([User opens Setu Connect]) --> AuthCheck{JWT Token exists in localStorage?}
    
    AuthCheck -- Yes --> ValidateToken[Call GET /api/users/me with Bearer Token]
    ValidateToken --> IsValid{Token Valid & Not Expired?}
    IsValid -- Yes --> SetAuth[Initialize User Context & Connect WebSocket]
    IsValid -- No --> ClearStorage[Purge invalid tokens] --> ShowLogin[Render Login Screen]

    AuthCheck -- No --> ShowLogin
    ShowLogin --> UserInput[/User enters Username/Phone and Password/]
    UserInput --> SubmitAuth[POST /api/auth/login]
    SubmitAuth --> ServerAuth{Server verifies BCrypt hash}
    ServerAuth -- Failure --> ShowError[Display 'Invalid Credentials' error] --> ShowLogin
    ServerAuth -- Success --> IssueJWT[Generate JWT Token & User Profile]
    IssueJWT --> SaveLocal[Persist JWT in localStorage]
    SaveLocal --> SetAuth
    SetAuth --> InitWebSocket[Connect to STOMP Broker at /ws-chat]
    InitWebSocket --> Dashboard([Navigate to Main Chat Dashboard])
```

### 4.2 Real-Time Message Delivery & Read Receipt State Machine

```mermaid
flowchart TD
    MsgStart([User types message & clicks Send]) --> E2EESwitch{E2EE Enabled?}
    E2EESwitch -- Yes --> RunCrypto[Encrypt message client-side with AES-GCM-256]
    E2EESwitch -- No --> PlainPayload[Keep plaintext payload]
    RunCrypto --> PackagePayload[Construct JSON Payload with temp UUID]
    PlainPayload --> PackagePayload

    PackagePayload --> OptimisticState[Render message in UI with State: SENDING 🕒]
    OptimisticState --> EmitSTOMP[STOMP Send: /app/chat.sendMessage]

    EmitSTOMP --> ServerReceive[MessageController receives frame]
    ServerReceive --> DBStore[Persist message to DB: Status = SENT]
    DBStore --> ServerAck[Emit ACK to Sender: Status = SENT ✓]
    ServerAck --> UpdateSenderUI1[Sender UI updates to Single Tick ✓]

    ServerReceive --> TargetOnlineCheck{Is Recipient connected to WebSocket?}
    TargetOnlineCheck -- Yes --> DeliverTarget[STOMP Broker pushes to recipient queue]
    TargetOnlineCheck -- No --> HoldInDB[Store as pending in PostgreSQL]

    DeliverTarget --> RecipientReceived[Recipient receives payload]
    RecipientReceived --> DecryptCheck{Is Encrypted?}
    DecryptCheck -- Yes --> DecryptText[Decrypt using shared secret in browser]
    DecryptCheck -- No --> RenderText[Render directly]
    DecryptText --> RenderText

    RenderText --> EmitDelivered[Emit Delivery Receipt to Server]
    EmitDelivered --> DBUpdateDelivered[Update DB: Status = DELIVERED]
    DBUpdateDelivered --> NotifySenderDelivered[Notify Sender via WebSocket]
    NotifySenderDelivered --> UpdateSenderUI2[Sender UI updates to Double Gray Ticks ✓✓]

    RenderText --> RecipientViewCheck{Is conversation window open and focused?}
    RecipientViewCheck -- Yes --> EmitRead[Emit Read Receipt to Server]
    RecipientViewCheck -- No --> WaitWindowFocus[Wait for user to focus chat window]
    WaitWindowFocus --> EmitRead
    EmitRead --> DBUpdateRead[Update DB: Status = READ]
    DBUpdateRead --> NotifySenderRead[Notify Sender via WebSocket]
    NotifySenderRead --> EndTicks([Sender UI updates to Double Blue Ticks 🔵🔵])
```

### 4.3 Multi-Tier AI Assistance Execution Flowchart

```mermaid
flowchart TD
    AIReq([User clicks AI Action: Smart Reply / Summarize / Translate / Tone]) --> CheckTier1{Tier 1: Is window.ai / Device AI available?}
    
    CheckTier1 -- Yes --> ExecTier1[Execute on local hardware neural engine]
    ExecTier1 --> SuccTier1{Execution Successful?}
    SuccTier1 -- Yes --> FormatResult[Format and inject into composer / UI]
    SuccTier1 -- No --> CheckTier2
    
    CheckTier1 -- No --> CheckTier2{Tier 2: Is Ollama running on localhost:11434?}
    CheckTier2 -- Yes --> ExecTier2[Dispatch prompt to local Ollama Llama 3 API]
    ExecTier2 --> SuccTier2{Execution Successful?}
    SuccTier2 -- Yes --> FormatResult
    SuccTier2 -- No --> CheckTier3
    
    CheckTier2 -- No --> CheckTier3{Tier 3: Is Gemini Cloud API configured?}
    CheckTier3 -- Yes --> ExecTier3[Call Google Gemini 1.5 Flash Cloud API]
    ExecTier3 --> SuccTier3{Execution Successful?}
    SuccTier3 -- Yes --> FormatResult
    SuccTier3 -- No --> HeuristicRule
    
    CheckTier3 -- No --> HeuristicRule[Client-side rule-based heuristic fallback]
    HeuristicRule --> FormatResult
    FormatResult --> Finish([User accepts / edits AI output])
```

### 4.4 WebRTC Voice/Video Call Signaling Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor Caller as User A (Caller)
    participant WS as WebSocket STOMP Broker
    actor Callee as User B (Callee)

    Caller->>WS: Send Call Request (/app/call.initiate)
    WS->>Callee: Ringing Signal & Caller Profile (/user/queue/calls)
    Callee->>Caller: Ringing Notification State
    
    alt Callee Accepts Call
        Callee->>WS: Accept Call Signal (/app/call.accept)
        WS->>Caller: Call Accepted Notification
        
        Caller->>Caller: Create RTCPeerConnection & Local Media Stream
        Caller->>WS: Send SDP Offer (/app/call.signal)
        WS->>Callee: Relay SDP Offer
        
        Callee->>Callee: Set Remote Description & Create SDP Answer
        Callee->>WS: Send SDP Answer (/app/call.signal)
        WS->>Caller: Relay SDP Answer
        
        Caller->>WS: Exchange ICE Candidates
        WS->>Callee: Relay ICE Candidates
        Callee->>WS: Exchange ICE Candidates
        WS->>Caller: Relay ICE Candidates
        
        Note over Caller, Callee: Direct Peer-to-Peer Encrypted SRTP Audio/Video Stream Established
        
    else Callee Declines / Missed Call
        Callee->>WS: Reject / Missed Call Signal (/app/call.reject)
        WS->>Caller: Relayed 'Call Declined' & Log to Call History
    end
```

---

## 5. ENTITY-RELATIONSHIP (ER) DIAGRAM & DATABASE SCHEMA

### 5.1 ER Diagram

```mermaid
erDiagram
    USERS ||--o{ CONTACTS : "manages"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ MESSAGES : "receives"
    USERS ||--o{ CALL_RECORDS : "places"
    USERS ||--o{ CALL_RECORDS : "receives"
    USERS ||--o{ STATUSES : "publishes"
    USERS ||--o{ SCHEDULED_MESSAGES : "queues"
    USERS ||--|| PRIVACY_SETTINGS : "owns"
    USERS ||--|| AI_SETTINGS : "configures"
    USERS ||--o{ CONVERSATION_VANISH_MODES : "sets"
    USERS }|--|{ CHAT_GROUPS : "participates"

    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar phone UK
        varchar password
        varchar avatar_url
        varchar about
        varchar public_key
        timestamp last_seen
        boolean is_online
        timestamp created_at
    }

    MESSAGES {
        bigint id PK
        bigint sender_id FK
        bigint receiver_id FK
        bigint group_id FK
        text content
        varchar message_type
        varchar status
        boolean is_encrypted
        varchar iv
        boolean is_vanish_mode
        timestamp vanish_expiry
        varchar media_url
        timestamp timestamp
    }

    CONTACTS {
        bigint id PK
        bigint user_id FK
        bigint contact_user_id FK
        varchar custom_name
        boolean is_blocked
        boolean is_favorite
        timestamp created_at
    }

    CALL_RECORDS {
        bigint id PK
        bigint caller_id FK
        bigint receiver_id FK
        varchar call_type
        varchar status
        integer duration_seconds
        timestamp started_at
        timestamp ended_at
    }

    STATUSES {
        bigint id PK
        bigint user_id FK
        text content
        varchar media_url
        varchar background_color
        timestamp expires_at
        timestamp created_at
    }

    SCHEDULED_MESSAGES {
        bigint id PK
        bigint sender_id FK
        bigint receiver_id FK
        text content
        timestamp scheduled_time
        varchar status
    }

    PRIVACY_SETTINGS {
        bigint id PK
        bigint user_id FK
        varchar last_seen_visibility
        varchar profile_photo_visibility
        boolean read_receipts_enabled
        boolean vanish_mode_default
    }

    AI_SETTINGS {
        bigint id PK
        bigint user_id FK
        varchar preferred_provider
        boolean smart_replies_enabled
        boolean auto_summarize_enabled
    }

    CONVERSATION_VANISH_MODES {
        bigint id PK
        bigint user1_id FK
        bigint user2_id FK
        boolean is_enabled
        integer duration_seconds
        timestamp updated_at
    }

    CHAT_GROUPS {
        bigint id PK
        varchar group_name
        varchar group_avatar
        bigint admin_id FK
        timestamp created_at
    }
```

### 5.2 Relational Data Dictionary

| Table Name | Primary Key | Foreign Keys | Key Columns & Data Types | Purpose |
|---|---|---|---|---|
| `users` | `id` (BIGINT) | — | `username` (VARCHAR), `email` (VARCHAR), `phone` (VARCHAR), `password` (VARCHAR), `is_online` (BOOLEAN) | Authentication, user credentials, and presence tracking |
| `messages` | `id` (BIGINT) | `sender_id`, `receiver_id`, `group_id` | `content` (TEXT), `status` (VARCHAR), `is_encrypted` (BOOLEAN), `iv` (VARCHAR), `timestamp` (TIMESTAMP) | Persistent encrypted chat payloads and delivery receipts |
| `contacts` | `id` (BIGINT) | `user_id`, `contact_user_id` | `custom_name` (VARCHAR), `is_blocked` (BOOLEAN), `is_favorite` (BOOLEAN) | User address book, favorites, and blocklist |
| `call_records` | `id` (BIGINT) | `caller_id`, `receiver_id` | `call_type` (VARCHAR), `status` (VARCHAR), `duration_seconds` (INT), `started_at` (TIMESTAMP) | WebRTC call logs, durations, and missed call tracking |
| `statuses` | `id` (BIGINT) | `user_id` | `content` (TEXT), `media_url` (VARCHAR), `expires_at` (TIMESTAMP) | 24-hour ephemeral stories and media updates |
| `scheduled_messages` | `id` (BIGINT) | `sender_id`, `receiver_id` | `content` (TEXT), `scheduled_time` (TIMESTAMP), `status` (VARCHAR) | Queued messages for scheduled cron dispatch |
| `privacy_settings` | `id` (BIGINT) | `user_id` | `last_seen_visibility` (VARCHAR), `read_receipts_enabled` (BOOLEAN) | Granular user visibility and security toggles |
| `ai_settings` | `id` (BIGINT) | `user_id` | `preferred_provider` (VARCHAR), `smart_replies_enabled` (BOOLEAN) | Custom AI behavior and provider preference |
| `conversation_vanish_modes` | `id` (BIGINT) | `user1_id`, `user2_id` | `is_enabled` (BOOLEAN), `duration_seconds` (INT) | Per-chat ephemeral auto-destruct timer configuration |

---

## 6. KEY ALGORITHMS & MATHEMATICAL FORMULATIONS

### 6.1 AES-GCM-256 E2EE Cryptographic Key Derivation & Encryption

```
Algorithm 1: Client-Side Deterministic Encryption & Decryption
Input: Plaintext Message (P), Shared Secret Password (K_pass), Salt (S)
Output: Base64 Encoded Ciphertext Packet (Packet_out)

1. Key Derivation (PBKDF2 with HMAC-SHA256):
   K_derived = PBKDF2(
       Password   = UTF8_Encode(K_pass),
       Salt       = UTF8_Encode(S),
       Iterations = 100,000,
       Hash       = "SHA-256",
       Length     = 256 bits
   )

2. Initialization Vector (IV) Generation:
   IV = Crypto.getRandomValues(12 bytes)  // 96-bit standard for GCM

3. Authenticated Encryption:
   (Ciphertext, Tag) = AES_GCM_Encrypt(
       Key  = K_derived,
       IV   = IV,
       Data = UTF8_Encode(P),
       TagLength = 128 bits
   )

4. Serialized Transport Output:
   Packet_out = Base64_Encode(IV || Ciphertext || Tag)

5. Decryption (Reverse Operation):
   (IV, Ciphertext, Tag) = Split(Base64_Decode(Packet_out))
   Plaintext = AES_GCM_Decrypt(Key = K_derived, IV = IV, Ciphertext = Ciphertext, Tag = Tag)
   Return UTF8_Decode(Plaintext)
```

### 6.2 Multi-Tier AI Provider Selection & Fallback Routing

```
Algorithm 2: Dynamic Multi-Tier AI Fallback Engine
Input: Prompt (P), Conversation History (H), Feature Type (F)
Output: Formatted Response Text (R)

Function ResolveAIRequest(P, H, F):
    // Tier 1: Hardware-Accelerated Local Device AI
    If Window.ai exists AND Window.ai.canCreateTextSession() == "readily":
        Try:
            Session = Window.ai.createTextSession()
            Return Session.prompt(BuildSystemPrompt(P, H, F))
        Catch DeviceError:
            LogWarning("Tier 1 Device AI failed. Falling back to Tier 2...")

    // Tier 2: Local Ollama Daemon
    If IsOllamaRunning("http://localhost:11434"):
        Try:
            Response = HTTP_POST("http://localhost:11434/api/generate", {
                "model": "llama3",
                "prompt": BuildSystemPrompt(P, H, F),
                "stream": false
            })
            Return Response.json().response
        Catch OllamaError:
            LogWarning("Tier 2 Ollama failed. Falling back to Tier 3...")

    // Tier 3: Google Cloud Gemini 1.5 Flash API
    If Environment.GEMINI_API_KEY is not empty:
        Try:
            Return GoogleGeminiClient.generateContent({
                "model": "gemini-1.5-flash",
                "contents": BuildSystemPrompt(P, H, F)
            })
        Catch GeminiError:
            LogWarning("Tier 3 Cloud API failed. Falling back to Heuristic Rules...")

    // Fallback: Rule-Based Deterministic Heuristics
    Return ExecuteClientHeuristics(P, F)
```

---

## 7. CODE IMPLEMENTATION DETAILS

### 7.1 Backend Architecture (Spring Boot 3.3.0)

* **Entry Point:** `WhatsappCloneBackendApplication.java` boots the Spring context, configures asynchronous executors, and activates JPA auditing.
* **Security & Authentication:** `SecurityConfig.java` enforces stateless JWT authentication via `JwtAuthenticationFilter` and `JwtTokenProvider`. Passwords are protected using BCrypt hashing (strength 12).
* **WebSocket Message Broker:** `WebSocketConfig.java` registers `/ws-chat` endpoint with SockJS fallback and activates in-memory broker destinations `/topic` and `/queue`.
* **REST & WebSocket Controllers:**
  * `AuthController.java`: Handles user registration, credentials validation, and JWT token issuance.
  * `MessageController.java`: Manages message lifecycle (send, edit, delete, star, delivery receipts, vanish auto-purge).
  * `CallController.java`: Manages WebRTC call signaling sessions, missed call alerts, and call logging.
  * `AiController.java`: Integrates Google Gemini 1.5 Flash and Spring AI Ollama for summarization and smart replies.
  * `StatusController.java`: Coordinates 24h disappearing statuses and media uploads.
  * `AnalyticsController.java`: Aggregates user chat frequencies, response latency, and weekly engagement graphs.

### 7.2 Frontend Architecture (React 19 SPA)

* **Component Structure:**
  * `Auth/`: Authentication modal with smooth tab transitions between login and registration.
  * `Sidebar/`: 3-column navigation rail featuring Contacts, Chats, Statuses, Calls, Analytics, and Settings panels.
  * `ChatWindow/`: Active conversation view with interactive message feed, emoji reactions, voice notes, media viewer, and AI Smart Compose.
  * `Modals/`: Dedicated dialogs for Security settings, Vanish mode timer, Media preview, and Scheduled messages.
* **State Management Hubs (Context API):**
  * `AuthContext.jsx`: User identity, authentication status, and profile updates.
  * `ChatContext.jsx`: Active chat, conversation histories, delivery receipt sync, and optimistic UI dispatch.
  * `SocketContext.jsx`: STOMP client connection lifecycle with exponential retry logic.
  * `CallContext.jsx`: WebRTC peer connection, audio/video media stream capture, and incoming call overlays.
* **Cryptographic Engine:** `cryptoEngine.js` provides client-side zero-knowledge AES-GCM-256 encryption.

---

## 8. SUBMISSION OF RUNNING MODEL & OPERATIONAL GUIDE

### 8.1 Live Production Endpoints

| Resource | Platform | URL |
|---|---|---|
| **Live Frontend Web App** | Vercel | **https://internship-project-xi.vercel.app** |
| **Live Backend API Server** | Render | **https://internship-project-mywr.onrender.com** |
| **WebSocket STOMP Broker** | Render (WSS) | `wss://internship-project-mywr.onrender.com/ws-chat` |
| **Database Instance** | PostgreSQL Cloud | Managed PostgreSQL with automatic migrations |

---

### 8.2 Step-by-Step Local Setup & Execution Guide

#### Step 1: System Prerequisites
- **Java:** JDK 17 or higher
- **Node.js:** Node 18.x or higher & npm
- **Maven:** Version 3.8+ (or bundled `mvnw`)
- **Database:** PostgreSQL (or embedded H2 fallback)

#### Step 2: Running Backend Server
```powershell
# Navigate to backend directory
cd "d:\Projects\chat project\Internship-project\realtime-chat-app\backend"

# Build and start Spring Boot server
./mvnw clean spring-boot:run
```
*Backend initializes on `http://localhost:8081`.*

#### Step 3: Running Frontend Client
```powershell
# Navigate to frontend directory
cd "d:\Projects\chat project\Internship-project\realtime-chat-app\frontend"

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend launches at `http://localhost:5173`.*

---

## 9. VERIFICATION, QUALITY ASSURANCE & UAT TEST RESULTS

| Test Case ID | Feature / Module | Test Scenario & Verification Steps | Expected Result | Status |
|---|---|---|---|---|
| **TC-01** | User Authentication | Register new user $\rightarrow$ Login with credentials | JWT issued, token stored, redirected to dashboard | **PASSED** ✅ |
| **TC-02** | Real-Time Messaging | Send message from User A to User B | Instant delivery via STOMP broker without page reload | **PASSED** ✅ |
| **TC-03** | Delivery & Read Receipts | User A sends message $\rightarrow$ User B receives $\rightarrow$ User B opens chat | Ticks update: 🕒 (Sending) $\rightarrow$ ✓ (Sent) $\rightarrow$ ✓✓ (Delivered) $\rightarrow$ 🔵🔵 (Read) | **PASSED** ✅ |
| **TC-04** | End-to-End Encryption | Inspect network frame and PostgreSQL database contents | Content stored as encrypted ciphertext; plaintext only in client memory | **PASSED** ✅ |
| **TC-05** | WebRTC Video/Voice Call | User A initiates video call to User B $\rightarrow$ User B accepts | Full-duplex audio/video stream established with peer connection | **PASSED** ✅ |
| **TC-06** | AI Summarization | Select chat with 10+ messages $\rightarrow$ Click 'Summarize with AI' | Multi-tier AI generates structured bulleted summary of key points | **PASSED** ✅ |
| **TC-07** | Vanish Mode | Set 10-second vanish timer $\rightarrow$ Send message | Message automatically purged from UI and database after 10 seconds | **PASSED** ✅ |
| **TC-08** | 24h Ephemeral Stories | Upload image status $\rightarrow$ View from contact account | Story displays with viewer tracking; auto-expires after 24 hours | **PASSED** ✅ |
| **TC-09** | Conversation Analytics | Open Analytics tab from sidebar rail | Interactive charts render response times, message frequencies, streaks | **PASSED** ✅ |

---

**Report Prepared By:** Project Development Team  
**Submission Date:** August 2026  
**Status:** Approved for Final Review & Evaluation
