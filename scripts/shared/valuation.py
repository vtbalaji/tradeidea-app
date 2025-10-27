"""
Valuation Models - Single Source of Truth

Intrinsic value calculations using various methods:
- Graham Number (Conservative value investor approach)
- Discounted Cash Flow (DCF)
- P/E Based Valuation
- Dividend Discount Model (DDM)

All scripts should use these standardized calculations.
"""

import numpy as np


class ValuationModels:
    """Standard valuation methodologies"""

    @staticmethod
    def graham_number(eps, book_value_per_share):
        """
        Graham Number - Ben Graham's intrinsic value formula

        Formula: √(22.5 × EPS × Book Value per Share)

        Args:
            eps: Earnings per share (₹)
            book_value_per_share: Book value per share (₹)

        Returns:
            float: Graham number (intrinsic value per share)
        """
        if eps > 0 and book_value_per_share > 0:
            return np.sqrt(22.5 * eps * book_value_per_share)
        return 0

    @staticmethod
    def dcf_simple(fcf_per_share, growth_rate=0.10, terminal_growth=0.05, discount_rate=0.12, growth_years=5):
        """
        Simplified Discounted Cash Flow Model

        Assumptions:
        - Constant growth for 'growth_years', then terminal growth
        - Uses free cash flow per share

        Args:
            fcf_per_share: Free cash flow per share (₹)
            growth_rate: Expected growth rate for next N years (default: 10%)
            terminal_growth: Perpetual growth rate after N years (default: 5%)
            discount_rate: Required rate of return (default: 12%)
            growth_years: Number of high-growth years (default: 5)

        Returns:
            float: DCF intrinsic value per share
        """
        if fcf_per_share <= 0 or discount_rate <= terminal_growth:
            return 0

        # Present value of growth period cash flows
        pv_growth = 0
        for year in range(1, growth_years + 1):
            future_fcf = fcf_per_share * ((1 + growth_rate) ** year)
            pv = future_fcf / ((1 + discount_rate) ** year)
            pv_growth += pv

        # Terminal value (perpetuity starting year N+1)
        terminal_fcf = fcf_per_share * ((1 + growth_rate) ** growth_years) * (1 + terminal_growth)
        terminal_value = terminal_fcf / (discount_rate - terminal_growth)

        # Present value of terminal value
        pv_terminal = terminal_value / ((1 + discount_rate) ** growth_years)

        return pv_growth + pv_terminal

    @staticmethod
    def pe_based_valuation(eps, target_pe=20):
        """
        P/E Based Valuation

        Args:
            eps: Earnings per share (₹)
            target_pe: Target P/E ratio (default: 20, market average)

        Returns:
            float: Fair value per share
        """
        if eps > 0:
            return eps * target_pe
        return 0

    @staticmethod
    def pb_based_valuation(book_value_per_share, target_pb=3):
        """
        P/B Based Valuation

        Args:
            book_value_per_share: Book value per share (₹)
            target_pb: Target P/B ratio (default: 3)

        Returns:
            float: Fair value per share
        """
        if book_value_per_share > 0:
            return book_value_per_share * target_pb
        return 0

    @staticmethod
    def ddm_gordon_growth(dividend_per_share, growth_rate, discount_rate):
        """
        Dividend Discount Model - Gordon Growth Model

        Formula: Intrinsic Value = D₁ / (r - g)
        Where: D₁ = next year's dividend, r = discount rate, g = growth rate

        Args:
            dividend_per_share: Current dividend per share (₹)
            growth_rate: Expected dividend growth rate
            discount_rate: Required rate of return

        Returns:
            float: Intrinsic value per share
        """
        if dividend_per_share <= 0 or discount_rate <= growth_rate:
            return 0

        next_dividend = dividend_per_share * (1 + growth_rate)
        return next_dividend / (discount_rate - growth_rate)

    @staticmethod
    def calculate_intrinsic_value(data, current_price=None):
        """
        Calculate intrinsic value using multiple methods and average them

        Args:
            data: Dict with financial data (latest year)
            current_price: Current market price (optional, for deriving shares)

        Returns:
            Dict with all valuation methods and average
        """
        # Get number of shares
        shares = data.get('raw_number_of_shares', 0) or 0

        # Try to derive shares from market cap if not available
        if shares == 0 and current_price and current_price > 0:
            market_cap = data.get('market_cap', 0) or 0
            if market_cap > 0:
                shares = market_cap / current_price

        # Return error if we don't have shares
        if shares == 0:
            return {
                'graham_number': 0,
                'dcf_value': 0,
                'pe_based_value': 0,
                'pb_based_value': 0,
                'average_intrinsic': 0,
                'error': 'Share count not available - cannot calculate per-share intrinsic value'
            }

        # Calculate per-share metrics
        eps = data.get('raw_eps', 0) or 0
        book_value_per_share = (data.get('raw_equity', 0) or 0) / shares
        fcf = data.get('raw_operating_cash_flow', 0) or 0
        fcf_per_share = fcf / shares if fcf > 0 else 0

        # Calculate using different methods
        graham = ValuationModels.graham_number(eps, book_value_per_share)
        dcf = ValuationModels.dcf_simple(fcf_per_share) if fcf_per_share > 0 else 0
        pe_based = ValuationModels.pe_based_valuation(eps)
        pb_based = ValuationModels.pb_based_valuation(book_value_per_share)

        # Sanity check - flag extreme values
        if graham > 100000 or dcf > 100000:
            return {
                'graham_number': 0,
                'dcf_value': 0,
                'pe_based_value': pe_based,
                'pb_based_value': pb_based,
                'average_intrinsic': pe_based,
                'error': 'Calculated values too extreme - data quality issue'
            }

        # Calculate average of valid values
        valid_values = [v for v in [graham, dcf, pe_based, pb_based] if v > 0]
        average = sum(valid_values) / len(valid_values) if valid_values else 0

        return {
            'graham_number': round(graham, 2),
            'dcf_value': round(dcf, 2),
            'pe_based_value': round(pe_based, 2),
            'pb_based_value': round(pb_based, 2),
            'average_intrinsic': round(average, 2),
            'methods_used': len(valid_values),
            'shares': shares
        }

    @staticmethod
    def calculate_margin_of_safety(intrinsic_value, market_price):
        """
        Calculate margin of safety %

        Args:
            intrinsic_value: Estimated intrinsic value per share (₹)
            market_price: Current market price (₹)

        Returns:
            float: Margin of safety as percentage (positive = undervalued)
        """
        if market_price and market_price > 0:
            return ((intrinsic_value - market_price) / market_price) * 100
        return None
