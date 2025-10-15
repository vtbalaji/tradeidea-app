#!/usr/bin/env -S venv/bin/python3
"""
XBRL EOD Batch Processor

Processes XBRL files for companies, calculates fundamental ratios,
and stores them in Firebase Firestore.

This script is the equivalent of analyze-symbols-duckdb.py but for fundamental data.

Usage:
    # Process single company
    python3 scripts/xbrl_eod.py RELIANCE /path/to/reliance_xbrl.xml

    # Process multiple companies from a directory
    python3 scripts/xbrl_eod.py --dir /path/to/xbrl_files/

Features:
    - Parses XBRL files (Indian company financial statements)
    - Calculates 25+ fundamental ratios (P/E, ROE, ROA, etc.)
    - Fetches current market price from DuckDB
    - Stores in Firestore with source="xbrl" (authentic data)
    - Supports batch processing
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
from fundamental_duckdb_storage import FundamentalStorage

# Initialize Firebase
import firebase_admin
from firebase_admin import credentials, firestore

cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized
    pass

db = firestore.client()


def extract_symbol_from_filename(filename):
    """
    Try to extract symbol from XBRL filename
    Common patterns: RELIANCE_2024.xml, NSE_RELIANCE_FY2024.xml, etc.
    """
    basename = os.path.basename(filename)

    # Remove extension
    name_without_ext = os.path.splitext(basename)[0]

    # Try to extract symbol (uppercase letters, possibly with numbers)
    # Match patterns like: RELIANCE, BAJFINANCE, TCS, etc.
    match = re.search(r'^([A-Z][A-Z0-9]*)', name_without_ext)
    if match:
        return match.group(1)

    return None


def save_to_duckdb(storage, symbol, fy, quarter, fundamentals, xbrl_data, period_info):
    """
    Save fundamental data to DuckDB (historical storage)
    """
    try:
        storage.store_fundamental_data(symbol, fy, quarter, fundamentals, xbrl_data, period_info)
        return True
    except Exception as e:
        print(f'  ❌ Error saving to DuckDB: {str(e)}')
        return False


def save_latest_to_firestore(storage, symbol, fundamentals, xbrl_data, period_info):
    """
    Save ONLY the latest quarter data to Firestore
    Checks DuckDB to ensure this is the most recent data before updating Firebase
    """
    # Add NS_ prefix for Firebase compatibility
    symbol_with_prefix = f'NS_{symbol}' if not symbol.startswith('NS_') else symbol

    # Get latest quarter from DuckDB
    latest_in_db = storage.get_latest_quarter(symbol)

    # Check if this is the latest data
    is_latest = False
    if not latest_in_db:
        is_latest = True
    else:
        # Compare end dates
        from datetime import datetime
        current_date = datetime.strptime(period_info['endDate'], '%Y-%m-%d')
        latest_date = latest_in_db['end_date']
        if isinstance(latest_date, str):
            latest_date = datetime.strptime(latest_date, '%Y-%m-%d')

        is_latest = current_date >= latest_date

    if not is_latest:
        print(f'  ⚠️  Skipping Firebase update - not the latest quarter')
        print(f'     Current: {period_info["fy"]} {period_info["quarter"]}')
        print(f'     Latest: {latest_in_db["fy"]} {latest_in_db["quarter"]}')
        return False

    # Prepare data structure
    fundamental_data = {
        **fundamentals,
        'fy': period_info['fy'],
        'quarter': period_info['quarter'],
        'isAnnual': period_info.get('isAnnual', False),
        'endDate': period_info['endDate'],
        'startDate': period_info.get('startDate'),
        'lastUpdated': firestore.SERVER_TIMESTAMP,
        'source': 'xbrl',  # Mark as authentic XBRL data
    }

    # Also store raw XBRL data for reference
    xbrl_snapshot = {
        'revenue': xbrl_data.get('Revenue', 0),
        'netProfit': xbrl_data.get('NetProfit', 0),
        'totalAssets': xbrl_data.get('Assets', 0),
        'totalEquity': xbrl_data.get('Equity', 0),
        'totalDebt': xbrl_data.get('TotalDebt', 0),
        'eps': xbrl_data.get('EPS', 0),
        'fy': period_info['fy'],
        'quarter': period_info['quarter'],
    }

    # Save to symbols collection
    symbols_doc = db.collection('symbols').document(symbol_with_prefix)
    symbols_doc.set({
        'symbol': symbol_with_prefix,
        'originalSymbol': symbol,
        'fundamentals': fundamental_data,
        'xbrlSnapshot': xbrl_snapshot,
        'lastFetchedFundamentals': firestore.SERVER_TIMESTAMP,
    }, merge=True)  # merge=True preserves technical data if it exists

    print(f'  ✅ Saved latest quarter to Firestore: {period_info["fy"]} {period_info["quarter"]}')
    return True


def process_xbrl_file(xbrl_file_path, symbol=None):
    """
    Process a single XBRL file

    Args:
        xbrl_file_path: Path to XBRL file
        symbol: Stock symbol (optional, will try to extract from filename)

    Returns:
        True if successful, False otherwise
    """
    print(f'\n{"="*70}')
    print(f'📄 Processing XBRL File')
    print(f'{"="*70}')

    # Extract symbol from filename if not provided
    if not symbol:
        symbol = extract_symbol_from_filename(xbrl_file_path)
        if not symbol:
            print(f'⚠️  Could not extract symbol from filename: {xbrl_file_path}')
            user_symbol = input('Please enter stock symbol (e.g., RELIANCE): ').strip().upper()
            if user_symbol:
                symbol = user_symbol
            else:
                print('❌ Symbol is required')
                return False

    print(f'Symbol: {symbol}')
    print(f'File: {xbrl_file_path}')

    # Step 1: Parse XBRL file
    print(f'\n📋 Step 1: Parsing XBRL file...')
    parser = XBRLParser(xbrl_file_path)
    xbrl_data = parser.extract_all()

    if not xbrl_data:
        print(f'❌ Failed to parse XBRL file')
        return False

    print(f'✅ Extracted {len(xbrl_data)} financial metrics')

    # Get reporting period and FY/Quarter info
    period_info = parser.get_financial_year_and_quarter()
    if not period_info:
        print(f'❌ Could not determine financial year and quarter')
        return False

    print(f'📅 Reporting Period: {period_info["fy"]} {period_info["quarter"]}')
    if period_info.get('isAnnual'):
        print(f'    Type: Annual Report')

    # Display XBRL summary
    parser.display_summary(xbrl_data)

    # Step 2: Calculate fundamental ratios
    print(f'\n📊 Step 2: Calculating fundamental ratios...')
    calculator = FundamentalCalculator()
    fundamentals = calculator.calculate(xbrl_data, symbol)

    if not fundamentals:
        print(f'❌ Failed to calculate fundamental ratios')
        calculator.close()
        return False

    print(f'✅ Calculated {len(fundamentals)} fundamental ratios')

    # Display fundamentals
    calculator.display(fundamentals)

    # Step 3: Save to DuckDB (all historical data)
    print(f'\n💾 Step 3: Saving to DuckDB (historical storage)...')
    storage = FundamentalStorage()

    try:
        if not save_to_duckdb(storage, symbol, period_info['fy'], period_info['quarter'],
                             fundamentals, xbrl_data, period_info):
            print(f'❌ Failed to save to DuckDB')
            storage.close()
            calculator.close()
            return False
    except Exception as e:
        print(f'❌ Error saving to DuckDB: {str(e)}')
        storage.close()
        calculator.close()
        return False

    # Step 4: Save ONLY latest quarter to Firestore
    print(f'\n💾 Step 4: Saving latest quarter to Firestore...')

    try:
        save_latest_to_firestore(storage, symbol, fundamentals, xbrl_data, period_info)
        print(f'✅ Successfully processed fundamental data for {symbol}')
    except Exception as e:
        print(f'❌ Error saving to Firestore: {str(e)}')
        storage.close()
        calculator.close()
        return False

    storage.close()
    calculator.close()

    print(f'\n{"="*70}')
    print(f'✅ Processing complete for {symbol}')
    print(f'{"="*70}')

    return True


def process_directory(directory_path):
    """
    Process all XBRL files in a directory

    Args:
        directory_path: Path to directory containing XBRL files
    """
    print(f'\n🚀 Batch Processing XBRL Files')
    print(f'{"="*70}')
    print(f'Directory: {directory_path}')

    # Find all XML files in directory
    xml_files = glob.glob(os.path.join(directory_path, '*.xml'))

    if not xml_files:
        print(f'⚠️  No XML files found in directory')
        return

    print(f'Found {len(xml_files)} XML files')

    success_count = 0
    fail_count = 0

    start_time = datetime.now()

    for i, xml_file in enumerate(xml_files):
        print(f'\n[{i+1}/{len(xml_files)}] Processing: {os.path.basename(xml_file)}')

        try:
            if process_xbrl_file(xml_file):
                success_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f'❌ Error processing file: {str(e)}')
            fail_count += 1

    duration = (datetime.now() - start_time).total_seconds()

    print(f'\n{"="*70}')
    print(f'📊 Batch Processing Complete')
    print(f'{"="*70}')
    print(f'✅ Success: {success_count} files')
    print(f'❌ Failed: {fail_count} files')
    print(f'⏱️  Duration: {duration:.1f}s')
    print(f'{"="*70}')


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Process XBRL files and calculate fundamental ratios',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Process single XBRL file
    python3 scripts/xbrl_eod.py RELIANCE /path/to/reliance.xml

    # Process with symbol auto-detection
    python3 scripts/xbrl_eod.py /path/to/RELIANCE_2024.xml

    # Process all XBRL files in a directory
    python3 scripts/xbrl_eod.py --dir /path/to/xbrl_files/
        """
    )

    parser.add_argument('symbol_or_file', nargs='?', help='Stock symbol or XBRL file path')
    parser.add_argument('xbrl_file', nargs='?', help='XBRL file path (if symbol provided)')
    parser.add_argument('--dir', dest='directory', help='Process all XBRL files in directory')

    args = parser.parse_args()

    # Directory mode
    if args.directory:
        if not os.path.isdir(args.directory):
            print(f'❌ Directory not found: {args.directory}')
            sys.exit(1)
        process_directory(args.directory)
        sys.exit(0)

    # Single file mode
    if not args.symbol_or_file:
        parser.print_help()
        sys.exit(1)

    # Check if first argument is a file or symbol
    if os.path.isfile(args.symbol_or_file):
        # First argument is a file
        xbrl_file = args.symbol_or_file
        symbol = None
    else:
        # First argument is a symbol
        symbol = args.symbol_or_file.upper()
        xbrl_file = args.xbrl_file

        if not xbrl_file:
            print('❌ XBRL file path is required')
            parser.print_help()
            sys.exit(1)

    # Validate file exists
    if not os.path.isfile(xbrl_file):
        print(f'❌ XBRL file not found: {xbrl_file}')
        sys.exit(1)

    # Process the file
    if process_xbrl_file(xbrl_file, symbol):
        print('\n✅ Job completed successfully')
        sys.exit(0)
    else:
        print('\n❌ Job failed')
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
