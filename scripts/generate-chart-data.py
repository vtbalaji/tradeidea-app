#!/usr/bin/env python3
"""
Generate Chart Data from DuckDB to Static JSON Files
Exports 1 year of OHLCV data for each symbol to public/chart-data/
Used by Next.js frontend for displaying price charts
"""

import json
import os
from pathlib import Path
import sys
import argparse

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase (if not already initialized)
try:
    firebase_admin.get_app()
except ValueError:
    cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

def get_etf_and_bees_symbols():
    """
    Get all ETF and BEES symbols from Firebase

    Returns:
        List of ETF/BEES symbol names
    """
    try:
        db = firestore.client()
        symbols_ref = db.collection('symbols')
        docs = symbols_ref.stream()

        etf_symbols = []
        for doc in docs:
            symbol = doc.id.replace('NS_', '')
            # Check if symbol contains ETF or BEES (case insensitive)
            if 'ETF' in symbol.upper() or 'BEES' in symbol.upper():
                etf_symbols.append(symbol)

        print(f'🏦 Found {len(etf_symbols)} ETF/BEES symbols')
        return etf_symbols

    except Exception as e:
        print(f'⚠️  Error fetching ETF/BEES symbols: {str(e)}')
        return []

def get_top_symbols_by_market_cap(limit=500):
    """
    Get top N symbols by market cap from Firebase
    ALWAYS includes all ETF and BEES symbols regardless of market cap

    Args:
        limit: Number of top symbols to return (default 500)

    Returns:
        List of symbol names sorted by market cap (highest first) + all ETFs/BEES
    """
    try:
        db = firestore.client()

        # Get all symbols with market cap data
        symbols_ref = db.collection('symbols')
        docs = symbols_ref.stream()

        symbols_with_mcap = []
        etf_bees_symbols = []

        for doc in docs:
            symbol = doc.id.replace('NS_', '')
            data = doc.to_dict()

            # Check if it's an ETF or BEES
            is_etf_bees = 'ETF' in symbol.upper() or 'BEES' in symbol.upper()

            if is_etf_bees:
                # Always include ETFs and BEES
                etf_bees_symbols.append(symbol)
            elif 'fundamental' in data and data['fundamental']:
                market_cap = data['fundamental'].get('marketCap', 0)
                if market_cap and market_cap > 0:
                    symbols_with_mcap.append({
                        'symbol': symbol,
                        'marketCap': market_cap
                    })

        # Sort by market cap (descending) and take top N
        symbols_with_mcap.sort(key=lambda x: x['marketCap'], reverse=True)
        top_symbols = [s['symbol'] for s in symbols_with_mcap[:limit]]

        # Combine top stocks + all ETFs/BEES
        all_symbols = top_symbols + etf_bees_symbols

        print(f'📊 Found {len(symbols_with_mcap)} symbols with market cap data')
        print(f'🎯 Selecting top {limit} by market cap')
        print(f'🏦 Adding {len(etf_bees_symbols)} ETF/BEES symbols')
        print(f'📈 Total symbols: {len(all_symbols)}')

        return all_symbols

    except Exception as e:
        print(f'⚠️  Error fetching market cap data: {str(e)}')
        print('   Falling back to all symbols from DuckDB')
        return None

def generate_chart_data(priority_only=False, top_n=500, limit=None):
    """
    Generate static JSON files for all symbols

    Args:
        priority_only: If True, only generate top N by market cap (for faster builds)
        top_n: Number of top companies by market cap to generate (default 500)
        limit: Optional limit for number of symbols to process (for testing)
    """

    # Create output directory
    output_dir = Path('public/chart-data')
    output_dir.mkdir(parents=True, exist_ok=True)

    nse_fetcher = NSEDataFetcher()

    # Get symbols based on priority mode
    if priority_only:
        # Get top N by market cap from Firebase
        symbols = get_top_symbols_by_market_cap(top_n)

        if symbols is None:
            # Fallback to DuckDB if Firebase fails
            query = f"SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol LIMIT {top_n}"
            df = nse_fetcher.conn.execute(query).fetchdf()
            symbols = df['symbol'].tolist()

        mode = f"top {top_n} by market cap"
    else:
        # Get all symbols from DuckDB
        query = "SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol"
        df = nse_fetcher.conn.execute(query).fetchdf()
        symbols = df['symbol'].tolist()
        mode = "all"

    # Apply additional limit if specified (for testing)
    if limit:
        symbols = symbols[:limit]
        mode = f"limited to {limit}"
    print(f'📊 Generating chart data for {len(symbols)} symbols ({mode})...')
    print(f'📁 Output directory: {output_dir.absolute()}')
    print('─' * 80)

    success_count = 0
    error_count = 0

    for i, symbol in enumerate(symbols):
        try:
            # Get 1 year of data (365 days)
            df = nse_fetcher.get_data(symbol, days=365)

            if df.empty:
                print(f'  ⚠️  {symbol}: No data available')
                error_count += 1
                continue

            # Convert to simple format for charts
            chart_data = []
            for _, row in df.iterrows():
                # Handle date formatting
                date_str = row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date'])

                chart_data.append({
                    'date': date_str,
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'close': float(row['close']),
                    'volume': int(row['volume'])
                })

            # Write to JSON file (compact format to save space)
            output_file = output_dir / f'{symbol}.json'
            with open(output_file, 'w') as f:
                json.dump({
                    'symbol': symbol,
                    'data': chart_data,
                    'lastUpdated': chart_data[-1]['date'] if chart_data else None,
                    'recordCount': len(chart_data)
                }, f, separators=(',', ':'))  # Compact JSON (no spaces)

            success_count += 1

            # Progress update every 50 symbols
            if (i + 1) % 50 == 0:
                print(f'  Progress: {i+1}/{len(symbols)} symbols processed...')

        except Exception as e:
            print(f'  ❌ Error with {symbol}: {str(e)}')
            error_count += 1

    nse_fetcher.close()

    # Summary
    print('─' * 80)
    print(f'✅ Chart generation completed!')
    print(f'   Success: {success_count} files')
    print(f'   Errors: {error_count} files')
    print(f'   Output: {output_dir.absolute()}')

    # Calculate total size
    total_size = sum(f.stat().st_size for f in output_dir.glob('*.json'))
    size_mb = total_size / (1024 * 1024)
    print(f'   Total size: {size_mb:.2f} MB')

def main():
    """Main entry point with command line arguments"""
    parser = argparse.ArgumentParser(description='Generate chart data from DuckDB')
    parser.add_argument('--priority', action='store_true', help='Generate only top N symbols by market cap (faster)')
    parser.add_argument('--top', type=int, default=500, help='Number of top companies by market cap (default: 500)')
    parser.add_argument('--limit', type=int, help='Limit number of symbols to process (for testing)')
    parser.add_argument('--all', action='store_true', help='Generate all symbols (default)')

    args = parser.parse_args()

    # Determine mode
    priority_only = args.priority
    top_n = args.top
    limit = args.limit

    print('🚀 Chart Data Generator')
    print('=' * 80)

    try:
        generate_chart_data(priority_only=priority_only, top_n=top_n, limit=limit)
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Script failed: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
