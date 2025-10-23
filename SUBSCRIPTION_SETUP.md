# Subscription System Setup Guide

This guide will help you set up the payment-based subscription system with Razorpay integration.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Razorpay Setup](#razorpay-setup)
3. [Environment Configuration](#environment-configuration)
4. [Install Dependencies](#install-dependencies)
5. [Database Migration](#database-migration)
6. [Testing](#testing)
7. [Admin Management](#admin-management)
8. [Deployment](#deployment)

---

## Prerequisites

- Node.js 18+ installed
- Firebase project with Firestore database
- Razorpay account (Indian payment gateway)
- Existing MyPortfolio app setup

---

## Razorpay Setup

### 1. Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a new account
3. Complete KYC verification (required for live mode)

### 2. Get API Keys

1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate API keys:
   - **Test Mode**: Use for development
   - **Live Mode**: Use for production (after KYC approval)
4. Copy:
   - `Key ID` (public key)
   - `Key Secret` (private key)

### 3. Setup Webhook

1. Go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/subscription/webhook
   ```
4. Select events to listen to:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.paused
5. Copy the **Webhook Secret**

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.subscription.example .env.local
```

### 2. Fill in Environment Variables

Edit `.env.local` and add:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Admin Emails (comma-separated)
ADMIN_EMAILS=your-email@gmail.com,admin2@example.com

# Firebase Admin (if not already configured)
# Option 1: Service Account JSON
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'

# Or Option 2: Individual variables
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Test Mode vs Live Mode

**Development:**
- Use `rzp_test_` keys
- Test payments with test cards
- No real money transactions

**Production:**
- Use `rzp_live_` keys (after KYC approval)
- Real payment processing
- GST compliance required

---

## Install Dependencies

```bash
# Install Razorpay SDK
npm install razorpay

# Or if using yarn
yarn add razorpay
```

---

## Database Migration

### Update Existing Users

Run this script to add subscription fields to existing users:

```javascript
// scripts/admin/migrateUsers.js
const admin = require('firebase-admin');
const { getAdminDb } = require('../../lib/firebaseAdmin');

async function migrateUsers() {
  const db = getAdminDb();
  const usersSnapshot = await db.collection('users').get();

  console.log(`Migrating ${usersSnapshot.size} users...`);

  const batch = db.batch();

  usersSnapshot.forEach((doc) => {
    const data = doc.data();

    // Skip if already migrated
    if (data.subscriptionStatus) {
      console.log(`Skipping ${data.email} - already migrated`);
      return;
    }

    batch.update(doc.ref, {
      subscriptionStatus: 'free',
      subscriptionTier: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      paymentProvider: null,
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      lastPaymentDate: null,
      lastPaymentAmount: null,
      premiumType: null,
      manuallyGranted: false,
      grantedBy: null,
      grantedReason: null,
      grantedAt: null,
      autoRenew: false,
      cancelledAt: null,
      trialStartDate: null,
      trialEndDate: null,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });

  await batch.commit();
  console.log('✅ Migration complete!');
}

migrateUsers().catch(console.error);
```

Run migration:
```bash
node scripts/admin/migrateUsers.js
```

---

## Testing

### Test Payment Flow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Pricing Page**
   ```
   http://localhost:3000/pricing
   ```

3. **Click "Subscribe Now"**

4. **Use Test Card Details**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: Any 3 digits
   Expiry: Any future date
   Name: Any name
   ```

5. **Complete Payment**
   - Payment should succeed
   - User subscription should update to "Premium"
   - Redirect to portfolio page

6. **Verify Subscription**
   - Check `/subscription` page
   - Should show "Premium" status
   - Try accessing premium features

### Test UPI Payment

```
UPI ID: success@razorpay
```

### Test Failed Payment

```
Card Number: 4000 0000 0000 0002
```

---

## Admin Management

### Grant Premium Access Manually

```bash
# Grant 1 year premium
npm run admin:grant user@email.com 365 "Promotional access"

# Grant lifetime premium
npm run admin:grant founder@email.com -1 "Founding member"

# Grant 90 days for beta testing
npm run admin:grant beta@email.com 90 "Beta tester"
```

### Revoke Premium Access

```bash
npm run admin:revoke spam@email.com
```

### List All Premium Users

```bash
# List all premium users
npm run admin:list

# List only paid subscriptions
npm run admin:list paid

# List only manual grants
npm run admin:list manual

# List expiring soon (within 30 days)
npm run admin:list expiring
```

### Admin API Routes

You can also use API routes with admin access:

```bash
# Grant premium via API
curl -X POST https://yourdomain.com/api/admin/grant-premium \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "userEmail": "user@example.com",
    "durationDays": 365,
    "reason": "Promotional access",
    "premiumType": "complimentary"
  }'
```

---

## Deployment

### 1. Environment Variables

Set these in your production environment (Vercel, etc.):

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
ADMIN_EMAILS=admin@yourdomain.com
```

### 2. Razorpay Webhook

Update webhook URL in Razorpay Dashboard:
```
https://yourdomain.com/api/subscription/webhook
```

### 3. Switch to Live Keys

**Important:** Only switch to live keys after:
- ✅ KYC verification approved
- ✅ Test payments working correctly
- ✅ Webhook tested and verified
- ✅ Subscription flow tested end-to-end

### 4. Deploy

```bash
# Vercel
vercel --prod

# Or other platforms
npm run build
npm start
```

---

## Troubleshooting

### Payment Fails with "Invalid Key"

- Check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` starts with `rzp_test_` or `rzp_live_`
- Verify keys are correctly set in `.env.local`
- Restart development server after changing env variables

### Webhook Not Receiving Events

- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check Razorpay Dashboard > Webhooks > Event Logs
- Test webhook manually using Razorpay Dashboard

### Subscription Not Updating After Payment

- Check browser console for errors
- Verify `/api/subscription/verify-payment` is called
- Check server logs for errors
- Verify Firebase permissions

### Admin Commands Not Working

- Check Firebase Admin credentials are set
- Verify `firebase-service-account.json` exists
- Or set individual Firebase Admin env variables
- Check file path in admin scripts

---

## Security Checklist

- ✅ Never commit `.env.local` to git
- ✅ Keep Razorpay Key Secret secure (server-side only)
- ✅ Verify webhook signatures
- ✅ Validate payment amounts on server-side
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on API routes
- ✅ Log all payment transactions
- ✅ Monitor webhook failures

---

## Support

### Razorpay Issues

- Dashboard: https://dashboard.razorpay.com
- Support: https://razorpay.com/support
- Docs: https://razorpay.com/docs

### Firebase Issues

- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs

---

## Feature Roadmap

**Implemented:**
- ✅ Yearly subscription with Razorpay
- ✅ Feature gating (client & server)
- ✅ Admin CLI for manual management
- ✅ Subscription status page
- ✅ Pricing page with payment flow

**Future Enhancements:**
- Monthly subscription option
- Referral program
- Student discount
- Team/family plans
- Automated renewal reminders
- Invoice generation
- GST integration
- Analytics dashboard

---

## Questions?

If you encounter any issues or have questions:
1. Check this guide first
2. Review error logs
3. Test with Razorpay test mode
4. Check Razorpay Dashboard event logs
5. Create an issue in the repository

Good luck! 🚀
