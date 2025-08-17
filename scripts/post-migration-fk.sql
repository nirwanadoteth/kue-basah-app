-- This script should be run ONLY after all users have been migrated from the
-- 'legacy_users' table to the new 'user' table.
--
-- You can check if any users remain by running:
-- SELECT COUNT(*) FROM legacy_users;
--
-- Once the count is 0, you can safely run this script to restore the
-- foreign key constraint on the 'transactions' table.

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT;

SELECT 'Foreign key constraint on transactions.user_id has been restored.' AS status;
