#!/usr/bin/env python3
"""
Adjust Historical Stock Split/Bonus in DuckDB

This script adjusts historical price and volume data in DuckDB for past corporate actions
that occurred long ago. Use this when you discover a split happened in the past and
historical data needs correction.

Usage:
    python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus
    python3 scripts/adjust-historical-split.py WIPRO 2019-07-18 1:3 split
    python3 scripts/adjust-historical-split.py TCS 2022-09-16 1:1 bonus

Arguments:
    symbol      - Stock symbol (e.g., RELIANCE)
    ex_date     - Ex-date when split/bonus took effect (YYYY-MM-DD)
    ratio       - Split/bonus ratio (e.g., 1:2, 1:3, 1:1)
    action_type - Type: 'split' or 'bonus'

How it works:
    1. Fetches all historical data for symbol from DuckDB
    2. Identifies data BEFORE the ex-date
    3. Adjusts prices and volumes based on ratio
    4. Updates DuckDB with corrected data
    5. Creates backup before making changes

Adjustment Logic:
    Split 1:2 (1 share becomes 2):
        - Old price: ₹2,000 → New price: ₹1,000 (divide by 2)
        - Old volume: 1000 → New volume: 2000 (multiply by 2)
        - Old quantity: 100 shares → New quantity: 200 shares

    Bonus 1:1 (1 free share for every 1 held):
        - Old price: ₹2,000 → New price: ₹1,000 (divide by 2)
        - Old volume: 1000 → New volume: 2000 (multiply by 2)
        - Old quantity: 100 shares → New quantity: 200 shares
"""

import sys
import os
from datetime import datetime
import duckdb

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

def parse_ratio(ratio_str):
    """
    Parse ratio string (e.g., '1:2', '1:3') and return multiplier

    Examples:
        1:2 split → 1 becomes 2 → multiplier = 2
        1:3 split → 1 becomes 3 → multiplier = 3
        1:1 bonus → 1 + 1 = 2 → multiplier = 2
    """
    parts = ratio_str.split(':')
    if len(parts) != 2:
        raise ValueError(f"Invalid ratio format: {ratio_str}. Expected format: 1:2")

    old_shares = int(parts[0])
    new_shares = int(parts[1])

    # Total shares after action = old + new (for bonus) or just new (for split)
    multiplier = (old_shares + new_shares) / old_shares

    return multiplier

def adjust_historical_data(symbol, ex_date_str, ratio_str, action_type):
    """
    Adjust historical data in DuckDB for a past corporate action

    Args:
        symbol: Stock symbol (e.g., 'RELIANCE')
        ex_date_str: Ex-date in YYYY-MM-DD format
        ratio_str: Ratio like '1:2' or '1:1'
        action_type: 'split' or 'bonus'
    """
    print('='*70)
    print(f'🔧 Historical Corporate Action Adjustment')
    print('='*70)
    print(f'Symbol: {symbol}')
    print(f'Ex-Date: {ex_date_str}')
    print(f'Ratio: {ratio_str}')
    print(f'Type: {action_type}')
    print('='*70)

    # Parse ex-date
    try:
        ex_date = datetime.strptime(ex_date_str, '%Y-%m-%d')
    except ValueError:
        print(f'❌ Invalid date format: {ex_date_str}. Expected: YYYY-MM-DD')
        sys.exit(1)

    # Parse ratio
    try:
        multiplier = parse_ratio(ratio_str)
        price_multiplier = 1 / multiplier  # Prices get divided
        volume_multiplier = multiplier      # Volumes get multiplied
    except ValueError as e:
        print(f'❌ {e}')
        sys.exit(1)

    print(f'\n📊 Adjustment Multipliers:')
    print(f'  Price Multiplier: {price_multiplier:.4f} (prices will be DIVIDED)')
    print(f'  Volume Multiplier: {volume_multiplier:.4f} (volumes will be MULTIPLIED)')

    # Connect to DuckDB
    db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')

    if not os.path.exists(db_path):
        print(f'\n❌ DuckDB not found at: {db_path}')
        sys.exit(1)

    print(f'\n📦 Connecting to DuckDB: {db_path}')
    conn = duckdb.connect(db_path)

    try:
        # Check if table exists
        tables = conn.execute("SHOW TABLES").fetchall()
        table_names = [t[0] for t in tables]
        if 'ohlcv' not in table_names:
            print(f'❌ Table ohlcv not found in DuckDB. Available tables: {table_names}')
            sys.exit(1)

        # Fetch all data for symbol
        print(f'\n🔍 Fetching historical data for {symbol}...')
        query = """
            SELECT date, open, high, low, close, volume
            FROM ohlcv
            WHERE symbol = ?
            ORDER BY date ASC
        """

        all_data = conn.execute(query, [symbol]).fetchall()

        if not all_data:
            print(f'❌ No data found for symbol: {symbol}')
            sys.exit(1)

        print(f'✅ Found {len(all_data)} records')

        # Filter records BEFORE ex-date (these need adjustment)
        records_to_adjust = [row for row in all_data if datetime.strptime(str(row[0]), '%Y-%m-%d') < ex_date]
        records_after = [row for row in all_data if datetime.strptime(str(row[0]), '%Y-%m-%d') >= ex_date]

        print(f'\n📅 Date Analysis:')
        print(f'  Records BEFORE {ex_date_str}: {len(records_to_adjust)} (will be adjusted)')
        print(f'  Records ON/AFTER {ex_date_str}: {len(records_after)} (will NOT be adjusted)')

        if len(records_to_adjust) == 0:
            print(f'\n⚠️  No records found before ex-date. Nothing to adjust.')
            sys.exit(0)

        # Show sample of what will change
        print(f'\n📋 Sample of adjustments (first 3 records):')
        print('='*70)
        for i, row in enumerate(records_to_adjust[:3]):
            date, open_price, high, low, close, volume = row
            print(f'\nDate: {date}')
            print(f'  Open:   ₹{open_price:,.2f} → ₹{open_price * price_multiplier:,.2f}')
            print(f'  High:   ₹{high:,.2f} → ₹{high * price_multiplier:,.2f}')
            print(f'  Low:    ₹{low:,.2f} → ₹{low * price_multiplier:,.2f}')
            print(f'  Close:  ₹{close:,.2f} → ₹{close * price_multiplier:,.2f}')
            print(f'  Volume: {volume:,} → {int(volume * volume_multiplier):,}')

        # Show what stays same
        if records_after:
            print(f'\n📋 Records after ex-date (will NOT change) - Sample:')
            print('='*70)
            date, open_price, high, low, close, volume = records_after[0]
            print(f'\nDate: {date} (and all dates after)')
            print(f'  Open:   ₹{open_price:,.2f} (unchanged)')
            print(f'  Close:  ₹{close:,.2f} (unchanged)')
            print(f'  Volume: {volume:,} (unchanged)')

        # Confirmation
        print('\n' + '='*70)
        print('⚠️  WARNING: This will modify historical data in DuckDB')
        print('='*70)
        confirm = input(f'\n🚨 Adjust {len(records_to_adjust)} records before {ex_date_str}? (yes/no): ')

        if confirm.lower() != 'yes':
            print('❌ Adjustment cancelled by user')
            sys.exit(0)

        # Create backup first
        print('\n💾 Creating backup...')
        backup_table = f'ohlcv_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        conn.execute(f"""
            CREATE TABLE {backup_table} AS
            SELECT * FROM ohlcv WHERE symbol = ?
        """, [symbol])
        print(f'✅ Backup created: {backup_table}')

        # Perform adjustment
        print(f'\n🔧 Adjusting {len(records_to_adjust)} records...')

        update_query = """
            UPDATE ohlcv
            SET
                open = open * ?,
                high = high * ?,
                low = low * ?,
                close = close * ?,
                volume = CAST(volume * ? AS BIGINT)
            WHERE symbol = ?
              AND date < ?
        """

        conn.execute(update_query, [
            price_multiplier,
            price_multiplier,
            price_multiplier,
            price_multiplier,
            volume_multiplier,
            symbol,
            ex_date_str
        ])

        # Commit the changes to DuckDB
        conn.commit()

        print('✅ Adjustment complete!')

        # Verify adjustment
        print('\n🔍 Verifying adjustment...')
        verification_query = """
            SELECT date, close, volume
            FROM ohlcv
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 5
        """

        verified_data = conn.execute(verification_query, [symbol]).fetchall()
        print('\n📊 Latest 5 records after adjustment:')
        print('='*70)
        for row in verified_data:
            date, close, volume = row
            status = '✅ (adjusted)' if datetime.strptime(str(date), '%Y-%m-%d') < ex_date else '📌 (unchanged)'
            print(f'{date}: Close = ₹{close:,.2f}, Volume = {volume:,} {status}')

        print('\n' + '='*70)
        print('✅ Historical Data Adjustment Complete!')
        print('='*70)
        print(f'📊 Summary:')
        print(f'  Symbol: {symbol}')
        print(f'  Records Adjusted: {len(records_to_adjust)}')
        print(f'  Records Unchanged: {len(records_after)}')
        print(f'  Backup Table: {backup_table}')
        print(f'  Price Adjustment: ÷{multiplier:.2f}')
        print(f'  Volume Adjustment: ×{multiplier:.2f}')
        print('='*70)

        print('\n💡 Next Steps:')
        print('  1. Run technical analysis to recalculate indicators')
        print('     ./venv/bin/python3 scripts/test-single-symbol.py', symbol)
        print('  2. If something went wrong, you can restore from backup table:')
        print(f'     Backup table: {backup_table}')

    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        conn.close()

def show_usage():
    """Show usage instructions"""
    print('='*70)
    print('🔧 Historical Split/Bonus Adjustment for DuckDB')
    print('='*70)
    print('\nUsage:')
    print('  python3 scripts/adjust-historical-split.py SYMBOL EX_DATE RATIO TYPE')
    print('\nArguments:')
    print('  SYMBOL   - Stock symbol (e.g., RELIANCE, TCS, WIPRO)')
    print('  EX_DATE  - Ex-date in YYYY-MM-DD format')
    print('  RATIO    - Split/bonus ratio (e.g., 1:2, 1:3, 1:1)')
    print('  TYPE     - Action type: split or bonus')
    print('\nExamples:')
    print('  # RELIANCE had 1:1 bonus on 2024-10-28')
    print('  python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus')
    print()
    print('  # WIPRO had 1:3 split on 2019-07-18')
    print('  python3 scripts/adjust-historical-split.py WIPRO 2019-07-18 1:3 split')
    print()
    print('  # TCS had 1:1 bonus on 2022-09-16')
    print('  python3 scripts/adjust-historical-split.py TCS 2022-09-16 1:1 bonus')
    print('\nWhat it does:')
    print('  1. Adjusts all prices BEFORE ex-date (divides by ratio)')
    print('  2. Adjusts all volumes BEFORE ex-date (multiplies by ratio)')
    print('  3. Creates backup before making changes')
    print('  4. Leaves data ON/AFTER ex-date unchanged')
    print('\nHow Splits/Bonuses Work:')
    print('  1:2 split = 1 share becomes 2 shares')
    print('    - Price gets divided by 2 (₹2000 → ₹1000)')
    print('    - Volume gets multiplied by 2 (1000 → 2000)')
    print()
    print('  1:1 bonus = Get 1 free share for every 1 you own')
    print('    - Total shares become 2x (100 → 200)')
    print('    - Price gets divided by 2 (₹2000 → ₹1000)')
    print('    - Volume gets multiplied by 2 (1000 → 2000)')
    print('='*70)

if __name__ == '__main__':
    if len(sys.argv) != 5:
        show_usage()
        sys.exit(1)

    symbol = sys.argv[1].upper()
    ex_date = sys.argv[2]
    ratio = sys.argv[3]
    action_type = sys.argv[4].lower()

    if action_type not in ['split', 'bonus']:
        print(f'❌ Invalid action type: {action_type}. Must be "split" or "bonus"')
        show_usage()
        sys.exit(1)

    adjust_historical_data(symbol, ex_date, ratio, action_type)
