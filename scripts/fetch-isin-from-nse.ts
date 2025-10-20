#!/usr/bin/env tsx

/**
 * Fetch ISIN numbers from NSE and update Firestore symbols
 *
 * NSE provides a master file with all securities including ISINs
 * This script downloads it and updates our Firestore symbols collection
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

/**
 * Fetch NSE equity list with ISIN
 * NSE provides a CSV with all equity symbols and their ISINs
 */
async function fetchNSEEquityList(): Promise<string> {
  // Use curl to download the file (more reliable than node https for this)
  const { execSync } = await import('child_process');
  const tmpFile = '/tmp/nse-equity.csv';

  try {
    console.log('📡 Fetching NSE equity list from nsearchives.nseindia.com...');

    // Download using curl
    execSync(
      `curl -s -A "Mozilla/5.0" "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv" -o ${tmpFile}`,
      { stdio: 'inherit' }
    );

    // Read the file
    const data = fs.readFileSync(tmpFile, 'utf8');

    console.log(`✅ Successfully fetched NSE equity list (${data.length} bytes, ${data.split('\n').length} lines)`);

    return data;
  } catch (error: any) {
    throw new Error(`Failed to fetch NSE data: ${error.message}`);
  }
}

/**
 * Parse NSE CSV and extract symbol-ISIN mappings
 */
function parseNSEEquityCSV(csvData: string): Map<string, { isin: string; name: string }> {
  const lines = csvData.split('\n');
  const mappings = new Map<string, { isin: string; name: string }>();

  // NSE CSV format: SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE
  // Note: There are spaces after some commas
  // Skip header
  let invalidCount = 0;
  let validCount = 0;
  let skippedSeries = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma and trim each part
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 7) {
      if (i < 10) console.log(`⚠️  Line ${i}: Not enough fields (${parts.length})`);
      continue;
    }

    const symbol = parts[0];
    const companyName = parts[1];
    const series = parts[2];
    const isin = parts[6];

    // Debug first few lines
    if (i <= 5) {
      console.log(`Line ${i}: symbol=${symbol}, series=${series}, isin=${isin}, parts=${parts.length}`);
    }

    // Only process EQ series (equity)
    if (series !== 'EQ') {
      skippedSeries++;
      continue;
    }

    // Validate ISIN format (INE followed by 9 alphanumeric chars)
    if (!/^INE[A-Z0-9]{9}$/.test(isin)) {
      invalidCount++;
      if (invalidCount <= 5) {
        console.log(`⚠️  ${symbol}: Invalid ISIN format: "${isin}" (length=${isin.length})`);
      }
      continue;
    }

    if (symbol && isin) {
      mappings.set(symbol, { isin, name: companyName });
      validCount++;
    }
  }

  console.log(`📈 Processed ${lines.length} lines: ${validCount} valid, ${skippedSeries} non-EQ series, ${invalidCount} invalid ISINs`);

  console.log(`✅ Parsed ${mappings.size} valid equity symbols with ISINs`);
  return mappings;
}

/**
 * Update Firestore symbols with ISIN numbers
 */
async function updateFirestoreWithISINs() {
  console.log('🚀 Fetching ISIN numbers from NSE and updating Firestore\n');
  console.log('='.repeat(60));

  try {
    // Fetch NSE data
    const csvData = await fetchNSEEquityList();

    // Parse mappings
    const mappings = parseNSEEquityCSV(csvData);
    console.log(`📊 Found ${mappings.size} equity symbols with ISINs\n`);

    let updateCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    // Get all symbols from Firestore
    const symbolsSnapshot = await db.collection('symbols')
      .where('exchange', '==', 'NSE')
      .get();

    console.log(`🔍 Found ${symbolsSnapshot.size} NSE symbols in Firestore\n`);

    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of symbolsSnapshot.docs) {
      const symbolData = doc.data();
      const symbol = symbolData.symbol;
      const docId = doc.id;

      // Skip if already has ISIN
      if (symbolData.isin) {
        skipCount++;
        continue;
      }

      // Extract the actual trading symbol (without NS_ prefix)
      // Try multiple approaches to find the symbol
      let tradingSymbol = symbol;

      // If symbol field has NS_ prefix, remove it
      if (tradingSymbol && tradingSymbol.startsWith('NS_')) {
        tradingSymbol = tradingSymbol.substring(3);
      }

      // If docId has NS_ prefix and symbol field is empty/invalid, use docId
      if ((!tradingSymbol || tradingSymbol === docId) && docId.startsWith('NS_')) {
        tradingSymbol = docId.substring(3);
      }

      // Look up ISIN from NSE data
      const nseData = mappings.get(tradingSymbol);

      if (!nseData) {
        notFoundCount++;
        if (notFoundCount <= 10) {
          console.log(`⚠️  ${tradingSymbol} (doc: ${docId}): Not found in NSE equity list`);
        }
        continue;
      }

      // Update with ISIN
      batch.update(doc.ref, {
        isin: nseData.isin,
        updatedAt: new Date()
      });

      batchCount++;
      updateCount++;

      if (updateCount <= 20 || updateCount % 100 === 0) {
        console.log(`✅ ${tradingSymbol}: Added ISIN ${nseData.isin}`);
      }

      // Commit batch every 500 updates
      if (batchCount >= batchSize) {
        console.log(`\n💾 Committing batch of ${batchCount} updates...`);
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      console.log(`\n💾 Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated:   ${updateCount}`);
    console.log(`   ⏭️  Skipped:   ${skipCount} (already had ISIN)`);
    console.log(`   ❌ Not found: ${notFoundCount}`);
    console.log(`   ❌ Errors:    ${errorCount}`);
    console.log(`   📦 Total:     ${symbolsSnapshot.size}`);
    console.log('='.repeat(60));
    console.log('\n✨ Done!\n');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  }
}

// Run the script
updateFirestoreWithISINs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
