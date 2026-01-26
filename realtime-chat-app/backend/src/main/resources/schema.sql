-- PostgreSQL Schema for Realtime Chat Application with CRM

-- Create USERS table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(100),
    profile_picture TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    enabled BOOLEAN DEFAULT true,
    online BOOLEAN DEFAULT false,
    last_active TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create ROLES table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true
);

-- Create USER_ROLES join table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Create GROUPS table
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_picture TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    max_members INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Create GROUP_MEMBERS join table
CREATE TABLE IF NOT EXISTS group_members (
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- Create MESSAGES table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    receiver_id BIGINT REFERENCES users(id),
    group_id BIGINT REFERENCES groups(id),
    message_type VARCHAR(50) DEFAULT 'TEXT',
    status VARCHAR(50) DEFAULT 'SENT',
    attachment_url TEXT,
    sent_at TIMESTAMP NOT NULL,
    edited_at TIMESTAMP
);

-- Create INTERACTIONS table (for CRM)
CREATE TABLE IF NOT EXISTS interactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    notes TEXT NOT NULL,
    outcome VARCHAR(255),
    interaction_date TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

-- Create OPPORTUNITIES table (for CRM)
CREATE TABLE IF NOT EXISTS opportunities (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    owner_id BIGINT NOT NULL REFERENCES users(id),
    description TEXT,
    value DECIMAL(15, 2),
    actual_value DECIMAL(15, 2),
    stage VARCHAR(50) DEFAULT 'NEW',
    probability INTEGER DEFAULT 0,
    expected_close_date TIMESTAMP,
    lost_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date);
CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Insert default roles
INSERT INTO roles (name, description, active) VALUES 
('ROLE_ADMIN', 'Administrator with full access', true),
('ROLE_SALES_REP', 'Sales representative for CRM', true),
('ROLE_USER', 'Regular user', true)
ON CONFLICT (name) DO NOTHING;
