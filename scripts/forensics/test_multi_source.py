#!/usr/bin/env python3
"""
Test Multi-Source Data Loading

Shows how XBRL + Yahoo fallback works for different sectors
"""

import sys
import os

# Add scripts directory to path for cross-folder imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from forensics.multi_source_loader import MultiSourceDataLoader, DataQualityScorer

def test_company(symbol, years=3):
    """Test multi-source loading for a company"""
    loader = MultiSourceDataLoader()
    scorer = DataQualityScorer()

    sector = scorer.detect_sector(symbol)
    preferred = scorer.get_preferred_source(symbol)

    print(f'\n{"="*80}')
    print(f'🏢 {symbol} - {sector} (Preferred: {preferred.upper()})')
    print(f'{"="*80}')

    # Load data
    data = loader.get_normalized_timeseries_multi_source(symbol, 'consolidated', years)

    if not data:
        print('❌ No data available')
        return

    # Display results
    print(f'\n📊 Loaded {len(data)} years:\n')
    print(f'{"FY":<10} {"Source":<20} {"Quality":<10} {"Revenue (Cr)":<15} {"Profit (Cr)":<15} {"Assets (Cr)":<15}')
    print('-' * 80)

    for year_data in data:
        fy = year_data.get('fy', 'Unknown')
        source = year_data.get('data_source', 'Unknown')
        quality = year_data.get('quality_score', 0)
        revenue = year_data.get('revenue', 0) / 10000000
        profit = year_data.get('net_profit', 0) / 10000000
        assets = year_data.get('total_assets', 0) / 10000000

        print(f'{fy:<10} {source:<20} {quality:<10.1f} {revenue:<15,.0f} {profit:<15,.0f} {assets:<15,.0f}')

    # Show data quality summary
    avg_quality = sum(d.get('quality_score', 0) for d in data) / len(data)
    sources_used = list(set(d.get('data_source', 'Unknown') for d in data))

    print(f'\n📈 Summary:')
    print(f'   Average Quality: {avg_quality:.1f}%')
    print(f'   Data Sources: {", ".join(sources_used)}')

    # Check for Yahoo fallback usage
    yahoo_count = sum(1 for d in data if 'Yahoo' in d.get('data_source', ''))
    if yahoo_count > 0:
        print(f'   ✅ Yahoo fallback used for {yahoo_count}/{len(data)} years')

    loader.close()


if __name__ == '__main__':
    # Test all three companies
    companies = ['TCS', 'HDFCBANK', 'RELIANCE']

    print('\n' + '='*80)
    print('🔍 MULTI-SOURCE DATA LOADING TEST')
    print('='*80)
    print('\nTesting XBRL + Yahoo Finance intelligent fallback')
    print('- IT Services (TCS): Should prefer XBRL')
    print('- Banking (HDFCBANK): Should use Yahoo fallback')
    print('- Conglomerate (RELIANCE): Should check both sources')

    for symbol in companies:
        test_company(symbol, years=3)

    print(f'\n{"="*80}')
    print('✅ Test complete!')
    print(f'{"="*80}\n')
