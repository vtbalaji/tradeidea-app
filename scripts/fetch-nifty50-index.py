#!/usr/bin/env python3
"""
Fetch Nifty 50 Index Data

Fetches Nifty 50 index historical data from NSE and stores it in DuckDB.
This is used as the benchmark for portfolio beta and risk calculations.

Requirements:
    pip install --break-system-packages duckdb jugaad-data pandas

Usage:
    python3 scripts/fetch-nifty50-index.py
"""

import sys
import os
from datetime import datetime, timedelta

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

def fetch_nifty50_data():
    """Fetch Nifty 50 index data and store in DuckDB"""
    print('🚀 Nifty 50 Index Data Fetcher')
    print('=' * 80)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 80)

    try:
        # Initialize DuckDB fetcher
        print('📦 Initializing DuckDB...')
        fetcher = NSEDataFetcher()
        print()

        # Fetch Nifty 50 index data
        # NSE uses "NIFTY 50" as the symbol for the index
        print('📥 Fetching Nifty 50 index data...')

        # Note: jugaad-data uses index_df for indices, not stock_df
        # We'll need to modify the fetcher to handle index data
        from jugaad_data.nse import index_df

        # Get last date from DB
        last_date = fetcher.get_last_date('NIFTY50')

        if last_date:
            from_date = last_date + timedelta(days=1)
            print(f'  📅 Last data: {last_date}, fetching from {from_date}')
        else:
            # Fetch 2 years of data
            from_date = fetcher.get_last_trading_day() - timedelta(days=730)
            print(f'  📅 No existing data, fetching from {from_date}')

        to_date = fetcher.get_last_trading_day()

        # Check if from_date is after to_date
        if from_date > to_date:
            print(f'  ✅ NIFTY50 - Already up to date')
            fetcher.close()
            return

        print(f'  📥 Fetching NIFTY50 from {from_date} to {to_date}...')

        # Try different methods to fetch Nifty 50 data
        df = None

        # Method 1: Try index_df (may fail with some versions)
        try:
            print('  Trying index_df...')
            df = index_df(
                symbol="NIFTY 50",
                from_date=from_date,
                to_date=to_date
            )
        except Exception as e:
            print(f'  ⚠️  index_df failed: {str(e)}')
            print('  Trying alternative method...')

            # Method 2: Use stock_df with ^NSEI symbol (Yahoo Finance style)
            try:
                from jugaad_data.nse import stock_df as nse_stock_df
                # Some systems use NSEI as the Nifty 50 symbol
                df = nse_stock_df(
                    symbol="NSEI",
                    from_date=from_date,
                    to_date=to_date,
                    series="EQ"
                )
            except Exception as e2:
                print(f'  ⚠️  NSEI symbol failed: {str(e2)}')

                # Method 3: Download from NSE directly using pandas
                try:
                    import pandas as pd
                    import requests

                    print('  Trying direct NSE download...')
                    # NSE India URL format
                    # This is a fallback - we'll use Yahoo Finance NSE index
                    import yfinance as yf

                    # Nifty 50 on Yahoo Finance is ^NSEI
                    ticker = yf.Ticker("^NSEI")
                    df = ticker.history(start=from_date, end=to_date)

                    if not df.empty:
                        # Rename columns to match NSE format
                        df.columns = [col.lower() for col in df.columns]
                        df = df.reset_index()
                        df = df.rename(columns={'date': 'DATE'})
                        print(f'  ✅ Yahoo Finance fetch successful ({len(df)} rows)')

                except Exception as e3:
                    print(f'  ❌ All methods failed: {str(e3)}')
                    df = None

        if df is None or df.empty:
            print('  ⚠️  No data available for Nifty 50 from any source')
            fetcher.close()
            return

        # Prepare data for insertion
        if 'DATE' not in df.columns and 'Date' not in df.columns and 'date' not in df.columns:
            df = df.reset_index()

        df['symbol'] = 'NIFTY50'

        # Rename columns to match our schema (handle multiple formats)
        column_mapping = {
            'Date': 'date',
            'DATE': 'date',
            'date': 'date',
            'index': 'date',  # If date is the index
            'Open': 'open',
            'OPEN': 'open',
            'open': 'open',
            'High': 'high',
            'HIGH': 'high',
            'high': 'high',
            'Low': 'low',
            'LOW': 'low',
            'low': 'low',
            'Close': 'close',
            'CLOSE': 'close',
            'close': 'close',
            'Volume': 'volume',
            'VOLUME': 'volume',
            'volume': 'volume',
        }

        # Rename columns that exist
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        # Ensure date column exists
        if 'date' not in df.columns:
            print('  ⚠️  Warning: No date column found in dataframe')
            print(f'  Available columns: {df.columns.tolist()}')
            fetcher.close()
            return

        # Select only the columns we need
        required_columns = ['symbol', 'date', 'open', 'high', 'low', 'close']

        # Add volume with 0 (indices don't have volume)
        if 'volume' not in df.columns:
            df['volume'] = 0

        # Add optional columns as NULL
        df['prev_close'] = None
        df['ltp'] = None
        df['vwap'] = None

        # Select columns in correct order
        df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'volume', 'prev_close', 'ltp', 'vwap']]

        # Insert data
        fetcher.conn.execute("""
            INSERT OR REPLACE INTO ohlcv (symbol, date, open, high, low, close, volume, prev_close, ltp, vwap)
            SELECT symbol, date, open, high, low, close, volume, prev_close, ltp, vwap FROM df
        """)

        row_count = len(df)
        print(f'  ✅ Stored {row_count} rows for NIFTY50')

        # Get database stats
        print('\n' + '=' * 80)
        print('📊 DATABASE STATISTICS')
        print('=' * 80)
        stats = fetcher.get_stats()
        print(f'  Total Rows: {stats["total_rows"]:,}')
        print(f'  Total Symbols: {stats["total_symbols"]}')
        print(f'  Date Range: {stats["min_date"]} to {stats["max_date"]}')

        # Get Nifty 50 specific stats
        nifty_count = fetcher.get_row_count('NIFTY50')
        nifty_last_date = fetcher.get_last_date('NIFTY50')
        print(f'\n📈 NIFTY 50 Stats:')
        print(f'  Total Rows: {nifty_count}')
        print(f'  Last Date: {nifty_last_date}')

        fetcher.close()

        print('\n' + '=' * 80)
        print('✅ Nifty 50 index data fetch completed successfully!')
        print('=' * 80)

    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    try:
        fetch_nifty50_data()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Unexpected error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
