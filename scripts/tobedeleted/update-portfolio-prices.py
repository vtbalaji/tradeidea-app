#!/usr/bin/env python3
"""
Update current prices for all open portfolio positions
Run this periodically to keep portfolio P&L updated
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

def update_portfolio_prices():
    """Update currentPrice for all open portfolio positions"""
    print('=' * 70)
    print('📈 Update Portfolio Current Prices')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    try:
        # Fetch all open positions
        portfolios_ref = db.collection('portfolios')
        query = portfolios_ref.where('status', '==', 'open')

        positions = []
        for doc in query.stream():
            data = doc.to_dict()
            positions.append({
                'id': doc.id,
                'symbol': data.get('symbol'),
                'entryPrice': data.get('entryPrice', 0)
            })

        print(f'📊 Found {len(positions)} open positions\n')

        if len(positions) == 0:
            print('✅ No open positions to update')
            return

        # Group positions by symbol to minimize API calls
        symbols_map = {}
        for pos in positions:
            symbol = pos['symbol']
            if symbol not in symbols_map:
                symbols_map[symbol] = []
            symbols_map[symbol].append(pos)

        print(f'📊 Unique symbols: {len(symbols_map)}\n')

        updated_count = 0
        error_count = 0

        for symbol, positions_for_symbol in symbols_map.items():
            try:
                print(f'  Fetching {symbol}... ', end='', flush=True)

                # Fetch current price from Yahoo Finance
                ticker = yf.Ticker(f'{symbol}.NS')
                hist = ticker.history(period='1d')

                if hist.empty:
                    print(f'⚠️  No data available')
                    error_count += len(positions_for_symbol)
                    continue

                current_price = hist['Close'].iloc[-1]
                print(f'₹{current_price:.2f}')

                # Update all positions for this symbol
                for pos in positions_for_symbol:
                    try:
                        db.collection('portfolios').document(pos['id']).update({
                            'currentPrice': current_price,
                            'updatedAt': firestore.SERVER_TIMESTAMP
                        })
                        updated_count += 1
                    except Exception as e:
                        print(f'    ❌ Failed to update position {pos["id"]}: {str(e)}')
                        error_count += 1

            except Exception as e:
                print(f'❌ Error: {str(e)}')
                error_count += len(positions_for_symbol)

        print()
        print('=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'Total positions: {len(positions)}')
        print(f'✅ Updated: {updated_count}')
        print(f'❌ Errors: {error_count}')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        update_portfolio_prices()
        print('\n✅ Job completed successfully')
        sys.exit(0)
    except KeyboardInterrupt:
        print('\n\n❌ Cancelled by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
