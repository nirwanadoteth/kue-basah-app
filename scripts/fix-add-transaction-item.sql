-- ------------------------------------------------------------------
-- 🔧  Patch: remove ambiguous column references in order functions
-- ------------------------------------------------------------------

/********************************************************************
  1️⃣  update_transaction_total
*********************************************************************/
CREATE OR REPLACE FUNCTION update_transaction_total(p_transaction_id BIGINT)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_total DECIMAL(12,2);
BEGIN
    /* qualify column with table-alias td */
    SELECT COALESCE(SUM(td.subtotal), 0)
      INTO v_new_total
      FROM transaction_details AS td
     WHERE td.transaction_id = p_transaction_id;

    UPDATE customer_transactions AS ct
       SET total_price = v_new_total
     WHERE ct.id = p_transaction_id;

    RETURN v_new_total;
END;
$$;

/********************************************************************
  2️⃣  add_transaction_item
*********************************************************************/
CREATE OR REPLACE FUNCTION add_transaction_item(
    p_transaction_id BIGINT,
    p_product_id     BIGINT,
    p_quantity       INTEGER
)
/* rename OUT columns so they can never clash with table columns */
RETURNS TABLE(
    out_detail_id     BIGINT,
    out_transaction_id BIGINT,
    out_product_id     BIGINT,
    out_product_name   VARCHAR,
    out_product_price  DECIMAL,
    out_quantity       INTEGER,
    out_subtotal       DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_name   VARCHAR(255);
    v_product_price  DECIMAL(10,2);
    v_current_stock  INTEGER;
    v_detail_id      BIGINT;
BEGIN
    /* 1. Fetch product & validate stock */
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

    /* 2. Insert or update detail row */
    IF EXISTS (
        SELECT 1
          FROM transaction_details AS td
         WHERE td.transaction_id = p_transaction_id
           AND td.product_id     = p_product_id
    ) THEN
        UPDATE transaction_details AS td
           SET quantity = td.quantity + p_quantity
         WHERE td.transaction_id = p_transaction_id
           AND td.product_id     = p_product_id
        RETURNING td.id INTO v_detail_id;
    ELSE
        INSERT INTO transaction_details
              (transaction_id, product_id, product_name, product_price, quantity)
        VALUES (p_transaction_id, p_product_id, v_product_name, v_product_price, p_quantity)
        RETURNING id INTO v_detail_id;
    END IF;

    /* 3. Refresh total price on parent transaction */
    PERFORM update_transaction_total(p_transaction_id);

    /* 4. Return the freshly-updated / inserted detail              */
    RETURN QUERY
    SELECT  td.id,               -- out_detail_id
            td.transaction_id,   -- out_transaction_id
            td.product_id,       -- out_product_id
            td.product_name,     -- out_product_name
            td.product_price,    -- out_product_price
            td.quantity,         -- out_quantity
            td.subtotal          -- out_subtotal
      FROM transaction_details AS td
     WHERE td.id = v_detail_id;
END;
$$;

-- ------------------------------------------------------------------
-- ✅  Patch complete – run this script, then re-test “Tambah Item”.
-- ------------------------------------------------------------------
