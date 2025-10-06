#!/usr/bin/env tsx

/**
 * Load NSE Symbol Master Data to Firebase
 *
 * This script:
 * 1. Fetches NSE equity symbol list
 * 2. Formats as NS_{SYMBOL} for instrument tokens
 * 3. Uploads to Firestore /symbols collection
 *
 * Usage:
 *   npm run load-symbols
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import yahooFinance from 'yahoo-finance2';

// Initialize Firebase Admin
let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else {
  console.error('❌ serviceAccountKey.json not found in project root');
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
  id: string;           // NS_{SYMBOL}
  symbol: string;       // RELIANCE
  name: string;         // Reliance Industries Ltd
  exchange: string;     // NSE
  yahooSymbol: string;  // RELIANCE.NS
  active: boolean;
  addedAt: Date;
}

/**
 * NSE Top 500 symbols (curated list)
 * In production, you'd fetch from NSE API or a CSV file
 */
const NSE_SYMBOLS = [
  // Nifty 50
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
  { symbol: 'INFY', name: 'Infosys Ltd' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd' },
  { symbol: 'ITC', name: 'ITC Ltd' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd' },
  { symbol: 'WIPRO', name: 'Wipro Ltd' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd' },
  { symbol: 'TITAN', name: 'Titan Company Ltd' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd' },
  { symbol: 'NTPC', name: 'NTPC Ltd' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd' },
  { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories Ltd' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd' },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Ltd' },
  { symbol: 'CIPLA', name: 'Cipla Ltd' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & Special Economic Zone Ltd' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd' },
  { symbol: 'SHREECEM', name: 'Shree Cement Ltd' },
  { symbol: 'UPL', name: 'UPL Ltd' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd' },

  // Other Popular Stocks
  { symbol: 'ZOMATO', name: 'Zomato Ltd' },
  { symbol: 'PAYTM', name: 'One97 Communications Ltd' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures Ltd' },
  { symbol: 'IRCTC', name: 'Indian Railway Catering & Tourism Corporation Ltd' },
  { symbol: 'DMART', name: 'Avenue Supermarts Ltd' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd' },
  { symbol: 'HAVELLS', name: 'Havells India Ltd' },
  { symbol: 'VOLTAS', name: 'Voltas Ltd' },
  { symbol: 'DABUR', name: 'Dabur India Ltd' },
  { symbol: 'BIOCON', name: 'Biocon Ltd' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Ltd' },
  { symbol: 'LUPIN', name: 'Lupin Ltd' },
  { symbol: 'ALKEM', name: 'Alkem Laboratories Ltd' },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Ltd' },
  { symbol: 'PNB', name: 'Punjab National Bank' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda' },
  { symbol: 'CANBK', name: 'Canara Bank' },
  { symbol: 'UNIONBANK', name: 'Union Bank of India' },
  { symbol: 'SAIL', name: 'Steel Authority of India Ltd' },
  { symbol: 'VEDL', name: 'Vedanta Ltd' },
  { symbol: 'ACC', name: 'ACC Ltd' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd' },
  { symbol: 'DLF', name: 'DLF Ltd' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd' },
  { symbol: 'PRESTIGE', name: 'Prestige Estates Projects Ltd' },
  { symbol: 'LICHSGFIN', name: 'LIC Housing Finance Ltd' },
  { symbol: 'PFC', name: 'Power Finance Corporation Ltd' },
  { symbol: 'RECLTD', name: 'REC Ltd' },
  { symbol: 'IBULHSGFIN', name: 'Indiabulls Housing Finance Ltd' },
  { symbol: 'MFSL', name: 'Max Financial Services Ltd' },
  { symbol: 'ICICIPRULI', name: 'ICICI Prudential Life Insurance Company Ltd' },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance Company Ltd' },
  { symbol: 'BAJAJHLDNG', name: 'Bajaj Holdings & Investment Ltd' },
  { symbol: 'SIEMENS', name: 'Siemens Ltd' },
  { symbol: 'ABB', name: 'ABB India Ltd' },
  { symbol: 'BOSCHLTD', name: 'Bosch Ltd' },
  { symbol: 'CONCOR', name: 'Container Corporation of India Ltd' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd' },
  { symbol: 'ADANIPOWER', name: 'Adani Power Ltd' },
  { symbol: 'TATAPOWER', name: 'Tata Power Company Ltd' },
  { symbol: 'TORNTPOWER', name: 'Torrent Power Ltd' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd' },
  { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd' },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson International Ltd' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd' },
  { symbol: 'ESCORTS', name: 'Escorts Kubota Ltd' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd' },
  { symbol: 'MRF', name: 'MRF Ltd' },
  { symbol: 'APOLLOTYRE', name: 'Apollo Tyres Ltd' },
  { symbol: 'CEAT', name: 'CEAT Ltd' },
];

/**
 * Verify symbol exists on Yahoo Finance
 */
async function verifySymbol(symbol: string): Promise<boolean> {
  try {
    const quote = await yahooFinance.quote(`${symbol}.NS`);
    return quote && quote.regularMarketPrice !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Upload symbols to Firestore
 */
async function loadSymbols() {
  console.log('🚀 Loading NSE Symbol Master Data to Firebase\n');
  console.log('='.repeat(60));

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  const batch = db.batch();
  const batchSize = 500; // Firestore batch limit
  let batchCount = 0;

  for (let i = 0; i < NSE_SYMBOLS.length; i++) {
    const { symbol, name } = NSE_SYMBOLS[i];
    const symbolId = `NS_${symbol}`;

    console.log(`[${i + 1}/${NSE_SYMBOLS.length}] Processing ${symbol}...`);

    try {
      // Check if symbol already exists
      const docRef = db.collection('symbols').doc(symbolId);
      const doc = await docRef.get();

      if (doc.exists) {
        console.log(`  ⏭️  Already exists - skipping`);
        skippedCount++;
        continue;
      }

      // Verify on Yahoo Finance (optional, can be slow)
      // Uncomment to enable verification
      // console.log(`  🔍 Verifying on Yahoo Finance...`);
      // const isValid = await verifySymbol(symbol);
      // if (!isValid) {
      //   console.log(`  ❌ Not found on Yahoo Finance - skipping`);
      //   failCount++;
      //   continue;
      // }

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

      console.log(`  ✅ Queued for upload`);
      successCount++;

      // Commit batch every 500 documents
      if (batchCount >= batchSize) {
        console.log(`\n💾 Committing batch of ${batchCount} symbols...`);
        await batch.commit();
        batchCount = 0;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
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
  console.log('='.repeat(60));
}

// Run the script
if (require.main === module) {
  loadSymbols()
    .then(() => {
      console.log('\n✅ Symbol loading completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Symbol loading failed:', error);
      process.exit(1);
    });
}

export { loadSymbols };
