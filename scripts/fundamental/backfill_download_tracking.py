#!/usr/bin/env -S venv/bin/python3
"""
Backfill download tracking for existing XBRL files

This script scans the xbrl/ directory and adds existing files to the
download tracking table in DuckDB.

Usage:
    python3 scripts/backfill_download_tracking.py
"""

import os
import sys
import glob
from pathlib import Path

# Add scripts directory to path for cross-folder imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from fundamental.fundamental_xbrl_storage import XBRLStorage


def parse_filename(filename):
    """
    Parse filename to extract metadata
    Format: SYMBOL_type_month_year.xml
    Example: TCS_standalone_sep_2024.xml

    Returns:
        dict with 'symbol', 'type', 'month', 'year' or None
    """
    basename = os.path.basename(filename)
    name_without_ext = os.path.splitext(basename)[0]

    # Split by underscore
    parts = name_without_ext.split('_')

    if len(parts) < 4:
        return None

    return {
        'symbol': parts[0].upper(),
        'type': parts[1].lower(),
        'month': parts[2].lower(),
        'year': int(parts[3])
    }


def month_to_number(month_abbr):
    """Convert month abbreviation to month number"""
    months = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
        'may': 5, 'jun': 6, 'jul': 7, 'aug': 8,
        'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    return months.get(month_abbr.lower())


def quarter_to_fy_and_q(month, year):
    """
    Convert month and year to Financial Year and Quarter
    Indian FY runs April-March
    """
    # Determine FY (ends in March)
    if month <= 3:
        fy_year = year
    else:
        fy_year = year + 1

    fy = f'FY{fy_year}'

    # Determine Quarter
    if month == 6:
        quarter = 'Q1'
    elif month == 9:
        quarter = 'Q2'
    elif month == 12:
        quarter = 'Q3'
    elif month == 3:
        quarter = 'Q4'
    else:
        # Best guess based on month
        quarter = f'Q{(month - 1) // 3 + 1}'

    return (fy, quarter)


def main():
    """Main entry point"""
    xbrl_dir = Path('xbrl')

    if not xbrl_dir.exists():
        print('❌ xbrl/ directory not found')
        sys.exit(1)

    # Find all XML files
    xml_files = list(xbrl_dir.glob('*.xml'))

    if not xml_files:
        print('⚠️  No XML files found in xbrl/ directory')
        sys.exit(0)

    print(f'🔍 Found {len(xml_files)} XML files in xbrl/ directory')
    print('=' * 70)

    # Initialize storage
    storage = XBRLStorage()

    backfilled = 0
    skipped = 0
    failed = 0

    for file_path in xml_files:
        filename = file_path.name

        # Parse filename
        metadata = parse_filename(filename)

        if not metadata:
            print(f'⚠️  Cannot parse filename: {filename}')
            failed += 1
            continue

        symbol = metadata['symbol']
        type_str = metadata['type']
        month_abbr = metadata['month']
        year = metadata['year']

        # Convert to FY and Quarter
        month_num = month_to_number(month_abbr)
        if not month_num:
            print(f'⚠️  Invalid month in filename: {filename}')
            failed += 1
            continue

        fy, quarter = quarter_to_fy_and_q(month_num, year)

        # Check if already tracked
        already_tracked, existing_file = storage.is_already_downloaded(
            symbol, fy, quarter, type_str
        )

        if already_tracked:
            print(f'⏭️  Already tracked: {filename} ({fy} {quarter})')
            skipped += 1
            continue

        # Track it
        file_size = os.path.getsize(file_path)
        file_path_str = str(file_path.absolute())

        # We don't have the original URL, so use placeholder
        source_url = f'https://www.nseindia.com/api/corp-info?symbol={symbol}'

        storage.track_download(
            symbol, fy, quarter, type_str,
            source_url, file_path_str, filename, file_size
        )

        print(f'✅ Tracked: {filename} → {fy} {quarter} ({type_str})')
        backfilled += 1

    print('=' * 70)
    print('📊 Summary')
    print('=' * 70)
    print(f'✅ Backfilled: {backfilled}')
    print(f'⏭️  Skipped (already tracked): {skipped}')
    print(f'❌ Failed: {failed}')
    print('=' * 70)

    storage.close()

    print('\n✅ Done!')


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
