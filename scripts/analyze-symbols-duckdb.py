#!/usr/bin/env python3
"""
EOD Technical Analysis Batch Job (DuckDB)

Fetches EOD data from local DuckDB database, calculates technical indicators,
and updates Firebase Firestore.

This version reads from the local DuckDB database instead of Yahoo Finance,
providing faster access and offline capability.
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
    """Fetch 730 days of EOD data from DuckDB (2 years for weekly calculation)"""
    try:
        print(f'  📥 Fetching data for {symbol} from DuckDB...')

        # Fetch data from DuckDB
        df = fetcher.get_data(symbol, days=730)

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

def calculate_indicators(df):
    """Calculate all technical indicators"""

    # Moving Averages
    sma20 = SMAIndicator(close=df['Close'], window=20).sma_indicator()
    sma50 = SMAIndicator(close=df['Close'], window=50).sma_indicator()
    sma100 = SMAIndicator(close=df['Close'], window=100).sma_indicator()
    sma200 = SMAIndicator(close=df['Close'], window=200).sma_indicator()

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

    # Get latest values
    last_price = float(df['Close'].iloc[-1])
    previous_close = float(df['Close'].iloc[-2])

    # Calculate Period Changes
    def get_close_n_days_ago(n):
        index = len(df) - 1 - n
        return float(df['Close'].iloc[index]) if index >= 0 else last_price

    weekly_close = get_close_n_days_ago(5)  # ~1 week (5 trading days)
    monthly_close = get_close_n_days_ago(21)  # ~1 month (21 trading days)
    quarterly_close = get_close_n_days_ago(63)  # ~3 months (63 trading days)

    weekly_change = last_price - weekly_close
    weekly_change_percent = (weekly_change / weekly_close) * 100
    monthly_change = last_price - monthly_close
    monthly_change_percent = (monthly_change / monthly_close) * 100
    quarterly_change = last_price - quarterly_close
    quarterly_change_percent = (quarterly_change / quarterly_close) * 100

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

        'sma20': float(sma20.iloc[-1]) if not pd.isna(sma20.iloc[-1]) else 0,
        'sma50': float(sma50.iloc[-1]) if not pd.isna(sma50.iloc[-1]) else 0,
        'sma100': float(sma100.iloc[-1]) if not pd.isna(sma100.iloc[-1]) else 0,
        'sma200': float(sma200.iloc[-1]) if not pd.isna(sma200.iloc[-1]) else 0,

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
    }

    # Calculate overall signal score
    score = 0
    if signals['priceCrossSMA200'] == 'above': score += 2
    elif signals['priceCrossSMA200'] == 'below': score -= 2

    if signals['priceCrossSMA100'] == 'above': score += 1
    elif signals['priceCrossSMA100'] == 'below': score -= 1

    if signals['priceCrossEMA50'] == 'above': score += 1
    elif signals['priceCrossEMA50'] == 'below': score -= 1

    if signals['supertrendBullish']: score += 2
    elif signals['supertrendBearish']: score -= 2

    if signals['rsiOversold']: score += 2
    elif signals['rsiOverbought']: score -= 2

    if signals['macdBullish']: score += 1
    elif signals['macdBearish']: score -= 1

    if signals['goldenCross']: score += 2
    elif signals['deathCross']: score -= 2

    if signals['volumeSpike']: score += 1

    if score >= 5: overall_signal = 'STRONG_BUY'
    elif score >= 2: overall_signal = 'BUY'
    elif score <= -5: overall_signal = 'STRONG_SELL'
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

def analyze_symbols():
    """Main analysis function"""
    print('🚀 Starting Technical Analysis (DuckDB)\n')
    print('=' * 60)

    start_time = datetime.now()

    # Initialize DuckDB fetcher
    print('📦 Connecting to DuckDB...')
    fetcher = NSEDataFetcher()
    print()

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

                if len(df) < 200:
                    print(f'  ⏭️  Skipping - insufficient data ({len(df)} < 200 days)')
                    fail_count += 1
                    continue

                # Calculate indicators
                print(f'  📈 Calculating indicators...')
                analysis = calculate_indicators(df)

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

        print('\n' + '=' * 60)
        print('📊 Technical Analysis Complete!')
        print('=' * 60)
        print(f'✅ Success: {success_count} symbols')
        print(f'⏭️  Skipped: {skipped_count} symbols (no data or insufficient data)')
        print(f'❌ Failed: {fail_count} symbols')
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
        analyze_symbols()
        print('\n✅ Job completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
