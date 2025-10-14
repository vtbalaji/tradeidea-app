#!/usr/bin/env python3
"""
Fetch NSE EOD Data Daily

Fetches End-of-Day data from NSE for all symbols in Firebase
and stores it in DuckDB for fast local access.

This should be run after market hours (after 6 PM IST) to get
the latest EOD data.

Requirements:
    pip install --break-system-packages duckdb jugaad-data pandas firebase-admin

Usage:
    python3 scripts/fetch-eod-data.py
"""

import sys
import os
from datetime import datetime

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized
    pass

db = firestore.client()

def get_symbols_from_firebase():
    """Get all unique symbols from Firebase"""
    print('📊 Fetching symbols from Firebase...')
    symbols = set()

    # From symbols collection (master list)
    print('  📋 From symbols collection...')
    symbols_ref = db.collection('symbols')
    symbols_count = 0
    for doc in symbols_ref.stream():
        data = doc.to_dict()
        symbol = data.get('originalSymbol') or data.get('symbol') or doc.id
        # Remove NS_ prefix if present
        if symbol.startswith('NS_'):
            symbol = symbol.replace('NS_', '')
        if symbol:
            symbols.add(symbol)
            symbols_count += 1
    print(f'  ✅ Found {symbols_count} symbols from symbols collection')

    # From active portfolios and ideas
    print('  📋 From active portfolios and ideas...')
    active_symbols = set()

    # From ideas
    ideas_ref = db.collection('ideas')
    for doc in ideas_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From tradingIdeas
    trading_ideas_ref = db.collection('tradingIdeas')
    for doc in trading_ideas_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From portfolios
    portfolios_ref = db.collection('portfolios')
    for doc in portfolios_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From user positions
    users_ref = db.collection('users')
    for user_doc in users_ref.stream():
        positions_ref = db.collection(f'users/{user_doc.id}/positions')
        for pos_doc in positions_ref.stream():
            data = pos_doc.to_dict()
            if 'symbol' in data:
                active_symbols.add(data['symbol'])

    print(f'  ✅ Found {len(active_symbols)} active symbols')

    # Combine both sources
    symbols = symbols.union(active_symbols)

    print(f'✅ Total unique symbols: {len(symbols)}\n')
    return sorted(list(symbols))

def fetch_eod_data():
    """Main function to fetch EOD data for all symbols"""
    print('🚀 NSE EOD Data Fetcher')
    print('=' * 80)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 80)

    start_time = datetime.now()

    try:
        # Get symbols from Firebase
        symbols = get_symbols_from_firebase()

        if not symbols:
            print('⚠️  No symbols found')
            return

        # Initialize DuckDB fetcher
        print('📦 Initializing DuckDB...')
        fetcher = NSEDataFetcher()
        print()

        # Track statistics
        success_count = 0
        fail_count = 0
        skipped_count = 0
        updated_symbols = []
        failed_symbols = []

        # Fetch data for each symbol
        for i, symbol in enumerate(symbols):
            print(f'[{i+1}/{len(symbols)}] {symbol}')

            try:
                # Fetch and store data
                success = fetcher.fetch_and_store(symbol)

                if success:
                    success_count += 1
                    updated_symbols.append(symbol)
                else:
                    fail_count += 1
                    failed_symbols.append(symbol)

            except KeyboardInterrupt:
                print('\n⚠️  Interrupted by user')
                break
            except Exception as e:
                print(f'  ❌ Error: {str(e)}')
                fail_count += 1
                failed_symbols.append(symbol)

        # Get database stats
        print('\n' + '=' * 80)
        print('📊 DATABASE STATISTICS')
        print('=' * 80)
        stats = fetcher.get_stats()
        print(f'  Total Rows: {stats["total_rows"]:,}')
        print(f'  Total Symbols: {stats["total_symbols"]}')
        print(f'  Date Range: {stats["min_date"]} to {stats["max_date"]}')

        # Close connection
        fetcher.close()

        # Calculate duration
        duration = (datetime.now() - start_time).total_seconds()

        # Print summary
        print('\n' + '=' * 80)
        print('📊 FETCH SUMMARY')
        print('=' * 80)
        print(f'  Total Symbols: {len(symbols)}')
        print(f'  ✅ Success: {success_count}')
        print(f'  ❌ Failed: {fail_count}')
        print(f'  ⏱️  Duration: {duration:.1f}s')
        print(f'  📅 Completed: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')

        # Show failed symbols if any
        if failed_symbols:
            print(f'\n❌ Failed Symbols ({len(failed_symbols)}):')
            for symbol in failed_symbols[:20]:  # Show first 20
                print(f'  - {symbol}')
            if len(failed_symbols) > 20:
                print(f'  ... and {len(failed_symbols) - 20} more')

        print('=' * 80)

        # Exit with appropriate code
        if fail_count > success_count:
            print('\n⚠️  More failures than successes - check NSE API status')
            sys.exit(1)
        else:
            print('\n✅ EOD data fetch completed successfully!')
            sys.exit(0)

    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    try:
        fetch_eod_data()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Unexpected error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
