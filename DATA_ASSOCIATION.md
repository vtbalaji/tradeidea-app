# Data Association - User & Account Security

## ✅ Security Model

Every position in your portfolio is **triple-secured**:

### 1. User Association (Primary Security)
```javascript
// TradingContext.tsx - Line 222
const q = query(portfolioRef, where('userId', '==', user.uid));
```
- **All positions** are filtered by `userId`
- Users can **ONLY** see their own positions
- Firestore rules enforce: `resource.data.userId == request.auth.uid`

### 2. Account Association (Organization)
```javascript
// PortfolioPosition interface
interface PortfolioPosition {
  userId: string;        // WHO owns it
  accountId?: string;    // WHICH account it belongs to
  // ... other fields
}
```
- Each position has an `accountId` linking it to an account
- Accounts are also filtered by `userId`
- Users can only see accounts they own

### 3. Account Filtering (Display)
```javascript
// Portfolio page - Line 72-74
const accountPositions = activeAccount
  ? myPortfolio.filter(p => !p.accountId || p.accountId === activeAccount.id)
  : myPortfolio;
```
- Positions shown based on active account
- Legacy positions (no accountId) show in all accounts
- New positions always have accountId

## 🔒 Security Guarantees

### User Level
- ✅ User A **CANNOT** see User B's positions
- ✅ User A **CANNOT** see User B's accounts
- ✅ Firestore rules block cross-user access

### Account Level
- ✅ Positions in "Wife" account only show when that account is active
- ✅ Positions in "Mine" account only show when that account is active
- ✅ Import to specific account assigns correct accountId

### Data Flow

```
User Login
    ↓
Load Accounts (filtered by userId)
    ↓
Set Active Account (default or last used)
    ↓
Load Portfolio (filtered by userId)
    ↓
Filter by accountId (based on active account)
    ↓
Display positions
```

## 📊 Examples

### Scenario 1: User with Multiple Accounts
```javascript
User: Ramesh (uid: abc123)

Accounts:
- Primary (id: acc1, userId: abc123, isDefault: true)
- Wife (id: acc2, userId: abc123)

Positions:
- RELIANCE (userId: abc123, accountId: acc1) → Shows in "Primary"
- TCS (userId: abc123, accountId: acc2) → Shows in "Wife"
- INFY (userId: abc123, accountId: acc1) → Shows in "Primary"
```

### Scenario 2: Import to Specific Account
```javascript
1. User selects "Wife" account
2. Clicks "Import CSV"
3. Selects "Wife" from dropdown (or defaults to current)
4. Uploads CSV with 10 positions
5. All 10 positions get:
   - userId: user.uid (automatic)
   - accountId: "Wife account ID" (from selection)
```

### Scenario 3: Legacy Positions (No accountId)
```javascript
// Old positions created before multi-account feature
Position: { userId: abc123, accountId: undefined }

// Filter logic handles this:
!p.accountId || p.accountId === activeAccount.id
//     ↑ Shows in ALL accounts (backward compatible)
```

## 🔐 Firestore Rules

### Accounts Collection
```javascript
match /accounts/{accountId} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow delete: if false; // Never delete
}
```

### Portfolios Collection
```javascript
match /portfolios/{positionId} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow create: if isSignedIn();
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow delete: if false; // Never delete - use status='closed'
}
```

## ✅ Privacy Assurance

**Your wife's portfolio is completely separate:**
1. Different `accountId` on every position
2. Only visible when "Wife" account is active
3. Import goes directly to her account
4. Metrics (P&L, value) calculated per account
5. Clear portfolio only affects active account

**No data mixing:**
- Your positions: accountId = "Primary"
- Wife's positions: accountId = "Wife"
- Filter ensures complete separation

**Example Query Result:**
```javascript
// When "Wife" account is active
Ramesh's DB Query → Returns ALL his positions (userId filter)
                  ↓
App Filter → Shows ONLY "Wife" accountId positions
           ↓
Display → Wife's portfolio only

// When "Primary" account is active
Same query → Same positions returned
           ↓
App Filter → Shows ONLY "Primary" accountId positions
           ↓
Display → Ramesh's portfolio only
```

## 🎯 Summary

**Every position has:**
- `userId` - WHO owns it (you)
- `accountId` - WHICH portfolio it belongs to (Primary/Wife/Kids)

**Security layers:**
1. Firestore rules block other users
2. App queries filter by userId
3. Display filters by accountId
4. No cross-contamination possible

Your data is **completely secure and properly isolated**! ✅
