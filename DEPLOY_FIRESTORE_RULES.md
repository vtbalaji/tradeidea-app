# How to Deploy Firebase Security Rules

## Quick Deploy (Firebase CLI)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Deploy Rules
```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

## Manual Deploy (Firebase Console)

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/

### 2. Navigate to Rules
1. Select your project
2. Click **Firestore Database** in left menu
3. Click **Rules** tab

### 3. Copy & Paste
1. Open `firestore.rules` file in your project
2. Copy all contents
3. Paste into Firebase Console editor
4. Click **Publish**

## Verify Rules are Active

### Method 1: Check in Console
1. Go to Firestore Database → Rules
2. Check the "Last published" timestamp
3. Should show recent date/time

### Method 2: Test in Rules Playground
1. Go to Firestore Database → Rules
2. Click **Rules Playground** tab
3. Test scenarios (see examples below)

## Test Scenarios

### ✅ Test 1: User can read their own portfolio
```
Authenticated: Yes
User ID: user123
Location: /portfolios/pos1
Type: get
Document data:
{
  "userId": "user123",
  "symbol": "RELIANCE",
  "quantity": 10
}
Result: ALLOW ✅
```

### ❌ Test 2: User cannot read another user's portfolio
```
Authenticated: Yes
User ID: user123
Location: /portfolios/pos2
Type: get
Document data:
{
  "userId": "user456",
  "symbol": "TCS",
  "quantity": 20
}
Result: DENY ❌
```

### ✅ Test 3: User can read market data
```
Authenticated: Yes
User ID: user123
Location: /symbols/NS_RELIANCE
Type: get
Result: ALLOW ✅
```

### ❌ Test 4: User cannot write to market data
```
Authenticated: Yes
User ID: user123
Location: /symbols/NS_RELIANCE
Type: create/update
Result: DENY ❌
```

## What Changed? (Security Improvements)

### Before (Old Rules)
```
❌ Users could read ANY portfolio
❌ Users could read ANY account
❌ Users could read ANY notification
❌ No protection against changing userId
❌ No field validation
```

### After (New Rules)
```
✅ Users can ONLY read their own portfolios
✅ Users can ONLY read their own accounts
✅ Users can ONLY read their own notifications
✅ userId field is protected (cannot be changed)
✅ createdAt field is protected
✅ Helper functions for reusable checks
✅ All screener collections included
```

## Key Security Features

### 1. User Data Isolation ✅
```javascript
// Users can ONLY access their own data
resource.data.userId == request.auth.uid
```

### 2. Protected Fields ✅
```javascript
// userId and createdAt cannot be changed
fieldNotChanged('userId')
fieldNotChanged('createdAt')
```

### 3. Authentication Required ✅
```javascript
// All operations require login
isSignedIn()
```

### 4. Read-Only Market Data ✅
```javascript
// Nobody can modify market data
allow write: if false
```

## Troubleshooting

### Error: "Permission denied"
**Cause**: User trying to access data they don't own
**Fix**: Check that `userId` field matches `request.auth.uid`

### Error: "Document doesn't exist"
**Cause**: Trying to read non-existent document
**Fix**: Create document first, then read

### Error: "Field 'userId' is required"
**Cause**: Creating document without userId
**Fix**: Always include `userId: request.auth.uid` when creating

## Next Steps

### Optional: Enable Email Verification
To require email verification, uncomment in rules:
```javascript
// Change from:
function isSignedIn() {
  return request.auth != null;
}

// To:
function isVerifiedUser() {
  return request.auth != null &&
         request.auth.token.email_verified == true;
}

// Then use isVerifiedUser() instead of isSignedIn()
```

### Enable App Check (Recommended)
Prevent abuse from bots:
```bash
# In Firebase Console
1. Go to App Check
2. Enable for your web app
3. Add reCAPTCHA v3
4. Deploy
```

### Monitor Usage
Check for suspicious activity:
```bash
# Firebase Console → Firestore → Usage
# Look for:
- Unusual read/write spikes
- Permission denied errors
- Failed authentication attempts
```

## Support

For questions:
- Review: `FIREBASE_SECURITY.md`
- Firebase Docs: https://firebase.google.com/docs/firestore/security
- Firebase Console: https://console.firebase.google.com/
