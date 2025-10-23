#!/usr/bin/env python3
"""
Test a single stock with the Darvas screener
"""

import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from screeners import detect_darvas_box, nse_fetcher

def test_stock(symbol):
    """Test a stock with detailed output"""
    print(f"\n{'='*80}")
    print(f"Testing: {symbol}")
    print(f"{'='*80}")

    result = detect_darvas_box(symbol)

    if result is None:
        print("❌ Stock did not pass pre-filters (market cap or debt-to-equity)")
        return

    if result.get('type') == 'no_box':
        print("❌ No valid Darvas box found for this stock")
        return

    # Display results
    print(f"\n✅ DARVAS BOX FOUND!")
    print(f"\n📊 Box Details:")
    print(f"   Status: {result['status']}")
    print(f"   Box High (TOP): ₹{result['box_high']:.2f}")
    print(f"   Box Low (BOTTOM): ₹{result['box_low']:.2f}")
    print(f"   Box Range: {result['box_range_percent']:.2f}%")
    print(f"   Resistance Touches: {result['resistance_touches']}")
    print(f"   Consolidation Days: {result['consolidation_days']}")
    print(f"   Formation Date: {result['formation_date']}")
    print(f"   Breakout Date: {result['breakout_date']}")

    print(f"\n📈 Current Status:")
    print(f"   Current Price: ₹{result['current_price']:.2f}")
    print(f"   52-Week High: ₹{result['week_52_high']:.2f}")
    print(f"   % from Box High: {result['price_to_box_high_percent']:.2f}%")

    print(f"\n📊 Breakout Analysis:")
    print(f"   Breakout Occurred: {'Yes' if result['is_breakout'] else 'No'}")
    print(f"   Breakout Price Target: ₹{result['breakout_price']:.2f}")

    print(f"\n🔊 Volume Analysis:")
    print(f"   Rule 5 - Volume 1.3x average: {'✓ PASS' if result['volume_confirmed'] else '✗ FAIL'}")
    print(f"   Rule 6 - Volume expansion: {'✓ PASS' if result['volume_expansion'] else '✗ FAIL'}")
    print(f"   Volume Ratio: {result['volume_ratio']:.2f}x")
    print(f"   Breakout Volume: {result['current_volume']:,}")
    print(f"   Average Volume (20-day): {result['avg_volume']:,}")

    print(f"\n✅ Price Confirmation:")
    print(f"   Rule 7 - Days above box: {result['days_above_box']}")

    print(f"\n💰 Risk/Reward:")
    print(f"   Risk-Reward Ratio: {result['risk_reward_ratio']:.2f}:1")

    print(f"\n📊 Rules Status:")
    rules_passed = []
    rules_failed = []

    # Check all rules
    if result['box_range_percent'] >= 4 and result['box_range_percent'] <= 12:
        rules_passed.append("Rule 3: Box range 4-12%")
    else:
        rules_failed.append("Rule 3: Box range 4-12%")

    if result['resistance_touches'] >= 2:
        rules_passed.append("Rule 4: Min 2 resistance touches")
    else:
        rules_failed.append("Rule 4: Min 2 resistance touches")

    if result['volume_confirmed']:
        rules_passed.append("Rule 5: Breakout volume 1.3x")
    else:
        rules_failed.append("Rule 5: Breakout volume 1.3x")

    if result['volume_expansion']:
        rules_passed.append("Rule 6: Volume expansion 1.3x")
    else:
        rules_failed.append("Rule 6: Volume expansion 1.3x")

    if result['days_above_box'] >= 1:
        rules_passed.append("Rule 7: Price confirmation 1+ day")
    else:
        rules_failed.append("Rule 7: Price confirmation 1+ day")

    if rules_passed:
        print(f"\n✓ PASSED:")
        for rule in rules_passed:
            print(f"   ✓ {rule}")

    if rules_failed:
        print(f"\n✗ FAILED:")
        for rule in rules_failed:
            print(f"   ✗ {rule}")

    # Final verdict
    print(f"\n{'='*80}")
    if result['status'] == 'buy':
        print("✅ VERDICT: BUY SIGNAL - Successful Darvas breakout!")
        print(f"   Box formed on {result['formation_date']}")
        print(f"   Breakout occurred on {result['breakout_date']}")
        print(f"   All Darvas rules were satisfied!")
        print(f"   Current price ₹{result['current_price']:.2f} is {result['price_to_box_high_percent']:.2f}% above box top")
    elif result['status'] == 'false_breakout':
        print("⚠️  VERDICT: FALSE BREAKOUT - Did NOT meet all volume/confirmation criteria")
        print(f"   Box formed on {result['formation_date']}, broke out on {result['breakout_date']}")
        print(f"   Failed volume or price confirmation tests")
    else:
        print("📊 VERDICT: CONSOLIDATING - Watching for breakout")
        print(f"   Box formed on {result['formation_date']}")
        print(f"   Waiting for breakout above ₹{result['box_high']:.2f}")
        print(f"   Current price: ₹{result['current_price']:.2f}")
    print(f"{'='*80}")

if __name__ == '__main__':
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'MRF'

    try:
        test_stock(symbol)
        nse_fetcher.close()
        print('\n✅ Testing completed')
    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        nse_fetcher.close()
