# Supabase Setup Guide

This guide walks you through setting up the Supabase database for the eBay Kleinanzeigen Multi-Account Messenger.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Project created in Supabase dashboard

## Step 1: Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `kleinanzeigen-messenger`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your location
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended for Quick Setup)

1. Go to your project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20260212000001_initial_schema.sql`
5. Paste into the SQL editor
6. Click "Run" to execute
7. Repeat for `supabase/migrations/20260212000002_enable_realtime.sql`

### Option B: Using Supabase CLI (For Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to "Settings" > "API"
2. Copy the following values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJ...` (long JWT token)

## Step 4: Configure Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## Step 5: Enable Authentication

1. Go to "Authentication" > "Providers" in Supabase dashboard
2. Enable "Email" provider
3. Configure email templates if desired (Settings > Auth > Email Templates)

## Step 6: Verify Setup

1. Go to "Table Editor" in Supabase dashboard
2. You should see the following tables:
   - `accounts`
   - `conversations`
   - `messages`
   - `sync_logs`

3. Click on each table and verify the structure matches the migration files

## Step 7: Enable Realtime (Optional but Recommended)

1. Go to "Database" > "Replication" in Supabase dashboard
2. Ensure the following tables have Realtime enabled:
   - `messages`
   - `conversations`

## Database Schema Overview

### Tables

**accounts**
- Stores eBay Kleinanzeigen account credentials
- Links to authenticated users via `user_id`
- Tracks sync status with `last_synced_at`

**conversations**
- Groups messages by conversation partner
- Tracks unread count for notifications
- Stores listing information for context

**messages**
- Individual messages from eBay Kleinanzeigen
- Linked to both account and conversation
- Stores eBay message ID to prevent duplicates

**sync_logs**
- Audit trail of sync operations
- Tracks success/failure and error messages
- Useful for debugging sync issues

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access data from their own accounts. This ensures data isolation between users.

### Indexes

Optimized indexes are created for:
- Conversation listing (sorted by last message time)
- Message retrieval (by conversation, account, timestamp)
- Unread message queries

## Troubleshooting

### Migration Fails

- Ensure you're running migrations in order (by timestamp)
- Check for syntax errors in the SQL
- Verify your database password is correct

### RLS Policies Not Working

- Make sure you're authenticated when querying
- Check that `auth.uid()` returns a valid user ID
- Test policies in SQL Editor with `SELECT auth.uid()`

### Realtime Not Working

- Verify Realtime is enabled for the specific tables
- Check that your client is properly subscribed to changes
- Ensure your anon key has proper permissions

## Next Steps

After setup is complete, you can:
1. Test the connection by running the Next.js app
2. Create test data to verify RLS policies
3. Proceed to Phase 3: Account Management UI
