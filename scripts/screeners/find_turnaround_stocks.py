#!/usr/bin/env python3
"""
Turnaround Stock Screener

Identifies companies transitioning from losses to profits, both on annual and quarterly basis.
This is useful for early-stage investment opportunities.

Usage:
    ./scripts/screeners/find_turnaround_stocks.py [options]

Options:
    --quarterly     Show quarterly turnarounds (more granular, earlier detection)
    --annual        Show annual turnarounds (more stable, confirmed trend)
    --both          Show both quarterly and annual (default)
    --min-quarters  Minimum consecutive profitable quarters (default: 2)
    --min-revenue   Minimum revenue in Cr (default: 100)
    --top           Show only top N stocks (default: all)
"""

import duckdb
import sys
from datetime import datetime
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent.parent
sys.path.insert(0, str(scripts_dir))

class TurnaroundScreener:
    def __init__(self, db_path='data/fundamentals.duckdb'):
        self.conn = duckdb.connect(db_path, read_only=True)

    def get_quarterly_turnarounds(self, min_consecutive_quarters=2, min_revenue_cr=100):
        """
        Find stocks showing quarterly turnaround:
        - Had losses in previous quarters
        - Now showing profits for N consecutive quarters
        - Revenue above minimum threshold
        """
        query = f"""
        WITH quarterly_data AS (
            SELECT
                symbol,
                fy,
                quarter,
                end_date,
                revenue_cr,
                net_profit_cr,
                net_profit_margin,
                ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY end_date DESC) as rn
            FROM xbrl_data
            WHERE statement_type = 'consolidated'
                AND quarter != 'FY'  -- Exclude annual data
                AND revenue_cr > {min_revenue_cr}
                AND end_date > '2022-01-01'  -- Last 3 years
        ),
        recent_quarters AS (
            SELECT
                symbol,
                MAX(CASE WHEN rn = 1 THEN fy || ' ' || quarter END) as latest_quarter,
                MAX(CASE WHEN rn = 1 THEN end_date END) as latest_date,
                MAX(CASE WHEN rn = 1 THEN revenue_cr END) as latest_revenue,
                MAX(CASE WHEN rn = 1 THEN net_profit_cr END) as latest_profit,
                MAX(CASE WHEN rn = 1 THEN net_profit_margin END) as latest_margin,
                -- Check if last N quarters are profitable
                SUM(CASE WHEN rn <= {min_consecutive_quarters} AND net_profit_cr > 0 THEN 1 ELSE 0 END) as profitable_recent,
                -- Check if there were losses before
                MIN(CASE WHEN rn > {min_consecutive_quarters} AND rn <= ({min_consecutive_quarters} + 4) THEN net_profit_cr END) as min_profit_before,
                -- Count total profitable quarters in last 8
                SUM(CASE WHEN rn <= 8 AND net_profit_cr > 0 THEN 1 ELSE 0 END) as profitable_count_8q
            FROM quarterly_data
            WHERE rn <= 12  -- Look at last 12 quarters (3 years)
            GROUP BY symbol
        )
        SELECT
            symbol,
            latest_quarter,
            latest_date,
            latest_revenue,
            latest_profit,
            latest_margin,
            profitable_recent,
            profitable_count_8q,
            min_profit_before
        FROM recent_quarters
        WHERE profitable_recent = {min_consecutive_quarters}  -- Last N quarters are profitable
            AND min_profit_before < 0  -- Had losses before
            AND latest_profit > 0  -- Currently profitable
        ORDER BY latest_profit DESC, latest_margin DESC
        """

        try:
            results = self.conn.execute(query).fetchall()
            return results
        except Exception as e:
            print(f"Error in quarterly turnaround query: {e}")
            return []

    def get_annual_turnarounds(self, min_revenue_cr=100):
        """
        Find stocks showing annual turnaround:
        - Had losses in previous years
        - Now showing profits
        - More stable/confirmed turnaround
        """
        query = f"""
        WITH annual_data AS (
            SELECT
                symbol,
                fy,
                end_date,
                revenue_cr,
                net_profit_cr,
                net_profit_margin,
                eps,
                roe,
                ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY fy DESC) as rn
            FROM xbrl_data
            WHERE statement_type = 'consolidated'
                AND quarter = 'Q4'  -- Full year data
                AND revenue_cr > {min_revenue_cr}
                AND fy >= 'FY2020'
        ),
        turnaround_candidates AS (
            SELECT
                symbol,
                MAX(CASE WHEN rn = 1 THEN fy END) as latest_fy,
                MAX(CASE WHEN rn = 1 THEN end_date END) as latest_date,
                MAX(CASE WHEN rn = 1 THEN revenue_cr END) as latest_revenue,
                MAX(CASE WHEN rn = 1 THEN net_profit_cr END) as latest_profit,
                MAX(CASE WHEN rn = 1 THEN net_profit_margin END) as latest_margin,
                MAX(CASE WHEN rn = 1 THEN eps END) as latest_eps,
                MAX(CASE WHEN rn = 1 THEN roe END) as latest_roe,
                MAX(CASE WHEN rn = 2 THEN net_profit_cr END) as prev_year_profit,
                MAX(CASE WHEN rn = 3 THEN net_profit_cr END) as prev_2y_profit,
                -- Count profitable years in last 5
                SUM(CASE WHEN rn <= 5 AND net_profit_cr > 0 THEN 1 ELSE 0 END) as profitable_years,
                -- Check if had losses before
                MIN(CASE WHEN rn > 1 AND rn <= 4 THEN net_profit_cr END) as min_profit_before
            FROM annual_data
            WHERE rn <= 5
            GROUP BY symbol
        )
        SELECT
            symbol,
            latest_fy,
            latest_date,
            latest_revenue,
            latest_profit,
            latest_margin,
            latest_eps,
            latest_roe,
            prev_year_profit,
            prev_2y_profit,
            profitable_years,
            min_profit_before,
            -- Calculate turnaround strength
            CASE
                WHEN profitable_years >= 2 THEN 'Strong'
                WHEN profitable_years = 1 THEN 'Emerging'
                ELSE 'Weak'
            END as turnaround_strength
        FROM turnaround_candidates
        WHERE latest_profit > 0  -- Currently profitable
            AND min_profit_before < 0  -- Had losses before
        ORDER BY profitable_years DESC, latest_profit DESC
        """

        try:
            results = self.conn.execute(query).fetchall()
            return results
        except Exception as e:
            print(f"Error in annual turnaround query: {e}")
            return []

    def print_quarterly_turnarounds(self, results, top_n=None):
        """Print quarterly turnaround results in a formatted table"""
        if not results:
            print("No quarterly turnarounds found.")
            return

        print("\n" + "="*120)
        print("📈 QUARTERLY TURNAROUND STOCKS")
        print("="*120)
        print(f"\n{'Symbol':<15} {'Latest':<12} {'Revenue':<12} {'Profit':<12} {'Margin':<10} {'Trend':<20}")
        print(f"{'':15} {'Quarter':<12} {'(Cr)':<12} {'(Cr)':<12} {'(%)':<10} {'(Last 8Q)':<20}")
        print("-"*120)

        results_to_show = results[:top_n] if top_n else results

        for row in results_to_show:
            symbol, latest_q, latest_date, revenue, profit, margin, profitable_recent, profitable_8q, min_before = row

            # Create visual trend indicator
            trend = f"{profitable_8q}/8Q profitable"

            # Icons
            profit_icon = "✅" if profit > 100 else "⚠️" if profit > 0 else "❌"
            margin_icon = "✅" if margin and margin > 10 else "⚠️" if margin and margin > 5 else "❌"

            print(f"{symbol:<15} {latest_q:<12} {revenue:>11,.0f} {profit:>11,.0f} {profit_icon} "
                  f"{margin:>8.1f}% {margin_icon} {trend:<20}")

        print("-"*120)
        print(f"Found {len(results)} quarterly turnarounds")
        if top_n and len(results) > top_n:
            print(f"Showing top {top_n} (use --top to show more)")
        print()

    def print_annual_turnarounds(self, results, top_n=None):
        """Print annual turnaround results in a formatted table"""
        if not results:
            print("No annual turnarounds found.")
            return

        print("\n" + "="*130)
        print("📊 ANNUAL TURNAROUND STOCKS (Full Year)")
        print("="*130)
        print(f"\n{'Symbol':<15} {'Latest':<10} {'Revenue':<12} {'Profit':<12} {'Margin':<10} {'EPS':<10} {'ROE':<10} {'Strength':<12}")
        print(f"{'':15} {'FY':<10} {'(Cr)':<12} {'(Cr)':<12} {'(%)':<10} {'(₹)':<10} {'(%)':<10} {'':<12}")
        print("-"*130)

        results_to_show = results[:top_n] if top_n else results

        for row in results_to_show:
            symbol, fy, date, revenue, profit, margin, eps, roe, prev_profit, prev_2y, prof_years, min_before, strength = row

            # Icons
            profit_icon = "✅" if profit > 500 else "⚠️" if profit > 0 else "❌"
            margin_icon = "✅" if margin and margin > 10 else "⚠️" if margin and margin > 5 else "❌"
            roe_icon = "✅" if roe and roe > 15 else "⚠️" if roe and roe > 10 else "❌"

            # Strength icon
            strength_icon = "🔥" if strength == "Strong" else "⚡" if strength == "Emerging" else "⚠️"

            roe_str = f"{roe:.1f}" if roe else "N/A"

            print(f"{symbol:<15} {fy:<10} {revenue:>11,.0f} {profit:>11,.0f} {profit_icon} "
                  f"{margin:>8.1f}% {margin_icon} {eps:>8.2f} {roe_str:>8} {roe_icon} "
                  f"{strength:<8} {strength_icon}")

        print("-"*130)
        print(f"Found {len(results)} annual turnarounds")
        if top_n and len(results) > top_n:
            print(f"Showing top {top_n} (use --top to show more)")
        print()

    def get_detailed_turnaround_info(self, symbol):
        """Get detailed quarterly progression for a specific symbol"""
        query = f"""
        SELECT
            fy || ' ' || quarter as period,
            end_date,
            revenue_cr,
            net_profit_cr,
            net_profit_margin,
            eps
        FROM xbrl_data
        WHERE symbol = '{symbol}'
            AND statement_type = 'consolidated'
            AND quarter != 'FY'
            AND end_date > '2021-01-01'
        ORDER BY end_date DESC
        LIMIT 12
        """

        try:
            results = self.conn.execute(query).fetchall()
            return results
        except Exception as e:
            print(f"Error fetching details for {symbol}: {e}")
            return []

    def print_symbol_detail(self, symbol):
        """Print detailed quarterly progression for a symbol"""
        results = self.get_detailed_turnaround_info(symbol)

        if not results:
            print(f"No data found for {symbol}")
            return

        print(f"\n{'='*100}")
        print(f"📊 QUARTERLY PROGRESSION: {symbol}")
        print(f"{'='*100}\n")
        print(f"{'Period':<15} {'Date':<12} {'Revenue (Cr)':<15} {'Profit (Cr)':<15} {'Margin %':<12} {'EPS':<10}")
        print("-"*100)

        for row in results:
            period, date, revenue, profit, margin, eps = row
            profit_icon = "✅" if profit > 0 else "❌"
            margin_str = f"{margin:.1f}" if margin else "N/A"
            eps_str = f"{eps:.2f}" if eps else "N/A"

            print(f"{period:<15} {str(date):<12} {revenue:>14,.0f} {profit:>14,.0f} {profit_icon} "
                  f"{margin_str:>10} {eps_str:>8}")

        print("-"*100)
        print()

    def close(self):
        if self.conn:
            self.conn.close()


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Screen for stocks showing turnaround patterns (losses to profits)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Show quarterly turnarounds (early detection)
  %(prog)s --quarterly

  # Show annual turnarounds (confirmed trend)
  %(prog)s --annual

  # Show both with minimum revenue filter
  %(prog)s --both --min-revenue 500

  # Show top 20 quarterly turnarounds requiring 3 consecutive profitable quarters
  %(prog)s --quarterly --min-quarters 3 --top 20

  # Get detailed quarterly progression for a specific stock
  %(prog)s --detail ADANIPOWER
        """
    )

    parser.add_argument('--quarterly', action='store_true',
                       help='Show quarterly turnarounds (more granular)')
    parser.add_argument('--annual', action='store_true',
                       help='Show annual turnarounds (more stable)')
    parser.add_argument('--both', action='store_true',
                       help='Show both quarterly and annual (default)')
    parser.add_argument('--min-quarters', type=int, default=2,
                       help='Minimum consecutive profitable quarters (default: 2)')
    parser.add_argument('--min-revenue', type=float, default=100,
                       help='Minimum revenue in Cr (default: 100)')
    parser.add_argument('--top', type=int,
                       help='Show only top N stocks')
    parser.add_argument('--detail', type=str,
                       help='Show detailed quarterly progression for specific symbol')

    args = parser.parse_args()

    # Default to both if nothing specified
    if not args.quarterly and not args.annual and not args.detail:
        args.both = True

    screener = TurnaroundScreener()

    try:
        if args.detail:
            # Show detailed info for specific symbol
            screener.print_symbol_detail(args.detail.upper())
        else:
            # Show quarterly turnarounds
            if args.quarterly or args.both:
                print("\n🔍 Scanning for quarterly turnarounds...")
                results = screener.get_quarterly_turnarounds(
                    min_consecutive_quarters=args.min_quarters,
                    min_revenue_cr=args.min_revenue
                )
                screener.print_quarterly_turnarounds(results, args.top)

            # Show annual turnarounds
            if args.annual or args.both:
                print("\n🔍 Scanning for annual turnarounds...")
                results = screener.get_annual_turnarounds(
                    min_revenue_cr=args.min_revenue
                )
                screener.print_annual_turnarounds(results, args.top)

    finally:
        screener.close()


if __name__ == '__main__':
    main()
