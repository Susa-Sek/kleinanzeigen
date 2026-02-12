import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAccount, getAccountsByUserId } from '@/lib/db/helpers';
import { createAccountSchema } from '@/lib/validations';
import type { Account } from '@/types';

/**
 * GET /api/accounts
 * List all eBay Kleinanzeigen accounts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Supabase Auth
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

    // Fetch accounts for this user
    const accounts = await getAccountsByUserId(user.id);

    // Don't return encrypted passwords in the response
    const sanitizedAccounts = accounts.map((account) => ({
      ...account,
      password: undefined, // Remove password from response
    }));

    return NextResponse.json({
      accounts: sanitizedAccounts,
      count: accounts.length,
    });
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * Create a new eBay Kleinanzeigen account
 */
export async function POST(request: NextRequest) {
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
    const validationResult = createAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, account_name } = validationResult.data;

    // Check if account already exists for this user
    const existingAccounts = await getAccountsByUserId(user.id);
    const duplicate = existingAccounts.find((acc) => acc.email === email);

    if (duplicate) {
      return NextResponse.json(
        { error: 'Account with this email already exists' },
        { status: 409 }
      );
    }

    // Create account (password will be encrypted in the helper)
    const account = await createAccount({
      user_id: user.id,
      email,
      password,
      account_name,
    });

    // Don't return encrypted password
    return NextResponse.json(
      {
        account: {
          ...account,
          password: undefined,
        },
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
