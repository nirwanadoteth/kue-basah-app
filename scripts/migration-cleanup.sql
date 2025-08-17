-- This script removes the obsolete authenticate_user function from the database.
-- This is part of the migration to better-auth.

DROP FUNCTION IF EXISTS authenticate_user (p_username VARCHAR, p_password VARCHAR);
