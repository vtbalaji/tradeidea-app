#!/usr/bin/env node

/**
 * Admin CLI Script: Grant Premium Access
 *
 * Usage:
 *   node scripts/admin/grantPremium.js <email> <days> <reason>
 *
 * Examples:
 *   node scripts/admin/grantPremium.js user@email.com 365 "Yearly subscription"
 *   node scripts/admin/grantPremium.js founder@email.com -1 "Lifetime - Founding member"
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

async function grantPremium(userEmail, durationDays, reason) {
  try {
    console.log('\n🔍 Searching for user:', userEmail);

    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).get();

    if (snapshot.empty) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const now = admin.firestore.Timestamp.now();
    const endDate = new Date();

    if (durationDays === -1) {
      // Lifetime premium
      endDate.setFullYear(endDate.getFullYear() + 100);
      console.log('⏰ Duration: Lifetime');
    } else {
      endDate.setDate(endDate.getDate() + durationDays);
      console.log(`⏰ Duration: ${durationDays} days`);
    }

    // Update user document
    await userDoc.ref.update({
      subscriptionStatus: 'premium',
      subscriptionTier: 'premium',
      premiumType: durationDays === -1 ? 'lifetime' : 'complimentary',
      manuallyGranted: true,
      grantedReason: reason,
      grantedBy: 'admin-cli',
      grantedAt: now,
      subscriptionStartDate: now,
      subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
      updatedAt: now,
    });

    console.log('✅ Premium access granted successfully!');
    console.log('📧 User:', userEmail);
    console.log('📅 Expires:', endDate.toISOString());
    console.log('📝 Reason:', reason);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
Usage:
  node scripts/admin/grantPremium.js <email> <days> <reason>

Arguments:
  email  - User email address
  days   - Duration in days (-1 for lifetime)
  reason - Reason for granting access

Examples:
  node scripts/admin/grantPremium.js user@email.com 365 "Yearly subscription"
  node scripts/admin/grantPremium.js founder@email.com -1 "Lifetime - Founding member"
  node scripts/admin/grantPremium.js beta@email.com 90 "Beta tester - 3 months"
  `);
  process.exit(1);
}

const [email, daysStr, ...reasonParts] = args;
const days = parseInt(daysStr);
const reason = reasonParts.join(' ');

if (isNaN(days)) {
  console.error('❌ Error: Days must be a number');
  process.exit(1);
}

grantPremium(email, days, reason);
