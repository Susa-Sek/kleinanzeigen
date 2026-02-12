# Backend Implementation - eBay Kleinanzeigen Multi-Account Messaging

This document provides a comprehensive overview of the backend implementation for the eBay Kleinanzeigen Multi-Account Messaging Platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implemented Components](#implemented-components)
3. [API Endpoints](#api-endpoints)
4. [Security Features](#security-features)
5. [Testing Guide](#testing-guide)
6. [Deployment Checklist](#deployment-checklist)
7. [Environment Variables](#environment-variables)

---

## Architecture Overview

```
kleinanzeigen-app/
├── lib/
│   ├── encryption.ts          # AES-256 encryption for passwords
│   ├── supabase.ts            # Supabase client
│   ├── validations.ts         # Zod validation schemas
│   ├── db/
│   │   └── helpers.ts         # Database CRUD operations
│   └── scraper/
│       ├── ebay-scraper.ts    # Puppeteer scraper class
│       ├── selectors.ts       # CSS selectors for eBay Kleinanzeigen
│       └── parser.ts          # HTML parsing utilities
├── app/api/
│   ├── accounts/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/route.ts      # GET, PATCH, DELETE (single account)
│   ├── messages/
│   │   └── reply/route.ts     # POST (send reply via scraper)
│   ├── sync/
│   │   └── route.ts           # POST (manual sync)
│   └── cron/
│       └── sync-all/route.ts  # POST (automated sync cron job)
└── vercel.json                # Cron job configuration
```

---

## Implemented Components

### Phase 2: Encryption & Database Helpers ✅

**File: `lib/encryption.ts`**
- AES-256-GCM encryption for passwords
- PBKDF2 key derivation from `ENCRYPTION_KEY`
- `encrypt()` and `decrypt()` functions
- `verifyEncryption()` for testing

**File: `lib/db/helpers.ts`**
- `createAccount()` - Creates account with encrypted password
- `getAccountsByUserId()` - Fetches all accounts for a user
- `getAccountById()` - Fetches single account
- `getAccountCredentials()` - Returns decrypted credentials
- `updateAccount()` - Updates account (encrypts password if changed)
- `deleteAccount()` - Deletes account (cascades)
- `upsertConversation()` - Creates or updates conversation
- `upsertMessage()` - Creates or updates message (prevents duplicates)
- `createSyncLog()` - Creates sync log entry
- `updateSyncLog()` - Updates sync log with results

### Phase 4: Scraper Implementation ✅

**File: `lib/scraper/ebay-scraper.ts`**
- `EbayKleinanzeigenScraper` class with Puppeteer
- `initialize()` - Launches headless browser
- `login()` - Authenticates with eBay Kleinanzeigen
- `fetchConversations()` - Scrapes inbox conversations
- `fetchMessages()` - Scrapes messages from a conversation
- `sendMessage()` - Sends a reply message
- `syncAccount()` - Syncs all conversations and messages
- `close()` - Cleans up browser resources

**File: `lib/scraper/selectors.ts`**
- CSS selectors for login page
- CSS selectors for inbox/conversations
- CSS selectors for message threads
- Alternative selectors as fallbacks
- URLs for eBay Kleinanzeigen pages

**File: `lib/scraper/parser.ts`**
- `parseConversations()` - Extracts conversation data from inbox
- `parseMessages()` - Extracts messages from thread
- `parseTimestamp()` - Parses German timestamps (e.g., "vor 2 Stunden")
- `isLoggedIn()` - Verifies authentication status

### Phase 3 Backend: Account Management API ✅

**Endpoints:**
- `GET /api/accounts` - List all accounts for authenticated user
- `POST /api/accounts` - Create new account (encrypts password)
- `GET /api/accounts/[id]` - Get single account
- `PATCH /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

**Features:**
- JWT authentication via Supabase Auth
- Input validation with Zod
- Ownership verification (RLS policies)
- Password encryption before storage
- Passwords excluded from API responses

### Phase 6: Reply Functionality ✅

**Endpoint:** `POST /api/messages/reply`

**Flow:**
1. Validate request body (`conversation_id`, `body`)
2. Verify user owns the conversation
3. Fetch decrypted account credentials
4. Initialize scraper and login
5. Send message via scraper
6. Save sent message to database
7. Return success response

### Phase 8: Automated Sync ✅

**Endpoint:** `POST /api/sync`
- Manually sync a specific account
- Fetches conversations and messages via scraper
- Updates database with new data
- Creates sync log for tracking

**Endpoint:** `POST /api/cron/sync-all`
- Automated sync for all active accounts
- Protected by `CRON_SECRET`
- Runs every 15 minutes (configurable in `vercel.json`)
- Handles errors gracefully per account

**File: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-all",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## API Endpoints

### Authentication

All API endpoints (except cron) require authentication via Supabase JWT token:

```
Authorization: Bearer <supabase-jwt-token>
```

### Account Management

#### `GET /api/accounts`
List all accounts for authenticated user.

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "account_name": "My Account",
      "is_active": true,
      "last_synced_at": "2026-02-12T10:30:00Z",
      "created_at": "2026-02-10T08:00:00Z",
      "updated_at": "2026-02-12T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### `POST /api/accounts`
Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "account_name": "My eBay Account"
}
```

**Response:**
```json
{
  "account": { /* account object */ },
  "message": "Account created successfully"
}
```

#### `GET /api/accounts/[id]`
Get a single account by ID.

#### `PATCH /api/accounts/[id]`
Update an account.

**Request:**
```json
{
  "email": "newemail@example.com",
  "password": "newPassword123",
  "account_name": "Updated Name",
  "is_active": false
}
```

#### `DELETE /api/accounts/[id]`
Delete an account (cascades to conversations and messages).

### Messaging

#### `POST /api/messages/reply`
Send a reply via eBay Kleinanzeigen scraper.

**Request:**
```json
{
  "conversation_id": "uuid",
  "body": "Your message here"
}
```

**Response:**
```json
{
  "message": "Reply sent successfully",
  "sent_message": { /* message object */ }
}
```

### Sync

#### `POST /api/sync`
Manually sync an account.

**Request:**
```json
{
  "account_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Sync completed successfully",
  "conversations_synced": 5,
  "messages_synced": 42,
  "sync_log_id": "uuid"
}
```

### Cron Jobs

#### `POST /api/cron/sync-all`
Automated sync for all active accounts (protected by CRON_SECRET).

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "message": "Cron sync completed",
  "accounts_synced": 3,
  "accounts_failed": 0,
  "results": [
    {
      "account_id": "uuid",
      "account_name": "My Account",
      "status": "success",
      "conversations": 5,
      "messages": 42
    }
  ]
}
```

---

## Security Features

### 1. Password Encryption
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Storage:** Encrypted passwords stored in database
- **Decryption:** Only happens when needed (login to eBay)

### 2. Row Level Security (RLS)
- All database tables have RLS enabled
- Users can only access their own data
- Policies enforce user_id matching

### 3. Authentication
- Supabase Auth JWT tokens required for all API routes
- Token validation on every request
- Ownership verification for resource access

### 4. Input Validation
- Zod schemas for all request bodies
- Type-safe validation with TypeScript
- Error messages returned for invalid input

### 5. Cron Job Protection
- `CRON_SECRET` required for automated sync
- Prevents unauthorized triggering

---

## Testing Guide

### 1. Test Account Creation

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kleinanzeigen.de",
    "password": "testPassword123",
    "account_name": "Test Account"
  }'
```

### 2. Test Account Listing

```bash
curl http://localhost:3000/api/accounts \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

### 3. Test Manual Sync

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "YOUR_ACCOUNT_UUID"
  }'
```

### 4. Test Reply Functionality

```bash
curl -X POST http://localhost:3000/api/messages/reply \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "YOUR_CONVERSATION_UUID",
    "body": "Hello, is this still available?"
  }'
```

### 5. Test Cron Job (Local)

```bash
curl -X POST http://localhost:3000/api/cron/sync-all \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Deployment Checklist

### Before Deploying to Vercel:

- [ ] **Environment Variables Set**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
  - [ ] `CRON_SECRET` (generate with `openssl rand -base64 32`)

- [ ] **Database Migrations Run**
  - [ ] `20260212000001_initial_schema.sql` executed in Supabase
  - [ ] `20260212000002_enable_realtime.sql` executed in Supabase
  - [ ] RLS policies enabled for all tables

- [ ] **Dependencies Installed**
  - [ ] `npm install` completed
  - [ ] Puppeteer dependencies available in Vercel environment

- [ ] **Testing Completed**
  - [ ] Account creation tested
  - [ ] Account update tested
  - [ ] Manual sync tested
  - [ ] Reply functionality tested
  - [ ] Cron job tested locally

- [ ] **Vercel Configuration**
  - [ ] `vercel.json` pushed to repository
  - [ ] Cron job enabled in Vercel dashboard
  - [ ] Environment variables configured in Vercel

### Post-Deployment:

- [ ] Test API endpoints on production URL
- [ ] Monitor cron job execution logs
- [ ] Verify scraper works in production environment
- [ ] Check error logging and monitoring

---

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Key (Generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_encryption_key_here

# Cron Job Secret (Generate with: openssl rand -base64 32)
CRON_SECRET=your_cron_secret_here

# Optional: Development
NODE_ENV=development
```

### Generate Secure Keys:

```bash
# Generate ENCRYPTION_KEY
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (ownership check failed)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Performance Considerations

### 1. Database Indexes
All performance-critical columns have indexes:
- `conversations.account_id`
- `conversations.last_message_at`
- `messages.account_id`
- `messages.conversation_id`
- `messages.timestamp`
- `messages.is_read`

### 2. Rate Limiting
- 2-second delay between account syncs in cron job
- 1-second delay between conversation fetches

### 3. Resource Cleanup
- Browser instances closed after each sync
- Error handling includes cleanup in `finally` blocks

### 4. Caching Considerations
- Consider implementing Redis cache for frequently accessed data
- Cache decrypted credentials during sync to avoid repeated decryption

---

## Next Steps

### Frontend Integration
1. Create account management UI
2. Build unified inbox UI
3. Implement real-time updates with Supabase Realtime
4. Add push notifications

### Enhancements
1. Add rate limiting middleware
2. Implement request/response logging
3. Add metrics and monitoring
4. Create admin dashboard
5. Add bulk actions for messages

---

## Troubleshooting

### Scraper Login Fails
- Check if eBay Kleinanzeigen changed their HTML structure
- Update selectors in `lib/scraper/selectors.ts`
- Enable headless: false in `ebay-scraper.ts` for debugging
- Use `screenshot()` method to capture current state

### Encryption Errors
- Verify `ENCRYPTION_KEY` is set and consistent
- Ensure key is at least 32 bytes when base64 decoded
- Check if data was encrypted with a different key

### Cron Job Not Running
- Verify `vercel.json` is in repository root
- Check Vercel dashboard for cron job status
- Ensure `CRON_SECRET` matches in environment variables
- Check Vercel function logs for errors

### Database Permission Errors
- Verify RLS policies are correctly configured
- Check if user is authenticated
- Ensure JWT token is valid and not expired

---

## Support

For issues or questions:
1. Check Vercel function logs
2. Check Supabase logs
3. Review error messages in API responses
4. Test with Postman/Thunder Client

---

**Last Updated:** February 12, 2026
**Version:** 1.0.0
