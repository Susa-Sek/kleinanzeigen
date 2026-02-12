import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getAccountCredentials,
  updateLastSyncedAt,
  upsertConversation,
  upsertMessage,
  createSyncLog,
  updateSyncLog,
} from '@/lib/db/helpers';
import { createScraper, EbayKleinanzeigenScraper } from '@/lib/scraper/ebay-scraper';

/**
 * POST /api/cron/sync-all
 * Cron job endpoint to sync all active accounts
 *
 * This endpoint is protected by CRON_SECRET and should only be called by Vercel Cron
 * or other trusted cron services.
 *
 * Headers:
 * - Authorization: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('Starting cron sync-all job...');

    // Fetch all active accounts using service role (bypass RLS)
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      console.log('No active accounts to sync');
      return NextResponse.json({
        message: 'No active accounts to sync',
        accounts_synced: 0,
      });
    }

    console.log(`Found ${accounts.length} active accounts to sync`);

    const results = [];

    // Sync each account
    for (const account of accounts) {
      let scraper: EbayKleinanzeigenScraper | undefined = undefined;
      let totalMessagesSynced = 0;

      // Create sync log
      const syncLog = await createSyncLog({
        account_id: account.id,
        sync_started_at: new Date().toISOString(),
      });

      try {
        console.log(`Syncing account: ${account.email} (${account.account_name})`);

        // Get decrypted credentials
        const credentials = await getAccountCredentials(account.id);

        // Initialize scraper
        scraper = await createScraper();

        // Login
        await scraper.login(credentials.email, credentials.password);

        // Sync conversations and messages
        const { conversations, messagesByConversation } = await scraper.syncAccount(
          credentials.email
        );

        console.log(`Processing ${conversations.length} conversations for ${account.email}`);

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

        // Update last_synced_at
        await updateLastSyncedAt(account.id);

        results.push({
          account_id: account.id,
          account_name: account.account_name,
          status: 'success',
          conversations: conversations.length,
          messages: totalMessagesSynced,
        });

        console.log(`✓ Synced ${account.email}: ${totalMessagesSynced} messages`);
      } catch (error: any) {
        console.error(`Error syncing account ${account.email}:`, error);

        // Update sync log with error
        await updateSyncLog(
          syncLog.id,
          'error',
          totalMessagesSynced,
          error.message
        );

        results.push({
          account_id: account.id,
          account_name: account.account_name,
          status: 'error',
          error: error.message,
        });
      } finally {
        // Clean up scraper
        if (scraper) {
          try {
            await scraper.close();
          } catch (closeError) {
            console.error('Error closing scraper:', closeError);
          }
        }
      }

      // Small delay between accounts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    console.log(`Cron sync completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      message: 'Cron sync completed',
      accounts_synced: successCount,
      accounts_failed: errorCount,
      results,
    });
  } catch (error: any) {
    console.error('POST /api/cron/sync-all error:', error);

    return NextResponse.json(
      {
        error: 'Cron sync failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/sync-all
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Cron sync endpoint is healthy',
    timestamp: new Date().toISOString(),
  });
}
