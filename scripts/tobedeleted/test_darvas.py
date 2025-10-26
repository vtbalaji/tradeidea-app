#!/usr/bin/env python3
"""
Test Nicolas Darvas Screener for specific stocks
Shows which rules are NOT satisfied for each stock
"""

import pandas as pd
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

def check_market_cap_filter(symbol, min_market_cap_cr=1200):
    """Check market cap requirement"""
    try:
        symbol_with_prefix = f"NS_{symbol}" if not symbol.startswith('NS_') else symbol
        doc_ref = db.collection('symbols').document(symbol_with_prefix)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            if 'fundamental' in data and data['fundamental']:
                market_cap = data['fundamental'].get('marketCap', 0)
                market_cap_cr = market_cap / 10_000_000

                if market_cap < min_market_cap_cr * 10_000_000:
                    return False, market_cap_cr, f"Market cap {market_cap_cr:.0f} Cr < {min_market_cap_cr} Cr required"
                return True, market_cap_cr, "✓ Market cap OK"

        return False, 0, "Market cap data not found"
    except Exception as e:
        return False, 0, f"Error: {str(e)}"

def check_debt_to_equity(symbol, max_debt_to_equity=1.0):
    """Check debt-to-equity requirement"""
    try:
        symbol_with_prefix = f"NS_{symbol}" if not symbol.startswith('NS_') else symbol
        doc_ref = db.collection('symbols').document(symbol_with_prefix)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            if 'fundamental' in data and data['fundamental']:
                debt_to_equity = data['fundamental'].get('debtToEquity', None)

                if debt_to_equity is None:
                    return False, None, "Debt-to-equity data not available"

                if debt_to_equity > max_debt_to_equity:
                    return False, debt_to_equity, f"Debt/Equity {debt_to_equity:.2f} > {max_debt_to_equity} max"

                return True, debt_to_equity, f"✓ Debt/Equity OK ({debt_to_equity:.2f})"

        return False, None, "Fundamental data not found"
    except Exception as e:
        return False, None, f"Error: {str(e)}"

def test_darvas_rules(symbol):
    """
    Test all Nicolas Darvas rules for a given symbol
    Returns detailed breakdown of which rules pass/fail
    """
    print(f"\n{'='*80}")
    print(f"Testing: {symbol}")
    print(f"{'='*80}")

    rules_status = {}

    # PRE-FILTER 1: Market Cap (>1200 Cr)
    passed, market_cap_cr, msg = check_market_cap_filter(symbol, min_market_cap_cr=1200)
    print(f"\n📊 Pre-Filter 1: Market Cap")
    print(f"   Status: {'✓ PASS' if passed else '✗ FAIL'}")
    print(f"   {msg}")
    rules_status['Pre-Filter 1: Market Cap'] = passed

    if not passed:
        print(f"\n❌ Stock failed market cap filter. Cannot proceed with other rules.")
        return rules_status

    # PRE-FILTER 2: Debt-to-Equity (<1.0)
    passed, debt_ratio, msg = check_debt_to_equity(symbol, max_debt_to_equity=1.0)
    print(f"\n📊 Pre-Filter 2: Debt-to-Equity")
    print(f"   Status: {'✓ PASS' if passed else '✗ FAIL'}")
    print(f"   {msg}")
    rules_status['Pre-Filter 2: Debt-to-Equity'] = passed

    if not passed:
        print(f"\n❌ Stock failed debt-to-equity filter. Cannot proceed with other rules.")
        return rules_status

    # Get price data
    try:
        df = nse_fetcher.get_data(symbol, days=300)

        if df.empty or len(df) < 260:
            print(f"\n❌ Insufficient data for {symbol}")
            return rules_status

        # Rename columns to uppercase
        df = df.rename(columns={
            'date': 'Date',
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Calculate 52-week high
        lookback_weeks = 52
        week_high_52 = df['High'].rolling(window=lookback_weeks * 5).max()
        current_price = float(df['Close'].iloc[-1])
        current_52w_high = float(week_high_52.iloc[-1])

        # RULE 1: Stock within 10% of 52-week high
        print(f"\n📊 Rule 1: Stock within 10% of 52-week high")
        distance_from_high = ((current_52w_high - current_price) / current_52w_high) * 100
        within_10_percent = current_price >= current_52w_high * 0.90
        print(f"   Current Price: ₹{current_price:.2f}")
        print(f"   52-Week High: ₹{current_52w_high:.2f}")
        print(f"   Distance from High: {distance_from_high:.2f}%")
        print(f"   Status: {'✓ PASS' if within_10_percent else '✗ FAIL'}")
        if not within_10_percent:
            print(f"   Reason: Price is {distance_from_high:.2f}% below 52-week high (must be within 10%)")
        rules_status['Rule 1: Within 10% of 52-week high'] = within_10_percent

        if not within_10_percent:
            print(f"\n❌ Stock not near 52-week high. Remaining rules not applicable.")
            return rules_status

        # Analyze consolidation patterns (RULE 2, 3, 4)
        recent_days = 60
        recent_df = df.tail(recent_days).copy()

        found_valid_box = False
        best_box = None

        print(f"\n📊 Rule 2, 3, 4: Consolidation Analysis (3-8 weeks)")
        print(f"   Testing different consolidation periods...")

        for weeks in range(3, 9):
            consolidation_period = weeks * 5
            if len(recent_df) < consolidation_period:
                continue

            consolidation_df = recent_df.tail(consolidation_period)
            box_high = float(consolidation_df['High'].max())
            box_low = float(consolidation_df['Low'].min())
            box_height = box_high - box_low
            box_range_percent = (box_height / box_low) * 100

            # Count touches of resistance
            touches = (consolidation_df['High'] >= box_high * 0.99).sum()

            print(f"\n   {weeks}-Week Consolidation:")
            print(f"      Box High: ₹{box_high:.2f}, Low: ₹{box_low:.2f}")
            print(f"      Box Range: {box_range_percent:.2f}%")
            print(f"      Resistance Touches: {touches}")

            # Rule 3: Box range 4-12%
            range_valid = 4 <= box_range_percent <= 12
            print(f"      Rule 3 (Range 4-12%): {'✓ PASS' if range_valid else '✗ FAIL'}")
            if not range_valid:
                if box_range_percent < 4:
                    print(f"         Reason: Range too tight ({box_range_percent:.2f}% < 4%)")
                else:
                    print(f"         Reason: Range too wide ({box_range_percent:.2f}% > 12%)")

            # Rule 4: Minimum 2 touches
            touches_valid = touches >= 2
            print(f"      Rule 4 (Min 2 touches): {'✓ PASS' if touches_valid else '✗ FAIL'}")
            if not touches_valid:
                print(f"         Reason: Only {touches} touch(es), need at least 2")

            if range_valid and touches_valid:
                found_valid_box = True
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
                print(f"      ✓ Valid box found!")

        # RULE 2: Consolidation period (captured above)
        rules_status['Rule 2: Consolidation 3-8 weeks'] = found_valid_box

        if found_valid_box:
            print(f"\n   ✓ Best Box Found: {best_box['weeks']} weeks")
            print(f"      Range: {best_box['range_percent']:.2f}%")
            print(f"      Touches: {best_box['touches']}")
            rules_status['Rule 3: Box range 4-12%'] = True
            rules_status['Rule 4: Min 2 touches'] = True
        else:
            print(f"\n   ✗ No valid consolidation box found")
            rules_status['Rule 3: Box range 4-12%'] = False
            rules_status['Rule 4: Min 2 touches'] = False
            print(f"\n❌ No valid box pattern. Breakout rules not applicable.")
            return rules_status

        # Volume analysis (RULE 5, 6, 7)
        consolidation_df = best_box['df']
        box_high = best_box['high']

        volume_ma20 = df['Volume'].rolling(window=20).mean()
        current_volume = int(recent_df['Volume'].iloc[-1])
        avg_volume = float(volume_ma20.iloc[-1]) if not pd.isna(volume_ma20.iloc[-1]) else 0
        consolidation_avg_volume = consolidation_df['Volume'].mean()

        # Check if breakout occurred
        breakout_threshold = 0.005
        breakout_price = box_high * (1 + breakout_threshold)
        is_breakout = current_price >= breakout_price

        print(f"\n📊 Breakout Analysis")
        print(f"   Box High: ₹{box_high:.2f}")
        print(f"   Breakout Price: ₹{breakout_price:.2f}")
        print(f"   Current Price: ₹{current_price:.2f}")
        print(f"   Is Breakout: {'Yes' if is_breakout else 'No'}")

        if is_breakout:
            # RULE 5: Breakout volume 1.3x average
            print(f"\n📊 Rule 5: Breakout volume 1.3x average")
            volume_confirmed = current_volume > avg_volume * 1.3 if avg_volume > 0 else False
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 0
            print(f"   Current Volume: {current_volume:,}")
            print(f"   Average Volume (20-day): {int(avg_volume):,}")
            print(f"   Volume Ratio: {volume_ratio:.2f}x")
            print(f"   Status: {'✓ PASS' if volume_confirmed else '✗ FAIL'}")
            if not volume_confirmed:
                print(f"   Reason: Volume {volume_ratio:.2f}x < 1.3x required")
            rules_status['Rule 5: Breakout volume 1.3x'] = volume_confirmed

            # RULE 6: Volume expansion 1.3x consolidation average
            print(f"\n📊 Rule 6: Volume expansion 1.3x consolidation average")
            volume_expansion = current_volume > consolidation_avg_volume * 1.3
            expansion_ratio = current_volume / consolidation_avg_volume if consolidation_avg_volume > 0 else 0
            print(f"   Current Volume: {current_volume:,}")
            print(f"   Consolidation Avg Volume: {int(consolidation_avg_volume):,}")
            print(f"   Expansion Ratio: {expansion_ratio:.2f}x")
            print(f"   Status: {'✓ PASS' if volume_expansion else '✗ FAIL'}")
            if not volume_expansion:
                print(f"   Reason: Volume expansion {expansion_ratio:.2f}x < 1.3x required")
            rules_status['Rule 6: Volume expansion 1.3x'] = volume_expansion

            # RULE 7: Price confirmation (1+ day above box)
            print(f"\n📊 Rule 7: Price confirmation (1+ day above box)")
            days_above_box = 0
            if len(recent_df) >= 3:
                last_3_days = recent_df.tail(3)
                days_above_box = (last_3_days['Close'] > box_high).sum()

            price_confirmed = days_above_box >= 1
            print(f"   Days Above Box: {days_above_box}")
            print(f"   Status: {'✓ PASS' if price_confirmed else '✗ FAIL'}")
            if not price_confirmed:
                print(f"   Reason: Price needs to stay above box for at least 1 day")
            rules_status['Rule 7: Price confirmation 1+ day'] = price_confirmed
        else:
            print(f"\n   No breakout yet - monitoring for breakout")
            rules_status['Rule 5: Breakout volume 1.3x'] = False
            rules_status['Rule 6: Volume expansion 1.3x'] = False
            rules_status['Rule 7: Price confirmation 1+ day'] = False

    except Exception as e:
        print(f"\n❌ Error analyzing {symbol}: {str(e)}")
        import traceback
        traceback.print_exc()

    return rules_status

def main():
    """Test Nicolas Darvas screener on specific stocks"""
    # Test stocks
    test_symbols = ['GPIL', 'MINDACORP', 'BOSCHLTD']

    print("="*80)
    print("Nicolas Darvas Screener - Rule Testing")
    print("="*80)
    print("\nTesting stocks:", ", ".join(test_symbols))

    all_results = {}

    for symbol in test_symbols:
        results = test_darvas_rules(symbol)
        all_results[symbol] = results

    # Summary
    print(f"\n\n{'='*80}")
    print("SUMMARY - Rules Not Satisfied")
    print(f"{'='*80}")

    for symbol, rules in all_results.items():
        print(f"\n{symbol}:")
        failed_rules = [rule for rule, passed in rules.items() if not passed]
        if failed_rules:
            for rule in failed_rules:
                print(f"   ✗ {rule}")
        else:
            print(f"   ✓ All rules satisfied!")

    print(f"\n{'='*80}")

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
