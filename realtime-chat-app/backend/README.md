# Setu Connect - Backend

This is the backend component of **Setu Connect**, an enterprise-grade, privacy-first real-time messaging platform. It is built using Java 17 and Spring Boot 3.3.0.

## 🚀 Tech Stack

- **Framework:** Spring Boot 3.3.0
- **Language:** Java 17
- **Database:** PostgreSQL (with Spring Data JPA / Hibernate)
- **Security:** Spring Security + stateless JWT (jjwt) Authentication
- **Real-Time Engine:** Spring WebSocket (STOMP) + SockJS
- **AI Integration:** Spring AI with Ollama integration (Local) and direct REST integration with Google Gemini 1.5 Flash.

## 📦 Key Features

- **JWT Authentication:** Secure stateless authentication and authorization.
- **Real-Time WebSocket Broker:** STOMP protocol over WebSockets for instant message delivery, read receipts, typing indicators, and WebRTC signaling.
- **Multi-Tier AI Subsystem:** A sophisticated cascade mechanism (`AiProviderManager`) falling back from Device AI to Local Ollama and finally to Google Gemini Cloud API.
- **Data Persistence:** Automatic database schemas configured via Hibernate ORM (`ddl-auto=update`).
- **Advanced Features:** Scheduled messages, Vanish Mode (auto-delete), Emergency Panic Wipe, and Call session logging.
- **REST APIs:** Exposes robust HTTP endpoints for user management, analytics, statuses, media uploads, and AI inferences.

## 🛠️ Setup Instructions

1. **Prerequisites:**
   - Java JDK 17 or higher
   - Maven (or use the included `./mvnw` wrapper)
   - PostgreSQL Server running locally or remotely

2. **Configuration:**
   Update the database properties and AI settings in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/chatapp}
   spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
   spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:yourpassword}
   
   # Optional: Configure your Gemini API key (or set as environment variable)
   # GEMINI_API_KEY=your-api-key
   ```

3. **Build and Run:**
   ```bash
   ./mvnw clean spring-boot:run
   ```
   The application will start on `http://localhost:8081` (configurable via the `PORT` environment variable).

## 📂 Architecture Overview

- `/config/`: Security filters, CORS configurations, and WebSocket STOMP setup.
- `/controller/`: Exposes REST endpoints (`/api/auth`, `/api/messages`, `/api/ai`, etc.).
- `/dto/`: Data Transfer Objects for handling request/response shapes.
- `/model/`: JPA Entities mapping to PostgreSQL tables (`User`, `Message`, `CallRecord`, etc.).
- `/repo/`: Spring Data JPA interfaces for database operations.
- `/security/`: JWT token provider and authentication filters.
- `/service/`: Core business logic, WebSocket presence (in-memory maps), and the `AiService` routing logic.

## 🔗 Links

- **Main Repository README:** [../../README.md](../../README.md)
- **Live Deployment:** [https://internship-project-mywr.onrender.com](https://internship-project-mywr.onrender.com)
