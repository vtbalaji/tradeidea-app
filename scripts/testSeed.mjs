// Test seed with one symbol
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function testSeed() {
  try {
    console.log('Testing single symbol write...');
    console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    const symbolData = {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Limited',
      exchange: 'NSE',
      sector: 'Oil & Gas',
      industry: 'Refineries',
      currency: 'INR',
      isin: 'INE002A01018',
      isActive: true
    };

    const docId = `NS_${symbolData.symbol}`;
    console.log('Document ID:', docId);
    console.log('Collection path: symbols');

    const docRef = doc(db, 'symbols', docId);
    console.log('Full path:', docRef.path);

    await setDoc(docRef, {
      ...symbolData,
      searchName: symbolData.name.toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Successfully wrote test symbol!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    process.exit(1);
  }
}

testSeed();
