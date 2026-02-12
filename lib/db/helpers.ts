import { supabase } from '../supabase';
import { encrypt, decrypt } from '../encryption';
import type { Account, Conversation, Message, SyncLog } from '@/types';

/**
 * Database helper functions for CRUD operations
 * Handles encryption/decryption of sensitive data
 */

// ==================== ACCOUNTS ====================

export interface CreateAccountData {
  user_id: string;
  email: string;
  password: string;
  account_name: string;
}

export interface UpdateAccountData {
  email?: string;
  password?: string;
  account_name?: string;
  is_active?: boolean;
  last_synced_at?: string;
}

/**
 * Create a new eBay Kleinanzeigen account
 * Encrypts password before storing
 */
export async function createAccount(data: CreateAccountData) {
  const encryptedPassword = encrypt(data.password);

  const { data: account, error } = await supabase
    .from('accounts')
    .insert({
      user_id: data.user_id,
      email: data.email,
      password: encryptedPassword,
      account_name: data.account_name,
    })
    .select()
    .single();

  if (error) throw error;
  return account as Account;
}

/**
 * Get all accounts for a user
 */
export async function getAccountsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Account[];
}

/**
 * Get a single account by ID
 */
export async function getAccountById(accountId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error) throw error;
  return data as Account;
}

/**
 * Get decrypted credentials for an account
 */
export async function getAccountCredentials(accountId: string) {
  const account = await getAccountById(accountId);

  return {
    email: account.email,
    password: decrypt(account.password),
  };
}

/**
 * Update an account
 * Encrypts password if provided
 */
export async function updateAccount(accountId: string, data: UpdateAccountData) {
  const updateData: any = { ...data };

  // Encrypt password if it's being updated
  if (data.password) {
    updateData.password = encrypt(data.password);
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw error;
  return account as Account;
}

/**
 * Delete an account (cascades to conversations and messages)
 */
export async function deleteAccount(accountId: string) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw error;
}

/**
 * Update last_synced_at timestamp for an account
 */
export async function updateLastSyncedAt(accountId: string) {
  return updateAccount(accountId, {
    last_synced_at: new Date().toISOString(),
  });
}

// ==================== CONVERSATIONS ====================

export interface UpsertConversationData {
  account_id: string;
  partner_name: string;
  last_message_at: string;
  unread_count?: number;
  listing_title?: string;
  listing_url?: string;
}

/**
 * Upsert a conversation (used during sync)
 * Updates if exists, inserts if new
 */
export async function upsertConversation(data: UpsertConversationData) {
  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('account_id', data.account_id)
    .eq('partner_name', data.partner_name)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('conversations')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated as Conversation;
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return inserted as Conversation;
  }
}

/**
 * Get conversations for an account
 */
export async function getConversationsByAccountId(accountId: string, limit = 50) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('account_id', accountId)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Conversation[];
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data as Conversation;
}

// ==================== MESSAGES ====================

export interface UpsertMessageData {
  account_id: string;
  conversation_id: string;
  sender: string;
  recipient: string;
  subject?: string;
  body: string;
  timestamp: string;
  is_read: boolean;
  ebay_message_id: string;
  attachment_url?: string;
}

/**
 * Upsert a message (prevents duplicates via ebay_message_id)
 */
export async function upsertMessage(data: UpsertMessageData) {
  const { data: message, error } = await supabase
    .from('messages')
    .upsert(data, {
      onConflict: 'account_id,ebay_message_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return message as Message;
}

/**
 * Get messages for a conversation
 */
export async function getMessagesByConversationId(conversationId: string, limit = 100) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as Message[];
}

/**
 * Get all messages for an account (for unified inbox)
 */
export async function getMessagesByAccountId(accountId: string, limit = 100) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      conversation:conversations(*)
    `)
    .eq('account_id', accountId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as any[]; // MessageWithConversation type
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId);

  if (error) throw error;
}

/**
 * Get unread message count for an account
 */
export async function getUnreadCount(accountId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

// ==================== SYNC LOGS ====================

export interface CreateSyncLogData {
  account_id: string;
  sync_started_at: string;
}

/**
 * Create a sync log entry
 */
export async function createSyncLog(data: CreateSyncLogData) {
  const { data: log, error } = await supabase
    .from('sync_logs')
    .insert({
      ...data,
      status: 'running',
    })
    .select()
    .single();

  if (error) throw error;
  return log as SyncLog;
}

/**
 * Update sync log with completion status
 */
export async function updateSyncLog(
  logId: string,
  status: 'success' | 'error',
  messagesSynced?: number,
  errorMessage?: string
) {
  const { data: log, error } = await supabase
    .from('sync_logs')
    .update({
      sync_completed_at: new Date().toISOString(),
      status,
      messages_synced: messagesSynced || 0,
      error_message: errorMessage,
    })
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;
  return log as SyncLog;
}

/**
 * Get sync logs for an account
 */
export async function getSyncLogsByAccountId(accountId: string, limit = 20) {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('account_id', accountId)
    .order('sync_started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SyncLog[];
}

/**
 * Get the latest sync log for an account
 */
export async function getLatestSyncLog(accountId: string) {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('account_id', accountId)
    .order('sync_started_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as SyncLog | null;
}
