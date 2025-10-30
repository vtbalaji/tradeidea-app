#!/usr/bin/env python3
"""
Quick Investment Report Generator
Simplified wrapper around enhanced_company_report_v2.py and generate_pdf_report.py
"""

import sys
import os
import subprocess
import glob
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python quick_report.py SYMBOL [YEARS] [SECTOR]")
        print("\nExamples:")
        print("  python quick_report.py BHEL")
        print("  python quick_report.py HDFCBANK 5 BANKING")
        print("  python quick_report.py TCS 3 IT")
        print("\nAvailable Sectors:")
        print("  BANKING - For banks (HDFCBANK, ICICIBANK, SBIN, etc.)")
        print("  IT      - For IT companies (TCS, INFY, WIPRO, etc.)")
        print("  AUTO    - Auto companies (will use default analyzer)")
        print("  PHARMA  - Pharma companies (will use default analyzer)")
        sys.exit(1)

    symbol = sys.argv[1].upper()
    years = sys.argv[2] if len(sys.argv) > 2 else "3"
    sector = sys.argv[3].upper() if len(sys.argv) > 3 else None

    # Get project root
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent.parent

    print("=" * 60)
    print("Investment Report Generator")
    print("=" * 60)
    print(f"Symbol: {symbol}")
    print(f"Years: {years}")
    print(f"Sector: {sector if sector else 'Auto-detect'}")
    print("=" * 60)
    print()

    # Step 1: Generate JSON
    print("Step 1/2: Generating analysis (JSON)...")
    
    cmd = [
        sys.executable,
        str(script_dir / "enhanced_company_report_v2.py"),
        symbol,
        "--years", years,
        "--output", "json"
    ]
    
    if sector:
        cmd.extend(["--sector", sector])

    try:
        result = subprocess.run(cmd, cwd=project_root, capture_output=False, text=True)
        if result.returncode != 0:
            print(f"\n❌ Error: Analysis failed for {symbol}")
            print("Possible reasons:")
            print("  1. No data available in database")
            print("  2. Symbol name incorrect")
            print("  3. Database connection issue")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running analysis: {e}")
        sys.exit(1)

    # Find the generated JSON
    json_pattern = f"enhanced_report_v2_{symbol}_*.json"
    json_files = sorted(glob.glob(str(project_root / json_pattern)), reverse=True)
    
    if not json_files:
        print(f"\n❌ Error: JSON report not found for {symbol}")
        print(f"Expected pattern: {json_pattern}")
        sys.exit(1)

    json_file = json_files[0]
    print(f"✅ JSON generated: {Path(json_file).name}")
    print()

    # Step 2: Generate HTML
    print("Step 2/2: Generating HTML report...")
    
    cmd = [
        sys.executable,
        str(script_dir / "generate_pdf_report.py"),
        json_file
    ]

    try:
        result = subprocess.run(cmd, cwd=project_root, capture_output=False, text=True)
        if result.returncode != 0:
            print(f"\n❌ Error: HTML generation failed")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error generating HTML: {e}")
        sys.exit(1)

    # Find the generated HTML
    html_pattern = f"investment_report_{symbol}_*.html"
    html_files = sorted(glob.glob(str(project_root / html_pattern)), reverse=True)
    
    if not html_files:
        print(f"\n❌ Error: HTML report not found")
        sys.exit(1)

    html_file = html_files[0]
    html_name = Path(html_file).name

    print()
    print("=" * 60)
    print("✅ REPORT GENERATION COMPLETE")
    print("=" * 60)
    print(f"JSON Report: {Path(json_file).name}")
    print(f"HTML Report: {html_name}")
    print()
    print(f"To view: open {html_name}")
    print("=" * 60)

if __name__ == '__main__':
    main()
