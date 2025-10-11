#!/usr/bin/env python3
"""
NSE EOD Data Fetcher

Fetches End-of-Day data from NSE using jugaad-data library
and stores it in DuckDB for fast local access.

Requirements:
    pip install jugaad-data duckdb pandas
"""

import duckdb
import pandas as pd
from datetime import datetime, timedelta, date
from jugaad_data.nse import stock_df
import sys
import os
from pathlib import Path

class NSEDataFetcher:
    def __init__(self, db_path=None):
        """Initialize NSE data fetcher with DuckDB connection"""
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')

        self.db_path = db_path

        # Ensure data directory exists
        data_dir = Path(db_path).parent
        data_dir.mkdir(parents=True, exist_ok=True)

        # Connect to DuckDB
        self.conn = duckdb.connect(db_path)
        self._init_database()

    def _init_database(self):
        """Create table and indexes if they don't exist"""
        print('📋 Initializing database...')

        # Create OHLCV table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS ohlcv (
                symbol VARCHAR NOT NULL,
                date DATE NOT NULL,
                open DOUBLE,
                high DOUBLE,
                low DOUBLE,
                close DOUBLE,
                volume BIGINT,
                prev_close DOUBLE,
                ltp DOUBLE,
                vwap DOUBLE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (symbol, date)
            )
        """)

        # Create index for fast queries
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_symbol_date
            ON ohlcv(symbol, date DESC)
        """)

        print('✅ Database initialized')

    def get_last_date(self, symbol):
        """Get the last available date for a symbol"""
        result = self.conn.execute("""
            SELECT MAX(date) as last_date
            FROM ohlcv
            WHERE symbol = ?
        """, [symbol]).fetchone()

        return result[0] if result and result[0] else None

    def get_row_count(self, symbol):
        """Get row count for a symbol"""
        result = self.conn.execute("""
            SELECT COUNT(*) as count
            FROM ohlcv
            WHERE symbol = ?
        """, [symbol]).fetchone()

        return result[0] if result else 0

    def fetch_and_store(self, symbol, from_date=None, to_date=None, retry_count=3):
        """
        Fetch data from NSE and store in DuckDB

        Args:
            symbol: Stock symbol (without .NS suffix)
            from_date: Start date (datetime.date)
            to_date: End date (datetime.date)
            retry_count: Number of retries on failure
        """
        import time

        for attempt in range(retry_count):
            try:
                # Set default dates if not provided
                if to_date is None:
                    to_date = date.today()

                if from_date is None:
                    # Check if we have data for this symbol
                    last_date = self.get_last_date(symbol)
                    if last_date:
                        # Fetch from day after last date
                        from_date = last_date + timedelta(days=1)
                        print(f'  📅 Last data: {last_date}, fetching from {from_date}')
                    else:
                        # Fetch 2 years of data
                        from_date = to_date - timedelta(days=730)
                        print(f'  📅 No existing data, fetching from {from_date}')

                # Check if from_date is after to_date
                if from_date > to_date:
                    print(f'  ✅ {symbol} - Already up to date')
                    return True

                print(f'  📥 Fetching {symbol} from {from_date} to {to_date}...')

                # Add small delay to avoid rate limiting
                time.sleep(0.5)

                # Fetch data from NSE using jugaad-data
                df = stock_df(
                    symbol=symbol,
                    from_date=from_date,
                    to_date=to_date,
                    series="EQ"  # Equity series
                )

                if df is None or df.empty:
                    print(f'  ⚠️  No data available for {symbol}')
                    return False

                # Prepare data for insertion
                df = df.reset_index()
                df['symbol'] = symbol

                # Rename columns to match our schema
                column_mapping = {
                    'DATE': 'date',
                    'OPEN': 'open',
                    'HIGH': 'high',
                    'LOW': 'low',
                    'CLOSE': 'close',
                    'VOLUME': 'volume',
                    'PREV. CLOSE': 'prev_close',
                    'LTP': 'ltp',
                    'VWAP': 'vwap'
                }

                # Rename columns that exist
                df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

                # Select only the columns we need (match table schema exactly)
                required_columns = ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']

                # Add optional columns if they exist, otherwise fill with NULL
                if 'prev_close' not in df.columns:
                    df['prev_close'] = None
                if 'ltp' not in df.columns:
                    df['ltp'] = None
                if 'vwap' not in df.columns:
                    df['vwap'] = None

                # Select columns in correct order
                df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'volume', 'prev_close', 'ltp', 'vwap']]

                # Insert data (using INSERT OR REPLACE for upsert behavior)
                self.conn.execute("""
                    INSERT OR REPLACE INTO ohlcv (symbol, date, open, high, low, close, volume, prev_close, ltp, vwap)
                    SELECT symbol, date, open, high, low, close, volume, prev_close, ltp, vwap FROM df
                """)

                row_count = len(df)
                print(f'  ✅ Stored {row_count} rows for {symbol}')
                return True

            except Exception as e:
                if attempt < retry_count - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff
                    print(f'  ⚠️  Attempt {attempt + 1} failed: {str(e)}. Retrying in {wait_time}s...')
                    time.sleep(wait_time)
                else:
                    print(f'  ❌ Error fetching {symbol} after {retry_count} attempts: {str(e)}')
                    return False

        return False

    def get_data(self, symbol, days=730):
        """
        Get historical data for a symbol from DuckDB

        Args:
            symbol: Stock symbol
            days: Number of days to fetch (default: 730 = 2 years)

        Returns:
            pandas DataFrame with OHLCV data
        """
        query = f"""
            SELECT date, open, high, low, close, volume
            FROM ohlcv
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT ?
        """

        df = self.conn.execute(query, [symbol, days]).fetchdf()

        # Reverse to get ascending order by date
        df = df.sort_values('date').reset_index(drop=True)

        # Convert date column to datetime
        df['date'] = pd.to_datetime(df['date'])

        return df

    def get_stats(self):
        """Get database statistics"""
        stats = self.conn.execute("""
            SELECT
                COUNT(*) as total_rows,
                COUNT(DISTINCT symbol) as total_symbols,
                MIN(date) as min_date,
                MAX(date) as max_date
            FROM ohlcv
        """).fetchone()

        return {
            'total_rows': stats[0],
            'total_symbols': stats[1],
            'min_date': stats[2],
            'max_date': stats[3]
        }

    def close(self):
        """Close database connection"""
        self.conn.close()


def main():
    """Main function for testing"""
    print('🚀 NSE Data Fetcher Test\n')
    print('=' * 60)

    fetcher = NSEDataFetcher()

    # Test symbols
    test_symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']

    print(f'\n📊 Testing with {len(test_symbols)} symbols...\n')

    success_count = 0
    fail_count = 0

    for i, symbol in enumerate(test_symbols):
        print(f'[{i+1}/{len(test_symbols)}] Processing {symbol}...')
        if fetcher.fetch_and_store(symbol):
            success_count += 1
        else:
            fail_count += 1

    print('\n' + '=' * 60)
    print('📊 Statistics:')
    stats = fetcher.get_stats()
    print(f'  Total Rows: {stats["total_rows"]:,}')
    print(f'  Total Symbols: {stats["total_symbols"]}')
    print(f'  Date Range: {stats["min_date"]} to {stats["max_date"]}')
    print('=' * 60)

    print(f'\n✅ Success: {success_count} symbols')
    print(f'❌ Failed: {fail_count} symbols')

    # Test data retrieval
    if success_count > 0:
        print(f'\n📈 Sample data for {test_symbols[0]}:')
        df = fetcher.get_data(test_symbols[0], days=5)
        print(df)

    fetcher.close()
    print('\n✅ Test completed')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        sys.exit(1)
