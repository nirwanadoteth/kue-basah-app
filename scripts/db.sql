DROP FUNCTION IF EXISTS authenticate_user (VARCHAR, VARCHAR) CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column () CASCADE;

DROP FUNCTION IF EXISTS update_transaction_total (BIGINT) CASCADE;

DROP FUNCTION IF EXISTS add_transaction_item (BIGINT, BIGINT, INTEGER) CASCADE;

DROP FUNCTION IF EXISTS complete_transaction (BIGINT) CASCADE;

DROP FUNCTION IF EXISTS get_product_stats () CASCADE;

DROP FUNCTION IF EXISTS get_weekly_report_data (INTEGER) CASCADE;

DROP FUNCTION IF EXISTS get_weekly_product_trends (INTEGER) CASCADE;

DROP FUNCTION IF EXISTS get_monthly_report_data (INTEGER) CASCADE;

DROP TABLE IF EXISTS transaction_details CASCADE;

DROP TABLE IF EXISTS transactions CASCADE;

DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS daily_reports CASCADE;

DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 20,
  total_value DECIMAL(12, 2) GENERATED ALWAYS AS (current_stock * price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transaction_details (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products (id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (product_price * quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_stock INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  low_stock_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (report_date)
);

CREATE INDEX idx_products_name ON products (name);

CREATE INDEX idx_products_current_stock ON products (current_stock);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_transactions_created_at ON transactions (created_at);

CREATE INDEX idx_transaction_details_transaction_id ON transaction_details (transaction_id);

CREATE INDEX idx_transaction_details_product_id ON transaction_details (product_id);

CREATE INDEX idx_daily_reports_date ON daily_reports (report_date);

CREATE OR REPLACE FUNCTION public.update_updated_at_column () RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

CREATE TRIGGER update_transactions_updated_at BEFORE
UPDATE ON transactions FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

CREATE OR REPLACE FUNCTION public.authenticate_user (p_username VARCHAR, p_password VARCHAR) RETURNS TABLE (user_id BIGINT, username VARCHAR) SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT
  u.id,
  u.username
FROM
  users u
WHERE
  u.username = p_username
  AND u.password_hash = crypt(p_password, u.password_hash);
UPDATE
  users
SET
  last_login = NOW()
WHERE
  users.username = p_username
  AND users.password_hash = crypt(p_password, users.password_hash);
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.update_transaction_total (p_transaction_id BIGINT) RETURNS DECIMAL(12, 2) AS $$ DECLARE v_new_total DECIMAL(12, 2);
BEGIN
SELECT
  COALESCE(
    SUM(td.subtotal),
    0
  ) INTO v_new_total
FROM
  transaction_details AS td
WHERE
  td.transaction_id = p_transaction_id;
UPDATE
  transactions AS t
SET
  total_price = v_new_total
WHERE
  t.id = p_transaction_id;
RETURN v_new_total;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.add_transaction_item (
  p_transaction_id BIGINT,
  p_product_id BIGINT,
  p_quantity INTEGER
) RETURNS TABLE (
  out_detail_id BIGINT,
  out_transaction_id BIGINT,
  out_product_id BIGINT,
  out_product_name VARCHAR,
  out_product_price DECIMAL,
  out_quantity INTEGER,
  out_subtotal DECIMAL
) AS $$ DECLARE v_product_name VARCHAR(255);
v_product_price DECIMAL(10, 2);
v_current_stock INTEGER;
v_detail_id BIGINT;
BEGIN
SELECT
  p.name,
  p.price,
  p.current_stock INTO v_product_name,
  v_product_price,
  v_current_stock
FROM
  products AS p
WHERE
  p.id = p_product_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Product with id % not found',
p_product_id;
END IF;
IF v_current_stock < p_quantity THEN RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
v_current_stock,
p_quantity;
END IF;
IF EXISTS (
  SELECT
    1
  FROM
    transaction_details AS td
  WHERE
    td.transaction_id = p_transaction_id
    AND td.product_id = p_product_id
) THEN
UPDATE
  transaction_details AS td
SET
  quantity = td.quantity + p_quantity
WHERE
  td.transaction_id = p_transaction_id
  AND td.product_id = p_product_id RETURNING td.id INTO v_detail_id;
ELSE INSERT INTO transaction_details (
  transaction_id, product_id, product_name,
  product_price, quantity
)
VALUES
  (
    p_transaction_id, p_product_id, v_product_name,
    v_product_price, p_quantity
  ) RETURNING id INTO v_detail_id;
END IF;
PERFORM update_transaction_total(p_transaction_id);
RETURN QUERY
SELECT
  td.id,
  td.transaction_id,
  td.product_id,
  td.product_name,
  td.product_price,
  td.quantity,
  td.subtotal
FROM
  transaction_details AS td
WHERE
  td.id = v_detail_id;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.complete_transaction (p_transaction_id BIGINT) RETURNS BOOLEAN AS $$ DECLARE detail_record RECORD;
BEGIN IF NOT EXISTS (
  SELECT
    1
  FROM
    transactions
  WHERE
    id = p_transaction_id
) THEN RAISE EXCEPTION 'Transaction not found';
END IF;
FOR detail_record IN
SELECT
  product_id,
  quantity
FROM
  transaction_details
WHERE
  transaction_id = p_transaction_id LOOP
UPDATE
  products
SET
  current_stock = current_stock - detail_record.quantity
WHERE
  id = detail_record.product_id;
END LOOP;
RETURN true;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.get_product_stats () RETURNS TABLE (
  total_products BIGINT,
  total_stock BIGINT,
  total_value NUMERIC,
  low_stock_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_products,
    COALESCE(SUM(current_stock), 0) as total_stock,
    COALESCE(SUM(total_value), 0) as total_value,
    COALESCE(SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END), 0) as low_stock_count
  FROM products;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.get_weekly_report_data (p_weeks_back INTEGER DEFAULT 4) RETURNS TABLE (
  week_number INTEGER,
  week_start DATE,
  total_sales BIGINT,
  total_value NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH week_series AS (
    SELECT
      s.week_num,
      (CURRENT_DATE - INTERVAL '1 week' * (p_weeks_back - 1 - s.week_num))::DATE as week_start_date
    FROM generate_series(0, p_weeks_back - 1) AS s(week_num)
  ),
  weekly_reports AS (
    SELECT
      ws.week_num,
      ws.week_start_date,
      COALESCE(SUM(dr.total_stock), 0) as week_total_stock,
      COALESCE(SUM(dr.total_value), 0) as week_total_value
    FROM week_series ws
    LEFT JOIN daily_reports dr ON dr.report_date >= ws.week_start_date
      AND dr.report_date < ws.week_start_date + INTERVAL '7 days'
    GROUP BY ws.week_num, ws.week_start_date
  ),
  weekly_transactions AS (
    SELECT
      ws.week_num,
      COUNT(t.id) as week_transaction_count,
      COALESCE(SUM(td.quantity), 0) as week_total_sales
    FROM week_series ws
    LEFT JOIN transactions t ON t.created_at >= ws.week_start_date::TIMESTAMP
      AND t.created_at < (ws.week_start_date + INTERVAL '7 days')::TIMESTAMP
    LEFT JOIN transaction_details td ON td.transaction_id = t.id
    GROUP BY ws.week_num
  )
  SELECT
    wr.week_num + 1,
    wr.week_start_date,
    wt.week_total_sales,
    wr.week_total_value,
    wt.week_transaction_count
  FROM weekly_reports wr
  JOIN weekly_transactions wt ON wr.week_num = wt.week_num
  ORDER BY wr.week_num;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.get_weekly_product_trends (p_weeks_back INTEGER DEFAULT 4) RETURNS TABLE (
  product_name VARCHAR,
  week1_sales BIGINT,
  week2_sales BIGINT,
  week3_sales BIGINT,
  week4_sales BIGINT,
  total_sales BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH week_series AS (
    SELECT
      s.week_num,
      (CURRENT_DATE - INTERVAL '1 week' * (p_weeks_back - 1 - s.week_num))::DATE as week_start_date
    FROM generate_series(0, p_weeks_back - 1) AS s(week_num)
  )
  SELECT
    td.product_name,
    COALESCE(SUM(CASE WHEN ws.week_num = 0 THEN td.quantity ELSE 0 END), 0) as week1_sales,
    COALESCE(SUM(CASE WHEN ws.week_num = 1 THEN td.quantity ELSE 0 END), 0) as week2_sales,
    COALESCE(SUM(CASE WHEN ws.week_num = 2 THEN td.quantity ELSE 0 END), 0) as week3_sales,
    COALESCE(SUM(CASE WHEN ws.week_num = 3 THEN td.quantity ELSE 0 END), 0) as week4_sales,
    COALESCE(SUM(td.quantity), 0) as total_sales
  FROM week_series ws
  LEFT JOIN transactions t ON t.created_at >= ws.week_start_date::TIMESTAMP
    AND t.created_at < (ws.week_start_date + INTERVAL '7 days')::TIMESTAMP
  LEFT JOIN transaction_details td ON td.transaction_id = t.id
  WHERE td.product_name IS NOT NULL
  GROUP BY td.product_name
  HAVING COALESCE(SUM(td.quantity), 0) > 0
  ORDER BY total_sales DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.get_monthly_report_data (p_months_back INTEGER DEFAULT 6) RETURNS TABLE (
  month_number INTEGER,
  month_name TEXT,
  total_sales BIGINT,
  total_value NUMERIC,
  transaction_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT
      s.month_num,
      date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * (p_months_back - 1 - s.month_num))::DATE as month_start_date
    FROM generate_series(0, p_months_back - 1) AS s(month_num)
  ),
  monthly_reports AS (
    SELECT
      ms.month_num,
      ms.month_start_date,
      COALESCE(SUM(dr.total_value), 0) as month_total_value,
      to_char(ms.month_start_date, 'Mon YYYY') as formatted_month
    FROM month_series ms
    LEFT JOIN daily_reports dr ON dr.report_date >= ms.month_start_date
      AND dr.report_date < (ms.month_start_date + INTERVAL '1 month')
    GROUP BY ms.month_num, ms.month_start_date
  ),
  monthly_transactions AS (
    SELECT
      ms.month_num,
      COUNT(t.id) as month_transaction_count,
      COALESCE(SUM(td.quantity), 0) as month_total_sales,
      COALESCE(SUM(t.total_price), 0) as month_revenue
    FROM month_series ms
    LEFT JOIN transactions t ON t.created_at >= ms.month_start_date::TIMESTAMP
      AND t.created_at < (ms.month_start_date + INTERVAL '1 month')::TIMESTAMP
    LEFT JOIN transaction_details td ON td.transaction_id = t.id
    GROUP BY ms.month_num
  )
  SELECT
    mr.month_num + 1,
    mr.formatted_month,
    mt.month_total_sales,
    mr.month_total_value,
    mt.month_transaction_count,
    mt.month_revenue
  FROM monthly_reports mr
  JOIN monthly_transactions mt ON mr.month_num = mt.month_num
  ORDER BY mr.month_num;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (TRUE);

CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (TRUE);

CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (TRUE);

CREATE POLICY "Allow all operations on transaction_details" ON transaction_details FOR ALL USING (TRUE);

CREATE POLICY "Allow all operations on daily_reports" ON daily_reports FOR ALL USING (TRUE);

INSERT INTO
  users (username, password_hash)
VALUES
  ('admin', crypt ('admin123', gen_salt ('bf'))),
  ('nay', crypt ('admin123', gen_salt ('bf'))),
  ('kasir1', crypt ('admin123', gen_salt ('bf'))),
  ('kasir2', crypt ('admin123', gen_salt ('bf')))
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO
  products (name, price, current_stock, min_stock)
VALUES
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

INSERT INTO
  transactions (user_id)
VALUES
  ('user_30uLCRRX3hYwf51AUCiSNdb63ex'),
  ('user_30uLCRRX3hYwf51AUCiSNdb63ex'),
  ('user_30uLCRRX3hYwf51AUCiSNdb63ex');

INSERT INTO
  transaction_details (
    transaction_id,
    product_id,
    product_name,
    product_price,
    quantity
  )
VALUES
  (1, 1, 'Dadar Gulung', 1000, 5),
  (1, 2, 'Pastel', 1000, 3),
  (1, 6, 'Bacang', 5000, 1),
  (1, 9, 'Onde-onde', 1500, 2),
  (2, 3, 'Risoles', 1000, 4),
  (2, 5, 'Donat', 1000, 4),
  (3, 4, 'Lemper', 1000, 6),
  (3, 8, 'Kue Lapis', 1000, 6);

SELECT
  update_transaction_total (1);

SELECT
  update_transaction_total (2);

SELECT
  update_transaction_total (3);

INSERT INTO
  daily_reports (
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
  COALESCE(
    SUM(
      CASE
        WHEN current_stock <= min_stock THEN 1
        ELSE 0
      END
    ),
    0
  )
FROM
  products
ON CONFLICT (report_date) DO UPDATE
SET
  total_stock = EXCLUDED.total_stock,
  total_sales = EXCLUDED.total_sales,
  total_value = EXCLUDED.total_value,
  low_stock_items = EXCLUDED.low_stock_items;

SELECT
  'Database setup completed successfully!' AS message;

SELECT
  'Users created:' AS info,
  COUNT(*) AS count
FROM
  users;

SELECT
  'Products created:' AS info,
  COUNT(*) AS count
FROM
  products;

SELECT
  'Transactions created:' AS info,
  COUNT(*) AS count
FROM
  transactions;

SELECT
  'Transaction Details created:' AS info,
  COUNT(*) AS count
FROM
  transaction_details;

SELECT
  'Daily Report created:' AS info,
  report_date
FROM
  daily_reports;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access to audit_log" ON public.audit_log;

CREATE POLICY "Deny all access to audit_log" ON public.audit_log FOR ALL USING (FALSE)
WITH
  CHECK (FALSE);

CREATE OR REPLACE FUNCTION public.audit_trigger_function () RETURNS TRIGGER AS $$ DECLARE v_old_data jsonb;
v_new_data jsonb;
BEGIN IF (TG_OP = 'UPDATE') THEN v_old_data := to_jsonb(OLD);
v_new_data := to_jsonb(NEW);
INSERT INTO public.audit_log (
  table_name, record_id, old_data, new_data,
  user_id
)
VALUES
  (
    TG_TABLE_NAME,
    OLD.id,
    v_old_data,
    v_new_data,
    auth.uid()
  );
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN v_old_data := to_jsonb(OLD);
INSERT INTO public.audit_log (
  table_name, record_id, old_data, user_id
)
VALUES
    (
        TG_TABLE_NAME,
        OLD.id,
        v_old_data,
        auth.uid()
    );
RETURN OLD;
ELSIF (TG_OP = 'INSERT') THEN v_new_data := to_jsonb(NEW);
INSERT INTO public.audit_log (
    table_name, record_id, new_data, user_id
)
VALUES
    (
        TG_TABLE_NAME,
        NEW.id,
        v_new_data,
        auth.uid()
    );
RETURN NEW;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_audit_logs () RETURNS void AS $$ BEGIN
DELETE FROM
    public.audit_log
WHERE
    created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql
SET
  search_path = public;

SELECT
  'V2 Security hardening script applied successfully!' AS message;
