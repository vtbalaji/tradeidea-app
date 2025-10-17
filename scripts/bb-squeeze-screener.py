#!/usr/bin/env python3
"""
BB Squeeze Breakout Screener
Based on Bollinger Band Squeeze + RSI + MACD strategy

Trading Logic:
1. BB Squeeze: Bollinger Bands squeeze inside Keltner Channels (low volatility)
2. BB Breakout: Price breaks above/below Bollinger Bands (expansion)
3. BUY Signal:
   - Close > BB Top (20-period, 2 std)
   - RSI(14) > 60 (strong momentum)
   - MACD > 0 (uptrend)
4. SELL Signal:
   - Close < BB Bottom (20-period, 2 std)
   - RSI(14) < 40 (weak momentum)
   - MACD < 0 (downtrend)

Data Source: DuckDB (local OHLCV data)
Storage: Firebase (for user display)
"""

import pandas as pd
import numpy as np
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
    """Get market cap for a symbol from Firebase symbols collection"""
    if symbol in market_cap_cache:
        return market_cap_cache[symbol]

    try:
        symbol_with_prefix = f"NS_{symbol}" if not symbol.startswith('NS_') else symbol
        doc_ref = db.collection('symbols').document(symbol_with_prefix)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            market_cap = 0
            if 'fundamental' in data and data['fundamental']:
                market_cap = data['fundamental'].get('marketCap', 0)
            market_cap_cache[symbol] = market_cap
            return market_cap
        else:
            market_cap_cache[symbol] = 0
            return 0

    except Exception as e:
        print(f"  ⚠️  Error fetching market cap for {symbol}: {str(e)}")
        market_cap_cache[symbol] = 0
        return 0

def check_market_cap_filter(symbol, min_market_cap_cr=1000):
    """Check if symbol meets minimum market cap requirement"""
    market_cap = get_market_cap(symbol)

    if market_cap is None or market_cap == 0:
        return False, 0

    min_market_cap_inr = min_market_cap_cr * 10_000_000  # Convert crores to INR

    if market_cap < min_market_cap_inr:
        market_cap_cr = market_cap / 10_000_000
        return False, market_cap_cr

    return True, market_cap / 10_000_000

def calculate_atr(df, period=14):
    """Calculate Average True Range (ATR)"""
    high = df['High']
    low = df['Low']
    close = df['Close']

    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())

    tr = pd.DataFrame({'tr1': tr1, 'tr2': tr2, 'tr3': tr3}).max(axis=1)
    atr = tr.rolling(window=period).mean()

    return atr

def calculate_rsi(df, period=14):
    """Calculate Relative Strength Index (RSI)"""
    close = df['Close']
    delta = close.diff()

    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))

    return rsi

def calculate_macd(df, fast=12, slow=26, signal=9):
    """Calculate MACD (Moving Average Convergence Divergence)"""
    close = df['Close']

    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()

    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    return macd_line, signal_line, histogram

def calculate_quarterly_change(df):
    """
    Calculate quarterly change (last 63 trading days ~ 3 months)
    Returns quarterly change percentage
    """
    if len(df) < 63:
        return None

    current_close = float(df['Close'].iloc[-1])
    quarterly_close = float(df['Close'].iloc[-63])  # 63 trading days ago

    quarterly_change_percent = ((current_close - quarterly_close) / quarterly_close) * 100

    return quarterly_change_percent

def detect_bb_squeeze_breakout(symbol, bb_period=20, bb_std=2, keltner_period=14, keltner_mult=1.5):
    """
    Detect BB Squeeze and Breakout signals

    Returns:
        dict with signal details or None (error) or 'no_signal'
    """
    try:
        # Check market cap filter first (>1000 Cr)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1000 Cr

        # Get 100 days of data (enough for all calculations)
        df = nse_fetcher.get_data(symbol, days=100)

        if df.empty or len(df) < 50:
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

        # Calculate Bollinger Bands (20-period, 2 std)
        close = df['Close']
        bb_ma = close.rolling(window=bb_period).mean()
        bb_std_dev = close.rolling(window=bb_period).std()
        bb_upper = bb_ma + (bb_std * bb_std_dev)
        bb_lower = bb_ma - (bb_std * bb_std_dev)

        # Calculate Keltner Channels (14-period, 1.5 ATR)
        keltner_ma = close.rolling(window=keltner_period).mean()
        atr = calculate_atr(df, period=keltner_period)
        keltner_upper = keltner_ma + (keltner_mult * atr)
        keltner_lower = keltner_ma - (keltner_mult * atr)

        # Detect BB Squeeze (BB inside Keltner)
        bb_squeeze = (bb_upper <= keltner_upper) & (bb_lower >= keltner_lower)

        # Calculate squeeze proportion (Keltner width / BB width)
        keltner_width = keltner_upper - keltner_lower
        bb_width = bb_upper - bb_lower
        proportion = keltner_width / bb_width

        # Calculate RSI
        rsi = calculate_rsi(df, period=14)

        # Calculate MACD
        macd_line, signal_line, histogram = calculate_macd(df)

        # Calculate quarterly change
        quarterly_change_percent = calculate_quarterly_change(df)

        # Get current values (last row)
        current_close = float(close.iloc[-1])
        current_bb_upper = float(bb_upper.iloc[-1]) if not pd.isna(bb_upper.iloc[-1]) else 0
        current_bb_lower = float(bb_lower.iloc[-1]) if not pd.isna(bb_lower.iloc[-1]) else 0
        current_bb_ma = float(bb_ma.iloc[-1]) if not pd.isna(bb_ma.iloc[-1]) else 0
        current_rsi = float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 0
        current_macd = float(macd_line.iloc[-1]) if not pd.isna(macd_line.iloc[-1]) else 0
        current_squeeze = bool(bb_squeeze.iloc[-1]) if not pd.isna(bb_squeeze.iloc[-1]) else False
        current_proportion = float(proportion.iloc[-1]) if not pd.isna(proportion.iloc[-1]) else 0

        # Get previous values
        prev_close = float(close.iloc[-2])
        prev_bb_upper = float(bb_upper.iloc[-2]) if not pd.isna(bb_upper.iloc[-2]) else 0
        prev_bb_lower = float(bb_lower.iloc[-2]) if not pd.isna(bb_lower.iloc[-2]) else 0
        prev_squeeze = bool(bb_squeeze.iloc[-2]) if not pd.isna(bb_squeeze.iloc[-2]) else False
        prev_proportion = float(proportion.iloc[-2]) if not pd.isna(proportion.iloc[-2]) else 0

        # Calculate days in squeeze (consecutive squeeze days)
        days_in_squeeze = 0
        for i in range(len(bb_squeeze) - 1, -1, -1):
            if bb_squeeze.iloc[i]:
                days_in_squeeze += 1
            else:
                break

        # Detect BB Breakout (proportion crosses above 1.0)
        bb_breakout = (prev_proportion < 1.0) and (current_proportion >= 1.0)

        # Check BUY signal conditions
        buy_condition_1 = current_close > current_bb_upper  # Close > BB Top
        buy_condition_2 = prev_close > prev_bb_upper  # Previous close > BB Top (confirmation)
        buy_condition_3 = current_rsi > 60  # RSI > 60 (strong momentum)
        buy_condition_4 = current_macd > 0  # MACD > 0 (uptrend)
        buy_condition_5 = (quarterly_change_percent is not None and quarterly_change_percent < 6.0)  # Quarterly change < 6%

        buy_signal = buy_condition_1 and buy_condition_2 and buy_condition_3 and buy_condition_4 and buy_condition_5

        # Check SELL signal conditions
        sell_condition_1 = current_close < current_bb_lower  # Close < BB Bottom
        sell_condition_2 = prev_close < current_bb_lower  # Previous close < BB Bottom (confirmation)
        sell_condition_3 = current_rsi < 40  # RSI < 40 (weak momentum)
        sell_condition_4 = current_macd < 0  # MACD < 0 (downtrend)

        sell_signal = sell_condition_1 and sell_condition_2 and sell_condition_3 and sell_condition_4

        # Calculate distance from BB bands
        distance_to_upper = ((current_bb_upper - current_close) / current_close) * 100
        distance_to_lower = ((current_close - current_bb_lower) / current_close) * 100

        # Calculate volatility (BB width as % of price)
        bb_width_percent = ((current_bb_upper - current_bb_lower) / current_bb_ma) * 100

        # Determine signal type
        signal_type = None
        if buy_signal:
            signal_type = 'BUY'
        elif sell_signal:
            signal_type = 'SELL'
        elif current_squeeze:
            signal_type = 'SQUEEZE'  # In squeeze, watching for breakout
        elif bb_breakout:
            signal_type = 'BREAKOUT'  # Just broke out of squeeze
        else:
            signal_type = 'NONE'

        # Only return signals we care about
        if signal_type in ['BUY', 'SELL', 'SQUEEZE', 'BREAKOUT']:
            return {
                'type': signal_type,
                'current_price': current_close,
                'bb_upper': current_bb_upper,
                'bb_lower': current_bb_lower,
                'bb_ma': current_bb_ma,
                'bb_width_percent': bb_width_percent,
                'rsi': current_rsi,
                'macd': current_macd,
                'in_squeeze': current_squeeze,
                'days_in_squeeze': days_in_squeeze,
                'proportion': current_proportion,
                'bb_breakout': bb_breakout,
                'distance_to_upper_percent': distance_to_upper,
                'distance_to_lower_percent': distance_to_lower,
                'quarterly_change_percent': quarterly_change_percent if quarterly_change_percent is not None else 0,
                # Individual condition results (for debugging)
                'buy_conditions': {
                    'close_above_bb_upper': buy_condition_1,
                    'prev_close_above_bb_upper': buy_condition_2,
                    'rsi_above_60': buy_condition_3,
                    'macd_positive': buy_condition_4,
                    'quarterly_change_below_6pct': buy_condition_5
                },
                'sell_conditions': {
                    'close_below_bb_lower': sell_condition_1,
                    'prev_close_below_bb_lower': sell_condition_2,
                    'rsi_below_40': sell_condition_3,
                    'macd_negative': sell_condition_4
                }
            }
        else:
            return {'type': 'no_signal'}

    except Exception as e:
        print(f"  ❌ Error for {symbol}: {str(e)}")
        return None

def get_symbols_from_duckdb():
    """Get all symbols that have data in DuckDB"""
    try:
        query = "SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol"
        df = nse_fetcher.conn.execute(query).fetchdf()
        return df['symbol'].tolist()
    except Exception as e:
        print(f"❌ Error fetching symbols: {str(e)}")
        return []

def get_last_trading_day():
    """Get the last trading day based on current time and day of week"""
    import pytz

    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    today = now.date()
    current_hour = now.hour

    if current_hour < 16:
        target_date = today - timedelta(days=1)
    else:
        target_date = today

    weekday = target_date.weekday()

    if weekday == 5:  # Saturday
        target_date = target_date - timedelta(days=1)
    elif weekday == 6:  # Sunday
        target_date = target_date - timedelta(days=2)

    return target_date.strftime('%Y-%m-%d')

def save_to_firebase(buy_signals, sell_signals, squeeze_signals, breakout_signals):
    """Save BB Squeeze signals to Firebase collection"""
    try:
        today = get_last_trading_day()

        # Clear existing data for today
        print('\n💾 Clearing old data from Firebase...')

        bb_squeeze_ref = db.collection('bbsqueeze')
        for doc in bb_squeeze_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Save all signals (BUY, SELL, SQUEEZE, BREAKOUT)
        all_signals = buy_signals + sell_signals + squeeze_signals + breakout_signals

        print(f'💾 Saving {len(all_signals)} signals to bbsqueeze collection...')
        for signal in all_signals:
            symbol_with_prefix = f"NS_{signal['symbol']}" if not signal['symbol'].startswith('NS_') else signal['symbol']

            doc_ref = bb_squeeze_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
                'symbol': symbol_with_prefix,
                'date': today,
                'signalType': signal['type'],  # 'BUY', 'SELL', 'SQUEEZE', 'BREAKOUT'
                'currentPrice': signal['current_price'],
                'bbUpper': signal['bb_upper'],
                'bbLower': signal['bb_lower'],
                'bbMA': signal['bb_ma'],
                'bbWidthPercent': signal['bb_width_percent'],
                'rsi': signal['rsi'],
                'macd': signal['macd'],
                'inSqueeze': signal['in_squeeze'],
                'daysInSqueeze': signal['days_in_squeeze'],
                'proportion': signal['proportion'],
                'bbBreakout': signal['bb_breakout'],
                'distanceToUpperPercent': signal['distance_to_upper_percent'],
                'distanceToLowerPercent': signal['distance_to_lower_percent'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }

            doc_ref.set(doc_data)

        print('✅ Data saved to Firebase successfully')

    except Exception as e:
        print(f'❌ Error saving to Firebase: {str(e)}')
        import traceback
        traceback.print_exc()

def test_single_symbol(symbol):
    """Test the BB Squeeze screener on a single symbol (for debugging)"""
    print(f'\n🔍 Testing BB Squeeze Screener for {symbol}')
    print('=' * 80)

    result = detect_bb_squeeze_breakout(symbol)

    if result is None:
        print(f'❌ No data or market cap too low for {symbol}')
        return

    if result.get('type') == 'no_signal':
        print(f'⚪ No significant signal for {symbol}')
        return

    print(f'\n📊 Signal Type: {result["type"]}')
    print(f'💰 Current Price: ₹{result["current_price"]:.2f}')
    print(f'📈 BB Upper: ₹{result["bb_upper"]:.2f}')
    print(f'📉 BB Lower: ₹{result["bb_lower"]:.2f}')
    print(f'📊 BB MA: ₹{result["bb_ma"]:.2f}')
    print(f'📏 BB Width: {result["bb_width_percent"]:.2f}%')
    print(f'💪 RSI: {result["rsi"]:.2f}')
    print(f'📊 MACD: {result["macd"]:.2f}')
    print(f'🔒 In Squeeze: {result["in_squeeze"]}')
    print(f'📅 Days in Squeeze: {result["days_in_squeeze"]}')
    print(f'📏 Proportion: {result["proportion"]:.2f}')
    print(f'💥 BB Breakout: {result["bb_breakout"]}')

    if result['type'] == 'BUY':
        print(f'\n🟢 BUY SIGNAL CONDITIONS:')
        for condition, met in result['buy_conditions'].items():
            status = '✓' if met else '✗'
            print(f'  {status} {condition}')

    if result['type'] == 'SELL':
        print(f'\n🔴 SELL SIGNAL CONDITIONS:')
        for condition, met in result['sell_conditions'].items():
            status = '✓' if met else '✗'
            print(f'  {status} {condition}')

def main():
    """Main function to run BB Squeeze screener"""
    print('🔍 BB Squeeze Breakout Screener')
    print('=' * 80)

    # Get all symbols
    print('\n📊 Fetching symbols from DuckDB...')
    symbols = get_symbols_from_duckdb()
    print(f'✅ Found {len(symbols)} symbols\n')

    if not symbols:
        print('⚠️  No symbols found in DuckDB')
        return

    # Track results
    buy_signals = []
    sell_signals = []
    squeeze_signals = []
    breakout_signals = []

    print('🔄 Scanning for BB Squeeze signals...\n')

    for i, symbol in enumerate(symbols):
        if (i + 1) % 50 == 0:
            print(f'  Progress: {i+1}/{len(symbols)} symbols scanned...')

        result = detect_bb_squeeze_breakout(symbol)

        if result and result['type'] != 'no_signal':
            data = {'symbol': symbol, **result}

            if result['type'] == 'BUY':
                buy_signals.append(data)
            elif result['type'] == 'SELL':
                sell_signals.append(data)
            elif result['type'] == 'SQUEEZE':
                squeeze_signals.append(data)
            elif result['type'] == 'BREAKOUT':
                breakout_signals.append(data)

    # Save to Firebase
    save_to_firebase(buy_signals, sell_signals, squeeze_signals, breakout_signals)

    # Print results
    print('\n' + '=' * 80)
    print('📊 RESULTS')
    print('=' * 80)

    # BUY Signals
    print(f'\n🟢 BUY SIGNALS ({len(buy_signals)} stocks):')
    print('-' * 80)
    if buy_signals:
        buy_signals.sort(key=lambda x: x['rsi'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'BB Width%':<12}")
        print('-' * 80)
        for signal in buy_signals:
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['rsi']:>6.2f} "
                  f"{signal['macd']:>8.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No BUY signals today')

    # SELL Signals
    print(f'\n🔴 SELL SIGNALS ({len(sell_signals)} stocks):')
    print('-' * 80)
    if sell_signals:
        sell_signals.sort(key=lambda x: x['rsi'])
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'BB Width%':<12}")
        print('-' * 80)
        for signal in sell_signals:
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['rsi']:>6.2f} "
                  f"{signal['macd']:>8.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No SELL signals today')

    # SQUEEZE Signals (watching for breakout)
    print(f'\n🔒 SQUEEZE SIGNALS ({len(squeeze_signals)} stocks):')
    print('-' * 80)
    if squeeze_signals:
        squeeze_signals.sort(key=lambda x: x['days_in_squeeze'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'Days':<8} {'Proportion':<12} {'BB Width%':<12}")
        print('-' * 80)
        for signal in squeeze_signals:
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['days_in_squeeze']:>6} "
                  f"{signal['proportion']:>10.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No stocks in squeeze today')

    # BREAKOUT Signals (just broke out of squeeze)
    print(f'\n💥 BREAKOUT SIGNALS ({len(breakout_signals)} stocks):')
    print('-' * 80)
    if breakout_signals:
        breakout_signals.sort(key=lambda x: x['rsi'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'Proportion':<12}")
        print('-' * 80)
        for signal in breakout_signals:
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['rsi']:>6.2f} "
                  f"{signal['macd']:>8.2f} "
                  f"{signal['proportion']:>10.2f}")
    else:
        print('  No breakout signals today')

    # Summary
    print('\n' + '=' * 80)
    print('📈 SUMMARY')
    print('=' * 80)
    print(f'  Total Symbols Scanned: {len(symbols)}')
    print(f'  BUY Signals: {len(buy_signals)}')
    print(f'  SELL Signals: {len(sell_signals)}')
    print(f'  SQUEEZE Signals: {len(squeeze_signals)}')
    print(f'  BREAKOUT Signals: {len(breakout_signals)}')
    print('=' * 80)

if __name__ == '__main__':
    # Check if running in test mode with a specific symbol
    if len(sys.argv) > 1:
        test_symbol = sys.argv[1]
        try:
            test_single_symbol(test_symbol)
            nse_fetcher.close()
            print('\n✅ Test completed')
            sys.exit(0)
        except Exception as e:
            print(f'\n❌ Test failed: {str(e)}')
            import traceback
            traceback.print_exc()
            nse_fetcher.close()
            sys.exit(1)
    else:
        # Run full screener
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
