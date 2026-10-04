# Setu Connect — Enterprise Real-Time Chat & AI Collaboration Platform

![Setu Connect](https://img.shields.io/badge/Version-2.0%20(Gemini%20AI%20Edition)-success)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)

**Setu Connect** is a highly secure, privacy-first, enterprise-grade real-time messaging application. It delivers a WhatsApp-style synchronous instant messaging experience coupled with multi-tiered AI productivity features (Device → Ollama → Gemini 1.5 Flash), peer-to-peer WebRTC voice and video calls, and zero-knowledge client-side AES-GCM-256 end-to-end encryption.

## 🌟 Key Features

*   **Multi-Tier AI Fallback Engine:** Features 16 distinct AI capabilities like Smart Reply, Chat Summarization, Translation, Task Extraction, and Tone Adjustment. Automatically cascades from local AI (Device/Ollama) to Cloud API (Google Gemini 1.5 Flash) based on availability and strict privacy controls.
*   **End-to-End Encryption (E2EE):** All messages are encrypted directly in the browser memory using the Web Crypto API (AES-GCM-256) before transmission. 
*   **Real-Time STOMP Engine:** Built on Spring Boot WebSocket (SockJS fallback) providing sub-second delivery for messages, read receipts (blue ticks), typing indicators, and presence status.
*   **WebRTC Peer-to-Peer Calling:** Integrated Voice and Video calls with direct browser-to-browser P2P encrypted media streams, logged centrally on the backend.
*   **Advanced Chat Options:** Features like Vanish Mode (auto-destructing messages), 24h Ephemeral Stories (Status), Message Pinning, Scheduled Messages, and Panic Wipe (emergency data purge).
*   **Enterprise Analytics:** Comprehensive dashboard visualizing message frequencies, AI usage, and call engagement data.

## 🏗️ System Architecture

The project follows a decoupled, monolithic full-stack structure:

*   **Frontend (React 19 + Vite):** A responsive Single Page Application (SPA). Employs Context API and React Query for state management, STOMP.js for websockets, and a custom CSS Variable-driven theme system supporting Dark/Light modes.
*   **Backend (Spring Boot 3.3.0):** An MVC-structured Java application utilizing Spring Security (stateless JWT), Spring Data JPA (Hibernate), and Spring AI for seamless Ollama integration. 
*   **Database (PostgreSQL):** Relational data mapping persisting users, messages, contacts, privacy settings, and analytics.

## 🚀 Getting Started

### Prerequisites
- **Java:** JDK 17+
- **Node.js:** Node 18+ and npm
- **Database:** PostgreSQL (running locally or cloud)
- **Ollama (Optional):** Required only if utilizing local AI models.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your database and API keys in `src/main/resources/application.properties`. Add your `GEMINI_API_KEY` or configure Ollama base URL.
3. Build and run the Spring Boot server:
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *The backend will initialize at `http://localhost:8081`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173`.*

## 📚 Documentation
For an in-depth dive into the functional specifications, database models, ER diagrams, and cryptographic formulations, please refer to the documentation files included in this repository:
- `prd.md`: Product Requirements Document
- `functional_specifications.md`: Detailed functional workflows
- `system_design_and_model_submission.md`: System design and architectures
- `project_documentation_complete`: Comprehensive project overview and endpoint details.

## 🔗 Live Deployments
- **Frontend (Vercel):** [https://internship-project-xi.vercel.app](https://internship-project-xi.vercel.app)
- **Backend (Render):** [https://internship-project-mywr.onrender.com](https://internship-project-mywr.onrender.com)

---
*Developed for Enterprise Seamless & Secure Connectivity.*
