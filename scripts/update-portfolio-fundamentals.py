#!/usr/bin/env python3
"""
Quick script to update fundamentals for portfolio symbols only
Run this to quickly get sector/market cap data for your current holdings
"""

import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import sys
import os

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    pass  # Already initialized

db = firestore.client()

def get_portfolio_symbols():
    """Get unique symbols from all user positions"""
    print('📊 Fetching portfolio symbols from Firestore...')
    symbols = set()

    # Get from users/{userId}/positions
    users_ref = db.collection('users')
    for user_doc in users_ref.stream():
        positions_ref = db.collection(f'users/{user_doc.id}/positions')
        for pos_doc in positions_ref.stream():
            data = pos_doc.to_dict()
            if data.get('status') == 'open' and 'symbol' in data:
                symbols.add(data['symbol'])

    print(f'✅ Found {len(symbols)} unique symbols in portfolios\n')
    return sorted(list(symbols))

def fetch_and_save(symbol):
    """Fetch fundamentals and save to Firestore"""
    try:
        print(f'  📥 Fetching {symbol}...')
        ticker = yf.Ticker(f'{symbol}.NS')
        info = ticker.info

        if not info or 'symbol' not in info:
            print(f'  ⚠️  No data available')
            return False

        # Extract key data
        fundamentals = {
            'sector': info.get('sector'),
            'industry': info.get('industry'),
            'marketCap': info.get('marketCap'),
            'beta': info.get('beta'),
            'companyName': info.get('longName') or info.get('shortName'),
            'trailingPE': info.get('trailingPE'),
            'returnOnEquity': info.get('returnOnEquity'),
            'debtToEquity': info.get('debtToEquity'),
        }

        # Convert percentages
        if fundamentals['returnOnEquity']:
            fundamentals['returnOnEquity'] = round(fundamentals['returnOnEquity'] * 100, 2)
        if fundamentals['debtToEquity']:
            fundamentals['debtToEquity'] = round(fundamentals['debtToEquity'] / 100, 2)

        # Save to Firestore
        symbol_with_prefix = f'NS_{symbol}' if not symbol.startswith('NS_') else symbol
        symbols_doc = db.collection('symbols').document(symbol_with_prefix)

        symbols_doc.set({
            'symbol': symbol_with_prefix,
            'originalSymbol': symbol,
            'name': fundamentals.get('companyName', symbol),
            'sector': fundamentals.get('sector'),
            'industry': fundamentals.get('industry'),
            'fundamental': {
                **fundamentals,
                'updatedAt': firestore.SERVER_TIMESTAMP
            },
            'lastFetched': firestore.SERVER_TIMESTAMP
        }, merge=True)

        print(f'  ✅ {symbol} - {fundamentals.get("sector", "Unknown")} | ₹{(fundamentals.get("marketCap", 0) / 10000000):.0f} Cr')
        return True

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')
        return False

def main():
    print('🚀 Quick Portfolio Fundamentals Update\n')
    print('=' * 60)

    symbols = get_portfolio_symbols()

    if not symbols:
        print('⚠️  No symbols found in portfolios')
        return

    success = 0
    failed = 0

    for i, symbol in enumerate(symbols):
        print(f'\n[{i+1}/{len(symbols)}] {symbol}')
        if fetch_and_save(symbol):
            success += 1
        else:
            failed += 1

    print('\n' + '=' * 60)
    print(f'✅ Success: {success} | ❌ Failed: {failed}')
    print('=' * 60)

if __name__ == '__main__':
    try:
        main()
        print('\n✅ Portfolio fundamentals updated!')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        sys.exit(1)
