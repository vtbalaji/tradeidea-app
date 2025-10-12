#!/usr/bin/env python3
"""
Detect stocks that crossed 50 MA or 200 MA today
Uses DuckDB EOD data to find crossover signals
Stores results in Firebase for user display
"""

import pandas as pd
import numpy as np
from ta.trend import SMAIndicator
from datetime import datetime, timedelta
import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

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

def detect_ma_crossover(symbol, ma_period=50):
    """
    Detect if a stock crossed a moving average today
    Returns: 'bullish_cross', 'bearish_cross', 'no_cross', or None (error)
    """
    try:
        # Get 300 days of data (enough for 200 MA calculation)
        df = nse_fetcher.get_data(symbol, days=300)

        if df.empty or len(df) < ma_period + 1:
            return None

        # Rename columns to uppercase
        df = df.rename(columns={
            'date': 'Date',
            'close': 'Close'
        })

        # Calculate the moving average
        sma = SMAIndicator(close=df['Close'], window=ma_period).sma_indicator()

        # Get last 2 days data
        today_close = float(df['Close'].iloc[-1])
        yesterday_close = float(df['Close'].iloc[-2])
        today_ma = float(sma.iloc[-1]) if not pd.isna(sma.iloc[-1]) else 0
        yesterday_ma = float(sma.iloc[-2]) if not pd.isna(sma.iloc[-2]) else 0

        if today_ma == 0 or yesterday_ma == 0:
            return None

        # Check for crossover
        # Bullish: Yesterday below MA, Today above MA
        if yesterday_close < yesterday_ma and today_close > today_ma:
            return {
                'type': 'bullish_cross',
                'yesterday_close': yesterday_close,
                'yesterday_ma': yesterday_ma,
                'today_close': today_close,
                'today_ma': today_ma,
                'cross_percent': ((today_close - today_ma) / today_ma) * 100
            }
        # Bearish: Yesterday above MA, Today below MA
        elif yesterday_close > yesterday_ma and today_close < today_ma:
            return {
                'type': 'bearish_cross',
                'yesterday_close': yesterday_close,
                'yesterday_ma': yesterday_ma,
                'today_close': today_close,
                'today_ma': today_ma,
                'cross_percent': ((today_ma - today_close) / today_ma) * 100
            }
        else:
            return {'type': 'no_cross'}

    except Exception as e:
        print(f"  ❌ Error for {symbol}: {str(e)}")
        return None

def get_symbols_from_duckdb():
    """Get all symbols that have data in DuckDB"""
    try:
        # Query DuckDB for unique symbols
        query = "SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol"
        df = nse_fetcher.conn.execute(query).fetchdf()
        return df['symbol'].tolist()
    except Exception as e:
        print(f"❌ Error fetching symbols: {str(e)}")
        return []

def get_last_trading_day():
    """Get the last trading day (skip weekends)"""
    today = datetime.now()
    # If today is Saturday (5) or Sunday (6), go back to Friday
    if today.weekday() == 5:  # Saturday
        last_trading_day = today - timedelta(days=1)
    elif today.weekday() == 6:  # Sunday
        last_trading_day = today - timedelta(days=2)
    else:
        last_trading_day = today
    return last_trading_day.strftime('%Y-%m-%d')

def save_to_firebase(crossovers_50, crossovers_200):
    """Save crossover data to Firebase collections"""
    try:
        today = get_last_trading_day()

        # Clear existing data for today
        print('\n💾 Clearing old data from Firebase...')

        # Delete old 50 MA crossovers
        ma50_ref = db.collection('macrossover50')
        for doc in ma50_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Delete old 200 MA crossovers
        ma200_ref = db.collection('macrossover200')
        for doc in ma200_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Save 50 MA crossovers
        print(f'💾 Saving {len(crossovers_50)} stocks to macrossover50 collection...')
        for cross in crossovers_50:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{cross['symbol']}" if not cross['symbol'].startswith('NS_') else cross['symbol']
            doc_ref = ma50_ref.document(f"{symbol_with_prefix}_{today}")
            doc_ref.set({
                'symbol': symbol_with_prefix,
                'date': today,
                'crossoverType': cross['type'],  # 'bullish_cross' or 'bearish_cross'
                'yesterdayClose': cross['yesterday_close'],
                'yesterdayMA': cross['yesterday_ma'],
                'todayClose': cross['today_close'],
                'todayMA': cross['today_ma'],
                'crossPercent': cross['cross_percent'],
                'ma_period': 50,
                'createdAt': firestore.SERVER_TIMESTAMP
            })

        # Save 200 MA crossovers
        print(f'💾 Saving {len(crossovers_200)} stocks to macrossover200 collection...')
        for cross in crossovers_200:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{cross['symbol']}" if not cross['symbol'].startswith('NS_') else cross['symbol']
            doc_ref = ma200_ref.document(f"{symbol_with_prefix}_{today}")
            doc_ref.set({
                'symbol': symbol_with_prefix,
                'date': today,
                'crossoverType': cross['type'],  # 'bullish_cross' or 'bearish_cross'
                'yesterdayClose': cross['yesterday_close'],
                'yesterdayMA': cross['yesterday_ma'],
                'todayClose': cross['today_close'],
                'todayMA': cross['today_ma'],
                'crossPercent': cross['cross_percent'],
                'ma_period': 200,
                'createdAt': firestore.SERVER_TIMESTAMP
            })

        print('✅ Data saved to Firebase successfully')

    except Exception as e:
        print(f'❌ Error saving to Firebase: {str(e)}')
        import traceback
        traceback.print_exc()

def main():
    """Main function to detect MA crossovers"""
    print('🔍 Detecting MA Crossovers Today')
    print('=' * 80)

    # Get all symbols
    print('\n📊 Fetching symbols from DuckDB...')
    symbols = get_symbols_from_duckdb()
    print(f'✅ Found {len(symbols)} symbols\n')

    if not symbols:
        print('⚠️  No symbols found in DuckDB')
        return

    # Track results
    bullish_50ma_crosses = []
    bearish_50ma_crosses = []
    bullish_200ma_crosses = []
    bearish_200ma_crosses = []
    all_50ma_crosses = []  # Combined for Firebase
    all_200ma_crosses = []  # Combined for Firebase

    print('🔄 Scanning for crossovers...\n')

    for i, symbol in enumerate(symbols):
        if (i + 1) % 50 == 0:
            print(f'  Progress: {i+1}/{len(symbols)} symbols scanned...')

        # Check 50 MA crossover
        result_50 = detect_ma_crossover(symbol, ma_period=50)
        if result_50 and result_50['type'] != 'no_cross':
            data_50 = {'symbol': symbol, **result_50}
            all_50ma_crosses.append(data_50)
            if result_50['type'] == 'bullish_cross':
                bullish_50ma_crosses.append(data_50)
            elif result_50['type'] == 'bearish_cross':
                bearish_50ma_crosses.append(data_50)

        # Check 200 MA crossover
        result_200 = detect_ma_crossover(symbol, ma_period=200)
        if result_200 and result_200['type'] != 'no_cross':
            data_200 = {'symbol': symbol, **result_200}
            all_200ma_crosses.append(data_200)
            if result_200['type'] == 'bullish_cross':
                bullish_200ma_crosses.append(data_200)
            elif result_200['type'] == 'bearish_cross':
                bearish_200ma_crosses.append(data_200)

    # Save to Firebase
    save_to_firebase(all_50ma_crosses, all_200ma_crosses)

    # Print results
    print('\n' + '=' * 80)
    print('📊 RESULTS')
    print('=' * 80)

    # Bullish 50 MA Crosses
    print(f'\n🟢 BULLISH 50 MA CROSSOVERS ({len(bullish_50ma_crosses)} stocks):')
    print('-' * 80)
    if bullish_50ma_crosses:
        # Sort by cross percentage (strongest crosses first)
        bullish_50ma_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'50 MA':<12} {'Today':<12} {'% Above MA':<12}")
        print('-' * 80)
        for cross in bullish_50ma_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_ma']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bullish 50 MA crossovers today')

    # Bearish 50 MA Crosses
    print(f'\n🔴 BEARISH 50 MA CROSSOVERS ({len(bearish_50ma_crosses)} stocks):')
    print('-' * 80)
    if bearish_50ma_crosses:
        bearish_50ma_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'50 MA':<12} {'Today':<12} {'% Below MA':<12}")
        print('-' * 80)
        for cross in bearish_50ma_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_ma']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bearish 50 MA crossovers today')

    # Bullish 200 MA Crosses
    print(f'\n🟢 BULLISH 200 MA CROSSOVERS ({len(bullish_200ma_crosses)} stocks):')
    print('-' * 80)
    if bullish_200ma_crosses:
        bullish_200ma_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'200 MA':<12} {'Today':<12} {'% Above MA':<12}")
        print('-' * 80)
        for cross in bullish_200ma_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_ma']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bullish 200 MA crossovers today')

    # Bearish 200 MA Crosses
    print(f'\n🔴 BEARISH 200 MA CROSSOVERS ({len(bearish_200ma_crosses)} stocks):')
    print('-' * 80)
    if bearish_200ma_crosses:
        bearish_200ma_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'200 MA':<12} {'Today':<12} {'% Below MA':<12}")
        print('-' * 80)
        for cross in bearish_200ma_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_ma']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bearish 200 MA crossovers today')

    # Summary
    print('\n' + '=' * 80)
    print('📈 SUMMARY')
    print('=' * 80)
    print(f'  Total Symbols Scanned: {len(symbols)}')
    print(f'  Bullish 50 MA Crosses: {len(bullish_50ma_crosses)}')
    print(f'  Bearish 50 MA Crosses: {len(bearish_50ma_crosses)}')
    print(f'  Bullish 200 MA Crosses: {len(bullish_200ma_crosses)}')
    print(f'  Bearish 200 MA Crosses: {len(bearish_200ma_crosses)}')
    print('=' * 80)

if __name__ == '__main__':
    try:
        main()
        nse_fetcher.close()
        print('\n✅ Script completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Script failed: {str(e)}')
        import traceback
        traceback.print_exc()
        nse_fetcher.close()
        sys.exit(1)
