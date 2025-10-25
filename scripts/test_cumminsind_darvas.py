#!/usr/bin/env python3
"""
Darvas Box Analysis for CUMMINSIND
"""

import pandas as pd
import sys
import os

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

nse_fetcher = NSEDataFetcher()

def analyze_box_formation(symbol, user_ath_before_box):
    print(f"\n{'='*80}")
    print(f"Detailed Analysis: {symbol}")
    print(f"User reported ATH before box: ₹{user_ath_before_box}")
    print(f"{'='*80}")

    try:
        df = nse_fetcher.get_data(symbol, days=300)

        if df.empty:
            print(f"❌ No data for {symbol}")
            return

        df = df.rename(columns={
            'date': 'Date',
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })

        df['52W_High'] = df['High'].rolling(window=52 * 5).max()

        current_price = float(df['Close'].iloc[-1])
        current_52w_high = float(df['52W_High'].iloc[-1])

        print(f"\n📊 Current Status:")
        print(f"   Current Price: ₹{current_price:.2f}")
        print(f"   52-Week High: ₹{current_52w_high:.2f}")
        print(f"   User ATH: ₹{user_ath_before_box}")

        # Find when the user's ATH was made
        ath_matches = df[df['High'] >= user_ath_before_box * 0.99]
        if not ath_matches.empty:
            last_ath_date = ath_matches['Date'].iloc[-1]
            last_ath_price = ath_matches['High'].iloc[-1]
            days_since_ath = len(df) - ath_matches.index[-1] - 1
            print(f"\n📅 When was User ATH (₹{user_ath_before_box}) reached?")
            print(f"   Last touch: {last_ath_date.strftime('%Y-%m-%d')} (₹{last_ath_price:.2f})")
            print(f"   Days ago: {days_since_ath}")

        # Check if there are highs ABOVE user's ATH
        higher_highs = df[df['High'] > user_ath_before_box]
        if not higher_highs.empty:
            print(f"\n⚠️  FOUND HIGHS ABOVE USER ATH!")
            print(f"   Number of days with highs > ₹{user_ath_before_box}: {len(higher_highs)}")
            print(f"   First occurrence: {higher_highs['Date'].iloc[0].strftime('%Y-%m-%d')} (₹{higher_highs['High'].iloc[0]:.2f})")
            print(f"   Highest: {higher_highs['High'].max():.2f}")
            print(f"\n   Last 5 occurrences:")
            for idx in higher_highs.tail(5).index:
                row = df.loc[idx]
                print(f"      {row['Date'].strftime('%Y-%m-%d')}: High=₹{row['High']:.2f}, Close=₹{row['Close']:.2f}, Vol={int(row['Volume']):,}")

        # Analyze recent 60 days
        recent_df = df.tail(60).copy()
        print(f"\n📊 Last 60 Days Analysis (Box Detection Period):")
        print(f"   Period: {recent_df['Date'].iloc[0].strftime('%Y-%m-%d')} to {recent_df['Date'].iloc[-1].strftime('%Y-%m-%d')}")
        print(f"   Highest: ₹{recent_df['High'].max():.2f}")
        print(f"   Lowest: ₹{recent_df['Low'].min():.2f}")
        print(f"   Range: {((recent_df['High'].max() - recent_df['Low'].min()) / recent_df['Low'].min() * 100):.2f}%")

        # Test different consolidation periods
        print(f"\n📊 Box Detection (3-8 week periods):")
        for weeks in range(3, 9):
            consolidation_period = weeks * 5
            if len(recent_df) < consolidation_period:
                continue

            consolidation_df = recent_df.tail(consolidation_period)
            box_high = float(consolidation_df['High'].max())
            box_low = float(consolidation_df['Low'].min())
            box_range_percent = ((box_high - box_low) / box_low) * 100
            touches = (consolidation_df['High'] >= box_high * 0.99).sum()

            box_high_date = consolidation_df[consolidation_df['High'] == box_high]['Date'].iloc[0]

            print(f"\n   {weeks}-Week Box:")
            print(f"      Period: {consolidation_df['Date'].iloc[0].strftime('%Y-%m-%d')} to {consolidation_df['Date'].iloc[-1].strftime('%Y-%m-%d')}")
            print(f"      Box High: ₹{box_high:.2f} (made on {box_high_date.strftime('%Y-%m-%d')})")
            print(f"      Box Low: ₹{box_low:.2f}")
            print(f"      Range: {box_range_percent:.2f}% {'✓' if 4 <= box_range_percent <= 12 else '✗'}")
            print(f"      Touches: {touches} {'✓' if touches >= 2 else '✗'}")

            if box_high > user_ath_before_box:
                print(f"      ⚠️  Box High (₹{box_high:.2f}) > User ATH (₹{user_ath_before_box:.2f})!")
                print(f"      This means stock already broke above your ATH!")

            if 4 <= box_range_percent <= 12 and touches >= 2:
                print(f"      ✅ Valid Darvas Box")
                print(f"\n      Recent price action in this box:")
                for idx in consolidation_df.tail(10).index:
                    row = df.loc[idx]
                    position = "Above" if row['Close'] > box_low + (box_high - box_low) * 0.5 else "Below"
                    print(f"         {row['Date'].strftime('%Y-%m-%d')}: Close=₹{row['Close']:.2f} ({position} mid-box)")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    try:
        # Test CUMMINSIND with ATH around 4150 (before recent consolidation)
        analyze_box_formation('CUMMINSIND', 4150)

        nse_fetcher.close()
        print('\n✅ Analysis completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Analysis failed: {str(e)}')
        import traceback
        traceback.print_exc()
        nse_fetcher.close()
        sys.exit(1)
