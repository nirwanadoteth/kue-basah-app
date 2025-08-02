ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
DROP TABLE IF EXISTS users;
ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
