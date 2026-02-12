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

    // Fetch account (no authentication required)
    const account = await getAccountById(id);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Don't return encrypted password
    return NextResponse.json({
      account: {
        ...account,
        password: undefined,
      },
    });
  } catch (error) {
    console.error('GET /api/accounts/[id] error:', error);
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

    // Update account (no authentication required)
    const updatedAccount = await updateAccount(id, validationResult.data);

    // Don't return encrypted password
    return NextResponse.json({
      account: {
        ...updatedAccount,
        password: undefined,
      },
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/accounts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Delete an account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete account (no authentication required)
    await deleteAccount(id);

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
