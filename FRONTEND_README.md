# Frontend Implementation - eBay Kleinanzeigen Multi-Account Platform

## Overview

This document provides a comprehensive overview of the frontend implementation for the eBay Kleinanzeigen Multi-Account Messaging Platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** lucide-react
- **Date Formatting:** date-fns
- **Notifications:** sonner (toast notifications)
- **State Management:** React Hooks (useState, useEffect)
- **Data Fetching:** Fetch API + Custom Hooks
- **Real-time:** Supabase Realtime

## Project Structure

```
kleinanzeigen-app/
├── app/
│   ├── dashboard/
│   │   ├── accounts/
│   │   │   └── page.tsx          # Account management page
│   │   ├── inbox/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Individual conversation view
│   │   │   └── page.tsx          # Unified inbox with 2-column layout
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page
│   │   ├── layout.tsx            # Dashboard layout with navigation
│   │   ├── loading.tsx           # Loading state
│   │   └── page.tsx              # Main dashboard
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   └── switch.tsx
│   ├── AccountCard.tsx           # Display single account
│   ├── AddAccountDialog.tsx      # Dialog to add new account
│   ├── ConversationList.tsx      # Sidebar with conversation list
│   ├── MessageBubble.tsx         # Single message bubble
│   ├── MessageThread.tsx         # Main conversation thread
│   ├── NotificationPermissionBanner.tsx  # Permission request UI
│   └── ReplyInput.tsx            # Message input field
├── hooks/
│   ├── useConversations.ts       # Fetch conversations with filters
│   └── useMessages.ts            # Fetch messages + Realtime updates
├── lib/
│   ├── notifications/
│   │   └── push.ts               # Browser notification utilities
│   ├── toast.ts                  # Toast notification helpers
│   └── supabase.ts               # Supabase client
├── public/
│   └── sw.js                     # Service Worker for notifications
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Key Features Implemented

### Phase 3: Account Management UI ✅

**Components:**
- `AddAccountDialog.tsx` - Modal dialog for adding new accounts with validation
- `AccountCard.tsx` - Card component displaying account info with edit/delete actions
- `app/dashboard/accounts/page.tsx` - Account management page with grid layout

**Features:**
- Add new accounts with email, password, and nickname
- Edit account credentials and nickname
- Toggle account active/inactive status
- Delete accounts with confirmation dialog
- Maximum 5 accounts limit enforcement
- Real-time sync status display
- Password show/hide toggle
- Toast notifications for all actions

### Phase 5: Unified Inbox UI ✅

**Components:**
- `ConversationList.tsx` - Scrollable list of conversations
- `MessageThread.tsx` - Main conversation view with header
- `MessageBubble.tsx` - Individual message component
- `ReplyInput.tsx` - Text input with send button
- `app/dashboard/inbox/page.tsx` - 2-column inbox layout

**Features:**
- Two-column layout (conversation list + message thread)
- Filter conversations by account
- Filter by unread status
- Real-time message updates via Supabase Realtime
- Unread indicators (blue dot, badge)
- Timestamp formatting (relative time)
- Empty states for no conversations
- Pagination with "Load More" button
- Message grouping (sent vs received)
- Responsive design (mobile/tablet/desktop)

### Phase 7: Push Notifications ✅

**Components:**
- `NotificationPermissionBanner.tsx` - Permission request UI
- `lib/notifications/push.ts` - Notification utilities
- `public/sw.js` - Service Worker

**Features:**
- Browser notification support detection
- Permission request with banner
- Service Worker registration
- Notification click handling (navigate to conversation)
- Hide banner after 3 denied attempts
- Respect browser "Do Not Disturb" mode
- Settings page for notification preferences
- Per-account notification toggles (prepared for backend)

### Phase 9: UI Polish & Error Handling ✅

**Components:**
- `app/error.tsx` - Global error boundary
- `app/not-found.tsx` - 404 page
- `app/dashboard/loading.tsx` - Loading skeletons
- `lib/toast.ts` - Toast notification helpers

**Features:**
- Skeleton loaders for all pages
- Toast notifications for success/error states
- Empty states with illustrations
- Error boundaries with retry functionality
- Responsive navigation bar
- Consistent design system
- Loading states for all async operations
- Accessibility improvements (ARIA labels, keyboard navigation)

## Custom Hooks

### `useConversations`

Fetches and manages conversations with filtering and pagination.

```typescript
const {
  conversations,
  isLoading,
  error,
  hasMore,
  totalCount,
  refetch,
  loadMore
} = useConversations({
  accountId: 'uuid',        // Optional: Filter by account
  unreadOnly: false,         // Optional: Show only unread
  limit: 50,                 // Optional: Items per page
  offset: 0                  // Optional: Pagination offset
})
```

### `useMessages`

Fetches messages for a conversation with real-time updates.

```typescript
const {
  messages,
  isLoading,
  error,
  refetch,
  sendMessage
} = useMessages({
  conversationId: 'uuid',
  enabled: true              // Enable/disable fetching
})
```

## shadcn/ui Components Used

- **button** - Primary, secondary, outline, destructive variants
- **card** - Container for account cards, stats, etc.
- **input** - Text inputs for forms
- **dialog** - Modal dialogs for add/edit/delete actions
- **badge** - Status indicators (active, unread count)
- **sonner** - Toast notifications
- **skeleton** - Loading placeholders
- **alert** - Error/warning messages
- **switch** - Toggle switches (active/inactive, unread filter)
- **select** - Dropdown for account filter

## Responsive Design

### Breakpoints
- **Mobile:** < 768px (full-width layout)
- **Tablet:** 768px - 1024px (2-column layout)
- **Desktop:** > 1024px (optimized 2-column layout)

### Mobile Optimizations
- Collapsible sidebar for inbox
- Hamburger menu for navigation
- Stack layout for dashboard cards
- Touch-friendly button sizes
- Bottom navigation bar (optional)

## Accessibility

- Semantic HTML elements (`<nav>`, `<main>`, `<button>`)
- ARIA labels for screen readers
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators for all interactive elements
- Color contrast ratios meet WCAG 2.1 AA standards
- Alt text for all images (when added)

## Performance Optimizations

- Lazy loading for conversations (pagination)
- Real-time updates only for active conversation
- Skeleton loaders prevent layout shift
- Image optimization (when images added)
- Code splitting via Next.js App Router
- Minimal re-renders via React.memo (where needed)

## State Management

- **Local State:** React `useState` for component-level state
- **Global State:** None currently (could add Zustand/Jotai if needed)
- **Server State:** Custom hooks with Fetch API
- **Real-time:** Supabase Realtime subscriptions

## API Integration

All API calls use the Fetch API with error handling:

```typescript
const response = await fetch('/api/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message)
}

const result = await response.json()
```

## Environment Variables

Frontend requires the following environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Frontend

### Development
```bash
npm run dev
```
Access at: http://localhost:3000

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Known Issues & TODOs

### Known Issues
- Service Worker requires HTTPS in production
- Safari < 16 has limited notification support
- Some linting warnings remain (non-critical)

### Future Enhancements
- [ ] Dark mode support
- [ ] Search/filter conversations by content
- [ ] Bulk actions (mark all as read, delete multiple)
- [ ] Conversation archiving
- [ ] Message drafts (saved locally)
- [ ] Rich text editor for replies
- [ ] Image/file attachments in replies
- [ ] Conversation tags/labels
- [ ] Export conversations to PDF/CSV
- [ ] Keyboard shortcuts (J/K navigation, etc.)
- [ ] Offline support with Service Worker cache

## Testing

### Manual Testing Checklist

**Account Management:**
- [ ] Add account with valid credentials
- [ ] Add account with invalid credentials (shows error)
- [ ] Edit account nickname
- [ ] Edit account password
- [ ] Toggle account active/inactive
- [ ] Delete account (with confirmation)
- [ ] Try adding 6th account (blocked)

**Inbox:**
- [ ] View all conversations
- [ ] Filter by account
- [ ] Filter by unread status
- [ ] Click conversation to view messages
- [ ] Send reply message
- [ ] Real-time message updates (test in 2 tabs)
- [ ] Pagination (load more)

**Notifications:**
- [ ] Permission banner shows on first visit
- [ ] Enable notifications (browser prompt)
- [ ] Notifications show for new messages
- [ ] Click notification opens conversation
- [ ] Dismiss banner (persists across sessions)

**Error Handling:**
- [ ] Network error shows toast
- [ ] API error shows toast
- [ ] 404 page works
- [ ] Error boundary catches errors

## Design System

### Colors
- **Primary:** Blue-600 (#3B82F6)
- **Success:** Green-600 (#16A34A)
- **Error:** Red-600 (#DC2626)
- **Warning:** Yellow-600 (#CA8A04)
- **Gray Scale:** Gray-50 to Gray-900

### Typography
- **Font:** Geist Sans (primary), Geist Mono (code)
- **Headings:** Bold, 2xl-4xl
- **Body:** Regular, sm-base
- **Captions:** sm, gray-600

### Spacing
- **Padding:** p-4 (1rem), p-6 (1.5rem), p-8 (2rem)
- **Margin:** mb-4, mb-6, mb-8
- **Gap:** gap-2, gap-4, gap-6

## Browser Support

- **Chrome:** 90+ ✅
- **Firefox:** 88+ ✅
- **Safari:** 14+ ✅ (limited notifications in < 16)
- **Edge:** 90+ ✅
- **Internet Explorer:** ❌ Not supported

## Contributing

When adding new components:
1. Check shadcn/ui for existing components first
2. Use TypeScript for all components
3. Add proper types from `types/index.ts`
4. Use Tailwind CSS for styling (no inline styles)
5. Add loading/error states
6. Add toast notifications for user actions
7. Test on mobile and desktop
8. Run `npm run lint` before committing

## Support

For issues or questions about the frontend implementation, refer to:
- Feature Specs: `/features/*.md`
- Supabase Setup: `SUPABASE_SETUP.md`
- Main README: `README.md`
