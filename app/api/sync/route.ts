import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getAccountById,
  getAccountCredentials,
  updateLastSyncedAt,
  upsertConversation,
  upsertMessage,
  createSyncLog,
  updateSyncLog,
} from '@/lib/db/helpers';
import { createScraper, EbayKleinanzeigenScraper } from '@/lib/scraper/ebay-scraper';
import { syncAccountSchema } from '@/lib/validations';

/**
 * POST /api/sync
 * Manually sync messages from eBay Kleinanzeigen for a specific account
 *
 * Body:
 * {
 *   account_id: string (UUID)
 * }
 */
export async function POST(request: NextRequest) {
  let scraper: EbayKleinanzeigenScraper | undefined = undefined;

  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = syncAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { account_id } = validationResult.data;

    // Fetch account and verify ownership
    const account = await getAccountById(account_id);

    if (account.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this account' },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!account.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive. Activate it before syncing.' },
        { status: 400 }
      );
    }

    // Create sync log
    const syncLog = await createSyncLog({
      account_id: account.id,
      sync_started_at: new Date().toISOString(),
    });

    let totalMessagesSynced = 0;

    try {
      // Get decrypted credentials
      const credentials = await getAccountCredentials(account.id);

      // Initialize scraper
      scraper = await createScraper();

      // Login
      await scraper.login(credentials.email, credentials.password);

      // Sync all conversations and messages
      const { conversations, messagesByConversation } = await scraper.syncAccount(
        credentials.email
      );

      console.log(`Syncing ${conversations.length} conversations for account ${account.email}`);

      // Process each conversation
      for (const conv of conversations) {
        // Upsert conversation
        const dbConversation = await upsertConversation({
          account_id: account.id,
          partner_name: conv.partner_name,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count,
          listing_title: conv.listing_title,
          listing_url: conv.listing_url || conv.conversation_url,
        });

        // Get messages for this conversation
        const messages = messagesByConversation.get(conv.conversation_url) || [];

        // Upsert messages
        for (const msg of messages) {
          await upsertMessage({
            account_id: account.id,
            conversation_id: dbConversation.id,
            sender: msg.sender,
            recipient: msg.recipient,
            subject: undefined,
            body: msg.body,
            timestamp: msg.timestamp,
            is_read: msg.is_read,
            ebay_message_id: msg.ebay_message_id,
            attachment_url: msg.attachment_url,
          });

          totalMessagesSynced++;
        }
      }

      // Update sync log with success
      await updateSyncLog(syncLog.id, 'success', totalMessagesSynced);

      // Update last_synced_at timestamp
      await updateLastSyncedAt(account.id);

      // Close scraper
      await scraper.close();
      scraper = undefined;

      return NextResponse.json({
        message: 'Sync completed successfully',
        conversations_synced: conversations.length,
        messages_synced: totalMessagesSynced,
        sync_log_id: syncLog.id,
      });
    } catch (syncError: any) {
      console.error('Sync error:', syncError);

      // Update sync log with error
      await updateSyncLog(
        syncLog.id,
        'error',
        totalMessagesSynced,
        syncError.message
      );

      // Clean up scraper on error
      if (scraper) {
        try {
          await scraper.close();
        } catch (closeError) {
          console.error('Error closing scraper:', closeError);
        }
      }

      throw syncError;
    }
  } catch (error: any) {
    console.error('POST /api/sync error:', error);

    // Handle specific errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Login failed')) {
      return NextResponse.json(
        { error: 'Failed to login to eBay Kleinanzeigen. Please check credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
