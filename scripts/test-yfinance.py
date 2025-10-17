#!/usr/bin/env python3
"""Test Yahoo Finance with problematic symbols"""

import yfinance as yf
from datetime import datetime, timedelta

# Test symbols that fail with jugaad-data
test_symbols = ['COFFEEDAY.NS', 'ABAN.NS', 'RCOM.NS', 'RELIANCE.NS']

print('Testing Yahoo Finance data fetch...\n')

for symbol in test_symbols:
    print(f'📊 Testing {symbol}:')
    try:
        ticker = yf.Ticker(symbol)

        # Get last 5 days of data
        hist = ticker.history(period='5d')

        if not hist.empty:
            latest = hist.iloc[-1]
            print(f'  ✅ Success!')
            print(f'     Date: {hist.index[-1].date()}')
            print(f'     Close: ₹{latest["Close"]:.2f}')
            print(f'     Volume: {latest["Volume"]:,.0f}')
        else:
            print(f'  ⚠️  No data available')

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')

    print()
