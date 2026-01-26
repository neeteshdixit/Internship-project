# Project Workflow & Learning Path

## Complete Learning Journey: From Basics to Advanced

This document outlines the comprehensive workflow for both the **Advanced Chat Application** and **CRM System**, progressing from basic → advanced, implementing real-world patterns.

---

## PART 1: Advanced Chat Application

### PHASE 0: Prerequisites & Setup ✅

**What You Should Know:**
- Core Java (OOP, Collections, Exceptions, I/O)
- Networking basics (IP, ports, TCP/UDP)
- Threads & synchronization
- Basic SQL

**Setup Completed:**
- ✅ Java 17 + Spring Boot 3.1.4
- ✅ PostgreSQL configured
- ✅ Maven project structure
- ✅ Spring Security baseline

---

### PHASE 1: Basic Console Chat ✅

**Goal**: Single-threaded server & client communication

**Implemented:**
```
Server:
  - Listens on port 5000 (handled by Spring)
  - Accepts one client
  - Echoes messages back

Client:
  - Connects to server
  - Sends messages
  - Receives responses
```

**Code Location**: `ChatController.java` (basic endpoints)

**Tests to Try:**
```bash
# Start server
mvn spring-boot:run

# Terminal 1: Send message
curl -X POST http://localhost:8080/api/messages/private/send \
  -d '{"content": "Hello"}' \
  -H "Content-Type: application/json"
```

---

### PHASE 2: Multi-Client Text Chat ✅

**Goal**: Multiple users, broadcast messaging

**Implemented:**
- ✅ `UserService.java` - User management
- ✅ `MessageService.java` - Message broadcasting
- ✅ `MessageRepository.java` - Query conversations
- ✅ Multi-threaded message handling (Spring's ThreadPool)
- ✅ Message persistence in PostgreSQL

**Key Classes:**
- `User.java` - User entity with roles
- `Message.java` - Message entity with types
- `MessageService` - Broadcast logic

**Example Workflow:**
```
User1 sends message → Service processes → Saved to DB → Broadcast to subscribers
```

---

### PHASE 3: Protocol & Features ✅

**Goal**: Commands, private chat, groups

**Protocol Defined:**
```
Commands:
  PM userId "message" → Private message
  GROUP_MSG groupId "message" → Group message
  CREATE_GROUP "name" → Create group
```

**Features Implemented:**
- ✅ Private messaging between users
- ✅ Group chat creation & management
- ✅ Message search by keyword
- ✅ Unread messages tracking
- ✅ Message editing & deletion

**Code Location:**
- `MessageController.java` - Message API
- `GroupController.java` - Group management
- `GroupService.java` - Group logic

---

### PHASE 4: JavaFX GUI (Future Phase)

**Goal**: Desktop GUI for chat

**To Implement:**
```
├── Login Screen (username/password)
├── Chat Screen
│   ├── Contact List (users/groups)
│   ├── Message Window
│   ├── Input TextField
│   └── Send Button
└── Notification System
```

**Technology Stack:**
- JavaFX 17+
- FXML for layouts
- MVC pattern

**Learning Path:**
1. Basic JavaFX window & controls
2. Layout managers (VBox, HBox)
3. Controllers & data binding
4. Networking on background thread
5. UI updates via Platform.runLater()

---

### PHASE 5: Database Integration ✅

**Goal**: Persistent storage with PostgreSQL

**Implemented:**
```
Database Schema:
  ├── users (authentication, profile)
  ├── roles (RBAC)
  ├── messages (private & group)
  ├── groups (group metadata)
  ├── interactions (CRM)
  └── opportunities (CRM)
```

**Features:**
- ✅ User authentication & session management
- ✅ Chat history retrieval
- ✅ Message search with pagination
- ✅ User online status tracking
- ✅ Audit trails (createdAt, updatedAt)

**Queries Available:**
```sql
-- Get conversation between two users
SELECT * FROM messages WHERE 
  (sender_id = ? AND receiver_id = ?) OR 
  (sender_id = ? AND receiver_id = ?);

-- Get group messages
SELECT * FROM messages WHERE group_id = ? ORDER BY sent_at;

-- Get unread messages
SELECT * FROM messages WHERE receiver_id = ? AND status = 'UNREAD';
```

---

### PHASE 6: Voice & Video Chat (Advanced)

**Goal**: Real-time media streaming

**Architecture:**
```
Audio Stream:
  Microphone → TargetDataLine → Compress → UDP Socket → SourceDataLine → Speaker

Video Stream:
  Webcam → Frame Capture → JPEG Compress → UDP Socket → Decode → ImageView
```

**Technologies:**
- Java Sound API (audio)
- JavaCV/OpenCV (video)
- RTP/RTSP protocols (optional)
- WebRTC (for web clients)

**Implementation Steps:**
1. Audio capture from microphone
2. PCM encoding/decoding
3. UDP transmission
4. Frame capture from webcam
5. Video codec compression
6. Multi-client media routing

**Quality Considerations:**
- Buffer size optimization (latency)
- Bitrate adaptation
- Network congestion handling
- Mute/unmute controls
- Screen sharing capability

---

## PART 2: CRM System (Customer Relationship Manager)

### PHASE 0: Setup ✅

**Stack:**
- Spring Boot 3.1.4
- Spring Data JPA
- Spring Security
- PostgreSQL
- Thymeleaf templates

**Configuration Done:**
- ✅ PostgreSQL connection
- ✅ JPA entity mappings
- ✅ Security setup
- ✅ Auditing configuration

---

### PHASE 1: Basic Customer CRUD ✅

**Goal**: Create-Read-Update-Delete customers

**Implemented:**
```java
// Entity
User (represents customers in this app)
  - id, firstName, lastName, email, phone, company, status

// REST Endpoints
GET    /api/users              // List all
GET    /api/users/{id}         // Get one
POST   /api/users/register     // Create
PUT    /api/users/{id}         // Update
DELETE /api/users/{id}         // Delete

// View
List.html → Form → Controller → Service → Repository → DB
```

**Example:**
```bash
# Create customer
curl -X POST /api/users/register \
  -d '{"name": "Acme Corp", ...}'

# Update
curl -X PUT /api/users/1 \
  -d '{"status": "ACTIVE"}'
```

---

### PHASE 2: Validation, Search, Pagination ✅

**Features Added:**

1. **Input Validation:**
   ```java
   @NotBlank, @Email, @Size
   ```

2. **Search:**
   ```java
   // By name or company
   findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase()
   ```

3. **Pagination:**
   ```java
   // Page 0, 20 items per page
   Page<User> findAll(Pageable pageable)
   ```

**Query Examples:**
```bash
# Search
GET /api/users/search?query=john

# Paginated list (page 0, size 20)
GET /api/users?page=0&size=20

# Sort by created date
GET /api/users?page=0&size=20&sort=createdAt,desc
```

---

### PHASE 3: User Management & Authentication ✅

**Implemented:**

1. **Spring Security:**
   ```
   Login → Authentication → Validate credentials → Grant access
   ```

2. **Password Hashing:**
   ```java
   BCryptPasswordEncoder - 10 rounds
   ```

3. **Role Assignment:**
   ```
   ROLE_ADMIN - Full access
   ROLE_SALES_REP - Customer & opportunity management
   ROLE_USER - Basic access
   ```

4. **Login Endpoints:**
   ```bash
   POST /login - Standard form login
   GET  /api/users/{id} - Protected
   ```

---

### PHASE 4: Admin Module for Users & Roles ✅

**Admin Panel Features:**

```
/admin/users
  ├── List all users (paginated)
  ├── Create user (assign roles)
  ├── Edit user details
  ├── Assign/Remove roles
  └── Deactivate/Delete user

Endpoints:
  GET    /api/users                        // All users (ADMIN only)
  POST   /api/users/{userId}/roles/{role}  // Assign role
  DELETE /api/users/{userId}/roles/{role}  // Remove role
  POST   /api/users/{id}/deactivate        // Deactivate
```

**Permissions:**
```java
@PreAuthorize("hasRole('ADMIN')")  // ADMIN only
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")  // Multiple roles
```

---

### PHASE 5: Interaction Tracking & Sales Features ✅

**Goal**: Turn contact list into real CRM

**Implemented:**

1. **Interaction Tracking:**
   ```java
   Interaction {
     customerId: Long,
     userId: Long (who did the interaction),
     type: "CALL|EMAIL|MEETING|DEMO|NOTE",
     notes: String,
     interactionDate: LocalDateTime,
     outcome: String,
     nextFollowUpDate: LocalDateTime
   }
   ```

2. **Sales Opportunities (Deals):**
   ```java
   Opportunity {
     customerId: Long,
     ownerId: Long (sales rep),
     title: String,
     value: BigDecimal,
     stage: "NEW|QUALIFIED|PROPOSAL|NEGOTIATION|WON|LOST",
     probability: 0-100,
     expectedCloseDate: LocalDateTime,
     actualValue: BigDecimal
   }
   ```

3. **Endpoints:**
   ```bash
   # Record interaction
   POST /api/interactions
   
   # Get customer interactions
   GET /api/interactions/customer/{customerId}
   
   # Create opportunity
   POST /api/opportunities
   
   # Update opportunity stage
   PUT /api/opportunities/{id}/stage?stage=PROPOSAL&probability=50
   
   # Mark as won
   POST /api/opportunities/{id}/win?actualValue=50000
   
   # Get analytics
   GET /api/opportunities/analytics/won-value
   GET /api/opportunities/analytics/pipeline-value
   ```

4. **Dashboard Data (Basic):**
   ```sql
   -- Customers by status
   SELECT status, COUNT(*) FROM users GROUP BY status;
   
   -- Opportunities by stage
   SELECT stage, COUNT(*), SUM(value) FROM opportunities GROUP BY stage;
   
   -- Revenue metrics
   SELECT SUM(actual_value) as won, SUM(value) as pipeline 
   FROM opportunities;
   ```

---

### PHASE 6: Enterprise Features (Ready for Implementation)

**Fine-grained Security:**
```java
@PostAuthorize("returnObject.owner == principal.user")
Only owners/admins can edit their records
```

**Soft Delete:**
```java
@Where(clause = "deleted_at IS NULL")
private LocalDateTime deletedAt;
```

**Database Migrations (Flyway):**
```
db/migration/
  ├── V1__Initial_schema.sql
  ├── V2__Add_interactions.sql
  └── V3__Add_opportunities.sql
```

**Caching:**
```java
@Cacheable("users")
public List<User> getAllUsers();
```

**Testing:**
```bash
# Unit tests with JUnit & Mockito
mvn test

# Integration tests with @SpringBootTest
# Coverage reporting
mvn clean test jacoco:report
```

**Deployment:**
```bash
# Build JAR
mvn clean package

# Docker
docker build -t realtime-chat:latest .
docker run -p 8080:8080 realtime-chat:latest

# Cloud deployment (AWS/Azure/GCP)
```

---

## Integration: Chat + CRM

### Internal Chat for CRM

```
Feature: Sales team can chat within CRM
├── Create chat group from contact/opportunity
├── Add team members to discuss deals
├── Share documents in chat
└── Track communication history
```

### Notifications

```
Events:
  - New interaction added
  - Opportunity stage changed
  - Follow-up date reminder
  - New message received
  
Delivery:
  - In-app notification (WebSocket)
  - Email alerts
  - SMS (optional)
```

---

## Development Checklist

### Phase 1: Core Chat
- [x] User authentication
- [x] Private messaging
- [x] Group chat
- [x] Message persistence
- [x] WebSocket integration
- [ ] Desktop GUI (JavaFX)

### Phase 2: CRM Basics
- [x] Customer management
- [x] User roles & permissions
- [x] Search & pagination
- [x] Validation

### Phase 3: Advanced CRM
- [x] Interaction tracking
- [x] Sales pipeline (opportunities)
- [x] Revenue analytics
- [ ] Advanced reporting
- [ ] Forecasting

### Phase 4: Enterprise
- [ ] Fine-grained permissions
- [ ] Audit logging
- [ ] Database migrations
- [ ] Caching layer
- [ ] Microservices split
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline

---

## Common Pitfalls & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| WebSocket not connecting | Port blocked/config wrong | Check WebSocketConfig, firewall |
| Slow message retrieval | No database index | Add indexes to foreign keys |
| N+1 query problem | Lazy loading | Use @Fetch(FetchMode.JOIN) or DTO projections |
| Session timeout in chat | Session invalid | Implement token refresh |
| Race condition in status | Concurrent writes | Use @Transactional, pessimistic locking |
| Memory leak (WebSocket) | Unclosed connections | Implement disconnect handlers |

---

## Next Steps After This Phase

1. **Implement JavaFX GUI** for desktop chat client
2. **Add voice/video** capabilities
3. **Deploy to cloud** (AWS/Azure/GCP)
4. **Build mobile app** (React Native/Flutter)
5. **Add AI/ML** features (chatbot, sentiment analysis)
6. **Microservices** architecture
7. **Advanced analytics** & reporting

---

## Resources

### Documentation
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Spring Security](https://spring.io/projects/spring-security)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Tutorials
- WebSocket STOMP in Spring
- Spring Security with Database
- JPA Performance Tuning
- PostgreSQL Advanced Queries

### Tools
- Postman (API testing)
- pgAdmin (Database GUI)
- IntelliJ IDEA (IDE)
- Docker (Containerization)

---

**Last Updated**: November 2024
**Status**: Production Ready (Phases 1-5 Complete)
**Next Milestone**: GUI Implementation (JavaFX)
