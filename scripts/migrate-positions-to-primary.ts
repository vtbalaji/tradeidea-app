import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: serviceAccountKey.json not found in project root');
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function migratePositionsToPrimary() {
  console.log('Starting migration of positions to Primary account...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }

    let totalUsers = 0;
    let totalPositionsUpdated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\nProcessing user: ${userId}`);

      // Get all positions for this user that don't have accountId
      const positionsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('positions')
        .get();

      if (positionsSnapshot.empty) {
        console.log(`  No positions found for user ${userId}`);
        continue;
      }

      let userPositionsUpdated = 0;
      const batch = db.batch();

      for (const positionDoc of positionsSnapshot.docs) {
        const positionData = positionDoc.data();

        // Only update if accountId is missing
        if (!positionData.accountId) {
          const positionRef = db
            .collection('users')
            .doc(userId)
            .collection('positions')
            .doc(positionDoc.id);

          // Use user-specific primary account ID
          batch.update(positionRef, {
            accountId: `${userId}-primary`,
            updatedAt: new Date()
          });

          userPositionsUpdated++;
          console.log(`  - Updating position: ${positionDoc.id} (${positionData.symbol || 'unknown'})`);
        }
      }

      if (userPositionsUpdated > 0) {
        await batch.commit();
        totalUsers++;
        totalPositionsUpdated += userPositionsUpdated;
        console.log(`  ✓ Updated ${userPositionsUpdated} positions for user ${userId}`);
      } else {
        console.log(`  - All positions already have accountId assigned`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration completed successfully!');
    console.log(`Total users processed: ${totalUsers}`);
    console.log(`Total positions updated: ${totalPositionsUpdated}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run the migration
migratePositionsToPrimary()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
