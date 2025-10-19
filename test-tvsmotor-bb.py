#!/usr/bin/env python3
"""
Test Bollinger Bands calculation for TVSMOTOR
"""

import yfinance as yf
import pandas as pd
import numpy as np
from ta.volatility import BollingerBands
from datetime import datetime, timedelta

symbol = 'TVSMOTOR'

print('=' * 80)
print(f'📊 BOLLINGER BANDS VERIFICATION - {symbol}')
print('=' * 80)

# Fetch historical data
ticker = yf.Ticker(f'{symbol}.NS')
end_date = datetime.now()
start_date = end_date - timedelta(days=730)
df = ticker.history(start=start_date, end=end_date)

if df.empty:
    print('❌ No historical data available')
    exit(1)

print(f'\n✅ Fetched {len(df)} rows of data')

# Calculate Bollinger Bands using ta library (same as production code)
bb = BollingerBands(close=df['Close'], window=20, window_dev=2)
bb_upper = bb.bollinger_hband()
bb_middle = bb.bollinger_mavg()
bb_lower = bb.bollinger_lband()

# Get latest values
latest_close = float(df['Close'].iloc[-1])
latest_upper = float(bb_upper.iloc[-1])
latest_middle = float(bb_middle.iloc[-1])
latest_lower = float(bb_lower.iloc[-1])

# Manual calculation for verification
sma20 = df['Close'].rolling(window=20).mean()
std20 = df['Close'].rolling(window=20).std()
manual_upper = sma20 + (std20 * 2)
manual_middle = sma20
manual_lower = sma20 - (std20 * 2)

manual_latest_upper = float(manual_upper.iloc[-1])
manual_latest_middle = float(manual_middle.iloc[-1])
manual_latest_lower = float(manual_lower.iloc[-1])

print(f'\n📍 CURRENT DATA:')
print(f'   Last Close: ₹{latest_close:.2f}')
print(f'   Date: {df.index[-1].strftime("%Y-%m-%d %H:%M:%S")}')

print(f'\n📊 BOLLINGER BANDS (ta library):')
print(f'   Upper Band: ₹{latest_upper:.2f}')
print(f'   Middle Band: ₹{latest_middle:.2f}')
print(f'   Lower Band: ₹{latest_lower:.2f}')

print(f'\n🔍 MANUAL CALCULATION (verification):')
print(f'   Upper Band: ₹{manual_latest_upper:.2f}')
print(f'   Middle Band: ₹{manual_latest_middle:.2f}')
print(f'   Lower Band: ₹{manual_latest_lower:.2f}')

print(f'\n📈 POSITION ANALYSIS:')
print(f'   Price vs Upper Band: ₹{latest_close - latest_upper:+.2f}')
if latest_close > latest_upper:
    print(f'   ⚠️  OUTSIDE (ABOVE) UPPER BAND')
elif latest_close < latest_lower:
    print(f'   ⚠️  OUTSIDE (BELOW) LOWER BAND')
else:
    print(f'   ✓ WITHIN BANDS')

# Show last 5 days for context
print(f'\n📅 LAST 5 DAYS:')
print(f'{"Date":<12} {"Close":>10} {"BB Upper":>10} {"BB Middle":>10} {"BB Lower":>10} {"Position"}')
print('-' * 80)
for i in range(-5, 0):
    date = df.index[i].strftime('%Y-%m-%d')
    close = df['Close'].iloc[i]
    upper = bb_upper.iloc[i]
    middle = bb_middle.iloc[i]
    lower = bb_lower.iloc[i]

    if close > upper:
        position = 'ABOVE ⬆️'
    elif close < lower:
        position = 'BELOW ⬇️'
    else:
        position = 'WITHIN ✓'

    print(f'{date:<12} ₹{close:>9.2f} ₹{upper:>9.2f} ₹{middle:>9.2f} ₹{lower:>9.2f} {position}')

# Calculate band width
band_width = ((latest_upper - latest_lower) / latest_middle) * 100
print(f'\n📏 BAND STATISTICS:')
print(f'   Band Width: {band_width:.2f}%')
print(f'   Price Position in Band: {((latest_close - latest_lower) / (latest_upper - latest_lower)) * 100:.1f}%')

print('\n' + '=' * 80)
