-- Combined and modified database setup script for NAY'S CAKE
-- Merged from all .sql files in the /scripts directory.
-- Changes requested:
-- 1. Original 'transactions' (inventory log) table removed.
-- 2. 'customer_transactions' table renamed to 'transactions'.
-- 3. Inventory logging from 'complete_transaction' function removed.

-- ------------------------------------------------------------------
-- 📉 Drop existing objects for a clean setup
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS authenticate_user(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_user_password(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_daily_report() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_daily_report() CASCADE;
DROP FUNCTION IF EXISTS create_transaction_with_stock_update(BIGINT, VARCHAR, VARCHAR, INTEGER, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_transaction_total(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS add_transaction_item(BIGINT, BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS complete_customer_transaction(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS complete_transaction(BIGINT) CASCADE;

DROP TABLE IF EXISTS transaction_details CASCADE;
DROP TABLE IF EXISTS customer_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ------------------------------------------------------------------
-- 🏗️ Create Tables
-- ------------------------------------------------------------------

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

-- Create transactions table (renamed from customer_transactions)
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_details table
CREATE TABLE transaction_details (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (product_price * quantity) STORED,
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

-- ------------------------------------------------------------------
-- ⚡ Create Indexes for Performance
-- ------------------------------------------------------------------
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_current_stock ON products(current_stock);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_details_transaction_id ON transaction_details(transaction_id);
CREATE INDEX idx_transaction_details_product_id ON transaction_details(product_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- ------------------------------------------------------------------
-- ⚙️ Create Functions and Triggers
-- ------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE(user_id BIGINT, username VARCHAR, full_name VARCHAR, role VARCHAR, is_active BOOLEAN) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.full_name, u.role, u.is_active
    FROM users u
    WHERE u.username = p_username AND u.password_hash = p_password AND u.is_active = true;
    
    UPDATE users SET last_login = NOW() WHERE users.username = p_username AND users.is_active = true;
END;
$$;

-- Function to calculate and update transaction total (patched version)
CREATE OR REPLACE FUNCTION update_transaction_total(p_transaction_id BIGINT)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql AS $$
DECLARE
    v_new_total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(td.subtotal), 0)
      INTO v_new_total
      FROM transaction_details AS td
     WHERE td.transaction_id = p_transaction_id;

    UPDATE transactions AS t
       SET total_price = v_new_total
     WHERE t.id = p_transaction_id;

    RETURN v_new_total;
END;
$$;

-- Function to add item to transaction (patched version)
CREATE OR REPLACE FUNCTION add_transaction_item(
    p_transaction_id BIGINT,
    p_product_id     BIGINT,
    p_quantity       INTEGER
)
RETURNS TABLE(
    out_detail_id     BIGINT,
    out_transaction_id BIGINT,
    out_product_id     BIGINT,
    out_product_name   VARCHAR,
    out_product_price  DECIMAL,
    out_quantity       INTEGER,
    out_subtotal       DECIMAL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_product_name   VARCHAR(255);
    v_product_price  DECIMAL(10,2);
    v_current_stock  INTEGER;
    v_detail_id      BIGINT;
BEGIN
    SELECT p.name, p.price, p.current_stock
      INTO v_product_name, v_product_price, v_current_stock
      FROM products AS p
     WHERE p.id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', p_product_id;
    END IF;

    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;

    IF EXISTS (
        SELECT 1 FROM transaction_details AS td
         WHERE td.transaction_id = p_transaction_id AND td.product_id = p_product_id
    ) THEN
        UPDATE transaction_details AS td
           SET quantity = td.quantity + p_quantity
         WHERE td.transaction_id = p_transaction_id AND td.product_id = p_product_id
        RETURNING td.id INTO v_detail_id;
    ELSE
        INSERT INTO transaction_details (transaction_id, product_id, product_name, product_price, quantity)
        VALUES (p_transaction_id, p_product_id, v_product_name, v_product_price, p_quantity)
        RETURNING id INTO v_detail_id;
    END IF;

    PERFORM update_transaction_total(p_transaction_id);

    RETURN QUERY
    SELECT td.id, td.transaction_id, td.product_id, td.product_name, td.product_price, td.quantity, td.subtotal
      FROM transaction_details AS td
     WHERE td.id = v_detail_id;
END;
$$;

-- Function to complete transaction (reduce stock)
CREATE OR REPLACE FUNCTION complete_transaction(p_transaction_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
    detail_record RECORD;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id AND status = 'pending') THEN
        RAISE EXCEPTION 'Transaction not found or not pending';
    END IF;
    
    FOR detail_record IN 
        SELECT product_id, quantity 
        FROM transaction_details 
        WHERE transaction_id = p_transaction_id
    LOOP
        UPDATE products 
        SET current_stock = current_stock - detail_record.quantity
        WHERE id = detail_record.product_id;
    END LOOP;
    
    UPDATE transactions
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RETURN true;
END;
$$;

-- ------------------------------------------------------------------
-- 🔒 Enable Row Level Security (RLS) and Policies
-- ------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_details" ON transaction_details FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_reports" ON daily_reports FOR ALL USING (true);

-- ------------------------------------------------------------------
-- 💾 Insert Sample Data
-- ------------------------------------------------------------------

-- Insert default users
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
INSERT INTO transactions (user_id, customer_name, customer_phone, status, notes) VALUES
(1, 'Ibu Sari', '081234567890', 'completed', 'Pesanan untuk acara keluarga'),
(1, 'Pak Budi', '081234567891', 'completed', 'Pesanan reguler'),
(2, 'Ibu Maya', '081234567892', 'pending', 'Pesanan untuk arisan');

-- Insert sample transaction details
INSERT INTO transaction_details (transaction_id, product_id, product_name, product_price, quantity) VALUES
(1, 1, 'Dadar Gulung', 1000, 5),
(1, 2, 'Pastel', 1000, 3),
(1, 6, 'Bacang', 5000, 1),
(1, 9, 'Onde-onde', 1500, 2),
(2, 3, 'Risoles', 1000, 4),
(2, 5, 'Donat', 1000, 4),
(3, 4, 'Lemper', 1000, 6),
(3, 8, 'Kue Lapis', 1000, 6);

-- Update totals for sample transactions
SELECT update_transaction_total(1);
SELECT update_transaction_total(2);
SELECT update_transaction_total(3);

-- Create initial daily report
INSERT INTO daily_reports (report_date, total_stock, total_sales, total_value, low_stock_items)
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

-- ------------------------------------------------------------------
-- ✅ Verification
-- ------------------------------------------------------------------
SELECT 'Database setup completed successfully!' as message;
SELECT 'Users created:' as info, COUNT(*) as count FROM users;
SELECT 'Products created:' as info, COUNT(*) as count FROM products;
SELECT 'Transactions created:' as info, COUNT(*) as count FROM transactions;
SELECT 'Transaction Details created:' as info, COUNT(*) as count FROM transaction_details;
SELECT 'Daily Report created:' as info, report_date FROM daily_reports;
