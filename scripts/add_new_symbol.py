#!/usr/bin/env python3
"""
Add New Symbol to Firebase Symbols Collection

This script adds technical and fundamental data for a symbol to Firebase.
Prerequisites: Symbol must already have EOD data in DuckDB (from fetch-eod-data.py)

Usage:
    python3 scripts/add_new_symbol.py TPLPLASTEH
    python3 scripts/add_new_symbol.py TPLPLASTEH BIOCON INFY

What it does:
    1. Runs technical analysis (DuckDB → Firebase symbols/technical)
    2. Runs fundamental analysis (Yahoo Finance → Firebase symbols/fundamental)

Collections modified:
    - Firebase: symbols collection ONLY
    - DuckDB: No changes (assumes data already exists)
"""

import sys
import subprocess
import os

def add_symbol(symbol):
    """Add single symbol by running technical and fundamental analysis"""
    symbol = symbol.upper()

    print(f'\n{"="*60}')
    print(f'🚀 Adding Symbol: {symbol}')
    print(f'{"="*60}')

    # Step 1: Technical Analysis (DuckDB → Firebase symbols/technical)
    print(f'\n📊 Step 1/2: Running technical analysis...')
    print('-' * 60)
    result = subprocess.run(
        ['python3', 'scripts/analyze-symbols-duckdb.py', symbol],
        cwd=os.getcwd()
    )

    if result.returncode != 0:
        print(f'\n❌ Technical analysis failed for {symbol}')
        print('   Possible reasons:')
        print('   - Symbol not found in DuckDB (run fetch-eod-data.py first)')
        print('   - Insufficient data for technical indicators')
        return False

    print(f'✅ Technical data saved to Firebase')

    # Step 2: Fundamental Analysis (Yahoo Finance → Firebase symbols/fundamental)
    print(f'\n💰 Step 2/2: Running fundamental analysis...')
    print('-' * 60)
    result = subprocess.run(
        ['python3', 'scripts/analyze-fundamentals.py', symbol],
        cwd=os.getcwd()
    )

    if result.returncode != 0:
        print(f'\n⚠️  Fundamental analysis failed for {symbol}')
        print('   (This is optional - technical data was saved)')
        print('   Possible reasons:')
        print('   - Market cap < 1000 Cr (too small for our system)')
        print('   - Symbol not found on Yahoo Finance')
    else:
        print(f'✅ Fundamental data saved to Firebase')

    # Success summary
    print(f'\n{"="*60}')
    print(f'✅ {symbol} added to Firebase symbols collection!')
    print(f'{"="*60}')
    print(f'🔗 Analysis page: http://localhost:3000/analysis?symbol={symbol}')
    print(f'🔗 Production: https://tradeidea.co.in/analysis?symbol={symbol}')
    print(f'{"="*60}')

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('❌ Error: No symbol provided')
        print('')
        print('Usage:')
        print('  python3 scripts/add_new_symbol.py SYMBOL1 [SYMBOL2...]')
        print('')
        print('Examples:')
        print('  python3 scripts/add_new_symbol.py TPLPLASTEH')
        print('  python3 scripts/add_new_symbol.py TPLPLASTEH BIOCON INFY')
        print('')
        print('Prerequisites:')
        print('  - Symbol must have EOD data in DuckDB')
        print('  - Run scripts/fetch-eod-data.py first if needed')
        sys.exit(1)

    symbols = sys.argv[1:]
    success_count = 0
    failed_symbols = []

    for i, symbol in enumerate(symbols):
        if len(symbols) > 1:
            print(f'\n\n[{i+1}/{len(symbols)}] Processing {symbol}...')

        if add_symbol(symbol):
            success_count += 1
        else:
            failed_symbols.append(symbol)

    # Final summary
    print(f'\n\n{"="*60}')
    print('📊 FINAL SUMMARY')
    print(f'{"="*60}')
    print(f'✅ Successfully added: {success_count}/{len(symbols)} symbols')

    if failed_symbols:
        print(f'❌ Failed: {", ".join(failed_symbols)}')

    print(f'{"="*60}')

    sys.exit(0 if success_count > 0 else 1)
