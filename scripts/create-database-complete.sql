-- Complete database setup for NAY'S CAKE inventory system
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS authenticate_user(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_user_password(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_daily_report() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_daily_report() CASCADE;
DROP FUNCTION IF EXISTS create_transaction_with_stock_update(BIGINT, VARCHAR, VARCHAR, INTEGER, TEXT, DATE) CASCADE;

-- Create products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 20,
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (current_stock * price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for authentication
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

-- Create transactions table
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('addition', 'reduction')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_reports table for analytics
CREATE TABLE daily_reports (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_stock INTEGER NOT NULL DEFAULT 0,
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    low_stock_items INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_date)
);

-- Create indexes for better performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_current_stock ON products(current_stock);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
    AND u.password_hash = p_password
    AND u.is_active = true;
    
    -- Update last login time
    UPDATE users 
    SET last_login = NOW() 
    WHERE users.username = p_username AND users.is_active = true;
END;
$$;

-- Create function for transaction with stock update
CREATE OR REPLACE FUNCTION create_transaction_with_stock_update(
    p_product_id BIGINT,
    p_product_name VARCHAR,
    p_type VARCHAR,
    p_quantity INTEGER,
    p_notes TEXT DEFAULT '',
    p_transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    transaction_id BIGINT,
    product_id BIGINT,
    product_name VARCHAR,
    type VARCHAR,
    quantity INTEGER,
    notes TEXT,
    transaction_date DATE,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
DECLARE
    new_transaction_id BIGINT;
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT products.current_stock INTO current_stock 
    FROM products 
    WHERE products.id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', p_product_id;
    END IF;
    
    -- Calculate new stock
    IF p_type = 'addition' THEN
        new_stock := current_stock + p_quantity;
    ELSIF p_type = 'reduction' THEN
        new_stock := GREATEST(0, current_stock - p_quantity);
    ELSE
        RAISE EXCEPTION 'Invalid transaction type: %', p_type;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET current_stock = new_stock 
    WHERE products.id = p_product_id;
    
    -- Insert transaction
    INSERT INTO transactions (product_id, product_name, type, quantity, notes, transaction_date)
    VALUES (p_product_id, p_product_name, p_type, p_quantity, p_notes, p_transaction_date)
    RETURNING transactions.id INTO new_transaction_id;
    
    -- Return the created transaction
    RETURN QUERY
    SELECT 
        t.id as transaction_id,
        t.product_id,
        t.product_name,
        t.type,
        t.quantity,
        t.notes,
        t.transaction_date,
        t.created_at
    FROM transactions t
    WHERE t.id = new_transaction_id;
END;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_reports" ON daily_reports FOR ALL USING (true);

-- Insert default users with simple password hash
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('admin', 'admin123', 'Administrator', 'admin'),
('nay', 'admin123', 'Nay Owner', 'admin'),
('kasir1', 'admin123', 'Kasir Satu', 'user'),
('kasir2', 'admin123', 'Kasir Dua', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, price, current_stock, min_stock) VALUES
('Dadar Gulung', 1000.00, 25, 20),
('Pastel', 1000.00, 43, 20),
('Risoles', 1000.00, 42, 20),
('Lemper', 1000.00, 55, 20),
('Donat', 1000.00, 43, 20),
('Bacang', 5000.00, 53, 20),
('Talam', 1000.00, 10, 20),
('Kue Lapis', 1000.00, 12, 20),
('Onde-onde', 1500.00, 30, 15),
('Klepon', 1200.00, 25, 15);

-- Insert sample transactions
INSERT INTO transactions (product_id, product_name, type, quantity, notes, transaction_date) VALUES
(1, 'Dadar Gulung', 'addition', 10, 'Stok baru diterima dari supplier', '2025-01-01'),
(2, 'Pastel', 'reduction', 5, 'Terjual ke pelanggan reguler', '2025-01-01'),
(3, 'Risoles', 'addition', 8, 'Produksi baru selesai', '2025-01-02'),
(4, 'Lemper', 'reduction', 3, 'Pesanan catering', '2025-01-02'),
(5, 'Donat', 'addition', 12, 'Stok tambahan untuk weekend', '2025-01-03');

-- Create initial daily report
INSERT INTO daily_reports (
    report_date,
    total_stock,
    total_sales,
    total_value,
    low_stock_items
)
SELECT 
    CURRENT_DATE,
    COALESCE(SUM(current_stock), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(current_stock * price), 0),
    COALESCE(SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END), 0)
FROM products
ON CONFLICT (report_date) 
DO UPDATE SET
    total_stock = EXCLUDED.total_stock,
    total_sales = EXCLUDED.total_sales,
    total_value = EXCLUDED.total_value,
    low_stock_items = EXCLUDED.low_stock_items;

-- Verify setup
SELECT 'Database setup completed successfully!' as message;
SELECT 'Users created:' as info, COUNT(*) as count FROM users;
SELECT 'Products created:' as info, COUNT(*) as count FROM products;
SELECT 'Transactions created:' as info, COUNT(*) as count FROM transactions;

-- Show sample data
SELECT 'Sample Users:' as info;
SELECT username, full_name, role, is_active FROM users;

SELECT 'Sample Products:' as info;
SELECT id, name, current_stock, min_stock, total_value FROM products LIMIT 5;
