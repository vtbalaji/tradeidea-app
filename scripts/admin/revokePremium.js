#!/usr/bin/env node

/**
 * Admin CLI Script: Revoke Premium Access
 *
 * Usage:
 *   node scripts/admin/revokePremium.js <email>
 *
 * Example:
 *   node scripts/admin/revokePremium.js user@email.com
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

async function revokePremium(userEmail) {
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
    const userData = userDoc.data();
    const now = admin.firestore.Timestamp.now();

    console.log('📋 Current status:', userData.subscriptionStatus || 'free');
    console.log('🎫 Current tier:', userData.subscriptionTier || 'free');

    // Update user document
    await userDoc.ref.update({
      subscriptionStatus: 'free',
      subscriptionTier: 'free',
      subscriptionEndDate: now, // Expire immediately
      cancelledAt: now,
      updatedAt: now,
    });

    console.log('✅ Premium access revoked successfully!');
    console.log('📧 User:', userEmail);
    console.log('📋 New status: free');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(`
Usage:
  node scripts/admin/revokePremium.js <email>

Arguments:
  email - User email address

Example:
  node scripts/admin/revokePremium.js user@email.com
  `);
  process.exit(1);
}

const [email] = args;
revokePremium(email);
