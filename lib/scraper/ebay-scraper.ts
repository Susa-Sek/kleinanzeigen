/**
 * eBay Kleinanzeigen Web Scraper using Puppeteer
 * Handles login, fetching conversations, messages, and sending replies
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { SELECTORS } from './selectors';
import { parseConversations, parseMessages, isLoggedIn } from './parser';
import type { ScrapedConversation, ScrapedMessage } from './parser';

export class EbayKleinanzeigenScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isAuthenticated = false;

  /**
   * Initialize browser and page
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      console.log('Browser already initialized');
      return;
    }

    this.browser = await puppeteer.launch({
      headless: true, // Set to false for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });

    this.page = await this.browser.newPage();

    // Set realistic viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Enable request interception for blocking unnecessary resources
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('Browser initialized');
  }

  /**
   * Login to eBay Kleinanzeigen
   */
  async login(email: string, password: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      console.log(`Attempting login for ${email}...`);

      // Navigate to login page
      await this.page.goto(SELECTORS.URLS.LOGIN, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for login form
      await this.page.waitForSelector(
        `${SELECTORS.LOGIN.EMAIL_INPUT}, ${SELECTORS.LOGIN.EMAIL_INPUT_ALT}`,
        { timeout: 10000 }
      );

      // Fill in email
      const emailInput = await this.page.$(SELECTORS.LOGIN.EMAIL_INPUT) ||
                         await this.page.$(SELECTORS.LOGIN.EMAIL_INPUT_ALT);
      if (!emailInput) throw new Error('Email input not found');
      await emailInput.type(email, { delay: 100 });

      // Fill in password
      const passwordInput = await this.page.$(SELECTORS.LOGIN.PASSWORD_INPUT) ||
                            await this.page.$(SELECTORS.LOGIN.PASSWORD_INPUT_ALT);
      if (!passwordInput) throw new Error('Password input not found');
      await passwordInput.type(password, { delay: 100 });

      // Submit form
      const submitButton = await this.page.$(SELECTORS.LOGIN.SUBMIT_BUTTON) ||
                           await this.page.$(SELECTORS.LOGIN.SUBMIT_BUTTON_ALT);
      if (!submitButton) throw new Error('Submit button not found');

      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        submitButton.click(),
      ]);

      // Check for login errors
      const errorMessage = await this.page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
      if (errorMessage) {
        const errorText = await errorMessage.evaluate((el) => el.textContent);
        throw new Error(`Login failed: ${errorText}`);
      }

      // Verify login success
      this.isAuthenticated = await isLoggedIn(this.page);

      if (!this.isAuthenticated) {
        throw new Error('Login failed: not authenticated after form submission');
      }

      console.log('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Fetch all conversations from inbox
   */
  async fetchConversations(): Promise<ScrapedConversation[]> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Not authenticated. Call login() first.');
    }

    try {
      console.log('Fetching conversations...');

      // Navigate to inbox
      await this.page.goto(SELECTORS.URLS.INBOX, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for conversations to load
      await this.page.waitForSelector(
        `${SELECTORS.INBOX.CONVERSATION_ITEM}, ${SELECTORS.INBOX.CONVERSATION_ITEM_ALT}`,
        { timeout: 10000 }
      );

      // Parse conversations
      const conversations = await parseConversations(this.page);

      console.log(`Fetched ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Fetch messages from a specific conversation
   */
  async fetchMessages(
    conversationUrl: string,
    accountEmail: string
  ): Promise<ScrapedMessage[]> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Not authenticated. Call login() first.');
    }

    try {
      console.log(`Fetching messages from ${conversationUrl}...`);

      // Navigate to conversation
      const fullUrl = conversationUrl.startsWith('http')
        ? conversationUrl
        : `${SELECTORS.URLS.BASE}${conversationUrl}`;

      await this.page.goto(fullUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for messages to load
      await this.page.waitForSelector(
        `${SELECTORS.CONVERSATION.MESSAGE_ITEM}, ${SELECTORS.CONVERSATION.MESSAGE_ITEM_ALT}`,
        { timeout: 10000 }
      );

      // Parse messages
      const messages = await parseMessages(this.page, accountEmail);

      console.log(`Fetched ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a reply message in a conversation
   */
  async sendMessage(conversationUrl: string, messageBody: string): Promise<void> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Not authenticated. Call login() first.');
    }

    try {
      console.log(`Sending message to ${conversationUrl}...`);

      // Navigate to conversation if not already there
      const currentUrl = this.page.url();
      if (!currentUrl.includes(conversationUrl)) {
        const fullUrl = conversationUrl.startsWith('http')
          ? conversationUrl
          : `${SELECTORS.URLS.BASE}${conversationUrl}`;

        await this.page.goto(fullUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
      }

      // Wait for reply textarea
      const replyTextarea = await this.page.$(SELECTORS.CONVERSATION.REPLY_TEXTAREA) ||
                            await this.page.$(SELECTORS.CONVERSATION.REPLY_TEXTAREA_ALT);
      if (!replyTextarea) throw new Error('Reply textarea not found');

      // Type message
      await replyTextarea.click();
      await replyTextarea.type(messageBody, { delay: 50 });

      // Click send button
      const sendButton = await this.page.$(SELECTORS.CONVERSATION.SEND_BUTTON);
      if (!sendButton) throw new Error('Send button not found');

      await sendButton.click();

      // Wait for message to be sent (look for success indicator or new message)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for message to be sent

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Sync all conversations and messages for an account
   */
  async syncAccount(accountEmail: string): Promise<{
    conversations: ScrapedConversation[];
    messagesByConversation: Map<string, ScrapedMessage[]>;
  }> {
    try {
      // Fetch all conversations
      const conversations = await this.fetchConversations();

      // Fetch messages for each conversation
      const messagesByConversation = new Map<string, ScrapedMessage[]>();

      for (const conversation of conversations) {
        try {
          const messages = await this.fetchMessages(
            conversation.conversation_url,
            accountEmail
          );
          messagesByConversation.set(conversation.conversation_url, messages);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `Error fetching messages for conversation ${conversation.partner_name}:`,
            error
          );
          // Continue with other conversations
        }
      }

      return { conversations, messagesByConversation };
    } catch (error) {
      console.error('Error syncing account:', error);
      throw error;
    }
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.isAuthenticated = false;
    console.log('Browser closed');
  }

  /**
   * Get screenshot for debugging
   */
  async screenshot(path: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.screenshot({ path, fullPage: true });
  }
}

/**
 * Helper function to create and initialize a scraper
 */
export async function createScraper(): Promise<EbayKleinanzeigenScraper> {
  const scraper = new EbayKleinanzeigenScraper();
  await scraper.initialize();
  return scraper;
}
