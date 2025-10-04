// Script to seed Firestore with stock symbols
// Run with: node scripts/seedSymbols.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load NSE symbols from JSON file
const symbolsPath = path.join(__dirname, 'nse-symbols.json');
const symbols = JSON.parse(fs.readFileSync(symbolsPath, 'utf-8'));

async function seedSymbols() {
  console.log(`🌱 Starting symbol seed for ${symbols.length} symbols...`);

  const symbolsCollection = collection(db, 'symbols');
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalCount = 0;
  let skippedCount = 0;

  for (const symbolData of symbols) {
    try {
      // Sanitize document ID: Firestore IDs cannot contain /[]&
      // Replace & with AND, and other special chars with underscore
      const sanitizedSymbol = symbolData.symbol
        .replace(/&/g, 'AND')
        .replace(/[\/\[\]]/g, '_');
      const docId = `NS_${sanitizedSymbol}`;

      // Validate document ID length (max 1500 bytes)
      if (docId.length > 1500) {
        console.warn(`⚠️  Skipping ${symbolData.symbol}: Document ID too long`);
        skippedCount++;
        continue;
      }

      const docRef = doc(symbolsCollection, docId);

      batch.set(docRef, {
        symbol: symbolData.symbol,
        name: symbolData.name,
        searchName: symbolData.name.toUpperCase(), // For search
        exchange: symbolData.exchange,
        sector: symbolData.sector || '',
        industry: symbolData.industry || '',
        currency: symbolData.currency,
        isin: symbolData.isin || '',
        isActive: symbolData.isActive !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      batchCount++;
      totalCount++;

      // Firestore has a limit of 500 operations per batch
      if (batchCount === 500) {
        console.log(`📦 Committing batch of ${batchCount} symbols... (${totalCount}/${symbols.length})`);
        try {
          await batch.commit();
        } catch (error) {
          console.error(`❌ Batch commit failed:`, error.message);
          console.error(`Last symbol in batch: ${symbolData.symbol}`);
          throw error;
        }
        batch = writeBatch(db);
        batchCount = 0;
      }
    } catch (error) {
      console.error(`❌ Error processing symbol ${symbolData.symbol}:`, error);
      skippedCount++;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    console.log(`📦 Committing final batch of ${batchCount} symbols... (${totalCount}/${symbols.length})`);
    await batch.commit();
  }

  console.log(`✅ Successfully seeded ${totalCount} symbols!`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} symbols due to errors`);
  }
}

// Run the seed
seedSymbols()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
