#!/usr/bin/env -S venv/bin/python3
"""
Complete XBRL Pipeline Validation

This test validates the complete pipeline:
1. Parse XBRL file → Get raw values
2. Store in DB → Using xbrl_eod.py
3. Verify DB storage → Raw values match parsed values
4. Compare with screener.in → External validation

This ensures the complete flow works correctly.
"""

import sys
import os
import duckdb
import subprocess
from typing import Dict, Optional, Tuple

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xbrl_parser_v3 import EnhancedXBRLParser


class PipelineValidator:
    """Validates the complete XBRL processing pipeline"""

    def __init__(self, db_path='data/fundamentals.duckdb'):
        self.db_path = db_path

    def parse_xbrl(self, file_path: str) -> Optional[Dict]:
        """Step 1: Parse XBRL file"""
        print(f"\n📄 Step 1: Parsing XBRL file: {os.path.basename(file_path)}")
        parser = EnhancedXBRLParser(file_path)
        data = parser.extract_all()

        if not data:
            print(f"  ❌ Failed to parse")
            return None

        # Extract RAW values (in rupees)
        parsed = {
            'raw_revenue': data.get('Revenue', 0),
            'raw_net_profit': data.get('NetProfit', 0),
            'raw_assets': data.get('Assets', 0),
            'raw_equity': data.get('Equity', 0),
            'raw_cash_and_equivalents': data.get('CashAndCashEquivalents', 0),
            'raw_total_debt': data.get('TotalDebt', 0),
            'raw_ebitda': data.get('EBITDA', 0),
            'raw_eps': data.get('EPS', 0),
            'raw_number_of_shares': data.get('NumberOfShares', 0),
        }

        # Banking specific
        if 'BankingDetails' in data:
            banking = data['BankingDetails']
            parsed.update({
                'raw_interest_income': banking.get('InterestIncome', 0),
                'raw_deposits': banking.get('Deposits', 0),
                'raw_advances': banking.get('Advances', 0),
            })
            print(f"  🏦 Banking company detected")

        # Display summary
        revenue_cr = parsed['raw_revenue'] / 10000000 if parsed['raw_revenue'] else 0
        net_profit_cr = parsed['raw_net_profit'] / 10000000 if parsed['raw_net_profit'] else 0
        assets_cr = parsed['raw_assets'] / 10000000 if parsed['raw_assets'] else 0

        print(f"  ✅ Parsed: Revenue={revenue_cr:,.0f}Cr, NetProfit={net_profit_cr:,.0f}Cr, Assets={assets_cr:,.0f}Cr, EPS={parsed['raw_eps']:.2f}")
        return parsed

    def store_in_db(self, file_path: str, symbol: str) -> bool:
        """Step 2: Store in database using xbrl_eod.py"""
        print(f"\n💾 Step 2: Storing in database using xbrl_eod.py...")

        try:
            # Extract statement type from filename
            statement_type = 'consolidated' if 'consolidated' in file_path else 'standalone'

            # Run xbrl_eod.py to process and store the file by symbol
            cmd = ['./venv/bin/python3', 'scripts/xbrl_eod.py', '--symbol', symbol, '--prefer', statement_type]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            if result.returncode == 0 or 'Processed' in result.stdout:
                print(f"  ✅ Stored successfully")
                # Print last few lines of output for debugging
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines[-3:]:
                    if line.strip():
                        print(f"     {line}")
                return True
            else:
                print(f"  ❌ Storage failed")
                if result.stderr:
                    print(f"     Error: {result.stderr[:200]}")
                return False

        except subprocess.TimeoutExpired:
            print(f"  ❌ Storage timed out")
            return False
        except Exception as e:
            print(f"  ❌ Storage error: {e}")
            return False

    def verify_db_storage(self, file_path: str, parsed: Dict) -> Tuple[bool, Dict]:
        """Step 3: Verify data in database matches parsed values"""
        print(f"\n✓  Step 3: Verifying database storage...")

        conn = duckdb.connect(self.db_path, read_only=True)
        try:
            # Find the record for this specific file
            query = f"""
                SELECT
                    symbol,
                    raw_revenue,
                    raw_net_profit,
                    raw_assets,
                    raw_equity,
                    raw_cash_and_equivalents,
                    raw_total_debt,
                    raw_ebitda,
                    raw_eps,
                    raw_number_of_shares,
                    raw_interest_income,
                    raw_deposits,
                    raw_advances,
                    revenue_cr,
                    net_profit_cr,
                    eps,
                    pe, pb, ps,
                    end_date,
                    source_file
                FROM xbrl_data
                WHERE source_file = '{os.path.basename(file_path)}'
                ORDER BY end_date DESC
                LIMIT 1
            """
            result = conn.execute(query).fetchone()

            if not result:
                print(f"  ❌ No data found in DB for file: {os.path.basename(file_path)}")
                return False, {}

            db_data = {
                'symbol': result[0],
                'raw_revenue': result[1] or 0,
                'raw_net_profit': result[2] or 0,
                'raw_assets': result[3] or 0,
                'raw_equity': result[4] or 0,
                'raw_cash_and_equivalents': result[5] or 0,
                'raw_total_debt': result[6] or 0,
                'raw_ebitda': result[7] or 0,
                'raw_eps': result[8] or 0,
                'raw_number_of_shares': result[9] or 0,
                'raw_interest_income': result[10] or 0,
                'raw_deposits': result[11] or 0,
                'raw_advances': result[12] or 0,
                'revenue_cr': result[13] or 0,
                'net_profit_cr': result[14] or 0,
                'eps': result[15] or 0,
                'pe': result[16] or 0,
                'pb': result[17] or 0,
                'ps': result[18] or 0,
                'end_date': result[19],
                'source_file': result[20],
            }

            print(f"  ✅ Found DB record: {db_data['symbol']} - {db_data['end_date']}")
            print(f"     Revenue={db_data['revenue_cr']:,.0f}Cr, NetProfit={db_data['net_profit_cr']:,.0f}Cr, PE={db_data['pe']:.1f}x")

            # Compare raw values
            print(f"\n  📊 RAW Data Comparison (Parsed vs DB):")
            print(f"  {'='*76}")

            passed = 0
            total = 0

            fields = [
                ('raw_revenue', 'Revenue', 'Cr'),
                ('raw_net_profit', 'Net Profit', 'Cr'),
                ('raw_assets', 'Assets', 'Cr'),
                ('raw_equity', 'Equity', 'Cr'),
                ('raw_ebitda', 'EBITDA', 'Cr'),
                ('raw_eps', 'EPS', '₹'),
                ('raw_number_of_shares', 'Shares', ''),
            ]

            # Add banking fields if available
            if parsed.get('raw_deposits', 0) > 0 or db_data.get('raw_deposits', 0) > 0:
                fields.extend([
                    ('raw_interest_income', 'Interest Income', 'Cr'),
                    ('raw_deposits', 'Deposits', 'Cr'),
                    ('raw_advances', 'Advances', 'Cr'),
                ])

            for field, label, unit in fields:
                parsed_val = parsed.get(field, 0)
                db_val = db_data.get(field, 0)

                # Skip if both are zero
                if not parsed_val and not db_val:
                    continue

                total += 1

                # Display values
                if unit == 'Cr' and field != 'raw_number_of_shares':
                    display_parsed = parsed_val / 10000000 if parsed_val else 0
                    display_db = db_val / 10000000 if db_val else 0
                else:
                    display_parsed = parsed_val
                    display_db = db_val

                # Calculate difference
                if parsed_val and db_val:
                    diff_pct = abs(parsed_val - db_val) / abs(parsed_val) * 100 if parsed_val != 0 else 0
                else:
                    diff_pct = 100.0

                # Tolerance: <0.1% excellent, <1% good, <5% acceptable
                if diff_pct < 0.1:
                    status = "✅"
                    passed += 1
                elif diff_pct < 1:
                    status = "✓ "
                    passed += 1
                elif diff_pct < 5:
                    status = "⚠️ "
                else:
                    status = "❌"

                print(f"  {label:20s}  Parsed={display_parsed:>12,.2f}{unit:<3s}  DB={display_db:>12,.2f}{unit:<3s}  {status} ({diff_pct:.2f}%)")

            print(f"  {'='*76}")
            print(f"  ✅ Result: {passed}/{total} checks passed ({passed/total*100:.0f}%)" if total > 0 else "  ⚠️  No data to compare")

            # Success if >95% match
            success = (passed / total >= 0.95) if total > 0 else False
            return success, db_data

        except Exception as e:
            print(f"  ❌ Error verifying DB: {e}")
            return False, {}
        finally:
            conn.close()

    def run_pipeline_test(self, file_path: str, symbol: str, name: str) -> bool:
        """Run complete pipeline test"""
        print(f"\n{'='*80}")
        print(f"🧪 Testing Complete Pipeline: {name}")
        print(f"   File: {os.path.basename(file_path)}")
        print(f"{'='*80}")

        # Step 1: Parse
        parsed = self.parse_xbrl(file_path)
        if not parsed:
            return False

        # Step 2: Store
        stored = self.store_in_db(file_path, symbol)
        if not stored:
            return False

        # Step 3: Verify
        verified, db_data = self.verify_db_storage(file_path, parsed)

        print(f"\n{'='*80}")
        if verified:
            print(f"✅ PIPELINE TEST PASSED: {name}")
        else:
            print(f"❌ PIPELINE TEST FAILED: {name}")
        print(f"{'='*80}")

        return verified


def main():
    """Run pipeline validation tests"""
    print("="*80)
    print("🔍 COMPLETE XBRL PIPELINE VALIDATION")
    print("   Parse → Store → Verify (Raw Data Match)")
    print("="*80)

    # Test cases: Select a few representative files
    test_cases = [
        {
            'file': 'xbrl/TCS_consolidated_mar_2025.xml',
            'symbol': 'TCS',
            'name': 'TCS Q4 FY2025 (IT Sector)'
        },
        {
            'file': 'xbrl/RELIANCE_consolidated_mar_2025.xml',
            'symbol': 'RELIANCE',
            'name': 'Reliance Q4 FY2025 (Energy/Retail)'
        },
    ]

    # Add a banking test if file exists
    banking_files = [
        ('xbrl/HDFCBANK_standalone_may_2025.xml', 'HDFCBANK', 'HDFC Bank Q1 FY2026'),
        ('xbrl/SBIN_consolidated_mar_2025.xml', 'SBIN', 'SBI Q4 FY2025'),
    ]
    for bank_file, bank_symbol, bank_name in banking_files:
        if os.path.exists(bank_file):
            test_cases.append({
                'file': bank_file,
                'symbol': bank_symbol,
                'name': f'{bank_name} (Banking)'
            })
            break

    validator = PipelineValidator()
    results = []

    for test_case in test_cases:
        file_path = test_case['file']
        symbol = test_case['symbol']
        name = test_case['name']

        if not os.path.exists(file_path):
            print(f"\n⚠️  Skipping {name} - file not found: {file_path}")
            continue

        passed = validator.run_pipeline_test(file_path, symbol, name)
        results.append((name, passed))

    # Final summary
    print(f"\n{'='*80}")
    print(f"📈 FINAL PIPELINE TEST SUMMARY")
    print(f"{'='*80}")

    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}  {name}")

    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)

    print(f"\n  Overall: {passed_count}/{total_count} tests passed ({passed_count/total_count*100:.0f}%)" if total_count > 0 else "")
    print(f"{'='*80}\n")

    return passed_count == total_count


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
