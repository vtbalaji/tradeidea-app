#!/usr/bin/env python3
"""
Quick test script to analyze a single symbol
Usage: ./venv/bin/python3 scripts/test-single-symbol.py RELIANCE
"""

import sys
import os

# Add path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import from analyze-symbols-duckdb
from pathlib import Path
import importlib.util

spec = importlib.util.spec_from_file_location("analyzer", os.path.join(current_dir, "analyze-symbols-duckdb.py"))
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)

def test_symbol(symbol):
    """Test a single symbol"""
    print(f"\n{'='*60}")
    print(f"Testing: {symbol}")
    print('='*60)

    fetcher = analyzer.NSEDataFetcher()

    try:
        # Fetch data
        df = analyzer.fetch_eod_data(fetcher, symbol)

        if df is None or len(df) < 200:
            print(f"❌ Insufficient data for {symbol}")
            return

        # Calculate indicators
        analysis = analyzer.calculate_indicators(df)

        # Display results
        print(f"\n📊 Technical Analysis Results:")
        print(f"{'='*60}")
        print(f"Price: ₹{analysis['lastPrice']:.2f} ({analysis['changePercent']:+.2f}%)")
        print(f"\n🔍 Price Action:")
        print(f"  Trend Structure: {analysis['trendStructure']}")
        print(f"  Price Pattern: {analysis['pricePattern']}")
        print(f"  BB Position (last 5 days): {analysis['bbPositionHistory']}")

        print(f"\n📈 Technical Indicators:")
        print(f"  RSI: {analysis['rsi14']:.1f}")
        print(f"  50 MA: ₹{analysis['sma50']:.2f}")
        print(f"  100 MA: ₹{analysis['sma100']:.2f}")
        print(f"  200 MA: ₹{analysis['sma200']:.2f}")
        print(f"  Supertrend: ₹{analysis['supertrend']:.2f} {'🟢 Bullish' if analysis['supertrendDirection'] == 1 else '🔴 Bearish'}")

        print(f"\n💹 Bollinger Bands:")
        print(f"  Upper: ₹{analysis['bollingerUpper']:.2f}")
        print(f"  Middle: ₹{analysis['bollingerMiddle']:.2f}")
        print(f"  Lower: ₹{analysis['bollingerLower']:.2f}")

        print(f"\n📊 MACD:")
        print(f"  MACD: {analysis['macd']:.2f}")
        print(f"  Signal: {analysis['macdSignal']:.2f}")
        print(f"  Histogram: {analysis['macdHistogram']:.2f} {'🟢 Bullish' if analysis['macdHistogram'] > 0 else '🔴 Bearish'}")

        print(f"\n📦 Volume:")
        print(f"  Current: {analysis['volume']:,}")
        print(f"  Avg (20d): {analysis['avgVolume20']:,}")
        print(f"  Ratio: {analysis['volume']/analysis['avgVolume20']:.2f}x")

        print(f"\n🎯 Overall Signal: {analysis['overallSignal']}")

        # Determine recommendation based on rules
        print(f"\n🤖 Recommendation Logic:")
        print(f"{'='*60}")

        tech = analysis
        current_price = tech['lastPrice']
        rsi = tech['rsi14']
        trend = tech['trendStructure']
        bb_history = tech['bbPositionHistory']

        print(f"\nChecking STRONG SELL:")
        print(f"  ✓ Trend = DOWNTREND? {trend == 'DOWNTREND'}")
        print(f"  ✓ RSI < 30 or (RSI > 70 and below 50MA)? {rsi < 30 or (rsi > 70 and current_price < tech['sma50'])}")
        print(f"  ✓ Price below 50MA? {current_price < tech['sma50']}")
        print(f"  ✓ Below BB middle for 3 days? {len(bb_history) >= 3 and all(p == 'BELOW' for p in bb_history[-3:])}")

        print(f"\nChecking STRONG BUY:")
        print(f"  ✓ Trend = UPTREND? {trend == 'UPTREND'}")
        print(f"  ✓ RSI 50-70? {50 <= rsi <= 70}")
        print(f"  ✓ Above 50MA? {current_price > tech['sma50']}")
        print(f"  ✓ Above 200MA? {current_price > tech['sma200']}")
        print(f"  ✓ Supertrend bullish? {tech['supertrendDirection'] == 1}")
        print(f"  ✓ Above BB middle for 3 days? {len(bb_history) >= 3 and all(p == 'ABOVE' for p in bb_history[-3:])}")
        print(f"  ✓ MACD bullish? {tech['macdHistogram'] > 0}")
        print(f"  ✓ Volume > avg? {tech['volume'] > tech['avgVolume20']}")

        print(f"\n{'='*60}")

        # Save to Firestore (optional)
        save = input("\n💾 Save to Firestore? (y/n): ")
        if save.lower() == 'y':
            analyzer.save_to_firestore(symbol, analysis)
            print(f"✅ Saved to Firestore!")

    finally:
        fetcher.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: ./venv/bin/python3 scripts/test-single-symbol.py SYMBOL")
        print("Example: ./venv/bin/python3 scripts/test-single-symbol.py RELIANCE")
        sys.exit(1)

    symbol = sys.argv[1].upper()
    test_symbol(symbol)
