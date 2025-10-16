import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// POST /api/portfolio/[positionId]/transaction - Add a transaction (buy/sell) to a position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const { positionId } = await params;
    const body = await request.json();

    const { type, quantity, price, date } = body;

    // Validate required fields
    if (!type || !quantity || !price || !date) {
      return createErrorResponse('Missing required fields: type, quantity, price, date', 400);
    }

    if (!['buy', 'sell'].includes(type)) {
      return createErrorResponse('Transaction type must be "buy" or "sell"', 400);
    }

    // Verify the position belongs to the user
    const positionDoc = await db.collection('portfolios').doc(positionId).get();

    if (!positionDoc.exists) {
      return createErrorResponse('Position not found', 404);
    }

    const positionData = positionDoc.data();
    if (positionData?.userId !== userId) {
      return createErrorResponse('Unauthorized: Position does not belong to user', 403);
    }

    const currentQuantity = positionData.quantity || 0;
    const currentAveragePrice = positionData.averagePrice || 0;
    const transactions = positionData.transactions || [];

    const newTransaction = {
      type,
      quantity: Number(quantity),
      price: Number(price),
      date,
      timestamp: new Date().toISOString(),
    };

    let newQuantity = currentQuantity;
    let newAveragePrice = currentAveragePrice;

    if (type === 'buy') {
      // Add to position
      const totalCost = currentQuantity * currentAveragePrice + Number(quantity) * Number(price);
      newQuantity = currentQuantity + Number(quantity);
      newAveragePrice = newQuantity > 0 ? totalCost / newQuantity : 0;
    } else {
      // Sell from position
      newQuantity = currentQuantity - Number(quantity);
      if (newQuantity < 0) {
        return createErrorResponse('Cannot sell more than current quantity', 400);
      }
      // Average price remains the same on sell
      newAveragePrice = currentAveragePrice;
    }

    const updates: any = {
      quantity: newQuantity,
      averagePrice: newAveragePrice,
      transactions: FieldValue.arrayUnion(newTransaction),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // If quantity becomes zero, close the position
    if (newQuantity === 0) {
      updates.status = 'closed';
      updates.exitPrice = Number(price);
      updates.exitDate = date;

      // Calculate final P&L
      const direction = positionData.direction;
      const entryValue = currentQuantity * currentAveragePrice;
      const exitValue = currentQuantity * Number(price);

      if (direction === 'long') {
        updates.profitLoss = exitValue - entryValue;
      } else {
        updates.profitLoss = entryValue - exitValue;
      }
      updates.profitLossPercentage = entryValue > 0
        ? (updates.profitLoss / entryValue) * 100
        : 0;
    } else {
      // Recalculate current P&L if position is still open
      const currentPrice = positionData.currentPrice || newAveragePrice;
      const direction = positionData.direction;

      if (direction === 'long') {
        updates.profitLoss = (currentPrice - newAveragePrice) * newQuantity;
      } else {
        updates.profitLoss = (newAveragePrice - currentPrice) * newQuantity;
      }
      updates.profitLossPercentage = newAveragePrice > 0
        ? (updates.profitLoss / (newAveragePrice * newQuantity)) * 100
        : 0;
    }

    await db.collection('portfolios').doc(positionId).update(updates);

    return createSuccessResponse({
      id: positionId,
      ...positionData,
      ...updates,
      transactions: [...transactions, newTransaction],
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error adding transaction:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to add transaction', 500);
  }
}
