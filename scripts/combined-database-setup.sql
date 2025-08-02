-- Combined and modified database setup script for NAY'S CAKE
-- Merged from all .sql files in the /scripts directory.
-- Changes requested:
-- 1. Original 'transactions' (inventory log) table removed.
-- 2. 'customer_transactions' table renamed to 'transactions'.
-- 3. Inventory logging from 'complete_transaction' function removed.
-- ------------------------------------------------------------------
-- 📉 Drop existing objects for a clean setup
-- ------------------------------------------------------------------
drop function IF exists update_daily_report () CASCADE;

drop function IF exists update_updated_at_column () CASCADE;

drop function IF exists generate_daily_report () CASCADE;

drop function IF exists create_transaction_with_stock_update (BIGINT, VARCHAR, VARCHAR, INTEGER, TEXT, DATE) CASCADE;

drop function IF exists update_transaction_total (BIGINT) CASCADE;

drop function IF exists add_transaction_item (BIGINT, BIGINT, INTEGER) CASCADE;

drop function IF exists complete_customer_transaction (BIGINT) CASCADE;

drop function IF exists complete_transaction (BIGINT) CASCADE;

drop table if exists transaction_details CASCADE;

drop table if exists customer_transactions CASCADE;

drop table if exists transactions CASCADE;

drop table if exists daily_reports CASCADE;

drop table if exists products CASCADE;

-- ------------------------------------------------------------------
-- 🏗️ Create Tables
-- ------------------------------------------------------------------
-- Create products table
create table products (
    id BIGSERIAL primary key,
    name VARCHAR(255) not null,
    price DECIMAL(10, 2) not null default 0,
    current_stock INTEGER not null default 0,
    min_stock INTEGER not null default 20,
    total_value DECIMAL(12, 2) GENERATED ALWAYS as (current_stock * price) STORED,
    created_at timestamp with time zone default NOW(),
    updated_at timestamp with time zone default NOW()
);

-- Create transactions table (renamed from customer_transactions)
create table transactions (
    id BIGSERIAL primary key,
    user_id UUID not null references auth.users (id) on delete RESTRICT,
    total_price DECIMAL(12, 2) not null default 0,
    created_at timestamp with time zone default NOW(),
    updated_at timestamp with time zone default NOW()
);

-- Create transaction_details table
create table transaction_details (
    id BIGSERIAL primary key,
    transaction_id BIGINT not null references transactions (id) on delete CASCADE,
    product_id BIGINT references products (id) on delete set null,
    product_name VARCHAR(255) not null,
    product_price DECIMAL(10, 2) not null,
    quantity INTEGER not null check (quantity > 0),
    subtotal DECIMAL(12, 2) GENERATED ALWAYS as (product_price * quantity) STORED,
    created_at timestamp with time zone default NOW()
);

-- Create daily_reports table for analytics
create table daily_reports (
    id BIGSERIAL primary key,
    report_date DATE not null default CURRENT_DATE,
    total_stock INTEGER not null default 0,
    total_sales INTEGER not null default 0,
    total_value DECIMAL(12, 2) not null default 0,
    low_stock_items INTEGER not null default 0,
    created_at timestamp with time zone default NOW(),
    unique (report_date)
);

-- ------------------------------------------------------------------
-- ⚡ Create Indexes for Performance
-- ------------------------------------------------------------------
create index idx_products_name on products (name);

create index idx_products_current_stock on products (current_stock);

create index idx_transactions_created_at on transactions (created_at);

create index idx_transaction_details_transaction_id on transaction_details (transaction_id);

create index idx_transaction_details_product_id on transaction_details (product_id);

create index idx_daily_reports_date on daily_reports (report_date);

-- ------------------------------------------------------------------
-- ⚙️ Create Functions and Triggers
-- ------------------------------------------------------------------
-- Function to update updated_at timestamp
create or replace function update_updated_at_column () RETURNS TRIGGER as $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_transactions_updated_at BEFORE
update on transactions for EACH row
execute FUNCTION update_updated_at_column ();

-- Function to calculate and update transaction total (patched version)
create or replace function update_transaction_total (p_transaction_id BIGINT) RETURNS DECIMAL(12, 2) as $$
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
$$ language 'plpgsql';

-- Function to add item to transaction (patched version)
create or replace function add_transaction_item (
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
$$ language 'plpgsql';

-- Function to complete transaction (reduce stock)
create or replace function complete_transaction (p_transaction_id BIGINT) RETURNS BOOLEAN as $$
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
$$ language 'plpgsql';

-- ------------------------------------------------------------------
-- 🔒 Enable Row Level Security (RLS) and Policies
-- ------------------------------------------------------------------
alter table products ENABLE row LEVEL SECURITY;

alter table transactions ENABLE row LEVEL SECURITY;

alter table transaction_details ENABLE row LEVEL SECURITY;

alter table daily_reports ENABLE row LEVEL SECURITY;

create policy "Allow all operations on products" on products for all using (true);

create policy "Allow all operations on transactions" on transactions for all using (true);

create policy "Allow all operations on transaction_details" on transaction_details for all using (true);

create policy "Allow all operations on daily_reports" on daily_reports for all using (true);

-- ------------------------------------------------------------------
-- 💾 Insert Sample Data
-- ------------------------------------------------------------------
-- Insert sample products
insert into
    products (name, price, current_stock, min_stock)
values
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
do $$
DECLARE
    sample_user_id_1 uuid;
    sample_user_id_2 uuid;
BEGIN
    -- Select the first two users from auth.users to act as sample users.
    -- In a local dev environment, you should create at least one user manually
    -- via the Supabase UI or API before running this script.
    SELECT id INTO sample_user_id_1 FROM auth.users ORDER BY email LIMIT 1;
    SELECT id INTO sample_user_id_2 FROM auth.users ORDER BY email OFFSET 1 LIMIT 1;

    -- If only one user exists, use that user for all transactions.
    IF sample_user_id_2 IS NULL THEN
        sample_user_id_2 := sample_user_id_1;
    END IF;

    -- Proceed only if at least one user is found.
    IF sample_user_id_1 IS NOT NULL THEN
        INSERT INTO transactions (user_id)
        VALUES
            (sample_user_id_1),
            (sample_user_id_1),
            (sample_user_id_2);
    ELSE
        RAISE NOTICE 'No users found in auth.users. Skipping sample transaction creation.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert sample transaction details
insert into
    transaction_details (
        transaction_id,
        product_id,
        product_name,
        product_price,
        quantity
    )
values
    (1, 1, 'Dadar Gulung', 1000, 5),
    (1, 2, 'Pastel', 1000, 3),
    (1, 6, 'Bacang', 5000, 1),
    (1, 9, 'Onde-onde', 1500, 2),
    (2, 3, 'Risoles', 1000, 4),
    (2, 5, 'Donat', 1000, 4),
    (3, 4, 'Lemper', 1000, 6),
    (3, 8, 'Kue Lapis', 1000, 6);

-- Update totals for sample transactions
select
    update_transaction_total (1);

select
    update_transaction_total (2);

select
    update_transaction_total (3);

-- Create initial daily report
insert into
    daily_reports (
        report_date,
        total_stock,
        total_sales,
        total_value,
        low_stock_items
    )
select
    CURRENT_DATE,
    COALESCE(SUM(current_stock), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(current_stock * price), 0),
    COALESCE(
        SUM(
            case
                when current_stock <= min_stock then 1
                else 0
            end
        ),
        0
    )
from
    products
on conflict (report_date) do update
set
    total_stock = EXCLUDED.total_stock,
    total_sales = EXCLUDED.total_sales,
    total_value = EXCLUDED.total_value,
    low_stock_items = EXCLUDED.low_stock_items;

-- ------------------------------------------------------------------
-- ✅ Verification
-- ------------------------------------------------------------------
select
    'Database setup completed successfully!' as message;

select
    'Products created:' as info,
    COUNT(*) as count
from
    products;

select
    'Transactions created:' as info,
    COUNT(*) as count
from
    transactions;

select
    'Transaction Details created:' as info,
    COUNT(*) as count
from
    transaction_details;

select
    'Daily Report created:' as info,
    report_date
from
    daily_reports;

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

alter table transactions
drop constraint IF exists transactions_user_id_fkey;

drop table if exists users;

alter table transactions
alter column user_id TYPE UUID using user_id::text::UUID;

alter table transactions
add constraint transactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete RESTRICT;