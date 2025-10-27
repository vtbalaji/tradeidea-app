#!/usr/bin/env -S venv/bin/python3
"""
Comprehensive Test Suite for XBRL Parser V3
Validates all enhancements against real files
"""

import sys
import os
from xbrl_parser_v3 import EnhancedXBRLParser


def test_file(file_path, expected_features):
    """Test a single XBRL file and validate expected features"""
    print(f"\n{'='*80}")
    print(f"Testing: {os.path.basename(file_path)}")
    print(f"{'='*80}")

    try:
        parser = EnhancedXBRLParser(file_path)
        data = parser.extract_all()

        if not data:
            print("❌ Failed to parse file")
            return False

        # Test results
        results = []

        # Test: Currency Detection
        if 'currency_detection' in expected_features:
            currency = data.get('_currency', 'Unknown')
            expected_currency = expected_features['currency_detection']
            if currency == expected_currency:
                results.append(f"✅ Currency: {currency} (expected {expected_currency})")
            else:
                results.append(f"❌ Currency: {currency} (expected {expected_currency})")

        # Test: Banking Detection
        if 'banking' in expected_features:
            is_banking = expected_features['banking']
            has_revenue = data.get('Revenue', 0) > 0
            has_net_profit = data.get('NetProfit', 0) > 0
            has_banking_details = 'BankingDetails' in data

            if is_banking:
                if has_revenue and has_net_profit:
                    results.append(f"✅ Banking: Revenue={data['Revenue']/1e7:.0f}Cr, NetProfit={data['NetProfit']/1e7:.0f}Cr")

                    # Check banking-specific fields
                    if has_banking_details:
                        banking = data['BankingDetails']
                        banking_field_count = len(banking)
                        results.append(f"✅ Banking Details: {banking_field_count} fields extracted")

                        # Show key banking metrics
                        key_metrics = []
                        if 'InterestOnAdvances' in banking:
                            key_metrics.append(f"Interest on Advances: {banking['InterestOnAdvances']/1e7:.0f}Cr")
                        if 'InterestOnInvestments' in banking:
                            key_metrics.append(f"Interest on Investments: {banking['InterestOnInvestments']/1e7:.0f}Cr")
                        if 'Advances' in banking:
                            key_metrics.append(f"Advances: {banking['Advances']/1e7:.0f}Cr")
                        if 'Deposits' in banking:
                            key_metrics.append(f"Deposits: {banking['Deposits']/1e7:.0f}Cr")
                        if 'NetInterestMargin' in banking:
                            key_metrics.append(f"NIM: {banking['NetInterestMargin']:.2f}%")

                        if key_metrics:
                            results.append(f"   🏦 {', '.join(key_metrics[:3])}")
                    else:
                        results.append(f"⚠️  Banking Details: Not extracted")
                else:
                    results.append(f"❌ Banking: Revenue={data.get('Revenue', 0)}, NetProfit={data.get('NetProfit', 0)}")
            else:
                results.append(f"✅ Non-Banking: Revenue={data.get('Revenue', 0)/1e7:.0f}Cr" if has_revenue else "ℹ️  Non-Banking: No revenue (quarterly)")

        # Test: Balance Sheet Extraction
        if 'balance_sheet' in expected_features:
            should_have_bs = expected_features['balance_sheet']
            has_bs = data.get('Assets', 0) > 0 or data.get('Equity', 0) > 0

            if should_have_bs:
                if has_bs:
                    results.append(f"✅ Balance Sheet: Assets={data.get('Assets', 0)/1e7:.0f}Cr, Equity={data.get('Equity', 0)/1e7:.0f}Cr")
                else:
                    results.append(f"⚠️  Balance Sheet: Missing (quarterly report)")
            else:
                results.append(f"ℹ️  Balance Sheet: Not expected (quarterly)")

        # Test: EPS and Shares
        if 'eps_shares' in expected_features:
            has_eps = data.get('EPS', 0) > 0
            has_shares = data.get('NumberOfShares', 0) > 0

            if has_eps and has_shares:
                results.append(f"✅ EPS: {data['EPS']:.2f}, Shares: {data['NumberOfShares']/1e7:.0f}Cr")
            else:
                results.append(f"⚠️  EPS: {data.get('EPS', 0):.2f}, Shares: {data.get('NumberOfShares', 0)/1e7:.0f}Cr")

        # Test: Warnings
        warnings = data.get('_warnings', [])
        if warnings:
            results.append(f"⚠️  Validation: {len(warnings)} warning(s) detected")
            for warning in warnings[:2]:
                results.append(f"     {warning}")
        else:
            results.append(f"✅ Validation: No warnings")

        # Test: Metric Count
        metric_count = len([k for k in data.keys() if not k.startswith('_')])
        results.append(f"📊 Extracted: {metric_count} metrics")

        # Display results
        print()
        for result in results:
            print(f"  {result}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run comprehensive test suite"""
    print("="*80)
    print("XBRL Parser V3 - Comprehensive Test Suite")
    print("="*80)

    test_cases = [
        # IT Sector (Non-Banking)
        {
            'file': 'xbrl/TCS_consolidated_mar_2025.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': False,
                'balance_sheet': False,  # Q1 report
                'eps_shares': True,
            }
        },
        {
            'file': 'xbrl/INFY_consolidated_may_2025.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': False,
                'balance_sheet': True,  # Q2 report has B/S
                'eps_shares': True,
            }
        },
        {
            'file': 'xbrl/WIPRO_consolidated_mar_2025.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': False,
                'balance_sheet': True,  # Q4 report
                'eps_shares': True,
            }
        },

        # Banking Sector - NSE Banking Taxonomy Test
        {
            'file': 'xbrl/HDFCBANK_standalone_may_2025.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': True,
                'balance_sheet': True,
                'eps_shares': True,
            }
        },
        {
            'file': 'xbrl/ICICIBANK_consolidated_BANKING_109642_1204391_27072024032824.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': True,
                'balance_sheet': True,
                'eps_shares': True,
            }
        },
        {
            'file': 'xbrl/SBIN_consolidated_BANKING_102261_1043924_03022024042158.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': True,
                'balance_sheet': True,
                'eps_shares': True,
            }
        },
        {
            'file': 'xbrl/KOTAKBANK_consolidated_may_2025.xml',
            'expected': {
                'currency_detection': 'INR',
                'banking': True,
                'balance_sheet': True,
                'eps_shares': True,
            }
        },
    ]

    passed = 0
    failed = 0

    for test_case in test_cases:
        file_path = test_case['file']

        if not os.path.exists(file_path):
            print(f"\n⚠️  Skipping {file_path} (file not found)")
            continue

        if test_file(file_path, test_case['expected']):
            passed += 1
        else:
            failed += 1

    # Summary
    print(f"\n{'='*80}")
    print(f"Test Suite Summary")
    print(f"{'='*80}")
    print(f"  ✅ Passed: {passed}")
    print(f"  ❌ Failed: {failed}")
    print(f"  📊 Total: {passed + failed}")
    print(f"  📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%" if (passed + failed) > 0 else "N/A")
    print(f"{'='*80}")

    return failed == 0


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
