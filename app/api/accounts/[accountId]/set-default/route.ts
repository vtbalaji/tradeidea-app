import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// POST /api/accounts/[accountId]/set-default - Set an account as default
export async function POST(
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

    // Use a batch to update all accounts atomically
    const batch = db.batch();

    // First, unset isDefault for all user's accounts
    const userAccountsSnapshot = await db
      .collection('accounts')
      .where('userId', '==', userId)
      .get();

    userAccountsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isDefault: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Then set the specified account as default
    const accountRef = db.collection('accounts').doc(accountId);
    batch.update(accountRef, {
      isDefault: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return createSuccessResponse({ message: 'Default account updated successfully' });
  } catch (error: any) {
    console.error('Error setting default account:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to set default account', 500);
  }
}
