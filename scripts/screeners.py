#!/usr/bin/env python3
"""
Stock Screeners: MA Crossovers & Supertrend Crossovers
Uses DuckDB EOD data to find crossover signals and get latest prices
Stores results in Firebase for user display

Data Sources:
- OHLCV Data: DuckDB (local)
- Last Price: DuckDB (latest close)
- Market Cap: Firebase (for filtering - requires analyze-fundamentals.py)
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

# Market cap cache for performance
market_cap_cache = {}

def get_market_cap(symbol):
    """
    Get market cap for a symbol from Firebase symbols collection
    Returns market cap in INR, or 0 if not found
    """
    # Check cache first
    if symbol in market_cap_cache:
        return market_cap_cache[symbol]

    try:
        # Add NS_ prefix to match Firebase document IDs
        symbol_with_prefix = f"NS_{symbol}" if not symbol.startswith('NS_') else symbol

        doc_ref = db.collection('symbols').document(symbol_with_prefix)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            # Market cap is stored in the fundamental data section
            market_cap = 0
            if 'fundamental' in data and data['fundamental']:
                market_cap = data['fundamental'].get('marketCap', 0)

            # Cache it for future lookups
            market_cap_cache[symbol] = market_cap
            return market_cap
        else:
            market_cap_cache[symbol] = 0
            return 0

    except Exception as e:
        print(f"  ⚠️  Error fetching market cap for {symbol}: {str(e)}")
        market_cap_cache[symbol] = 0
        return 0

# Cache for technical data (lastPrice)
technical_data_cache = {}

def get_last_price(symbol):
    """
    Get lastPrice from DuckDB (latest close price)
    Returns lastPrice, or None if not found
    """
    # Check cache first
    if symbol in technical_data_cache:
        return technical_data_cache[symbol]

    try:
        # Query DuckDB for the latest close price
        query = """
            SELECT close
            FROM ohlcv
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 1
        """
        result = nse_fetcher.conn.execute(query, [symbol]).fetchone()

        if result:
            last_price = float(result[0])
            technical_data_cache[symbol] = last_price
            return last_price
        else:
            technical_data_cache[symbol] = None
            return None

    except Exception as e:
        print(f"  ⚠️  Error fetching last price for {symbol}: {str(e)}")
        technical_data_cache[symbol] = None
        return None

def check_market_cap_filter(symbol, min_market_cap_cr=1000):
    """
    Check if symbol meets minimum market cap requirement
    Returns True if meets requirement, False otherwise
    """
    market_cap = get_market_cap(symbol)

    # If market cap is None or 0, skip the symbol
    if market_cap is None or market_cap == 0:
        return False, 0

    min_market_cap_inr = min_market_cap_cr * 10_000_000  # Convert crores to INR

    if market_cap < min_market_cap_inr:
        market_cap_cr = market_cap / 10_000_000  # Convert to Crores
        return False, market_cap_cr

    return True, market_cap / 10_000_000

def detect_ma_crossover(symbol, ma_period=50):
    """
    Detect if a stock crossed a moving average today
    Returns: 'bullish_cross', 'bearish_cross', 'no_cross', or None (error)
    """
    try:
        # Check market cap filter first (>1000 Cr)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1000 Cr

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

def calculate_supertrend(df, period=10, multiplier=3):
    """
    Calculate Supertrend indicator
    Returns DataFrame with supertrend and trend columns
    """
    high = df['High']
    low = df['Low']
    close = df['Close']

    # Calculate ATR
    df['tr1'] = abs(high - low)
    df['tr2'] = abs(high - close.shift())
    df['tr3'] = abs(low - close.shift())
    df['tr'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)
    df['atr'] = df['tr'].rolling(window=period).mean()

    # Calculate basic upper and lower bands
    hl_avg = (high + low) / 2
    df['basic_ub'] = hl_avg + (multiplier * df['atr'])
    df['basic_lb'] = hl_avg - (multiplier * df['atr'])

    # Calculate final bands
    df['final_ub'] = 0.0
    df['final_lb'] = 0.0
    df['supertrend'] = 0.0
    df['trend'] = 1  # 1 for uptrend, -1 for downtrend

    for i in range(period, len(df)):
        # Final upper band
        if df['basic_ub'].iloc[i] < df['final_ub'].iloc[i-1] or close.iloc[i-1] > df['final_ub'].iloc[i-1]:
            df.loc[df.index[i], 'final_ub'] = df['basic_ub'].iloc[i]
        else:
            df.loc[df.index[i], 'final_ub'] = df['final_ub'].iloc[i-1]

        # Final lower band
        if df['basic_lb'].iloc[i] > df['final_lb'].iloc[i-1] or close.iloc[i-1] < df['final_lb'].iloc[i-1]:
            df.loc[df.index[i], 'final_lb'] = df['basic_lb'].iloc[i]
        else:
            df.loc[df.index[i], 'final_lb'] = df['final_lb'].iloc[i-1]

        # Supertrend
        if df['trend'].iloc[i-1] == 1:
            if close.iloc[i] <= df['final_lb'].iloc[i]:
                df.loc[df.index[i], 'trend'] = -1
                df.loc[df.index[i], 'supertrend'] = df['final_ub'].iloc[i]
            else:
                df.loc[df.index[i], 'trend'] = 1
                df.loc[df.index[i], 'supertrend'] = df['final_lb'].iloc[i]
        else:
            if close.iloc[i] >= df['final_ub'].iloc[i]:
                df.loc[df.index[i], 'trend'] = 1
                df.loc[df.index[i], 'supertrend'] = df['final_lb'].iloc[i]
            else:
                df.loc[df.index[i], 'trend'] = -1
                df.loc[df.index[i], 'supertrend'] = df['final_ub'].iloc[i]

    return df

def detect_supertrend_crossover(symbol, period=10, multiplier=3):
    """
    Detect if a stock crossed supertrend today
    Returns: 'bullish_cross', 'bearish_cross', 'no_cross', or None (error)
    """
    try:
        # Check market cap filter first (>1000 Cr)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1000 Cr

        # Get 100 days of data (enough for supertrend calculation)
        df = nse_fetcher.get_data(symbol, days=100)

        if df.empty or len(df) < period + 20:
            return None

        # Rename columns to uppercase
        df = df.rename(columns={
            'date': 'Date',
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Calculate supertrend
        df = calculate_supertrend(df, period=period, multiplier=multiplier)

        # Get last 2 days data
        today_close = float(df['Close'].iloc[-1])
        yesterday_close = float(df['Close'].iloc[-2])
        today_trend = int(df['trend'].iloc[-1])
        yesterday_trend = int(df['trend'].iloc[-2])
        today_supertrend = float(df['supertrend'].iloc[-1])
        yesterday_supertrend = float(df['supertrend'].iloc[-2])

        # Check for trend change (crossover)
        # Bullish: trend changes from -1 to 1
        if yesterday_trend == -1 and today_trend == 1:
            return {
                'type': 'bullish_cross',
                'yesterday_close': yesterday_close,
                'yesterday_supertrend': yesterday_supertrend,
                'today_close': today_close,
                'today_supertrend': today_supertrend,
                'cross_percent': ((today_close - today_supertrend) / today_supertrend) * 100
            }
        # Bearish: trend changes from 1 to -1
        elif yesterday_trend == 1 and today_trend == -1:
            return {
                'type': 'bearish_cross',
                'yesterday_close': yesterday_close,
                'yesterday_supertrend': yesterday_supertrend,
                'today_close': today_close,
                'today_supertrend': today_supertrend,
                'cross_percent': ((today_supertrend - today_close) / today_supertrend) * 100
            }
        else:
            return {'type': 'no_cross'}

    except Exception as e:
        print(f"  ❌ Error for {symbol}: {str(e)}")
        return None

def detect_volume_spike(symbol, ma_period=20):
    """
    Detect if a stock has volume spike (volume > 20 MA of volume) today
    Returns: dict with spike details or None (error) or 'no_spike'
    """
    try:
        # Check market cap filter first (>1000 Cr)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1000 Cr

        # Get 100 days of data (enough for 20 MA volume calculation)
        df = nse_fetcher.get_data(symbol, days=100)

        if df.empty or len(df) < ma_period + 1:
            return None

        # Rename columns to uppercase
        df = df.rename(columns={
            'date': 'Date',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Calculate 20 MA on volume
        volume_ma20 = df['Volume'].rolling(window=ma_period).mean()

        # Get last 2 days data
        today_volume = int(df['Volume'].iloc[-1])
        today_close = float(df['Close'].iloc[-1])
        yesterday_close = float(df['Close'].iloc[-2])
        today_volume_ma = float(volume_ma20.iloc[-1]) if not pd.isna(volume_ma20.iloc[-1]) else 0

        if today_volume_ma == 0:
            return None

        # Check for volume spike (volume > 20 MA)
        if today_volume > today_volume_ma:
            spike_percent = ((today_volume - today_volume_ma) / today_volume_ma) * 100
            price_change_percent = ((today_close - yesterday_close) / yesterday_close) * 100

            return {
                'type': 'volume_spike',
                'today_volume': today_volume,
                'volume_ma20': int(today_volume_ma),
                'spike_percent': spike_percent,
                'today_close': today_close,
                'yesterday_close': yesterday_close,
                'price_change_percent': price_change_percent
            }
        else:
            return {'type': 'no_spike'}

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
    """
    Get the last trading day based on current time and day of week

    Rules:
    - If time < 16:00 (4 PM IST): fetch yesterday's data
    - If time >= 16:00: fetch today's data
    - If Saturday: fetch Friday's data
    - If Sunday: fetch Friday's data

    Returns:
        str: Last trading day in YYYY-MM-DD format
    """
    import pytz

    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    today = now.date()
    current_hour = now.hour

    # Determine the target date based on time
    if current_hour < 16:
        # Before 4 PM: fetch yesterday's data
        target_date = today - timedelta(days=1)
    else:
        # After 4 PM: fetch today's data
        target_date = today

    # Adjust for weekends
    weekday = target_date.weekday()

    if weekday == 5:  # Saturday
        target_date = target_date - timedelta(days=1)  # Go to Friday
    elif weekday == 6:  # Sunday
        target_date = target_date - timedelta(days=2)  # Go to Friday

    return target_date.strftime('%Y-%m-%d')

def save_to_firebase(crossovers_50, crossovers_200, supertrend_crosses, volume_spikes):
    """Save crossover and volume spike data to Firebase collections"""
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

        # Delete old supertrend crossovers
        supertrend_ref = db.collection('supertrendcrossover')
        for doc in supertrend_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Delete old volume spikes
        volume_spike_ref = db.collection('volumespike')
        for doc in volume_spike_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Save 50 MA crossovers
        print(f'💾 Saving {len(crossovers_50)} stocks to macrossover50 collection...')
        for cross in crossovers_50:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{cross['symbol']}" if not cross['symbol'].startswith('NS_') else cross['symbol']

            # Get lastPrice from DuckDB
            last_price = get_last_price(cross['symbol'])

            doc_ref = ma50_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
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
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        # Save 200 MA crossovers
        print(f'💾 Saving {len(crossovers_200)} stocks to macrossover200 collection...')
        for cross in crossovers_200:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{cross['symbol']}" if not cross['symbol'].startswith('NS_') else cross['symbol']

            # Get lastPrice from DuckDB
            last_price = get_last_price(cross['symbol'])

            doc_ref = ma200_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
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
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        # Save supertrend crossovers
        print(f'💾 Saving {len(supertrend_crosses)} stocks to supertrendcrossover collection...')
        for cross in supertrend_crosses:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{cross['symbol']}" if not cross['symbol'].startswith('NS_') else cross['symbol']

            # Get lastPrice from DuckDB
            last_price = get_last_price(cross['symbol'])

            doc_ref = supertrend_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
                'symbol': symbol_with_prefix,
                'date': today,
                'crossoverType': cross['type'],  # 'bullish_cross' or 'bearish_cross'
                'yesterdayClose': cross['yesterday_close'],
                'yesterdaySupertrend': cross['yesterday_supertrend'],
                'todayClose': cross['today_close'],
                'todaySupertrend': cross['today_supertrend'],
                'crossPercent': cross['cross_percent'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        # Save volume spikes
        print(f'💾 Saving {len(volume_spikes)} stocks to volumespike collection...')
        for spike in volume_spikes:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{spike['symbol']}" if not spike['symbol'].startswith('NS_') else spike['symbol']

            # Get lastPrice from technical data (Yahoo Finance)
            last_price = get_last_price(spike['symbol'])

            doc_ref = volume_spike_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
                'symbol': symbol_with_prefix,
                'date': today,
                'todayVolume': spike['today_volume'],
                'volumeMA20': spike['volume_ma20'],
                'spikePercent': spike['spike_percent'],
                'todayClose': spike['today_close'],
                'yesterdayClose': spike['yesterday_close'],
                'priceChangePercent': spike['price_change_percent'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        print('✅ Data saved to Firebase successfully')

    except Exception as e:
        print(f'❌ Error saving to Firebase: {str(e)}')
        import traceback
        traceback.print_exc()

def main():
    """Main function to detect MA, Supertrend crossovers, and Volume Spikes"""
    print('🔍 Stock Screeners: MA & Supertrend Crossovers & Volume Spikes')
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
    bullish_supertrend_crosses = []
    bearish_supertrend_crosses = []
    volume_spikes = []
    all_50ma_crosses = []  # Combined for Firebase
    all_200ma_crosses = []  # Combined for Firebase
    all_supertrend_crosses = []  # Combined for Firebase
    all_volume_spikes = []  # For Firebase

    print('🔄 Scanning for crossovers and volume spikes...\n')

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

        # Check Supertrend crossover
        result_supertrend = detect_supertrend_crossover(symbol, period=10, multiplier=3)
        if result_supertrend and result_supertrend['type'] != 'no_cross':
            data_supertrend = {'symbol': symbol, **result_supertrend}
            all_supertrend_crosses.append(data_supertrend)
            if result_supertrend['type'] == 'bullish_cross':
                bullish_supertrend_crosses.append(data_supertrend)
            elif result_supertrend['type'] == 'bearish_cross':
                bearish_supertrend_crosses.append(data_supertrend)

        # Check Volume Spike
        result_volume = detect_volume_spike(symbol, ma_period=20)
        if result_volume and result_volume['type'] == 'volume_spike':
            data_volume = {'symbol': symbol, **result_volume}
            all_volume_spikes.append(data_volume)
            volume_spikes.append(data_volume)

    # Save to Firebase
    save_to_firebase(all_50ma_crosses, all_200ma_crosses, all_supertrend_crosses, all_volume_spikes)

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

    # Bullish Supertrend Crosses
    print(f'\n🟢 BULLISH SUPERTREND CROSSOVERS ({len(bullish_supertrend_crosses)} stocks):')
    print('-' * 80)
    if bullish_supertrend_crosses:
        bullish_supertrend_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'Supertrend':<12} {'Today':<12} {'% Above ST':<12}")
        print('-' * 80)
        for cross in bullish_supertrend_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_supertrend']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bullish supertrend crossovers today')

    # Bearish Supertrend Crosses
    print(f'\n🔴 BEARISH SUPERTREND CROSSOVERS ({len(bearish_supertrend_crosses)} stocks):')
    print('-' * 80)
    if bearish_supertrend_crosses:
        bearish_supertrend_crosses.sort(key=lambda x: x['cross_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Yesterday':<12} {'Supertrend':<12} {'Today':<12} {'% Below ST':<12}")
        print('-' * 80)
        for cross in bearish_supertrend_crosses:
            print(f"{cross['symbol']:<12} "
                  f"₹{cross['yesterday_close']:<11.2f} "
                  f"₹{cross['yesterday_supertrend']:<11.2f} "
                  f"₹{cross['today_close']:<11.2f} "
                  f"{cross['cross_percent']:>10.2f}%")
    else:
        print('  No bearish supertrend crossovers today')

    # Volume Spikes
    print(f'\n📊 VOLUME SPIKES ({len(volume_spikes)} stocks):')
    print('-' * 80)
    if volume_spikes:
        # Sort by spike percentage (highest spikes first)
        volume_spikes.sort(key=lambda x: x['spike_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Volume':<15} {'20MA Vol':<15} {'Spike %':<12} {'Price Δ%':<12}")
        print('-' * 80)
        for spike in volume_spikes:
            print(f"{spike['symbol']:<12} "
                  f"{spike['today_volume']:<15,} "
                  f"{spike['volume_ma20']:<15,} "
                  f"{spike['spike_percent']:>10.2f}% "
                  f"{spike['price_change_percent']:>10.2f}%")
    else:
        print('  No volume spikes today')

    # Summary
    print('\n' + '=' * 80)
    print('📈 SUMMARY')
    print('=' * 80)
    print(f'  Total Symbols Scanned: {len(symbols)}')
    print(f'  Bullish 50 MA Crosses: {len(bullish_50ma_crosses)}')
    print(f'  Bearish 50 MA Crosses: {len(bearish_50ma_crosses)}')
    print(f'  Bullish 200 MA Crosses: {len(bullish_200ma_crosses)}')
    print(f'  Bearish 200 MA Crosses: {len(bearish_200ma_crosses)}')
    print(f'  Bullish Supertrend Crosses: {len(bullish_supertrend_crosses)}')
    print(f'  Bearish Supertrend Crosses: {len(bearish_supertrend_crosses)}')
    print(f'  Volume Spikes: {len(volume_spikes)}')
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
