import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getAccountById,
  updateAccount,
  deleteAccount,
} from '@/lib/db/helpers';
import { updateAccountSchema } from '@/lib/validations';

/**
 * GET /api/accounts/[id]
 * Get a single account by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch account
    const account = await getAccountById(id);

    // Verify ownership
    if (account.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this account' },
        { status: 403 }
      );
    }

    // Don't return encrypted password
    return NextResponse.json({
      account: {
        ...account,
        password: undefined,
      },
    });
  } catch (error: any) {
    console.error('GET /api/accounts/[id] error:', error);

    // Handle not found
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/accounts/[id]
 * Update an account
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch existing account
    const existingAccount = await getAccountById(id);

    // Verify ownership
    if (existingAccount.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this account' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Update account (password will be encrypted in the helper if provided)
    const updatedAccount = await updateAccount(id, validationResult.data);

    return NextResponse.json({
      account: {
        ...updatedAccount,
        password: undefined,
      },
      message: 'Account updated successfully',
    });
  } catch (error: any) {
    console.error('PATCH /api/accounts/[id] error:', error);

    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Delete an account (cascades to conversations and messages)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch existing account
    const existingAccount = await getAccountById(id);

    // Verify ownership
    if (existingAccount.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this account' },
        { status: 403 }
      );
    }

    // Delete account
    await deleteAccount(id);

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/accounts/[id] error:', error);

    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
