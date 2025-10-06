#!/usr/bin/env tsx

/**
 * Load ALL NSE Symbols from CSV to Firebase
 *
 * Reads from scripts/nse-symbols-curated.csv (2,147 symbols)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
}

const db = getFirestore();

interface SymbolData {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  yahooSymbol: string;
  active: boolean;
  addedAt: Date;
}

async function loadSymbolsFromCSV() {
  console.log('🚀 Loading ALL NSE Symbols from CSV to Firebase\n');
  console.log('='.repeat(60));

  const startTime = Date.now();
  const csvPath = path.join(process.cwd(), 'scripts', 'nse-symbols-curated.csv');

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  console.log(`📊 Found ${dataLines.length} symbols in CSV\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    // Parse CSV line (simple CSV, no quotes)
    const parts = line.split(',');
    if (parts.length < 2) {
      console.log(`⚠️  Skipping invalid line ${i + 1}: ${line}`);
      failCount++;
      continue;
    }

    const symbol = parts[0].trim();
    const name = parts.slice(1).join(',').trim(); // Handle commas in company names

    if (!symbol || !name) {
      console.log(`⚠️  Skipping empty data at line ${i + 1}`);
      failCount++;
      continue;
    }

    const symbolId = `NS_${symbol}`;

    try {
      // Check if exists
      const docRef = db.collection('symbols').doc(symbolId);
      const doc = await docRef.get();

      if (doc.exists) {
        skippedCount++;
        if ((i + 1) % 100 === 0) {
          console.log(`[${i + 1}/${dataLines.length}] Progress: ${successCount} new, ${skippedCount} skipped`);
        }
        continue;
      }

      // Prepare document
      const symbolData: SymbolData = {
        id: symbolId,
        symbol: symbol,
        name: name,
        exchange: 'NSE',
        yahooSymbol: `${symbol}.NS`,
        active: true,
        addedAt: new Date()
      };

      batch.set(docRef, symbolData);
      batchCount++;
      successCount++;

      // Progress indicator every 100 symbols
      if ((i + 1) % 100 === 0) {
        console.log(`[${i + 1}/${dataLines.length}] Progress: ${successCount} new, ${skippedCount} skipped`);
      }

      // Commit batch every 500 documents
      if (batchCount >= batchSize) {
        console.log(`\n💾 Committing batch of ${batchCount} symbols...`);
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }

      // Small delay to avoid rate limits
      if ((i + 1) % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      console.error(`❌ Error processing ${symbol}:`, error.message);
      failCount++;
    }
  }

  // Commit remaining batch
  if (batchCount > 0) {
    console.log(`\n💾 Committing final batch of ${batchCount} symbols...`);
    await batch.commit();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Symbol Loading Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${successCount} symbols`);
  console.log(`⏭️  Skipped: ${skippedCount} symbols (already exist)`);
  console.log(`❌ Failed: ${failCount} symbols`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📈 Total in Firebase: ${successCount + skippedCount} symbols`);
  console.log('='.repeat(60));
}

// Run the script
if (require.main === module) {
  loadSymbolsFromCSV()
    .then(() => {
      console.log('\n✅ CSV import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ CSV import failed:', error);
      process.exit(1);
    });
}

export { loadSymbolsFromCSV };
