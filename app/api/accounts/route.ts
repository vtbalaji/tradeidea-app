import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/accounts - List all accounts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();

    const accountsSnapshot = await db
      .collection('accounts')
      .where('userId', '==', userId)
      .get();

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return createSuccessResponse({ accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to fetch accounts', 500);
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const body = await request.json();

    const { name, description, color } = body;

    if (!name || name.trim() === '') {
      return createErrorResponse('Account name is required', 400);
    }

    // Check if this is the user's first account
    const existingAccountsSnapshot = await db
      .collection('accounts')
      .where('userId', '==', userId)
      .get();

    const isFirstAccount = existingAccountsSnapshot.empty;

    const accountData = {
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3b82f6',
      isDefault: isFirstAccount, // First account is default
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('accounts').add(accountData);

    return createSuccessResponse({
      id: docRef.id,
      ...accountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('Error creating account:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to create account', 500);
  }
}
