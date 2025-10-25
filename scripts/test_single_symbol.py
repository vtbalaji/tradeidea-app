#!/usr/bin/env python3
"""
Test Single Symbol - Detailed Analysis

Tests bottomed out pattern + trendline analysis for ONE symbol
Shows:
- Consolidation metrics
- Trendline formation (using HIGHS)
- Trendline touch points
- Graham Score

Usage:
    ./venv/bin/python3 scripts/test_single_symbol.py TRENT
    ./venv/bin/python3 scripts/test_single_symbol.py TCS
"""

import sys
import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_price_data(symbol, days=365):
    """Get OHLCV data from DuckDB"""
    conn = duckdb.connect('data/eod.duckdb', read_only=True)
    query = f"""
        SELECT date, open, high, low, close, volume
        FROM ohlcv
        WHERE symbol = '{symbol}'
        AND date >= CURRENT_DATE - INTERVAL '{days} days'
        ORDER BY date ASC
    """
    df = conn.execute(query).fetchdf()
    conn.close()

    if not df.empty:
        df['date'] = pd.to_datetime(df['date'])
    return df

def get_fundamentals(symbol):
    """Get fundamental data"""
    conn = duckdb.connect('data/fundamentals.duckdb', read_only=True)
    query = f"""
        SELECT symbol, trailing_pe, price_to_book, market_cap,
               profit_margins, roe, current_price
        FROM yahoo_current_fundamentals
        WHERE symbol = '{symbol}'
    """
    result = conn.execute(query).fetchdf()
    conn.close()

    if result.empty:
        return None
    return result.iloc[0].to_dict()

def detect_trendline(df, lookback_days=180):
    """
    Detect descending trendline using HIGHS
    Returns trendline parameters and touch points
    """
    if len(df) < 60:
        return None

    # Use data from lookback period
    trendline_data = df.tail(lookback_days).copy()

    # Find significant highs (local peaks)
    # A high is significant if it's higher than neighbors
    significant_highs = []

    for i in range(5, len(trendline_data) - 5):
        current_high = trendline_data.iloc[i]['high']
        prev_highs = trendline_data.iloc[i-5:i]['high'].max()
        next_highs = trendline_data.iloc[i+1:i+6]['high'].max()

        # If current high is higher than surrounding highs
        if current_high >= prev_highs and current_high >= next_highs:
            significant_highs.append({
                'date': trendline_data.iloc[i]['date'],
                'high': current_high,
                'index': i
            })

    if len(significant_highs) < 2:
        return None

    # Find best descending trendline (connect highest peaks)
    # Sort by high value descending
    significant_highs_sorted = sorted(significant_highs, key=lambda x: x['high'], reverse=True)

    # Try to connect top 2-3 highs to form trendline
    best_trendline = None
    best_score = 0

    # Take top 5 highs and try combinations
    top_highs = significant_highs_sorted[:min(5, len(significant_highs_sorted))]

    for i in range(len(top_highs)):
        for j in range(i + 1, len(top_highs)):
            high1 = top_highs[i]
            high2 = top_highs[j]

            # Skip if highs are too close in time
            days_apart = abs((high1['date'] - high2['date']).days)
            if days_apart < 30:
                continue

            # Calculate slope (must be descending)
            slope = (high2['high'] - high1['high']) / days_apart

            if slope >= 0:  # Not descending
                continue

            # Calculate intercept
            days_from_start = (high1['date'] - trendline_data.iloc[0]['date']).days
            intercept = high1['high'] - (slope * days_from_start)

            # Count touch points (highs near trendline)
            touches = []
            for idx, row in trendline_data.iterrows():
                days_from_start = (row['date'] - trendline_data.iloc[0]['date']).days
                trendline_value = intercept + (slope * days_from_start)

                # Check if high touched trendline (within 2% tolerance)
                tolerance = trendline_value * 0.02
                if abs(row['high'] - trendline_value) <= tolerance:
                    touches.append({
                        'date': row['date'],
                        'high': row['high'],
                        'trendline_value': trendline_value,
                        'diff_pct': ((row['high'] - trendline_value) / trendline_value) * 100
                    })

            # Score based on number of touches and slope
            score = len(touches) - abs(slope) * 100  # More touches = better, gentler slope = better

            if score > best_score and len(touches) >= 2:
                best_score = score
                best_trendline = {
                    'slope': slope,
                    'intercept': intercept,
                    'touches': touches,
                    'start_date': trendline_data.iloc[0]['date'],
                    'point1': high1,
                    'point2': high2
                }

    return best_trendline

def analyze_consolidation(df):
    """Analyze consolidation pattern"""
    if len(df) < 90:
        return None

    current_price = df['close'].iloc[-1]

    # Find peak
    lookback_start = max(60, len(df) - 250)
    lookback_end = len(df) - 30

    if lookback_end <= lookback_start:
        return None

    peak_window = df.iloc[lookback_start:lookback_end]
    peak_price = peak_window['close'].max()
    peak_date = peak_window.loc[peak_window['close'] == peak_price, 'date'].iloc[0]

    decline_pct = ((peak_price - current_price) / peak_price) * 100

    if decline_pct < 15:
        return None

    # Consolidation analysis
    consolidation_window = df.iloc[-60:]
    box_high = consolidation_window['high'].max()
    box_low = consolidation_window['low'].min()
    box_range = box_high - box_low
    box_range_pct = (box_range / consolidation_window['close'].mean()) * 100

    support_level = consolidation_window['low'].min()

    # Calculate days in box
    tolerance = box_range * 0.15
    consolidation_start_idx = len(df) - 1

    for i in range(len(df) - 1, max(0, len(df) - 180), -1):
        price = df.iloc[i]['close']
        if price > (box_high + tolerance) or price < (box_low - tolerance):
            consolidation_start_idx = i + 1
            break

    days_in_box = len(df) - 1 - consolidation_start_idx

    # Support tests
    support_tolerance = support_level * 0.02
    support_tests = 0
    test_dates = []

    for i in range(consolidation_start_idx, len(df)):
        if abs(df.iloc[i]['low'] - support_level) <= support_tolerance:
            support_tests += 1
            test_dates.append({
                'date': df.iloc[i]['date'],
                'low': df.iloc[i]['low'],
                'support': support_level
            })

    return {
        'current_price': current_price,
        'peak_price': peak_price,
        'peak_date': peak_date,
        'decline_pct': decline_pct,
        'box_high': box_high,
        'box_low': box_low,
        'box_range_pct': box_range_pct,
        'support_level': support_level,
        'days_in_box': days_in_box,
        'support_tests': support_tests,
        'support_test_dates': test_dates,
        'days_since_peak': (df['date'].iloc[-1] - peak_date).days
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_single_symbol.py <SYMBOL>")
        print("Example: python3 test_single_symbol.py TRENT")
        sys.exit(1)

    symbol = sys.argv[1].upper()

    print("=" * 80)
    print(f"📊 DETAILED ANALYSIS: {symbol}")
    print("=" * 80)
    print()

    # Get data
    print("📥 Fetching data...")
    df = get_price_data(symbol, days=365)

    if df.empty:
        print(f"❌ No data found for {symbol}")
        sys.exit(1)

    print(f"✅ Loaded {len(df)} days of data")
    print(f"   Date range: {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"   Current price: ₹{df['close'].iloc[-1]:.2f}")
    print()

    # Fundamentals
    print("=" * 80)
    print("📈 FUNDAMENTAL DATA")
    print("=" * 80)
    fund = get_fundamentals(symbol)
    if fund:
        print(f"  PE Ratio: {fund.get('trailing_pe', 'N/A')}")
        print(f"  P/B Ratio: {fund.get('price_to_book', 'N/A')}")
        print(f"  Market Cap: ₹{fund.get('market_cap', 0) / 10000000:.2f} Cr")
        print(f"  ROE: {fund.get('roe', 'N/A')}")
    else:
        print("  No fundamental data available")
    print()

    # Consolidation analysis
    print("=" * 80)
    print("📦 CONSOLIDATION ANALYSIS")
    print("=" * 80)
    consol = analyze_consolidation(df)

    if consol:
        print(f"  Peak Price: ₹{consol['peak_price']:.2f} (on {consol['peak_date'].date()})")
        print(f"  Current Price: ₹{consol['current_price']:.2f}")
        print(f"  Decline from Peak: {consol['decline_pct']:.2f}%")
        print(f"  Days Since Peak: {consol['days_since_peak']} days")
        print()
        print(f"  📦 Box Metrics:")
        print(f"     Box High: ₹{consol['box_high']:.2f}")
        print(f"     Box Low: ₹{consol['box_low']:.2f}")
        print(f"     Box Range: {consol['box_range_pct']:.2f}%")
        print(f"     Support Level: ₹{consol['support_level']:.2f}")
        print()
        print(f"  ⏱️  Consolidation Duration:")
        print(f"     Days in Box: {consol['days_in_box']} days")
        print(f"     Support Tests: {consol['support_tests']} times")
        print()

        if consol['support_test_dates']:
            print(f"  📍 Support Test Dates:")
            for test in consol['support_test_dates'][-10:]:  # Show last 10
                print(f"     {test['date'].date()}: Low ₹{test['low']:.2f} (Support: ₹{test['support']:.2f})")
    else:
        print("  ❌ No consolidation pattern detected")
    print()

    # Trendline analysis
    print("=" * 80)
    print("📉 TRENDLINE ANALYSIS (Using HIGHS)")
    print("=" * 80)

    trendline = detect_trendline(df, lookback_days=180)

    if trendline:
        print(f"  ✅ Descending trendline detected!")
        print()
        print(f"  📐 Trendline Parameters:")
        print(f"     Slope: {trendline['slope']:.6f} (negative = descending)")
        print(f"     Daily decline: ₹{abs(trendline['slope']):.2f} per day")
        print()
        print(f"  🎯 Key Connection Points:")
        print(f"     Point 1: {trendline['point1']['date'].date()} - High ₹{trendline['point1']['high']:.2f}")
        print(f"     Point 2: {trendline['point2']['date'].date()} - High ₹{trendline['point2']['high']:.2f}")
        print()
        print(f"  📍 Trendline Touch Points ({len(trendline['touches'])} total):")
        print()

        for i, touch in enumerate(trendline['touches'], 1):
            print(f"     {i}. {touch['date'].date()}")
            print(f"        High: ₹{touch['high']:.2f}")
            print(f"        Trendline: ₹{touch['trendline_value']:.2f}")
            print(f"        Diff: {touch['diff_pct']:+.2f}%")
            print()

        # Calculate current trendline value
        current_date = df['date'].iloc[-1]
        days_from_start = (current_date - trendline['start_date']).days
        current_trendline_value = trendline['intercept'] + (trendline['slope'] * days_from_start)
        current_price = df['close'].iloc[-1]
        distance_from_trendline = ((current_price - current_trendline_value) / current_trendline_value) * 100

        print(f"  📊 Current Status:")
        print(f"     Current Price: ₹{current_price:.2f}")
        print(f"     Trendline Value Today: ₹{current_trendline_value:.2f}")
        print(f"     Distance: {distance_from_trendline:+.2f}%")

        if distance_from_trendline < -5:
            print(f"     Status: ✅ Well below trendline (bullish)")
        elif distance_from_trendline < 0:
            print(f"     Status: 🟡 Below trendline")
        elif distance_from_trendline < 5:
            print(f"     Status: 🟡 Near trendline (watch for resistance)")
        else:
            print(f"     Status: ⚠️  Above trendline (potential breakout!)")

    else:
        print("  ❌ No clear descending trendline detected")
        print("     (May be in sideways/ascending pattern)")
    print()

    # Summary
    print("=" * 80)
    print("📋 SUMMARY")
    print("=" * 80)

    if consol and trendline:
        print(f"  Pattern: ✅ Bottomed Out with Descending Trendline")
        print(f"  Consolidation: {consol['days_in_box']} days in box")
        print(f"  Support Strength: {consol['support_tests']} tests")
        print(f"  Trendline Touches: {len(trendline['touches'])} points")
        print(f"  Decline: {consol['decline_pct']:.1f}% from peak")
        print()
        print(f"  🎯 Trading Setup:")
        print(f"     Support: ₹{consol['support_level']:.2f}")
        print(f"     Resistance (Trendline): ₹{current_trendline_value:.2f}")
        print(f"     Box High: ₹{consol['box_high']:.2f}")

    elif consol:
        print(f"  Pattern: 📦 Consolidation (no clear trendline)")
        print(f"  Duration: {consol['days_in_box']} days")
        print(f"  Support: ₹{consol['support_level']:.2f} ({consol['support_tests']} tests)")

    else:
        print(f"  Pattern: ❌ No consolidation detected")
        print(f"  Reason: Decline < 15% or insufficient data")

    print()
    print("✅ Analysis complete!")

if __name__ == '__main__':
    main()
