#!/usr/bin/env tsx

/**
 * Add ISIN numbers to specific symbols in Firestore
 * Run this script to add missing ISIN mappings for portfolio import
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
  console.error('   Place your Firebase service account key in the project root');
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
 * ISIN mappings for common stocks
 * Add more as needed
 */
const ISIN_MAPPINGS: { [symbol: string]: { isin: string; name: string } } = {
  'BEL': {
    isin: 'INE263A01024',
    name: 'BHARAT ELECTRONICS LIMITED'
  },
  'GEPIL': {
    isin: 'INE878A01011',
    name: 'GE POWER INDIA LIMITED'
  },
  'HINDALCO': {
    isin: 'INE038A01020',
    name: 'HINDALCO INDUSTRIES LIMITED'
  },
  // Add more common stocks
  'RELIANCE': {
    isin: 'INE002A01018',
    name: 'RELIANCE INDUSTRIES LIMITED'
  },
  'TCS': {
    isin: 'INE467B01029',
    name: 'TATA CONSULTANCY SERVICES LIMITED'
  },
  'INFY': {
    isin: 'INE009A01021',
    name: 'INFOSYS LIMITED'
  },
  'HDFCBANK': {
    isin: 'INE040A01034',
    name: 'HDFC BANK LIMITED'
  },
  'ICICIBANK': {
    isin: 'INE090A01021',
    name: 'ICICI BANK LIMITED'
  },
  'SBIN': {
    isin: 'INE062A01020',
    name: 'STATE BANK OF INDIA'
  },
  'BHARTIARTL': {
    isin: 'INE397D01024',
    name: 'BHARTI AIRTEL LIMITED'
  },
  'LT': {
    isin: 'INE018A01030',
    name: 'LARSEN & TOUBRO LIMITED'
  },
  'KOTAKBANK': {
    isin: 'INE237A01028',
    name: 'KOTAK MAHINDRA BANK LIMITED'
  },
  'AXISBANK': {
    isin: 'INE238A01034',
    name: 'AXIS BANK LIMITED'
  },
  'TATAMOTORS': {
    isin: 'INE155A01022',
    name: 'TATA MOTORS LIMITED'
  },
  'TATASTEEL': {
    isin: 'INE081A01020',
    name: 'TATA STEEL LIMITED'
  },
  'WIPRO': {
    isin: 'INE075A01022',
    name: 'WIPRO LIMITED'
  },
  'ASIANPAINT': {
    isin: 'INE021A01026',
    name: 'ASIAN PAINTS LIMITED'
  },
  'MARUTI': {
    isin: 'INE585B01010',
    name: 'MARUTI SUZUKI INDIA LIMITED'
  },
  'HINDUNILVR': {
    isin: 'INE030A01027',
    name: 'HINDUSTAN UNILEVER LIMITED'
  },
  'ITC': {
    isin: 'INE154A01025',
    name: 'ITC LIMITED'
  },
  'BAJFINANCE': {
    isin: 'INE296A01024',
    name: 'BAJAJ FINANCE LIMITED'
  },
};

async function addISINToSymbols() {
  console.log('🚀 Adding ISIN numbers to Firestore symbols\n');
  console.log('='.repeat(60));

  let updateCount = 0;
  let createCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [symbol, data] of Object.entries(ISIN_MAPPINGS)) {
    const symbolId = `NS_${symbol}`;

    try {
      const docRef = db.collection('symbols').doc(symbolId);
      const doc = await docRef.get();

      if (doc.exists) {
        const existingData = doc.data();

        // Check if ISIN already exists
        if (existingData?.isin === data.isin) {
          console.log(`⏭️  ${symbol}: ISIN already set (${data.isin})`);
          skipCount++;
        } else {
          // Update with ISIN
          await docRef.update({
            isin: data.isin,
            updatedAt: new Date()
          });
          console.log(`✅ ${symbol}: Added ISIN ${data.isin}`);
          updateCount++;
        }
      } else {
        // Create new document with ISIN
        await docRef.set({
          id: symbolId,
          symbol: symbol,
          name: data.name,
          isin: data.isin,
          exchange: 'NSE',
          yahooSymbol: `${symbol}.NS`,
          active: true,
          addedAt: new Date()
        });
        console.log(`🆕 ${symbol}: Created with ISIN ${data.isin}`);
        createCount++;
      }

    } catch (error: any) {
      console.error(`❌ ${symbol}: Error - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Updated: ${updateCount}`);
  console.log(`   🆕 Created: ${createCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors:  ${errorCount}`);
  console.log(`   📦 Total:   ${Object.keys(ISIN_MAPPINGS).length}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!\n');
}

// Run the script
addISINToSymbols()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
