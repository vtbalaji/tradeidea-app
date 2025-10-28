#!/usr/bin/env -S venv/bin/python3
"""
XBRL File Organizer

Helps organize manually downloaded financial result files from NSE India.
Renames files to follow the standard naming convention.

Usage:
    # Interactive mode - will prompt for details
    ./scripts/organize_xbrl_files.py xbrl/downloaded_file.pdf

    # With metadata
    ./scripts/organize_xbrl_files.py xbrl/file.pdf --symbol TCS --quarter sep --year 2024 --type standalone

    # Batch mode - organize all files in directory
    ./scripts/organize_xbrl_files.py --dir xbrl/ --auto

Standard naming: SYMBOL_type_month_year.ext
Example: TCS_standalone_sep_2024.pdf
"""

import argparse
import os
import re
import shutil
from pathlib import Path


QUARTERS = {
    'q1': 'jun', 'june': 'jun', 'jun': 'jun',
    'q2': 'sep', 'september': 'sep', 'sept': 'sep', 'sep': 'sep',
    'q3': 'dec', 'december': 'dec', 'dec': 'dec',
    'q4': 'mar', 'march': 'mar', 'mar': 'mar',
}

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']


def parse_filename(filename):
    """
    Try to extract symbol, type, quarter, and year from filename

    Returns:
        dict with 'symbol', 'type', 'month', 'year' or None
    """
    basename = os.path.basename(filename)
    name_lower = basename.lower()

    result = {}

    # Extract year (4 digits)
    year_match = re.search(r'(20\d{2})', basename)
    if year_match:
        result['year'] = year_match.group(1)

    # Extract quarter or month
    for q_name, month in QUARTERS.items():
        if q_name in name_lower:
            result['month'] = month
            break

    if 'month' not in result:
        for month in MONTHS:
            if month in name_lower:
                result['month'] = month
                break

    # Extract type
    if 'standalone' in name_lower or 'stand' in name_lower:
        result['type'] = 'standalone'
    elif 'consolidated' in name_lower or 'consol' in name_lower:
        result['type'] = 'consolidated'

    return result if result else None


def generate_standard_name(symbol, file_type, month, year, extension):
    """
    Generate standardized filename

    Args:
        symbol: Stock symbol (e.g., 'TCS')
        file_type: 'standalone' or 'consolidated'
        month: Month abbreviation (e.g., 'sep')
        year: Year (e.g., '2024')
        extension: File extension with dot (e.g., '.pdf')

    Returns:
        Standardized filename
    """
    symbol = symbol.upper()
    file_type = file_type.lower()
    month = month.lower()

    return f'{symbol}_{file_type}_{month}_{year}{extension}'


def organize_file(file_path, symbol=None, file_type=None, month=None, year=None, dry_run=False):
    """
    Organize a single file

    Args:
        file_path: Path to file
        symbol: Stock symbol (will prompt if not provided)
        file_type: 'standalone' or 'consolidated' (will prompt if not provided)
        month: Month abbreviation (will prompt if not provided)
        year: Year (will prompt if not provided)
        dry_run: If True, only print what would be done

    Returns:
        New filename or None
    """
    if not os.path.exists(file_path):
        print(f'❌ File not found: {file_path}')
        return None

    # Get file extension
    extension = Path(file_path).suffix

    # Try to extract metadata from filename
    auto_metadata = parse_filename(file_path)

    # Prompt for missing metadata
    if not symbol:
        symbol = auto_metadata.get('symbol') if auto_metadata else None
        if not symbol:
            symbol = input('Enter stock symbol (e.g., TCS): ').strip().upper()

    if not file_type:
        file_type = auto_metadata.get('type') if auto_metadata else None
        if not file_type:
            print('Select type:')
            print('  1. Standalone')
            print('  2. Consolidated')
            choice = input('Choice [1/2]: ').strip()
            file_type = 'standalone' if choice == '1' else 'consolidated'

    if not month:
        month = auto_metadata.get('month') if auto_metadata else None
        if not month:
            month = input('Enter quarter month (jun/sep/dec/mar): ').strip().lower()
            if month in QUARTERS:
                month = QUARTERS[month]

    if not year:
        year = auto_metadata.get('year') if auto_metadata else None
        if not year:
            year = input('Enter year (e.g., 2024): ').strip()

    # Validate inputs
    if not all([symbol, file_type, month, year]):
        print('❌ Missing required metadata')
        return None

    # Generate new filename
    new_name = generate_standard_name(symbol, file_type, month, year, extension)
    new_path = os.path.join(os.path.dirname(file_path), new_name)

    # Check if already has correct name
    if os.path.basename(file_path) == new_name:
        print(f'✅ Already correctly named: {new_name}')
        return file_path

    # Check if target exists
    if os.path.exists(new_path):
        print(f'⚠️  Target file already exists: {new_name}')
        overwrite = input('Overwrite? [y/N]: ').strip().lower()
        if overwrite != 'y':
            return None

    if dry_run:
        print(f'Would rename: {os.path.basename(file_path)} -> {new_name}')
    else:
        shutil.move(file_path, new_path)
        print(f'✅ Renamed: {os.path.basename(file_path)} -> {new_name}')

    return new_path


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Organize manually downloaded financial result files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Interactive mode
    ./scripts/organize_xbrl_files.py xbrl/downloaded.pdf

    # With metadata
    ./scripts/organize_xbrl_files.py xbrl/file.pdf --symbol TCS --month sep --year 2024 --type standalone

    # Batch mode
    ./scripts/organize_xbrl_files.py --dir xbrl/ --dry-run
        """
    )

    parser.add_argument('file', nargs='?', help='File to organize')
    parser.add_argument('--dir', dest='directory', help='Organize all files in directory')
    parser.add_argument('--symbol', help='Stock symbol (e.g., TCS)')
    parser.add_argument('--type', dest='file_type', choices=['standalone', 'consolidated'], help='File type')
    parser.add_argument('--month', help='Quarter month (jun/sep/dec/mar)')
    parser.add_argument('--year', help='Year (e.g., 2024)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without doing it')
    parser.add_argument('--auto', action='store_true', help='Automatically process files without prompting')

    args = parser.parse_args()

    if args.directory:
        # Batch mode
        directory = Path(args.directory)
        if not directory.exists():
            print(f'❌ Directory not found: {args.directory}')
            return 1

        files = list(directory.glob('*'))
        files = [f for f in files if f.is_file() and f.suffix in ['.pdf', '.xml', '.xlsx', '.xls']]

        if not files:
            print(f'No files found in {args.directory}')
            return 0

        print(f'Found {len(files)} files to organize\n')

        for file_path in files:
            print(f'\nProcessing: {file_path.name}')

            if args.auto:
                # Try to extract metadata automatically
                metadata = parse_filename(file_path.name)
                if metadata and len(metadata) >= 3:
                    organize_file(
                        str(file_path),
                        symbol=metadata.get('symbol') or args.symbol,
                        file_type=metadata.get('type') or args.file_type,
                        month=metadata.get('month') or args.month,
                        year=metadata.get('year') or args.year,
                        dry_run=args.dry_run
                    )
                else:
                    print(f'⚠️  Cannot auto-extract metadata, skipping')
            else:
                # Interactive mode
                organize_file(
                    str(file_path),
                    symbol=args.symbol,
                    file_type=args.file_type,
                    month=args.month,
                    year=args.year,
                    dry_run=args.dry_run
                )

    elif args.file:
        # Single file mode
        organize_file(
            args.file,
            symbol=args.symbol,
            file_type=args.file_type,
            month=args.month,
            year=args.year,
            dry_run=args.dry_run
        )

    else:
        parser.print_help()
        return 1

    return 0


if __name__ == '__main__':
    try:
        exit(main())
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        exit(1)
    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        exit(1)
