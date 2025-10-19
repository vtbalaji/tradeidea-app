#!/usr/bin/env python3
"""
Manual Bollinger Bands calculation verification
"""
import pandas as pd
import numpy as np

# From your screenshot, TVSMOTOR data:
last_price = 3654.00
bollinger_upper = 3612.07  # From your screenshot
bollinger_middle = 3496.68  # This is SMA20
sma20 = 3496.68

print('=' * 80)
print('📊 BOLLINGER BANDS VERIFICATION - TVSMOTOR')
print('=' * 80)

print(f'\n📍 CURRENT DATA (from screenshot):')
print(f'   Last Price: ₹{last_price:.2f}')
print(f'   Bollinger Upper: ₹{bollinger_upper:.2f}')
print(f'   Bollinger Middle (SMA20): ₹{bollinger_middle:.2f}')

print(f'\n🔍 ANALYSIS:')
print(f'   Price vs Upper Band: ₹{last_price - bollinger_upper:+.2f}')
print(f'   Difference: ₹{abs(last_price - bollinger_upper):.2f}')

if last_price > bollinger_upper:
    print(f'\n⚠️  VERDICT: Price is OUTSIDE (ABOVE) the Upper Bollinger Band')
    print(f'   The price at ₹{last_price:.2f} is ABOVE the upper band at ₹{bollinger_upper:.2f}')
    print(f'   This indicates the stock is overbought or in a strong uptrend')
else:
    print(f'\n✓ VERDICT: Price is WITHIN the Bollinger Bands')

# Calculate what the upper band SHOULD be based on the formula
# Upper Band = SMA20 + (2 * Standard Deviation)
# We can reverse calculate the standard deviation used
std_dev_used = (bollinger_upper - bollinger_middle) / 2
print(f'\n📐 CALCULATED VALUES:')
print(f'   Standard Deviation used: ₹{std_dev_used:.2f}')
print(f'   Formula: Upper Band = SMA20 + (2 × σ)')
print(f'   Formula: {bollinger_middle:.2f} + (2 × {std_dev_used:.2f}) = {bollinger_upper:.2f}')

# Bollinger Lower should be
bollinger_lower_calculated = bollinger_middle - (2 * std_dev_used)
print(f'   Calculated Lower Band: ₹{bollinger_lower_calculated:.2f}')
print(f'   (This should match bollingerLower from your data)')

print('\n' + '=' * 80)
print('🎯 CONCLUSION:')
print('=' * 80)
print(f'Price ₹{last_price:.2f} is {"ABOVE" if last_price > bollinger_upper else "BELOW" if last_price < bollinger_lower_calculated else "WITHIN"} the Bollinger Bands')
print(f'Upper Band: ₹{bollinger_upper:.2f}')
print(f'Lower Band: ₹{bollinger_lower_calculated:.2f}')
print('=' * 80)
