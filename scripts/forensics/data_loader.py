#!/usr/bin/env python3
"""
Data Loader for Forensic Analysis

Loads financial data from DuckDB xbrl_data table for forensic analysis.
Provides clean, standardized data structures for all forensic models.
"""

import sys
import os
from datetime import datetime

# Add scripts directory to path for cross-folder imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from fundamental.fundamental_xbrl_storage import XBRLStorage


class ForensicDataLoader:
    """Load and prepare data for forensic analysis"""

    def __init__(self, db_path=None):
        """Initialize data loader"""
        import duckdb
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')

        # Open in read-only mode for forensic analysis
        self.conn = duckdb.connect(db_path, read_only=True)
        self.storage = None  # Not needed for read-only access

    def get_company_data(self, symbol, statement_type='standalone', years=5):
        """
        Get multi-year financial data for a company

        Args:
            symbol: Stock symbol
            statement_type: 'standalone' or 'consolidated'
            years: Number of years to retrieve

        Returns:
            List of dicts with financial data, sorted newest to oldest
        """
        # Normalize symbol to uppercase for database consistency
        symbol = symbol.upper()

        result = self.conn.execute("""
            SELECT *
            FROM xbrl_data
            WHERE symbol = ? AND statement_type = ?
            ORDER BY end_date DESC
            LIMIT ?
        """, [symbol, statement_type, years * 4]).fetchall()

        if not result:
            return None

        # Get column names
        columns = [desc[0] for desc in self.conn.description]

        # Convert to list of dicts
        data = []
        for row in result:
            row_dict = dict(zip(columns, row))
            data.append(row_dict)

        return data

    def _sum_quarters_to_annual(self, symbol, statement_type, years=5):
        """
        Sum all 4 quarters for each FY to create annual cumulative data

        Args:
            symbol: Stock symbol
            statement_type: 'standalone' or 'consolidated'
            years: Number of years

        Returns:
            List of annual aggregated data dicts
        """
        # Normalize symbol to uppercase for database consistency
        symbol = symbol.upper()

        # Get all quarters for the symbol
        result = self.conn.execute("""
            SELECT *
            FROM xbrl_data
            WHERE symbol = ?
              AND statement_type = ?
            ORDER BY fy DESC, end_date ASC
        """, [symbol, statement_type]).fetchall()

        if not result:
            return None

        columns = [desc[0] for desc in self.conn.description]

        # Group by FY
        fy_groups = {}
        for row in result:
            row_dict = dict(zip(columns, row))
            fy = row_dict['fy']
            if fy not in fy_groups:
                fy_groups[fy] = []
            fy_groups[fy].append(row_dict)

        # Aggregate each FY (only include complete years with 4 quarters)
        annual_data = []
        for fy in sorted(fy_groups.keys(), reverse=True):
            quarters = fy_groups[fy]

            # Only include if we have at least 4 quarters (complete year)
            if len(quarters) < 4:
                continue

            if len(annual_data) >= years:
                break

            # Use latest quarter's balance sheet (point-in-time data)
            latest_quarter = max(quarters, key=lambda q: q['end_date'])

            # Detect if this is a banking/financial sector company
            # Banks report cash flows differently (net basis, not cumulative)
            is_bank = symbol.upper() in ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK',
                                          'INDUSINDBK', 'FEDERALBNK', 'BANDHANBNK', 'PNB', 'BANKBARODA']

            # Helper: Find first non-null value across all quarters
            def get_first_available(field_name):
                """Get first non-null value for a field across all quarters (prioritize latest)"""
                # Check latest quarter first
                value = latest_quarter.get(field_name)
                if value is not None and value != 0:
                    return value
                # Then check all quarters
                for q in quarters:
                    value = q.get(field_name)
                    if value is not None and value != 0:
                        return value
                return None

            # Sum income statement items (cumulative)
            aggregated = {
                'symbol': symbol,
                'fy': fy,
                'quarter': 'ANNUAL',
                'statement_type': statement_type,
                'end_date': latest_quarter['end_date'],
                'start_date': min(q['start_date'] for q in quarters if q['start_date']),
                'is_annual': True,

                # Sum P&L items (these are cumulative over the year)
                'raw_revenue': sum(q['raw_revenue'] or 0 for q in quarters),
                'raw_other_income': sum(q['raw_other_income'] or 0 for q in quarters),
                'raw_total_income': sum(q['raw_total_income'] or 0 for q in quarters),
                'raw_operating_expenses': sum(q['raw_operating_expenses'] or 0 for q in quarters),
                'raw_employee_benefits': sum(q['raw_employee_benefits'] or 0 for q in quarters),
                'raw_depreciation': sum(q['raw_depreciation'] or 0 for q in quarters),
                'raw_finance_costs': sum(q['raw_finance_costs'] or 0 for q in quarters),
                'raw_operating_profit': sum(q['raw_operating_profit'] or 0 for q in quarters),
                'raw_ebitda': sum(q['raw_ebitda'] or 0 for q in quarters),
                'raw_profit_before_tax': sum(q['raw_profit_before_tax'] or 0 for q in quarters),
                'raw_tax_expense': sum(q['raw_tax_expense'] or 0 for q in quarters),
                'raw_net_profit': sum(q['raw_net_profit'] or 0 for q in quarters),

                # Cash flow items: Banks use latest quarter (net basis), others sum (cumulative)
                'raw_operating_cash_flow': (latest_quarter['raw_operating_cash_flow'] or 0) if is_bank else sum(q['raw_operating_cash_flow'] or 0 for q in quarters),
                'raw_investing_cash_flow': (latest_quarter['raw_investing_cash_flow'] or 0) if is_bank else sum(q['raw_investing_cash_flow'] or 0 for q in quarters),
                'raw_financing_cash_flow': (latest_quarter['raw_financing_cash_flow'] or 0) if is_bank else sum(q['raw_financing_cash_flow'] or 0 for q in quarters),

                # Use latest quarter's balance sheet (point-in-time)
                'raw_assets': latest_quarter['raw_assets'],
                'raw_current_assets': latest_quarter['raw_current_assets'],
                'raw_non_current_assets': latest_quarter['raw_non_current_assets'],
                'raw_fixed_assets': latest_quarter['raw_fixed_assets'],
                'raw_investments': latest_quarter['raw_investments'],
                'raw_cash_and_equivalents': latest_quarter['raw_cash_and_equivalents'],
                'raw_trade_receivables': latest_quarter['raw_trade_receivables'],
                'raw_inventories': latest_quarter['raw_inventories'],
                'raw_equity_and_liabilities': latest_quarter['raw_equity_and_liabilities'],
                'raw_equity': latest_quarter['raw_equity'],
                'raw_share_capital': latest_quarter['raw_share_capital'],
                'raw_reserves': latest_quarter['raw_reserves'],
                'raw_total_debt': latest_quarter['raw_total_debt'],
                'raw_current_liabilities': latest_quarter['raw_current_liabilities'],
                'raw_non_current_liabilities': latest_quarter['raw_non_current_liabilities'],
                'raw_trade_payables': latest_quarter['raw_trade_payables'],

                # Sum per-share P&L items (accumulated over the year)
                'raw_eps': sum(q['raw_eps'] or 0 for q in quarters),
                'raw_dividend_per_share': sum(q['raw_dividend_per_share'] or 0 for q in quarters),

                # Use latest quarter's point-in-time data (with fallback to any quarter for shares)
                'raw_number_of_shares': get_first_available('raw_number_of_shares'),
                'current_price': latest_quarter['current_price'],
                'market_cap': latest_quarter['market_cap'],
            }

            # Calculate derived fields (_cr and ratios) from raw values
            self._calculate_derived_fields(aggregated)

            annual_data.append(aggregated)

        return annual_data

    def _calculate_derived_fields(self, data):
        """
        Calculate derived fields like _cr (crores) and ratios from raw values

        Args:
            data: Dict with raw_* fields, will be modified in-place to add calculated fields
        """
        # Convert to crores (divide by 10,000,000)
        data['revenue_cr'] = round((data.get('raw_revenue') or 0) / 10000000, 2)
        data['net_profit_cr'] = round((data.get('raw_net_profit') or 0) / 10000000, 2)
        data['ebitda_cr'] = round((data.get('raw_ebitda') or 0) / 10000000, 2) if data.get('raw_ebitda') else None
        data['operating_profit_cr'] = round((data.get('raw_operating_profit') or 0) / 10000000, 2) if data.get('raw_operating_profit') else None
        data['total_assets_cr'] = round((data.get('raw_assets') or 0) / 10000000, 2)
        data['total_equity_cr'] = round((data.get('raw_equity') or 0) / 10000000, 2)
        data['total_debt_cr'] = round((data.get('raw_total_debt') or 0) / 10000000, 2) if data.get('raw_total_debt') else None
        data['cash_cr'] = round((data.get('raw_cash_and_equivalents') or 0) / 10000000, 2) if data.get('raw_cash_and_equivalents') else None
        data['shares_outstanding_cr'] = round((data.get('raw_number_of_shares') or 0) / 10000000, 2) if data.get('raw_number_of_shares') else None

        # Calculate ratios
        raw_equity = data.get('raw_equity') or 0
        raw_net_profit = data.get('raw_net_profit') or 0
        raw_assets = data.get('raw_assets') or 0
        raw_revenue = data.get('raw_revenue') or 0

        # ROE = (Net Profit / Equity) * 100
        data['roe'] = round((raw_net_profit / raw_equity) * 100, 2) if raw_equity > 0 else None

        # ROA = (Net Profit / Assets) * 100
        data['roa'] = round((raw_net_profit / raw_assets) * 100, 2) if raw_assets > 0 else None

        # Net Profit Margin = (Net Profit / Revenue) * 100
        data['net_profit_margin'] = round((raw_net_profit / raw_revenue) * 100, 2) if raw_revenue > 0 else None

        # EPS (from raw or calculated)
        data['eps'] = data.get('raw_eps')
        if not data.get('eps') and data.get('raw_number_of_shares') and data.get('raw_number_of_shares', 0) > 0:
            data['eps'] = round(raw_net_profit / data['raw_number_of_shares'], 2)

        # Book Value per share = Equity / Number of Shares
        raw_shares = data.get('raw_number_of_shares') or 0
        if raw_equity > 0 and raw_shares > 0:
            data['raw_book_value'] = round(raw_equity / raw_shares, 2)
        else:
            data['raw_book_value'] = None

        # P/E ratio
        current_price = data.get('current_price')
        if current_price and data.get('eps'):
            data['pe'] = round(current_price / data['eps'], 2)
        else:
            data['pe'] = None

        # P/B ratio
        raw_shares = data.get('raw_number_of_shares') or 0
        if current_price and raw_equity and raw_shares > 0:
            book_value_per_share = raw_equity / raw_shares
            data['pb'] = round(current_price / book_value_per_share, 2)
        else:
            data['pb'] = None

    def get_annual_data(self, symbol, statement_type='standalone', years=5):
        """
        Get annual cumulative data for each financial year

        Strategy:
        1. First, try to find actual annual reports (is_annual = true)
        2. If not found, sum all 4 quarters for each FY
        3. This ensures P&L items are cumulative for the full year

        Args:
            symbol: Stock symbol
            statement_type: 'standalone' or 'consolidated'
            years: Number of years

        Returns:
            List of annual data dicts with cumulative P&L and year-end balance sheet
        """
        # Normalize symbol to uppercase for database consistency
        symbol = symbol.upper()

        # Try to get actual annual reports first
        result = self.conn.execute("""
            SELECT *
            FROM xbrl_data
            WHERE symbol = ?
              AND statement_type = ?
              AND is_annual = true
            ORDER BY fy DESC
            LIMIT ?
        """, [symbol, statement_type, years]).fetchall()

        # If we found annual reports, use them
        if result and len(result) >= years:
            columns = [desc[0] for desc in self.conn.description]
            data = []
            for row in result:
                row_dict = dict(zip(columns, row))
                data.append(row_dict)
            return data

        # No annual reports found, sum quarters instead
        print(f'   📊 No annual reports found for {symbol}, aggregating quarters...')
        return self._sum_quarters_to_annual(symbol, statement_type, years)

    def normalize_data(self, raw_data):
        """
        Convert raw XBRL data to standardized format for forensic models

        Args:
            raw_data: Dict from xbrl_data table

        Returns:
            Normalized dict with standard field names
        """
        if not raw_data:
            return None

        # Convert to standard field names used by forensic models
        normalized = {
            # Identifiers
            'symbol': raw_data.get('symbol'),
            'fy': raw_data.get('fy'),
            'quarter': raw_data.get('quarter'),
            'year': int(raw_data.get('fy', 'FY0000').replace('FY', '')),
            'end_date': raw_data.get('end_date'),

            # Income Statement (in actual rupees, not crores)
            'revenue': raw_data.get('raw_revenue') or 0,
            'other_income': raw_data.get('raw_other_income') or 0,
            'total_income': raw_data.get('raw_total_income') or 0,
            'operating_expenses': raw_data.get('raw_operating_expenses') or 0,
            'employee_benefits': raw_data.get('raw_employee_benefits') or 0,
            'depreciation': raw_data.get('raw_depreciation') or 0,
            'finance_costs': raw_data.get('raw_finance_costs') or 0,
            'interest_expense': raw_data.get('raw_finance_costs') or 0,  # Alias
            'operating_profit': raw_data.get('raw_operating_profit') or 0,
            'ebitda': raw_data.get('raw_ebitda') or 0,
            'ebit': (raw_data.get('raw_ebitda') or 0) - (raw_data.get('raw_depreciation') or 0),
            'profit_before_tax': raw_data.get('raw_profit_before_tax') or 0,
            'tax_expense': raw_data.get('raw_tax_expense') or 0,
            'net_income': raw_data.get('raw_net_profit') or 0,
            'net_profit': raw_data.get('raw_net_profit') or 0,

            # Derived income statement items
            'cogs': (raw_data.get('raw_revenue') or 0) - (raw_data.get('raw_operating_profit') or 0),
            'gross_profit': raw_data.get('raw_operating_profit') or 0,
            'sga': raw_data.get('raw_employee_benefits') or 0,  # Approximation

            # Balance Sheet - Assets
            'total_assets': raw_data.get('raw_assets') or 0,
            'current_assets': raw_data.get('raw_current_assets') or 0,
            'non_current_assets': raw_data.get('raw_non_current_assets') or 0,
            'fixed_assets': raw_data.get('raw_fixed_assets') or 0,
            'ppe': raw_data.get('raw_fixed_assets') or 0,  # Property, Plant, Equipment
            'investments': raw_data.get('raw_investments') or 0,
            'cash': raw_data.get('raw_cash_and_equivalents') or 0,
            'cash_and_equivalents': raw_data.get('raw_cash_and_equivalents') or 0,
            'receivables': raw_data.get('raw_trade_receivables') or 0,
            'trade_receivables': raw_data.get('raw_trade_receivables') or 0,
            'inventory': raw_data.get('raw_inventories') or 0,

            # Balance Sheet - Liabilities & Equity
            'total_liabilities': raw_data.get('raw_equity_and_liabilities') or 0,
            'current_liabilities': raw_data.get('raw_current_liabilities') or 0,
            'non_current_liabilities': raw_data.get('raw_non_current_liabilities') or 0,
            'equity': raw_data.get('raw_equity') or 0,
            'shareholders_equity': raw_data.get('raw_equity') or 0,
            'share_capital': raw_data.get('raw_share_capital') or 0,
            'reserves': raw_data.get('raw_reserves') or 0,
            'retained_earnings': raw_data.get('raw_reserves') or 0,  # Approximation
            'total_debt': raw_data.get('raw_total_debt') or 0,
            'long_term_debt': raw_data.get('raw_non_current_liabilities') or 0,  # Approximation
            'trade_payables': raw_data.get('raw_trade_payables') or 0,

            # Cash Flow Statement
            'operating_cf': raw_data.get('raw_operating_cash_flow') or 0,
            'investing_cf': raw_data.get('raw_investing_cash_flow') or 0,
            'financing_cf': raw_data.get('raw_financing_cash_flow') or 0,
            'capex': -(raw_data.get('raw_investing_cash_flow') or 0),  # Approximation (negative investing CF)
            'free_cf': (raw_data.get('raw_operating_cash_flow') or 0) + (raw_data.get('raw_investing_cash_flow') or 0),

            # Per Share Data
            'eps': raw_data.get('raw_eps') or 0,
            'dividend_per_share': raw_data.get('raw_dividend_per_share') or 0,
            'shares_outstanding': raw_data.get('raw_number_of_shares') or 0,

            # Market Data (from calculated fields)
            'current_price': raw_data.get('current_price') or 0,
            'market_cap': raw_data.get('market_cap') or 0,

            # Pre-calculated ratios (for reference/validation)
            'roa': raw_data.get('roa'),
            'roe': raw_data.get('roe'),
            'roce': raw_data.get('roce'),
            'current_ratio': raw_data.get('current_ratio'),
            'debt_to_equity': raw_data.get('debt_to_equity'),
        }

        # Calculate NOPAT (Net Operating Profit After Tax) for ROIC
        tax_rate = (raw_data.get('raw_tax_expense') or 0) / (raw_data.get('raw_profit_before_tax') or 1)
        normalized['nopat'] = normalized['ebit'] * (1 - tax_rate)

        # Invested Capital = Equity + Debt
        normalized['invested_capital'] = normalized['equity'] + normalized['total_debt']

        # Revaluation reserve (not available in current schema, set to 0)
        normalized['revaluation_reserve'] = 0

        # Preserve all raw_* fields for validator to use
        for key, value in raw_data.items():
            if key.startswith('raw_') and key not in normalized:
                normalized[key] = value

        return normalized

    def get_normalized_timeseries(self, symbol, statement_type='standalone', years=5):
        """
        Get normalized time-series data for forensic analysis

        Args:
            symbol: Stock symbol
            statement_type: 'standalone' or 'consolidated'
            years: Number of years

        Returns:
            List of normalized dicts, newest to oldest
        """
        annual_data = self.get_annual_data(symbol, statement_type, years)

        if not annual_data:
            return None

        normalized_series = []
        for data in annual_data:
            normalized = self.normalize_data(data)
            if normalized:
                normalized_series.append(normalized)

        return normalized_series

    def get_comparison_data(self, current_year_data, previous_year_data):
        """
        Prepare two years of data for YoY comparison

        Args:
            current_year_data: Dict for current year
            previous_year_data: Dict for previous year

        Returns:
            Tuple (current_normalized, previous_normalized)
        """
        current = self.normalize_data(current_year_data)
        previous = self.normalize_data(previous_year_data)

        return (current, previous)

    def get_available_symbols(self):
        """Get list of symbols with XBRL data"""
        result = self.conn.execute("""
            SELECT DISTINCT symbol
            FROM xbrl_data
            ORDER BY symbol
        """).fetchall()

        return [row[0] for row in result]

    def get_symbol_summary(self, symbol):
        """Get summary of available data for a symbol"""
        result = self.conn.execute("""
            SELECT
                statement_type,
                COUNT(DISTINCT fy) as years_count,
                MIN(end_date) as earliest_date,
                MAX(end_date) as latest_date
            FROM xbrl_data
            WHERE symbol = ?
            GROUP BY statement_type
        """, [symbol]).fetchall()

        if not result:
            return None

        return {
            'symbol': symbol,
            'data_available': [
                {
                    'type': row[0],
                    'years': row[1],
                    'earliest': row[2],
                    'latest': row[3]
                }
                for row in result
            ]
        }

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


# Example usage
if __name__ == '__main__':
    loader = ForensicDataLoader()

    # Test data loading
    print('Available symbols:', loader.get_available_symbols())

    symbol = 'TCS'
    summary = loader.get_symbol_summary(symbol)
    print(f'\n{symbol} Summary:', summary)

    # Get time-series data
    data = loader.get_normalized_timeseries(symbol, years=3)
    if data:
        print(f'\nLoaded {len(data)} years of data for {symbol}')
        for year_data in data:
            print(f"  {year_data['fy']}: Revenue = ₹{year_data['revenue']/10000000:.2f} Cr, "
                  f"Net Profit = ₹{year_data['net_profit']/10000000:.2f} Cr")

    loader.close()
