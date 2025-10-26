#!/usr/bin/env python3
"""
Top 50 Companies Data Quality Test

Tests multi-source data loading (XBRL + Yahoo) for top 50 companies
and generates comprehensive validation report.
"""

import sys
import os
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

from multi_source_loader import MultiSourceDataLoader, DataQualityScorer
from data_validator import DataValidator


def test_top50():
    """Test data loading for top 50 companies"""

    # Read top 50 symbols
    top_50_file = os.path.join(os.getcwd(), 'top_50_symbols.txt')
    with open(top_50_file, 'r') as f:
        symbols = [line.strip() for line in f if line.strip()]

    print('\n' + '='*100)
    print('🔍 TOP 50 COMPANIES - MULTI-SOURCE DATA QUALITY TEST')
    print('='*100)
    print(f'\nTesting {len(symbols)} companies')
    print(f'Test Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('\nStrategy:')
    print('  1. XBRL >= 80% quality: Use XBRL only ✅')
    print('  2. XBRL 60-80% quality: Enrich with Yahoo')
    print('  3. XBRL < 60% or missing: Use Yahoo fallback')

    loader = MultiSourceDataLoader()
    validator = DataValidator()
    scorer = DataQualityScorer()

    results = []

    print(f'\n{"="*100}')
    print(f'{"Rank":<6} {"Symbol":<15} {"Sector":<15} {"Years":<8} {"Source(s)":<40} {"Avg Quality":<12}')
    print(f'{"-"*100}')

    for i, symbol in enumerate(symbols, 1):
        try:
            # Detect sector
            sector = scorer.detect_sector(symbol)

            # Load data
            data = loader.get_normalized_timeseries_multi_source(symbol, 'consolidated', years=2)

            if not data:
                print(f'{i:<6} {symbol:<15} {sector:<15} {"0":<8} {"No data available":<40} {"N/A":<12}')
                results.append({
                    'rank': i,
                    'symbol': symbol,
                    'sector': sector,
                    'years_loaded': 0,
                    'sources': [],
                    'avg_quality': 0,
                    'status': 'NO_DATA'
                })
                continue

            # Calculate stats
            sources = [d.get('data_source', 'Unknown') for d in data]
            qualities = [d.get('quality_score', 0) for d in data]
            avg_quality = sum(qualities) / len(qualities) if qualities else 0

            # Count source types
            xbrl_count = sum(1 for s in sources if 'XBRL' in s and 'Yahoo' not in s)
            yahoo_count = sum(1 for s in sources if 'Yahoo' in s and 'XBRL' not in s)
            hybrid_count = sum(1 for s in sources if 'XBRL' in s and 'Yahoo' in s)

            source_summary = []
            if xbrl_count > 0:
                source_summary.append(f'XBRL×{xbrl_count}')
            if yahoo_count > 0:
                source_summary.append(f'Yahoo×{yahoo_count}')
            if hybrid_count > 0:
                source_summary.append(f'Hybrid×{hybrid_count}')

            source_str = ', '.join(source_summary) if source_summary else 'Unknown'

            # Status indicator
            if avg_quality >= 90:
                status_icon = '✅'
                status = 'EXCELLENT'
            elif avg_quality >= 75:
                status_icon = '⚠️'
                status = 'GOOD'
            elif avg_quality >= 60:
                status_icon = '⚠️'
                status = 'ACCEPTABLE'
            else:
                status_icon = '❌'
                status = 'POOR'

            print(f'{i:<6} {symbol:<15} {sector:<15} {len(data):<8} {source_str:<40} {status_icon} {avg_quality:>5.1f}%')

            results.append({
                'rank': i,
                'symbol': symbol,
                'sector': sector,
                'years_loaded': len(data),
                'sources': sources,
                'source_summary': source_str,
                'avg_quality': avg_quality,
                'status': status,
                'xbrl_count': xbrl_count,
                'yahoo_count': yahoo_count,
                'hybrid_count': hybrid_count
            })

        except Exception as e:
            print(f'{i:<6} {symbol:<15} {sector if "sector" in locals() else "Unknown":<15} {"ERROR":<8} {str(e)[:40]:<40} {"N/A":<12}')
            results.append({
                'rank': i,
                'symbol': symbol,
                'sector': sector if 'sector' in locals() else 'Unknown',
                'years_loaded': 0,
                'sources': [],
                'avg_quality': 0,
                'status': 'ERROR',
                'error': str(e)
            })

    loader.close()

    # Generate summary statistics
    print(f'\n{"="*100}')
    print('📊 SUMMARY STATISTICS')
    print(f'{"="*100}')

    total_companies = len(results)
    companies_with_data = sum(1 for r in results if r['years_loaded'] > 0)
    companies_no_data = sum(1 for r in results if r['years_loaded'] == 0)

    total_xbrl_years = sum(r.get('xbrl_count', 0) for r in results)
    total_yahoo_years = sum(r.get('yahoo_count', 0) for r in results)
    total_hybrid_years = sum(r.get('hybrid_count', 0) for r in results)
    total_years = total_xbrl_years + total_yahoo_years + total_hybrid_years

    excellent_count = sum(1 for r in results if r['status'] == 'EXCELLENT')
    good_count = sum(1 for r in results if r['status'] == 'GOOD')
    acceptable_count = sum(1 for r in results if r['status'] == 'ACCEPTABLE')
    poor_count = sum(1 for r in results if r['status'] == 'POOR')

    avg_quality_all = sum(r['avg_quality'] for r in results if r['years_loaded'] > 0) / companies_with_data if companies_with_data > 0 else 0

    print(f'\n📈 Data Coverage:')
    print(f'   Companies tested: {total_companies}')
    print(f'   With data: {companies_with_data} ({companies_with_data/total_companies*100:.1f}%)')
    print(f'   No data: {companies_no_data} ({companies_no_data/total_companies*100:.1f}%)')

    print(f'\n📊 Data Sources:')
    print(f'   Total years loaded: {total_years}')
    print(f'   XBRL only: {total_xbrl_years} ({total_xbrl_years/total_years*100:.1f}%)' if total_years > 0 else '   XBRL only: 0')
    print(f'   Yahoo only: {total_yahoo_years} ({total_yahoo_years/total_years*100:.1f}%)' if total_years > 0 else '   Yahoo only: 0')
    print(f'   Hybrid (XBRL+Yahoo): {total_hybrid_years} ({total_hybrid_years/total_years*100:.1f}%)' if total_years > 0 else '   Hybrid: 0')

    print(f'\n⭐ Quality Distribution:')
    print(f'   Excellent (≥90%): {excellent_count} ({excellent_count/total_companies*100:.1f}%)')
    print(f'   Good (75-89%): {good_count} ({good_count/total_companies*100:.1f}%)')
    print(f'   Acceptable (60-74%): {acceptable_count} ({acceptable_count/total_companies*100:.1f}%)')
    print(f'   Poor (<60%): {poor_count} ({poor_count/total_companies*100:.1f}%)')

    print(f'\n🎯 Overall Quality Score: {avg_quality_all:.1f}%')

    # Sector breakdown
    print(f'\n📑 Sector Breakdown:')
    sectors = {}
    for r in results:
        sector = r['sector']
        if sector not in sectors:
            sectors[sector] = {'count': 0, 'with_data': 0, 'total_quality': 0}
        sectors[sector]['count'] += 1
        if r['years_loaded'] > 0:
            sectors[sector]['with_data'] += 1
            sectors[sector]['total_quality'] += r['avg_quality']

    for sector, stats in sorted(sectors.items(), key=lambda x: x[1]['count'], reverse=True):
        avg_q = stats['total_quality'] / stats['with_data'] if stats['with_data'] > 0 else 0
        print(f'   {sector:<20} {stats["count"]:>3} companies, {stats["with_data"]:>3} with data, avg quality: {avg_q:>5.1f}%')

    print(f'\n{"="*100}')
    print('✅ Test Complete!')
    print(f'{"="*100}\n')

    return results


if __name__ == '__main__':
    results = test_top50()
