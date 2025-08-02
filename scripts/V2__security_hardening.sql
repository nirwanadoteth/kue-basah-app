-- V2: Security Hardening
-- This script addresses security warnings from Supabase.
-- ------------------------------------------------------------------
-- 🔒 Row Level Security (RLS) for audit_log
-- ------------------------------------------------------------------
-- 1. Enable RLS on the audit_log table
alter table public.audit_log ENABLE row LEVEL SECURITY;

-- 2. Create a restrictive default policy on audit_log
-- This policy denies all access by default. More specific, permissive
-- policies should be created for roles that need access.
drop policy IF exists "Deny all access to audit_log" on public.audit_log;

create policy "Deny all access to audit_log" on public.audit_log for all using (false)
with
    check (false);

-- ------------------------------------------------------------------
-- ⚙️ Secure Functions by Setting search_path
-- ------------------------------------------------------------------
-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column () RETURNS TRIGGER as $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
set
    search_path = public;

-- Function to calculate and update transaction total
create or replace function public.update_transaction_total (p_transaction_id BIGINT) RETURNS DECIMAL(12, 2) as $$
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
$$ LANGUAGE plpgsql
set
    search_path = public;

-- Function to add item to transaction
create or replace function public.add_transaction_item (
    p_transaction_id BIGINT,
    p_product_id BIGINT,
    p_quantity INTEGER
) RETURNS table (
    out_detail_id BIGINT,
    out_transaction_id BIGINT,
    out_product_id BIGINT,
    out_product_name VARCHAR,
    out_product_price DECIMAL,
    out_quantity INTEGER,
    out_subtotal DECIMAL
) as $$
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
$$ LANGUAGE plpgsql
set
    search_path = public;

-- Function to complete transaction (reduce stock)
create or replace function public.complete_transaction (p_transaction_id BIGINT) RETURNS BOOLEAN as $$
DECLARE
    detail_record RECORD;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction not found';
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

    RETURN true;
END;
$$ LANGUAGE plpgsql
set
    search_path = public;

-- Function for the audit trigger
create or replace function public.audit_trigger_function () RETURNS TRIGGER as $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO public.audit_log (table_name, record_id, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, v_old_data, v_new_data, auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO public.audit_log (table_name, record_id, old_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, v_old_data, auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO public.audit_log (table_name, record_id, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, v_new_data, auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql
set
    search_path = public;

-- Function to clean up old audit logs
create or replace function public.cleanup_audit_logs () RETURNS void as $$
BEGIN
    DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql
set
    search_path = public;

-- ------------------------------------------------------------------
-- ✅ Verification
-- ------------------------------------------------------------------
select
    'V2 Security hardening script applied successfully!' as message;