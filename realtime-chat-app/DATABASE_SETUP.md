# PostgreSQL Database Setup Guide

## Prerequisites

Before running the Realtime Chat Application, you need to set up PostgreSQL database.

## Installation

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the installation wizard
3. Remember the password you set for the `postgres` user
4. Default port is 5432

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

## Step 1: Create Database User and Database

### Option A: Using pgAdmin GUI
1. Open pgAdmin (comes with PostgreSQL)
2. Connect to local server
3. Right-click "Databases" → Create → Database
4. Name: `realtime_chat_db`
5. Owner: `postgres`
6. Click Save

### Option B: Using Command Line

```bash
# On Windows (using PostgreSQL command prompt):
createdb -U postgres realtime_chat_db

# On Linux/macOS:
sudo -u postgres createdb realtime_chat_db

# Or use psql:
psql -U postgres
# Then execute:
CREATE DATABASE realtime_chat_db;
\q
```

## Step 2: Initialize Database Schema

There are two approaches:

### Approach 1: Hibernate Auto-Create (Easiest)

Update `application.properties`:
```properties
spring.jpa.hibernate.ddl-auto=create
```

When you run the application first time, Hibernate will create all tables automatically.

**Then change it back to:**
```properties
spring.jpa.hibernate.ddl-auto=validate
```

### Approach 2: Use SQL Script (Recommended)

Run the provided schema.sql file:

```bash
# Windows (Command Prompt)
psql -U postgres -d realtime_chat_db -f "D:\Internship project\realtime-chat-app\backend\src\main\resources\schema.sql"

# Linux/macOS (Terminal)
psql -U postgres -d realtime_chat_db -f schema.sql
```

Or manually:
```bash
psql -U postgres -d realtime_chat_db
```

Then paste contents from `schema.sql` and execute.

## Step 3: Verify Database Connection

Test the connection:

```bash
psql -U postgres -d realtime_chat_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected output shows the number of tables created.

## Step 4: Update application.properties

File: `D:\Internship project\realtime-chat-app\backend\src\main\resources\application.properties`

Ensure these properties are set:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/realtime_chat_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver

# Hibernate Configuration
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Server Configuration
server.port=8080
server.servlet.context-path=/api
```

## Step 5: Run the Application

```bash
cd "D:\Internship project\realtime-chat-app\backend"
mvn clean spring-boot:run
```

Expected successful startup:
```
2025-11-25T21:01:16.416+05:30  INFO 27384 --- [main] com.chat.RealtimeChatApp : Starting RealtimeChatApp using Java 17.x
...
o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat initialized with port(s): 8080 (http)
...
Started RealtimeChatApp in 3.564 seconds (process running for 4.123)
```

## Database Schema

The application creates the following tables:

### Core Tables
- **users** - User accounts and profiles
- **roles** - Role definitions (ADMIN, SALES_REP, USER)
- **user_roles** - User-to-role mapping (ManyToMany)

### Chat Tables
- **groups** - Chat groups/channels
- **group_members** - Group membership (ManyToMany)
- **messages** - Chat messages (private and group)

### CRM Tables
- **interactions** - Customer interactions (calls, emails, meetings)
- **opportunities** - Sales opportunities and deals

### Indexes
Optimized indexes on:
- username (users)
- email (users)
- sender_id, receiver_id (messages)
- group_id (messages)
- created_at, updated_at (messages, groups)

## Default Roles

The schema creates three default roles:

```sql
INSERT INTO roles (name, description, active) VALUES
('ROLE_ADMIN', 'Administrator with full access', true),
('ROLE_SALES_REP', 'Sales representative role', true),
('ROLE_USER', 'Regular user role', true);
```

## Testing Database Connection

Create a test user:

```bash
psql -U postgres -d realtime_chat_db
```

```sql
-- Insert test user
INSERT INTO users (
    username, email, password, first_name, last_name, status, enabled, created_at, updated_at
) VALUES (
    'testuser',
    'test@example.com',
    '$2a$10$bWh4g8wLNKLlZzMQqsrwc.f76h0cVnRRFXs5kH2cDnfYZpCTQoLGW', -- BCrypt hash of 'password123'
    'Test',
    'User',
    'ACTIVE',
    true,
    NOW(),
    NOW()
);

-- Assign ROLE_USER to test user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'testuser' AND r.name = 'ROLE_USER';

-- Verify
SELECT * FROM users WHERE username = 'testuser';
```

## Backup and Restore

### Backup Database
```bash
# Windows
pg_dump -U postgres realtime_chat_db > backup.sql

# Linux/macOS
pg_dump -U postgres realtime_chat_db > backup.sql
```

### Restore Database
```bash
# First drop existing database (if needed)
dropdb -U postgres realtime_chat_db

# Create fresh database
createdb -U postgres realtime_chat_db

# Restore
psql -U postgres realtime_chat_db < backup.sql
```

## Common Issues and Solutions

### Issue: "FATAL: password authentication failed for user 'postgres'"
**Solution**: 
1. Check postgres user password in PostgreSQL configuration
2. Update password: 
   ```bash
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```
3. Restart PostgreSQL service

### Issue: "FATAL: database does not exist"
**Solution**: Create database first using steps above

### Issue: "Connection refused" - PostgreSQL service not running
**Solution**:
```bash
# Windows
net start PostgreSQL15  # or your version

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@15
```

### Issue: "Port 5432 already in use"
**Solution**: PostgreSQL instance already running or different port used
- Check running processes
- Update connection string in application.properties if using different port

## Useful PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d realtime_chat_db

# List all databases
\l

# Connect to specific database
\c realtime_chat_db

# List all tables
\dt

# Describe table structure
\d messages

# Execute SQL file
\i schema.sql

# Export query results
\COPY (SELECT * FROM users) TO 'users.csv' WITH CSV HEADER;

# Exit
\q
```

## Performance Tuning

### For Development (application.properties)
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

### For Production
```properties
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

## Next Steps

After database setup:
1. Run the application: `mvn spring-boot:run`
2. Access API at: `http://localhost:8080/api`
3. WebSocket endpoint: `ws://localhost:8080/api/ws/chat`
4. Refer to QUICK_START.md for API testing examples

---

**Last Updated**: 2025-11-25
