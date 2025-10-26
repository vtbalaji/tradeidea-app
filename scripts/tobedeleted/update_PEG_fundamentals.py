#!/usr/bin/env -S venv/bin/python3
"""
Update Yahoo Fundamentals and PEG Ratios

Main script to:
1. Fetch historical quarterly data from Yahoo Finance → Store in DuckDB
2. Calculate 3-year CAGR and hybrid PEG ratios
3. Update Firebase with lean summary (only 6 PEG fields)

Usage:
    # Update all symbols in portfolio (default)
    python scripts/update_PEG_fundamentals.py

    # Update specific symbols
    python scripts/update_PEG_fundamentals.py RELIANCE TCS INFY

    # Update from watchlist file
    python scripts/update_PEG_fundamentals.py --file watchlist.txt

    # Skip Firebase updates (DuckDB only)
    python scripts/update_PEG_fundamentals.py --no-firebase
"""

import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env.local
from load_env import load_dotenv
load_dotenv()

from yahoo_fundamentals_fetcher import YahooFundamentalsFetcher
from peg_calculator import PEGCalculator

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    import os
    import json

    # Initialize Firebase Admin SDK
    if not firebase_admin._apps:
        # Try environment variable first
        if os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
            service_account = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'))
            cred = credentials.Certificate(service_account)
        elif os.getenv('FIREBASE_ADMIN_CLIENT_EMAIL') and os.getenv('FIREBASE_ADMIN_PRIVATE_KEY'):
            project_id = os.getenv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
            service_account = {
                'type': 'service_account',
                'project_id': project_id,
                'private_key_id': 'key-id',  # Not critical for auth
                'private_key': os.getenv('FIREBASE_ADMIN_PRIVATE_KEY').replace('\\n', '\n'),
                'client_email': os.getenv('FIREBASE_ADMIN_CLIENT_EMAIL'),
                'client_id': '',  # Not critical
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
                'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
                'client_x509_cert_url': f'https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv("FIREBASE_ADMIN_CLIENT_EMAIL")}'
            }
            cred = credentials.Certificate(service_account)
        else:
            raise ValueError("Firebase credentials not found in environment variables")

        firebase_admin.initialize_app(cred)

    FIREBASE_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Firebase not available: {e}")
    print("   Will only update DuckDB")
    FIREBASE_AVAILABLE = False


class YahooFundamentalsUpdater:
    """Update Yahoo fundamentals and PEG ratios in DuckDB and Firebase"""

    def __init__(self):
        self.fetcher = YahooFundamentalsFetcher()
        self.peg_calc = PEGCalculator()
        self.db = firestore.client() if FIREBASE_AVAILABLE else None

        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'firebase_updated': 0,
            'firebase_skipped': 0
        }

    def update_symbol(self, symbol: str, update_firebase: bool = True) -> bool:
        """
        Update fundamental data for a single symbol

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            update_firebase: Whether to update Firebase (default True)

        Returns:
            True if successful, False otherwise
        """
        print(f'\n{"="*70}')
        print(f'📊 Processing: {symbol}')
        print(f'{"="*70}')

        self.stats['total'] += 1

        try:
            # Step 1: Fetch and store Yahoo historical data in DuckDB
            print(f'\n[1/3] Fetching historical data from Yahoo Finance...')
            success = self.fetcher.fetch_and_store(symbol, verbose=True)

            if not success:
                print(f'  ❌ Failed to fetch data for {symbol}')
                self.stats['failed'] += 1
                return False

            # Step 2: Calculate PEG ratios
            print(f'\n[2/3] Calculating PEG ratios...')
            peg_data = self.peg_calc.calculate_hybrid_peg(symbol, verbose=True)

            if not peg_data or peg_data.get('error'):
                print(f'  ❌ Failed to calculate PEG for {symbol}')
                self.stats['failed'] += 1
                return False

            # Step 3: Update Firebase with lean summary (if enabled)
            if update_firebase and FIREBASE_AVAILABLE:
                print(f'\n[3/3] Updating Firebase with PEG summary...')
                self._update_firebase_summary(symbol, peg_data)
            else:
                print(f'\n[3/3] Skipping Firebase update')
                self.stats['firebase_skipped'] += 1

            self.stats['success'] += 1
            print(f'\n✅ Successfully processed {symbol}')
            return True

        except Exception as e:
            print(f'\n❌ Error processing {symbol}: {e}')
            self.stats['failed'] += 1
            return False

    def _update_firebase_summary(self, symbol: str, peg_data: dict):
        """
        Update Firebase with lean PEG summary (only 6 fields)

        Stores under: symbols/NS_{symbol}/fundamental/pegRatios (singular)
        Uses update() to preserve existing fundamental data
        """
        try:
            doc_ref = self.db.collection('symbols').document(f'NS_{symbol}')

            # Create lean PEG summary (only essential PEG fields)
            peg_ratios = {
                # Main PEG metrics (3 fields)
                'pegHistorical3Y': peg_data.get('pegHistorical3Y'),
                'pegForward1Y': peg_data.get('pegForward1Y'),
                'pegHybrid': peg_data.get('pegHybrid'),

                # Supporting metrics (2 fields)
                'earningsCagr3Y': peg_data.get('earningsCagr3Y'),
                'earningsGrowthForward': peg_data.get('earningsGrowthForward'),

                # Metadata (3 fields)
                'confidence': peg_data.get('confidence'),
                'recommendation': peg_data.get('recommendation'),
                'lastCalculated': firestore.SERVER_TIMESTAMP,
            }

            # Use set() with merge=True to add pegRatios to 'fundamental' (singular)
            # This preserves all other fundamental data (PE, ROE, fundamentalScore, etc.)
            doc_ref.set({
                'fundamental': {
                    'pegRatios': peg_ratios
                }
            }, merge=True)

            print(f'  ✅ Firebase updated:')
            print(f'     - PEG Hybrid: {peg_data.get("pegHybrid")}')
            print(f'     - PEG Historical: {peg_data.get("pegHistorical3Y")}')
            print(f'     - PEG Forward: {peg_data.get("pegForward1Y")}')
            print(f'     - Confidence: {peg_data.get("confidence")}')
            print(f'     - Recommendation: {peg_data.get("recommendation")}')

            self.stats['firebase_updated'] += 1

        except Exception as e:
            print(f'  ⚠️  Failed to update Firebase: {e}')
            self.stats['firebase_skipped'] += 1

    def update_multiple(self, symbols: list, update_firebase: bool = True):
        """Update multiple symbols"""
        print(f'\n{"="*70}')
        print(f'🚀 YAHOO FUNDAMENTALS UPDATE')
        print(f'{"="*70}')
        print(f'Symbols to process: {len(symbols)}')
        print(f'Firebase updates: {"Enabled" if update_firebase and FIREBASE_AVAILABLE else "Disabled"}')
        print(f'{"="*70}\n')

        for i, symbol in enumerate(symbols, 1):
            print(f'\n[{i}/{len(symbols)}] {symbol}')
            self.update_symbol(symbol, update_firebase=update_firebase)

        # Print final statistics
        self._print_stats()

    def _print_stats(self):
        """Print final statistics"""
        print(f'\n{"="*70}')
        print(f'📊 FINAL STATISTICS')
        print(f'{"="*70}')
        print(f'Total symbols: {self.stats["total"]}')
        print(f'✅ Success: {self.stats["success"]}')
        print(f'❌ Failed: {self.stats["failed"]}')
        if FIREBASE_AVAILABLE:
            print(f'🔥 Firebase updated: {self.stats["firebase_updated"]}')
            print(f'⏭️  Firebase skipped: {self.stats["firebase_skipped"]}')
        print(f'{"="*70}\n')

    def close(self):
        """Close all connections"""
        self.fetcher.close()
        self.peg_calc.close()


def get_symbols_from_file(filepath: str) -> list:
    """Read symbols from a text file (one per line)"""
    try:
        with open(filepath, 'r') as f:
            symbols = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        return symbols
    except FileNotFoundError:
        print(f'❌ File not found: {filepath}')
        return []


def get_portfolio_symbols() -> list:
    """Get symbols from Firebase portfolio (if available)"""
    if not FIREBASE_AVAILABLE:
        return []

    try:
        db = firestore.client()
        portfolios = db.collection('portfolios').stream()

        symbols = set()
        for portfolio in portfolios:
            data = portfolio.to_dict()
            symbol = data.get('symbol', '')
            if symbol.startswith('NS_'):
                symbol = symbol.replace('NS_', '')
            if symbol:
                symbols.add(symbol)

        return sorted(list(symbols))

    except Exception as e:
        print(f'⚠️  Could not fetch portfolio symbols: {e}')
        return []


def main():
    parser = argparse.ArgumentParser(
        description='Update Yahoo Finance fundamentals and PEG ratios'
    )
    parser.add_argument(
        'symbols',
        nargs='*',
        help='Stock symbols to update (e.g., RELIANCE TCS INFY)'
    )
    parser.add_argument(
        '--file',
        help='Path to file containing symbols (one per line)'
    )
    parser.add_argument(
        '--portfolio',
        action='store_true',
        help='Update all symbols in Firebase portfolio'
    )
    parser.add_argument(
        '--no-firebase',
        action='store_true',
        help='Skip Firebase updates (DuckDB only)'
    )

    args = parser.parse_args()

    # Determine which symbols to update
    symbols = []

    if args.file:
        symbols = get_symbols_from_file(args.file)
    elif args.portfolio:
        symbols = get_portfolio_symbols()
    elif args.symbols:
        symbols = args.symbols
    else:
        # Default: process all portfolio symbols
        symbols = get_portfolio_symbols()
        if symbols:
            print(f'ℹ️  No symbols specified. Processing all portfolio symbols ({len(symbols)} total).')
        else:
            # Fallback to test symbols if portfolio is empty or Firebase unavailable
            symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']
            print(f'ℹ️  Portfolio empty or Firebase unavailable. Using default test symbols.')

    if not symbols:
        print('❌ No symbols to process. Use --help for usage information.')
        return

    # Initialize updater
    updater = YahooFundamentalsUpdater()

    # Run updates
    updater.update_multiple(
        symbols,
        update_firebase=not args.no_firebase
    )

    # Cleanup
    updater.close()


if __name__ == '__main__':
    main()
