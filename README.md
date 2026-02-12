# eBay Kleinanzeigen Multi-Account Messenger

A unified inbox for managing multiple eBay Kleinanzeigen accounts.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers
- **Database**: Supabase (PostgreSQL)
- **Scraping**: Puppeteer
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
kleinanzeigen-app/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utility functions and Supabase client
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Features (In Development)

- Multi-account management
- Unified inbox for all accounts
- Real-time message sync
- Reply functionality
- Push notifications
- Automated background sync

## Development Status

**Phase 1: Project Setup** - COMPLETE
- Next.js project initialized
- Dependencies installed (Supabase, Zod, Puppeteer, shadcn/ui)
- Basic structure created
- Supabase client configured
- Landing page created

**Phase 2: Database Schema & Supabase Setup** - COMPLETE
- Database schema created (accounts, conversations, messages, sync_logs)
- SQL migrations ready in `supabase/migrations/`
- Row Level Security (RLS) policies configured
- Realtime enabled for messages and conversations
- TypeScript types updated to match schema
- Zod validation schemas created
- Setup guide created (see `SUPABASE_SETUP.md`)

**Next: Phase 3** - Account Management UI
