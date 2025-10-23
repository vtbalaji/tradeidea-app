#!/usr/bin/env node

/**
 * Admin CLI Script: List Premium Users
 *
 * Usage:
 *   node scripts/admin/listPremiumUsers.js [filter]
 *
 * Filter options:
 *   all        - All premium users (default)
 *   paid       - Only paid subscriptions
 *   manual     - Only manually granted
 *   expiring   - Expiring within 30 days
 *
 * Examples:
 *   node scripts/admin/listPremiumUsers.js
 *   node scripts/admin/listPremiumUsers.js paid
 *   node scripts/admin/listPremiumUsers.js expiring
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    // Try environment variables
    if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      throw new Error('Firebase credentials not found. Please set FIREBASE_ADMIN_* environment variables or create firebase-service-account.json');
    }
  }
}

const db = admin.firestore();

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toISOString().split('T')[0];
}

function getDaysRemaining(timestamp) {
  if (!timestamp) return Infinity;
  const now = new Date();
  const endDate = timestamp.toDate();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function listPremiumUsers(filter = 'all') {
  try {
    console.log('\n🔍 Fetching premium users...\n');

    // Query premium users
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('subscriptionTier', '==', 'premium')
      .get();

    if (snapshot.empty) {
      console.log('📭 No premium users found');
      process.exit(0);
    }

    let users = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const daysRemaining = getDaysRemaining(data.subscriptionEndDate);

      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        status: data.subscriptionStatus,
        premiumType: data.premiumType || 'N/A',
        manuallyGranted: data.manuallyGranted || false,
        startDate: data.subscriptionStartDate,
        endDate: data.subscriptionEndDate,
        daysRemaining,
        lastPaymentAmount: data.lastPaymentAmount || 0,
        grantedReason: data.grantedReason || 'N/A',
      });
    });

    // Apply filters
    switch (filter) {
      case 'paid':
        users = users.filter(u => u.premiumType === 'paid');
        break;
      case 'manual':
        users = users.filter(u => u.manuallyGranted === true);
        break;
      case 'expiring':
        users = users.filter(u => u.daysRemaining <= 30 && u.daysRemaining > 0);
        break;
      case 'all':
      default:
        // No filter
        break;
    }

    // Sort by expiry date
    users.sort((a, b) => a.daysRemaining - b.daysRemaining);

    console.log(`📊 Total Premium Users: ${users.length}`);
    console.log(`🎯 Filter: ${filter}\n`);
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.displayName || 'No Name'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎫 Status: ${user.status}`);
      console.log(`   💎 Type: ${user.premiumType}`);
      console.log(`   🤝 Manually Granted: ${user.manuallyGranted ? 'Yes' : 'No'}`);

      if (user.manuallyGranted) {
        console.log(`   📝 Reason: ${user.grantedReason}`);
      }

      if (user.lastPaymentAmount > 0) {
        console.log(`   💰 Last Payment: ₹${user.lastPaymentAmount}`);
      }

      console.log(`   📅 Start: ${formatDate(user.startDate)}`);
      console.log(`   📅 Expires: ${formatDate(user.endDate)}`);

      if (user.daysRemaining < Infinity) {
        const daysStr = user.daysRemaining > 0
          ? `${user.daysRemaining} days remaining`
          : `Expired ${Math.abs(user.daysRemaining)} days ago`;

        const emoji = user.daysRemaining > 30
          ? '✅'
          : user.daysRemaining > 0
          ? '⚠️'
          : '❌';

        console.log(`   ${emoji} ${daysStr}`);
      } else {
        console.log(`   ♾️  Lifetime/No expiry`);
      }
    });

    console.log('\n' + '─'.repeat(80) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const filter = args[0] || 'all';

const validFilters = ['all', 'paid', 'manual', 'expiring'];
if (!validFilters.includes(filter)) {
  console.log(`
Usage:
  node scripts/admin/listPremiumUsers.js [filter]

Filter options:
  all        - All premium users (default)
  paid       - Only paid subscriptions
  manual     - Only manually granted
  expiring   - Expiring within 30 days

Examples:
  node scripts/admin/listPremiumUsers.js
  node scripts/admin/listPremiumUsers.js paid
  node scripts/admin/listPremiumUsers.js expiring
  `);
  process.exit(1);
}

listPremiumUsers(filter);
