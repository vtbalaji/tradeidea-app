import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// PATCH /api/accounts/[accountId] - Update an account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { accountId } = await params;
    const body = await request.json();

    // Verify the account belongs to the user
    const accountDoc = await db.collection('accounts').doc(accountId).get();

    if (!accountDoc.exists) {
      return createErrorResponse('Account not found', 404);
    }

    const accountData = accountDoc.data();
    if (accountData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Account does not belong to user', 403);
    }

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) {
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updates.description = body.description.trim();
    }
    if (body.color !== undefined) {
      updates.color = body.color;
    }

    await db.collection('accounts').doc(accountId).update(updates);

    return createSuccessResponse({
      id: accountId,
      ...accountData,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating account:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to update account', 500);
  }
}

// DELETE /api/accounts/[accountId] - Delete an account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { accountId } = await params;

    // Verify the account belongs to the user
    const accountDoc = await db.collection('accounts').doc(accountId).get();

    if (!accountDoc.exists) {
      return createErrorResponse('Account not found', 404);
    }

    const accountData = accountDoc.data();
    if (accountData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Account does not belong to user', 403);
    }

    // Check if this is the default account
    if (accountData?.isDefault) {
      return createErrorResponse('Cannot delete default account', 400);
    }

    await db.collection('accounts').doc(accountId).delete();

    return createSuccessResponse({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to delete account', 500);
  }
}
