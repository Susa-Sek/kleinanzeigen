/**
 * CSS Selectors for eBay Kleinanzeigen
 * These may need updates if eBay changes their HTML structure
 * Last updated: February 2026
 */

export const SELECTORS = {
  // Login Page
  LOGIN: {
    EMAIL_INPUT: '#login-email',
    PASSWORD_INPUT: '#login-password',
    SUBMIT_BUTTON: '#login-submit',
    ERROR_MESSAGE: '.messagebox--error',
    // Alternative selectors (backup)
    EMAIL_INPUT_ALT: 'input[name="email"]',
    PASSWORD_INPUT_ALT: 'input[name="password"]',
    SUBMIT_BUTTON_ALT: 'button[type="submit"]',
  },

  // Inbox/Messages Page
  INBOX: {
    CONVERSATIONS_LIST: '#conversation-list',
    CONVERSATION_ITEM: '.conversation-item',
    CONVERSATION_LINK: 'a.conversation-link',
    PARTNER_NAME: '.conversation-partner-name',
    LAST_MESSAGE_PREVIEW: '.conversation-last-message',
    TIMESTAMP: '.conversation-timestamp',
    UNREAD_BADGE: '.unread-badge',
    LISTING_TITLE: '.conversation-listing-title',
    LISTING_URL: '.conversation-listing-link',
    // Alternative selectors
    CONVERSATION_ITEM_ALT: '[data-testid="conversation-item"]',
  },

  // Conversation/Thread Page
  CONVERSATION: {
    MESSAGE_CONTAINER: '#message-thread',
    MESSAGE_ITEM: '.message-item',
    MESSAGE_SENDER: '.message-sender',
    MESSAGE_BODY: '.message-body',
    MESSAGE_TIMESTAMP: '.message-timestamp',
    MESSAGE_ID: '[data-message-id]',
    REPLY_TEXTAREA: '#reply-message',
    SEND_BUTTON: '#send-message-button',
    ATTACHMENT_LINK: '.message-attachment',
    // Alternative selectors
    MESSAGE_ITEM_ALT: '[data-testid="message"]',
    REPLY_TEXTAREA_ALT: 'textarea[name="message"]',
  },

  // Common Elements
  COMMON: {
    LOADING_SPINNER: '.spinner, .loading',
    ERROR_BANNER: '.error-banner, .alert-error',
    SUCCESS_BANNER: '.success-banner, .alert-success',
  },

  // URLs
  URLS: {
    BASE: 'https://www.kleinanzeigen.de',
    LOGIN: 'https://www.kleinanzeigen.de/m-einloggen.html',
    INBOX: 'https://www.kleinanzeigen.de/m-nachrichten.html',
    CONVERSATION: 'https://www.kleinanzeigen.de/m-nachrichten-lesen.html',
  },
} as const;

/**
 * Helper function to get multiple possible selectors
 */
export function getAlternativeSelectors(primary: string, alternative: string): string {
  return `${primary}, ${alternative}`;
}

/**
 * Wait for selector with multiple alternatives
 */
export async function waitForAnySelector(
  page: any,
  selectors: string[],
  timeout = 10000
): Promise<string | null> {
  try {
    const selector = await Promise.race(
      selectors.map(async (sel) => {
        try {
          await page.waitForSelector(sel, { timeout });
          return sel;
        } catch {
          return null;
        }
      })
    );
    return selector;
  } catch {
    return null;
  }
}
