# API Migration Documentation

## Overview

This project has been refactored to use a **hybrid architecture** combining API routes for account/portfolio operations with real-time listeners for collaborative features.

## Architecture Changes

### Before (All Context-based with onSnapshot)
```
Client Components
├─ AuthContext → Firebase Auth + Firestore (real-time)
├─ AccountsContext → Firestore onSnapshot
├─ TradingContext → Firestore onSnapshot for everything
└─ SymbolsContext → Firestore queries
```

### After (Hybrid Approach)
```
Client Components
├─ AuthContext → Firebase Auth (client SDK)
├─ AccountsContext → API routes + client caching
├─ TradingContext
│   ├─ Ideas → Firestore onSnapshot (real-time collaboration)
│   ├─ Portfolio → API routes + client caching
│   ├─ Notifications → Firestore onSnapshot (real-time alerts)
│   └─ Comments → Firestore queries
└─ SymbolsContext → Firestore queries

API Routes (Server-side)
├─ /api/accounts → Firebase Admin SDK
└─ /api/portfolio → Firebase Admin SDK
```

## Why This Architecture?

### ✅ Use Real-time Listeners For:
- **Trading Ideas Feed** - Users expect instant updates from community
- **Notifications** - Alert bell should update immediately
- **Comments** - Live discussion threads

### ✅ Use API Routes For:
- **Portfolio Positions** - Personal data, no need for real-time sync
- **User Accounts** - Rarely change, don't need live updates
- **Complex Business Logic** - Average price calculations, transactions
- **Operations Requiring Privileges** - Admin SDK capabilities

### Benefits:
1. **Cost Savings** - Fewer active Firestore listeners
2. **Better Security** - Server-side validation and authorization
3. **Reduced Client Bundle** - Less Firebase SDK code
4. **Scalability** - Can add caching, rate limiting, etc.
5. **Flexibility** - Easy to add third-party integrations

## New Files Created

### 1. `/lib/firebaseAdmin.ts`
Firebase Admin SDK initialization for server-side operations.

```typescript
import { getAdminApp, getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
```

### 2. `/lib/auth.ts`
Authentication utilities for API routes.

```typescript
import { verifyAuthToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
```

### 3. `/lib/apiClient.ts`
Client-side API wrapper with automatic auth token injection.

```typescript
import { apiClient } from '@/lib/apiClient';

// Account operations
await apiClient.accounts.list();
await apiClient.accounts.create({ name, description, color });
await apiClient.accounts.update(id, { name });
await apiClient.accounts.setDefault(id);

// Portfolio operations
await apiClient.portfolio.list(accountId);
await apiClient.portfolio.create({ symbol, quantity, entryPrice, ... });
await apiClient.portfolio.update(id, { stopLoss, target });
await apiClient.portfolio.addTransaction(id, { type, quantity, price, date });
await apiClient.portfolio.close(id, { exitPrice, exitDate, exitReason });
```

## API Routes

### Accounts API

#### `GET /api/accounts`
List all accounts for authenticated user.

**Response:**
```json
{
  "accounts": [
    {
      "id": "account-id",
      "userId": "user-id",
      "name": "Primary",
      "description": "Main account",
      "isDefault": true,
      "color": "#ff8c42",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/accounts`
Create a new account.

**Request:**
```json
{
  "name": "Trading Account",
  "description": "For day trading",
  "color": "#3b82f6"
}
```

#### `PATCH /api/accounts/[accountId]`
Update an account.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "color": "#10b981"
}
```

#### `DELETE /api/accounts/[accountId]`
Delete an account (cannot delete default account).

#### `POST /api/accounts/[accountId]/set-default`
Set an account as default. Automatically unsets other accounts.

---

### Portfolio API

#### `GET /api/portfolio?accountId={id}`
List portfolio positions (optionally filtered by account).

**Response:**
```json
{
  "positions": [
    {
      "id": "position-id",
      "userId": "user-id",
      "accountId": "account-id",
      "ideaId": "idea-id",
      "symbol": "RELIANCE",
      "direction": "long",
      "quantity": 10,
      "entryPrice": 2500,
      "averagePrice": 2500,
      "currentPrice": 2600,
      "stopLoss": 2400,
      "target": 2700,
      "status": "open",
      "profitLoss": 1000,
      "profitLossPercentage": 4,
      "transactions": [
        {
          "type": "buy",
          "quantity": 10,
          "price": 2500,
          "date": "2024-01-01",
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/portfolio`
Add a new position.

**Request:**
```json
{
  "ideaId": "idea-id",
  "accountId": "account-id",
  "symbol": "RELIANCE",
  "direction": "long",
  "quantity": 10,
  "entryPrice": 2500,
  "entryDate": "2024-01-01",
  "stopLoss": 2400,
  "target": 2700,
  "notes": "Bullish breakout"
}
```

#### `PATCH /api/portfolio/[positionId]`
Update a position (stopLoss, target, notes, currentPrice).

**Request:**
```json
{
  "stopLoss": 2450,
  "target": 2750,
  "currentPrice": 2620,
  "notes": "Trailing stop updated"
}
```

#### `POST /api/portfolio/[positionId]/transaction`
Add a buy/sell transaction to a position.

**Request:**
```json
{
  "type": "buy",
  "quantity": 5,
  "price": 2550,
  "date": "2024-01-02"
}
```

**Logic:**
- **Buy**: Increases quantity, recalculates average price
- **Sell**: Decreases quantity
- Auto-closes position if quantity becomes 0

#### `POST /api/portfolio/[positionId]/close`
Close a position.

**Request:**
```json
{
  "exitPrice": 2700,
  "exitDate": "2024-01-05",
  "exitReason": "Target hit"
}
```

#### `DELETE /api/portfolio/[positionId]`
Delete a position.

---

## Authentication

All API routes require authentication via Firebase ID token.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

The `apiClient` utility automatically handles token retrieval and injection.

## Environment Variables Setup

### Required Environment Variables

Add these to your `.env.local`:

```bash
# Firebase Admin SDK (Private - server-side only)
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### How to Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract values:
   - `FIREBASE_ADMIN_CLIENT_EMAIL` = `client_email` from JSON
   - `FIREBASE_ADMIN_PRIVATE_KEY` = `private_key` from JSON (keep the `\n` characters)

### Vercel Deployment

When deploying to Vercel:

1. Go to your project settings → Environment Variables
2. Add both variables:
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (paste as-is, Vercel handles newlines)

**Important:** Never commit the private key to git!

## Context Changes

### AccountsContext

**Before:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query(...), (snapshot) => {
    setAccounts(snapshot.docs.map(...));
  });
  return () => unsubscribe();
}, [user]);
```

**After:**
```typescript
const fetchAccounts = async () => {
  const response = await apiClient.accounts.list();
  setAccounts(response.accounts);
};

useEffect(() => {
  fetchAccounts();
}, [user]);

// New method available
const { refreshAccounts } = useAccounts();
```

**New Methods:**
- `refreshAccounts()` - Manually refresh accounts from server

### TradingContext

**Portfolio Methods (Updated):**
- `addToPortfolio()` - Now calls API route
- `updatePosition()` - Now calls API route
- `closePosition()` - Now calls API route
- `addTransaction()` - Now calls API route
- `exitTrade()` - Now calls API route

**Methods Still Using Firestore (Unchanged):**
- `createIdea()` - Real-time collaboration
- `updateIdea()` - Real-time collaboration
- `toggleLike()` - Immediate feedback
- `toggleFollow()` - Immediate feedback
- `addComment()` - Real-time discussion
- `getComments()` - Real-time discussion
- `markNotificationAsRead()` - Immediate feedback

## Caching Strategy

### Current Implementation
- **Fetch on Mount**: Data loaded when component mounts
- **Optimistic Updates**: UI updates immediately, then refetches to confirm
- **Manual Refresh**: `refreshAccounts()` available for forced refresh

### Future Enhancements (Optional)
- Add SWR or React Query for automatic revalidation
- Implement stale-while-revalidate pattern
- Add request deduplication
- Cache API responses in memory/localStorage

## Migration Checklist

If you're adapting this pattern to other parts of the app:

- [ ] Create API route with Firebase Admin SDK
- [ ] Add authentication via `verifyAuthToken()`
- [ ] Add methods to `apiClient.ts`
- [ ] Update Context to use API client
- [ ] Add `refresh` method to context
- [ ] Remove `onSnapshot` if real-time not needed
- [ ] Test CRUD operations
- [ ] Update environment variables
- [ ] Deploy and test in production

## Error Handling

### API Errors
```typescript
try {
  await apiClient.portfolio.create({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`);
  }
}
```

### Common Errors
- `401 Unauthorized` - User not authenticated or token expired
- `403 Forbidden` - User doesn't own the resource
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server-side error

## Testing

### Test Account Operations
```typescript
const { accounts, createAccount, updateAccount, setDefaultAccount } = useAccounts();

// Create
await createAccount('Test Account', 'Description', '#3b82f6');

// Update
await updateAccount(accountId, { name: 'Updated Name' });

// Set Default
await setDefaultAccount(accountId);
```

### Test Portfolio Operations
```typescript
const { myPortfolio, addToPortfolio, updatePosition, closePosition } = useTrading();

// Add Position
const positionId = await addToPortfolio(ideaId, {
  symbol: 'RELIANCE',
  quantity: 10,
  entryPrice: 2500,
  tradeType: 'long',
  stopLoss: 2400,
  target1: 2700
});

// Update Position
await updatePosition(positionId, {
  stopLoss: 2450,
  currentPrice: 2620
});

// Close Position
await closePosition(positionId, {
  exitPrice: 2700,
  exitDate: '2024-01-05',
  exitReason: 'Target hit'
});
```

## Performance Comparison

### Before (All Real-time)
- **Active Listeners**: 3-4 per user (accounts, portfolio, notifications, ideas)
- **Firestore Reads**: High (every document change triggers read)
- **Client Bundle**: Larger (full Firestore SDK)

### After (Hybrid)
- **Active Listeners**: 2 per user (notifications, ideas)
- **Firestore Reads**: Reduced (only for collaborative features)
- **API Calls**: On-demand (fetch when needed)
- **Client Bundle**: Smaller (less SDK code)

## Next Steps / Recommendations

1. **Add Caching Layer**
   - Implement SWR or React Query
   - Add cache invalidation strategy

2. **Move Alert Monitoring to Server**
   - Create `/api/alerts/check` cron job
   - Remove 24-hour interval from TradingContext

3. **Add Analytics**
   - Track API response times
   - Monitor error rates
   - Log slow queries

4. **Implement Rate Limiting**
   - Protect API routes from abuse
   - Add request throttling

5. **Add Request Validation**
   - Use Zod or similar for schema validation
   - Validate inputs before processing

## Support

For questions or issues with this implementation:
1. Check the API route responses in browser DevTools Network tab
2. Check server logs for error details
3. Verify Firebase Admin credentials are set correctly
4. Ensure Firestore Security Rules allow server-side access

## License

This implementation follows the project's existing license.
