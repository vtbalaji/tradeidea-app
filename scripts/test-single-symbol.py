#!/usr/bin/env python3
"""
Quick Technical Analysis Test for Single Symbol

Usage:
    python3 scripts/test-single-symbol.py BAJFINANCE

Features:
    - NO split adjustment
    - NO interactive prompts
    - JUST technical analysis
    - Display results only
"""

import sys
import os

# Add path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if os.path.exists(cred_path):
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass  # Already initialized

db = firestore.client()

# Import analyzer functions
import importlib.util
spec = importlib.util.spec_from_file_location("analyzer", os.path.join(current_dir, "analyze-symbols-duckdb.py"))
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)

def test_symbol(symbol):
    """Test a single symbol - technical analysis only"""
    print('='*70)
    print(f'📊 Technical Analysis: {symbol}')
    print('='*70)

    fetcher = NSEDataFetcher()

    try:
        # Fetch data
        print(f'\n📥 Fetching historical data...')
        df = analyzer.fetch_eod_data(fetcher, symbol)

        if df is None or len(df) < 200:
            print(f'❌ Insufficient data for {symbol}')
            print(f'   Need at least 200 days, found: {len(df) if df is not None else 0}')
            return

        print(f'✅ Fetched {len(df)} days of data')

        # Calculate indicators
        print(f'\n📈 Calculating technical indicators...')
        analysis = analyzer.calculate_indicators(df)

        # Display results
        print(f'\n📊 Technical Analysis Results:')
        print('='*70)
        print(f'Signal: {analysis["overallSignal"]}')
        print(f'Price: ₹{analysis["lastPrice"]:.2f} ({analysis["changePercent"]:+.2f}%)')
        print(f'\n📈 Period Performance:')
        print(f'  Weekly:    {analysis["weeklyChangePercent"]:+6.2f}%')
        print(f'  Monthly:   {analysis["monthlyChangePercent"]:+6.2f}%')
        print(f'  Quarterly: {analysis["quarterlyChangePercent"]:+6.2f}%')

        print(f'\n📊 Moving Averages:')
        print(f'  20 MA:  ₹{analysis["sma20"]:,.2f}')
        print(f'  50 MA:  ₹{analysis["sma50"]:,.2f}')
        print(f'  100 MA: ₹{analysis["sma100"]:,.2f}')
        print(f'  200 MA: ₹{analysis["sma200"]:,.2f}')

        print(f'\n📊 EMAs:')
        print(f'  9 EMA:  ₹{analysis["ema9"]:,.2f}')
        print(f'  21 EMA: ₹{analysis["ema21"]:,.2f}')
        print(f'  50 EMA: ₹{analysis["ema50"]:,.2f}')

        print(f'\n📊 Momentum Indicators:')
        print(f'  RSI (14):        {analysis["rsi14"]:.1f}')
        if analysis["rsi14"] > 70:
            print(f'                   🔴 Overbought')
        elif analysis["rsi14"] < 30:
            print(f'                   🟢 Oversold')
        else:
            print(f'                   ⚪ Neutral')

        print(f'\n📊 Supertrend:')
        print(f'  Daily:   ₹{analysis["supertrend"]:,.2f} {"🟢 Bullish" if analysis["supertrendDirection"] == 1 else "🔴 Bearish"}')
        print(f'  Weekly:  ₹{analysis["weeklySupertrend"]:,.2f} {"🟢 Bullish" if analysis["weeklySupertrendDirection"] == 1 else "🔴 Bearish"}')

        print(f'\n📊 Bollinger Bands:')
        print(f'  Upper:  ₹{analysis["bollingerUpper"]:,.2f}')
        print(f'  Middle: ₹{analysis["bollingerMiddle"]:,.2f}')
        print(f'  Lower:  ₹{analysis["bollingerLower"]:,.2f}')

        print(f'\n📊 MACD:')
        print(f'  MACD:      {analysis["macd"]:.2f}')
        print(f'  Signal:    {analysis["macdSignal"]:.2f}')
        print(f'  Histogram: {analysis["macdHistogram"]:.2f} {"🟢 Bullish" if analysis["macdHistogram"] > 0 else "🔴 Bearish"}')

        print(f'\n📊 Volume:')
        print(f'  Current:   {analysis["volume"]:,}')
        print(f'  Avg (20d): {analysis["avgVolume20"]:,}')
        print(f'  Ratio:     {analysis["volume"]/analysis["avgVolume20"]:.2f}x')

        print(f'\n📊 Price Action:')
        print(f'  Trend Structure: {analysis["trendStructure"]}')
        print(f'  Price Pattern:')
        pattern = analysis["pricePattern"]
        print(f'    Higher Highs: {"✅" if pattern["higherHighs"] else "❌"}')
        print(f'    Higher Lows:  {"✅" if pattern["higherLows"] else "❌"}')
        print(f'    Lower Highs:  {"✅" if pattern["lowerHighs"] else "❌"}')
        print(f'    Lower Lows:   {"✅" if pattern["lowerLows"] else "❌"}')
        print(f'  BB Position (last 5 days): {analysis["bbPositionHistory"]}')

        print(f'\n🎯 Key Signals:')
        signals = analysis["signals"]
        if signals["goldenCross"]:
            print(f'  ⭐ GOLDEN CROSS (50MA > 200MA)')
        if signals["deathCross"]:
            print(f'  💀 DEATH CROSS (50MA < 200MA)')
        if signals["volumeSpike"]:
            print(f'  📈 VOLUME SPIKE (2x+ average)')
        if signals["rsiOverbought"]:
            print(f'  🔴 RSI OVERBOUGHT (>70)')
        if signals["rsiOversold"]:
            print(f'  🟢 RSI OVERSOLD (<30)')

        print(f'\n📊 Price vs Key Levels:')
        print(f'  vs 50 EMA:  {"🟢 Above" if signals["priceCrossEMA50"] == "above" else "🔴 Below"}')
        print(f'  vs 100 MA:  {"🟢 Above" if signals["priceCrossSMA100"] == "above" else "🔴 Below"}')
        print(f'  vs 200 MA:  {"🟢 Above" if signals["priceCrossSMA200"] == "above" else "🔴 Below"}')
        print(f'  vs BB Mid:  {"🟢 Above" if signals["priceAboveBBMiddle"] else "🔴 Below"}')

        print('='*70)
        print(f'✅ Analysis complete for {symbol}')
        print('='*70)

        # Ask if user wants to save
        print(f'\n💾 Save to Firestore? (y/n): ', end='', flush=True)
        try:
            save = input().strip().lower()
            if save == 'y':
                analyzer.save_to_firestore(symbol, analysis)
                print(f'✅ Saved to Firestore!')
        except EOFError:
            print('Skipped (non-interactive mode)')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

    finally:
        fetcher.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/test-single-symbol.py SYMBOL")
        print("Example: python3 scripts/test-single-symbol.py BAJFINANCE")
        sys.exit(1)

    symbol = sys.argv[1].upper()
    test_symbol(symbol)
