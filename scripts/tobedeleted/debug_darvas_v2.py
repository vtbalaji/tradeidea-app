#!/usr/bin/env python3
"""
Debug the CORRECTED Darvas box detection
"""

import pandas as pd
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

nse_fetcher = NSEDataFetcher()

def debug_darvas_v2(symbol):
    """Debug the corrected Darvas logic"""
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

        df['52W_High'] = df['High'].rolling(window=260).max()
        df['Volume_MA20'] = df['Volume'].rolling(window=20).mean()

        current_price = float(df['Close'].iloc[-1])
        current_52w_high = float(df['52W_High'].iloc[-1])

        print(f"\n📊 Current Status:")
        print(f"   Current Price: ₹{current_price:.2f}")
        print(f"   52-Week High: ₹{current_52w_high:.2f}")

        # Find new highs
        print(f"\n🔍 Scanning for new 52-week highs...")

        new_highs = []
        for i in range(len(df) - 1, max(0, len(df) - 100), -1):
            if pd.isna(df['52W_High'].iloc[i]):
                continue

            high_val = float(df['High'].iloc[i])
            high_52w = float(df['52W_High'].iloc[i])

            if high_val >= high_52w * 0.995:
                new_highs.append({
                    'idx': i,
                    'date': df['Date'].iloc[i].strftime('%Y-%m-%d'),
                    'high': high_val
                })

        print(f"   Found {len(new_highs)} new highs")
        if new_highs:
            print(f"\n   Last 5 new highs:")
            for nh in new_highs[:5]:
                print(f"      {nh['date']}: ₹{nh['high']:.2f}")

        # For each new high, check Darvas criteria
        boxes_found = 0
        for idx, nh in enumerate(new_highs[:10]):
            print(f"\n   [{idx+1}] Testing high on {nh['date']} (₹{nh['high']:.2f}):")

            box_top_idx = nh['idx']
            box_top = nh['high']

            # Check 3-day rule
            if box_top_idx + 3 >= len(df):
                print(f"      ❌ Not enough data after this high (need 3+ days)")
                continue

            next_3_days = df.iloc[box_top_idx + 1 : box_top_idx + 4]
            if (next_3_days['High'] > box_top).any():
                exceeded_on = next_3_days[next_3_days['High'] > box_top]['Date'].iloc[0].strftime('%Y-%m-%d')
                print(f"      ❌ High exceeded in next 3 days (on {exceeded_on})")
                continue

            print(f"      ✅ Box top confirmed (3 days no new high)")

            # Try different consolidation periods
            found_valid = False
            for weeks in range(3, 9):
                consol_period = weeks * 5

                if box_top_idx + consol_period >= len(df):
                    continue

                consolidation_df = df.iloc[box_top_idx : box_top_idx + consol_period + 1]

                if len(consolidation_df) < 10:
                    continue

                box_high = box_top
                box_low = float(consolidation_df['Low'].min())
                box_range = ((box_high - box_low) / box_low) * 100
                touches = (consolidation_df['High'] >= box_high * 0.99).sum()

                range_ok = 4 <= box_range <= 12
                touches_ok = touches >= 2

                print(f"\n         {weeks}-week consolidation:")
                print(f"            Box: ₹{box_low:.2f} - ₹{box_high:.2f} (Range: {box_range:.2f}%)")
                print(f"            Rule 3 (Range 4-12%): {'✓' if range_ok else '✗ FAIL'}")
                print(f"            Touches: {touches}")
                print(f"            Rule 4 (Min 2 touches): {'✓' if touches_ok else '✗ FAIL'}")

                if not range_ok or not touches_ok:
                    continue

                # Check for breakout after consolidation
                after_consol_idx = box_top_idx + consol_period + 1
                if after_consol_idx < len(df):
                    search_end = min(after_consol_idx + 20, len(df))
                    after_df = df.iloc[after_consol_idx:search_end]

                    breakout_days = after_df[after_df['High'] > box_high]
                    if not breakout_days.empty:
                        breakout_idx = breakout_days.index[0]
                        breakout_date = df['Date'].iloc[breakout_idx].strftime('%Y-%m-%d')
                        breakout_high = float(df['High'].iloc[breakout_idx])
                        breakout_vol = int(df['Volume'].iloc[breakout_idx])

                        consol_avg_vol = consolidation_df['Volume'].mean()
                        vol_ma20 = df['Volume_MA20'].iloc[breakout_idx]

                        vol_ratio = breakout_vol / vol_ma20 if not pd.isna(vol_ma20) and vol_ma20 > 0 else 0
                        vol_expansion = breakout_vol / consol_avg_vol if consol_avg_vol > 0 else 0

                        print(f"\n            ✅ BREAKOUT FOUND on {breakout_date}:")
                        print(f"               Breakout High: ₹{breakout_high:.2f}")
                        print(f"               Breakout Volume: {breakout_vol:,}")
                        print(f"               Rule 5 (Vol 1.3x MA20): {'✓ PASS' if vol_ratio >= 1.3 else f'✗ FAIL ({vol_ratio:.2f}x)'}")
                        print(f"               Rule 6 (Vol expansion): {'✓ PASS' if vol_expansion >= 1.3 else f'✗ FAIL ({vol_expansion:.2f}x)'}")

                        # Check price confirmation
                        days_after = min(5, len(df) - breakout_idx - 1)
                        days_above = 0
                        if days_after > 0:
                            after_breakout_df = df.iloc[breakout_idx + 1 : breakout_idx + 1 + days_after]
                            days_above = (after_breakout_df['Close'] > box_high).sum()

                        print(f"               Rule 7 (Days above): {'✓ PASS' if days_above >= 1 else f'✗ FAIL ({days_above} days)'}")

                        found_valid = True
                        boxes_found += 1
                    else:
                        print(f"            ⚠️  No breakout yet (still consolidating)")
                        if after_consol_idx >= len(df) - 5:
                            print(f"               Status: Active box near current date")
                            found_valid = True
                            boxes_found += 1

                if found_valid:
                    break

            if not found_valid:
                print(f"      ❌ No valid box found for this high")

        print(f"\n{'='*40}")
        if boxes_found == 0:
            print(f"❌ SUMMARY: No valid Darvas boxes found")
        else:
            print(f"✅ SUMMARY: Found {boxes_found} valid box(es)")
        print(f"{'='*40}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    symbols = ['GPIL', 'MINDACORP', 'BOSCHLTD']

    print("="*80)
    print("Darvas Box Debugger V2 (Corrected Logic)")
    print("="*80)

    for symbol in symbols:
        debug_darvas_v2(symbol)

    print(f"\n{'='*80}")

if __name__ == '__main__':
    try:
        main()
        nse_fetcher.close()
        print('\n✅ Debug completed')
    except Exception as e:
        print(f'\n❌ Error: {e}')
        nse_fetcher.close()
