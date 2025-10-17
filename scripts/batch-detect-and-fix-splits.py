#!/usr/bin/env python3
"""
One-Time Batch Split Detection and Correction

Scans ALL symbols in DuckDB for historical price discontinuities (splits/bonuses)
and automatically adjusts them.

This is a ONE-TIME cleanup script to fix historical data issues.

Usage:
    python3 scripts/batch-detect-and-fix-splits.py
    python3 scripts/batch-detect-and-fix-splits.py --dry-run  (preview only, no changes)
    python3 scripts/batch-detect-and-fix-splits.py --limit 10  (test on 10 symbols)
"""

import sys
import os
from datetime import datetime
import duckdb
import argparse

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher

def detect_split_in_history(conn, symbol):
    """
    Scan entire history of a symbol to find split dates
    Returns list of (date, old_price, new_price, ratio)
    """
    query = """
        SELECT date, close, LAG(close) OVER (ORDER BY date) as prev_close
        FROM ohlcv
        WHERE symbol = ?
        ORDER BY date
    """

    df = conn.execute(query, [symbol]).fetchdf()

    if len(df) < 2:
        return []

    splits_found = []

    for i in range(1, len(df)):
        prev_close = df.iloc[i]['prev_close']
        curr_close = df.iloc[i]['close']
        date = df.iloc[i]['date']

        if prev_close and curr_close:
            change_percent = ((curr_close - prev_close) / prev_close) * 100

            # Detect splits: 40-99% price drop
            if -99 < change_percent < -40:
                ratio = curr_close / prev_close

                # Check common split ratios with tolerance
                split_types = [
                    (0.5, '1:1 bonus', 0.05),       # ~50% drop
                    (0.33, '1:2 bonus', 0.05),      # ~66% drop
                    (0.25, '1:3 bonus', 0.05),      # ~75% drop
                    (0.2, '1:4 bonus', 0.05),       # ~80% drop
                    (0.1, '1:9 split', 0.03),       # ~90% drop
                    (0.05, '1:19 split', 0.02),     # ~95% drop
                    (0.04, '1:24 split', 0.01),     # ~96% drop (COFORGE case)
                    (0.033, '1:29 split', 0.01),    # ~97% drop
                ]

                for expected_ratio, split_type, tolerance in split_types:
                    if abs(ratio - expected_ratio) < tolerance:
                        splits_found.append({
                            'date': str(date),
                            'prev_close': float(prev_close),
                            'curr_close': float(curr_close),
                            'change_pct': change_percent,
                            'ratio': ratio,
                            'split_type': split_type,
                            'adjustment_ratio': ratio  # For adjusting old prices (multiply by ratio to bring down)
                        })
                        break

    return splits_found

def adjust_prices_before_date(conn, symbol, ex_date, price_multiplier, volume_multiplier, dry_run=False):
    """
    Adjust all prices and volumes before ex_date
    """
    if dry_run:
        print(f'    [DRY RUN] Would adjust prices before {ex_date}')
        return True

    try:
        # Create backup
        backup_table = f'ohlcv_backup_{symbol}_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        conn.execute(f"""
            CREATE TABLE {backup_table} AS
            SELECT * FROM ohlcv WHERE symbol = ?
        """, [symbol])

        # Adjust historical data
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
            ex_date
        ])

        # Commit the changes
        conn.commit()

        print(f'    ✅ Adjusted (backup: {backup_table})')
        return True

    except Exception as e:
        print(f'    ❌ Error: {str(e)}')
        return False

def main():
    parser = argparse.ArgumentParser(description='Batch detect and fix splits/bonuses')
    parser.add_argument('--dry-run', action='store_true', help='Preview only, no changes')
    parser.add_argument('--limit', type=int, help='Limit number of symbols to process (for testing)')
    args = parser.parse_args()

    print('='*80)
    print('🔍 Batch Split Detection and Correction')
    print('='*80)
    print(f'Mode: {"DRY RUN (preview only)" if args.dry_run else "LIVE (will modify DuckDB)"}')
    print('='*80)

    # Connect to DuckDB
    db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')

    if not os.path.exists(db_path):
        print(f'❌ DuckDB not found at: {db_path}')
        sys.exit(1)

    print(f'\n📦 Connecting to: {db_path}')
    conn = duckdb.connect(db_path)

    # Get all symbols
    query = "SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol"
    symbols = [row[0] for row in conn.execute(query).fetchall()]

    if args.limit:
        symbols = symbols[:args.limit]

    print(f'📊 Scanning {len(symbols)} symbols for splits/bonuses...\n')

    total_symbols = len(symbols)
    splits_detected = 0
    symbols_adjusted = 0

    for i, symbol in enumerate(symbols):
        print(f'[{i+1}/{total_symbols}] {symbol}', end=' ... ')

        try:
            splits = detect_split_in_history(conn, symbol)

            if not splits:
                print('✓ No splits detected')
                continue

            print(f'\n  🚨 Found {len(splits)} split(s):')
            splits_detected += len(splits)

            for split in splits:
                print(f'    Date: {split["date"]}')
                print(f'    Price: ₹{split["prev_close"]:.2f} → ₹{split["curr_close"]:.2f} ({split["change_pct"]:.1f}%)')
                print(f'    Type: {split["split_type"]}')
                print(f'    Adjustment: Divide old prices by {1/split["adjustment_ratio"]:.2f}')

                # Adjust
                price_mult = split['adjustment_ratio']  # Multiply prices by ratio (brings them down)
                volume_mult = 1 / split['adjustment_ratio']  # Multiply volumes by inverse (brings them up)

                success = adjust_prices_before_date(
                    conn, symbol, split['date'],
                    price_mult, volume_mult,
                    args.dry_run
                )

                if success:
                    symbols_adjusted += 1

        except Exception as e:
            print(f'❌ Error: {str(e)}')

    conn.close()

    # Summary
    print('\n' + '='*80)
    print('📊 Summary')
    print('='*80)
    print(f'Symbols scanned: {total_symbols}')
    print(f'Splits detected: {splits_detected}')
    print(f'Symbols adjusted: {symbols_adjusted}')

    if args.dry_run:
        print('\n⚠️  DRY RUN - No changes were made')
        print('   Run without --dry-run to apply changes')
    else:
        print('\n✅ Adjustments complete!')
        print('\n💡 Next steps:')
        print('   1. Regenerate charts: npm run generate-charts-top250')
        print('   2. Verify charts in browser')

    print('='*80)

if __name__ == '__main__':
    main()
