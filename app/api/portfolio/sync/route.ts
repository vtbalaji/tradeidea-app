import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { formatDateForStorage, getCurrentISTDate } from '@/lib/dateUtils';

/**
 * POST /api/portfolio/sync - Smart reconciliation of portfolio with broker data
 *
 * This endpoint intelligently syncs portfolio positions with fresh broker data by:
 * 1. Matching existing positions by symbol
 * 2. Adding buy/sell transactions for quantity changes
 * 3. Creating new positions for new symbols
 * 4. Flagging local positions not in broker data
 * 5. Preserving custom settings (targets, stop loss, notes, smart SL)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request);
    const db = getAdminDb();
    const body = await request.json();

    const {
      accountId,
      positions: brokerPositions, // Array of positions from broker CSV
      preview = false, // If true, just return what would change without applying
    } = body;

    // Validate input
    if (!Array.isArray(brokerPositions)) {
      return createErrorResponse('Invalid positions data', 400);
    }

    // Verify account belongs to user if accountId is provided
    if (accountId) {
      const accountDoc = await db.collection('accounts').doc(accountId).get();
      if (!accountDoc.exists || accountDoc.data()?.userId !== userId) {
        return createErrorResponse('Invalid account', 400);
      }
    }

    // Fetch existing open positions for this user/account
    let query = db.collection('portfolios')
      .where('userId', '==', userId)
      .where('status', '==', 'open');

    if (accountId) {
      query = query.where('accountId', '==', accountId);
    }

    const existingSnapshot = await query.get();
    const existingPositions = new Map();

    existingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      existingPositions.set(data.symbol, {
        id: doc.id,
        ...data,
      });
    });

    // Build a map of broker positions by symbol
    const brokerMap = new Map();
    brokerPositions.forEach((pos: any) => {
      brokerMap.set(pos.symbol, pos);
    });

    const changes = {
      toAdd: [] as any[],      // New positions to create
      toUpdate: [] as any[],   // Existing positions to update
      missing: [] as any[],    // Local positions not in broker data
    };

    const currentDate = formatDateForStorage(getCurrentISTDate());
    const timestamp = new Date().toISOString();

    // Process broker positions
    for (const brokerPos of brokerPositions) {
      const { symbol, quantity, entryPrice, ...otherFields } = brokerPos;
      const existing = existingPositions.get(symbol);

      if (existing) {
        // Position exists - check for quantity changes
        const currentQty = existing.quantity;
        const newQty = Number(quantity);

        if (currentQty !== newQty) {
          const qtyDiff = newQty - currentQty;
          const transaction = {
            type: qtyDiff > 0 ? 'buy' : 'sell',
            quantity: Math.abs(qtyDiff),
            price: Number(entryPrice),
            date: currentDate,
            timestamp,
          };

          changes.toUpdate.push({
            positionId: existing.id,
            symbol,
            currentQuantity: currentQty,
            newQuantity: newQty,
            transaction,
            action: qtyDiff > 0 ? 'increased' : 'decreased',
          });

          // Apply changes if not in preview mode
          if (!preview) {
            const positionRef = db.collection('portfolios').doc(existing.id);

            // Calculate new average price
            let newAveragePrice = existing.averagePrice;
            if (qtyDiff > 0) {
              // Buying more - recalculate average
              const totalCost = (existing.averagePrice * currentQty) + (Number(entryPrice) * Math.abs(qtyDiff));
              newAveragePrice = totalCost / newQty;
            } else {
              // Selling - keep existing average
              newAveragePrice = existing.averagePrice;
            }

            // Update position
            await positionRef.update({
              quantity: newQty,
              averagePrice: newAveragePrice,
              currentPrice: Number(entryPrice),
              transactions: FieldValue.arrayUnion(transaction),
              updatedAt: FieldValue.serverTimestamp(),
            });

            // Recalculate P&L
            const profitLoss = (Number(entryPrice) - newAveragePrice) * newQty;
            const profitLossPercentage = ((Number(entryPrice) - newAveragePrice) / newAveragePrice) * 100;

            await positionRef.update({
              profitLoss,
              profitLossPercentage,
            });
          }
        } else {
          // Quantity same, just update current price
          changes.toUpdate.push({
            positionId: existing.id,
            symbol,
            currentQuantity: currentQty,
            newQuantity: newQty,
            action: 'price_update',
          });

          if (!preview) {
            await db.collection('portfolios').doc(existing.id).update({
              currentPrice: Number(entryPrice),
              updatedAt: FieldValue.serverTimestamp(),
            });

            // Recalculate P&L
            const profitLoss = (Number(entryPrice) - existing.averagePrice) * existing.quantity;
            const profitLossPercentage = ((Number(entryPrice) - existing.averagePrice) / existing.averagePrice) * 100;

            await db.collection('portfolios').doc(existing.id).update({
              profitLoss,
              profitLossPercentage,
            });
          }
        }
      } else {
        // New position - doesn't exist locally
        const newPosition = {
          userId,
          accountId: accountId || null,
          ideaId: null,
          symbol,
          direction: otherFields.direction || 'long',
          quantity: Number(quantity),
          entryPrice: Number(entryPrice),
          averagePrice: Number(entryPrice),
          currentPrice: Number(entryPrice),
          entryDate: otherFields.entryDate || currentDate,
          stopLoss: otherFields.stopLoss ? Number(otherFields.stopLoss) : null,
          target: otherFields.target ? Number(otherFields.target) : null,
          notes: otherFields.notes || '',
          status: 'open',
          profitLoss: 0,
          profitLossPercentage: 0,
          smartSLTrigger: 'no',
          smartSLPhase: null,
          smartSLSource: null,
          exitCriteria: {
            exitAtStopLoss: true,
            exitAtTarget: true,
            exitBelow50EMA: false,
            exitBelow100MA: false,
            exitBelow200MA: true,
            exitOnWeeklySupertrend: true,
            customNote: '',
          },
          transactions: [{
            type: 'buy',
            quantity: Number(quantity),
            price: Number(entryPrice),
            date: otherFields.entryDate || currentDate,
            timestamp,
          }],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        changes.toAdd.push({
          symbol,
          quantity: Number(quantity),
          entryPrice: Number(entryPrice),
        });

        if (!preview) {
          await db.collection('portfolios').add(newPosition);
        }
      }
    }

    // Find positions that exist locally but not in broker data
    for (const [symbol, position] of existingPositions) {
      if (!brokerMap.has(symbol)) {
        changes.missing.push({
          positionId: position.id,
          symbol,
          quantity: position.quantity,
          entryPrice: position.entryPrice,
          currentPrice: position.currentPrice,
          profitLoss: position.profitLoss,
        });
      }
    }

    return createSuccessResponse({
      preview,
      changes,
      summary: {
        newPositions: changes.toAdd.length,
        updatedPositions: changes.toUpdate.length,
        missingInBroker: changes.missing.length,
        totalProcessed: brokerPositions.length,
      },
    });
  } catch (error: any) {
    console.error('Error syncing portfolio:', error);
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse('Failed to sync portfolio', 500);
  }
}
