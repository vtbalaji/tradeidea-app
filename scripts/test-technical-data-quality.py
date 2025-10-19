#!/usr/bin/env python3
"""
Technical Data Quality Test Script

Tests data quality by comparing:
1. DuckDB data vs Yahoo Finance (source of truth)
2. MACD calculations
3. Data completeness and freshness
4. Price continuity (gaps, splits)

Usage:
    python3 scripts/test-technical-data-quality.py ADANIPOWER
    python3 scripts/test-technical-data-quality.py  # Test all active symbols
"""

import sys
import yfinance as yf
import duckdb
import pandas as pd
from ta.trend import MACD
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()

def test_symbol(symbol_base: str, verbose: bool = True):
    """
    Test data quality for a single symbol

    Returns dict with test results:
    {
        'symbol': str,
        'passed': bool,
        'issues': list[str],
        'warnings': list[str],
        'macd_match': bool,
        'price_match': bool,
        'data_fresh': bool
    }
    """
    symbol_yf = f"{symbol_base}.NS"
    results = {
        'symbol': symbol_base,
        'passed': True,
        'issues': [],
        'warnings': [],
        'macd_match': False,
        'price_match': False,
        'data_fresh': False
    }

    if verbose:
        print(f'\n{"="*70}')
        print(f'🔍 Testing {symbol_base}')
        print(f'{"="*70}\n')

    # ===== TEST 1: Fetch data from both sources =====
    try:
        # Yahoo Finance
        yf_stock = yf.Ticker(symbol_yf)
        yf_data = yf_stock.history(period='3mo')

        if len(yf_data) == 0:
            results['issues'].append('No data from Yahoo Finance')
            results['passed'] = False
            return results

        # DuckDB
        conn = duckdb.connect('data/eod.duckdb', read_only=True)
        db_data = conn.execute(f"""
            SELECT date, close as Close
            FROM ohlcv
            WHERE symbol = '{symbol_base}'
            ORDER BY date DESC
            LIMIT 90
        """).fetchdf()
        conn.close()

        if len(db_data) == 0:
            results['issues'].append('❌ No data in DuckDB')
            results['passed'] = False
            if verbose:
                print('❌ TEST 1 FAILED: No data in DuckDB')
            return results

        db_data['date'] = pd.to_datetime(db_data['date'])
        db_data = db_data.set_index('date')
        db_data = db_data.sort_index()

        if verbose:
            print('✅ TEST 1 PASSED: Data fetched from both sources')
            print(f'   Yahoo Finance: {len(yf_data)} rows')
            print(f'   DuckDB:        {len(db_data)} rows')

    except Exception as e:
        results['issues'].append(f'Data fetch error: {str(e)}')
        results['passed'] = False
        return results

    # ===== TEST 2: Check data freshness =====
    yf_last_date = yf_data.index[-1].date()
    db_last_date = db_data.index[-1].date()

    days_behind = (yf_last_date - db_last_date).days

    if days_behind == 0:
        results['data_fresh'] = True
        if verbose:
            print(f'\n✅ TEST 2 PASSED: Data is up to date')
            print(f'   Last date: {db_last_date}')
    elif days_behind <= 1:
        results['data_fresh'] = True
        results['warnings'].append(f'DuckDB is {days_behind} day behind Yahoo Finance')
        if verbose:
            print(f'\n⚠️  TEST 2 WARNING: DuckDB is {days_behind} day behind')
            print(f'   Yahoo Finance: {yf_last_date}')
            print(f'   DuckDB:        {db_last_date}')
    else:
        results['data_fresh'] = False
        results['issues'].append(f'DuckDB is {days_behind} days behind Yahoo Finance')
        results['passed'] = False
        if verbose:
            print(f'\n❌ TEST 2 FAILED: DuckDB is {days_behind} days behind!')
            print(f'   Yahoo Finance: {yf_last_date}')
            print(f'   DuckDB:        {db_last_date}')

    # ===== TEST 3: Compare latest prices =====
    yf_latest_price = yf_data['Close'].iloc[-1]
    db_latest_price = db_data['Close'].iloc[-1]
    price_diff_pct = abs((yf_latest_price - db_latest_price) / yf_latest_price * 100)

    if price_diff_pct < 0.5:
        results['price_match'] = True
        if verbose:
            print(f'\n✅ TEST 3 PASSED: Prices match')
            print(f'   Yahoo Finance: ₹{yf_latest_price:.2f}')
            print(f'   DuckDB:        ₹{db_latest_price:.2f}')
    else:
        results['price_match'] = False
        results['issues'].append(f'Price mismatch: {price_diff_pct:.2f}% difference')
        results['passed'] = False
        if verbose:
            print(f'\n❌ TEST 3 FAILED: Price mismatch!')
            print(f'   Yahoo Finance: ₹{yf_latest_price:.2f}')
            print(f'   DuckDB:        ₹{db_latest_price:.2f}')
            print(f'   Difference:    {price_diff_pct:.2f}%')

    # ===== TEST 4: Compare MACD calculations =====
    try:
        # Need at least 26 data points for MACD
        if len(yf_data) >= 26 and len(db_data) >= 26:
            # Calculate MACD from both sources
            macd_yf = MACD(close=yf_data['Close'], window_slow=26, window_fast=12, window_sign=9)
            hist_yf = macd_yf.macd_diff().iloc[-1]

            macd_db = MACD(close=db_data['Close'], window_slow=26, window_fast=12, window_sign=9)
            hist_db = macd_db.macd_diff().iloc[-1]

            hist_diff = abs(hist_yf - hist_db)

            # Check if signs are different (positive vs negative)
            if (hist_yf > 0 and hist_db < 0) or (hist_yf < 0 and hist_db > 0):
                results['macd_match'] = False
                results['issues'].append(f'MACD histogram sign mismatch: YF={hist_yf:.4f}, DB={hist_db:.4f}')
                results['passed'] = False
                if verbose:
                    print(f'\n❌ TEST 4 FAILED: MACD histogram SIGN MISMATCH!')
                    print(f'   Yahoo Finance: {hist_yf:>8.4f} {"📈 POSITIVE" if hist_yf > 0 else "📉 NEGATIVE"}')
                    print(f'   DuckDB:        {hist_db:>8.4f} {"📈 POSITIVE" if hist_db > 0 else "📉 NEGATIVE"}')
                    print(f'   ⚠️  This will cause WRONG momentum signals!')
            elif hist_diff > 0.5:
                results['macd_match'] = False
                results['warnings'].append(f'MACD histogram differs by {hist_diff:.4f}')
                if verbose:
                    print(f'\n⚠️  TEST 4 WARNING: MACD histogram differs')
                    print(f'   Yahoo Finance: {hist_yf:.4f}')
                    print(f'   DuckDB:        {hist_db:.4f}')
                    print(f'   Difference:    {hist_diff:.4f}')
            else:
                results['macd_match'] = True
                if verbose:
                    print(f'\n✅ TEST 4 PASSED: MACD calculations match')
                    print(f'   Yahoo Finance: {hist_yf:.4f}')
                    print(f'   DuckDB:        {hist_db:.4f}')
                    print(f'   Difference:    {hist_diff:.4f}')
        else:
            results['warnings'].append('Not enough data points for MACD comparison')
            if verbose:
                print(f'\n⚠️  TEST 4 SKIPPED: Not enough data for MACD (need 26+)')

    except Exception as e:
        results['warnings'].append(f'MACD calculation error: {str(e)}')
        if verbose:
            print(f'\n⚠️  TEST 4 ERROR: {str(e)}')

    # ===== TEST 5: Check for price gaps/anomalies =====
    if len(db_data) >= 5:
        db_sorted = db_data.sort_index()
        price_changes = db_sorted['Close'].pct_change()
        large_changes = price_changes[abs(price_changes) > 0.15]  # More than 15% change

        if len(large_changes) > 0:
            results['warnings'].append(f'Found {len(large_changes)} days with >15% price change (possible split/bonus)')
            if verbose:
                print(f'\n⚠️  TEST 5 WARNING: Large price changes detected')
                for date, change in large_changes.tail(3).items():
                    print(f'   {date.strftime("%Y-%m-%d")}: {change*100:+.2f}%')
        else:
            if verbose:
                print(f'\n✅ TEST 5 PASSED: No suspicious price gaps')

    # ===== Final Summary =====
    if verbose:
        print(f'\n{"="*70}')
        if results['passed']:
            print(f'✅ ALL TESTS PASSED for {symbol_base}')
        else:
            print(f'❌ TESTS FAILED for {symbol_base}')
            print(f'\nIssues found:')
            for issue in results['issues']:
                print(f'  • {issue}')

        if results['warnings']:
            print(f'\nWarnings:')
            for warning in results['warnings']:
                print(f'  • {warning}')
        print(f'{"="*70}\n')

    return results


def test_all_active_symbols():
    """Test all symbols from Firestore"""
    print('🔍 Fetching active symbols from Firestore...\n')

    # Get symbols from Firestore
    symbols_ref = db.collection('symbols')
    symbols = [doc.id for doc in symbols_ref.stream()]

    print(f'Found {len(symbols)} symbols to test\n')
    print('='*70)

    results = []
    failed = []
    warned = []

    for i, symbol in enumerate(symbols[:50], 1):  # Test first 50 for quick scan
        print(f'[{i}/{min(50, len(symbols))}] Testing {symbol}...', end=' ')

        result = test_symbol(symbol, verbose=False)
        results.append(result)

        if not result['passed']:
            failed.append(symbol)
            print('❌ FAILED')
        elif result['warnings']:
            warned.append(symbol)
            print('⚠️  WARNING')
        else:
            print('✅ PASSED')

    # Summary
    print('\n' + '='*70)
    print('📊 SUMMARY')
    print('='*70)
    print(f'Total tested:  {len(results)}')
    print(f'✅ Passed:      {len([r for r in results if r["passed"] and not r["warnings"]])}')
    print(f'⚠️  Warnings:    {len(warned)}')
    print(f'❌ Failed:      {len(failed)}')

    if failed:
        print(f'\n❌ Failed symbols:')
        for symbol in failed:
            result = next(r for r in results if r['symbol'] == symbol)
            print(f'  • {symbol}:')
            for issue in result['issues']:
                print(f'    - {issue}')

    if warned:
        print(f'\n⚠️  Symbols with warnings:')
        for symbol in warned[:10]:  # Show first 10
            result = next(r for r in results if r['symbol'] == symbol)
            print(f'  • {symbol}: {", ".join(result["warnings"])}')

    return results


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Test single symbol
        symbol = sys.argv[1]
        result = test_symbol(symbol, verbose=True)

        # Exit with error code if tests failed
        sys.exit(0 if result['passed'] else 1)
    else:
        # Test all symbols
        results = test_all_active_symbols()

        # Exit with error if any failed
        failed_count = len([r for r in results if not r['passed']])
        sys.exit(0 if failed_count == 0 else 1)
