// Database Types (matching Supabase schema)

export interface Account {
  id: string;
  user_id: string;
  email: string;
  password: string;
  account_name: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  account_id: string;
  partner_name: string;
  last_message_at: string;
  unread_count: number;
  listing_title: string | null;
  listing_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  account_id: string;
  conversation_id: string;
  sender: string;
  recipient: string;
  subject: string | null;
  body: string;
  timestamp: string;
  is_read: boolean;
  ebay_message_id: string;
  attachment_url: string | null;
  created_at: string;
}

export interface SyncLog {
  id: string;
  account_id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: 'running' | 'success' | 'error';
  messages_synced: number;
  error_message: string | null;
  created_at: string;
}

// Form Types for Creating/Updating

export interface CreateAccountInput {
  email: string;
  password: string;
  account_name: string;
}

export interface UpdateAccountInput {
  email?: string;
  password?: string;
  account_name?: string;
  is_active?: boolean;
}

// View Types (for UI)

export interface ConversationWithAccount extends Conversation {
  account: Pick<Account, 'id' | 'account_name' | 'email'>;
  latest_message?: Pick<Message, 'body' | 'timestamp' | 'sender'>;
}

export interface MessageWithConversation extends Message {
  conversation: Pick<Conversation, 'id' | 'partner_name' | 'listing_title'>;
}
