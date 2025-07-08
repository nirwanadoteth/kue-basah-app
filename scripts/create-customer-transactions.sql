-- Create customer transactions and transaction details tables
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS transaction_details CASCADE;
DROP TABLE IF EXISTS customer_transactions CASCADE;

-- Create customer_transactions table
CREATE TABLE customer_transactions (
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
    transaction_id BIGINT NOT NULL REFERENCES customer_transactions(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (product_price * quantity) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customer_transactions_user_id ON customer_transactions(user_id);
CREATE INDEX idx_customer_transactions_status ON customer_transactions(status);
CREATE INDEX idx_customer_transactions_created_at ON customer_transactions(created_at);
CREATE INDEX idx_transaction_details_transaction_id ON transaction_details(transaction_id);
CREATE INDEX idx_transaction_details_product_id ON transaction_details(product_id);

-- Create trigger for customer_transactions updated_at
CREATE TRIGGER update_customer_transactions_updated_at
    BEFORE UPDATE ON customer_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on customer_transactions" ON customer_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_details" ON transaction_details FOR ALL USING (true);

-- Create function to calculate and update transaction total
CREATE OR REPLACE FUNCTION update_transaction_total(p_transaction_id BIGINT)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    new_total DECIMAL(12,2);
BEGIN
    -- Calculate total from transaction details
    SELECT COALESCE(SUM(subtotal), 0) INTO new_total
    FROM transaction_details
    WHERE transaction_id = p_transaction_id;
    
    -- Update the customer transaction total
    UPDATE customer_transactions
    SET total_price = new_total, updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RETURN new_total;
END;
$$;

-- Create function to add item to transaction
CREATE OR REPLACE FUNCTION add_transaction_item(
    p_transaction_id BIGINT,
    p_product_id BIGINT,
    p_quantity INTEGER
)
RETURNS TABLE(
    detail_id BIGINT,
    transaction_id BIGINT,
    product_id BIGINT,
    product_name VARCHAR,
    product_price DECIMAL,
    quantity INTEGER,
    subtotal DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_name VARCHAR(255);
    v_product_price DECIMAL(10,2);
    v_current_stock INTEGER;
    new_detail_id BIGINT;
BEGIN
    -- Get product details and check stock
    SELECT name, price, current_stock INTO v_product_name, v_product_price, v_current_stock
    FROM products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', p_product_id;
    END IF;
    
    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;
    
    -- Check if item already exists in transaction
    IF EXISTS (SELECT 1 FROM transaction_details WHERE transaction_id = p_transaction_id AND product_id = p_product_id) THEN
        -- Update existing item
        UPDATE transaction_details
        SET quantity = quantity + p_quantity
        WHERE transaction_id = p_transaction_id AND product_id = p_product_id
        RETURNING id INTO new_detail_id;
    ELSE
        -- Insert new item
        INSERT INTO transaction_details (transaction_id, product_id, product_name, product_price, quantity)
        VALUES (p_transaction_id, p_product_id, v_product_name, v_product_price, p_quantity)
        RETURNING id INTO new_detail_id;
    END IF;
    
    -- Update transaction total
    PERFORM update_transaction_total(p_transaction_id);
    
    -- Return the transaction detail
    RETURN QUERY
    SELECT 
        td.id,
        td.transaction_id,
        td.product_id,
        td.product_name,
        td.product_price,
        td.quantity,
        td.subtotal
    FROM transaction_details td
    WHERE td.id = new_detail_id;
END;
$$;

-- Create function to complete transaction (reduce stock)
CREATE OR REPLACE FUNCTION complete_customer_transaction(p_transaction_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    detail_record RECORD;
BEGIN
    -- Check if transaction exists and is pending
    IF NOT EXISTS (SELECT 1 FROM customer_transactions WHERE id = p_transaction_id AND status = 'pending') THEN
        RAISE EXCEPTION 'Transaction not found or already completed';
    END IF;
    
    -- Reduce stock for each item in the transaction
    FOR detail_record IN 
        SELECT product_id, quantity 
        FROM transaction_details 
        WHERE transaction_id = p_transaction_id
    LOOP
        -- Update product stock
        UPDATE products 
        SET current_stock = current_stock - detail_record.quantity
        WHERE id = detail_record.product_id;
        
        -- Create inventory transaction record
        INSERT INTO transactions (product_id, product_name, type, quantity, notes, transaction_date)
        SELECT 
            detail_record.product_id,
            p.name,
            'reduction',
            detail_record.quantity,
            'Customer purchase - Transaction #' || p_transaction_id,
            CURRENT_DATE
        FROM products p
        WHERE p.id = detail_record.product_id;
    END LOOP;
    
    -- Update transaction status
    UPDATE customer_transactions
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RETURN true;
END;
$$;

-- Insert sample customer transactions
INSERT INTO customer_transactions (user_id, customer_name, customer_phone, total_price, status, notes) VALUES
(1, 'Ibu Sari', '081234567890', 15000, 'completed', 'Pesanan untuk acara keluarga'),
(1, 'Pak Budi', '081234567891', 8000, 'completed', 'Pesanan reguler'),
(2, 'Ibu Maya', '081234567892', 12000, 'pending', 'Pesanan untuk arisan');

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

-- Show results
SELECT 'Customer transactions created successfully!' as message;
SELECT 'Customer Transactions:' as info;
SELECT id, customer_name, total_price, status, created_at FROM customer_transactions;

SELECT 'Transaction Details:' as info;
SELECT td.id, td.transaction_id, td.product_name, td.quantity, td.subtotal 
FROM transaction_details td 
ORDER BY td.transaction_id, td.id;
