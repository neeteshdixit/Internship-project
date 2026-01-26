# Advanced Realtime Chat Application with CRM - Complete Documentation

## Project Overview

This is a comprehensive Spring Boot 3.1.4 application combining:
- **Advanced Real-time Chat System** (WebSocket-based with STOMP)
- **CRM (Customer Relationship Management)** with PostgreSQL
- **User Management & Authentication** (Spring Security)
- **Multi-tenant group chat** and private messaging
- **Sales Pipeline Management** (Opportunities & Interactions)

---

## Architecture Overview

### Technology Stack

- **Backend**: Java 17, Spring Boot 3.1.4
- **Database**: PostgreSQL (replacing MySQL)
- **Security**: Spring Security with BCrypt password encoding
- **Real-time**: WebSocket with STOMP protocol
- **ORM**: Spring Data JPA with Hibernate
- **API**: RESTful with JSON payloads

### Project Structure

```
realtime-chat-app/
├── backend/
│   ├── src/main/
│   │   ├── java/com/chat/
│   │   │   ├── RealtimeChatApp.java (Main Application)
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebSocketConfig.java
│   │   │   │   ├── WebSocketInterceptor.java
│   │   │   │   └── AuditConfig.java
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Role.java
│   │   │   │   ├── Message.java
│   │   │   │   ├── Group.java
│   │   │   │   ├── Interaction.java
│   │   │   │   └── Opportunity.java
│   │   │   ├── repo/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── RoleRepository.java
│   │   │   │   ├── MessageRepository.java
│   │   │   │   ├── GroupRepository.java
│   │   │   │   ├── InteractionRepository.java
│   │   │   │   └── OpportunityRepository.java
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   ├── MessageService.java
│   │   │   │   ├── GroupService.java
│   │   │   │   ├── InteractionService.java
│   │   │   │   └── OpportunityService.java
│   │   │   └── controller/
│   │   │       ├── ChatController.java (REST + WebSocket)
│   │   │       ├── UserController.java
│   │   │       ├── GroupController.java
│   │   │       ├── InteractionController.java
│   │   │       └── OpportunityController.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── schema.sql
│   └── pom.xml
```

---

## Database Schema

### Core Entities

#### Users Table
- **Purpose**: User authentication and profile management
- **Key Fields**: id, username, email, password (hashed), firstName, lastName, phone, company, status, enabled, online, lastActive

#### Roles Table
- **Purpose**: Role-based access control (RBAC)
- **Default Roles**: ROLE_ADMIN, ROLE_SALES_REP, ROLE_USER

#### Messages Table
- **Purpose**: Chat messages for both private and group conversations
- **Key Fields**: id, content, senderId, receiverId (for private), groupId (for group), messageType, status, sentAt, editedAt

#### Groups Table
- **Purpose**: Group chat management
- **Key Fields**: id, name, description, createdBy, status, maxMembers

#### Interactions Table (CRM)
- **Purpose**: Track customer interactions (calls, emails, meetings)
- **Key Fields**: id, customerId, userId, type, notes, outcome, interactionDate, nextFollowUpDate

#### Opportunities Table (CRM)
- **Purpose**: Sales pipeline management
- **Key Fields**: id, title, customerId, ownerId, description, value, stage, probability, expectedCloseDate, lostReason

---

## Setup Instructions

### Prerequisites

1. **Java 17+** installed
2. **PostgreSQL** installed and running (default: localhost:5432)
3. **Maven** for building

### Step 1: PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE realtime_chat_db;

-- Create user
CREATE USER postgres WITH PASSWORD 'yourpassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE realtime_chat_db TO postgres;
```

### Step 2: Update application.properties

```properties
# PostgreSQL Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/realtime_chat_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### Step 3: Build & Run

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Or use JAR
java -jar target/realtime-chat-backend-1.0.0.jar
```

---

## API Endpoints

### Authentication & Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/users/register` | Register new user | No |
| GET | `/api/users/{id}` | Get user by ID | Yes |
| GET | `/api/users/online` | Get all online users | Yes |
| GET | `/api/users/active` | Get all active users | Yes |
| PUT | `/api/users/{id}` | Update user profile | Yes |
| POST | `/api/users/{id}/change-password` | Change password | Yes |
| POST | `/api/users/{id}/online` | Set online status | Yes |

### Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/messages/private/send` | Send private message | Yes |
| GET | `/api/messages/private/{userId}` | Get conversation | Yes |
| GET | `/api/messages/unread` | Get unread messages | Yes |
| PUT | `/api/messages/{id}/read` | Mark as read | Yes |
| PUT | `/api/messages/{id}/edit` | Edit message | Yes |
| DELETE | `/api/messages/{id}` | Delete message | Yes |
| GET | `/api/messages/search` | Search messages | Yes |

### Groups

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/groups` | Create group | Yes |
| GET | `/api/groups/{id}` | Get group details | Yes |
| GET | `/api/groups/user/my-groups` | Get user's groups | Yes |
| POST | `/api/groups/{id}/members/{userId}` | Add member | Yes |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove member | Yes |

### CRM - Interactions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/interactions` | Record interaction | Yes |
| GET | `/api/interactions/{id}` | Get interaction | Yes |
| GET | `/api/interactions/customer/{customerId}` | Get customer interactions | Yes |
| PUT | `/api/interactions/{id}` | Update interaction | Yes |
| POST | `/api/interactions/{id}/follow-up` | Set follow-up date | Yes |

### CRM - Opportunities

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/opportunities` | Create opportunity | Yes |
| GET | `/api/opportunities/{id}` | Get opportunity | Yes |
| GET | `/api/opportunities/customer/{customerId}` | Get customer opportunities | Yes |
| GET | `/api/opportunities/stage/{stage}` | Get by stage | Yes |
| POST | `/api/opportunities/{id}/win` | Mark as won | Yes |
| POST | `/api/opportunities/{id}/lose` | Mark as lost | Yes |
| GET | `/api/opportunities/analytics/won-value` | Total won value | Yes |
| GET | `/api/opportunities/analytics/pipeline-value` | Total pipeline value | Yes |

### WebSocket Endpoints

| Endpoint | Payload | Response | Purpose |
|----------|---------|----------|---------|
| `/app/send` | Message object | `/chat/messages` | Send & broadcast message |
| `/app/group/send` | Message object | `/chat/group/{groupId}` | Send group message |
| `/app/typing` | {userId, typing: bool} | `/chat/typing` | Typing indicator |

---

## Security Features

### Authentication Flow

1. User registers via `/api/users/register`
2. Password encoded with BCrypt
3. User logs in with credentials
4. Spring Security validates credentials
5. JWT/Session token generated

### Role-Based Access Control (RBAC)

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasRole('SALES_REP')")
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
```

---

## Key Features by Phase

### PHASE 1: Basic Console Chat (Foundation)
- [x] Multi-client text chat with multithreading
- [x] Message persistence in PostgreSQL
- [x] Broadcast messaging

### PHASE 2: Authentication & Roles
- [x] Spring Security integration
- [x] BCrypt password encoding
- [x] Role-based access control
- [x] User registration/login

### PHASE 3: Advanced Chat Features
- [x] Private messaging
- [x] Group chat
- [x] Message search
- [x] Unread messages
- [x] Typing indicators via WebSocket

### PHASE 4: Real-time WebSocket
- [x] STOMP protocol implementation
- [x] Real-time message delivery
- [x] User online status tracking
- [x] Connection monitoring

### PHASE 5: CRM Features
- [x] Customer management
- [x] Interaction tracking (calls, emails, meetings)
- [x] Sales opportunity pipeline
- [x] Deal stage management (New→Won/Lost)
- [x] Revenue analytics (won value, pipeline value)

### PHASE 6: Enterprise Features (Ready for Implementation)
- [ ] Fine-grained permissions
- [ ] Soft delete & audit trails
- [ ] Database migrations (Flyway)
- [ ] Caching (Redis)
- [ ] Unit & integration tests
- [ ] Cloud deployment configs

---

## WebSocket Configuration

### Connection Flow

```
Client → /ws/chat (CONNECT)
Server → WebSocketConfig registers endpoint
Server → WebSocketInterceptor logs connection
Client ↔ Server (STOMP communication)
```

### Message Routing

- **`/app/send`**: Client sends private message
- **`/chat/messages`**: Server broadcasts to subscribers
- **`/user/{userId}/queue/messages`**: Direct user message
- **`/chat/group/{groupId}`**: Group message broadcast

---

## Example Usage

### 1. Register User

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_sales",
    "email": "john@company.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "company": "TechCorp"
  }'
```

### 2. Create Group

```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Team",
    "description": "Q4 Sales Discussion"
  }'
```

### 3. Record Interaction

```bash
curl -X POST http://localhost:8080/api/interactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 2,
    "userId": 1,
    "type": "CALL",
    "notes": "Discussed pricing options"
  }'
```

### 4. Create Opportunity

```bash
curl -X POST http://localhost:8080/api/opportunities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 2,
    "ownerId": 1,
    "title": "Enterprise Contract",
    "value": 50000,
    "expectedCloseDate": "2024-03-31T23:59:59"
  }'
```

---

## Development Workflow

### Adding New Features

1. **Create Entity** in `model/`
2. **Create Repository** in `repo/`
3. **Create Service** in `service/` with business logic
4. **Create Controller** with REST endpoints
5. **Update schema.sql** if schema changes
6. **Write Unit Tests**

### Testing Locally

```bash
# Build
mvn clean package

# Run tests
mvn test

# Check for errors
mvn clean compile
```

---

## Future Enhancements (Phases 6+)

1. **Voice & Video Chat**: Media streaming over WebRTC
2. **File Sharing**: Attachment management with S3
3. **Notifications**: Push notifications & email alerts
4. **Mobile App**: React Native/Flutter app
5. **Analytics Dashboard**: Advanced CRM reporting
6. **AI Integration**: Chatbot & sentiment analysis
7. **Microservices**: Decompose into services
8. **Kubernetes Deployment**: Container orchestration

---

## Troubleshooting

### Database Connection Issues

```
Error: "Unable to acquire JDBC Connection"
Solution: Verify PostgreSQL is running and credentials in application.properties are correct
```

### WebSocket Connection Failed

```
Error: "Failed to establish WebSocket connection"
Solution: Check if /ws/chat endpoint is properly registered in WebSocketConfig
```

### Lombok Compilation Issues

```
Error: "Can't initialize javac processor"
Solution: Rebuild project: mvn clean install
```

---

## License

This project is provided as educational material for internship training.

## Support

For issues or questions, refer to Spring Boot documentation:
- https://spring.io/projects/spring-boot
- https://spring.io/projects/spring-security
- https://spring.io/projects/spring-data-jpa
