# 🚀 Quick Start Guide

**Get the application running in 5 minutes!**

---

## Prerequisites

- ✅ Java 17+ installed
- ✅ PostgreSQL installed and running
- ✅ Maven installed
- ✅ Git (optional)

---

## Step 1: Setup PostgreSQL (2 minutes)

### Windows/Mac/Linux

```bash
# Open PostgreSQL client or GUI (pgAdmin)
# Execute these commands:

CREATE DATABASE realtime_chat_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE realtime_chat_db TO postgres;
```

**Verify Connection:**
```bash
psql -U postgres -d realtime_chat_db
```

---

## Step 2: Update Configuration (1 minute)

Edit: `backend/src/main/resources/application.properties`

```properties
# Make sure these are set:
spring.datasource.url=jdbc:postgresql://localhost:5432/realtime_chat_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
```

---

## Step 3: Build Project (1 minute)

```bash
# Navigate to backend folder
cd backend

# Clean and build
mvn clean install
```

---

## Step 4: Run Application (1 minute)

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using JAR
java -jar target/realtime-chat-backend-1.0.0.jar
```

**Expected Output:**
```
INFO ... Started RealtimeChatApp in 5.234 seconds
```

✅ **Application running on http://localhost:8080**

---

## Step 5: Test the API (Quick Verification)

### Register a User

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@company.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "company": "TechCorp"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "ACTIVE",
  "enabled": true,
  "roles": [{"id": 3, "name": "ROLE_USER"}]
}
```

### Register Another User

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_smith",
    "email": "jane@company.com",
    "password": "SecurePass456!",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Send a Private Message

```bash
curl -X POST "http://localhost:8080/api/messages/private/send?receiverId=2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic am9obl9kb2U6U2VjdXJlUGFzczEyMyE=" \
  -d '{
    "content": "Hey Jane! How are you?"
  }'
```

### Get Conversation

```bash
curl -X GET "http://localhost:8080/api/messages/private/2?page=0&size=20" \
  -H "Authorization: Basic am9obl9kb2U6U2VjdXJlUGFzczEyMyE="
```

---

## Common Issues & Solutions

### Issue: PostgreSQL Connection Error
```
Error: Unable to acquire JDBC Connection
```
**Solution:**
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check credentials in `application.properties`
3. Verify database exists: `\l` in psql

### Issue: Port 8080 Already in Use
```
Error: Address already in use
```
**Solution:**
```bash
# Change port in application.properties
server.port=8081
```

### Issue: Maven Build Failure
```
Error: Could not find goal 'spring-boot:run'
```
**Solution:**
```bash
# Update Maven
mvn --version
# Rebuild
mvn clean install -U
```

### Issue: Lombok Compilation Error
```
Error: Can't initialize javac processor
```
**Solution:**
```bash
mvn clean compile
# Or restart IDE
```

---

## API Endpoints Summary

### Users
```
POST   /api/users/register                Register
GET    /api/users/{id}                    Get user
GET    /api/users/online                  Online users
GET    /api/users/active                  Active users
GET    /api/users/search?query=john       Search
```

### Messages
```
POST   /api/messages/private/send         Send message
GET    /api/messages/private/{userId}     Get conversation
GET    /api/messages/unread               Unread
PUT    /api/messages/{id}/read            Mark read
DELETE /api/messages/{id}                 Delete
```

### Groups
```
POST   /api/groups                        Create
GET    /api/groups/{id}                   Get
GET    /api/groups/user/my-groups         My groups
```

### CRM
```
POST   /api/interactions                  Record interaction
POST   /api/opportunities                 Create opportunity
GET    /api/opportunities/analytics/won-value    Revenue
```

---

## Test with Postman (Advanced)

1. **Import Collection:**
   - Open Postman
   - File → Import
   - Paste this URL: (Collection can be created from endpoints above)

2. **Setup Variables:**
   - Add environment variable: `base_url` = `http://localhost:8080`
   - Add environment variable: `token` = (get from login response)

3. **Test Workflow:**
   - Register user 1
   - Register user 2
   - User 1 sends message to User 2
   - Get conversation
   - Create group
   - Add member to group

---

## Database Verification

### Connect to Database

```bash
psql -U postgres -d realtime_chat_db
```

### Check Tables

```sql
-- List all tables
\dt

-- View users
SELECT id, username, email, status FROM users;

-- View messages
SELECT id, content, sender_id, receiver_id, sent_at FROM messages;

-- View groups
SELECT id, name, status FROM groups;
```

---

## Troubleshooting Commands

```bash
# Check if PostgreSQL is running
pg_isready

# Check Java version
java -version

# Check Maven version
mvn --version

# View application logs
tail -f target/application.log

# Kill process on port 8080 (if stuck)
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8080
kill -9 <PID>
```

---

## WebSocket Testing (Advanced)

Use Postman or online WebSocket client:

1. **Connect to:** `ws://localhost:8080/ws/chat`
2. **Subscribe to:** `/chat/messages`
3. **Send message:**
   ```json
   {
     "destination": "/app/send",
     "payload": {
       "content": "Hello!",
       "sender": {"id": 1},
       "receiver": {"id": 2}
     }
   }
   ```

---

## Next Steps

1. ✅ Verify application is running
2. ✅ Test API endpoints with curl/Postman
3. ✅ Create sample data
4. ✅ Read `DOCUMENTATION.md` for full API reference
5. ✅ Read `WORKFLOW.md` for learning path
6. 📖 Build frontend (HTML/JavaScript or JavaFX)
7. 🚀 Deploy to cloud (AWS/Azure/GCP)

---

## Performance Tips

- Keep database indexes: ✅ (already added)
- Use pagination for large datasets: ✅ (implemented)
- Cache frequently accessed data: (future enhancement)
- Monitor query performance: `spring.jpa.show-sql=true`

---

## Security Notes

- ⚠️ Change default PostgreSQL password in production
- ⚠️ Use HTTPS in production (not HTTP)
- ⚠️ Store passwords securely (use BCrypt) ✅ (implemented)
- ⚠️ Validate all inputs ✅ (implemented with annotations)
- ⚠️ Use environment variables for credentials (not hardcoded)

---

## Production Checklist

- [ ] Change database password
- [ ] Update `ddl-auto` to `validate` (not `update`)
- [ ] Enable HTTPS
- [ ] Setup logging & monitoring
- [ ] Configure backups
- [ ] Setup CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

---

## Help & Resources

- **Documentation**: See `DOCUMENTATION.md`
- **Workflow**: See `WORKFLOW.md`
- **Summary**: See `IMPLEMENTATION_SUMMARY.md`
- **Spring Boot**: https://spring.io/projects/spring-boot
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Enjoy! Happy coding! 🎉**

---

*Last Updated: November 2024*  
*Status: ✅ Ready to Run*
