# Database Setup Guide for Realtime Chat App

## Prerequisites
- PostgreSQL 15+ installed and running
- psql command-line tool available
- Database credentials: 
  - Username: `postgres`
  - Password: `Neet2006@`

## Step 1: Create Database
Open PowerShell and run:

```powershell
psql -U postgres -c "CREATE DATABASE chatapp;"
```

If prompted for password, enter: `Neet2006@`

## Step 2: Execute Schema
Navigate to the backend folder and run:

```powershell
cd "D:\Internship project\realtime-chat-app\backend"
psql -U postgres -d chatapp -f "src/main/resources/schema.sql"
```

## Step 3: Verify Tables Created
Run this command to list all tables:

```powershell
psql -U postgres -d chatapp -c "\dt"
```

You should see:
```
          List of relations
 Schema |      Name       | Type  | Owner
--------+-----------------+-------+----------
 public | group_members   | table | postgres
 public | groups          | table | postgres
 public | interactions    | table | postgres
 public | messages        | table | postgres
 public | opportunities   | table | postgres
 public | roles           | table | postgres
 public | user_roles      | table | postgres
 public | users           | table | postgres
```

## Step 4: Start the Application
Once database is ready:

```powershell
cd backend
mvn spring-boot:run
```

App will be available at: **http://localhost:8080/**
API will be available at: **http://localhost:8080/api/**

## Troubleshooting

### Error: "database 'chatapp' does not exist"
Solution: Create the database first (Step 1)

### Error: "ERROR: relation 'users' already exists"
Solution: The tables are already created, you can skip Step 2

### Error: "no primary key for referenced table 'users'"
Solution: This happens if schema.sql wasn't executed. Re-run Step 2

### Cannot connect to PostgreSQL
- Check if PostgreSQL service is running
- Verify credentials are correct
- Check if port 5432 is accessible

## Reset Database (if needed)
To completely reset the database:

```powershell
psql -U postgres -c "DROP DATABASE IF EXISTS chatapp;"
psql -U postgres -c "CREATE DATABASE chatapp;"
psql -U postgres -d chatapp -f "src/main/resources/schema.sql"
```

## Insert Sample Data (Optional)
To insert test user data:

```powershell
psql -U postgres -d chatapp -c "
INSERT INTO users (username, email, password, first_name, last_name, status, enabled) 
VALUES 
('admin', 'admin@chatapp.com', 'password123', 'Admin', 'User', 'ACTIVE', true),
('user1', 'user1@chatapp.com', 'password123', 'John', 'Doe', 'ACTIVE', true),
('user2', 'user2@chatapp.com', 'password123', 'Jane', 'Smith', 'ACTIVE', true)
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;
"
```

## Next Steps
1. ✅ Database created and schema initialized
2. ✅ Application compiled and running
3. ⏳ Access GUI at http://localhost:8080/
4. ⏳ Test API endpoints
5. ⏳ Create frontend functionality
