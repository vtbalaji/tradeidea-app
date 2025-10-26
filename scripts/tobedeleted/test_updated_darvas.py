#!/usr/bin/env python3
"""
Test updated Darvas Box detection for CUMMINSIND
"""

import sys
import os

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

# Import the screeners module
import screeners

# Initialize NSE data fetcher (it's already initialized in screeners module)
from screeners import nse_fetcher, detect_darvas_box

result = detect_darvas_box('CUMMINSIND')

if result and result.get('type') == 'darvas_box':
    print(f"✅ CUMMINSIND Darvas Box Detected:")
    print(f"   Status: {result['status']}")
    print(f"   Box High: ₹{result['box_high']:.2f}")
    print(f"   Box Low: ₹{result['box_low']:.2f}")
    print(f"   Box Range: {result['box_range_percent']:.2f}%")
    print(f"   Current Price: ₹{result['current_price']:.2f}")
    print(f"   Formation Date: {result['formation_date']}")
    print(f"   Breakout Date: {result['breakout_date']}")
    print(f"   Consolidation Days: {result['consolidation_days']}")
    print(f"   Resistance Touches: {result['resistance_touches']}")
    print(f"   Volume Ratio: {result['volume_ratio']:.2f}x")
    print(f"   Days Above Box: {result['days_above_box']}")
    print(f"   52W High: ₹{result['week_52_high']:.2f}")
    print(f"   Breakout %: {result['price_to_box_high_percent']:.2f}%")
else:
    print(f"Result: {result}")

nse_fetcher.close()
