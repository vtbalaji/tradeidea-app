#!/usr/bin/env -S venv/bin/python3
"""
XBRL EOD Batch Processor

Processes XBRL files for companies, calculates fundamental ratios,
and stores them in DuckDB (single consolidated table).

This script processes XBRL files with automatic file discovery and tracking.

Usage:
    # Process all files for a symbol
    python3 scripts/xbrl_eod.py --symbol TCS

    # Process only consolidated files for a symbol
    python3 scripts/xbrl_eod.py --symbol TCS --prefer consolidated

    # Process only standalone files for a symbol
    python3 scripts/xbrl_eod.py --symbol RELIANCE --prefer standalone

    # Process all files in xbrl directory
    python3 scripts/xbrl_eod.py --dir ./xbrl

    # Reprocess failed files
    python3 scripts/xbrl_eod.py --retry-failed

Features:
    - Parses XBRL files (Indian company financial statements)
    - Calculates 40+ fundamental ratios (P/E, ROE, ROA, etc.)
    - Stores in DuckDB with raw + calculated data (single table)
    - Tracks processed files (prevents duplicates)
    - Supports both standalone and consolidated statements
"""

import sys
import os
import glob
from datetime import datetime
import re

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from xbrl_parser import XBRLParser
from fundamental_calculator import FundamentalCalculator
from fundamental_xbrl_storage import XBRLStorage


def extract_metadata_from_filename(filename):
    """
    Extract symbol, statement_type, month, year from filename

    Expected format: SYMBOL_type_month_year.xml
    Example: TCS_consolidated_may_2025.xml

    Returns:
        dict with 'symbol', 'statement_type', 'month', 'year' or None
    """
    basename = os.path.basename(filename)
    name_without_ext = os.path.splitext(basename)[0]

    # Split by underscore
    parts = name_without_ext.split('_')

    if len(parts) < 4:
        return None

    result = {
        'symbol': parts[0].upper(),
        'statement_type': parts[1].lower(),  # standalone or consolidated
        'month': parts[2].lower(),
        'year': parts[3]
    }

    # Validate statement_type
    if result['statement_type'] not in ['standalone', 'consolidated']:
        return None

    return result


def find_xbrl_files(symbol=None, directory='./xbrl', statement_type=None):
    """
    Find all XBRL files in directory, optionally filtered by symbol and type

    Args:
        symbol: Stock symbol to filter (e.g., 'TCS')
        directory: Directory to scan
        statement_type: Filter by 'standalone' or 'consolidated'

    Returns:
        List of file paths
    """
    # Find all XML files
    xml_files = glob.glob(os.path.join(directory, '*.xml'))

    results = []
    for file_path in xml_files:
        metadata = extract_metadata_from_filename(file_path)
        if not metadata:
            continue

        # Filter by symbol
        if symbol and metadata['symbol'] != symbol.upper():
            continue

        # Filter by statement_type
        if statement_type and metadata['statement_type'] != statement_type.lower():
            continue

        results.append({
            'path': file_path,
            'filename': os.path.basename(file_path),
            'metadata': metadata
        })

    # Sort by symbol, then by year/month (newest first)
    results.sort(key=lambda x: (
        x['metadata']['symbol'],
        x['metadata']['year'],
        x['metadata']['month']
    ), reverse=True)

    return results


def process_xbrl_file(xbrl_file_path, storage, skip_if_processed=True):
    """
    Process a single XBRL file

    Args:
        xbrl_file_path: Path to XBRL file
        storage: XBRLStorage instance
        skip_if_processed: Skip if file already processed successfully

    Returns:
        True if successful, False otherwise
    """
    filename = os.path.basename(xbrl_file_path)

    # Check if already processed
    if skip_if_processed:
        is_processed, processed_at = storage.is_file_processed(filename)
        if is_processed:
            print(f'  ⏭️  Already processed ({processed_at}) - skipping')
            return True

    # Extract metadata from filename
    metadata = extract_metadata_from_filename(filename)
    if not metadata:
        print(f'  ❌ Cannot extract metadata from filename: {filename}')
        print(f'     Expected format: SYMBOL_type_month_year.xml')
        return False

    symbol = metadata['symbol']
    statement_type = metadata['statement_type']

    print(f'  ✅ New file - processing')
    print(f'     Symbol: {symbol}')
    print(f'     Type: {statement_type}')

    try:
        # Step 1: Parse XBRL file
        print(f'  📋 Parsing XBRL file...')
        parser = XBRLParser(xbrl_file_path)
        xbrl_data = parser.extract_all()

        if not xbrl_data:
            error_msg = 'Failed to parse XBRL file'
            print(f'  ❌ {error_msg}')
            storage.mark_file_processed(
                filename, xbrl_file_path, symbol, statement_type,
                None, None, None, os.path.getsize(xbrl_file_path),
                status='failed', error_message=error_msg
            )
            return False

        print(f'     Extracted {len(xbrl_data)} metrics')

        # Get reporting period and FY/Quarter info
        period_info = parser.get_financial_year_and_quarter()
        if not period_info:
            error_msg = 'Could not determine financial year and quarter'
            print(f'  ❌ {error_msg}')
            storage.mark_file_processed(
                filename, xbrl_file_path, symbol, statement_type,
                None, None, None, os.path.getsize(xbrl_file_path),
                status='failed', error_message=error_msg
            )
            return False

        fy = period_info['fy']
        quarter = period_info['quarter']
        end_date = period_info['endDate']

        print(f'     Period: {fy} {quarter} ({"Annual" if period_info.get("isAnnual") else "Quarterly"})')
        print(f'     End Date: {end_date}')

        # Step 2: Calculate fundamental ratios
        print(f'  📊 Calculating fundamental ratios...')
        calculator = FundamentalCalculator()
        fundamentals = calculator.calculate(xbrl_data, symbol)

        if not fundamentals:
            error_msg = 'Failed to calculate fundamental ratios'
            print(f'  ❌ {error_msg}')
            calculator.close()
            storage.mark_file_processed(
                filename, xbrl_file_path, symbol, statement_type,
                fy, quarter, end_date, os.path.getsize(xbrl_file_path),
                status='failed', error_message=error_msg
            )
            return False

        print(f'     Calculated {len(fundamentals)} ratios')

        # Step 3: Store in DuckDB (single table with raw + calculated)
        print(f'  💾 Storing in DuckDB...')
        storage.store_data(
            symbol, fy, quarter, statement_type,
            xbrl_data, fundamentals, period_info,
            filename
        )

        # Step 4: Mark file as processed
        storage.mark_file_processed(
            filename, xbrl_file_path, symbol, statement_type,
            fy, quarter, end_date, os.path.getsize(xbrl_file_path),
            status='success'
        )
        print(f'  ✅ Marked as processed')

        calculator.close()
        return True

    except Exception as e:
        error_msg = str(e)
        print(f'  ❌ Error: {error_msg}')

        # Try to extract basic metadata for tracking
        try:
            storage.mark_file_processed(
                filename, xbrl_file_path, symbol, statement_type,
                None, None, None, os.path.getsize(xbrl_file_path),
                status='failed', error_message=error_msg
            )
        except:
            pass

        return False


def process_symbol(symbol, storage, prefer=None):
    """
    Process all XBRL files for a symbol

    Args:
        symbol: Stock symbol (e.g., 'TCS')
        storage: XBRLStorage instance
        prefer: 'standalone', 'consolidated', or None (process all)

    Returns:
        Summary dict with counts
    """
    print(f'\n🚀 Processing XBRL Files for {symbol}')
    print('=' * 70)

    # Find all files for symbol
    print(f'📂 Scanning ./xbrl directory...')
    files = find_xbrl_files(symbol=symbol, statement_type=prefer)

    if not files:
        print(f'⚠️  No XBRL files found for {symbol}')
        if prefer:
            print(f'   (filtering by: {prefer})')
        return {'processed': 0, 'skipped': 0, 'failed': 0}

    print(f'   Found {len(files)} file(s) for {symbol}')

    if prefer:
        print(f'   Filtering by preference: {prefer}')

    # Display files
    print(f'\n   Files to process:')
    for f in files:
        print(f'   • {f["filename"]}')

    # Process each file
    processed = 0
    skipped = 0
    failed = 0

    for i, file_info in enumerate(files):
        print(f'\n[{i+1}/{len(files)}] Processing: {file_info["filename"]}')

        result = process_xbrl_file(file_info['path'], storage, skip_if_processed=True)

        if result:
            # Check if actually processed or skipped
            is_processed, _ = storage.is_file_processed(file_info['filename'])
            if is_processed:
                # Was already processed (skipped) or just processed
                # We need to check more carefully
                pass
            processed += 1
        else:
            failed += 1

    return {
        'processed': processed,
        'skipped': skipped,
        'failed': failed
    }


def process_directory(directory, storage):
    """
    Process all XBRL files in a directory

    Args:
        directory: Directory path
        storage: XBRLStorage instance
    """
    print(f'\n🚀 Batch Processing XBRL Files')
    print('=' * 70)
    print(f'Directory: {directory}')

    # Find all files
    files = find_xbrl_files(directory=directory)

    if not files:
        print(f'⚠️  No XBRL files found in {directory}')
        return

    print(f'Found {len(files)} file(s)')

    # Process each file
    success_count = 0
    skip_count = 0
    fail_count = 0

    start_time = datetime.now()

    for i, file_info in enumerate(files):
        print(f'\n[{i+1}/{len(files)}] Processing: {file_info["filename"]}')

        # Check if already processed
        is_processed, processed_at = storage.is_file_processed(file_info['filename'])
        if is_processed:
            skip_count += 1
            continue

        result = process_xbrl_file(file_info['path'], storage)

        if result:
            success_count += 1
        else:
            fail_count += 1

    duration = (datetime.now() - start_time).total_seconds()

    print(f'\n' + '=' * 70)
    print(f'📊 Summary')
    print('=' * 70)
    print(f'✅ Processed: {success_count} file(s)')
    print(f'⏭️  Skipped: {skip_count} file(s) (already processed)')
    print(f'❌ Failed: {fail_count} file(s)')
    print(f'⏱️  Duration: {duration:.1f}s')
    print('=' * 70)


def retry_failed_files(storage):
    """Retry processing files that previously failed"""
    print(f'\n🔄 Retrying Failed Files')
    print('=' * 70)

    failed = storage.get_failed_files()

    if not failed:
        print('✅ No failed files to retry')
        return

    print(f'Found {len(failed)} failed file(s)')

    success_count = 0
    fail_count = 0

    for i, f in enumerate(failed):
        print(f'\n[{i+1}/{len(failed)}] Retrying: {f["file_name"]}')
        print(f'   Previous error: {f["error_message"]}')

        result = process_xbrl_file(f['file_path'], storage, skip_if_processed=False)

        if result:
            success_count += 1
        else:
            fail_count += 1

    print(f'\n' + '=' * 70)
    print(f'📊 Retry Summary')
    print('=' * 70)
    print(f'✅ Success: {success_count} file(s)')
    print(f'❌ Still Failed: {fail_count} file(s)')
    print('=' * 70)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Process XBRL files and calculate fundamental ratios',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Process all files for a symbol
    python3 scripts/xbrl_eod.py --symbol TCS

    # Process only consolidated files for TCS
    python3 scripts/xbrl_eod.py --symbol TCS --prefer consolidated

    # Process only standalone files for RELIANCE
    python3 scripts/xbrl_eod.py --symbol RELIANCE --prefer standalone

    # Process all files in xbrl directory
    python3 scripts/xbrl_eod.py --dir ./xbrl

    # Retry failed files
    python3 scripts/xbrl_eod.py --retry-failed
        """
    )

    parser.add_argument('--symbol', help='Stock symbol (e.g., TCS)')
    parser.add_argument('--dir', dest='directory', help='Process all XBRL files in directory')
    parser.add_argument('--prefer', choices=['standalone', 'consolidated'],
                       help='Prefer standalone or consolidated statements')
    parser.add_argument('--retry-failed', action='store_true',
                       help='Retry processing files that previously failed')

    args = parser.parse_args()

    # Initialize storage
    storage = XBRLStorage()

    try:
        # Retry failed files mode
        if args.retry_failed:
            retry_failed_files(storage)
            storage.close()
            sys.exit(0)

        # Directory mode
        if args.directory:
            if not os.path.isdir(args.directory):
                print(f'❌ Directory not found: {args.directory}')
                sys.exit(1)
            process_directory(args.directory, storage)
            storage.close()
            sys.exit(0)

        # Symbol mode
        if args.symbol:
            summary = process_symbol(args.symbol, storage, prefer=args.prefer)

            print(f'\n' + '=' * 70)
            print(f'📊 Summary')
            print('=' * 70)
            print(f'✅ Processed: {summary["processed"]} file(s)')
            print(f'⏭️  Skipped: {summary["skipped"]} file(s) (already processed)')
            print(f'❌ Failed: {summary["failed"]} file(s)')
            print('=' * 70)

            # Show query hint
            print(f'\nQuery data:')
            print(f'  duckdb data/fundamentals.duckdb "SELECT * FROM xbrl_data WHERE symbol=\'{args.symbol}\'"')

            storage.close()
            sys.exit(0)

        # No arguments - show help
        parser.print_help()
        storage.close()
        sys.exit(1)

    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        storage.close()
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        storage.close()
        sys.exit(1)


if __name__ == '__main__':
    main()
