# Firebase Security Configuration

## Overview
This document explains the security rules implemented for Firebase Firestore to ensure data isolation and protection.

## Key Security Principles

### 1. **User Data Isolation**
- Users can ONLY access their own data
- All user-specific collections (portfolios, accounts, notifications) check `userId`
- No user can read or modify another user's private data

### 2. **Email Verification Requirement**
- Most operations require verified email (`isVerifiedUser()`)
- Prevents spam accounts and ensures legitimate users
- Exceptions: User creation (allow sign-up) and system notifications

### 3. **Read-Only Market Data**
- Symbols, technicals, and screener data are read-only
- Only backend scripts/admin can write to these collections
- Prevents data tampering by users

### 4. **Immutable Fields**
- Critical fields like `userId`, `createdAt` cannot be changed after creation
- Prevents privilege escalation and data manipulation

### 5. **Field Count Limits**
- Limits on document size prevent bloated documents
- Reduces storage costs and improves performance

### 6. **Content Validation**
- Comment text limited to 1000 characters
- Required fields enforced for all creates
- Prevents malformed data

## Security Rules by Collection

### Market Data Collections (READ-ONLY)

#### `symbols`, `technicals`
```
✅ Read: Verified users only
❌ Write: Nobody (backend only)
```

#### `macrossover50`, `macrossover200`, `advancedtrailstop`, `volumespike`, `darvasboxes`, `bbsqueeze`
```
✅ Read: Verified users only
❌ Write: Nobody (backend scripts only)
```

### User-Specific Collections (PRIVATE)

#### `users/{userId}`
```
✅ Read: Owner only (must be verified)
✅ Create: Owner only (during signup)
✅ Update: Owner only (must be verified)
❌ Delete: Nobody
```

#### `accounts/{accountId}`
```
✅ Read: Owner only (userId must match)
✅ Create: Owner only + must include userId, name, createdAt
✅ Update: Owner only + cannot change userId/createdAt
✅ Delete: Owner only + cannot delete default account
```

#### `portfolios/{positionId}`
```
✅ Read: Owner only (userId must match)
✅ Create: Owner only + must include userId, symbol, createdAt + max 20 fields
✅ Update: Owner only + cannot change userId/createdAt
✅ Delete: Owner only
```

#### `notifications/{notificationId}`
```
✅ Read: Owner only (userId must match)
✅ Create: Anyone (for system notifications)
✅ Update: Owner only + cannot change userId/createdAt
❌ Delete: Nobody
```

### Social/Shared Collections (PUBLIC READ)

#### `tradingIdeas/{ideaId}`
```
✅ Read: All verified users
✅ Create: Owner only + must include userId, symbol, title, createdAt + max 25 fields
✅ Update:
   - Owner: Can update all fields except userId/createdAt
   - Others: Can only update likes/follows (followers, likedBy, likes, commentCount)
✅ Delete: Owner only
```

#### `comments/{commentId}`
```
✅ Read: All verified users
✅ Create: Owner only + must include userId, ideaId, text, createdAt + text 1-1000 chars
✅ Update: Owner only + cannot change userId/ideaId/createdAt
✅ Delete: Owner only
```

## How to Deploy Security Rules

### Option 1: Firebase Console (Manual)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Click **Publish**

### Option 2: Firebase CLI (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## Testing Security Rules

### Test in Firebase Console
1. Go to **Firestore Database** → **Rules**
2. Click **Rules Playground** tab
3. Test different scenarios:
   - Authenticated user reading their own data ✅
   - Authenticated user reading another user's data ❌
   - Unauthenticated user reading any data ❌
   - Verified user reading market data ✅

### Test Scenarios

#### ✅ SHOULD SUCCEED
```javascript
// User reading their own portfolio
auth: { uid: 'user123', token: { email_verified: true } }
path: /portfolios/pos1
data: { userId: 'user123', symbol: 'RELIANCE' }
operation: read
```

#### ❌ SHOULD FAIL
```javascript
// User reading another user's portfolio
auth: { uid: 'user123', token: { email_verified: true } }
path: /portfolios/pos2
data: { userId: 'user456', symbol: 'TCS' }
operation: read
```

## Security Best Practices Implemented

### ✅ Authentication Required
- All operations require authentication
- Email verification required for most operations
- Uses Firebase Authentication tokens

### ✅ Data Isolation
- Users can only access their own data
- `userId` field checked on all operations
- Query filters enforce user isolation

### ✅ Field Validation
- Required fields enforced (`userId`, `symbol`, `createdAt`, etc.)
- Field count limits prevent bloat
- Content size limits (comment text max 1000 chars)

### ✅ Immutable Fields
- `userId` cannot be changed (prevents privilege escalation)
- `createdAt` cannot be changed (audit trail integrity)
- Protected fields enforced via `fieldNotChanged()` function

### ✅ Granular Permissions
- Separate rules for create/read/update/delete
- Social features allow limited updates from non-owners
- Delete operations carefully controlled or disabled

### ✅ Deny by Default
- Fallback rule denies all access: `match /{document=**} { allow read, write: if false; }`
- Only explicitly allowed operations succeed
- Prevents access to undocumented collections

## Additional Security Recommendations

### 1. Backend API Authentication
Your API routes should also verify Firebase tokens:

```typescript
// Example: app/api/portfolio/route.ts
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Now fetch data for this userId only
    const positions = await db.collection('portfolios')
      .where('userId', '==', userId)
      .get();

    // ...
  } catch (error) {
    return new Response('Invalid token', { status: 401 });
  }
}
```

### 2. Rate Limiting
Consider implementing rate limiting to prevent abuse:
- Use Firebase App Check for DDoS protection
- Implement Cloud Functions with rate limiting
- Use Firebase Security Rules with request limits

### 3. Data Validation
Add server-side validation in Cloud Functions:
```typescript
// Example: Validate symbol before adding to portfolio
exports.validateSymbol = functions.firestore
  .document('portfolios/{positionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const symbolDoc = await admin.firestore()
      .collection('symbols')
      .doc(data.symbol)
      .get();

    if (!symbolDoc.exists) {
      // Delete invalid position
      await snap.ref.delete();
      throw new Error('Invalid symbol');
    }
  });
```

### 4. Audit Logging
Log sensitive operations:
```typescript
// Example: Log portfolio modifications
exports.logPortfolioChange = functions.firestore
  .document('portfolios/{positionId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    return admin.firestore().collection('audit_logs').add({
      userId: after.userId,
      positionId: context.params.positionId,
      action: 'update',
      before,
      after,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });
```

### 5. Environment Variables
Never commit sensitive data:
```bash
# .env.local (NEVER COMMIT)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

Add to `.gitignore`:
```
# Firebase
.env.local
.env.production
serviceAccountKey.json
```

### 6. App Check (Anti-Abuse)
Enable Firebase App Check for your web app:
```typescript
// lib/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

## Monitoring & Alerts

### Set up Firebase Monitoring
1. Enable **Cloud Firestore Usage** metrics
2. Set up alerts for:
   - High read/write counts (potential abuse)
   - Failed authentication attempts
   - Security rule violations

### Check Security Rules Violations
```bash
# Firebase Console → Firestore → Usage tab
# Look for "Permission Denied" errors
```

## Summary

Your Firebase is now secured with:

✅ **User Data Isolation** - Users can only access their own data
✅ **Email Verification** - Prevents spam and fake accounts
✅ **Read-Only Market Data** - Prevents data tampering
✅ **Immutable Fields** - Protects critical data
✅ **Field Validation** - Ensures data quality
✅ **Granular Permissions** - Fine-grained access control
✅ **Deny by Default** - Maximum security posture

## Questions?

If you have questions about these security rules:
1. Review the inline comments in `firestore.rules`
2. Test in Firebase Console Rules Playground
3. Check Firebase documentation: https://firebase.google.com/docs/firestore/security
