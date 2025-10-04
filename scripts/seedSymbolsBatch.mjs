// Script to seed Firestore with stock symbols in smaller batches
// Run with: node scripts/seedSymbolsBatch.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
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

const BATCH_SIZE = 200; // Upload 200 at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedSymbols() {
  console.log(`🌱 Starting symbol seed for ${symbols.length} symbols...`);
  console.log(`📦 Using batch size: ${BATCH_SIZE} symbols per batch`);

  const symbolsCollection = collection(db, 'symbols');
  let totalCount = 0;
  let skippedCount = 0;

  // Split into chunks of BATCH_SIZE
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const chunk = symbols.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let batchCount = 0;

    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(symbols.length / BATCH_SIZE)} (symbols ${i + 1}-${Math.min(i + BATCH_SIZE, symbols.length)})...`);

    for (const symbolData of chunk) {
      try {
        // Sanitize document ID
        const sanitizedSymbol = symbolData.symbol
          .replace(/&/g, 'AND')
          .replace(/[\/\[\]]/g, '_');
        const docId = `NS_${sanitizedSymbol}`;
        const docRef = doc(symbolsCollection, docId);

        // Only upload symbol and name
        batch.set(docRef, {
          symbol: symbolData.symbol,
          name: symbolData.name
        });

        batchCount++;
        totalCount++;
      } catch (error) {
        console.error(`⚠️  Error adding ${symbolData.symbol}:`, error.message);
        skippedCount++;
      }
    }

    // Commit this batch
    try {
      await batch.commit();
      console.log(`✅ Committed ${batchCount} symbols (Total: ${totalCount}/${symbols.length})`);

      // Wait before next batch to avoid rate limits
      if (i + BATCH_SIZE < symbols.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`❌ Batch commit failed:`, error.message);
      console.error(`Failed batch range: ${i + 1}-${Math.min(i + BATCH_SIZE, symbols.length)}`);
      skippedCount += batchCount;
    }
  }

  console.log(`\n✅ Successfully seeded ${totalCount} symbols!`);
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
