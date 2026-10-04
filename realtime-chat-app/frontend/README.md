# Setu Connect - Frontend

This is the frontend component of **Setu Connect**, an enterprise-grade, privacy-first real-time messaging web application.

## 🚀 Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 8
- **State Management:** React Context API + `@tanstack/react-query`
- **Real-Time Engine:** `@stomp/stompjs` and `sockjs-client` (WebSockets)
- **Styling:** Vanilla CSS with custom CSS variables for dark/light themes (No Tailwind CSS overhead)
- **Icons:** `lucide-react`
- **Encryption:** Native Web Crypto API (AES-GCM-256 Client-Side Encryption)

## 📦 Key Features

- **Real-Time Chat:** Sub-second message delivery, typing indicators, and read receipts powered by Spring Boot STOMP broker.
- **WebRTC Calls:** Peer-to-peer Voice and Video calling without a media server.
- **Multi-Tier AI Integration:** Supports local device AI, local Ollama, and Google Gemini Flash 1.5. Includes privacy transparency reports for all AI actions.
- **Zero-Knowledge Encryption:** Messages are encrypted locally in the browser before ever touching the network.
- **Rich Media & Statuses:** 24h disappearing statuses, file sharing, and vanish mode.

## 🛠️ Setup Instructions

1. **Install dependencies:**
   Ensure you have Node.js 18+ installed.
   ```bash
   npm install
   ```

2. **Environment Variables:**
   You can configure the backend URL in `.env` files (e.g. `.env.local` or `.env.development`).
   ```env
   VITE_API_URL=http://localhost:8081
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📂 Architecture Overview

- `/src/components/`: Modular UI components (Auth, Sidebar, ChatWindow, calls, modals).
- `/src/context/`: Core state hubs (`AuthContext`, `ChatContext`, `CallContext`, `UIContext`).
- `/src/crypto/`: Client-side encryption logic (`cryptoEngine.js`).
- `/src/lib/`: API interceptors (`apiFetch.js`) and Query client configuration.

## 🔗 Links

- **Main Repository README:** [../../README.md](../../README.md)
- **Live Deployment:** [https://internship-project-xi.vercel.app](https://internship-project-xi.vercel.app)
