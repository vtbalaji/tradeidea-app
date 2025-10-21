#!/usr/bin/env python3
"""
EOD Technical Analysis Batch Job (Hybrid: DuckDB + NSE with Yahoo Finance Fallback)

Primary: Fetches from NSE and stores in DuckDB
Fallback: Uses Yahoo Finance if NSE fails or times out

This hybrid approach ensures we always get data even if NSE is slow or unavailable.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from ta.trend import SMAIndicator, EMAIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
from ta.trend import MACD
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta, date
import sys
import os

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import our NSE data fetcher
from fetch_nse_data import NSEDataFetcher

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

# Initialize NSE data fetcher
nse_fetcher = NSEDataFetcher()

# Counters for statistics
stats = {
    'nse_success': 0,
    'yahoo_fallback': 0,
    'total_failed': 0
}

def fetch_from_yahoo(symbol):
    """Fallback: Fetch data from Yahoo Finance"""
    try:
        print(f'  🔄 Falling back to Yahoo Finance...')
        ticker = yf.Ticker(f'{symbol}.NS')

        end_date = datetime.now()
        start_date = end_date - timedelta(days=730)

        df = ticker.history(start=start_date, end=end_date)

        if df.empty:
            return None

        # Rename columns to match expected format
        df = df.rename(columns={
            'Open': 'Open',
            'High': 'High',
            'Low': 'Low',
            'Close': 'Close',
            'Volume': 'Volume'
        })

        stats['yahoo_fallback'] += 1
        return df

    except Exception as e:
        print(f'  ❌ Yahoo Finance also failed: {str(e)}')
        return None

def fetch_eod_data(symbol):
    """
    Hybrid fetch: Try NSE+DuckDB first, fallback to Yahoo Finance
    """
    try:
        print(f'  📥 Fetching data for {symbol}...')

        # Try NSE first (with timeout)
        try:
            # Quick check if data exists and is recent
            last_date = nse_fetcher.get_last_date(symbol)
            row_count = nse_fetcher.get_row_count(symbol)

            # If we have enough recent data, use it
            if row_count >= 200 and last_date:
                days_old = (date.today() - last_date).days
                if days_old <= 7:  # Data is less than a week old
                    print(f'  💾 Using cached data (last update: {last_date})')
                    df = nse_fetcher.get_data(symbol, days=730)

                    if not df.empty:
                        # Prepare DataFrame
                        df = df.rename(columns={
                            'date': 'Date',
                            'open': 'Open',
                            'high': 'High',
                            'low': 'Low',
                            'close': 'Close',
                            'volume': 'Volume'
                        })
                        df = df.set_index('Date')
                        stats['nse_success'] += 1
                        return df

            # Try to update from NSE (with short timeout)
            success = nse_fetcher.fetch_and_store(symbol, retry_count=1)

            if success:
                df = nse_fetcher.get_data(symbol, days=730)

                if not df.empty:
                    # Prepare DataFrame
                    df = df.rename(columns={
                        'date': 'Date',
                        'open': 'Open',
                        'high': 'High',
                        'low': 'Low',
                        'close': 'Close',
                        'volume': 'Volume'
                    })
                    df = df.set_index('Date')
                    print(f'  ✅ Fetched from NSE: {len(df)} rows')
                    stats['nse_success'] += 1
                    return df

        except Exception as nse_error:
            print(f'  ⚠️  NSE fetch issue: {str(nse_error)}')

        # NSE failed, use Yahoo Finance
        df = fetch_from_yahoo(symbol)

        if df is not None and not df.empty:
            print(f'  ✅ Yahoo Finance: {len(df)} rows')
            return df

        print(f'  ⚠️  No data available from either source')
        return None

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')
        return None

# Import all other functions from the original script
# (resample_to_weekly, calculate_atr, calculate_supertrend, etc.)

# ... [Include all the indicator calculation functions from analyze-symbols-duckdb.py] ...

def resample_to_weekly(df):
    """Resample daily data to weekly data"""
    weekly = df.resample('W').agg({
        'Open': 'first',
        'High': 'max',
        'Low': 'min',
        'Close': 'last',
        'Volume': 'sum'
    }).dropna()
    return weekly

# [Rest of the indicator functions would go here - identical to analyze-symbols-duckdb.py]

print('✅ Hybrid analyzer created - use analyze-symbols-duckdb.py as the main script')
print('This file shows the hybrid approach but is not complete.')
print('For production, consider adding Yahoo Finance fallback to the main script.')
