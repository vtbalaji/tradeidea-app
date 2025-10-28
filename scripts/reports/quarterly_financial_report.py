#!/usr/bin/env python3
"""
Quarterly Financial Report Generator
Generates a console-based quarterly financial report similar to Screener.in
Shows last 5 quarters of financial data in a tabular format
"""

import sys
import os
import duckdb
from datetime import datetime
from collections import defaultdict

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)


class QuarterlyFinancialReport:
    """Generate quarterly financial reports from XBRL data"""

    # Sector mapping for companies
    SECTOR_MAPPING = {
        # Banking
        'HDFCBANK': 'BANKING', 'ICICIBANK': 'BANKING', 'AXISBANK': 'BANKING',
        'KOTAKBANK': 'BANKING', 'SBIN': 'BANKING', 'INDUSINDBK': 'BANKING',
        'FEDERALBNK': 'BANKING', 'BANKBARODA': 'BANKING', 'PNB': 'BANKING',
        'CANBK': 'BANKING', 'IDFCFIRSTB': 'BANKING',

        # IT
        'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT', 'HCLTECH': 'IT',
        'TECHM': 'IT', 'LTI': 'IT', 'COFORGE': 'IT', 'MPHASIS': 'IT',
        'PERSISTENT': 'IT', 'LTTS': 'IT',

        # Auto
        'MARUTI': 'AUTO', 'TATAMOTORS': 'AUTO', 'M&M': 'AUTO',
        'BAJAJ-AUTO': 'AUTO', 'EICHERMOT': 'AUTO', 'HEROMOTOCO': 'AUTO',
        'TVSMOTOR': 'AUTO', 'ASHOKLEY': 'AUTO',

        # Pharma
        'SUNPHARMA': 'PHARMA', 'DRREDDY': 'PHARMA', 'CIPLA': 'PHARMA',
        'DIVISLAB': 'PHARMA', 'AUROPHARMA': 'PHARMA', 'LUPIN': 'PHARMA',
        'BIOCON': 'PHARMA', 'TORNTPHARM': 'PHARMA',

        # FMCG
        'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'NESTLEIND': 'FMCG',
        'BRITANNIA': 'FMCG', 'DABUR': 'FMCG', 'MARICO': 'FMCG',
        'GODREJCP': 'FMCG', 'COLPAL': 'FMCG',
    }

    def __init__(self, fundamentals_db='data/fundamentals.duckdb'):
        """Initialize report generator"""
        self.fundamentals_db = fundamentals_db
        self.conn = duckdb.connect(fundamentals_db, read_only=True)

    def detect_sector(self, symbol):
        """Detect sector for a symbol"""
        return self.SECTOR_MAPPING.get(symbol.upper(), 'GENERAL')

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

    def get_quarterly_data(self, symbol, num_quarters=5, statement_type='consolidated'):
        """
        Fetch last N quarters of financial data for a symbol

        Args:
            symbol: Stock symbol (e.g., 'TCS')
            num_quarters: Number of quarters to fetch (default: 5)
            statement_type: 'consolidated' or 'standalone' (default: 'consolidated')

        Returns:
            List of dictionaries containing quarterly data
        """
        try:
            # Fetch extra quarters for YoY comparison (need 4 more quarters for year-over-year)
            fetch_quarters = num_quarters + 4

            query = f"""
                SELECT
                    fy, quarter, end_date, start_date, is_annual,

                    -- Revenue & Expenses (in Crores)
                    raw_revenue / 10000000 as revenue_cr,
                    raw_operating_expenses / 10000000 as operating_expenses_cr,
                    raw_operating_profit / 10000000 as operating_profit_cr,
                    operating_profit_margin,

                    -- Depreciation & Interest
                    raw_depreciation / 10000000 as depreciation_cr,
                    raw_interest_expense / 10000000 as interest_cr,

                    -- Profit Before Tax & Tax
                    raw_profit_before_tax / 10000000 as pbt_cr,
                    raw_tax_expense / 10000000 as tax_cr,

                    -- Net Profit
                    raw_net_profit / 10000000 as net_profit_cr,

                    -- Per Share Metrics
                    raw_eps as eps,

                    -- Raw values for calculations
                    raw_revenue,
                    raw_operating_expenses,
                    raw_operating_profit,
                    raw_depreciation,
                    raw_interest_expense,
                    raw_profit_before_tax,
                    raw_tax_expense,
                    raw_net_profit,

                    net_profit_margin

                FROM xbrl_data
                WHERE symbol = '{symbol}'
                  AND statement_type = '{statement_type}'
                ORDER BY end_date DESC
                LIMIT {fetch_quarters}
            """

            result = self.conn.execute(query).fetchall()

            if not result:
                print(f"❌ No data found for {symbol}")
                return None

            # Convert to list of dictionaries
            columns = [
                'fy', 'quarter', 'end_date', 'start_date', 'is_annual',
                'revenue_cr', 'operating_expenses_cr', 'operating_profit_cr', 'operating_profit_margin',
                'depreciation_cr', 'interest_cr', 'pbt_cr', 'tax_cr', 'net_profit_cr', 'eps',
                'raw_revenue', 'raw_operating_expenses', 'raw_operating_profit', 'raw_depreciation',
                'raw_interest_expense', 'raw_profit_before_tax', 'raw_tax_expense', 'raw_net_profit',
                'net_profit_margin'
            ]

            data = []
            for row in result:
                record = dict(zip(columns, row))
                # Add raw_eps as alias for eps (for compatibility)
                record['raw_eps'] = record['eps']
                data.append(record)

            # Calculate YoY growth for each quarter
            for i, record in enumerate(data):
                # Look for same quarter in previous year (4 quarters ago)
                if i + 4 < len(data):
                    prev_year_revenue = data[i + 4]['raw_revenue']
                    current_revenue = record['raw_revenue']

                    if prev_year_revenue and prev_year_revenue > 0 and current_revenue:
                        yoy_growth = ((current_revenue - prev_year_revenue) / prev_year_revenue) * 100
                        record['revenue_growth_yoy'] = yoy_growth
                    else:
                        record['revenue_growth_yoy'] = None
                else:
                    record['revenue_growth_yoy'] = None

                # Calculate QoQ growth (quarter over quarter)
                if i + 1 < len(data):
                    prev_quarter_revenue = data[i + 1]['raw_revenue']
                    current_revenue = record['raw_revenue']

                    if prev_quarter_revenue and prev_quarter_revenue > 0 and current_revenue:
                        qoq_growth = ((current_revenue - prev_quarter_revenue) / prev_quarter_revenue) * 100
                        record['revenue_growth_qoq'] = qoq_growth
                    else:
                        record['revenue_growth_qoq'] = None
                else:
                    record['revenue_growth_qoq'] = None

            # Return only the requested number of quarters
            return data[:num_quarters]

        except Exception as e:
            print(f"❌ Error fetching quarterly data: {e}")
            return None

    def get_banking_quarterly_data(self, symbol, num_quarters=5, statement_type='consolidated'):
        """
        Fetch banking-specific quarterly data

        Args:
            symbol: Stock symbol
            num_quarters: Number of quarters to fetch
            statement_type: 'consolidated' or 'standalone'

        Returns:
            List of dictionaries with banking metrics
        """
        try:
            query = f"""
                SELECT
                    fy, quarter, end_date,

                    -- Interest Income (in Crores)
                    raw_interest_income / 10000000 as interest_income_cr,
                    raw_interest_on_advances / 10000000 as interest_on_advances_cr,
                    raw_interest_on_investments / 10000000 as interest_on_investments_cr,
                    raw_interest_on_rbi_balances / 10000000 as interest_on_rbi_cr,

                    -- Interest Expense (in Crores)
                    raw_interest_expense / 10000000 as interest_expense_cr,

                    -- Net Interest Income (in Crores)
                    raw_net_interest_income / 10000000 as net_interest_income_cr,

                    -- Non-Interest Income (in Crores)
                    raw_non_interest_income / 10000000 as non_interest_income_cr,
                    raw_fee_income / 10000000 as fee_income_cr,

                    -- Provisions (in Crores)
                    raw_provisions / 10000000 as provisions_cr,

                    -- Assets & Liabilities (in Crores)
                    raw_advances / 10000000 as advances_cr,
                    raw_deposits / 10000000 as deposits_cr,
                    raw_cash_with_rbi / 10000000 as cash_with_rbi_cr,

                    -- Total Revenue & Profit (in Crores)
                    raw_revenue / 10000000 as total_revenue_cr,
                    raw_net_profit / 10000000 as net_profit_cr,

                    -- Raw values for calculations
                    raw_interest_income,
                    raw_interest_expense,
                    raw_net_interest_income,
                    raw_revenue,
                    raw_advances,
                    raw_deposits

                FROM xbrl_data
                WHERE symbol = '{symbol}'
                  AND statement_type = '{statement_type}'
                  AND raw_interest_income IS NOT NULL  -- Banking-specific check
                ORDER BY end_date DESC
                LIMIT {num_quarters}
            """

            result = self.conn.execute(query).fetchall()

            if not result:
                return None

            columns = [
                'fy', 'quarter', 'end_date',
                'interest_income_cr', 'interest_on_advances_cr', 'interest_on_investments_cr',
                'interest_on_rbi_cr', 'interest_expense_cr', 'net_interest_income_cr',
                'non_interest_income_cr', 'fee_income_cr', 'provisions_cr',
                'advances_cr', 'deposits_cr', 'cash_with_rbi_cr',
                'total_revenue_cr', 'net_profit_cr',
                'raw_interest_income', 'raw_interest_expense', 'raw_net_interest_income',
                'raw_revenue', 'raw_advances', 'raw_deposits'
            ]

            data = []
            for row in result:
                record = dict(zip(columns, row))

                # Calculate NII if not available (Interest Income - Interest Expense)
                if not record['raw_net_interest_income'] or record['raw_net_interest_income'] == 0:
                    if record['raw_interest_income'] and record['raw_interest_expense']:
                        calculated_nii = record['raw_interest_income'] - record['raw_interest_expense']
                        record['raw_net_interest_income'] = calculated_nii
                        record['net_interest_income_cr'] = calculated_nii / 10000000
                    else:
                        record['raw_net_interest_income'] = 0
                        record['net_interest_income_cr'] = 0

                # Calculate Net Interest Margin (NIM) %
                if record['raw_revenue'] and record['raw_revenue'] > 0:
                    record['nim_pct'] = (record['raw_net_interest_income'] / record['raw_revenue']) * 100 if record['raw_net_interest_income'] else 0
                else:
                    record['nim_pct'] = None

                # Calculate CD Ratio (Credit-Deposit Ratio) %
                if record['raw_deposits'] and record['raw_deposits'] > 0:
                    record['cd_ratio'] = (record['raw_advances'] / record['raw_deposits']) * 100 if record['raw_advances'] else 0
                else:
                    record['cd_ratio'] = None

                data.append(record)

            return data

        except Exception as e:
            print(f"⚠️  Banking data not available: {e}")
            return None

    def calculate_ttm_metrics(self, quarterly_data):
        """
        Calculate Trailing Twelve Months (TTM) metrics

        Args:
            quarterly_data: List of quarterly data (sorted newest first)

        Returns:
            Dictionary with TTM metrics
        """
        if not quarterly_data or len(quarterly_data) < 4:
            return None

        # Take last 4 quarters for TTM
        last_4_quarters = quarterly_data[:4]

        # Sum up the metrics
        ttm_revenue = sum(q['raw_revenue'] or 0 for q in last_4_quarters)
        ttm_net_profit = sum(q['raw_net_profit'] or 0 for q in last_4_quarters)
        ttm_eps = sum(q['eps'] or 0 for q in last_4_quarters)

        return {
            'ttm_revenue_cr': ttm_revenue / 10000000,
            'ttm_net_profit_cr': ttm_net_profit / 10000000,
            'ttm_eps': ttm_eps
        }

    def format_number(self, num, decimals=0):
        """Format number with comma separators"""
        if num is None:
            return "-"
        if decimals == 0:
            return f"{num:,.0f}"
        return f"{num:,.{decimals}f}"

    def format_percent(self, num, decimals=1):
        """Format percentage"""
        if num is None:
            return "-"
        return f"{num:.{decimals}f}%"

    def print_quarterly_report(self, symbol, num_quarters=5, statement_type='consolidated', sector=None):
        """
        Print a beautifully formatted quarterly financial report

        Args:
            symbol: Stock symbol
            num_quarters: Number of quarters to display (default: 5)
            statement_type: 'consolidated' or 'standalone'
            sector: Sector override (auto-detected if None)
        """
        # Detect sector
        if sector is None:
            sector = self.detect_sector(symbol)

        # Fetch data
        quarterly_data = self.get_quarterly_data(symbol, num_quarters, statement_type)

        if not quarterly_data:
            return

        # Fetch sector-specific data
        banking_data = None
        if sector == 'BANKING':
            banking_data = self.get_banking_quarterly_data(symbol, num_quarters, statement_type)

        # Calculate TTM metrics
        ttm_metrics = self.calculate_ttm_metrics(quarterly_data)

        # Print header
        print(f"\n{'='*120}")
        print(f"{'QUARTERLY FINANCIAL REPORT':^120}")
        print(f"{symbol} - {statement_type.upper()} [{sector} SECTOR]".center(120))
        print(f"All figures in ₹ Crores (except per share data)".center(120))
        print(f"{'='*120}\n")

        # Prepare column headers (quarters)
        quarters = []
        for q in quarterly_data:
            quarter_label = f"{q['fy']} {q['quarter']}"
            quarters.append(quarter_label)

        # Print table header
        header_format = "{:<35}" + "{:>16}" * len(quarters)
        print(header_format.format("Indicator", *quarters))
        print("-" * 120)

        # Helper function to print a row
        def print_row(label, values, format_fn=None):
            if format_fn is None:
                format_fn = lambda x: self.format_number(x, 0)

            formatted_values = [format_fn(v) for v in values]
            row_format = "{:<35}" + "{:>16}" * len(values)
            print(row_format.format(label, *formatted_values))

        # Print Revenue Section
        print_row("Total Revenue", [q['revenue_cr'] for q in quarterly_data])

        # Print YoY growth
        growth_values = []
        for q in quarterly_data:
            if q.get('revenue_growth_yoy') is not None:
                growth_values.append(f"{q['revenue_growth_yoy']:.1f}%")
            else:
                growth_values.append("-")

        row_format = "{:<35}" + "{:>16}" * len(growth_values)
        print(row_format.format("Revenue Growth YoY", *growth_values))
        print()

        # Operating Expenses & Profit
        print_row("Operating Expenses", [q['operating_expenses_cr'] for q in quarterly_data])
        print_row("Operating Profit", [q['operating_profit_cr'] for q in quarterly_data])
        print_row("Operating Profit Margin %",
                 [q['operating_profit_margin'] for q in quarterly_data],
                 lambda x: self.format_percent(x, 2))
        print()

        # Depreciation & Interest
        print_row("Depreciation", [q['depreciation_cr'] for q in quarterly_data])
        print_row("Interest", [q['interest_cr'] for q in quarterly_data])
        print()

        # Profit Before Tax & Tax
        print_row("Profit Before Tax", [q['pbt_cr'] for q in quarterly_data])
        print_row("Tax", [q['tax_cr'] for q in quarterly_data])
        print()

        # Net Profit
        print_row("Net Profit", [q['net_profit_cr'] for q in quarterly_data])
        print_row("Net Profit Margin %",
                 [q['net_profit_margin'] for q in quarterly_data],
                 lambda x: self.format_percent(x, 2))
        print()

        # EPS
        print_row("EPS (₹)",
                 [q['eps'] for q in quarterly_data],
                 lambda x: self.format_number(x, 2))
        print()

        # TTM Metrics
        if ttm_metrics:
            print("-" * 120)
            print("TRAILING TWELVE MONTHS (TTM) METRICS")
            print("-" * 120)
            print(f"{'Net Profit TTM':<35}{self.format_number(ttm_metrics['ttm_net_profit_cr'], 0):>16}")
            print(f"{'EPS TTM (₹)':<35}{self.format_number(ttm_metrics['ttm_eps'], 2):>16}")

        # Banking-Specific Section
        if banking_data and len(banking_data) > 0:
            print("\n" + "-" * 120)
            print("BANKING-SPECIFIC METRICS")
            print("-" * 120)

            # Interest Income breakdown
            print_row("Interest Income (Total)", [q['interest_income_cr'] for q in banking_data])
            if any(q.get('interest_on_advances_cr') for q in banking_data):
                print_row("  • From Advances", [q['interest_on_advances_cr'] for q in banking_data])
            if any(q.get('interest_on_investments_cr') for q in banking_data):
                print_row("  • From Investments", [q['interest_on_investments_cr'] for q in banking_data])
            if any(q.get('interest_on_rbi_cr') for q in banking_data):
                print_row("  • From RBI Balances", [q['interest_on_rbi_cr'] for q in banking_data])
            print()

            # Interest Expense & NII
            print_row("Interest Expense", [q['interest_expense_cr'] for q in banking_data])
            print_row("Net Interest Income (NII)", [q['net_interest_income_cr'] for q in banking_data])
            print_row("Net Interest Margin %",
                     [q['nim_pct'] for q in banking_data],
                     lambda x: self.format_percent(x, 2))
            print()

            # Non-Interest Income
            print_row("Non-Interest Income", [q['non_interest_income_cr'] for q in banking_data])
            if any(q.get('fee_income_cr') for q in banking_data):
                print_row("  • Fee Income", [q['fee_income_cr'] for q in banking_data])
            print()

            # Provisions
            print_row("Provisions", [q['provisions_cr'] for q in banking_data])
            print()

            # Balance Sheet Items
            print_row("Advances (Loans)", [q['advances_cr'] for q in banking_data])
            print_row("Deposits", [q['deposits_cr'] for q in banking_data])
            print_row("Credit-Deposit Ratio %",
                     [q['cd_ratio'] for q in banking_data],
                     lambda x: self.format_percent(x, 2))
            if any(q.get('cash_with_rbi_cr') for q in banking_data):
                print_row("Cash with RBI", [q['cash_with_rbi_cr'] for q in banking_data])

        print("\n" + "="*120)
        print(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*120 + "\n")

    def print_comparison_report(self, symbols, num_quarters=5, statement_type='consolidated'):
        """
        Print a comparison report for multiple symbols

        Args:
            symbols: List of stock symbols
            num_quarters: Number of quarters to display
            statement_type: 'consolidated' or 'standalone'
        """
        print(f"\n{'='*120}")
        print(f"{'QUARTERLY COMPARISON REPORT':^120}")
        print(f"Latest Quarter Comparison".center(120))
        print(f"{'='*120}\n")

        # Fetch latest quarter for each symbol
        comparison_data = []
        for symbol in symbols:
            data = self.get_quarterly_data(symbol, 1, statement_type)
            if data:
                comparison_data.append({
                    'symbol': symbol,
                    'data': data[0]
                })

        if not comparison_data:
            print("❌ No data available for comparison")
            return

        # Print comparison table
        header_format = "{:<15}" + "{:>18}" * len(comparison_data)
        print(header_format.format("Metric", *[c['symbol'] for c in comparison_data]))
        print("-" * 120)

        # Quarter
        quarters = [f"{c['data']['fy']} {c['data']['quarter']}" for c in comparison_data]
        print(header_format.format("Quarter", *quarters))
        print()

        # Financial Metrics
        metrics = [
            ('Revenue (Cr)', 'revenue_cr', 0),
            ('Operating Profit (Cr)', 'operating_profit_cr', 0),
            ('Net Profit (Cr)', 'net_profit_cr', 0),
            ('OPM %', 'operating_profit_margin', 2),
            ('NPM %', 'net_profit_margin', 2),
            ('EPS (₹)', 'raw_eps', 2),  # Use raw_eps for accuracy
        ]

        for label, key, decimals in metrics:
            values = []
            for c in comparison_data:
                val = c['data'].get(key)
                if 'Margin' in label or 'M %' in label:
                    values.append(self.format_percent(val, decimals) if val is not None else "-")
                else:
                    values.append(self.format_number(val, decimals) if val is not None else "-")

            print(header_format.format(label, *values))

        print("\n" + "="*120 + "\n")


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate Quarterly Financial Reports from XBRL data with Sector-Specific Metrics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single company report (last 5 quarters, auto-detect sector)
  %(prog)s TCS

  # Banking sector report with banking-specific metrics
  %(prog)s HDFCBANK --quarters 5

  # IT sector comparison
  %(prog)s TCS INFY WIPRO --compare

  # Last 8 quarters with standalone financials
  %(prog)s TCS --quarters 8 --type standalone

  # Override sector detection
  %(prog)s RELIANCE --sector GENERAL

Supported Sectors:
  BANKING - Shows NII, NIM, Advances, Deposits, CD Ratio, Provisions
  IT - Shows standard metrics with operating margins
  PHARMA, AUTO, FMCG, GENERAL - Shows standard metrics
        """
    )

    parser.add_argument('symbols', nargs='+', type=str, help='Stock symbol(s) (e.g., TCS, HDFCBANK, WIPRO)')
    parser.add_argument('--quarters', '-q', type=int, default=5, help='Number of quarters to display (default: 5)')
    parser.add_argument('--type', '-t', choices=['consolidated', 'standalone'], default='consolidated',
                       help='Statement type (default: consolidated)')
    parser.add_argument('--sector', '-s', choices=['BANKING', 'IT', 'PHARMA', 'AUTO', 'FMCG', 'GENERAL'],
                       help='Override automatic sector detection')
    parser.add_argument('--compare', '-c', action='store_true', help='Compare multiple symbols side-by-side')

    args = parser.parse_args()

    # Initialize report generator
    report = QuarterlyFinancialReport()

    try:
        if args.compare and len(args.symbols) > 1:
            # Comparison mode
            report.print_comparison_report(
                [s.upper() for s in args.symbols],
                num_quarters=args.quarters,
                statement_type=args.type
            )
        else:
            # Individual reports
            for symbol in args.symbols:
                report.print_quarterly_report(
                    symbol.upper(),
                    num_quarters=args.quarters,
                    statement_type=args.type,
                    sector=args.sector
                )
    finally:
        report.close()


if __name__ == '__main__':
    main()
