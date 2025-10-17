#!/usr/bin/env python3
"""Quick update for specific symbols"""

import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except:
    pass

db = firestore.client()

# Symbols from your screenshot
SYMBOLS = ['HINDALCO', 'GVPIL']  # Add more from your portfolio

for symbol in SYMBOLS:
    print(f'\n📥 Processing {symbol}...')
    try:
        ticker = yf.Ticker(f'{symbol}.NS')
        info = ticker.info

        sector = info.get('sector', 'Unknown')
        industry = info.get('industry', 'Unknown')
        market_cap = info.get('marketCap', 0)
        beta = info.get('beta', 1.0)
        company_name = info.get('longName') or info.get('shortName') or symbol

        print(f'  Sector: {sector}')
        print(f'  Industry: {industry}')
        print(f'  Market Cap: ₹{market_cap / 10000000:.0f} Cr')
        print(f'  Beta: {beta}')

        # Save to Firestore
        symbol_with_prefix = f'NS_{symbol}'
        doc_ref = db.collection('symbols').document(symbol_with_prefix)

        doc_ref.set({
            'symbol': symbol_with_prefix,
            'originalSymbol': symbol,
            'name': company_name,
            'sector': sector,
            'industry': industry,
            'fundamental': {
                'sector': sector,
                'industry': industry,
                'marketCap': market_cap,
                'beta': beta,
                'companyName': company_name,
                'updatedAt': firestore.SERVER_TIMESTAMP
            },
            'lastFetched': firestore.SERVER_TIMESTAMP
        }, merge=True)

        print(f'  ✅ Saved to Firestore!')

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')

print('\n✅ Done!')
