#!/usr/bin/env -S venv/bin/python3
"""
PEG Ratio Calculator for Indian Market

Calculates PEG ratios using:
1. Historical 3-year CAGR (Indian market standard) - Conservative
2. Forward 1-year growth estimates (Global standard) - Optimistic
3. Hybrid weighted average (70% historical + 30% forward) - Balanced

Usage:
    from peg_calculator import PEGCalculator

    calc = PEGCalculator()
    peg_data = calc.calculate_hybrid_peg('RELIANCE')
    print(peg_data)
    calc.close()
"""

import duckdb
import yfinance as yf
import os
from datetime import datetime, timedelta


class PEGCalculator:
    """Calculate PEG ratios using DuckDB historical data and Yahoo forward estimates"""

    def __init__(self, db_path=None):
        """Initialize with DuckDB connection"""
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')

        self.db_path = db_path
        self.conn = duckdb.connect(db_path)

    def calculate_3year_cagr(self, symbol: str, verbose: bool = False) -> dict:
        """
        Calculate 3-year earnings CAGR from Yahoo Finance annual data

        Uses annual EPS data fetched directly from Yahoo Finance.
        Compares current year EPS to 3 years ago.

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            verbose: Print detailed calculation info

        Returns:
            {
                'cagr': float,              # 3-year CAGR percentage
                'peg_historical': float,    # PE / CAGR
                'data_points': int,         # Number of years available
                'start_date': date,         # Start of 3-year period
                'end_date': date,           # End of 3-year period
                'start_eps': float,         # EPS 3 years ago
                'current_eps': float        # Current EPS
            }
        """
        try:
            # Fetch annual income statement from Yahoo Finance
            import yfinance as yf
            ticker = yf.Ticker(f"{symbol}.NS")
            annual_income = ticker.income_stmt

            if annual_income is None or annual_income.empty:
                if verbose:
                    print(f'  ⚠️  No annual data available for {symbol}')
                return {
                    'cagr': None,
                    'peg_historical': None,
                    'data_points': 0,
                    'error': 'No annual financial data available'
                }

            # Need at least 4 years for 3-year CAGR (years 0, 1, 2, 3)
            if len(annual_income.columns) < 4:
                if verbose:
                    print(f'  ⚠️  Insufficient annual data ({len(annual_income.columns)}/4 years)')
                return {
                    'cagr': None,
                    'peg_historical': None,
                    'data_points': len(annual_income.columns),
                    'error': 'Insufficient historical data (need 4 years)'
                }

            # Get Net Income from annual data
            # Columns are sorted DESC (most recent first)
            years = sorted(annual_income.columns, reverse=True)  # Most recent first

            # Get Net Income for each year
            current_year = years[0]
            three_years_ago = years[3]

            # Try to get Net Income (different keys possible)
            net_income_keys = ['Net Income', 'Net Income Common Stockholders',
                             'Net Income From Continuing Operation Net Minority Interest']

            current_net_income = None
            start_net_income = None

            for key in net_income_keys:
                if key in annual_income.index:
                    current_net_income = annual_income.loc[key, current_year]
                    start_net_income = annual_income.loc[key, three_years_ago]
                    break

            if current_net_income is None or start_net_income is None:
                if verbose:
                    print(f'  ⚠️  Could not find Net Income in annual data')
                return {
                    'cagr': None,
                    'peg_historical': None,
                    'data_points': len(years),
                    'error': 'Net Income not found in financial data'
                }

            # Get info for shares outstanding and current EPS
            info = ticker.info
            trailing_eps = info.get('trailingEps')

            if not trailing_eps or trailing_eps <= 0:
                if verbose:
                    print(f'  ⚠️  No valid trailing EPS available')
                return {
                    'cagr': None,
                    'peg_historical': None,
                    'data_points': len(years),
                    'error': 'No valid EPS data'
                }

            # Calculate EPS 3 years ago (approximate using net income ratio)
            # EPS_3yrs_ago = trailing_eps * (net_income_3yrs_ago / current_net_income)
            if current_net_income <= 0 or start_net_income <= 0:
                if verbose:
                    print(f'  ⚠️  Negative net income in one of the years')
                return {
                    'cagr': None,
                    'peg_historical': None,
                    'data_points': len(years),
                    'error': 'Negative earnings in base year'
                }

            # Calculate CAGR based on net income growth
            cagr = ((current_net_income / start_net_income) ** (1 / 3.0) - 1) * 100

            if verbose:
                print(f'\n  📊 3-Year CAGR Calculation for {symbol}:')
                print(f'     Start: FY{three_years_ago.year} - Net Income: ₹{start_net_income/10_000_000:.0f}Cr')
                print(f'     End:   FY{current_year.year} - Net Income: ₹{current_net_income/10_000_000:.0f}Cr')
                print(f'     Earnings CAGR: {cagr:.2f}%')

            # Get current PE ratio
            pe = self._get_current_pe(symbol)

            # Calculate PEG
            peg_historical = None
            if pe and cagr > 0:
                peg_historical = round(pe / cagr, 2)
                if verbose:
                    print(f'     Current EPS: ₹{trailing_eps:.2f}')
                    print(f'     PE: {pe:.2f}')
                    print(f'     PEG Historical: {peg_historical}')

            return {
                'cagr': round(cagr, 2),
                'peg_historical': peg_historical,
                'data_points': len(years),
                'start_date': three_years_ago.date(),
                'end_date': current_year.date(),
                'start_eps': None,  # Not calculated
                'current_eps': round(trailing_eps, 2) if trailing_eps else None,
                'pe': pe
            }

        except Exception as e:
            print(f'  ❌ Error calculating 3-year CAGR for {symbol}: {e}')
            import traceback
            if verbose:
                traceback.print_exc()
            return {
                'cagr': None,
                'peg_historical': None,
                'data_points': 0,
                'error': str(e)
            }

    def fetch_forward_estimates(self, symbol: str, verbose: bool = False) -> dict:
        """
        Fetch Yahoo Finance forward growth estimates

        Yahoo provides analyst consensus estimates for future earnings growth.
        Note: These are often unreliable for smaller Indian companies.

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            verbose: Print detailed info

        Returns:
            {
                'forward_growth': float,    # Expected growth %
                'peg_forward': float,       # PE / forward growth
                'analyst_count': int,       # Number of analysts
                'target_price': float       # Analyst target price
            }
        """
        try:
            ticker = yf.Ticker(f"{symbol}.NS")
            info = ticker.info

            # Try to get forward earnings growth
            forward_growth = info.get('earningsGrowth')  # Decimal (0.25 = 25%)

            # If not available, calculate from forward EPS
            if forward_growth is None:
                forward_eps = info.get('forwardEps')
                trailing_eps = info.get('trailingEps')

                if forward_eps and trailing_eps and trailing_eps > 0:
                    forward_growth = (forward_eps / trailing_eps) - 1
                    if verbose:
                        print(f'  📈 Calculated forward growth from EPS: {forward_growth*100:.2f}%')

            # Convert to percentage if we have it
            forward_growth_pct = forward_growth * 100 if forward_growth else None

            # Get PE ratio
            pe = info.get('trailingPE') or info.get('forwardPE')

            # Calculate forward PEG
            peg_forward = None
            if pe and forward_growth_pct and forward_growth_pct > 0:
                peg_forward = round(pe / forward_growth_pct, 2)

            # Analyst information
            analyst_count = info.get('numberOfAnalystOpinions', 0)
            target_price = info.get('targetMeanPrice')

            if verbose:
                print(f'\n  📊 Forward Estimates for {symbol}:')
                print(f'     Forward Growth: {forward_growth_pct:.2f}%' if forward_growth_pct else '     Forward Growth: N/A')
                print(f'     PE: {pe:.2f}' if pe else '     PE: N/A')
                print(f'     PEG Forward: {peg_forward}' if peg_forward else '     PEG Forward: N/A')
                print(f'     Analysts: {analyst_count}')

            return {
                'forward_growth': round(forward_growth_pct, 2) if forward_growth_pct else None,
                'peg_forward': peg_forward,
                'analyst_count': analyst_count,
                'target_price': target_price,
                'pe': pe
            }

        except Exception as e:
            print(f'  ❌ Error fetching forward estimates for {symbol}: {e}')
            return {
                'forward_growth': None,
                'peg_forward': None,
                'analyst_count': 0,
                'target_price': None,
                'error': str(e)
            }

    def calculate_hybrid_peg(self, symbol: str, verbose: bool = False) -> dict:
        """
        Calculate all three PEG ratios: historical, forward, and hybrid

        Hybrid PEG = (0.7 × Historical PEG) + (0.3 × Forward PEG)

        Rationale:
        - 70% weight on historical: Conservative, based on actual audited results
        - 30% weight on forward: Captures growth momentum and market expectations

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            verbose: Print detailed calculation info

        Returns:
            {
                'pegHistorical3Y': float,          # Based on 3-year CAGR
                'pegForward1Y': float,             # Based on analyst estimates
                'pegHybrid': float,                # Weighted average
                'earningsCagr3Y': float,           # 3-year CAGR %
                'earningsGrowthForward': float,    # Forward growth %
                'pe': float,                       # Current PE ratio
                'confidence': str,                 # HIGH/MEDIUM/LOW
                'recommendation': str              # Interpretation
            }
        """
        if verbose:
            print(f'\n{"="*60}')
            print(f'PEG CALCULATION FOR {symbol}')
            print(f'{"="*60}')

        # Get 3-year historical CAGR
        historical = self.calculate_3year_cagr(symbol, verbose=verbose)

        # Get forward estimates
        forward = self.fetch_forward_estimates(symbol, verbose=verbose)

        # Calculate hybrid PEG (weighted average)
        peg_hybrid = None
        calculation_method = None

        if historical['peg_historical'] and forward['peg_forward']:
            # Both available - use weighted average
            peg_hybrid = round(
                (historical['peg_historical'] * 0.7) + (forward['peg_forward'] * 0.3),
                2
            )
            calculation_method = 'weighted'
            if verbose:
                print(f'\n  ⚖️  Hybrid PEG Calculation:')
                print(f'     (0.7 × {historical["peg_historical"]}) + (0.3 × {forward["peg_forward"]}) = {peg_hybrid}')

        elif historical['peg_historical']:
            # Only historical available
            peg_hybrid = historical['peg_historical']
            calculation_method = 'historical_only'
            if verbose:
                print(f'\n  ⚠️  Using historical PEG only (forward estimates unavailable)')

        elif forward['peg_forward']:
            # Only forward available
            peg_hybrid = forward['peg_forward']
            calculation_method = 'forward_only'
            if verbose:
                print(f'\n  ⚠️  Using forward PEG only (insufficient historical data)')

        # Determine confidence level
        confidence = self._calculate_confidence(historical, forward)

        # Generate recommendation
        recommendation = self._generate_recommendation(peg_hybrid, confidence, calculation_method)

        if verbose:
            print(f'\n  📊 FINAL RESULTS:')
            print(f'     PEG Historical (3Y CAGR): {historical["peg_historical"]}')
            print(f'     PEG Forward (1Y Est): {forward["peg_forward"]}')
            print(f'     PEG Hybrid: {peg_hybrid}')
            print(f'     Confidence: {confidence}')
            print(f'     Recommendation: {recommendation}')
            print(f'{"="*60}\n')

        return {
            # Main metrics
            'pegHistorical3Y': historical['peg_historical'],
            'pegForward1Y': forward['peg_forward'],
            'pegHybrid': peg_hybrid,

            # Supporting data
            'earningsCagr3Y': historical['cagr'],
            'earningsGrowthForward': forward['forward_growth'],
            'pe': historical.get('pe') or forward.get('pe'),

            # Quality indicators
            'confidence': confidence,
            'dataPoints': historical['data_points'],
            'analystCount': forward['analyst_count'],
            'calculationMethod': calculation_method,

            # Interpretation
            'recommendation': recommendation,

            # Metadata
            'lastCalculated': datetime.now().isoformat(),
        }

    def _get_current_pe(self, symbol: str) -> float:
        """Get current PE ratio from DuckDB or Yahoo"""
        try:
            # Try from yahoo_current_fundamentals table
            result = self.conn.execute("""
                SELECT trailing_pe
                FROM yahoo_current_fundamentals
                WHERE symbol = ?
            """, [symbol]).fetchone()

            if result and result[0]:
                return round(result[0], 2)

            # Fallback: fetch fresh from Yahoo
            ticker = yf.Ticker(f"{symbol}.NS")
            pe = ticker.info.get('trailingPE')
            return round(pe, 2) if pe else None

        except Exception:
            return None

    def _calculate_confidence(self, historical: dict, forward: dict) -> str:
        """
        Calculate confidence level based on data quality

        HIGH: 12+ quarters of data AND 5+ analysts
        MEDIUM: 8+ quarters OR 2+ analysts
        LOW: Limited data on both fronts
        """
        data_points = historical.get('data_points', 0)
        analyst_count = forward.get('analyst_count', 0)

        if data_points >= 12 and analyst_count >= 5:
            return 'HIGH'
        elif data_points >= 8 or analyst_count >= 2:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _generate_recommendation(self, peg_hybrid: float, confidence: str, method: str) -> str:
        """
        Generate investment recommendation based on PEG

        PEG < 1.0: Undervalued (good buy)
        PEG 1.0-1.5: Fair value
        PEG 1.5-2.0: Slightly expensive
        PEG > 2.0: Overvalued
        """
        if peg_hybrid is None:
            return 'INSUFFICIENT_DATA'

        confidence_note = f" ({confidence} confidence)" if confidence != 'HIGH' else ""

        if peg_hybrid < 1.0:
            return f'UNDERVALUED{confidence_note}'
        elif peg_hybrid < 1.5:
            return f'FAIR_VALUE{confidence_note}'
        elif peg_hybrid < 2.0:
            return f'SLIGHTLY_EXPENSIVE{confidence_note}'
        else:
            return f'OVERVALUED{confidence_note}'

    def batch_calculate(self, symbols: list, verbose: bool = False) -> dict:
        """
        Calculate PEG ratios for multiple symbols

        Returns dict with symbol as key and PEG data as value
        """
        results = {}

        for symbol in symbols:
            if verbose:
                print(f'\nProcessing {symbol}...')

            try:
                peg_data = self.calculate_hybrid_peg(symbol, verbose=verbose)
                results[symbol] = peg_data
            except Exception as e:
                print(f'  ❌ Error processing {symbol}: {e}')
                results[symbol] = {'error': str(e)}

        return results

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


# Example usage
if __name__ == '__main__':
    import sys

    calc = PEGCalculator()

    # Test symbols
    test_symbols = ['RELIANCE', 'TCS', 'INFY'] if len(sys.argv) == 1 else sys.argv[1:]

    print(f'\n{"="*60}')
    print(f'PEG RATIO CALCULATOR - Indian Market Context')
    print(f'{"="*60}\n')

    for symbol in test_symbols:
        peg_data = calc.calculate_hybrid_peg(symbol, verbose=True)

    calc.close()
