// Script to seed Firestore with stock symbols
// Run with: npx ts-node scripts/seedSymbols.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

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
const fs = require('fs');
const path = require('path');

const symbolsPath = path.join(__dirname, 'nse-symbols.json');
const symbols = JSON.parse(fs.readFileSync(symbolsPath, 'utf-8'));

async function seedSymbols() {
  console.log('🌱 Starting symbol seed...');

  const symbolsCollection = collection(db, 'symbols');
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalCount = 0;

  for (const symbolData of symbols) {
    const docRef = doc(symbolsCollection, symbolData.symbol);

    batch.set(docRef, {
      symbol: symbolData.symbol,
      name: symbolData.name,
      searchName: symbolData.name.toUpperCase(), // For search
      exchange: symbolData.exchange,
      sector: symbolData.sector || '',
      industry: symbolData.industry || '',
      currency: symbolData.currency,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    batchCount++;
    totalCount++;

    // Firestore has a limit of 500 operations per batch
    if (batchCount === 500) {
      console.log(`📦 Committing batch of ${batchCount} symbols...`);
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    console.log(`📦 Committing final batch of ${batchCount} symbols...`);
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
