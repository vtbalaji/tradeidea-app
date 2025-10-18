#!/usr/bin/env -S venv/bin/python3
"""
Fundamental Ratio Calculator

Combines XBRL financial data with current market price to calculate
fundamental ratios like P/E, P/B, ROE, ROA, etc.

Usage:
    from fundamental_calculator import FundamentalCalculator

    calculator = FundamentalCalculator()
    fundamentals = calculator.calculate(xbrl_data, symbol)
"""

import sys
import os

# Add experimental directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'experimental'))

from fetch_nse_data import NSEDataFetcher


class FundamentalCalculator:
    """Calculate fundamental ratios from XBRL data and market prices"""

    def __init__(self):
        """Initialize calculator"""
        self.fetcher = None

    def get_current_price(self, symbol):
        """Get current market price from DuckDB"""
        try:
            if not self.fetcher:
                self.fetcher = NSEDataFetcher()

            df = self.fetcher.get_data(symbol, days=1)

            if df.empty:
                return None

            return float(df['close'].iloc[-1])

        except Exception as e:
            print(f"  ⚠️  Error fetching price for {symbol}: {str(e)}")
            return None

    def calculate(self, xbrl_data, symbol, current_price=None):
        """
        Calculate all fundamental ratios

        Args:
            xbrl_data: Dictionary of financial data from XBRL parser
            symbol: Stock symbol
            current_price: Current market price (optional, will fetch if not provided)

        Returns:
            Dictionary of calculated fundamental ratios
        """

        # Get current price if not provided
        if current_price is None:
            current_price = self.get_current_price(symbol)

        if not current_price:
            print(f"  ⚠️  Could not fetch current price for {symbol}")
            return None

        # Extract values from XBRL (handle missing values gracefully)
        net_profit = xbrl_data.get('NetProfit', 0)
        total_equity = xbrl_data.get('Equity', 0)
        total_assets = xbrl_data.get('Assets', 0)
        current_assets = xbrl_data.get('CurrentAssets', 0)
        current_liabilities = xbrl_data.get('CurrentLiabilities', 0)
        total_debt = xbrl_data.get('TotalDebt', 0)
        shares_outstanding = xbrl_data.get('NumberOfShares', 0)
        revenue = xbrl_data.get('Revenue', 0)
        share_capital = xbrl_data.get('ShareCapital', 0)
        cash = xbrl_data.get('CashAndCashEquivalents', 0)
        ebitda = xbrl_data.get('EBITDA', 0)

        # Get EPS (directly from XBRL or calculate)
        eps = xbrl_data.get('EPS', 0)
        if eps == 0 and shares_outstanding > 0:
            eps = net_profit / shares_outstanding

        # Calculate shares outstanding if not available
        # Use share capital and face value (typically ₹1, ₹2, or ₹10)
        if shares_outstanding == 0 and share_capital > 0:
            # Assume face value of ₹2 (common for Indian stocks)
            # Adjust this based on actual face value if available
            face_value = 2
            shares_outstanding = share_capital / face_value

        # Calculate Book Value per Share
        book_value_per_share = 0
        if shares_outstanding > 0:
            book_value_per_share = total_equity / shares_outstanding

        # Calculate Market Capitalization
        market_cap = 0
        if shares_outstanding > 0:
            market_cap = current_price * shares_outstanding

        # Calculate Graham Number
        # Graham Number = √(22.5 × EPS × Book Value per Share)
        # Represents fair value according to Benjamin Graham's value investing principles
        graham_number = 0
        if eps > 0 and book_value_per_share > 0:
            graham_number = (22.5 * eps * book_value_per_share) ** 0.5

        # Calculate all ratios with safe division
        fundamentals = {
            'symbol': symbol,
            'source': 'xbrl',  # Mark data source as XBRL (authentic)
            'currentPrice': round(current_price, 2),
            'marketCap': round(market_cap, 2),
            'marketCapCr': round(market_cap / 10000000, 2),  # In crores

            # Valuation Ratios
            'PE': round(current_price / eps, 2) if eps > 0 else None,
            'PB': round(current_price / book_value_per_share, 2) if book_value_per_share > 0 else None,
            'PS': round(market_cap / revenue, 2) if revenue > 0 else None,
            'EVEBITDA': round((market_cap + total_debt - cash) / ebitda, 2) if ebitda > 0 else None,
            'grahamNumber': round(graham_number, 2) if graham_number > 0 else None,
            'priceToGraham': round(current_price / graham_number, 2) if graham_number > 0 else None,

            # Profitability Ratios (%)
            'ROE': round((net_profit / total_equity) * 100, 2) if total_equity > 0 else None,
            'ROA': round((net_profit / total_assets) * 100, 2) if total_assets > 0 else None,
            'ROCE': round((ebitda / (total_equity + total_debt)) * 100, 2) if (total_equity + total_debt) > 0 and ebitda > 0 else None,
            'netProfitMargin': round((net_profit / revenue) * 100, 2) if revenue > 0 else None,
            'operatingProfitMargin': round((xbrl_data.get('OperatingProfit', 0) / revenue) * 100, 2) if revenue > 0 and xbrl_data.get('OperatingProfit') else None,
            'EBITDAMargin': round((ebitda / revenue) * 100, 2) if revenue > 0 and ebitda > 0 else None,

            # Liquidity Ratios
            'currentRatio': round(current_assets / current_liabilities, 2) if current_liabilities > 0 else None,
            'quickRatio': round((current_assets - xbrl_data.get('Inventories', 0)) / current_liabilities, 2) if current_liabilities > 0 else None,

            # Leverage Ratios
            'debtToEquity': round(total_debt / total_equity, 2) if total_equity > 0 else None,
            'debtToAssets': round(total_debt / total_assets, 2) if total_assets > 0 else None,
            'equityMultiplier': round(total_assets / total_equity, 2) if total_equity > 0 else None,

            # Per Share Metrics (₹)
            'EPS': round(eps, 2),
            'bookValuePerShare': round(book_value_per_share, 2),
            'revenuePerShare': round(revenue / shares_outstanding, 2) if shares_outstanding > 0 else None,
            'cashPerShare': round(cash / shares_outstanding, 2) if shares_outstanding > 0 else None,
            'dividendPerShare': round(xbrl_data.get('DividendPerShare', 0), 2),

            # Dividend Metrics
            'dividendYield': round((xbrl_data.get('DividendPerShare', 0) / current_price) * 100, 2) if current_price > 0 and xbrl_data.get('DividendPerShare', 0) > 0 else None,
            'dividendPayoutRatio': round((xbrl_data.get('DividendPerShare', 0) / eps) * 100, 2) if eps > 0 and xbrl_data.get('DividendPerShare', 0) > 0 else None,

            # Absolute Values (in Crores)
            'revenueCr': round(revenue / 10000000, 2),
            'netProfitCr': round(net_profit / 10000000, 2),
            'ebitdaCr': round(ebitda / 10000000, 2) if ebitda > 0 else None,
            'totalAssetsCr': round(total_assets / 10000000, 2),
            'totalEquityCr': round(total_equity / 10000000, 2),
            'totalDebtCr': round(total_debt / 10000000, 2),
            'cashCr': round(cash / 10000000, 2),

            # Other useful metrics
            'sharesOutstandingCr': round(shares_outstanding / 10000000, 2) if shares_outstanding > 0 else None,
            'enterpriseValueCr': round((market_cap + total_debt - cash) / 10000000, 2),
        }

        return fundamentals

    def display(self, fundamentals):
        """Display fundamental ratios in a formatted way"""

        if not fundamentals:
            print("❌ No fundamental data to display")
            return

        print('\n' + '='*70)
        print(f'📊 Fundamental Analysis: {fundamentals["symbol"]} (Source: {fundamentals["source"].upper()})')
        print('='*70)

        print(f'\n💰 Market Valuation:')
        print(f'  Current Price:    ₹{fundamentals["currentPrice"]:>12,.2f}')
        print(f'  Market Cap:       ₹{fundamentals["marketCapCr"]:>12,.2f} Cr')
        print(f'  Enterprise Value: ₹{fundamentals["enterpriseValueCr"]:>12,.2f} Cr')

        print(f'\n📈 Valuation Ratios:')
        if fundamentals["PE"]:
            print(f'  P/E Ratio:        {fundamentals["PE"]:>15,.2f}')
        if fundamentals["PB"]:
            print(f'  P/B Ratio:        {fundamentals["PB"]:>15,.2f}')
        if fundamentals["PS"]:
            print(f'  P/S Ratio:        {fundamentals["PS"]:>15,.2f}')
        if fundamentals["EVEBITDA"]:
            print(f'  EV/EBITDA:        {fundamentals["EVEBITDA"]:>15,.2f}')
        if fundamentals["grahamNumber"]:
            print(f'\n💎 Graham Number (Fair Value):')
            print(f'  Graham Number:    ₹{fundamentals["grahamNumber"]:>12,.2f}')
            print(f'  Current Price:    ₹{fundamentals["currentPrice"]:>12,.2f}')
            print(f'  Price/Graham:     {fundamentals["priceToGraham"]:>15,.2f}x')
            if fundamentals["priceToGraham"] < 1:
                discount = (1 - fundamentals["priceToGraham"]) * 100
                print(f'  Status:           🟢 Undervalued by {discount:.1f}%')
            elif fundamentals["priceToGraham"] > 1:
                premium = (fundamentals["priceToGraham"] - 1) * 100
                print(f'  Status:           🔴 Overvalued by {premium:.1f}%')
            else:
                print(f'  Status:           🟡 Fairly valued')

        print(f'\n💹 Profitability Metrics:')
        if fundamentals["ROE"]:
            print(f'  ROE:              {fundamentals["ROE"]:>14,.2f}%')
        if fundamentals["ROA"]:
            print(f'  ROA:              {fundamentals["ROA"]:>14,.2f}%')
        if fundamentals["ROCE"]:
            print(f'  ROCE:             {fundamentals["ROCE"]:>14,.2f}%')
        if fundamentals["netProfitMargin"]:
            print(f'  Net Profit Margin:{fundamentals["netProfitMargin"]:>14,.2f}%')
        if fundamentals["EBITDAMargin"]:
            print(f'  EBITDA Margin:    {fundamentals["EBITDAMargin"]:>14,.2f}%')

        print(f'\n💧 Liquidity & Leverage:')
        if fundamentals["currentRatio"]:
            print(f'  Current Ratio:    {fundamentals["currentRatio"]:>15,.2f}')
        if fundamentals["quickRatio"]:
            print(f'  Quick Ratio:      {fundamentals["quickRatio"]:>15,.2f}')
        if fundamentals["debtToEquity"]:
            print(f'  Debt to Equity:   {fundamentals["debtToEquity"]:>15,.2f}')
        if fundamentals["debtToAssets"]:
            print(f'  Debt to Assets:   {fundamentals["debtToAssets"]:>15,.2f}')

        print(f'\n💵 Per Share Metrics:')
        print(f'  EPS:              ₹{fundamentals["EPS"]:>12,.2f}')
        print(f'  Book Value/Share: ₹{fundamentals["bookValuePerShare"]:>12,.2f}')
        if fundamentals["revenuePerShare"]:
            print(f'  Revenue/Share:    ₹{fundamentals["revenuePerShare"]:>12,.2f}')
        if fundamentals["cashPerShare"]:
            print(f'  Cash/Share:       ₹{fundamentals["cashPerShare"]:>12,.2f}')

        if fundamentals["dividendPerShare"] > 0:
            print(f'\n💰 Dividend:')
            print(f'  Dividend/Share:   ₹{fundamentals["dividendPerShare"]:>12,.2f}')
            if fundamentals["dividendYield"]:
                print(f'  Dividend Yield:   {fundamentals["dividendYield"]:>14,.2f}%')
            if fundamentals["dividendPayoutRatio"]:
                print(f'  Payout Ratio:     {fundamentals["dividendPayoutRatio"]:>14,.2f}%')

        print(f'\n📊 Financial Summary (₹ Crores):')
        print(f'  Revenue:          ₹{fundamentals["revenueCr"]:>12,.2f} Cr')
        print(f'  Net Profit:       ₹{fundamentals["netProfitCr"]:>12,.2f} Cr')
        if fundamentals["ebitdaCr"]:
            print(f'  EBITDA:           ₹{fundamentals["ebitdaCr"]:>12,.2f} Cr')
        print(f'  Total Assets:     ₹{fundamentals["totalAssetsCr"]:>12,.2f} Cr')
        print(f'  Total Equity:     ₹{fundamentals["totalEquityCr"]:>12,.2f} Cr')
        print(f'  Total Debt:       ₹{fundamentals["totalDebtCr"]:>12,.2f} Cr')
        print(f'  Cash & Equiv.:    ₹{fundamentals["cashCr"]:>12,.2f} Cr')

        print('='*70)

    def close(self):
        """Close database connection"""
        if self.fetcher:
            self.fetcher.close()


# Example usage
if __name__ == '__main__':
    # Mock XBRL data for testing
    mock_xbrl_data = {
        'NetProfit': 150000000000,  # ₹15,000 Cr
        'Equity': 500000000000,  # ₹50,000 Cr
        'Assets': 1000000000000,  # ₹1,00,000 Cr
        'CurrentAssets': 400000000000,
        'CurrentLiabilities': 300000000000,
        'TotalDebt': 200000000000,
        'NumberOfShares': 10000000000,  # 1000 Cr shares
        'Revenue': 800000000000,  # ₹80,000 Cr
        'EPS': 15.0,  # ₹15
        'EBITDA': 250000000000,  # ₹25,000 Cr
        'CashAndCashEquivalents': 100000000000,  # ₹10,000 Cr
        'DividendPerShare': 5.0,  # ₹5
    }

    calculator = FundamentalCalculator()

    # Calculate with mock price
    fundamentals = calculator.calculate(mock_xbrl_data, 'RELIANCE', current_price=2500.0)

    if fundamentals:
        calculator.display(fundamentals)

    calculator.close()
