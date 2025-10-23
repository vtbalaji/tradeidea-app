#!/usr/bin/env python3
"""
Debug the Darvas box detection to understand why stocks don't show boxes
"""

import pandas as pd
import sys
import os

# Add paths for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

nse_fetcher = NSEDataFetcher()

def debug_darvas(symbol):
    """Debug why a stock may not have a valid Darvas box"""
    print(f"\n{'='*80}")
    print(f"Debugging: {symbol}")
    print(f"{'='*80}")

    try:
        df = nse_fetcher.get_data(symbol, days=300)

        if df.empty:
            print("❌ No data")
            return

        df = df.rename(columns={
            'date': 'Date',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Calculate 52-week high
        df['52W_High'] = df['High'].rolling(window=260).max()
        df['Volume_MA20'] = df['Volume'].rolling(window=20).mean()

        current_price = float(df['Close'].iloc[-1])
        current_52w_high = float(df['52W_High'].iloc[-1])

        print(f"\n📊 Current Status:")
        print(f"   Current Price: ₹{current_price:.2f}")
        print(f"   52-Week High: ₹{current_52w_high:.2f}")
        print(f"   Distance: {((current_52w_high - current_price) / current_52w_high * 100):.2f}%")

        # Find new high points
        print(f"\n🔍 Scanning for NEW 52-week highs in last 100 days...")
        new_high_points = []

        for i in range(len(df) - 1, max(0, len(df) - 100), -1):
            if pd.isna(df['52W_High'].iloc[i]):
                continue

            high_val = float(df['High'].iloc[i])
            high_52w = float(df['52W_High'].iloc[i])

            if high_val >= high_52w * 0.995:
                date = df['Date'].iloc[i].strftime('%Y-%m-%d')
                new_high_points.append({
                    'idx': i,
                    'date': date,
                    'high': high_val,
                    'close': df['Close'].iloc[i],
                    'volume': df['Volume'].iloc[i]
                })

        print(f"   Found {len(new_high_points)} new high points")

        if new_high_points:
            print(f"\n   Recent new highs:")
            for hp in new_high_points[:5]:
                print(f"      {hp['date']}: High=₹{hp['high']:.2f}, Volume={int(hp['volume']):,}")

        # For each high point, check for consolidation boxes
        print(f"\n🔍 Analyzing consolidation patterns BEFORE each high...")

        boxes_found = 0
        for hp_idx, hp in enumerate(new_high_points[:5]):
            print(f"\n   [{hp_idx + 1}] High on {hp['date']} (₹{hp['high']:.2f}):")

            breakout_idx = hp['idx']

            # Try different consolidation periods
            found_valid = False
            for weeks in range(3, 9):
                consol_period = weeks * 5

                if breakout_idx < consol_period + 2:
                    continue

                consol_start = breakout_idx - consol_period - 2
                consol_end = breakout_idx - 1

                if consol_start < 0:
                    continue

                consol_df = df.iloc[consol_start:consol_end + 1]

                box_high = float(consol_df['High'].max())
                box_low = float(consol_df['Low'].min())
                box_range = ((box_high - box_low) / box_low) * 100
                touches = (consol_df['High'] >= box_high * 0.99).sum()

                # Check if breakout is above box
                breaks_box = hp['high'] >= box_high * 0.99

                range_ok = 4 <= box_range <= 12
                touches_ok = touches >= 2

                if range_ok and touches_ok and breaks_box:
                    # Calculate volumes
                    consol_avg_vol = consol_df['Volume'].mean()
                    vol_ma20 = df['Volume_MA20'].iloc[breakout_idx]
                    vol_ratio = hp['volume'] / vol_ma20 if not pd.isna(vol_ma20) and vol_ma20 > 0 else 0
                    vol_expansion = hp['volume'] / consol_avg_vol if consol_avg_vol > 0 else 0

                    print(f"      ✅ {weeks}-week box VALID:")
                    print(f"         Box: ₹{box_low:.2f} - ₹{box_high:.2f} (Range: {box_range:.2f}%)")
                    print(f"         Touches: {touches}")
                    print(f"         Breakout vol: {int(hp['volume']):,} ({vol_ratio:.2f}x MA20)")
                    print(f"         Vol expansion: {vol_expansion:.2f}x")
                    print(f"         Volume 1.3x MA20: {'✓' if vol_ratio >= 1.3 else '✗ FAIL'}")
                    print(f"         Volume 1.3x consol: {'✓' if vol_expansion >= 1.3 else '✗ FAIL'}")

                    # Check price confirmation
                    days_after = min(5, len(df) - breakout_idx - 1)
                    days_above = 0
                    if days_after > 0:
                        after_df = df.iloc[breakout_idx + 1 : breakout_idx + 1 + days_after]
                        days_above = (after_df['Close'] > box_high).sum()

                    print(f"         Days above box: {days_above} {'✓' if days_above >= 1 else '✗ FAIL'}")

                    found_valid = True
                    boxes_found += 1
                    break

            if not found_valid:
                print(f"      ❌ No valid consolidation box found (checked 3-8 weeks)")
                # Show why
                for weeks in [3, 5, 7]:
                    consol_period = weeks * 5
                    if breakout_idx < consol_period + 2:
                        continue
                    consol_start = breakout_idx - consol_period - 2
                    consol_end = breakout_idx - 1
                    if consol_start < 0:
                        continue

                    consol_df = df.iloc[consol_start:consol_end + 1]
                    box_high = float(consol_df['High'].max())
                    box_low = float(consol_df['Low'].min())
                    box_range = ((box_high - box_low) / box_low) * 100
                    touches = (consol_df['High'] >= box_high * 0.99).sum()

                    range_ok = 4 <= box_range <= 12
                    touches_ok = touches >= 2

                    print(f"         {weeks}-week: Range {box_range:.2f}% {'✓' if range_ok else '✗'}, Touches {touches} {'✓' if touches_ok else '✗'}")

        if boxes_found == 0:
            print(f"\n❌ SUMMARY: No valid Darvas boxes found")
            print(f"   Possible reasons:")
            print(f"   1. Consolidation ranges too wide (>12%) or too tight (<4%)")
            print(f"   2. Not enough resistance touches (<2)")
            print(f"   3. Breakout volume insufficient (<1.3x)")
            print(f"   4. Price didn't stay above box after breakout")
        else:
            print(f"\n✅ SUMMARY: Found {boxes_found} valid box pattern(s)")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    symbols = ['GPIL', 'MINDACORP', 'BOSCHLTD']

    print("="*80)
    print("Darvas Box Debugger")
    print("="*80)

    for symbol in symbols:
        debug_darvas(symbol)

    print(f"\n{'='*80}")

if __name__ == '__main__':
    try:
        main()
        nse_fetcher.close()
        print('\n✅ Debug completed')
    except Exception as e:
        print(f'\n❌ Error: {e}')
        nse_fetcher.close()
