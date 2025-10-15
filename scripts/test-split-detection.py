#!/usr/bin/env python3
"""
Test script for automated split detection

This script tests the detect_corporate_action() function
by creating synthetic data with known splits/bonuses
"""

import sys
import os
import pandas as pd
from datetime import datetime, timedelta

# Add path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import analyzer functions
import importlib.util
spec = importlib.util.spec_from_file_location("analyzer", os.path.join(current_dir, "analyze-symbols-duckdb.py"))
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)

def create_test_data_with_split(split_type):
    """Create synthetic data with a split on the LAST day"""
    dates = pd.date_range(end=datetime.now(), periods=10, freq='D')

    if split_type == '1:2':
        # 1:2 split - price drops by 50% on LAST day
        prices = [1000, 1010, 1020, 1015, 1005, 1000, 995, 1000, 1005, 502.5]  # Last day split
    elif split_type == '1:5':
        # 1:5 split - price drops by 80% on LAST day
        prices = [1000, 1010, 1020, 1015, 1005, 1000, 995, 1000, 1005, 201]  # Last day split
    elif split_type == '1:1_bonus':
        # 1:1 bonus - price drops by 50% on LAST day
        prices = [1000, 1010, 1020, 1015, 1005, 1000, 995, 1000, 1005, 502.5]  # Last day bonus
    elif split_type == '1:3_bonus':
        # 1:3 bonus - price drops by 25% on LAST day
        prices = [1000, 1010, 1020, 1015, 1005, 1000, 995, 1000, 1000, 750]  # Last day bonus
    else:
        # No split - normal price movement
        prices = [1000, 1010, 1020, 1015, 1005, 1000, 995, 990, 985, 980]

    df = pd.DataFrame({
        'Open': prices,
        'High': [p * 1.02 for p in prices],
        'Low': [p * 0.98 for p in prices],
        'Close': prices,
        'Volume': [1000000] * 10
    }, index=dates)

    return df

def test_detection():
    """Test split detection"""
    print('='*70)
    print('🧪 Testing Automated Split Detection')
    print('='*70)

    # Test 1: 1:2 split
    print('\n📊 Test 1: 1:2 Split (50% price drop)')
    print('   Expected: Detect as 1:2 split')
    df = create_test_data_with_split('1:2')
    print(f'   Last 2 prices: ₹{df["Close"].iloc[-2]:.2f} → ₹{df["Close"].iloc[-1]:.2f}')
    print(f'   Change: {((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2] * 100):.1f}%')
    result = analyzer.detect_corporate_action(df, 'TEST')
    if result:
        print(f'✅ DETECTED: {result.get("splitType") or result.get("bonusType")}')
        print(f'   Price: ₹{result["oldPrice"]:.2f} → ₹{result["newPrice"]:.2f} ({result["priceChange"]:+.1f}%)')
        print(f'   Ratio: {result["ratio"]:.4f}')
        print(f'   Confidence: {result["confidence"]}')
    else:
        print('❌ NOT DETECTED')

    # Test 2: 1:5 split
    print('\n📊 Test 2: 1:5 Split (80% price drop)')
    print('   Expected: Detect as 1:5 split')
    df = create_test_data_with_split('1:5')
    print(f'   Last 2 prices: ₹{df["Close"].iloc[-2]:.2f} → ₹{df["Close"].iloc[-1]:.2f}')
    print(f'   Change: {((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2] * 100):.1f}%')
    result = analyzer.detect_corporate_action(df, 'TEST')
    if result:
        print(f'✅ DETECTED: {result.get("splitType") or result.get("bonusType")}')
        print(f'   Price: ₹{result["oldPrice"]:.2f} → ₹{result["newPrice"]:.2f} ({result["priceChange"]:+.1f}%)')
        print(f'   Ratio: {result["ratio"]:.4f}')
        print(f'   Confidence: {result["confidence"]}')
    else:
        print('❌ NOT DETECTED')

    # Test 3: 1:3 bonus
    print('\n📊 Test 3: 1:3 Bonus (25% price drop)')
    print('   Expected: Detect as 1:3 bonus')
    df = create_test_data_with_split('1:3_bonus')
    print(f'   Last 2 prices: ₹{df["Close"].iloc[-2]:.2f} → ₹{df["Close"].iloc[-1]:.2f}')
    print(f'   Change: {((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2] * 100):.1f}%')
    result = analyzer.detect_corporate_action(df, 'TEST')
    if result:
        print(f'✅ DETECTED: {result.get("splitType") or result.get("bonusType")}')
        print(f'   Price: ₹{result["oldPrice"]:.2f} → ₹{result["newPrice"]:.2f} ({result["priceChange"]:+.1f}%)')
        print(f'   Ratio: {result["ratio"]:.4f}')
        print(f'   Confidence: {result["confidence"]}')
    else:
        print('❌ NOT DETECTED')

    # Test 4: No split
    print('\n📊 Test 4: Normal Price Movement (no split)')
    print('   Expected: No detection')
    df = create_test_data_with_split('none')
    print(f'   Last 2 prices: ₹{df["Close"].iloc[-2]:.2f} → ₹{df["Close"].iloc[-1]:.2f}')
    print(f'   Change: {((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2] * 100):.1f}%')
    result = analyzer.detect_corporate_action(df, 'TEST')
    if result:
        print(f'❌ FALSE POSITIVE: {result.get("splitType") or result.get("bonusType")}')
    else:
        print('✅ CORRECTLY IDENTIFIED: No split')

    print('\n' + '='*70)
    print('✅ Detection tests complete')
    print('='*70)

if __name__ == '__main__':
    test_detection()
