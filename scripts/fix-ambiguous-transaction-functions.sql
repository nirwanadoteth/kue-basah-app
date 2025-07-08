-- Fix ambiguous column references in transaction functions
-- This resolves the "column reference 'transaction_id' is ambiguous" error

-- Drop existing functions first (PostgreSQL requires this when changing return types)
DROP FUNCTION IF EXISTS update_transaction_total(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS add_transaction_item(BIGINT, BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS complete_customer_transaction(BIGINT) CASCADE;

-- 1. Recreate update_transaction_total function with proper table aliases
CREATE OR REPLACE FUNCTION update_transaction_total(p_transaction_id BIGINT)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    new_total DECIMAL(12,2);
BEGIN
    -- Calculate total from transaction details with explicit table alias
    SELECT COALESCE(SUM(td.subtotal), 0) INTO new_total
    FROM transaction_details td
    WHERE td.transaction_id = p_transaction_id;
    
    -- Update the customer transaction total with explicit table alias
    UPDATE customer_transactions ct
    SET total_price = new_total
    WHERE ct.id = p_transaction_id;
    
    RETURN new_total;
END;
$$;

-- 2. Recreate add_transaction_item function with renamed output parameters to avoid ambiguity
CREATE OR REPLACE FUNCTION add_transaction_item(
    p_transaction_id BIGINT,
    p_product_id BIGINT,
    p_quantity INTEGER
)
RETURNS TABLE(
    detail_id BIGINT,
    trans_id BIGINT,
    prod_id BIGINT,
    prod_name VARCHAR,
    prod_price DECIMAL,
    item_quantity INTEGER,
    item_subtotal DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_name VARCHAR(255);
    v_product_price DECIMAL(10,2);
    v_current_stock INTEGER;
    new_detail_id BIGINT;
BEGIN
    -- Get product details and check stock with explicit table alias
    SELECT p.name, p.price, p.current_stock 
    INTO v_product_name, v_product_price, v_current_stock
    FROM products p
    WHERE p.id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', p_product_id;
    END IF;
    
    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;
    
    -- Check if item already exists in transaction with explicit table alias
    IF EXISTS (
        SELECT 1 FROM transaction_details td 
        WHERE td.transaction_id = p_transaction_id AND td.product_id = p_product_id
    ) THEN
        -- Update existing item with explicit table alias
        UPDATE transaction_details td
        SET quantity = td.quantity + p_quantity
        WHERE td.transaction_id = p_transaction_id AND td.product_id = p_product_id
        RETURNING td.id INTO new_detail_id;
    ELSE
        -- Insert new item
        INSERT INTO transaction_details (transaction_id, product_id, product_name, product_price, quantity)
        VALUES (p_transaction_id, p_product_id, v_product_name, v_product_price, p_quantity)
        RETURNING id INTO new_detail_id;
    END IF;
    
    -- Update transaction total
    PERFORM update_transaction_total(p_transaction_id);
    
    -- Return the transaction detail with explicit table alias and renamed columns
    RETURN QUERY
    SELECT 
        td.id as detail_id,
        td.transaction_id as trans_id,
        td.product_id as prod_id,
        td.product_name as prod_name,
        td.product_price as prod_price,
        td.quantity as item_quantity,
        td.subtotal as item_subtotal
    FROM transaction_details td
    WHERE td.id = new_detail_id;
END;
$$;

-- 3. Recreate complete_customer_transaction function with proper table aliases
CREATE OR REPLACE FUNCTION complete_customer_transaction(p_transaction_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    detail_record RECORD;
BEGIN
    -- Check if transaction exists with explicit table alias
    IF NOT EXISTS (SELECT 1 FROM customer_transactions ct WHERE ct.id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;
    
    -- Reduce stock for each item in the transaction with explicit table alias
    FOR detail_record IN 
        SELECT td.product_id, td.quantity 
        FROM transaction_details td
        WHERE td.transaction_id = p_transaction_id
    LOOP
        -- Update product stock with explicit table alias
        UPDATE products p
        SET current_stock = p.current_stock - detail_record.quantity
        WHERE p.id = detail_record.product_id;
        
        -- Create inventory transaction record with explicit table alias
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
    
    RETURN true;
END;
$$;

-- Verify the functions were created successfully
SELECT 'Transaction functions updated successfully!' as message;
SELECT 'Functions recreated with proper table aliases and renamed output parameters' as status;

-- Test that the functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_transaction_total', 'add_transaction_item', 'complete_customer_transaction')
ORDER BY routine_name;
