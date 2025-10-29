#!/usr/bin/env -S venv/bin/python3
"""
Get Recent Results Symbols
Fetches list of companies that published financial results recently

Usage:
    # Last 7 days
    python3 scripts/fundamental/get_recent_results_symbols.py --days 7

    # Last 30 days
    python3 scripts/fundamental/get_recent_results_symbols.py --days 30

    # Custom output file
    python3 scripts/fundamental/get_recent_results_symbols.py --output my_symbols.txt

    # Get top 100 companies (fallback strategy)
    python3 scripts/fundamental/get_recent_results_symbols.py --strategy top --limit 100
"""

import argparse
import sys
import os
from datetime import datetime, timedelta
import requests
import time

# Add scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)


class RecentResultsFetcher:
    """Fetch symbols with recent financial results"""

    NSE_BASE_URL = 'https://www.nseindia.com'

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    def __init__(self, days=7):
        self.days = days
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        self._init_session()

    def _init_session(self):
        """Initialize session by visiting homepage"""
        try:
            print('🔄 Initializing NSE session...')
            response = self.session.get(self.NSE_BASE_URL, timeout=10)
            if response.status_code == 200:
                print('✅ Session initialized')
                time.sleep(1)
        except Exception as e:
            print(f'⚠️  Session initialization warning: {str(e)}')

    def strategy_1_nse_calendar(self):
        """
        Strategy 1: Fetch from NSE Corporate Filings Calendar
        Most accurate - gets actual result announcement dates
        """
        try:
            print('📅 Strategy 1: Checking NSE event calendar...')

            # NSE corporate filings API
            url = f'{self.NSE_BASE_URL}/api/corporates-financial-results?index=equities&period=Quarterly'

            response = self.session.get(url, timeout=15)

            if response.status_code == 200:
                data = response.json()

                cutoff_date = datetime.now() - timedelta(days=self.days)
                symbols = set()

                for item in data:
                    # Parse date and filter by recency
                    filing_date_str = item.get('broadcast_date') or item.get('date') or item.get('xbrlFilingDate')
                    if filing_date_str:
                        try:
                            # Try multiple date formats
                            for fmt in ['%d-%b-%Y', '%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y']:
                                try:
                                    filing_date = datetime.strptime(filing_date_str, fmt)
                                    break
                                except:
                                    continue

                            if filing_date >= cutoff_date:
                                symbol = item.get('symbol', '').upper()
                                if symbol and symbol not in ['', 'NA']:
                                    symbols.add(symbol)
                        except:
                            pass

                if symbols:
                    print(f'   ✅ Found {len(symbols)} symbols from calendar')
                    return sorted(list(symbols))
            else:
                print(f'   ⚠️  API returned status {response.status_code}')

        except Exception as e:
            print(f'   ⚠️  Strategy 1 failed: {str(e)}')

        return []

    def strategy_2_top_companies(self, limit=100):
        """
        Strategy 2: Get top N companies by market cap
        Fallback - assumes top companies report regularly
        """
        try:
            print(f'📊 Strategy 2: Getting top {limit} companies by market cap...')

            # Import Firebase function if available
            try:
                sys.path.insert(0, os.path.join(scripts_dir, 'fundamental'))
                from fetch_nse_financial_results import get_top_symbols_by_market_cap

                symbols = get_top_symbols_by_market_cap(limit=limit, skip=0)

                if symbols:
                    print(f'   ✅ Got {len(symbols)} top companies')
                    return symbols

            except ImportError:
                print('   ⚠️  Firebase not available, trying alternative...')

                # Alternative: use NSE market data API
                try:
                    url = f'{self.NSE_BASE_URL}/api/equity-stockIndices?index=NIFTY%20500'
                    response = self.session.get(url, timeout=15)

                    if response.status_code == 200:
                        data = response.json()
                        stocks = data.get('data', [])
                        symbols = [stock['symbol'] for stock in stocks[:limit]]
                        print(f'   ✅ Got {len(symbols)} symbols from Nifty 500')
                        return symbols
                except Exception as e2:
                    print(f'   ⚠️  Alternative also failed: {str(e2)}')

        except Exception as e:
            print(f'   ⚠️  Strategy 2 failed: {str(e)}')

        return []

    def strategy_3_static_list(self):
        """
        Strategy 3: Static list of major companies
        Last resort - always returns something
        """
        print('📝 Strategy 3: Using static list of major companies...')

        # Major companies that report regularly
        symbols = [
            # IT
            'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'PERSISTENT', 'COFORGE',
            # Banking
            'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK',
            'FEDERALBNK', 'BANDHANBNK', 'IDFCFIRSTB',
            # Financial Services
            'BAJFINANCE', 'BAJAJFINSV', 'SBILIFE', 'HDFCLIFE', 'ICICIGI', 'SBICARD',
            # Energy
            'RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HINDPETRO', 'GAIL', 'ADANIGREEN',
            # FMCG
            'ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'GODREJCP',
            # Auto
            'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT', 'ASHOKLEY',
            # Telecom
            'BHARTIARTL', 'IDEA',
            # Pharma
            'SUNPHARMA', 'DRREDDY', 'CIPLA', 'LUPIN', 'AUROPHARMA', 'DIVISLAB', 'TORNTPHARM',
            # Infrastructure
            'LT', 'ULTRACEMCO', 'GRASIM', 'JSWSTEEL', 'TATASTEEL', 'HINDALCO',
            'ADANIPORTS', 'ADANIENT',
            # Consumer Durables
            'TITAN', 'HAVELLS', 'VOLTAS', 'WHIRLPOOL',
            # Others
            'ASIANPAINT', 'PIDILITIND', 'DMART', 'TATACONSUM', 'POWERGRID',
        ]

        print(f'   ✅ Using {len(symbols)} major companies')
        return symbols

    def get_symbols(self, strategy='auto', limit=100):
        """
        Get symbols using multiple strategies (with fallback)

        Args:
            strategy: 'auto', 'calendar', 'top', or 'static'
            limit: Number of symbols for 'top' strategy
        """
        print(f'\n🔍 Searching for companies with results in last {self.days} days...\n')

        if strategy == 'calendar':
            strategies = [self.strategy_1_nse_calendar]
        elif strategy == 'top':
            strategies = [lambda: self.strategy_2_top_companies(limit)]
        elif strategy == 'static':
            strategies = [self.strategy_3_static_list]
        else:  # auto - try all in order
            strategies = [
                self.strategy_1_nse_calendar,
                lambda: self.strategy_2_top_companies(limit),
                self.strategy_3_static_list,
            ]

        for strat in strategies:
            symbols = strat()
            if symbols:
                return symbols

        print('❌ All strategies failed')
        return []


def main():
    parser = argparse.ArgumentParser(
        description='Get list of companies with recent financial results',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Auto-detect symbols from last 7 days
    python3 scripts/fundamental/get_recent_results_symbols.py

    # Get from last 30 days
    python3 scripts/fundamental/get_recent_results_symbols.py --days 30

    # Use top 100 companies (fallback)
    python3 scripts/fundamental/get_recent_results_symbols.py --strategy top --limit 100

    # Use static list
    python3 scripts/fundamental/get_recent_results_symbols.py --strategy static
        """
    )

    parser.add_argument('--days', type=int, default=7,
                       help='Look back N days (default: 7)')
    parser.add_argument('--output', default='symbols_this_week.txt',
                       help='Output file (default: symbols_this_week.txt)')
    parser.add_argument('--strategy', choices=['auto', 'calendar', 'top', 'static'],
                       default='auto',
                       help='Strategy to use: auto (try all), calendar (NSE API), top (by market cap), static (hardcoded list)')
    parser.add_argument('--limit', type=int, default=100,
                       help='Number of symbols for "top" strategy (default: 100)')
    parser.add_argument('--min', type=int, default=10,
                       help='Minimum symbols to return (default: 10)')

    args = parser.parse_args()

    print('='*60)
    print('📋 GET RECENT RESULTS SYMBOLS')
    print('='*60)

    # Fetch symbols
    fetcher = RecentResultsFetcher(days=args.days)
    symbols = fetcher.get_symbols(strategy=args.strategy, limit=args.limit)

    if not symbols:
        print('❌ No symbols found')
        sys.exit(1)

    # Ensure minimum count
    if len(symbols) < args.min:
        print(f'\n⚠️  Only {len(symbols)} symbols found (min: {args.min})')
        print(f'   Consider increasing --days or using --strategy top')

    # Write to file
    output_path = args.output
    with open(output_path, 'w') as f:
        for symbol in symbols:
            f.write(f'{symbol}\n')

    print(f'\n✅ Saved {len(symbols)} symbols to {output_path}')
    print(f'\n📋 Symbols:')
    for i, symbol in enumerate(symbols[:20], 1):
        print(f'   {i:2d}. {symbol}')

    if len(symbols) > 20:
        print(f'   ... and {len(symbols) - 20} more')

    print(f'\n💡 Next steps:')
    print(f'   1. Download: ./venv/bin/python3 scripts/fundamental/fetch_nse_financial_results.py --file {output_path}')
    print(f'   2. Process:  ./venv/bin/python3 scripts/fundamental/xbrl_eod.py --dir xbrl/')
    print(f'\n   Or run the full pipeline:')
    print(f'   ./scripts/batch/weekly-fundamentals-fetch.sh')
    print('='*60)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
