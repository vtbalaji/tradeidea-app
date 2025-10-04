// Script to seed Firestore with stock symbols (only symbol and name)
// Run with: node scripts/seedSymbolsSimple.mjs

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

async function seedSymbols() {
  console.log(`🌱 Starting symbol seed for ${symbols.length} symbols...`);

  const symbolsCollection = collection(db, 'symbols');
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalCount = 0;

  for (const symbolData of symbols) {
    // Sanitize document ID: Replace & with AND, and other special chars
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

    // Firestore has a limit of 500 operations per batch
    if (batchCount === 500) {
      console.log(`📦 Committing batch of ${batchCount} symbols... (${totalCount}/${symbols.length})`);
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    console.log(`📦 Committing final batch of ${batchCount} symbols... (${totalCount}/${symbols.length})`);
    await batch.commit();
  }

  console.log(`✅ Successfully seeded ${totalCount} symbols!`);
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
