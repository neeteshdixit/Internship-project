# Business Requirements Document (BRD)

## Project: Setu Connect — Real-Time Chat with Multi-Provider AI
**Product Name:** Setu Connect  
**Target Audience:** Product Managers, Compliance Officers, Executive Stakeholders  
**Status:** APPROVED (Updated v2.0 — August 2026)  
**Change:** Updated from Ollama-only AI to Multi-Provider AI (Device → Ollama → Gemini)

---

## 1. Business Context & Problem Statement

In the modern corporate and enterprise landscape, real-time messaging is crucial for productivity. However, existing commercial platforms present significant business challenges:

### 1.1. Data Sovereignty & Confidentiality
*   **The Problem:** Standard messaging apps store chats on public cloud infrastructure. When employees use cloud-based AI tools (e.g. Copilot, ChatGPT) to summarize chat histories or extract action items, corporate intellectual property (IP), financial data, and personal identifiable information (PII) are transmitted to external servers.
*   **The Risk:** Data leakage, loss of competitive advantage, and potential violations of non-disclosure agreements (NDAs).
*   **Our Solution:** Multi-tier AI provider selection — LOCAL first (Device/Ollama), cloud (Gemini) only when explicitly permitted. Every AI response includes a transparency report stating exactly whether data left the device.

### 1.2. Escalating API Costs at Scale
*   **The Problem:** Commercial LLM API calls are charged per-token. For an organization with 5,000 employees summarizing daily chats, the API bills quickly accumulate to thousands of dollars monthly.
*   **The Risk:** Unpredictable operational costs and low return-on-investment (ROI) for enterprise AI helper tools.
*   **Our Solution:** LOCAL mode (Ollama) is $0 per token. Cloud mode (Gemini Flash) is highly cost-efficient at ~$0.0001/1K tokens.

---

## 2. Business Value Proposition (The Solution)

This application provides a **secure, cost-controlled, and privacy-transparent** enterprise messaging platform.

*   **Multi-Provider AI Architecture (Privacy-First):** System supports three AI providers in priority order:
    1. **Device AI** (100% local, zero network) — highest privacy
    2. **Ollama** (local server, zero external calls) — no per-token cost
    3. **Gemini Flash 1.5** (Google Cloud) — always-available fallback, user must grant permission
*   **Transparent AI Privacy Reports:** Every AI response includes: which provider processed it, whether data was sent outside device, processing time. Users are NEVER silently exposed to cloud AI.
*   **User-Controlled AI Permissions:** Users configure their AI preference (AUTO/LOCAL/CLOUD/DEVICE), can disable cloud AI completely, and require explicit permission before any cloud call.
*   **End-to-End Encryption:** Messages encrypted with AES-256 client-side. Encryption IV stored with each message. Plaintext never stored in plaintext on server.
*   **Emergency Panic Wipe:** Users can instantly purge ALL their messages from the database — both locally and from all chat partners' views — in real-time via WebSocket broadcasts.
*   **Enterprise Security Integrations:** JWT-based authentication, privacy-controlled profile visibility, granular read receipt settings.

---

## 3. Regulatory Compliance & Privacy Standards

This project's architecture is uniquely positioned to fulfill global compliance benchmarks:

*   **GDPR (General Data Protection Regulation):**
    - "Right to be Forgotten" supported via Panic Wipe + Account Delete features
    - AI summaries processed transiently — no plaintext caching on server post-processing
    - Local AI mode ensures data never leaves EU jurisdiction
*   **HIPAA (Health Insurance Portability and Accountability Act):** When using LOCAL or DEVICE AI, no patient health information (PHI) is processed by third-party cloud services.
*   **SOC 2 Type II:** Full AI audit trail via transparency reports. Aligns with security trust principles by giving users control over external data transfers.
*   **End-to-End Encryption:** AES-256-GCM client-side encryption ensures server never stores readable plaintext.

---

## 4. Cost-Benefit Analysis (ROI Model)

Assuming an enterprise deployment with **1,000 active users**:

### 4.1. Cloud AI Cost (Gemini Flash — Fallback Mode)
*   *Usage:* 10 AI operations/user/day. Average tokens per call = 1,800.
*   *Total Tokens/day:* 1,000 × 10 × 1,800 = 18,000,000 tokens/day.
*   *Est. cost (Gemini Flash ~$0.0001 per 1K tokens):* **$1.80/day** ($54/month) — very affordable.
*   *Compare to OpenAI GPT-4 ($0.03/1K):* **$540/day** ($16,200/month) — 300x more expensive.

### 4.2. Local AI Cost (Ollama — Preferred Mode)
*   *Hardware:* Dedicated GPU server (RTX 4090 or equivalent).
*   *Capital Expenditure:* $2,500 (One-time).
*   *Per-Token Cost:* **$0.00** (unlimited local inference).
*   *Break-even vs Gemini:* ~46 months. But provides complete data sovereignty.
*   *Break-even vs OpenAI:* **Less than 5 days**.

---

## 5. Key Performance Indicators (KPIs)

To evaluate the success of the system, the business will monitor:
1.  **AI Response Latency:** Target < 5s for Local (Ollama), < 3s for Gemini Cloud.
2.  **Daily Active Users (DAU):** Adoption rate of the internal chat tool.
3.  **Local AI Usage Rate:** % of AI calls handled locally vs cloud (higher local = better privacy score).
4.  **Message Delivery Latency:** WebSocket round-trip target: < 200ms.
5.  **Panic Wipe Usage:** Monitor for emergency usage patterns (data privacy compliance metric).
6.  **Cloud Permission Grant Rate:** How often users allow cloud AI — indicates trust level.
