import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getConversationById,
  getAccountCredentials,
  upsertMessage,
} from '@/lib/db/helpers';
import { createScraper, EbayKleinanzeigenScraper } from '@/lib/scraper/ebay-scraper';
import { sendMessageSchema } from '@/lib/validations';
import { z } from 'zod';

/**
 * POST /api/messages/reply
 * Send a reply message via eBay Kleinanzeigen scraper
 *
 * Body:
 * {
 *   conversation_id: string (UUID),
 *   body: string (message content)
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
    const validationResult = sendMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { conversation_id, body: messageBody } = validationResult.data;

    // Fetch conversation
    const conversation = await getConversationById(conversation_id);

    // Verify ownership via account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', conversation.account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this conversation' },
        { status: 403 }
      );
    }

    // Get decrypted credentials
    const credentials = await getAccountCredentials(conversation.account_id);

    // Initialize scraper
    scraper = await createScraper();

    // Login to eBay Kleinanzeigen
    await scraper.login(credentials.email, credentials.password);

    // Send message
    // Note: conversation.listing_url or partner-specific URL should be stored
    // For now, we'll assume we can construct the URL or it's stored
    const conversationUrl = conversation.listing_url || '/m-nachrichten-lesen.html'; // Fallback URL
    await scraper.sendMessage(conversationUrl, messageBody);

    // Save sent message to database
    const sentMessage = await upsertMessage({
      account_id: conversation.account_id,
      conversation_id: conversation.id,
      sender: credentials.email,
      recipient: conversation.partner_name,
      subject: undefined,
      body: messageBody,
      timestamp: new Date().toISOString(),
      is_read: true, // Our sent messages are already "read"
      ebay_message_id: `sent-${Date.now()}-${Math.random()}`, // Generate unique ID
    });

    // Close scraper
    await scraper.close();
    scraper = undefined;

    return NextResponse.json({
      message: 'Reply sent successfully',
      sent_message: sentMessage,
    });
  } catch (error: any) {
    console.error('POST /api/messages/reply error:', error);

    // Clean up scraper
    if (scraper) {
      try {
        await scraper.close();
      } catch (closeError) {
        console.error('Error closing scraper:', closeError);
      }
    }

    // Handle specific errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Conversation not found' },
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
        error: 'Failed to send reply',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
