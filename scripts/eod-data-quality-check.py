#!/usr/bin/env python3
"""
EOD Data Quality Check

Runs automatically as part of EOD process to validate:
1. Random sample of symbols (10-20 symbols)
2. All portfolio and watchlist symbols
3. Compares DuckDB vs Yahoo Finance
4. Checks MACD calculation accuracy
5. Reports issues to log/Firestore

Usage:
    python3 scripts/eod-data-quality-check.py               # Random sample
    python3 scripts/eod-data-quality-check.py --full        # Test all symbols
    python3 scripts/eod-data-quality-check.py --count 30    # Test 30 random symbols
"""

import sys
import os
import random
import argparse
import yfinance as yf
import duckdb
import pandas as pd
from ta.trend import MACD
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
from collections import defaultdict

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()


class DataQualityChecker:
    def __init__(self):
        self.results = []
        self.critical_issues = []
        self.warnings = []

    def test_symbol(self, symbol_base: str, verbose: bool = False):
        """
        Test data quality for a single symbol

        Returns: dict with test results
        """
        symbol_yf = f"{symbol_base}.NS"
        result = {
            'symbol': symbol_base,
            'passed': True,
            'critical': [],
            'warnings': [],
            'timestamp': datetime.now()
        }

        try:
            # Fetch Yahoo Finance data
            yf_stock = yf.Ticker(symbol_yf)
            yf_data = yf_stock.history(period='3mo')

            if len(yf_data) == 0:
                result['critical'].append('No data from Yahoo Finance')
                result['passed'] = False
                return result

            # Fetch DuckDB data
            conn = duckdb.connect('data/eod.duckdb', read_only=True)
            db_data = conn.execute(f"""
                SELECT date, close as Close, open, high, low, volume
                FROM ohlcv
                WHERE symbol = '{symbol_base}'
                ORDER BY date DESC
                LIMIT 90
            """).fetchdf()
            conn.close()

            if len(db_data) == 0:
                result['critical'].append('Missing from DuckDB')
                result['passed'] = False
                return result

            db_data['date'] = pd.to_datetime(db_data['date'])
            db_data = db_data.set_index('date')
            db_data = db_data.sort_index()

            # TEST: Data freshness
            yf_last_date = yf_data.index[-1].date()
            db_last_date = db_data.index[-1].date()
            days_behind = (yf_last_date - db_last_date).days

            if days_behind > 2:
                result['critical'].append(f'DuckDB {days_behind} days stale')
                result['passed'] = False
            elif days_behind > 0:
                result['warnings'].append(f'{days_behind} day(s) behind')

            # TEST: Latest price match
            yf_latest = yf_data['Close'].iloc[-1]
            db_latest = db_data['Close'].iloc[-1]
            price_diff_pct = abs((yf_latest - db_latest) / yf_latest * 100)

            if price_diff_pct > 2.0:
                result['critical'].append(f'Price mismatch: {price_diff_pct:.2f}%')
                result['passed'] = False
            elif price_diff_pct > 0.5:
                result['warnings'].append(f'Price diff: {price_diff_pct:.2f}%')

            # TEST: MACD calculation (critical for momentum analysis)
            if len(yf_data) >= 26 and len(db_data) >= 26:
                from ta.trend import EMAIndicator, SMAIndicator
                from ta.momentum import RSIIndicator

                # MACD
                macd_yf = MACD(close=yf_data['Close'], window_slow=26, window_fast=12, window_sign=9)
                hist_yf = macd_yf.macd_diff().iloc[-1]

                macd_db = MACD(close=db_data['Close'], window_slow=26, window_fast=12, window_sign=9)
                hist_db = macd_db.macd_diff().iloc[-1]

                # Check if signs differ (critical issue!)
                if (hist_yf > 0 and hist_db < 0) or (hist_yf < 0 and hist_db > 0):
                    result['critical'].append(f'MACD sign mismatch: YF={hist_yf:.4f}, DB={hist_db:.4f}')
                    result['passed'] = False
                elif abs(hist_yf - hist_db) > 1.0:
                    result['warnings'].append(f'MACD diff: {abs(hist_yf - hist_db):.4f}')

                # RSI (14-day)
                rsi_yf = RSIIndicator(close=yf_data['Close'], window=14).rsi().iloc[-1]
                rsi_db = RSIIndicator(close=db_data['Close'], window=14).rsi().iloc[-1]

                rsi_diff = abs(rsi_yf - rsi_db)
                if rsi_diff > 10:
                    result['critical'].append(f'RSI mismatch: YF={rsi_yf:.2f}, DB={rsi_db:.2f}')
                    result['passed'] = False
                elif rsi_diff > 5:
                    result['warnings'].append(f'RSI diff: {rsi_diff:.2f}')

                # Moving Averages
                if len(yf_data) >= 50 and len(db_data) >= 50:
                    ema50_yf = EMAIndicator(close=yf_data['Close'], window=50).ema_indicator().iloc[-1]
                    ema50_db = EMAIndicator(close=db_data['Close'], window=50).ema_indicator().iloc[-1]

                    ema50_diff_pct = abs((ema50_yf - ema50_db) / ema50_yf * 100)
                    if ema50_diff_pct > 2.0:
                        result['critical'].append(f'EMA50 mismatch: {ema50_diff_pct:.2f}%')
                        result['passed'] = False
                    elif ema50_diff_pct > 1.0:
                        result['warnings'].append(f'EMA50 diff: {ema50_diff_pct:.2f}%')

                if len(yf_data) >= 200 and len(db_data) >= 200:
                    sma200_yf = SMAIndicator(close=yf_data['Close'], window=200).sma_indicator().iloc[-1]
                    sma200_db = SMAIndicator(close=db_data['Close'], window=200).sma_indicator().iloc[-1]

                    sma200_diff_pct = abs((sma200_yf - sma200_db) / sma200_yf * 100)
                    if sma200_diff_pct > 2.0:
                        result['critical'].append(f'SMA200 mismatch: {sma200_diff_pct:.2f}%')
                        result['passed'] = False
                    elif sma200_diff_pct > 1.0:
                        result['warnings'].append(f'SMA200 diff: {sma200_diff_pct:.2f}%')

                    # Golden Cross check
                    gc_yf = ema50_yf > sma200_yf
                    gc_db = ema50_db > sma200_db

                    if gc_yf != gc_db:
                        result['critical'].append(f'Golden Cross mismatch: YF={gc_yf}, DB={gc_db}')
                        result['passed'] = False

            # TEST: Zero/null values
            if db_data['Close'].min() <= 0:
                result['critical'].append('Contains zero/negative prices')
                result['passed'] = False

            # TEST: Suspicious gaps (possible unadjusted split)
            price_changes = db_data['Close'].pct_change()
            large_drops = price_changes[price_changes < -0.30]  # >30% drop

            if len(large_drops) > 0:
                result['warnings'].append(f'{len(large_drops)} large price drop(s) - possible split')

        except Exception as e:
            result['critical'].append(f'Test error: {str(e)}')
            result['passed'] = False

        return result

    def run_checks(self, symbols: list, sample_size: int = None):
        """
        Run data quality checks on symbols

        Args:
            symbols: List of symbols to check
            sample_size: If provided, randomly sample this many symbols
        """
        if sample_size and sample_size < len(symbols):
            symbols = random.sample(symbols, sample_size)

        print(f'🔍 Running data quality checks on {len(symbols)} symbols...\n')

        for i, symbol in enumerate(symbols, 1):
            print(f'[{i}/{len(symbols)}] {symbol}...', end=' ', flush=True)

            result = self.test_symbol(symbol)
            self.results.append(result)

            if result['critical']:
                self.critical_issues.append(result)
                print(f'❌ CRITICAL')
            elif result['warnings']:
                self.warnings.append(result)
                print(f'⚠️  WARNING')
            else:
                print(f'✅ OK')

        return self.results

    def print_summary(self):
        """Print summary of all checks"""
        total = len(self.results)
        passed = len([r for r in self.results if r['passed']])
        critical = len(self.critical_issues)
        warnings = len(self.warnings)

        print('\n' + '='*70)
        print('📊 DATA QUALITY SUMMARY')
        print('='*70)
        print(f'Total symbols checked:  {total}')
        print(f'✅ Passed:              {passed} ({passed/total*100:.1f}%)')
        print(f'⚠️  Warnings:            {warnings} ({warnings/total*100:.1f}%)')
        print(f'❌ Critical issues:     {critical} ({critical/total*100:.1f}%)')

        if critical > 0:
            print(f'\n❌ CRITICAL ISSUES FOUND:')
            print('='*70)
            for result in self.critical_issues[:10]:  # Show first 10
                print(f'\n{result["symbol"]}:')
                for issue in result['critical']:
                    print(f'  • {issue}')

        if warnings > 0 and critical == 0:
            print(f'\n⚠️  WARNINGS (showing first 10):')
            print('='*70)
            for result in self.warnings[:10]:
                print(f'{result["symbol"]}: {", ".join(result["warnings"])}')

        print('\n' + '='*70)

        if critical > 0:
            print('⚠️  ACTION REQUIRED: Fix critical issues before using data!')
            print('💡 Run: python3 scripts/fix-data-issues.py')
        elif warnings > 0:
            print('ℹ️  Minor warnings detected. Review if needed.')
        else:
            print('✅ All checks passed! Data quality is good.')

        print('='*70 + '\n')

    def save_report(self, filename: str = None):
        """Save detailed report to file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'data_quality_report_{timestamp}.txt'

        with open(filename, 'w') as f:
            f.write(f'Data Quality Report\n')
            f.write(f'Generated: {datetime.now()}\n')
            f.write(f'='*70 + '\n\n')

            f.write(f'Total symbols checked: {len(self.results)}\n')
            f.write(f'Critical issues: {len(self.critical_issues)}\n')
            f.write(f'Warnings: {len(self.warnings)}\n\n')

            if self.critical_issues:
                f.write('CRITICAL ISSUES:\n')
                f.write('-'*70 + '\n')
                for result in self.critical_issues:
                    f.write(f'\n{result["symbol"]}:\n')
                    for issue in result['critical']:
                        f.write(f'  • {issue}\n')

            if self.warnings:
                f.write('\n\nWARNINGS:\n')
                f.write('-'*70 + '\n')
                for result in self.warnings:
                    f.write(f'{result["symbol"]}: {", ".join(result["warnings"])}\n')

        print(f'📄 Report saved to: {filename}')


def get_symbols_to_check(check_type: str = 'sample'):
    """
    Get list of symbols to check based on type

    Args:
        check_type: 'sample', 'portfolio', 'all'

    Returns:
        List of symbol strings
    """
    symbols_ref = db.collection('symbols')
    all_symbols = [doc.id for doc in symbols_ref.stream()]

    if check_type == 'all':
        return all_symbols

    # Get portfolio/watchlist symbols (always check these)
    priority_symbols = set()

    # From portfolio
    try:
        portfolio_ref = db.collection('portfolio')
        for doc in portfolio_ref.stream():
            data = doc.to_dict()
            if data.get('status') == 'active':
                priority_symbols.add(data.get('symbol'))
    except:
        pass

    # From ideas (watchlist)
    try:
        ideas_ref = db.collection('ideas')
        for doc in ideas_ref.stream():
            data = doc.to_dict()
            priority_symbols.add(data.get('symbol'))
    except:
        pass

    if check_type == 'portfolio':
        return list(priority_symbols)

    # For sample: priority symbols + random sample
    # Remove priority symbols from all_symbols to avoid duplicates
    remaining = [s for s in all_symbols if s not in priority_symbols]

    return list(priority_symbols)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='EOD Data Quality Check')
    parser.add_argument('--full', action='store_true', help='Check all symbols')
    parser.add_argument('--portfolio', action='store_true', help='Check only portfolio/watchlist symbols')
    parser.add_argument('--count', type=int, default=20, help='Number of random symbols to check (default: 20)')
    parser.add_argument('--save-report', action='store_true', help='Save detailed report to file')

    args = parser.parse_args()

    # Determine what to check
    if args.full:
        check_type = 'all'
    elif args.portfolio:
        check_type = 'portfolio'
    else:
        check_type = 'sample'

    # Get symbols
    symbols = get_symbols_to_check(check_type)

    if check_type == 'sample' and len(symbols) > args.count:
        # Add random sample
        all_symbols_ref = db.collection('symbols')
        all_symbols = [doc.id for doc in all_symbols_ref.stream()]
        remaining = [s for s in all_symbols if s not in symbols]

        if len(remaining) > 0:
            sample_count = args.count - len(symbols)
            if sample_count > 0:
                symbols.extend(random.sample(remaining, min(sample_count, len(remaining))))

    # Run checks
    checker = DataQualityChecker()
    checker.run_checks(symbols)

    # Print summary
    checker.print_summary()

    # Save report if requested
    if args.save_report:
        checker.save_report()

    # Exit with error code if critical issues found
    sys.exit(1 if len(checker.critical_issues) > 0 else 0)
