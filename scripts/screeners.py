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

def check_debt_to_equity(symbol, max_debt_to_equity=1.0):
    """
    Check if symbol meets debt-to-equity requirement
    Returns True if meets requirement (debt/equity < max), False otherwise
    """
    try:
        # Add NS_ prefix to match Firebase document IDs
        symbol_with_prefix = f"NS_{symbol}" if not symbol.startswith('NS_') else symbol

        doc_ref = db.collection('symbols').document(symbol_with_prefix)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            # Debt to equity is stored in the fundamental data section
            if 'fundamental' in data and data['fundamental']:
                debt_to_equity = data['fundamental'].get('debtToEquity', None)

                if debt_to_equity is None:
                    return False  # No data available, skip

                # Check if debt to equity is within acceptable range
                if debt_to_equity <= max_debt_to_equity:
                    return True
                else:
                    return False
            else:
                return False  # No fundamental data
        else:
            return False  # Document doesn't exist

    except Exception as e:
        return False  # Error occurred, skip symbol

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

def detect_volume_spike(symbol, ma_period=20, spike_threshold=1.5):
    """
    Detect if a stock has significant volume spike with quality filters

    Quality Filters Applied:
    1. Volume must be >= spike_threshold (1.5x default) of 20 MA
    2. Volume must also exceed 50 MA (confirms trend strength)
    3. Checks volume consistency (not just one-day anomaly)
    4. Validates price movement alignment with volume
    5. Relative volume ratio (RVR) calculation

    Parameters:
        symbol: Stock symbol
        ma_period: Period for volume MA calculation (default 20)
        spike_threshold: Minimum multiplier for volume spike (default 1.5x)

    Returns: dict with spike details or None (error) or 'no_spike'
    """
    try:
        # Check market cap filter first (>1000 Cr)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1000 Cr

        # Get 100 days of data (enough for 50 MA volume calculation)
        df = nse_fetcher.get_data(symbol, days=100)

        if df.empty or len(df) < 50 + 1:
            return None

        # Rename columns to uppercase
        df = df.rename(columns={
            'date': 'Date',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Calculate volume MAs
        volume_ma20 = df['Volume'].rolling(window=ma_period).mean()
        volume_ma50 = df['Volume'].rolling(window=50).mean()

        # Calculate volume standard deviation for anomaly detection
        volume_std20 = df['Volume'].rolling(window=ma_period).std()

        # Get last 3 days data for consistency check
        today_volume = int(df['Volume'].iloc[-1])
        yesterday_volume = int(df['Volume'].iloc[-2])
        day_before_volume = int(df['Volume'].iloc[-3]) if len(df) >= 3 else 0

        today_close = float(df['Close'].iloc[-1])
        yesterday_close = float(df['Close'].iloc[-2])

        today_volume_ma20 = float(volume_ma20.iloc[-1]) if not pd.isna(volume_ma20.iloc[-1]) else 0
        today_volume_ma50 = float(volume_ma50.iloc[-1]) if not pd.isna(volume_ma50.iloc[-1]) else 0
        today_volume_std = float(volume_std20.iloc[-1]) if not pd.isna(volume_std20.iloc[-1]) else 0

        if today_volume_ma20 == 0 or today_volume_ma50 == 0:
            return None

        # FILTER 1: Volume must exceed threshold (1.5x MA20 by default)
        volume_ratio = today_volume / today_volume_ma20
        if volume_ratio < spike_threshold:
            return {'type': 'no_spike'}  # Not significant enough

        # FILTER 2: Volume should also exceed 50 MA (confirms longer-term trend)
        if today_volume < today_volume_ma50 * 1.2:
            return {'type': 'no_spike'}  # Not strong enough trend

        # FILTER 3: Check volume consistency (not just noise)
        # Volume should be increasing over last 2-3 days OR today is exceptional
        volume_trend_score = 0
        if yesterday_volume > day_before_volume:
            volume_trend_score += 1
        if today_volume > yesterday_volume * 1.1:  # At least 10% increase
            volume_trend_score += 1

        # Alternative: Check if today's volume is exceptional (>2 std deviations)
        is_exceptional = False
        if today_volume_std > 0:
            z_score = (today_volume - today_volume_ma20) / today_volume_std
            if z_score > 2.0:  # More than 2 standard deviations
                is_exceptional = True

        # Must meet either consistency OR exceptional criteria
        if volume_trend_score < 1 and not is_exceptional:
            return {'type': 'no_spike'}  # Likely noise or single-day anomaly

        # FILTER 4: Price movement should align with volume
        price_change_percent = ((today_close - yesterday_close) / yesterday_close) * 100

        # Strong volume should accompany meaningful price movement (>0.5%)
        if abs(price_change_percent) < 0.5:
            return {'type': 'no_spike'}  # Volume without price action is suspicious

        # Calculate comprehensive metrics
        spike_percent = ((today_volume - today_volume_ma20) / today_volume_ma20) * 100

        # Relative Volume Ratio (RVR) - industry standard metric
        rvr = today_volume / today_volume_ma20

        # Volume quality score (0-100)
        quality_score = min(100, (
            (volume_trend_score / 2 * 30) +  # Trend consistency (0-30 points)
            (min(rvr / 3, 1) * 40) +  # Relative strength (0-40 points)
            (min(abs(price_change_percent) / 5, 1) * 30)  # Price alignment (0-30 points)
        ))

        return {
            'type': 'volume_spike',
            'today_volume': today_volume,
            'yesterday_volume': yesterday_volume,
            'volume_ma20': int(today_volume_ma20),
            'volume_ma50': int(today_volume_ma50),
            'spike_percent': spike_percent,
            'rvr': rvr,  # Relative Volume Ratio
            'quality_score': quality_score,
            'today_close': today_close,
            'yesterday_close': yesterday_close,
            'price_change_percent': price_change_percent,
            'is_exceptional': is_exceptional,
            'volume_trend_consistent': volume_trend_score >= 1
        }

    except Exception as e:
        print(f"  ❌ Error for {symbol}: {str(e)}")
        return None

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
    Detect BB Squeeze and Breakout signals based on AmiBroker AFL strategy

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
                'quarterly_change_percent': quarterly_change_percent if quarterly_change_percent is not None else 0
            }
        else:
            return {'type': 'no_signal'}

    except Exception as e:
        print(f"  ❌ Error for {symbol}: {str(e)}")
        return None

def detect_darvas_box(symbol, lookback_weeks=52, consolidation_weeks=3, breakout_threshold=0.005):
    """
    Detect Darvas Box patterns (Optimized per Nicolas Darvas methodology):

    1. Stock makes NEW HIGH (at or near 52-week high)
    2. Consolidates for 3-8 weeks in TIGHT range (4-12%)
    3. Multiple tests of box top (at least 2 touches)
    4. Breaks out with STRONG volume (1.5x+ average)
    5. Price confirms by staying above box for 2+ days

    Darvas Box Rules:
    - Box Top: Highest high during consolidation (resistance)
    - Box Bottom: Lowest low during consolidation (support)
    - Breakout: Price closes > box top with 1.5x+ volume
    - Entry: On breakout or pullback to box top
    - Stop: 2-3% below box bottom

    Parameters:
        symbol: Stock symbol
        lookback_weeks: Period to check for highs (default 52 weeks = 1 year)
        consolidation_weeks: Minimum weeks of consolidation (default 3, max recommended 8)
        breakout_threshold: % above box to confirm breakout (default 1% - tighter)

    Returns:
        dict with box details or None (error) or 'no_box'
    """
    try:
        # FILTER 1: Check market cap (>1200 Cr for higher quality stocks)
        meets_filter, market_cap_cr = check_market_cap_filter(symbol, min_market_cap_cr=1200)
        if not meets_filter:
            return None  # Skip stocks with market cap < 1200 Cr

        # FILTER 2: Check debt-to-equity ratio (<1.0 for financial strength)
        # Darvas preferred financially strong companies
        if not check_debt_to_equity(symbol, max_debt_to_equity=1.0):
            return None  # Skip stocks with high debt

        # Get enough data for 52-week analysis (52 weeks * 5 trading days = 260 days + buffer)
        df = nse_fetcher.get_data(symbol, days=300)

        if df.empty or len(df) < lookback_weeks * 5:
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

        # Calculate 52-week high/low
        week_high_52 = df['High'].rolling(window=lookback_weeks * 5).max()
        week_low_52 = df['Low'].rolling(window=lookback_weeks * 5).min()

        # Get recent data (last 60 days to capture up to 12 weeks consolidation)
        recent_days = 60
        recent_df = df.tail(recent_days).copy()

        if len(recent_df) < consolidation_weeks * 5:
            return {'type': 'no_box'}

        # RULE 1: Stock must be at or near NEW HIGH (within 10% of 52-week high)
        # Relaxed from 5% to 10% to catch more opportunities
        current_price = float(recent_df['Close'].iloc[-1])
        current_52w_high = float(week_high_52.iloc[-1])

        if pd.isna(current_52w_high) or current_price < current_52w_high * 0.90:
            return {'type': 'no_box'}  # Must be within 10% of 52-week high

        # RULE 2: Detect consolidation box - try multiple periods (3-8 weeks)
        # Darvas boxes typically form over 3-8 weeks, not longer
        best_box = None
        for weeks in range(3, 9):  # Try 3, 4, 5, 6, 7, 8 weeks
            consolidation_period = weeks * 5  # Convert weeks to days
            if len(recent_df) < consolidation_period:
                continue

            consolidation_df = recent_df.tail(consolidation_period)

            box_high = float(consolidation_df['High'].max())
            box_low = float(consolidation_df['Low'].min())
            box_height = box_high - box_low
            box_range_percent = (box_height / box_low) * 100

            # RULE 3: Box should be TIGHT (4-12% range) - Darvas avoided wide boxes
            # Tighter range = stronger consolidation
            if box_range_percent < 4 or box_range_percent > 12:
                continue  # Skip if too tight or too wide

            # RULE 4: Check for multiple tests of resistance (box top)
            # Count how many times price touched within 1% of box high
            touches = (consolidation_df['High'] >= box_high * 0.99).sum()
            if touches < 2:
                continue  # Need at least 2 tests of resistance

            # Found a valid box - check if it's better than previous
            if best_box is None or consolidation_period > best_box['period']:
                best_box = {
                    'period': consolidation_period,
                    'df': consolidation_df,
                    'high': box_high,
                    'low': box_low,
                    'height': box_height,
                    'range_percent': box_range_percent,
                    'touches': touches,
                    'weeks': weeks
                }

        # No valid box found
        if best_box is None:
            return {'type': 'no_box'}

        # Use the best box found
        consolidation_df = best_box['df']
        box_high = best_box['high']
        box_low = best_box['low']
        box_height = best_box['height']
        box_range_percent = best_box['range_percent']

        # RULE 5: Calculate volume metrics for breakout confirmation
        # Darvas required STRONG volume on breakouts (minimum 1.5x average)
        volume_ma20 = df['Volume'].rolling(window=20).mean()
        current_volume = int(recent_df['Volume'].iloc[-1])
        avg_volume = float(volume_ma20.iloc[-1]) if not pd.isna(volume_ma20.iloc[-1]) else 0

        # Also check volume during consolidation (should be lower than breakout)
        consolidation_avg_volume = consolidation_df['Volume'].mean()

        # RULE 6: Check for breakout
        # Breakout = current price > box_high + 1% (tighter threshold)
        # Darvas used tight thresholds to avoid false signals
        breakout_price = box_high * (1 + breakout_threshold)
        is_breakout = current_price >= breakout_price

        # RULE 7: Volume confirmation - must be 1.3x+ average (relaxed from 1.5x)
        volume_confirmed = current_volume > avg_volume * 1.3 if avg_volume > 0 else False

        # Additional check: Volume expansion during breakout
        # Breakout volume should be significantly higher than consolidation volume
        volume_expansion = (current_volume > consolidation_avg_volume * 1.3) if consolidation_avg_volume > 0 else False

        # RULE 8: Check if price stayed above box for confirmation (if breakout occurred)
        # Look at last 2-3 days to see if price is holding above box
        days_above_box = 0
        if is_breakout and len(recent_df) >= 3:
            last_3_days = recent_df.tail(3)
            days_above_box = (last_3_days['Close'] > box_high).sum()

        # Calculate box age (days in consolidation)
        box_age_days = len(consolidation_df)

        # RULE 9: Determine box status with balanced criteria (relaxed from strict)
        if is_breakout and volume_confirmed and volume_expansion:
            # True breakout: price above box + strong volume + volume expansion
            if days_above_box >= 1:
                status = 'broken'  # Confirmed breakout (1+ days above, relaxed from 2)
            else:
                status = 'active'  # Potential breakout but needs confirmation
        elif is_breakout and (not volume_confirmed or not volume_expansion):
            status = 'false_breakout'  # Breakout without proper volume confirmation
        else:
            status = 'active'  # Currently consolidating in the box

        # Calculate formation date (when box started)
        formation_date = consolidation_df['Date'].iloc[0] if 'Date' in consolidation_df.columns else None
        if isinstance(formation_date, pd.Timestamp):
            formation_date = formation_date.strftime('%Y-%m-%d')

        # RULE 10: Calculate risk-reward ratio (Darvas style)
        # Risk = Entry (box_high) to Stop (box_low - 2-3%)
        # Reward = Entry to Target (box_high + 2-3x box height)
        # Darvas aimed for 2:1 to 3:1 reward-to-risk ratios
        stop_loss_price = box_low * 0.98  # 2% below box low
        risk = box_high - stop_loss_price

        # Target: Darvas projected 2x box height above breakout
        target_price = box_high + (box_height * 2)
        reward = target_price - box_high

        risk_reward_ratio = reward / risk if risk > 0 else 0

        return {
            'type': 'darvas_box',
            'status': status,
            'box_high': box_high,
            'box_low': box_low,
            'box_height': box_height,
            'box_range_percent': box_range_percent,
            'current_price': current_price,
            'formation_date': formation_date,
            'consolidation_days': box_age_days,
            'breakout_price': breakout_price,
            'is_breakout': is_breakout,
            'volume_confirmed': volume_confirmed,
            'current_volume': current_volume,
            'avg_volume': int(avg_volume) if avg_volume > 0 else 0,
            'week_52_high': current_52w_high,
            'risk_reward_ratio': risk_reward_ratio,
            'price_to_box_high_percent': ((current_price - box_high) / box_high) * 100
        }

    except Exception as e:
        print(f"  ❌ Error detecting Darvas box for {symbol}: {str(e)}")
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

def save_to_firebase(crossovers_50, crossovers_200, supertrend_crosses, volume_spikes, darvas_boxes, bb_squeeze_signals):
    """Save crossover, volume spike, Darvas box, and BB Squeeze data to Firebase collections"""
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

        # Delete old Darvas boxes
        darvas_ref = db.collection('darvasboxes')
        for doc in darvas_ref.where('date', '==', today).stream():
            doc.reference.delete()

        # Delete old BB Squeeze signals
        bb_squeeze_ref = db.collection('bbsqueeze')
        for doc in bb_squeeze_ref.where('date', '==', today).stream():
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
                'yesterdayVolume': spike.get('yesterday_volume', 0),
                'volumeMA20': spike['volume_ma20'],
                'volumeMA50': spike.get('volume_ma50', 0),
                'spikePercent': spike['spike_percent'],
                'rvr': spike.get('rvr', 0),  # Relative Volume Ratio
                'qualityScore': spike.get('quality_score', 0),
                'todayClose': spike['today_close'],
                'yesterdayClose': spike['yesterday_close'],
                'priceChangePercent': spike['price_change_percent'],
                'isExceptional': spike.get('is_exceptional', False),
                'volumeTrendConsistent': spike.get('volume_trend_consistent', False),
                'createdAt': firestore.SERVER_TIMESTAMP
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        # Save Darvas boxes
        print(f'💾 Saving {len(darvas_boxes)} stocks to darvasboxes collection...')
        for box in darvas_boxes:
            # Add NS_ prefix to match symbols collection format
            symbol_with_prefix = f"NS_{box['symbol']}" if not box['symbol'].startswith('NS_') else box['symbol']

            # Get lastPrice from DuckDB
            last_price = get_last_price(box['symbol'])

            doc_ref = darvas_ref.document(f"{symbol_with_prefix}_{today}")
            doc_data = {
                'symbol': symbol_with_prefix,
                'date': today,
                'status': box['status'],  # 'active', 'broken', 'false_breakout'
                'boxHigh': box['box_high'],
                'boxLow': box['box_low'],
                'boxHeight': box['box_height'],
                'boxRangePercent': box['box_range_percent'],
                'currentPrice': box['current_price'],
                'formationDate': box['formation_date'],
                'consolidationDays': box['consolidation_days'],
                'breakoutPrice': box['breakout_price'],
                'isBreakout': box['is_breakout'],
                'volumeConfirmed': box['volume_confirmed'],
                'currentVolume': box['current_volume'],
                'avgVolume': box['avg_volume'],
                'week52High': box['week_52_high'],
                'riskRewardRatio': box['risk_reward_ratio'],
                'priceToBoxHighPercent': box['price_to_box_high_percent'],
                'createdAt': firestore.SERVER_TIMESTAMP
            }

            # Add lastPrice if available (from DuckDB)
            if last_price is not None:
                doc_data['lastPrice'] = last_price

            doc_ref.set(doc_data)

        # Save BB Squeeze signals
        print(f'💾 Saving {len(bb_squeeze_signals)} signals to bbsqueeze collection...')
        for signal in bb_squeeze_signals:
            symbol_with_prefix = f"NS_{signal['symbol']}" if not signal['symbol'].startswith('NS_') else signal['symbol']

            # Get lastPrice from DuckDB
            last_price = get_last_price(signal['symbol'])

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
    """Main function to detect MA, Supertrend crossovers, Volume Spikes, Darvas Boxes & BB Squeeze"""
    print('🔍 Stock Screeners: MA & Supertrend Crossovers, Volume Spikes, Darvas Boxes & BB Squeeze')
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
    darvas_boxes_active = []
    darvas_boxes_broken = []
    darvas_boxes_false = []
    bb_squeeze_buy = []
    bb_squeeze_sell = []
    bb_squeeze_squeeze = []
    bb_squeeze_breakout = []
    all_50ma_crosses = []  # Combined for Firebase
    all_200ma_crosses = []  # Combined for Firebase
    all_supertrend_crosses = []  # Combined for Firebase
    all_volume_spikes = []  # For Firebase
    all_darvas_boxes = []  # For Firebase
    all_bb_squeeze = []  # For Firebase

    print('🔄 Scanning for crossovers, volume spikes, Darvas boxes, and BB Squeeze...\n')

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

        # Check Darvas Box
        result_darvas = detect_darvas_box(symbol)
        if result_darvas and result_darvas['type'] == 'darvas_box':
            data_darvas = {'symbol': symbol, **result_darvas}
            all_darvas_boxes.append(data_darvas)
            if result_darvas['status'] == 'active':
                darvas_boxes_active.append(data_darvas)
            elif result_darvas['status'] == 'broken':
                darvas_boxes_broken.append(data_darvas)
            elif result_darvas['status'] == 'false_breakout':
                darvas_boxes_false.append(data_darvas)

        # Check BB Squeeze
        result_bb = detect_bb_squeeze_breakout(symbol)
        if result_bb and result_bb['type'] != 'no_signal':
            data_bb = {'symbol': symbol, **result_bb}
            all_bb_squeeze.append(data_bb)
            if result_bb['type'] == 'BUY':
                bb_squeeze_buy.append(data_bb)
            elif result_bb['type'] == 'SELL':
                bb_squeeze_sell.append(data_bb)
            elif result_bb['type'] == 'SQUEEZE':
                bb_squeeze_squeeze.append(data_bb)
            elif result_bb['type'] == 'BREAKOUT':
                bb_squeeze_breakout.append(data_bb)

    # Save to Firebase
    save_to_firebase(all_50ma_crosses, all_200ma_crosses, all_supertrend_crosses, all_volume_spikes, all_darvas_boxes, all_bb_squeeze)

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
        # Sort by quality score (highest quality first)
        volume_spikes.sort(key=lambda x: x.get('quality_score', 0), reverse=True)
        print(f"{'Symbol':<12} {'Volume':<15} {'RVR':<8} {'Quality':<10} {'Spike %':<10} {'Price Δ%':<10} {'Status':<15}")
        print('-' * 80)
        for spike in volume_spikes:
            # Status indicators
            status = []
            if spike.get('is_exceptional', False):
                status.append('⚡')  # Exceptional volume
            if spike.get('volume_trend_consistent', False):
                status.append('📈')  # Consistent trend
            status_str = ''.join(status) if status else '-'

            print(f"{spike['symbol']:<12} "
                  f"{spike['today_volume']:<15,} "
                  f"{spike.get('rvr', 0):>6.2f}x "
                  f"{spike.get('quality_score', 0):>8.0f}/100 "
                  f"{spike['spike_percent']:>8.1f}% "
                  f"{spike['price_change_percent']:>8.2f}% "
                  f"{status_str:<15}")
    else:
        print('  No volume spikes today')

    # Darvas Boxes
    print(f'\n📦 DARVAS BOXES ({len(all_darvas_boxes)} total):')
    print('-' * 80)

    # Active boxes
    if darvas_boxes_active:
        print(f'\n🟦 ACTIVE BOXES ({len(darvas_boxes_active)} stocks):')
        darvas_boxes_active.sort(key=lambda x: x['consolidation_days'], reverse=True)
        print(f"{'Symbol':<12} {'Box High':<12} {'Box Low':<12} {'Current':<12} {'Days':<8} {'Range %':<10}")
        print('-' * 80)
        for box in darvas_boxes_active:
            print(f"{box['symbol']:<12} "
                  f"₹{box['box_high']:<11.2f} "
                  f"₹{box['box_low']:<11.2f} "
                  f"₹{box['current_price']:<11.2f} "
                  f"{box['consolidation_days']:<8} "
                  f"{box['box_range_percent']:>8.2f}%")
    else:
        print('  No active Darvas boxes found')

    # Broken boxes (successful breakouts)
    if darvas_boxes_broken:
        print(f'\n🟢 SUCCESSFUL BREAKOUTS ({len(darvas_boxes_broken)} stocks):')
        darvas_boxes_broken.sort(key=lambda x: x['price_to_box_high_percent'], reverse=True)
        print(f"{'Symbol':<12} {'Box High':<12} {'Current':<12} {'Breakout %':<12} {'Volume OK':<12}")
        print('-' * 80)
        for box in darvas_boxes_broken:
            print(f"{box['symbol']:<12} "
                  f"₹{box['box_high']:<11.2f} "
                  f"₹{box['current_price']:<11.2f} "
                  f"{box['price_to_box_high_percent']:>10.2f}% "
                  f"{'✓' if box['volume_confirmed'] else '✗':<12}")
    else:
        print('  No successful breakouts today')

    # False breakouts
    if darvas_boxes_false:
        print(f'\n🔴 FALSE BREAKOUTS ({len(darvas_boxes_false)} stocks):')
        print(f"{'Symbol':<12} {'Box High':<12} {'Current':<12} {'Breakout %':<12}")
        print('-' * 80)
        for box in darvas_boxes_false:
            print(f"{box['symbol']:<12} "
                  f"₹{box['box_high']:<11.2f} "
                  f"₹{box['current_price']:<11.2f} "
                  f"{box['price_to_box_high_percent']:>10.2f}%")
    else:
        print('  No false breakouts today')

    # BB Squeeze Results
    print(f'\n💰 BB SQUEEZE BREAKOUT ({len(all_bb_squeeze)} total):')
    print('-' * 80)

    # BUY Signals
    if bb_squeeze_buy:
        print(f'\n🟢 BUY SIGNALS ({len(bb_squeeze_buy)} stocks):')
        bb_squeeze_buy.sort(key=lambda x: x['rsi'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'BB Width%':<12}")
        print('-' * 80)
        for signal in bb_squeeze_buy[:10]:  # Show top 10
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['rsi']:>6.2f} "
                  f"{signal['macd']:>8.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No BUY signals today')

    # SELL Signals
    if bb_squeeze_sell:
        print(f'\n🔴 SELL SIGNALS ({len(bb_squeeze_sell)} stocks):')
        bb_squeeze_sell.sort(key=lambda x: x['rsi'])
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'BB Width%':<12}")
        print('-' * 80)
        for signal in bb_squeeze_sell[:10]:  # Show top 10
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['rsi']:>6.2f} "
                  f"{signal['macd']:>8.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No SELL signals today')

    # SQUEEZE Signals (watching for breakout)
    if bb_squeeze_squeeze:
        print(f'\n🔒 SQUEEZE SIGNALS ({len(bb_squeeze_squeeze)} stocks - top 10):')
        bb_squeeze_squeeze.sort(key=lambda x: x['days_in_squeeze'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'Days':<8} {'Proportion':<12} {'BB Width%':<12}")
        print('-' * 80)
        for signal in bb_squeeze_squeeze[:10]:  # Show top 10
            print(f"{signal['symbol']:<12} "
                  f"₹{signal['current_price']:<11.2f} "
                  f"{signal['days_in_squeeze']:>6} "
                  f"{signal['proportion']:>10.2f} "
                  f"{signal['bb_width_percent']:>10.2f}%")
    else:
        print('  No stocks in squeeze today')

    # BREAKOUT Signals (just broke out of squeeze)
    if bb_squeeze_breakout:
        print(f'\n💥 BREAKOUT SIGNALS ({len(bb_squeeze_breakout)} stocks):')
        bb_squeeze_breakout.sort(key=lambda x: x['rsi'], reverse=True)
        print(f"{'Symbol':<12} {'Price':<12} {'RSI':<8} {'MACD':<10} {'Proportion':<12}")
        print('-' * 80)
        for signal in bb_squeeze_breakout[:10]:  # Show top 10
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
    print(f'  Bullish 50 MA Crosses: {len(bullish_50ma_crosses)}')
    print(f'  Bearish 50 MA Crosses: {len(bearish_50ma_crosses)}')
    print(f'  Bullish 200 MA Crosses: {len(bullish_200ma_crosses)}')
    print(f'  Bearish 200 MA Crosses: {len(bearish_200ma_crosses)}')
    print(f'  Bullish Supertrend Crosses: {len(bullish_supertrend_crosses)}')
    print(f'  Bearish Supertrend Crosses: {len(bearish_supertrend_crosses)}')
    print(f'  Volume Spikes: {len(volume_spikes)}')
    print(f'  Darvas Boxes (Active): {len(darvas_boxes_active)}')
    print(f'  Darvas Boxes (Broken): {len(darvas_boxes_broken)}')
    print(f'  Darvas Boxes (False): {len(darvas_boxes_false)}')
    print(f'  BB Squeeze (BUY): {len(bb_squeeze_buy)}')
    print(f'  BB Squeeze (SELL): {len(bb_squeeze_sell)}')
    print(f'  BB Squeeze (SQUEEZE): {len(bb_squeeze_squeeze)}')
    print(f'  BB Squeeze (BREAKOUT): {len(bb_squeeze_breakout)}')
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
