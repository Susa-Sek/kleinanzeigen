-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable Realtime for conversations table (for unread count updates)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
