#!/usr/bin/env python3
"""
Multi-Source Data Loader for Forensic Analysis

Intelligently combines XBRL and Yahoo Finance data to provide the highest
quality financial data for forensic analysis.

Strategy:
1. Try XBRL first (most accurate when available)
2. Score XBRL quality (0-100)
3. If XBRL score < 80, try Yahoo fallback
4. Merge sources, preferring higher quality data
5. Track data source for transparency

Usage:
    from multi_source_loader import MultiSourceDataLoader

    loader = MultiSourceDataLoader()
    data = loader.get_annual_data('TCS', years=5)
    # Returns validated, high-quality data from best source
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

from data_loader import ForensicDataLoader


class DataQualityScorer:
    """Calculate quality scores for different data sources"""

    # Sector-specific quality thresholds
    SECTOR_CONFIG = {
        'Banking': {
            'min_quality': 70,  # Lower bar due to XBRL limitations
            'preferred_source': 'yahoo',  # Prefer Yahoo for banks
            'critical_fields': ['raw_assets', 'raw_equity', 'raw_net_profit'],
        },
        'IT Services': {
            'min_quality': 90,  # High bar - XBRL is excellent
            'preferred_source': 'xbrl',
            'critical_fields': ['raw_revenue', 'raw_net_profit', 'raw_assets', 'raw_operating_cash_flow'],
        },
        'Manufacturing': {
            'min_quality': 85,
            'preferred_source': 'xbrl',
            'critical_fields': ['raw_revenue', 'raw_net_profit', 'raw_assets'],
        },
        'Conglomerate': {
            'min_quality': 75,  # XBRL often incomplete
            'preferred_source': 'yahoo',
            'critical_fields': ['raw_revenue', 'raw_net_profit', 'raw_assets'],
        },
    }

    def __init__(self):
        self.banking_symbols = [
            'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK',
            'INDUSINDBK', 'FEDERALBNK', 'BANDHANBNK', 'PNB', 'BANKBARODA',
            'IDFCFIRSTB', 'RBLBANK', 'YESBANK'
        ]

        self.conglomerate_symbols = [
            'RELIANCE', 'TATA', 'ADANI', 'TATASTEEL', 'ADANIPORTS',
            'ADANIGREEN', 'ADANIENT', 'TATAMOTORS', 'TATAPOWER'
        ]

    def detect_sector(self, symbol):
        """Detect sector based on symbol"""
        symbol_upper = symbol.upper()

        if symbol_upper in self.banking_symbols:
            return 'Banking'
        elif symbol_upper in self.conglomerate_symbols:
            return 'Conglomerate'
        elif symbol_upper in ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'LTTS', 'COFORGE']:
            return 'IT Services'
        else:
            return 'Manufacturing'  # Default

    def score_xbrl_data(self, data, symbol):
        """
        Calculate quality score for XBRL data (0-100)

        Args:
            data: Dict with XBRL data
            symbol: Stock symbol

        Returns:
            Quality score (0-100)
        """
        if not data:
            return 0

        sector = self.detect_sector(symbol)
        config = self.SECTOR_CONFIG.get(sector, self.SECTOR_CONFIG['Manufacturing'])

        score = 100

        # Check critical fields
        for field in config['critical_fields']:
            if not data.get(field) or data.get(field) == 0:
                score -= 25  # Heavy penalty for missing critical field

        # Check optional fields
        optional_checks = {
            'raw_operating_cash_flow': 10,
            'raw_depreciation': 5,
            'raw_equity': 10,
            'raw_current_assets': 5,
            'market_cap': 10,
        }

        for field, penalty in optional_checks.items():
            if not data.get(field) or data.get(field) == 0:
                score -= penalty

        # Bonus for complete data
        if data.get('raw_eps') and data['raw_eps'] != 0:
            score += 5
        if data.get('market_cap') and data['market_cap'] > 0:
            score += 5

        return max(0, min(100, score))

    def score_yahoo_data(self, data):
        """
        Calculate quality score for Yahoo data (0-100)

        Yahoo data is generally complete but less granular than XBRL
        """
        if not data:
            return 0

        # Yahoo quality score is stored in the data
        return data.get('data_quality_score', 80)  # Default 80 if not set

    def get_preferred_source(self, symbol):
        """Get preferred data source for this symbol's sector"""
        sector = self.detect_sector(symbol)
        config = self.SECTOR_CONFIG.get(sector, self.SECTOR_CONFIG['Manufacturing'])
        return config['preferred_source']


class MultiSourceDataLoader(ForensicDataLoader):
    """Load data from XBRL + Yahoo with intelligent fallback"""

    def __init__(self, db_path=None):
        """Initialize multi-source loader"""
        super().__init__(db_path)
        self.scorer = DataQualityScorer()

    def get_yahoo_annual_data(self, symbol, fy):
        """
        Get annual data from Yahoo Finance quarterly enrichment table
        by aggregating 4 quarters for the target FY
        """
        try:
            # Get all quarters for this FY from Yahoo enrichment table
            result = self.conn.execute("""
                SELECT * FROM yahoo_quarterly_enrichment
                WHERE symbol = ? AND fy = ?
                ORDER BY quarter
            """, [symbol, fy]).fetchall()

            if not result or len(result) < 4:
                return None  # Need all 4 quarters for annual data

            columns = [desc[0] for desc in self.conn.description]

            # Convert to dicts
            quarters = []
            for row in result:
                quarters.append(dict(zip(columns, row)))

            # Use latest quarter for balance sheet (point-in-time)
            latest_quarter = quarters[-1]

            # Aggregate P&L items (sum all 4 quarters)
            annual_data = {
                'symbol': symbol,
                'fy': fy,
                'quarter': 'ANNUAL',
                'statement_type': 'consolidated',  # Yahoo is usually consolidated
                'end_date': latest_quarter['end_date'],
                'is_annual': True,
                'data_source': 'Yahoo',
                'quality_score': latest_quarter.get('data_quality_score', 80),

                # Sum P&L items
                'raw_revenue': sum(q.get('yahoo_total_revenue') or 0 for q in quarters),
                'raw_net_profit': sum(q.get('yahoo_net_income') or 0 for q in quarters),
                'raw_operating_profit': sum(q.get('yahoo_operating_income') or 0 for q in quarters),
                'raw_ebitda': sum(q.get('yahoo_ebitda') or 0 for q in quarters),
                'raw_operating_expenses': sum(q.get('yahoo_operating_expense') or 0 for q in quarters),
                'raw_finance_costs': sum(q.get('yahoo_interest_expense') or 0 for q in quarters),
                'raw_tax_expense': sum(q.get('yahoo_tax_provision') or 0 for q in quarters),

                # Sum cash flows
                'raw_operating_cash_flow': sum(q.get('yahoo_operating_cf') or 0 for q in quarters),
                'raw_investing_cash_flow': sum(q.get('yahoo_investing_cf') or 0 for q in quarters),
                'raw_financing_cash_flow': sum(q.get('yahoo_financing_cf') or 0 for q in quarters),

                # Use latest quarter's balance sheet (point-in-time)
                'raw_assets': latest_quarter.get('yahoo_total_assets'),
                'raw_current_assets': latest_quarter.get('yahoo_current_assets'),
                'raw_equity': latest_quarter.get('yahoo_stockholders_equity'),
                'raw_current_liabilities': latest_quarter.get('yahoo_current_liabilities'),
                'raw_total_debt': latest_quarter.get('yahoo_total_debt'),
                'raw_cash_and_equivalents': latest_quarter.get('yahoo_cash'),
                'raw_trade_receivables': latest_quarter.get('yahoo_receivables'),
                'raw_inventories': latest_quarter.get('yahoo_inventory'),

                # Market data
                'raw_number_of_shares': latest_quarter.get('yahoo_shares_outstanding'),
                'market_cap': latest_quarter.get('yahoo_market_cap'),
            }

            # Calculate derived fields
            if annual_data['raw_revenue'] and annual_data['raw_operating_expenses']:
                annual_data['raw_gross_profit'] = annual_data['raw_revenue'] - annual_data['raw_operating_expenses']

            return annual_data

        except Exception as e:
            print(f"  ⚠️  Error loading Yahoo data for {symbol} {fy}: {str(e)}")
            return None

    def merge_data_sources(self, xbrl_data, yahoo_data, prefer='xbrl'):
        """
        Merge two data sources, filling gaps intelligently

        Args:
            xbrl_data: Dict from XBRL
            yahoo_data: Dict from Yahoo
            prefer: 'xbrl' or 'yahoo' - which to prefer when both have data

        Returns:
            Merged dict with data_source tracking
        """
        if not xbrl_data and not yahoo_data:
            return None

        if not xbrl_data:
            yahoo_data['data_source'] = 'Yahoo'
            return yahoo_data

        if not yahoo_data:
            return xbrl_data

        # Start with preferred source
        merged = xbrl_data.copy() if prefer == 'xbrl' else yahoo_data.copy()
        source_secondary = yahoo_data if prefer == 'xbrl' else xbrl_data

        # Track which fields came from which source
        merged['data_sources'] = {}
        filled_count = 0

        # Fill missing fields from alternate source
        for key in source_secondary:
            if key.startswith('raw_'):
                # If primary source doesn't have this field, use secondary
                if not merged.get(key) or merged[key] == 0:
                    if source_secondary.get(key) and source_secondary[key] != 0:
                        merged[key] = source_secondary[key]
                        merged['data_sources'][key] = 'yahoo' if prefer == 'xbrl' else 'xbrl'
                        filled_count += 1

        # Update data source label
        if filled_count > 0:
            merged['data_source'] = f"{prefer.upper()}+{'Yahoo' if prefer == 'xbrl' else 'XBRL'} ({filled_count} fields)"
        else:
            merged['data_source'] = prefer.upper()

        # Recalculate quality score for merged data
        merged['quality_score'] = self.scorer.score_xbrl_data(merged, merged['symbol'])

        return merged

    def get_annual_data_multi_source(self, symbol, statement_type='consolidated', years=5):
        """
        Get annual data with multi-source strategy

        Strategy (XBRL is ALWAYS primary):
        1. Try XBRL first (most accurate when available)
        2. Score XBRL quality (0-100)
        3. Decision logic:
           - XBRL >= 80%: Use XBRL only ✅
           - XBRL 60-80%: Use XBRL + enrich with Yahoo to fill gaps
           - XBRL < 60% or missing: Use Yahoo as fallback only
        4. Track data source for full transparency

        Returns:
            List of annual data dicts with quality scores and source tracking
        """
        print(f'  📊 Loading multi-source data for {symbol}...')

        # Try XBRL first
        xbrl_data = self.get_annual_data(symbol, statement_type, years)

        # Get sector and preferred source
        sector = self.scorer.detect_sector(symbol)
        preferred_source = self.scorer.get_preferred_source(symbol)

        print(f'     Sector: {sector}, Preferred source: {preferred_source.upper()}')

        annual_results = []

        for year_idx in range(years):
            # Get XBRL data for this year
            xbrl_year = xbrl_data[year_idx] if xbrl_data and year_idx < len(xbrl_data) else None

            # Score XBRL quality
            xbrl_score = self.scorer.score_xbrl_data(xbrl_year, symbol) if xbrl_year else 0

            # Get FY for this year
            if xbrl_year:
                fy = xbrl_year['fy']
            else:
                # Calculate FY based on current year and offset
                import datetime
                current_year = datetime.datetime.now().year
                target_year = current_year - year_idx
                fy = f'FY{target_year}'

            # Decision logic - XBRL is ALWAYS primary, Yahoo is fallback only
            yahoo_year = None
            yahoo_score = 0

            # Use XBRL if quality is good (>= 80%)
            if xbrl_score >= 80 and xbrl_year:
                # XBRL is good - use it
                xbrl_year['data_source'] = 'XBRL'
                xbrl_year['quality_score'] = xbrl_score
                annual_results.append(xbrl_year)

            elif xbrl_score >= 60 and xbrl_year:
                # XBRL is acceptable (60-80%) - try to enrich with Yahoo
                yahoo_year = self.get_yahoo_annual_data(symbol, fy)
                yahoo_score = self.scorer.score_yahoo_data(yahoo_year) if yahoo_year else 0

                if yahoo_score >= 80:
                    # Yahoo can fill gaps - merge
                    merged = self.merge_data_sources(xbrl_year, yahoo_year, prefer='xbrl')
                    annual_results.append(merged)
                else:
                    # Just use XBRL even if not perfect
                    xbrl_year['data_source'] = 'XBRL'
                    xbrl_year['quality_score'] = xbrl_score
                    annual_results.append(xbrl_year)

            elif xbrl_score >= 30 and xbrl_year:
                # XBRL has minimal data (30-60%) - old BSE format files often fall here
                # They have revenue & profit but missing balance sheet (assets, equity, cash flow)
                # Use it but mark as lower quality
                xbrl_year['data_source'] = 'XBRL (limited)'
                xbrl_year['quality_score'] = xbrl_score
                annual_results.append(xbrl_year)
                print(f'     ℹ️  Using XBRL for {fy} despite low quality ({xbrl_score:.0f}%) - old BSE format')

            else:
                # XBRL is missing or very poor quality (< 30%) - use Yahoo as fallback
                yahoo_year = self.get_yahoo_annual_data(symbol, fy)
                yahoo_score = self.scorer.score_yahoo_data(yahoo_year) if yahoo_year else 0

                if yahoo_year:
                    yahoo_year['data_source'] = 'Yahoo (XBRL unavailable)'
                    yahoo_year['quality_score'] = yahoo_score
                    annual_results.append(yahoo_year)
                else:
                    # No data available for this year
                    print(f'     ⚠️  No data available for {fy}')
                    # Don't append None - just skip this year

        if annual_results:
            print(f'     ✅ Loaded {len(annual_results)} years: {[d["data_source"] for d in annual_results]}')
        else:
            print(f'     ❌ No data available')

        return annual_results if annual_results else None

    def get_normalized_timeseries_multi_source(self, symbol, statement_type='consolidated', years=5):
        """
        Get normalized time-series data with multi-source fallback

        Returns:
            List of normalized dicts with data_source and quality_score
        """
        annual_data = self.get_annual_data_multi_source(symbol, statement_type, years)

        if not annual_data:
            return None

        normalized_series = []
        for data in annual_data:
            normalized = self.normalize_data(data)
            if normalized:
                # Preserve metadata
                normalized['data_source'] = data.get('data_source', 'Unknown')
                normalized['quality_score'] = data.get('quality_score', 0)
                normalized['data_sources'] = data.get('data_sources', {})
                normalized_series.append(normalized)

        return normalized_series


# Example usage and testing
if __name__ == '__main__':
    loader = MultiSourceDataLoader()

    # Test with different sectors
    test_symbols = [
        ('TCS', 'IT Services'),
        ('HDFCBANK', 'Banking'),
        ('RELIANCE', 'Conglomerate'),
    ]

    for symbol, expected_sector in test_symbols:
        print(f'\n{"="*70}')
        print(f'Testing {symbol} ({expected_sector})')
        print(f'{"="*70}')

        data = loader.get_normalized_timeseries_multi_source(symbol, years=3)

        if data:
            print(f'\n✅ Loaded {len(data)} years of data:')
            for year_data in data:
                print(f"  {year_data['fy']}: Source={year_data['data_source']}, "
                      f"Quality={year_data['quality_score']:.1f}%, "
                      f"Revenue=₹{year_data['revenue']/10000000:.2f} Cr, "
                      f"Net Profit=₹{year_data['net_profit']/10000000:.2f} Cr")
        else:
            print(f'❌ No data available for {symbol}')

    loader.close()
