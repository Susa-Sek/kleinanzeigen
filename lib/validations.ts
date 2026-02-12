import { z } from 'zod';

// Account Validation Schemas
export const createAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  account_name: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
});

export const updateAccountSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  account_name: z.string().min(1, 'Account name is required').max(100, 'Account name too long').optional(),
  is_active: z.boolean().optional(),
});

// Message Validation Schemas
export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  body: z.string().min(1, 'Message body is required').max(5000, 'Message too long'),
});

// Sync Validation
export const syncAccountSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SyncAccountInput = z.infer<typeof syncAccountSchema>;
