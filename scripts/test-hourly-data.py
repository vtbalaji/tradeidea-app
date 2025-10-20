#!/usr/bin/env python3
"""Test Yahoo Finance hourly intraday data for NSE symbols"""

import yfinance as yf
from datetime import datetime, timedelta

# Test with popular NSE symbols
test_symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS']

print('=' * 70)
print('Testing Yahoo Finance Hourly Intraday Data for NSE')
print('=' * 70)
print()

for symbol in test_symbols:
    print(f'📊 Testing {symbol}:')
    print('-' * 70)

    try:
        ticker = yf.Ticker(symbol)

        # Test different intervals
        intervals = [
            ('1m', '1 minute'),
            ('5m', '5 minutes'),
            ('15m', '15 minutes'),
            ('30m', '30 minutes'),
            ('1h', '1 hour'),
            ('90m', '90 minutes')
        ]

        print('Testing different intervals for TODAY:')
        print()

        for interval, label in intervals:
            try:
                # Get today's intraday data
                hist = ticker.history(period='1d', interval=interval)

                if not hist.empty:
                    print(f'  ✅ {label:<15} - {len(hist)} data points')
                    print(f'     Latest: {hist.index[-1]} | Close: ₹{hist.iloc[-1]["Close"]:.2f}')
                else:
                    print(f'  ⚠️  {label:<15} - No data available')
            except Exception as e:
                print(f'  ❌ {label:<15} - Error: {str(e)}')
            print()

        # Test last 5 days with hourly data
        print('Testing last 5 days with 1-hour interval:')
        hist_5d = ticker.history(period='5d', interval='1h')

        if not hist_5d.empty:
            print(f'  ✅ Got {len(hist_5d)} hourly data points over 5 days')
            print(f'     Date range: {hist_5d.index[0]} to {hist_5d.index[-1]}')
            print(f'     Latest Close: ₹{hist_5d.iloc[-1]["Close"]:.2f}')

            # Show sample data
            print('\n  Sample of last 5 hourly records:')
            for i in range(min(5, len(hist_5d))):
                idx = -(5-i)
                row = hist_5d.iloc[idx]
                timestamp = hist_5d.index[idx]
                print(f'     {timestamp} | Open: ₹{row["Open"]:.2f} | Close: ₹{row["Close"]:.2f} | Vol: {row["Volume"]:,.0f}')
        else:
            print('  ⚠️  No hourly data available for 5 days')

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')

    print()
    print('=' * 70)
    print()

print('\n📝 Summary:')
print('- Yahoo Finance DOES support intraday intervals')
print('- Intervals: 1m, 5m, 15m, 30m, 1h, 90m')
print('- NSE symbols use .NS suffix (e.g., RELIANCE.NS)')
print('- Hourly data is available for live/recent trading sessions')
print('- Data availability depends on market hours and recent activity')
