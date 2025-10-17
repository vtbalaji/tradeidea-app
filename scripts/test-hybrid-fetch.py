#!/usr/bin/env python3
"""Test hybrid fetcher with problematic symbols"""

import sys
import os

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

# Test symbols that fail with jugaad-data
test_symbols = ['COFFEEDAY', 'ABAN', 'RCOM', 'RELIANCE']

print('🧪 Testing Hybrid Fetcher (jugaad-data + Yahoo Finance fallback)\n')
print('=' * 70)

fetcher = NSEDataFetcher()

success_count = 0
fail_count = 0

for symbol in test_symbols:
    print(f'\n[{test_symbols.index(symbol)+1}/{len(test_symbols)}] {symbol}')
    print('-' * 70)

    if fetcher.fetch_and_store(symbol):
        success_count += 1
    else:
        fail_count += 1

print('\n' + '=' * 70)
print('📊 Test Results')
print('=' * 70)
print(f'✅ Success: {success_count}')
print(f'❌ Failed: {fail_count}')

# Show data
print('\n📈 Fetched Data:')
for symbol in test_symbols:
    try:
        df = fetcher.get_data(symbol, days=3)
        if not df.empty:
            latest = df.iloc[-1]
            print(f'  {symbol}: Latest = ₹{latest["close"]:.2f} ({latest["date"]})')
    except:
        pass

fetcher.close()
print('\n✅ Test completed')
