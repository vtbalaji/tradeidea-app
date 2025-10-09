#!/usr/bin/env tsx

/**
 * Check portfolio collection contents
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

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

async function checkPortfolio() {
  console.log('📊 Checking portfolio collection...\n');

  const snapshot = await db.collection('portfolio').get();

  console.log(`Total positions: ${snapshot.size}\n`);

  const byAccount: { [key: string]: number } = {};
  const symbols = new Set<string>();

  snapshot.forEach(doc => {
    const data = doc.data();
    const accountId = data.accountId || 'no-account';
    const symbol = data.symbol;
    const hasTechnicals = !!data.technicals;

    byAccount[accountId] = (byAccount[accountId] || 0) + 1;
    symbols.add(symbol);

    console.log(`${symbol.padEnd(15)} | Account: ${accountId.padEnd(30)} | Technicals: ${hasTechnicals ? '✅' : '❌'}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Summary by Account:');
  Object.entries(byAccount).forEach(([account, count]) => {
    console.log(`  ${account}: ${count} positions`);
  });

  console.log(`\nUnique symbols: ${symbols.size}`);
  console.log('Symbols:', Array.from(symbols).join(', '));
  console.log('='.repeat(60));
}

checkPortfolio()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
