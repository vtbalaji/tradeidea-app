"""
Fundamental Financial Metrics - Single Source of Truth

Common financial ratio and metric calculations used across all analysis scripts.
All formulas are standardized here to ensure consistency.
"""

import numpy as np


class FundamentalMetrics:
    """Calculate standard financial metrics from raw financial data"""

    @staticmethod
    def calculate_roe(net_profit, equity):
        """
        Return on Equity (ROE) %

        Args:
            net_profit: Net profit/income (₹)
            equity: Shareholders' equity (₹)

        Returns:
            float: ROE as percentage
        """
        if equity and equity > 0:
            return (net_profit / equity) * 100
        return None

    @staticmethod
    def calculate_roa(net_profit, total_assets):
        """
        Return on Assets (ROA) %

        Args:
            net_profit: Net profit/income (₹)
            total_assets: Total assets (₹)

        Returns:
            float: ROA as percentage
        """
        if total_assets and total_assets > 0:
            return (net_profit / total_assets) * 100
        return None

    @staticmethod
    def calculate_roce(ebit, capital_employed):
        """
        Return on Capital Employed (ROCE) %

        Args:
            ebit: Earnings before interest and tax (₹)
            capital_employed: Total assets - Current liabilities (₹)

        Returns:
            float: ROCE as percentage
        """
        if capital_employed and capital_employed > 0:
            return (ebit / capital_employed) * 100
        return None

    @staticmethod
    def calculate_profit_margin(net_profit, revenue):
        """
        Net Profit Margin %

        Args:
            net_profit: Net profit (₹)
            revenue: Total revenue (₹)

        Returns:
            float: Profit margin as percentage
        """
        if revenue and revenue > 0:
            return (net_profit / revenue) * 100
        return None

    @staticmethod
    def calculate_gross_margin(gross_profit, revenue):
        """
        Gross Profit Margin %

        Args:
            gross_profit: Gross profit (₹)
            revenue: Total revenue (₹)

        Returns:
            float: Gross margin as percentage
        """
        if revenue and revenue > 0:
            return (gross_profit / revenue) * 100
        return None

    @staticmethod
    def calculate_operating_margin(operating_profit, revenue):
        """
        Operating Profit Margin %

        Args:
            operating_profit: Operating profit/EBIT (₹)
            revenue: Total revenue (₹)

        Returns:
            float: Operating margin as percentage
        """
        if revenue and revenue > 0:
            return (operating_profit / revenue) * 100
        return None

    @staticmethod
    def calculate_debt_to_equity(total_debt, equity):
        """
        Debt-to-Equity Ratio

        Args:
            total_debt: Total debt (₹)
            equity: Shareholders' equity (₹)

        Returns:
            float: D/E ratio
        """
        if equity and equity > 0:
            return total_debt / equity
        return None

    @staticmethod
    def calculate_current_ratio(current_assets, current_liabilities):
        """
        Current Ratio (Liquidity measure)

        Args:
            current_assets: Current assets (₹)
            current_liabilities: Current liabilities (₹)

        Returns:
            float: Current ratio
        """
        if current_liabilities and current_liabilities > 0:
            return current_assets / current_liabilities
        return None

    @staticmethod
    def calculate_quick_ratio(current_assets, inventories, current_liabilities):
        """
        Quick Ratio / Acid Test Ratio

        Args:
            current_assets: Current assets (₹)
            inventories: Inventories (₹)
            current_liabilities: Current liabilities (₹)

        Returns:
            float: Quick ratio
        """
        if current_liabilities and current_liabilities > 0:
            quick_assets = current_assets - (inventories or 0)
            return quick_assets / current_liabilities
        return None

    @staticmethod
    def calculate_pe_ratio(market_price, eps):
        """
        Price-to-Earnings Ratio

        Args:
            market_price: Current market price per share (₹)
            eps: Earnings per share (₹)

        Returns:
            float: P/E ratio
        """
        if eps and eps > 0:
            return market_price / eps
        return None

    @staticmethod
    def calculate_pb_ratio(market_price, book_value_per_share):
        """
        Price-to-Book Ratio

        Args:
            market_price: Current market price per share (₹)
            book_value_per_share: Book value per share (₹)

        Returns:
            float: P/B ratio
        """
        if book_value_per_share and book_value_per_share > 0:
            return market_price / book_value_per_share
        return None

    @staticmethod
    def calculate_ev_ebitda(market_cap, total_debt, cash, ebitda):
        """
        EV/EBITDA Ratio

        Args:
            market_cap: Market capitalization (₹)
            total_debt: Total debt (₹)
            cash: Cash and equivalents (₹)
            ebitda: EBITDA (₹)

        Returns:
            float: EV/EBITDA ratio
        """
        enterprise_value = market_cap + (total_debt or 0) - (cash or 0)
        if ebitda and ebitda > 0:
            return enterprise_value / ebitda
        return None

    @staticmethod
    def calculate_asset_turnover(revenue, total_assets):
        """
        Asset Turnover Ratio

        Args:
            revenue: Total revenue (₹)
            total_assets: Total assets (₹)

        Returns:
            float: Asset turnover ratio
        """
        if total_assets and total_assets > 0:
            return revenue / total_assets
        return None

    @staticmethod
    def calculate_inventory_turnover(cogs, average_inventory):
        """
        Inventory Turnover Ratio

        Args:
            cogs: Cost of goods sold (₹)
            average_inventory: Average inventory (₹)

        Returns:
            float: Inventory turnover ratio
        """
        if average_inventory and average_inventory > 0:
            return cogs / average_inventory
        return None

    @staticmethod
    def calculate_receivables_turnover(revenue, average_receivables):
        """
        Receivables Turnover Ratio

        Args:
            revenue: Total revenue (₹)
            average_receivables: Average accounts receivable (₹)

        Returns:
            float: Receivables turnover ratio
        """
        if average_receivables and average_receivables > 0:
            return revenue / average_receivables
        return None

    @staticmethod
    def calculate_ocf_to_ni_ratio(operating_cash_flow, net_income):
        """
        Operating Cash Flow to Net Income Ratio (Earnings Quality)

        Args:
            operating_cash_flow: Operating cash flow (₹)
            net_income: Net income (₹)

        Returns:
            float: OCF/NI ratio
        """
        if net_income and net_income > 0:
            return operating_cash_flow / net_income
        return None

    @staticmethod
    def calculate_all_ratios(data):
        """
        Calculate all standard ratios from financial data dict

        Args:
            data: Dict with raw financial data (raw_revenue, raw_net_profit, etc.)

        Returns:
            Dict with all calculated ratios
        """
        ratios = {}

        # Profitability ratios
        ratios['roe'] = FundamentalMetrics.calculate_roe(
            data.get('raw_net_profit', 0),
            data.get('raw_equity', 0)
        )

        ratios['roa'] = FundamentalMetrics.calculate_roa(
            data.get('raw_net_profit', 0),
            data.get('raw_assets', 0)
        )

        ratios['net_margin'] = FundamentalMetrics.calculate_profit_margin(
            data.get('raw_net_profit', 0),
            data.get('raw_revenue', 0)
        )

        ratios['gross_margin'] = FundamentalMetrics.calculate_gross_margin(
            data.get('raw_gross_profit', 0),
            data.get('raw_revenue', 0)
        )

        ratios['operating_margin'] = FundamentalMetrics.calculate_operating_margin(
            data.get('raw_operating_profit', 0),
            data.get('raw_revenue', 0)
        )

        # Leverage ratios
        ratios['debt_to_equity'] = FundamentalMetrics.calculate_debt_to_equity(
            data.get('raw_total_debt', 0),
            data.get('raw_equity', 0)
        )

        # Liquidity ratios
        ratios['current_ratio'] = FundamentalMetrics.calculate_current_ratio(
            data.get('raw_current_assets', 0),
            data.get('raw_current_liabilities', 0)
        )

        ratios['quick_ratio'] = FundamentalMetrics.calculate_quick_ratio(
            data.get('raw_current_assets', 0),
            data.get('raw_inventories', 0),
            data.get('raw_current_liabilities', 0)
        )

        # Efficiency ratios
        ratios['asset_turnover'] = FundamentalMetrics.calculate_asset_turnover(
            data.get('raw_revenue', 0),
            data.get('raw_assets', 0)
        )

        # Cash flow quality
        ratios['ocf_to_ni'] = FundamentalMetrics.calculate_ocf_to_ni_ratio(
            data.get('raw_operating_cash_flow', 0),
            data.get('raw_net_profit', 0)
        )

        # Valuation ratios (if market data available)
        eps = data.get('raw_eps', 0)
        market_cap = data.get('market_cap', 0)
        shares = data.get('raw_number_of_shares', 0)

        if eps and shares and shares > 0:
            book_value_per_share = data.get('raw_equity', 0) / shares
            # These require current market price, can't calculate from fundamental data alone
            ratios['pb_ratio'] = None  # Need market price
            ratios['pe_ratio'] = None  # Need market price

        return {k: round(v, 2) if v is not None else None for k, v in ratios.items()}
