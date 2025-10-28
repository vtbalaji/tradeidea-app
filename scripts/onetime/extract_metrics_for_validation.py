#!/usr/bin/env python3
"""
Extract key metrics for validation against external sources
"""

import sys
import os
import json

# Add paths
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'analysis'))
sys.path.insert(0, os.path.join(current_dir, 'forensics'))
sys.path.insert(0, os.path.join(current_dir, 'shared'))

from analysis.enhanced_company_report_v2 import EnhancedCompanyReportV2

def extract_metrics(symbol, sector):
    """Extract key metrics for a company"""
    print(f'\n{"="*80}')
    print(f'📊 Extracting metrics for {symbol} ({sector} sector)...')
    print(f'{"="*80}')

    report_gen = EnhancedCompanyReportV2()

    try:
        # Get forensic data (without full report)
        forensic = report_gen.analyzer.analyze_company(symbol, statement_type='auto', years=5)

        if not forensic:
            print(f'❌ No data found for {symbol}')
            return None

        fund_data = forensic.get('_loaded_data', [])

        if not fund_data or len(fund_data) == 0:
            print(f'❌ No fundamental data for {symbol}')
            return None

        latest = fund_data[0]

        metrics = {
            'Symbol': symbol,
            'FY': latest.get('fy', 'N/A'),
            'Revenue (Cr)': round((latest.get('raw_revenue', 0) or 0) / 10000000, 2),
            'Net Profit (Cr)': round((latest.get('raw_net_profit', 0) or 0) / 10000000, 2),
            'EPS (Rs)': round(latest.get('raw_eps', 0) or 0, 2),
            'Book Value (Rs)': round(latest.get('raw_book_value', 0) or 0, 2),
            'ROE (%)': round(latest.get('roe', 0) or 0, 2),
            'Debt/Equity': round(latest.get('debt_to_equity', 0) or 0, 2),
            'Current Ratio': round(latest.get('current_ratio', 0) or 0, 2),
            'Operating Profit Margin (%)': round(latest.get('operating_profit_margin', 0) or 0, 2),
            'Net Profit Margin (%)': round(latest.get('net_profit_margin', 0) or 0, 2),
            'Total Assets (Cr)': round((latest.get('raw_assets', 0) or 0) / 10000000, 2),
            'Total Equity (Cr)': round((latest.get('raw_equity', 0) or 0) / 10000000, 2)
        }

        print(f'\n✅ Extracted metrics for {symbol} (FY{metrics["FY"]}):')
        print(f'{"─"*80}')
        for key, value in metrics.items():
            if key not in ['Symbol', 'FY']:
                print(f'  {key:<35} {value:>15}')
        print(f'{"─"*80}')

        return metrics

    except Exception as e:
        print(f'❌ Error processing {symbol}: {e}')
        import traceback
        traceback.print_exc()
        return None
    finally:
        report_gen.close()


def main():
    companies = [
        ('TCS', 'IT'),
        ('HDFCBANK', 'BANKING'),
        ('RELIANCE', 'FMCG')
    ]

    results = {}

    for symbol, sector in companies:
        metrics = extract_metrics(symbol, sector)
        if metrics:
            results[symbol] = metrics

    # Save results
    output_file = 'validation_metrics.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f'\n{"="*80}')
    print(f'✅ Metrics saved to: {output_file}')
    print(f'{"="*80}\n')

    return results


if __name__ == '__main__':
    main()
