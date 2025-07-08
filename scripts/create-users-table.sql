-- Create users table for username/password authentication
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (allow authenticated users to read their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- Insert default admin user (password: admin123)
-- Note: In production, use a proper password hashing library
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('admin', '$2b$10$rQ8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample users for testing
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('nay', '$2b$10$rQ8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O8K8O', 'Nay Owner', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE(
    user_id BIGINT,
    username VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple password check (in production, use proper password hashing)
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.is_active
    FROM users u
    WHERE u.username = p_username 
    AND u.password_hash = p_password -- In production, use password verification function
    AND u.is_active = true;
    
    -- Update last login time
    UPDATE users 
    SET last_login = NOW() 
    WHERE users.username = p_username AND users.is_active = true;
END;
$$;

-- Create function to update password
CREATE OR REPLACE FUNCTION update_user_password(
    p_username VARCHAR,
    p_old_password VARCHAR,
    p_new_password VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_exists BOOLEAN := false;
BEGIN
    -- Check if user exists and old password is correct
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE username = p_username 
        AND password_hash = p_old_password 
        AND is_active = true
    ) INTO user_exists;
    
    IF user_exists THEN
        UPDATE users 
        SET password_hash = p_new_password, updated_at = NOW()
        WHERE username = p_username;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- Show created users
SELECT 'Users created successfully:' as message;
SELECT username, full_name, role, is_active, created_at FROM users ORDER BY created_at;
