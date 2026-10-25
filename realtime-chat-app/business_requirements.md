# Business Requirements Document (BRD)

## Project: Setu Connect — Enterprise Real-Time Chat
**Product Name:** Setu Connect  
**Target Audience:** Product Managers, Compliance Officers, Executive Stakeholders  
**Status:** APPROVED (Updated v2.0 — August 2026)  

---

## 1. Business Context & Problem Statement

In the modern corporate and enterprise landscape, real-time messaging is crucial for productivity. However, existing commercial platforms present significant business challenges:

### 1.1. Data Sovereignty & Confidentiality
*   **The Problem:** Standard messaging apps store chats on public cloud infrastructure. When employees discuss corporate intellectual property (IP), financial data, and personal identifiable information (PII), this data is transmitted to and stored on external servers in readable formats.
*   **The Risk:** Data leakage, loss of competitive advantage, and potential violations of non-disclosure agreements (NDAs).
*   **Our Solution:** Complete End-to-End Encryption (E2EE) and self-hosted infrastructure. Messages are encrypted client-side using AES-256 before transmission.

### 1.2. Lack of Auditable Call Records
*   **The Problem:** Many teams use disconnected systems for chat and video calls, leading to lost communication records.
*   **The Risk:** Compliance issues due to untraceable communication.
*   **Our Solution:** Integrated WebRTC peer-to-peer calling with centrally logged call histories (caller, receiver, duration, timestamps) without storing the actual media streams.

---

## 2. Business Value Proposition (The Solution)

This application provides a **secure, cost-controlled, and privacy-first** enterprise messaging platform.

*   **End-to-End Encryption:** Messages encrypted with AES-256 client-side. Encryption IV stored with each message. Plaintext never stored in plaintext on server.
*   **Emergency Panic Wipe:** Users can instantly purge ALL their messages from the database — both locally and from all chat partners' views — in real-time via WebSocket broadcasts.
*   **Enterprise Security Integrations:** JWT-based authentication, privacy-controlled profile visibility, granular read receipt settings.
*   **Vanish Mode:** Auto-destructing messages for highly sensitive, ephemeral communication.
*   **Centralized Analytics:** Enterprise dashboards to monitor overall system engagement (messages sent, calls made) for compliance and productivity tracking.

---

## 3. Regulatory Compliance & Privacy Standards

This project's architecture is uniquely positioned to fulfill global compliance benchmarks:

*   **GDPR (General Data Protection Regulation):**
    - "Right to be Forgotten" supported via Panic Wipe + Account Delete features.
*   **HIPAA (Health Insurance Portability and Accountability Act):**
    - End-to-End Encryption ensures patient health information (PHI) is never readable by server administrators.
*   **SOC 2 Type II:**
    - Aligns with security trust principles by ensuring data confidentiality in transit and at rest.

---

## 4. Key Performance Indicators (KPIs)

To evaluate the success of the system, the business will monitor:
1.  **System Uptime & Latency:** WebSocket round-trip target: < 200ms.
2.  **Daily Active Users (DAU):** Adoption rate of the internal chat tool.
3.  **Call Success Rate:** Percentage of WebRTC calls successfully connected without fallback.
4.  **Panic Wipe & Vanish Mode Usage:** Monitor for emergency usage patterns (data privacy compliance metric).
