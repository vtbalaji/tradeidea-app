#!/usr/bin/env python3
"""
Automated Red Flags Detection System

Implements rules-based detection of accounting and financial red flags.
Combines ratio analysis, trend analysis, and pattern matching to identify
potential issues requiring manual investigation.
"""


class RedFlagsDetector:
    """Detect financial and accounting red flags"""

    @staticmethod
    def detect_all(data_timeseries, industry_benchmarks=None):
        """
        Run all red flag checks

        Args:
            data_timeseries: List of dicts with financial data (newest to oldest)
            industry_benchmarks: Optional dict with industry averages

        Returns:
            Dict with categorized red flags
        """
        if not data_timeseries or len(data_timeseries) < 1:
            return {
                'total_flags': 0,
                'high_severity': [],
                'medium_severity': [],
                'low_severity': [],
                'error': 'Insufficient data'
            }

        high_severity = []
        medium_severity = []
        low_severity = []

        # Run all detection rules
        current = data_timeseries[0]

        # Single-period flags
        high_severity.extend(RedFlagsDetector._check_liquidity_crisis(current))
        high_severity.extend(RedFlagsDetector._check_negative_equity(current))
        medium_severity.extend(RedFlagsDetector._check_high_leverage(current))
        medium_severity.extend(RedFlagsDetector._check_negative_cash_flow(current))
        low_severity.extend(RedFlagsDetector._check_low_interest_coverage(current))

        # Multi-period flags (if available)
        if len(data_timeseries) >= 2:
            previous = data_timeseries[1]

            high_severity.extend(RedFlagsDetector._check_revenue_profit_divergence(current, previous))
            medium_severity.extend(RedFlagsDetector._check_margin_compression(current, previous))
            medium_severity.extend(RedFlagsDetector._check_asset_growth_anomaly(current, previous))
            low_severity.extend(RedFlagsDetector._check_declining_efficiency(current, previous))

        # Industry comparison flags (if benchmarks provided)
        if industry_benchmarks:
            medium_severity.extend(RedFlagsDetector._check_industry_outliers(current, industry_benchmarks))

        # Multi-year trend flags
        if len(data_timeseries) >= 3:
            medium_severity.extend(RedFlagsDetector._check_declining_trends(data_timeseries))

        return {
            'total_flags': len(high_severity) + len(medium_severity) + len(low_severity),
            'high_severity': high_severity,
            'medium_severity': medium_severity,
            'low_severity': low_severity,
            'summary': RedFlagsDetector._generate_summary(high_severity, medium_severity, low_severity)
        }

    @staticmethod
    def _check_liquidity_crisis(data):
        """Check for immediate liquidity concerns"""
        flags = []

        try:
            current_ratio = data['current_assets'] / (data['current_liabilities'] + 0.01)

            if current_ratio < 0.5:
                flags.append({
                    'type': 'Liquidity Crisis',
                    'description': f"Current ratio critically low at {current_ratio:.2f} - immediate liquidity risk",
                    'value': round(current_ratio, 2),
                    'threshold': 0.5
                })
            elif current_ratio < 1.0:
                return [{
                    'type': 'Liquidity Concern',
                    'description': f"Current ratio below 1.0 at {current_ratio:.2f} - monitor cash position",
                    'value': round(current_ratio, 2),
                    'threshold': 1.0
                }]  # Medium severity, not high

        except:
            pass

        return flags

    @staticmethod
    def _check_negative_equity(data):
        """Check for negative shareholders' equity"""
        flags = []

        try:
            if data['equity'] < 0:
                flags.append({
                    'type': 'Negative Equity',
                    'description': f"Shareholders' equity is negative at ₹{data['equity'] / 10000000:.2f} Cr - liabilities exceed assets",
                    'value': round(data['equity'] / 10000000, 2)
                })
        except:
            pass

        return flags

    @staticmethod
    def _check_high_leverage(data):
        """Check for excessive debt levels"""
        flags = []

        try:
            debt_to_equity = data['total_debt'] / (data['equity'] + 0.01)

            if debt_to_equity > 3.0:
                flags.append({
                    'type': 'Excessive Leverage',
                    'description': f"Debt-to-equity ratio at {debt_to_equity:.2f} - heavily leveraged",
                    'value': round(debt_to_equity, 2),
                    'threshold': 3.0
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_negative_cash_flow(data):
        """Check for negative operating cash flow"""
        flags = []

        try:
            if data['operating_cf'] < 0:
                flags.append({
                    'type': 'Negative Operating Cash Flow',
                    'description': f"Operating cash flow is negative at ₹{data['operating_cf'] / 10000000:.2f} Cr - burning cash",
                    'value': round(data['operating_cf'] / 10000000, 2)
                })
        except:
            pass

        return flags

    @staticmethod
    def _check_low_interest_coverage(data):
        """Check if company can service debt"""
        flags = []

        try:
            if data['interest_expense'] > 0:
                interest_coverage = data['ebit'] / data['interest_expense']

                if interest_coverage < 2.0:
                    flags.append({
                        'type': 'Low Interest Coverage',
                        'description': f"Interest coverage at {interest_coverage:.2f}x - difficulty servicing debt",
                        'value': round(interest_coverage, 2),
                        'threshold': 2.0
                    })
        except:
            pass

        return flags

    @staticmethod
    def _check_revenue_profit_divergence(current, previous):
        """Check if revenue and profit moving in opposite directions"""
        flags = []

        try:
            revenue_growth = (current['revenue'] - previous['revenue']) / (previous['revenue'] + 0.01)
            profit_growth = (current['net_income'] - previous['net_income']) / (abs(previous['net_income']) + 0.01)

            # Revenue up, profit down (or vice versa)
            if revenue_growth > 0.1 and profit_growth < -0.1:
                flags.append({
                    'type': 'Revenue-Profit Divergence',
                    'description': f"Revenue up {revenue_growth * 100:.1f}% but profit down {abs(profit_growth) * 100:.1f}% - margin compression",
                    'revenue_growth': round(revenue_growth * 100, 2),
                    'profit_growth': round(profit_growth * 100, 2)
                })
            elif revenue_growth < -0.1 and profit_growth > 0.1:
                flags.append({
                    'type': 'Revenue-Profit Divergence',
                    'description': f"Revenue down {abs(revenue_growth) * 100:.1f}% but profit up {profit_growth * 100:.1f}% - investigate source",
                    'revenue_growth': round(revenue_growth * 100, 2),
                    'profit_growth': round(profit_growth * 100, 2)
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_margin_compression(current, previous):
        """Check for significant margin decline"""
        flags = []

        try:
            current_margin = current['net_income'] / (current['revenue'] + 0.01)
            previous_margin = previous['net_income'] / (previous['revenue'] + 0.01)

            margin_change = current_margin - previous_margin

            if margin_change < -0.05:  # 5% absolute decline
                flags.append({
                    'type': 'Margin Compression',
                    'description': f"Net margin declined from {previous_margin * 100:.1f}% to {current_margin * 100:.1f}% - profitability pressure",
                    'current_margin': round(current_margin * 100, 2),
                    'previous_margin': round(previous_margin * 100, 2),
                    'change': round(margin_change * 100, 2)
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_asset_growth_anomaly(current, previous):
        """Check if assets growing much faster than revenue"""
        flags = []

        try:
            revenue_growth = (current['revenue'] - previous['revenue']) / (previous['revenue'] + 0.01)
            asset_growth = (current['total_assets'] - previous['total_assets']) / (previous['total_assets'] + 0.01)

            if asset_growth > revenue_growth * 2 and asset_growth > 0.15:
                flags.append({
                    'type': 'Asset Growth Anomaly',
                    'description': f"Assets growing {asset_growth * 100:.1f}% vs revenue {revenue_growth * 100:.1f}% - investigate capital deployment",
                    'asset_growth': round(asset_growth * 100, 2),
                    'revenue_growth': round(revenue_growth * 100, 2)
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_declining_efficiency(current, previous):
        """Check for declining asset turnover"""
        flags = []

        try:
            current_turnover = current['revenue'] / (current['total_assets'] + 0.01)
            previous_turnover = previous['revenue'] / (previous['total_assets'] + 0.01)

            decline = (current_turnover - previous_turnover) / (previous_turnover + 0.01)

            if decline < -0.15:  # 15% decline
                flags.append({
                    'type': 'Declining Asset Efficiency',
                    'description': f"Asset turnover declined {abs(decline) * 100:.1f}% - assets becoming less productive",
                    'current_turnover': round(current_turnover, 2),
                    'previous_turnover': round(previous_turnover, 2),
                    'decline_pct': round(decline * 100, 2)
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_industry_outliers(data, benchmarks):
        """Check if company significantly deviates from industry norms"""
        flags = []

        try:
            # Check gross margin vs industry
            company_gm = data['gross_profit'] / (data['revenue'] + 0.01)
            industry_gm = benchmarks.get('gross_margin', 0.3)

            if company_gm > industry_gm * 1.5:
                flags.append({
                    'type': 'Margin Outlier',
                    'description': f"Gross margin {company_gm * 100:.1f}% significantly above industry {industry_gm * 100:.1f}% - verify sustainability",
                    'company_value': round(company_gm * 100, 2),
                    'industry_value': round(industry_gm * 100, 2)
                })

            # Check ROE vs industry
            company_roe = data['net_income'] / (data['equity'] + 0.01)
            industry_roe = benchmarks.get('roe', 0.15)

            if company_roe > industry_roe * 2 and company_roe > 0.3:
                flags.append({
                    'type': 'ROE Outlier',
                    'description': f"ROE {company_roe * 100:.1f}% much higher than industry {industry_roe * 100:.1f}% - validate competitive advantage",
                    'company_value': round(company_roe * 100, 2),
                    'industry_value': round(industry_roe * 100, 2)
                })

        except:
            pass

        return flags

    @staticmethod
    def _check_declining_trends(data_timeseries):
        """Check for consistent declining trends over multiple years"""
        flags = []

        try:
            # Check if revenue declining for 2+ consecutive years
            revenue_declines = 0
            for i in range(len(data_timeseries) - 1):
                if data_timeseries[i]['revenue'] < data_timeseries[i + 1]['revenue']:
                    revenue_declines += 1

            if revenue_declines >= 2:
                flags.append({
                    'type': 'Sustained Revenue Decline',
                    'description': f"Revenue declining for {revenue_declines} consecutive years - business in trouble",
                    'years_declining': revenue_declines
                })

            # Check if profit margins declining consistently
            margin_declines = 0
            for i in range(len(data_timeseries) - 1):
                current_margin = data_timeseries[i]['net_income'] / (data_timeseries[i]['revenue'] + 0.01)
                previous_margin = data_timeseries[i + 1]['net_income'] / (data_timeseries[i + 1]['revenue'] + 0.01)

                if current_margin < previous_margin:
                    margin_declines += 1

            if margin_declines >= 2:
                flags.append({
                    'type': 'Sustained Margin Decline',
                    'description': f"Profit margins declining for {margin_declines} consecutive years - competitive pressure",
                    'years_declining': margin_declines
                })

        except:
            pass

        return flags

    @staticmethod
    def _generate_summary(high, medium, low):
        """Generate overall summary of red flags"""
        total = len(high) + len(medium) + len(low)

        if total == 0:
            return {
                'assessment': 'CLEAN',
                'message': 'No significant red flags detected',
                'recommendation': 'Financials appear healthy - proceed with standard due diligence'
            }
        elif len(high) > 0:
            return {
                'assessment': 'HIGH_RISK',
                'message': f'{len(high)} high-severity red flags detected',
                'recommendation': 'AVOID - Critical issues require immediate attention'
            }
        elif len(medium) >= 3:
            return {
                'assessment': 'MEDIUM_RISK',
                'message': f'{len(medium)} medium-severity red flags detected',
                'recommendation': 'CAUTION - Detailed investigation required before investment'
            }
        else:
            return {
                'assessment': 'LOW_RISK',
                'message': f'{total} minor red flags detected',
                'recommendation': 'MONITOR - Watch identified issues but acceptable for further analysis'
            }


# Example usage
if __name__ == '__main__':
    # Test data
    current = {
        'current_assets': 300000000,
        'current_liabilities': 400000000,  # Liquidity issue
        'total_assets': 1000000000,
        'equity': 500000000,
        'total_debt': 450000000,
        'operating_cf': -20000000,  # Negative CF
        'ebit': 80000000,
        'interest_expense': 50000000,  # Low coverage
        'revenue': 1000000000,
        'gross_profit': 350000000,
        'net_income': 50000000
    }

    previous = {
        'total_assets': 900000000,
        'revenue': 950000000,
        'net_income': 80000000,  # Profit declining
        'gross_profit': 340000000
    }

    data_timeseries = [current, previous]

    result = RedFlagsDetector.detect_all(data_timeseries)

    print('Red Flags Detection Report')
    print('=' * 70)
    print(f"Total Flags: {result['total_flags']}")
    print(f"Assessment: {result['summary']['assessment']}")
    print(f"Recommendation: {result['summary']['recommendation']}")

    if result['high_severity']:
        print('\nHIGH SEVERITY FLAGS:')
        for i, flag in enumerate(result['high_severity'], 1):
            print(f"  {i}. {flag['type']}: {flag['description']}")

    if result['medium_severity']:
        print('\nMEDIUM SEVERITY FLAGS:')
        for i, flag in enumerate(result['medium_severity'], 1):
            print(f"  {i}. {flag['type']}: {flag['description']}")

    if result['low_severity']:
        print('\nLOW SEVERITY FLAGS:')
        for i, flag in enumerate(result['low_severity'], 1):
            print(f"  {i}. {flag['type']}: {flag['description']}")
