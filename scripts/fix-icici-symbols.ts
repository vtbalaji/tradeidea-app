#!/usr/bin/env tsx

/**
 * Fix ICICI symbol codes in portfolio positions
 * Maps ICICI abbreviated codes to actual NSE symbols
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
}

const db = admin.firestore();

// ICICI symbol mapping
const ICICI_SYMBOL_MAP: { [key: string]: string } = {
  'ULTCEM': 'ULTRACEMCO',
  'HDFBAN': 'HDFCBANK',
  'TATCHE': 'TATACHEM',
  'ADAPOR': 'ADANIPORTS',
  'DELCOR': 'DELTACORP',
  'HINCOP': 'HINDCOPPER',
  'JSWSTE': 'JSWSTEEL',
  'NATALU': 'NATIONALUM',
  'NATMIN': 'NMDC',
  'ASIPAI': 'ASIANPAINT',
  'KPIGLO': 'KPIGREEN',
  'POWGRI': 'POWERGRID',
  'TATPOW': 'TATAPOWER',
  'RELIND': 'RELIANCE',
  'COCSHI': 'COCHINSHIP',
  'GATDIS': 'GATEWAYDIS',
  'JINSP': 'JINDALSTEL',
  'SARENE': 'SARDAEN',
  'TATSTE': 'TATASTEEL',
  'BALCHI': 'BALRAMCHIN',
  'BHAAIR': 'BHARTIARTL',
  'FINCAB': 'FINOLEXCAB',
  'KEIIND': 'KEI',
  'POLI': 'POLYCAB',
  'RAIIND': 'RAIN',
  'DIXTEC': 'DIXON',
  'ZOMLIM': 'ETERNAL',
  'BHEL': 'BHEL',
  'THERMA': 'THERMAX',
  'EMALIM': 'EMAMILTD',
  'HATAGR': 'HATSUN',
  'HINLEV': 'HINDUNILVR',
  'BAJFI': 'BAJFINANCE',
  'LICHF': 'LICHSGFIN',
  'NIITEC': 'COFORGE',
  'WIPRO': 'WIPRO',
  'SOMDIS': 'SOMDISTIL',
  'AMARAJ': 'ARE&M',
  'WHEIND': 'WHEELS',
};

async function fixSymbols() {
  console.log('🔍 Finding positions with ICICI symbol codes...\n');

  const snapshot = await db.collection('portfolio').get();

  let fixCount = 0;
  let skipCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentSymbol = data.symbol;

    if (ICICI_SYMBOL_MAP[currentSymbol]) {
      const correctSymbol = ICICI_SYMBOL_MAP[currentSymbol];
      console.log(`✏️  Fixing: ${currentSymbol} → ${correctSymbol} (${doc.id})`);

      await doc.ref.update({
        symbol: correctSymbol,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      fixCount++;
    } else {
      skipCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Symbol fix complete!');
  console.log(`   Fixed: ${fixCount} positions`);
  console.log(`   Skipped: ${skipCount} positions (already correct)`);
  console.log('='.repeat(60));
}

fixSymbols()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
