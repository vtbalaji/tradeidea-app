#!/usr/bin/env python3
"""
Restore All Symbols from Backup Tables

This script restores all symbols that have backup tables back to their original state,
effectively undoing all split adjustments that were applied.

Usage:
    python3 scripts/restore-all-from-backup.py
    python3 scripts/restore-all-from-backup.py --dry-run  (preview only)
"""

import sys
import os
import duckdb
import argparse
import re

def main():
    parser = argparse.ArgumentParser(description='Restore all symbols from backup tables')
    parser.add_argument('--dry-run', action='store_true', help='Preview only, no changes')
    args = parser.parse_args()

    print('='*80)
    print('🔄 Restore All Symbols from Backup')
    print('='*80)
    print(f'Mode: {"DRY RUN (preview only)" if args.dry_run else "LIVE (will restore data)"}')
    print('='*80)

    # Connect to DuckDB
    db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')

    if not os.path.exists(db_path):
        print(f'❌ DuckDB not found at: {db_path}')
        sys.exit(1)

    print(f'\n📦 Connecting to: {db_path}')
    conn = duckdb.connect(db_path)

    # Get all backup tables
    tables = conn.execute("SHOW TABLES").fetchall()
    backup_tables = [t[0] for t in tables if t[0].startswith('ohlcv_backup_')]

    print(f'\n📊 Found {len(backup_tables)} backup tables\n')

    if not backup_tables:
        print('No backup tables found. Nothing to restore.')
        sys.exit(0)

    # Extract symbol from each backup table and group by symbol
    # Format: ohlcv_backup_SYMBOL_YYYYMMDD_HHMMSS
    symbol_backups = {}

    for backup_table in backup_tables:
        # Extract symbol name
        # Pattern: ohlcv_backup_{SYMBOL}_{timestamp}
        match = re.match(r'ohlcv_backup_(.+?)_(\d{8}_\d{6})', backup_table)
        if not match:
            print(f'⚠️  Skipping {backup_table} - cannot extract symbol')
            continue

        symbol = match.group(1)
        timestamp = match.group(2)

        if symbol not in symbol_backups:
            symbol_backups[symbol] = []
        symbol_backups[symbol].append((timestamp, backup_table))

    # For each symbol, use the OLDEST backup (original unadjusted data)
    print(f'\n📋 Found {len(symbol_backups)} unique symbols with backups\n')

    restored_count = 0

    for symbol, backups in sorted(symbol_backups.items()):
        # Sort by timestamp and get oldest
        backups.sort()
        oldest_timestamp, oldest_backup = backups[0]

        other_backups = [b[1] for b in backups[1:]]

        backup_count = len(backups)
        print(f'Restoring {symbol} from {oldest_backup} ({backup_count} backup(s))...', end=' ')

        if args.dry_run:
            print('[DRY RUN]')
            restored_count += 1
            continue

        try:
            # Delete current data for symbol
            conn.execute("DELETE FROM ohlcv WHERE symbol = ?", [symbol])

            # Restore from oldest backup
            conn.execute(f"INSERT INTO ohlcv SELECT * FROM {oldest_backup}")

            # Drop ALL backup tables for this symbol
            for _, backup_table in backups:
                conn.execute(f"DROP TABLE {backup_table}")

            conn.commit()

            print('✅')
            restored_count += 1

        except Exception as e:
            print(f'❌ Error: {str(e)}')

    conn.close()

    # Summary
    print('\n' + '='*80)
    print('📊 Summary')
    print('='*80)
    print(f'Backup tables found: {len(backup_tables)}')
    print(f'Symbols restored: {restored_count}')

    if args.dry_run:
        print('\n⚠️  DRY RUN - No changes were made')
        print('   Run without --dry-run to restore all symbols')
    else:
        print('\n✅ Restore complete!')
        print('\n💡 Next steps:')
        print('   1. Run fixed batch script: python3 scripts/batch-detect-and-fix-splits.py')
        print('   2. Regenerate charts: npm run generate-charts-top250')

    print('='*80)

if __name__ == '__main__':
    main()
