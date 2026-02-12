/**
 * HTML parsing utilities for extracting data from eBay Kleinanzeigen pages
 */

import type { Page } from 'puppeteer';
import { SELECTORS } from './selectors';

export interface ScrapedConversation {
  partner_name: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  listing_title?: string;
  listing_url?: string;
  conversation_url: string;
}

export interface ScrapedMessage {
  sender: string;
  recipient: string;
  body: string;
  timestamp: string;
  ebay_message_id: string;
  is_read: boolean;
  attachment_url?: string;
}

/**
 * Parse timestamp from German text (e.g., "vor 2 Stunden", "Gestern 14:30", "12.02.2026")
 * This is a helper function that will be injected into the browser context
 */
const parseTimestampHelper = `
function parseTimestamp(text) {
  const now = new Date();

  // "vor X Minuten/Stunden"
  if (text.includes('vor')) {
    const minutes = text.match(/(\\d+)\\s*Minute/i);
    const hours = text.match(/(\\d+)\\s*Stunde/i);
    const days = text.match(/(\\d+)\\s*Tag/i);

    if (minutes) {
      now.setMinutes(now.getMinutes() - parseInt(minutes[1]));
    } else if (hours) {
      now.setHours(now.getHours() - parseInt(hours[1]));
    } else if (days) {
      now.setDate(now.getDate() - parseInt(days[1]));
    }

    return now.toISOString();
  }

  // "Heute HH:MM"
  if (text.includes('Heute')) {
    const time = text.match(/(\\d{1,2}):(\\d{2})/);
    if (time) {
      now.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }
    return now.toISOString();
  }

  // "Gestern HH:MM"
  if (text.includes('Gestern')) {
    const time = text.match(/(\\d{1,2}):(\\d{2})/);
    if (time) {
      now.setDate(now.getDate() - 1);
      now.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }
    return now.toISOString();
  }

  // "DD.MM.YYYY" or "DD.MM."
  const dateMatch = text.match(/(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();

    const date = new Date(year, month, day);

    // Extract time if present
    const time = text.match(/(\\d{1,2}):(\\d{2})/);
    if (time) {
      date.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }

    return date.toISOString();
  }

  // Fallback: return current time
  return now.toISOString();
}
`;

/**
 * Parse conversations from inbox page
 */
export async function parseConversations(page: Page): Promise<ScrapedConversation[]> {
  return page.evaluate((SELECTORS, parseTimestampCode) => {
    // Inject parseTimestamp function
    eval(parseTimestampCode);

    const conversations: ScrapedConversation[] = [];
    const items = document.querySelectorAll(
      `${SELECTORS.INBOX.CONVERSATION_ITEM}, ${SELECTORS.INBOX.CONVERSATION_ITEM_ALT}`
    );

    items.forEach((item) => {
      try {
        // Extract conversation link
        const link = item.querySelector('a')?.getAttribute('href');
        if (!link) return;

        // Extract partner name
        const partnerNameEl = item.querySelector(SELECTORS.INBOX.PARTNER_NAME);
        const partner_name = partnerNameEl?.textContent?.trim() || 'Unknown';

        // Extract last message preview
        const lastMessageEl = item.querySelector(SELECTORS.INBOX.LAST_MESSAGE_PREVIEW);
        const last_message_preview = lastMessageEl?.textContent?.trim() || '';

        // Extract timestamp
        const timestampEl = item.querySelector(SELECTORS.INBOX.TIMESTAMP);
        const timestampText = timestampEl?.textContent?.trim() || '';
        const last_message_at = parseTimestamp(timestampText);

        // Extract unread count
        const unreadBadge = item.querySelector(SELECTORS.INBOX.UNREAD_BADGE);
        const unread_count = parseInt(unreadBadge?.textContent?.trim() || '0', 10);

        // Extract listing info (if available)
        const listingTitleEl = item.querySelector(SELECTORS.INBOX.LISTING_TITLE);
        const listing_title = listingTitleEl?.textContent?.trim();

        const listingLinkEl = item.querySelector(SELECTORS.INBOX.LISTING_URL);
        const listing_url = listingLinkEl?.getAttribute('href') || undefined;

        conversations.push({
          partner_name,
          last_message_preview,
          last_message_at,
          unread_count,
          listing_title,
          listing_url,
          conversation_url: link,
        });
      } catch (error) {
        console.error('Error parsing conversation item:', error);
      }
    });

    return conversations;
  }, SELECTORS, parseTimestampHelper);
}

/**
 * Parse messages from a conversation thread
 */
export async function parseMessages(
  page: Page,
  accountEmail: string
): Promise<ScrapedMessage[]> {
  return page.evaluate((SELECTORS, accountEmail, parseTimestampCode) => {
    // Inject parseTimestamp function
    eval(parseTimestampCode);

    const messages: ScrapedMessage[] = [];
    const items = document.querySelectorAll(
      `${SELECTORS.CONVERSATION.MESSAGE_ITEM}, ${SELECTORS.CONVERSATION.MESSAGE_ITEM_ALT}`
    );

    items.forEach((item, index) => {
      try {
        // Extract sender
        const senderEl = item.querySelector(SELECTORS.CONVERSATION.MESSAGE_SENDER);
        const sender = senderEl?.textContent?.trim() || 'Unknown';

        // Determine if this is our message or theirs
        const is_from_us = sender === accountEmail || item.classList.contains('message-sent');

        // Extract message body
        const bodyEl = item.querySelector(SELECTORS.CONVERSATION.MESSAGE_BODY);
        const body = bodyEl?.textContent?.trim() || '';

        // Extract timestamp
        const timestampEl = item.querySelector(SELECTORS.CONVERSATION.MESSAGE_TIMESTAMP);
        const timestampText = timestampEl?.textContent?.trim() || '';
        const timestamp = parseTimestamp(timestampText);

        // Extract message ID (or generate one)
        const messageIdAttr = item.getAttribute('data-message-id');
        const ebay_message_id = messageIdAttr || `msg-${timestamp}-${index}`;

        // Check if read (usually all fetched messages are already read)
        const is_read = !item.classList.contains('unread');

        // Extract attachment URL if exists
        const attachmentEl = item.querySelector(SELECTORS.CONVERSATION.ATTACHMENT_LINK);
        const attachment_url = attachmentEl?.getAttribute('href') || undefined;

        // Determine recipient (opposite of sender)
        const recipient = is_from_us ? 'Partner' : accountEmail;

        messages.push({
          sender: is_from_us ? accountEmail : sender,
          recipient,
          body,
          timestamp,
          ebay_message_id,
          is_read,
          attachment_url,
        });
      } catch (error) {
        console.error('Error parsing message item:', error);
      }
    });

    return messages;
  }, SELECTORS, accountEmail, parseTimestampHelper);
}

/**
 * Parse timestamp from German text (e.g., "vor 2 Stunden", "Gestern 14:30", "12.02.2026")
 * This is the Node.js version for server-side use
 */
export function parseTimestamp(text: string): string {
  const now = new Date();

  // "vor X Minuten/Stunden"
  if (text.includes('vor')) {
    const minutes = text.match(/(\d+)\s*Minute/i);
    const hours = text.match(/(\d+)\s*Stunde/i);
    const days = text.match(/(\d+)\s*Tag/i);

    if (minutes) {
      now.setMinutes(now.getMinutes() - parseInt(minutes[1]));
    } else if (hours) {
      now.setHours(now.getHours() - parseInt(hours[1]));
    } else if (days) {
      now.setDate(now.getDate() - parseInt(days[1]));
    }

    return now.toISOString();
  }

  // "Heute HH:MM"
  if (text.includes('Heute')) {
    const time = text.match(/(\d{1,2}):(\d{2})/);
    if (time) {
      now.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }
    return now.toISOString();
  }

  // "Gestern HH:MM"
  if (text.includes('Gestern')) {
    const time = text.match(/(\d{1,2}):(\d{2})/);
    if (time) {
      now.setDate(now.getDate() - 1);
      now.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }
    return now.toISOString();
  }

  // "DD.MM.YYYY" or "DD.MM."
  const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();

    const date = new Date(year, month, day);

    // Extract time if present
    const time = text.match(/(\d{1,2}):(\d{2})/);
    if (time) {
      date.setHours(parseInt(time[1]), parseInt(time[2]), 0, 0);
    }

    return date.toISOString();
  }

  // Fallback: return current time
  return now.toISOString();
}

/**
 * Extract text content safely
 */
export function safeExtractText(element: Element | null): string {
  return element?.textContent?.trim() || '';
}

/**
 * Extract attribute safely
 */
export function safeExtractAttribute(
  element: Element | null,
  attribute: string
): string | undefined {
  const value = element?.getAttribute(attribute);
  return value || undefined;
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page, timeout = 10000): Promise<void> {
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
}

/**
 * Check if we're logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for logout button or user menu
    const logoutButton = await page.$('a[href*="logout"], .user-menu');
    return logoutButton !== null;
  } catch {
    return false;
  }
}
