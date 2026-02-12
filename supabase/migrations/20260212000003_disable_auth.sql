-- Disable Row Level Security (no authentication needed)
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs DISABLE ROW LEVEL SECURITY;

-- Make user_id nullable (not required anymore)
ALTER TABLE accounts ALTER COLUMN user_id DROP NOT NULL;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view conversations from their accounts" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations for their accounts" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations from their accounts" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations from their accounts" ON conversations;

DROP POLICY IF EXISTS "Users can view messages from their accounts" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for their accounts" ON messages;
DROP POLICY IF EXISTS "Users can update messages from their accounts" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from their accounts" ON messages;

DROP POLICY IF EXISTS "Users can view sync logs from their accounts" ON sync_logs;
DROP POLICY IF EXISTS "Users can insert sync logs for their accounts" ON sync_logs;

-- Add a comment
COMMENT ON TABLE accounts IS 'Public access - no authentication required';
