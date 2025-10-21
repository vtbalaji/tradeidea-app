#!/usr/bin/env python3
"""
EOD Technical Analysis Batch Job (DuckDB)

Fetches EOD data from local DuckDB database, calculates technical indicators,
and updates Firebase Firestore.

This version reads from the local DuckDB database instead of Yahoo Finance,
providing faster access and offline capability.

Usage:
    # Single symbol mode (with split adjustment option):
    python3 scripts/analyze-symbols-duckdb.py ADANIPOWER

    # Batch mode (all symbols, no split adjustment):
    python3 scripts/analyze-symbols-duckdb.py

Single Symbol Mode:
    - Asks user if split/bonus needs adjustment
    - Gets split details from user (ex-date, ratio, type)
    - Adjusts DuckDB historical data if confirmed
    - Runs technical analysis on adjusted data
    - Saves to Firestore

Batch Mode:
    - Processes all symbols from Firestore
    - Runs technical analysis only
    - NO split adjustment
"""

import sys
import os
import pandas as pd
import numpy as np
from ta.trend import SMAIndicator, EMAIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
from ta.trend import MACD
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

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

def fetch_eod_data(fetcher, symbol):
    """Fetch up to 200 days of EOD data from DuckDB (uses whatever is available, min 50 days)"""
    try:
        print(f'  📥 Fetching data for {symbol} from DuckDB...')

        # Try to fetch 200 days for full analysis (SMA200, etc.)
        # If symbol doesn't have 200 days, DuckDB will return whatever is available
        df = fetcher.get_data(symbol, days=200)

        if df.empty:
            print(f'  ⚠️  No data available')
            return None

        # Set date as index (required for TA library)
        df.set_index('date', inplace=True)

        # Rename columns to match Yahoo Finance format (for compatibility with existing code)
        df.columns = [col.capitalize() for col in df.columns]

        print(f'  ✅ Fetched {len(df)} rows')
        return df

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')
        return None

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

def calculate_atr(df, period=14):
    """Calculate Average True Range"""
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())

    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    atr = true_range.rolling(period).mean()

    return atr

def calculate_supertrend(df, period=10, multiplier=3):
    """Calculate Supertrend indicator with proper ATR"""
    atr = calculate_atr(df, period)
    hl2 = (df['High'] + df['Low']) / 2

    # Calculate basic upper and lower bands
    basic_upper = hl2 + (multiplier * atr)
    basic_lower = hl2 - (multiplier * atr)

    # Initialize final bands
    final_upper = pd.Series(index=df.index, dtype=float)
    final_lower = pd.Series(index=df.index, dtype=float)
    supertrend = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=int)

    for i in range(period, len(df)):
        # Adjust upper band
        if i == period:
            final_upper.iloc[i] = basic_upper.iloc[i]
        else:
            if basic_upper.iloc[i] < final_upper.iloc[i-1] or df['Close'].iloc[i-1] > final_upper.iloc[i-1]:
                final_upper.iloc[i] = basic_upper.iloc[i]
            else:
                final_upper.iloc[i] = final_upper.iloc[i-1]

        # Adjust lower band
        if i == period:
            final_lower.iloc[i] = basic_lower.iloc[i]
        else:
            if basic_lower.iloc[i] > final_lower.iloc[i-1] or df['Close'].iloc[i-1] < final_lower.iloc[i-1]:
                final_lower.iloc[i] = basic_lower.iloc[i]
            else:
                final_lower.iloc[i] = final_lower.iloc[i-1]

        # Determine supertrend direction
        if i == period:
            supertrend.iloc[i] = final_upper.iloc[i]
            direction.iloc[i] = -1
        else:
            prev_direction = direction.iloc[i-1]

            if prev_direction == 1:
                # Was in uptrend
                if df['Close'].iloc[i] <= final_lower.iloc[i]:
                    supertrend.iloc[i] = final_upper.iloc[i]
                    direction.iloc[i] = -1
                else:
                    supertrend.iloc[i] = final_lower.iloc[i]
                    direction.iloc[i] = 1
            else:
                # Was in downtrend
                if df['Close'].iloc[i] >= final_upper.iloc[i]:
                    supertrend.iloc[i] = final_lower.iloc[i]
                    direction.iloc[i] = 1
                else:
                    supertrend.iloc[i] = final_upper.iloc[i]
                    direction.iloc[i] = -1

    return supertrend, direction

def calculate_trend_structure(df, lookback=10):
    """
    Calculate price trend structure (higher highs/lows, lower highs/lows)
    Returns trend type and price pattern details
    """
    if len(df) < lookback:
        return 'UNKNOWN', {'higherHighs': False, 'higherLows': False, 'lowerHighs': False, 'lowerLows': False}

    # Get last N days of data
    recent = df.tail(lookback)

    # Find swing highs and lows (simple approach using rolling max/min)
    # Get two most recent significant highs and lows
    highs = recent['High'].values
    lows = recent['Low'].values

    # Split into two halves to compare
    mid = lookback // 2
    first_half_high = max(highs[:mid])
    second_half_high = max(highs[mid:])
    first_half_low = min(lows[:mid])
    second_half_low = min(lows[mid:])

    # Determine pattern
    higher_highs = second_half_high > first_half_high
    higher_lows = second_half_low > first_half_low
    lower_highs = second_half_high < first_half_high
    lower_lows = second_half_low < first_half_low

    # Determine trend structure
    if higher_highs and higher_lows:
        trend = 'UPTREND'
    elif lower_highs and lower_lows:
        trend = 'DOWNTREND'
    else:
        trend = 'SIDEWAYS'

    pattern = {
        'higherHighs': bool(higher_highs),
        'higherLows': bool(higher_lows),
        'lowerHighs': bool(lower_highs),
        'lowerLows': bool(lower_lows)
    }

    return trend, pattern

def calculate_bb_position_history(df, bb_middle, days=5):
    """
    Calculate Bollinger Band position for last N days
    Returns array of positions: ABOVE, MIDDLE, or BELOW
    """
    if len(df) < days:
        return []

    recent = df.tail(days)
    positions = []

    for i in range(len(recent)):
        close = recent['Close'].iloc[i]
        bb_mid = bb_middle.iloc[-(days-i)]  # Get corresponding BB middle value

        if close > bb_mid:
            positions.append('ABOVE')
        elif close < bb_mid:
            positions.append('BELOW')
        else:
            positions.append('MIDDLE')

    return positions

def detect_corporate_action(df, symbol):
    """
    Detect potential stock splits or bonus issues based on price movements
    Returns: dict with detection info or None
    """
    if len(df) < 2:
        return None

    last_price = float(df['Close'].iloc[-1])
    previous_close = float(df['Close'].iloc[-2])
    change_percent = ((last_price - previous_close) / previous_close) * 100

    # DETECTION THRESHOLDS
    # Split detection: price drop of 40-90% (covers 1:2 to 1:10 splits)
    if -90 < change_percent < -40:
        ratio = last_price / previous_close

        # Check common split ratios
        split_types = [
            (0.5, '1:2 split', 0.05),    # 50% price = 1:2 split (±5% tolerance)
            (0.33, '1:3 split', 0.03),   # 33% price = 1:3 split (±3% tolerance)
            (0.25, '1:4 split', 0.02),   # 25% price = 1:4 split (±2% tolerance)
            (0.2, '1:5 split', 0.02),    # 20% price = 1:5 split (±2% tolerance)
            (0.1, '1:10 split', 0.01),   # 10% price = 1:10 split (±1% tolerance)
        ]

        for target_ratio, split_type, tolerance in split_types:
            if abs(ratio - target_ratio) < tolerance:
                return {
                    'symbol': symbol,
                    'type': 'split',
                    'detectedDate': df.index[-1].strftime('%Y-%m-%d'),
                    'priceChange': change_percent,
                    'oldPrice': previous_close,
                    'newPrice': last_price,
                    'ratio': ratio,
                    'splitType': split_type,
                    'confidence': 'high'
                }

    # Bonus issue detection: price drop of 10-35% (common for bonus issues)
    elif -35 < change_percent < -10:
        ratio = last_price / previous_close

        bonus_types = [
            (0.67, '1:2 bonus', 0.03),   # 33% drop = 1:2 bonus (1 free for 2 held)
            (0.5, '1:1 bonus', 0.05),    # 50% drop = 1:1 bonus (1 free for 1 held)
            (0.75, '1:3 bonus', 0.03),   # 25% drop = 1:3 bonus
        ]

        for target_ratio, bonus_type, tolerance in bonus_types:
            if abs(ratio - target_ratio) < tolerance:
                return {
                    'symbol': symbol,
                    'type': 'bonus',
                    'detectedDate': df.index[-1].strftime('%Y-%m-%d'),
                    'priceChange': change_percent,
                    'oldPrice': previous_close,
                    'newPrice': last_price,
                    'ratio': ratio,
                    'bonusType': bonus_type,
                    'confidence': 'medium'
                }

    return None

def log_corporate_action(action_data):
    """
    Log detected corporate action to Firestore for manual review
    Saves to: corporateActions collection
    """
    try:
        # Create document ID from symbol and date
        doc_id = f"{action_data['symbol']}_{action_data['detectedDate']}"

        # Check if already logged
        action_ref = db.collection('corporateActions').document(doc_id)
        existing = action_ref.get()

        if existing.exists:
            # Already logged, skip
            return

        # Log new corporate action
        action_ref.set({
            **action_data,
            'processed': False,  # Flag for manual processing
            'createdAt': firestore.SERVER_TIMESTAMP,
            'needsReview': True
        })

        print(f'  🚨 CORPORATE ACTION DETECTED!')
        print(f'     Type: {action_data.get("splitType") or action_data.get("bonusType")}')
        print(f'     Price: ₹{action_data["oldPrice"]:.2f} → ₹{action_data["newPrice"]:.2f} ({action_data["priceChange"]:+.1f}%)')
        print(f'     Logged to Firestore for review')

    except Exception as e:
        print(f'  ⚠️  Failed to log corporate action: {str(e)}')

def calculate_indicators(df):
    """Calculate all technical indicators (adapts based on available data)"""

    data_points = len(df)
    print(f'  📊 Calculating indicators with {data_points} days of data...')

    # Moving Averages - calculate only if we have enough data
    sma20 = SMAIndicator(close=df['Close'], window=20).sma_indicator() if data_points >= 20 else None
    sma50 = SMAIndicator(close=df['Close'], window=50).sma_indicator() if data_points >= 50 else None
    sma100 = SMAIndicator(close=df['Close'], window=100).sma_indicator() if data_points >= 100 else None
    sma200 = SMAIndicator(close=df['Close'], window=200).sma_indicator() if data_points >= 200 else None

    ema9 = EMAIndicator(close=df['Close'], window=9).ema_indicator()
    ema21 = EMAIndicator(close=df['Close'], window=21).ema_indicator()
    ema50 = EMAIndicator(close=df['Close'], window=50).ema_indicator()

    # Weekly Supertrend (resample to weekly data first)
    weekly_df = resample_to_weekly(df)
    weekly_supertrend, weekly_supertrend_direction = calculate_supertrend(weekly_df, period=10, multiplier=3)
    # Get the latest weekly supertrend value
    supertrend = weekly_supertrend.iloc[-1] if not pd.isna(weekly_supertrend.iloc[-1]) else 0
    supertrend_direction = weekly_supertrend_direction.iloc[-1] if not pd.isna(weekly_supertrend_direction.iloc[-1]) else 0

    # RSI
    rsi14 = RSIIndicator(close=df['Close'], window=14).rsi()

    # Bollinger Bands
    bb = BollingerBands(close=df['Close'], window=20, window_dev=2)
    bb_upper = bb.bollinger_hband()
    bb_middle = bb.bollinger_mavg()
    bb_lower = bb.bollinger_lband()

    # MACD
    macd_indicator = MACD(close=df['Close'], window_slow=26, window_fast=12, window_sign=9)
    macd = macd_indicator.macd()
    macd_signal = macd_indicator.macd_signal()
    macd_histogram = macd_indicator.macd_diff()

    # Volume Average
    avg_volume20 = df['Volume'].rolling(window=20).mean()

    # Price Action Analysis
    trend_structure, price_pattern = calculate_trend_structure(df, lookback=10)
    bb_position_history = calculate_bb_position_history(df, bb_middle, days=5)

    # Get latest values
    last_price = float(df['Close'].iloc[-1])
    previous_close = float(df['Close'].iloc[-2])

    # Calculate Period Changes
    def get_close_n_days_ago(n):
        index = len(df) - 1 - n
        return float(df['Close'].iloc[index]) if index >= 0 else last_price

    weekly_close = get_close_n_days_ago(5)  # ~1 week (5 trading days)
    monthly_close = get_close_n_days_ago(21)  # ~1 month (21 trading days)

    weekly_change = last_price - weekly_close
    weekly_change_percent = (weekly_change / weekly_close) * 100
    monthly_change = last_price - monthly_close
    monthly_change_percent = (monthly_change / monthly_close) * 100

    # Quarterly - only if we have enough data (63+ days)
    if data_points >= 63:
        quarterly_close = get_close_n_days_ago(63)  # ~3 months (63 trading days)
        quarterly_change = last_price - quarterly_close
        quarterly_change_percent = (quarterly_change / quarterly_close) * 100
    else:
        quarterly_change = 0
        quarterly_change_percent = 0

    # Calculate daily supertrend
    daily_supertrend, daily_supertrend_direction = calculate_supertrend(df, period=10, multiplier=3)
    daily_st = float(daily_supertrend.iloc[-1]) if not pd.isna(daily_supertrend.iloc[-1]) else 0
    daily_st_dir = int(daily_supertrend_direction.iloc[-1]) if not pd.isna(daily_supertrend_direction.iloc[-1]) else 1

    latest = {
        'lastPrice': last_price,
        'previousClose': previous_close,
        'change': last_price - previous_close,
        'changePercent': ((last_price - previous_close) / previous_close) * 100,

        'weeklyChange': weekly_change,
        'weeklyChangePercent': weekly_change_percent,
        'monthlyChange': monthly_change,
        'monthlyChangePercent': monthly_change_percent,
        'quarterlyChange': quarterly_change,
        'quarterlyChangePercent': quarterly_change_percent,

        'sma20': float(sma20.iloc[-1]) if sma20 is not None and not pd.isna(sma20.iloc[-1]) else 0,
        'sma50': float(sma50.iloc[-1]) if sma50 is not None and not pd.isna(sma50.iloc[-1]) else 0,
        'sma100': float(sma100.iloc[-1]) if sma100 is not None and not pd.isna(sma100.iloc[-1]) else 0,
        'sma200': float(sma200.iloc[-1]) if sma200 is not None and not pd.isna(sma200.iloc[-1]) else 0,

        'ema9': float(ema9.iloc[-1]) if not pd.isna(ema9.iloc[-1]) else 0,
        'ema21': float(ema21.iloc[-1]) if not pd.isna(ema21.iloc[-1]) else 0,
        'ema50': float(ema50.iloc[-1]) if not pd.isna(ema50.iloc[-1]) else 0,

        'supertrend': daily_st,
        'supertrendDirection': daily_st_dir,
        'weeklySupertrend': float(supertrend) if supertrend != 0 else 0,
        'weeklySupertrendDirection': int(supertrend_direction) if supertrend_direction != 0 else 0,

        'rsi14': float(rsi14.iloc[-1]) if not pd.isna(rsi14.iloc[-1]) else 50,

        'bollingerUpper': float(bb_upper.iloc[-1]) if not pd.isna(bb_upper.iloc[-1]) else 0,
        'bollingerMiddle': float(bb_middle.iloc[-1]) if not pd.isna(bb_middle.iloc[-1]) else 0,
        'bollingerLower': float(bb_lower.iloc[-1]) if not pd.isna(bb_lower.iloc[-1]) else 0,

        'macd': float(macd.iloc[-1]) if not pd.isna(macd.iloc[-1]) else 0,
        'macdSignal': float(macd_signal.iloc[-1]) if not pd.isna(macd_signal.iloc[-1]) else 0,
        'macdHistogram': float(macd_histogram.iloc[-1]) if not pd.isna(macd_histogram.iloc[-1]) else 0,

        'volume': int(df['Volume'].iloc[-1]),
        'avgVolume20': int(avg_volume20.iloc[-1]) if not pd.isna(avg_volume20.iloc[-1]) else int(df['Volume'].iloc[-1]),

        # Price Action / Trend Structure
        'trendStructure': trend_structure,
        'pricePattern': price_pattern,
        'bbPositionHistory': bb_position_history,
    }

    # Calculate signals
    signals = {
        'priceCrossSMA200': 'above' if latest['sma200'] > 0 and last_price > latest['sma200'] else 'below' if latest['sma200'] > 0 else None,
        'priceCrossSMA100': 'above' if latest['sma100'] > 0 and last_price > latest['sma100'] else 'below' if latest['sma100'] > 0 else None,
        'priceCrossEMA50': 'above' if latest['ema50'] > 0 and last_price > latest['ema50'] else 'below' if latest['ema50'] > 0 else None,
        'supertrendBullish': latest['supertrendDirection'] == 1,
        'supertrendBearish': latest['supertrendDirection'] == -1,
        'rsiOverbought': latest['rsi14'] > 70,
        'rsiOversold': latest['rsi14'] < 30,
        'macdBullish': latest['macdHistogram'] > 0,
        'macdBearish': latest['macdHistogram'] < 0,
        'volumeSpike': latest['volume'] > (latest['avgVolume20'] * 2),
        'goldenCross': latest['sma50'] > latest['sma200'] and latest['sma50'] > 0 and latest['sma200'] > 0,
        'deathCross': latest['sma50'] < latest['sma200'] and latest['sma50'] > 0 and latest['sma200'] > 0,
        'ema50CrossSMA200': 'above' if latest['ema50'] > 0 and latest['sma200'] > 0 and latest['ema50'] > latest['sma200'] else 'below' if latest['ema50'] > 0 and latest['sma200'] > 0 else None,
        'priceBelowBBMiddle': latest['bollingerMiddle'] > 0 and last_price < latest['bollingerMiddle'],
        'priceAboveBBMiddle': latest['bollingerMiddle'] > 0 and last_price > latest['bollingerMiddle'],
        'priceBelowBBLower': latest['bollingerLower'] > 0 and last_price < latest['bollingerLower'],
        'priceAboveBBUpper': latest['bollingerUpper'] > 0 and last_price > latest['bollingerUpper'],
    }

    # Calculate overall signal score (excluding Supertrend and MACD)
    score = 0

    # Moving Average signals (price position)
    if signals['priceCrossSMA200'] == 'above': score += 2
    elif signals['priceCrossSMA200'] == 'below': score -= 2

    if signals['priceCrossSMA100'] == 'above': score += 2
    elif signals['priceCrossSMA100'] == 'below': score -= 2

    if signals['priceCrossEMA50'] == 'above': score += 2
    elif signals['priceCrossEMA50'] == 'below': score -= 2

    # RSI signals
    if signals['rsiOversold']: score += 2
    elif signals['rsiOverbought']: score -= 2

    # Moving Average crossovers
    if signals['goldenCross']: score += 2
    elif signals['deathCross']: score -= 2

    # Volume spike
    if signals['volumeSpike']: score += 1

    # Bollinger Bands signals
    if signals['priceBelowBBMiddle']: score -= 1  # Bearish - price below middle band
    elif signals['priceAboveBBMiddle']: score += 1  #  Bullish - price above middle band

    if signals['priceBelowBBLower']: score += 2  # Strong Bullish - price below lower band (oversold)
    if signals['priceAboveBBUpper']: score -= 2  # Strong Bearish - price above upper band (overbought)

    # Normalized thresholds (max score is now 13, min is -13)
    if score >= 6: overall_signal = 'STRONG_BUY'
    elif score >= 2: overall_signal = 'BUY'
    elif score <= -6: overall_signal = 'STRONG_SELL'
    elif score <= -2: overall_signal = 'SELL'
    else: overall_signal = 'NEUTRAL'

    latest['signals'] = signals
    latest['overallSignal'] = overall_signal
    latest['dataPoints'] = len(df)

    return latest

def get_symbols():
    """Get all unique symbols from Firestore"""
    print('📊 Fetching symbols from Firestore...')
    symbols = set()

    # PRIMARY SOURCE: From symbols collection (master list of all NSE symbols)
    print('  📋 Fetching from symbols collection...')
    symbols_ref = db.collection('symbols')
    symbols_count = 0
    for doc in symbols_ref.stream():
        data = doc.to_dict()
        symbol = data.get('originalSymbol') or data.get('symbol') or doc.id
        # Remove NS_ prefix if present
        if symbol.startswith('NS_'):
            symbol = symbol.replace('NS_', '')
        if symbol:
            symbols.add(symbol)
            symbols_count += 1
    print(f'  ✅ Found {symbols_count} symbols from symbols collection')

    # SECONDARY SOURCE: From user positions/ideas
    print('  📋 Fetching from active portfolios and ideas...')
    active_symbols = set()

    # From ideas
    ideas_ref = db.collection('ideas')
    for doc in ideas_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From tradingIdeas
    trading_ideas_ref = db.collection('tradingIdeas')
    for doc in trading_ideas_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From portfolio
    portfolio_ref = db.collection('portfolio')
    for doc in portfolio_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From portfolios
    portfolios_ref = db.collection('portfolios')
    for doc in portfolios_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From user positions (multi-account support)
    users_ref = db.collection('users')
    for user_doc in users_ref.stream():
        positions_ref = db.collection(f'users/{user_doc.id}/positions')
        for pos_doc in positions_ref.stream():
            data = pos_doc.to_dict()
            if 'symbol' in data:
                active_symbols.add(data['symbol'])

    print(f'  ✅ Found {len(active_symbols)} active symbols from portfolios/ideas')

    # Combine both sources
    symbols = symbols.union(active_symbols)

    print(f'✅ Total unique symbols: {len(symbols)}\n')
    return list(symbols)

def save_to_firestore(symbol, analysis):
    """Save analysis to Firestore (central symbols collection only)"""
    # Add NS_ prefix for Firebase compatibility (symbols starting with numbers)
    symbol_with_prefix = f'NS_{symbol}' if not symbol.startswith('NS_') else symbol

    # Add metadata
    data = {**analysis, 'symbol': symbol, 'updatedAt': firestore.SERVER_TIMESTAMP}

    # Save to symbols collection (central storage - single source of truth)
    symbols_doc = db.collection('symbols').document(symbol_with_prefix)
    symbols_doc.set({
        'symbol': symbol_with_prefix,  # Store with NS_ prefix
        'originalSymbol': symbol,  # Store original symbol for reference
        'technical': data,
        'lastFetched': firestore.SERVER_TIMESTAMP
    }, merge=True)  # merge=True preserves fundamental data if it exists

def adjust_duckdb_for_split(fetcher, symbol, ex_date_str, ratio_str, action_type):
    """
    Adjust historical data in DuckDB for a detected split
    """
    import duckdb
    from datetime import datetime

    # Parse ratio
    parts = ratio_str.split(':')
    old_shares = int(parts[0])
    new_shares = int(parts[1])

    # Calculate multiplier based on action type
    if action_type == 'bonus':
        # Bonus: 1:1 means 1 old + 1 new = 2 total shares
        # Example: 1:1 bonus → multiplier = (1+1)/1 = 2
        multiplier = (old_shares + new_shares) / old_shares
    else:  # split
        # Split: 1:5 means 1 share becomes 5 shares
        # Example: 1:5 split → multiplier = 5/1 = 5
        multiplier = new_shares / old_shares

    price_multiplier = 1 / multiplier
    volume_multiplier = multiplier

    print(f'\n📊 Split Adjustment Parameters:')
    print(f'   Price Multiplier: {price_multiplier:.4f} (prices divided)')
    print(f'   Volume Multiplier: {volume_multiplier:.4f} (volumes multiplied)')

    # Connect to DuckDB directly
    db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')
    conn = duckdb.connect(db_path)

    try:
        # Create backup
        backup_table = f'ohlcv_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        print(f'\n💾 Creating backup: {backup_table}')
        conn.execute(f"""
            CREATE TABLE {backup_table} AS
            SELECT * FROM ohlcv WHERE symbol = ?
        """, [symbol])

        # Perform adjustment
        print(f'🔧 Adjusting historical data before {ex_date_str}...')
        update_query = """
            UPDATE ohlcv
            SET
                open = open * ?,
                high = high * ?,
                low = low * ?,
                close = close * ?,
                volume = CAST(volume * ? AS BIGINT)
            WHERE symbol = ?
              AND date < ?
        """

        conn.execute(update_query, [
            price_multiplier,
            price_multiplier,
            price_multiplier,
            price_multiplier,
            volume_multiplier,
            symbol,
            ex_date_str
        ])

        print(f'✅ DuckDB data adjusted successfully!')
        print(f'   Backup table: {backup_table}')

    finally:
        conn.close()

def analyze_single_symbol(symbol):
    """
    Analyze a single symbol with optional split adjustment

    Workflow:
    1. Ask user if split/bonus happened
    2. If yes, get split details and adjust DuckDB
    3. Run technical analysis
    4. Save to Firestore
    """
    print('='*70)
    print(f'🔍 Single Symbol Analysis: {symbol}')
    print('='*70)

    # Initialize DuckDB fetcher
    print('📦 Connecting to DuckDB...')
    fetcher = NSEDataFetcher()

    try:
        # Fetch data
        print(f'\n📥 Fetching historical data for {symbol}...')
        df = fetch_eod_data(fetcher, symbol)

        if df is None or len(df) < 50:
            print(f'❌ Insufficient data for {symbol} (need at least 50 days)')
            return

        # STEP 1: Ask user about corporate action
        print(f'\n📋 Corporate Action Check:')
        has_action = input(f'   Did {symbol} have a split/bonus that needs DuckDB adjustment? (yes/no): ').strip().lower()

        if has_action == 'yes':
            # STEP 2: Get split details from user
            print(f'\n📝 Please provide split/bonus details:')

            ex_date = input(f'   Ex-date (YYYY-MM-DD): ').strip()
            if not ex_date:
                print('   ❌ Ex-date is required')
                return

            ratio = input(f'   Ratio (e.g., 1:2, 1:5, 1:1): ').strip()
            if not ratio:
                print('   ❌ Ratio is required')
                return

            action_type = input(f'   Type (split/bonus): ').strip().lower()
            if action_type not in ['split', 'bonus']:
                print('   ❌ Type must be "split" or "bonus"')
                return

            # STEP 3: Show what will be adjusted
            print(f'\n⚠️  About to adjust DuckDB historical data:')
            print(f'   Symbol: {symbol}')
            print(f'   Ex-date: {ex_date}')
            print(f'   Ratio: {ratio}')
            print(f'   Type: {action_type}')
            print(f'\n   All prices BEFORE {ex_date} will be divided')
            print(f'   All volumes BEFORE {ex_date} will be multiplied')

            confirm = input(f'\n🚨 Proceed with adjustment? (yes/no): ').strip().lower()

            if confirm == 'yes':
                # STEP 4: Adjust DuckDB
                print(f'\n🔧 Adjusting DuckDB historical data...')
                adjust_duckdb_for_split(fetcher, symbol, ex_date, ratio, action_type)

                # Re-fetch data after adjustment
                print(f'\n📥 Re-fetching adjusted data...')
                df = fetch_eod_data(fetcher, symbol)

                print(f'✅ DuckDB adjustment complete!')
            else:
                print(f'\n⏭️  Skipping DuckDB adjustment')
        else:
            print(f'   ✅ Proceeding without adjustment')

        # STEP 5: Calculate technical indicators
        print(f'\n📈 Calculating technical indicators...')
        analysis = calculate_indicators(df)

        # STEP 6: Save to Firestore
        print(f'\n💾 Saving to Firestore...')
        save_to_firestore(symbol, analysis)

        # STEP 7: Display results
        print(f'\n📊 Technical Analysis Results:')
        print('='*70)
        print(f'Signal: {analysis["overallSignal"]}')
        print(f'Price: ₹{analysis["lastPrice"]:.2f} ({analysis["changePercent"]:+.2f}%)')
        print(f'Weekly: {analysis["weeklyChangePercent"]:+.2f}% | Monthly: {analysis["monthlyChangePercent"]:+.2f}% | Quarterly: {analysis["quarterlyChangePercent"]:+.2f}%')
        print(f'RSI: {analysis["rsi14"]:.1f}')
        print(f'50 EMA: ₹{analysis["ema50"]:.2f}')
        print(f'100 MA: ₹{analysis["sma100"]:.2f}')
        print(f'200 MA: ₹{analysis["sma200"]:.2f}')
        print(f'Supertrend: ₹{analysis["supertrend"]:.2f} {"🟢 Bullish" if analysis["supertrendDirection"] == 1 else "🔴 Bearish"}')

        if analysis['signals']['goldenCross']:
            print(f'⭐ GOLDEN CROSS!')
        if analysis['signals']['deathCross']:
            print(f'💀 DEATH CROSS!')

        print('='*70)
        print(f'✅ Analysis complete for {symbol}')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

    finally:
        fetcher.close()

def analyze_symbols():
    """Main analysis function"""
    print('🚀 Starting Technical Analysis (DuckDB)\n')
    print('=' * 60)

    start_time = datetime.now()

    # Initialize DuckDB fetcher
    print('📦 Connecting to DuckDB...')
    fetcher = NSEDataFetcher()
    print()

    # List to track symbols with suspicious price changes
    suspicious_symbols = []

    try:
        symbols = get_symbols()

        if not symbols:
            print('⚠️  No symbols found')
            return

        success_count = 0
        fail_count = 0
        skipped_count = 0

        for i, symbol in enumerate(symbols):
            print(f'\n[{i+1}/{len(symbols)}] Processing {symbol}...')

            try:
                # Fetch data from DuckDB
                df = fetch_eod_data(fetcher, symbol)

                if df is None:
                    print(f'  ⏭️  Skipped')
                    skipped_count += 1
                    continue

                if len(df) < 50:
                    print(f'  ⏭️  Skipping - insufficient data ({len(df)} < 50 days)')
                    fail_count += 1
                    continue

                # Calculate indicators
                print(f'  📈 Calculating indicators...')
                analysis = calculate_indicators(df)

                # CHECK FOR CORPORATE ACTIONS (splits/bonus) during batch processing
                corporate_action = detect_corporate_action(df, symbol)
                if corporate_action:
                    # Add to suspicious symbols list for file output
                    suspicious_symbols.append({
                        'symbol': symbol,
                        'type': corporate_action.get('splitType') or corporate_action.get('bonusType'),
                        'priceChange': corporate_action['priceChange'],
                        'oldPrice': corporate_action['oldPrice'],
                        'newPrice': corporate_action['newPrice'],
                        'date': corporate_action['detectedDate']
                    })
                    print(f'  ⚠️  SUSPICIOUS PRICE CHANGE DETECTED - Added to review list')

                # Save to Firestore
                print(f'  💾 Saving to Firestore...')
                save_to_firestore(symbol, analysis)

                # Display summary
                print(f'  ✅ {symbol} - {analysis["overallSignal"]}')
                print(f'     Price: ₹{analysis["lastPrice"]:.2f} ({analysis["changePercent"]:+.2f}%)')
                print(f'     Weekly: {analysis["weeklyChangePercent"]:+.2f}% | Monthly: {analysis["monthlyChangePercent"]:+.2f}% | Quarterly: {analysis["quarterlyChangePercent"]:+.2f}%')
                print(f'     RSI: {analysis["rsi14"]:.1f} | 50EMA: ₹{analysis["ema50"]:.2f} | 100MA: ₹{analysis["sma100"]:.2f} | 200MA: ₹{analysis["sma200"]:.2f}')
                print(f'     Supertrend: ₹{analysis["supertrend"]:.2f} {"🟢 Bullish" if analysis["supertrendDirection"] == 1 else "🔴 Bearish"}')
                print(f'     Weekly Supertrend: ₹{analysis["weeklySupertrend"]:.2f} {"🟢 Bullish" if analysis["weeklySupertrendDirection"] == 1 else "🔴 Bearish"}')

                if analysis['signals']['ema50CrossSMA200'] == 'above':
                    print(f'     🔥 50 EMA/200 MA CROSSOVER!')
                if analysis['signals']['goldenCross']:
                    print(f'     ⭐ GOLDEN CROSS!')

                success_count += 1

            except Exception as e:
                print(f'  ❌ Failed: {str(e)}')
                import traceback
                traceback.print_exc()
                fail_count += 1

        duration = (datetime.now() - start_time).total_seconds()

        # Write suspicious symbols to file if any found
        if suspicious_symbols:
            output_file = 'data/split_bonus_alerts.txt'
            os.makedirs('data', exist_ok=True)

            with open(output_file, 'w') as f:
                f.write(f'# Stock Splits & Bonus Issues - Detected Corporate Actions\n')
                f.write(f'# Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
                f.write(f'# Total: {len(suspicious_symbols)} symbols requiring review\n')
                f.write(f'#\n')
                f.write(f'# IMPORTANT: Review each symbol and adjust historical data if confirmed\n')
                f.write(f'#\n')
                f.write(f'# To fix a split/bonus for a symbol, run:\n')
                f.write(f'#   python3 scripts/analyze-symbols-duckdb.py <SYMBOL>\n')
                f.write(f'#\n')
                f.write(f'# Format: SYMBOL | TYPE | PRICE_CHANGE | OLD_PRICE → NEW_PRICE | DATE\n')
                f.write(f'#\n\n')

                for item in suspicious_symbols:
                    f.write(f"{item['symbol']}\t{item['type']}\t{item['priceChange']:+.2f}%\t")
                    f.write(f"₹{item['oldPrice']:.2f} → ₹{item['newPrice']:.2f}\t{item['date']}\n")

            print(f'\n🚨 CORPORATE ACTIONS DETECTED (Splits/Bonus)!')
            print(f'📝 {len(suspicious_symbols)} symbols written to: {output_file}')
            print(f'   Review and fix each symbol using:')
            print(f'   python3 scripts/analyze-symbols-duckdb.py <SYMBOL>')

        print('\n' + '=' * 60)
        print('📊 Technical Analysis Complete!')
        print('=' * 60)
        print(f'✅ Success: {success_count} symbols')
        print(f'⏭️  Skipped: {skipped_count} symbols (no data or insufficient data)')
        print(f'❌ Failed: {fail_count} symbols')
        print(f'🚨 Corporate Actions: {len(suspicious_symbols)} symbols (splits/bonus)')
        print(f'⏱️  Duration: {duration:.1f}s')
        print('=' * 60)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # Close DuckDB connection
        fetcher.close()

if __name__ == '__main__':
    try:
        # Check if symbol provided as command line argument
        if len(sys.argv) > 1:
            # SINGLE SYMBOL MODE: Split detection + Technical analysis
            symbol = sys.argv[1].upper()
            analyze_single_symbol(symbol)
        else:
            # BATCH MODE: Full technical analysis (no split detection)
            analyze_symbols()

        print('\n✅ Job completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
