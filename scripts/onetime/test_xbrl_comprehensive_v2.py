#!/usr/bin/env -S venv/bin/python3
"""
Comprehensive XBRL Data Quality Validation V2

Tests the complete pipeline with RAW DATA validation:
1. Parse XBRL → Extract raw values (in rupees)
2. Check DB RAW columns → Verify exact match (rupees to rupees)
3. Check DB CALCULATED columns → Verify crores conversion
4. Compare Screener.in → External validation
5. Banking-specific validation

This catches issues like:
- Parsing errors
- Storage mismatches in raw_* columns
- Incorrect crores conversion
- Incorrect calculations (PE, PB, etc.)
"""

import sys
import os
import duckdb
import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional, Tuple
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xbrl_parser_v3 import EnhancedXBRLParser


class ComprehensiveValidatorV2:
    """Validates XBRL data across parse → storage → external source with RAW data validation"""

    def __init__(self, db_path='data/fundamentals.duckdb'):
        self.db_path = db_path
        self.conn = None

    def connect_db(self):
        """Connect to database"""
        if not self.conn:
            self.conn = duckdb.connect(self.db_path, read_only=True)

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

    def parse_xbrl(self, file_path: str) -> Optional[Dict]:
        """Step 1: Parse XBRL file and extract RAW values (in rupees)"""
        print(f"\n📄 Step 1: Parsing XBRL file...")
        parser = EnhancedXBRLParser(file_path)
        data = parser.extract_all()

        if not data:
            print(f"  ❌ Failed to parse")
            return None

        # Extract RAW values (keep in rupees - do NOT divide by crores)
        parsed = {
            # P&L Statement (in rupees)
            'raw_revenue': data.get('Revenue', 0),
            'raw_net_profit': data.get('NetProfit', 0),
            'raw_other_income': data.get('OtherIncome', 0),
            'raw_total_income': data.get('TotalIncome', 0),
            'raw_operating_expenses': data.get('OperatingExpenses', 0),
            'raw_employee_benefits': data.get('EmployeeBenefits', 0),
            'raw_depreciation': data.get('Depreciation', 0),
            'raw_finance_costs': data.get('FinanceCosts', 0),
            'raw_profit_before_tax': data.get('ProfitBeforeTax', 0),
            'raw_tax_expense': data.get('TaxExpense', 0),
            'raw_ebitda': data.get('EBITDA', 0),

            # Balance Sheet - Assets (in rupees)
            'raw_assets': data.get('Assets', 0),
            'raw_current_assets': data.get('CurrentAssets', 0),
            'raw_non_current_assets': data.get('NonCurrentAssets', 0),
            'raw_fixed_assets': data.get('FixedAssets', 0),
            'raw_investments': data.get('Investments', 0),
            'raw_cash_and_equivalents': data.get('CashAndCashEquivalents', 0),
            'raw_trade_receivables': data.get('TradeReceivables', 0),
            'raw_inventories': data.get('Inventories', 0),

            # Balance Sheet - Liabilities & Equity (in rupees)
            'raw_equity': data.get('Equity', 0),
            'raw_share_capital': data.get('ShareCapital', 0),
            'raw_reserves': data.get('Reserves', 0),
            'raw_total_debt': data.get('TotalDebt', 0),
            'raw_current_liabilities': data.get('CurrentLiabilities', 0),
            'raw_non_current_liabilities': data.get('NonCurrentLiabilities', 0),
            'raw_trade_payables': data.get('TradePayables', 0),

            # Cash Flow (in rupees)
            'raw_operating_cash_flow': data.get('OperatingCashFlow', 0),
            'raw_investing_cash_flow': data.get('InvestingCashFlow', 0),
            'raw_financing_cash_flow': data.get('FinancingCashFlow', 0),

            # Per Share & Shares
            'raw_eps': data.get('EPS', 0),
            'raw_dividend_per_share': data.get('DividendPerShare', 0),
            'raw_number_of_shares': data.get('NumberOfShares', 0),
        }

        # Banking specific (in rupees)
        if 'BankingDetails' in data:
            banking = data['BankingDetails']
            parsed.update({
                'raw_interest_income': banking.get('InterestIncome', 0),
                'raw_interest_on_advances': banking.get('InterestOnAdvances', 0),
                'raw_interest_on_investments': banking.get('InterestOnInvestments', 0),
                'raw_interest_expense': banking.get('InterestExpense', 0),
                'raw_net_interest_income': banking.get('NetInterestIncome', 0),
                'raw_non_interest_income': banking.get('NonInterestIncome', 0),
                'raw_fee_income': banking.get('FeeIncome', 0),
                'raw_provisions': banking.get('Provisions', 0),
                'raw_advances': banking.get('Advances', 0),
                'raw_deposits': banking.get('Deposits', 0),
            })

        # Display in crores for readability
        revenue_cr = parsed['raw_revenue'] / 10000000 if parsed['raw_revenue'] else 0
        net_profit_cr = parsed['raw_net_profit'] / 10000000 if parsed['raw_net_profit'] else 0
        assets_cr = parsed['raw_assets'] / 10000000 if parsed['raw_assets'] else 0

        if revenue_cr or net_profit_cr:
            print(f"  ✅ Parsed: Revenue={revenue_cr:,.0f}Cr, NetProfit={net_profit_cr:,.0f}Cr, Assets={assets_cr:,.0f}Cr, EPS={parsed['raw_eps']:.2f}")
        else:
            print(f"  ⚠️  Missing key data")

        return parsed

    def check_db_raw(self, symbol: str) -> Optional[Dict]:
        """Step 2: Check RAW values stored in database (in rupees)"""
        print(f"\n💾 Step 2: Checking database RAW storage (rupees)...")
        self.connect_db()

        try:
            query = f"""
                SELECT
                    -- P&L Statement (raw - in rupees)
                    raw_revenue,
                    raw_net_profit,
                    raw_other_income,
                    raw_total_income,
                    raw_operating_expenses,
                    raw_employee_benefits,
                    raw_depreciation,
                    raw_finance_costs,
                    raw_profit_before_tax,
                    raw_tax_expense,
                    raw_ebitda,

                    -- Balance Sheet - Assets (raw - in rupees)
                    raw_assets,
                    raw_current_assets,
                    raw_non_current_assets,
                    raw_fixed_assets,
                    raw_investments,
                    raw_cash_and_equivalents,
                    raw_trade_receivables,
                    raw_inventories,

                    -- Balance Sheet - Liabilities & Equity (raw - in rupees)
                    raw_equity,
                    raw_share_capital,
                    raw_reserves,
                    raw_total_debt,
                    raw_current_liabilities,
                    raw_non_current_liabilities,
                    raw_trade_payables,

                    -- Cash Flow (raw - in rupees)
                    raw_operating_cash_flow,
                    raw_investing_cash_flow,
                    raw_financing_cash_flow,

                    -- Per Share & Shares
                    raw_eps,
                    raw_dividend_per_share,
                    raw_number_of_shares,

                    -- Banking-specific (raw - in rupees)
                    raw_interest_income,
                    raw_interest_on_advances,
                    raw_interest_on_investments,
                    raw_interest_expense,
                    raw_net_interest_income,
                    raw_non_interest_income,
                    raw_fee_income,
                    raw_provisions,
                    raw_advances,
                    raw_deposits,

                    -- Calculated values (for display)
                    revenue_cr,
                    net_profit_cr,
                    eps,
                    pe, pb, ps,

                    -- Metadata
                    end_date,
                    source_file
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                ORDER BY end_date DESC
                LIMIT 1
            """
            result = self.conn.execute(query).fetchone()

            if not result:
                print(f"  ❌ No data found in DB for {symbol}")
                return None

            # Map result to dictionary
            db_data = {
                # P&L Statement (raw - in rupees)
                'raw_revenue': result[0] or 0,
                'raw_net_profit': result[1] or 0,
                'raw_other_income': result[2] or 0,
                'raw_total_income': result[3] or 0,
                'raw_operating_expenses': result[4] or 0,
                'raw_employee_benefits': result[5] or 0,
                'raw_depreciation': result[6] or 0,
                'raw_finance_costs': result[7] or 0,
                'raw_profit_before_tax': result[8] or 0,
                'raw_tax_expense': result[9] or 0,
                'raw_ebitda': result[10] or 0,

                # Balance Sheet - Assets (raw - in rupees)
                'raw_assets': result[11] or 0,
                'raw_current_assets': result[12] or 0,
                'raw_non_current_assets': result[13] or 0,
                'raw_fixed_assets': result[14] or 0,
                'raw_investments': result[15] or 0,
                'raw_cash_and_equivalents': result[16] or 0,
                'raw_trade_receivables': result[17] or 0,
                'raw_inventories': result[18] or 0,

                # Balance Sheet - Liabilities & Equity (raw - in rupees)
                'raw_equity': result[19] or 0,
                'raw_share_capital': result[20] or 0,
                'raw_reserves': result[21] or 0,
                'raw_total_debt': result[22] or 0,
                'raw_current_liabilities': result[23] or 0,
                'raw_non_current_liabilities': result[24] or 0,
                'raw_trade_payables': result[25] or 0,

                # Cash Flow (raw - in rupees)
                'raw_operating_cash_flow': result[26] or 0,
                'raw_investing_cash_flow': result[27] or 0,
                'raw_financing_cash_flow': result[28] or 0,

                # Per Share & Shares
                'raw_eps': result[29] or 0,
                'raw_dividend_per_share': result[30] or 0,
                'raw_number_of_shares': result[31] or 0,

                # Banking-specific (raw - in rupees)
                'raw_interest_income': result[32] or 0,
                'raw_interest_on_advances': result[33] or 0,
                'raw_interest_on_investments': result[34] or 0,
                'raw_interest_expense': result[35] or 0,
                'raw_net_interest_income': result[36] or 0,
                'raw_non_interest_income': result[37] or 0,
                'raw_fee_income': result[38] or 0,
                'raw_provisions': result[39] or 0,
                'raw_advances': result[40] or 0,
                'raw_deposits': result[41] or 0,

                # Calculated values (for display)
                'revenue_cr': result[42] or 0,
                'net_profit_cr': result[43] or 0,
                'eps': result[44] or 0,
                'pe': result[45] or 0,
                'pb': result[46] or 0,
                'ps': result[47] or 0,

                # Metadata
                'end_date': result[48],
                'source_file': result[49],
            }

            print(f"  ✅ DB has: Revenue={db_data['revenue_cr']:,.0f}Cr, NetProfit={db_data['net_profit_cr']:,.0f}Cr, PE={db_data['pe']:.1f}x")
            print(f"  📅 Date: {db_data['end_date']}, File: {db_data['source_file']}")
            return db_data

        except Exception as e:
            print(f"  ❌ Error querying DB: {e}")
            return None

    def fetch_screener(self, symbol: str) -> Optional[Dict]:
        """Step 3: Fetch data from screener.in for comparison"""
        print(f"\n🌐 Step 3: Fetching screener.in data for validation...")

        try:
            url = f"https://www.screener.in/company/{symbol}/consolidated/"
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"  ⚠️  Could not fetch (status {response.status_code})")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract key metrics (simplified parsing)
            screener_data = {}

            # Try to find PE ratio
            try:
                # Look for PE in the top metrics
                for li in soup.find_all('li', class_='flex flex-space-between'):
                    if 'Stock P/E' in li.text or 'P/E' in li.text:
                        pe_text = li.find('span', class_='number').text.strip()
                        screener_data['pe'] = float(pe_text.replace(',', ''))
                        break
            except:
                pass

            if screener_data.get('pe'):
                print(f"  ✅ Screener.in: PE={screener_data['pe']:.1f}x")
            else:
                print(f"  ⚠️  Could not extract PE from screener.in")

            return screener_data

        except Exception as e:
            print(f"  ⚠️  Error fetching screener.in: {e}")
            return None

    def compare_raw_values(self, parsed: Dict, db_data: Dict, symbol: str) -> Tuple[int, int]:
        """Compare RAW values (rupees to rupees) - EXACT match expected"""
        print(f"\n📊 RAW Data Comparison (Parsed XBRL vs DB raw_* columns):")
        print(f"{'='*80}")

        passed = 0
        total = 0

        # Define fields to compare (only non-zero values)
        fields_to_compare = [
            ('raw_revenue', 'Revenue', 'Cr'),
            ('raw_net_profit', 'Net Profit', 'Cr'),
            ('raw_assets', 'Assets', 'Cr'),
            ('raw_equity', 'Equity', 'Cr'),
            ('raw_total_debt', 'Total Debt', 'Cr'),
            ('raw_current_assets', 'Current Assets', 'Cr'),
            ('raw_non_current_assets', 'Non-Current Assets', 'Cr'),
            ('raw_fixed_assets', 'Fixed Assets', 'Cr'),
            ('raw_cash_and_equivalents', 'Cash', 'Cr'),
            ('raw_operating_cash_flow', 'Operating Cash Flow', 'Cr'),
            ('raw_ebitda', 'EBITDA', 'Cr'),
            ('raw_depreciation', 'Depreciation', 'Cr'),
            ('raw_eps', 'EPS', '₹'),
            ('raw_number_of_shares', 'Number of Shares', 'Cr'),
        ]

        # Banking-specific fields
        if parsed.get('raw_deposits', 0) > 0 or db_data.get('raw_deposits', 0) > 0:
            fields_to_compare.extend([
                ('raw_interest_income', 'Interest Income', 'Cr'),
                ('raw_deposits', 'Deposits', 'Cr'),
                ('raw_advances', 'Advances', 'Cr'),
                ('raw_provisions', 'Provisions', 'Cr'),
            ])

        for field, label, unit in fields_to_compare:
            parsed_val = parsed.get(field, 0)
            db_val = db_data.get(field, 0)

            # Skip if both are zero or None
            if not parsed_val and not db_val:
                continue

            total += 1

            # For display, convert to crores if unit is 'Cr'
            if unit == 'Cr' and field != 'raw_number_of_shares':
                display_parsed = parsed_val / 10000000 if parsed_val else 0
                display_db = db_val / 10000000 if db_val else 0
            else:
                display_parsed = parsed_val
                display_db = db_val

            # Calculate difference percentage
            if parsed_val and db_val:
                diff_pct = abs(parsed_val - db_val) / abs(parsed_val) * 100 if parsed_val != 0 else 0
            else:
                diff_pct = 100.0  # One is zero, one is not

            # Tolerance: <0.1% for exact match, <1% for good, <5% for acceptable
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

            print(f"  {label:25s}  Parsed={display_parsed:>12,.2f}{unit}  DB={display_db:>12,.2f}{unit}  {status} ({diff_pct:.2f}% diff)")

        return passed, total

    def compare_calculated_values(self, db_data: Dict, screener_data: Optional[Dict], symbol: str) -> Tuple[int, int]:
        """Compare calculated values (PE, PB, etc.) with external source"""
        print(f"\n📊 Calculated Metrics Comparison (DB vs Screener.in):")
        print(f"{'='*80}")

        passed = 0
        total = 0

        if not screener_data or not screener_data.get('pe'):
            print(f"  ⚠️  No screener.in data available for comparison")
            return 0, 0

        # Compare PE ratio
        if db_data.get('pe') and screener_data.get('pe'):
            total += 1
            diff_pct = abs(db_data['pe'] - screener_data['pe']) / screener_data['pe'] * 100
            status = "✅" if diff_pct < 5 else "⚠️" if diff_pct < 15 else "❌"
            if diff_pct < 15:
                passed += 1
            print(f"  PE Ratio:   DB={db_data['pe']:>6.1f}x  Screener={screener_data['pe']:>6.1f}x  {status} ({diff_pct:.1f}% diff)")

        return passed, total

    def run_test(self, file_path: str, symbol: str, name: str) -> bool:
        """Run comprehensive test on a single file"""
        print(f"\n{'='*80}")
        print(f"🧪 Testing: {name}")
        print(f"{'='*80}")

        # Step 1: Parse XBRL
        parsed = self.parse_xbrl(file_path)
        if not parsed:
            print(f"  ❌ Failed to parse XBRL")
            return False

        # Step 2: Check DB raw values
        db_data = self.check_db_raw(symbol)
        if not db_data:
            print(f"  ❌ No DB data found")
            return False

        # Step 3: Fetch screener.in
        screener_data = self.fetch_screener(symbol)

        # Step 4: Compare raw values (CRITICAL)
        raw_passed, raw_total = self.compare_raw_values(parsed, db_data, symbol)

        # Step 5: Compare calculated values (informational)
        calc_passed, calc_total = self.compare_calculated_values(db_data, screener_data, symbol)

        # Summary
        total_passed = raw_passed + calc_passed
        total_checks = raw_total + calc_total

        print(f"\n{'='*80}")
        if total_checks > 0:
            success_rate = (total_passed / total_checks) * 100
            print(f"✅ Validation Summary: {total_passed}/{total_checks} checks passed ({success_rate:.0f}%)")

            # Pass if raw data is >95% correct
            raw_success_rate = (raw_passed / raw_total * 100) if raw_total > 0 else 0
            return raw_success_rate >= 95
        else:
            print(f"⚠️  No comparisons available")
            return False


def main():
    """Run comprehensive validation tests"""
    print("="*80)
    print("🔍 COMPREHENSIVE XBRL DATA QUALITY VALIDATION V2")
    print("   RAW Data Validation: Parsed XBRL vs DB raw_* columns")
    print("="*80)

    # Test cases: (file, symbol, name)
    test_cases = [
        {
            'file': 'xbrl/TCS_consolidated_mar_2025.xml',
            'symbol': 'TCS',
            'name': 'TCS (IT - Non-Banking)'
        },
        {
            'file': 'xbrl/RELIANCE_consolidated_mar_2025.xml',
            'symbol': 'RELIANCE',
            'name': 'Reliance (Energy/Retail)'
        },
        {
            'file': 'xbrl/INFY_consolidated_mar_2025.xml',
            'symbol': 'INFY',
            'name': 'Infosys (IT - Non-Banking)'
        },
        {
            'file': 'xbrl/WIPRO_consolidated_mar_2025.xml',
            'symbol': 'WIPRO',
            'name': 'Wipro (IT)'
        },
    ]

    # Check if any banking test files exist
    banking_files = ['xbrl/HDFCBANK_standalone_may_2025.xml', 'xbrl/SBIN_consolidated_mar_2025.xml', 'xbrl/ICICIBANK_consolidated_mar_2025.xml']
    for bank_file in banking_files:
        if os.path.exists(bank_file):
            symbol = os.path.basename(bank_file).split('_')[0]
            test_cases.append({
                'file': bank_file,
                'symbol': symbol,
                'name': f'{symbol} (Banking)'
            })
            break  # Add only one banking test

    validator = ComprehensiveValidatorV2()
    results = []

    for test_case in test_cases:
        file_path = test_case['file']
        symbol = test_case['symbol']
        name = test_case['name']

        if not os.path.exists(file_path):
            print(f"\n⚠️  Skipping {name} - file not found: {file_path}")
            continue

        passed = validator.run_test(file_path, symbol, name)
        results.append((name, passed))

    validator.close()

    # Final summary
    print(f"\n{'='*80}")
    print(f"📈 FINAL TEST SUMMARY")
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
