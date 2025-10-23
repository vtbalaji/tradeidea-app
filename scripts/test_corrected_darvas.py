#!/usr/bin/env python3
"""
Test the CORRECTED Nicolas Darvas screener
Uses the updated detect_darvas_box function from screeners.py
"""

import sys
import os

# Add paths for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

# Import the screener module which has the corrected function
from screeners import detect_darvas_box, nse_fetcher

def test_stock(symbol):
    """Test a stock with the corrected Darvas box detector"""
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
    print(f"   Box High: ₹{result['box_high']:.2f}")
    print(f"   Box Low: ₹{result['box_low']:.2f}")
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
    print(f"   Average Volume: {result['avg_volume']:,}")

    print(f"\n✅ Price Confirmation:")
    print(f"   Rule 7 - Days above box: {result['days_above_box']}")

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
    if result['status'] == 'broken':
        print("✅ VERDICT: This stock had a SUCCESSFUL Darvas breakout!")
        print(f"   The box was formed around {result['formation_date']}")
        print(f"   Breakout occurred on {result['breakout_date']}")
        print(f"   All Darvas rules were satisfied!")
    elif result['status'] == 'false_breakout':
        print("⚠️  VERDICT: Breakout occurred but did NOT meet all volume/confirmation criteria")
    else:
        print("📊 VERDICT: Stock is currently consolidating (active box)")
    print(f"{'='*80}")

def main():
    """Test the corrected Darvas screener on the three stocks"""
    test_symbols = ['GPIL', 'MINDACORP', 'BOSCHLTD']

    print("="*80)
    print("CORRECTED Nicolas Darvas Screener Test")
    print("Testing the new backward-looking algorithm")
    print("="*80)

    for symbol in test_symbols:
        test_stock(symbol)

    print(f"\n\n{'='*80}")
    print("Test Complete!")
    print(f"{'='*80}")

if __name__ == '__main__':
    try:
        main()
        nse_fetcher.close()
        print('\n✅ Testing completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Testing failed: {str(e)}')
        import traceback
        traceback.print_exc()
        nse_fetcher.close()
        sys.exit(1)
