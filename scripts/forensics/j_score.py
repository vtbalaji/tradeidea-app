#!/usr/bin/env python3
"""
J-Score - Cash Flow Forensics

A custom forensic score focused on cash flow quality and red flags specific
to Indian companies. Analyzes patterns over multiple years to detect:
- Cash flow vs profit divergence
- Receivables buildup
- Inventory manipulation
- Asset revaluation games
- Other income dependency
- Reserves manipulation

Score Interpretation:
0-5: Low Risk
6-10: Medium Risk
11+: High Risk
"""


class JScore:
    """Calculate J-Score for cash flow and earnings quality forensics"""

    @staticmethod
    def calculate(data_timeseries):
        """
        Calculate J-Score based on multi-year analysis

        Args:
            data_timeseries: List of dicts with financial data (newest to oldest)

        Returns:
            Dict with J-Score, risk category, and detailed flags
        """
        if not data_timeseries or len(data_timeseries) < 2:
            return {
                'J_Score': None,
                'Risk_Category': 'INSUFFICIENT_DATA',
                'Error': 'Need at least 2 years of data'
            }

        try:
            score = 0
            flags = []

            # Analyze each year vs previous year
            for i in range(len(data_timeseries) - 1):
                current = data_timeseries[i]
                previous = data_timeseries[i + 1]

                # Flag 1: Cash Flow vs Profit Divergence (HIGH PRIORITY)
                cf_flag, cf_score = JScore._check_cf_profit_divergence(current)
                score += cf_score
                if cf_flag:
                    flags.append(cf_flag)

                # Flag 2: Receivables Growing Faster than Revenue
                rec_flag, rec_score = JScore._check_receivables_growth(current, previous)
                score += rec_score
                if rec_flag:
                    flags.append(rec_flag)

                # Flag 3: Inventory Turnover Declining
                inv_flag, inv_score = JScore._check_inventory_turnover(current, previous)
                score += inv_score
                if inv_flag:
                    flags.append(inv_flag)

                # Flag 4: Other Income Dependency
                oi_flag, oi_score = JScore._check_other_income_spike(current, previous)
                score += oi_score
                if oi_flag:
                    flags.append(oi_flag)

                # Flag 5: Reserves Movement Without Cash
                res_flag, res_score = JScore._check_reserves_anomaly(current, previous)
                score += res_score
                if res_flag:
                    flags.append(res_flag)

                # Flag 6: Working Capital Deterioration
                wc_flag, wc_score = JScore._check_working_capital(current, previous)
                score += wc_score
                if wc_flag:
                    flags.append(wc_flag)

            # Additional multi-year patterns
            # Flag 7: Consistent negative cash flow
            neg_cf_flag, neg_cf_score = JScore._check_consistent_negative_cf(data_timeseries)
            score += neg_cf_score
            if neg_cf_flag:
                flags.append(neg_cf_flag)

            # Flag 8: Asset quality deterioration
            asset_flag, asset_score = JScore._check_asset_quality_trend(data_timeseries)
            score += asset_score
            if asset_flag:
                flags.append(asset_flag)

            # Determine risk category
            if score >= 11:
                risk_category = 'High'
                recommendation = 'AVOID - Multiple serious red flags detected'
            elif score >= 6:
                risk_category = 'Medium'
                recommendation = 'CAUTION - Requires detailed investigation'
            else:
                risk_category = 'Low'
                recommendation = 'ACCEPTABLE - No major concerns'

            return {
                'J_Score': score,
                'Risk_Category': risk_category,
                'Recommendation': recommendation,
                'Flags_Count': len(flags),
                'Flags': flags,
                'Years_Analyzed': len(data_timeseries)
            }

        except Exception as e:
            return {
                'J_Score': None,
                'Risk_Category': 'ERROR',
                'Error': str(e)
            }

    @staticmethod
    def _check_cf_profit_divergence(data):
        """Check if cash flow significantly lags profit"""
        try:
            ocf = data['operating_cf']
            ni = data['net_income']

            if ni <= 0:
                return None, 0

            cf_ni_ratio = ocf / ni

            if cf_ni_ratio < 0.5:
                return {
                    'year': data.get('fy', 'Unknown'),
                    'type': 'Cash Flow Divergence',
                    'severity': 'HIGH',
                    'description': f"Operating CF only {int(cf_ni_ratio * 100)}% of Net Income - earnings not backed by cash",
                    'values': {
                        'ocf_cr': round(ocf / 10000000, 2),
                        'ni_cr': round(ni / 10000000, 2),
                        'ratio': round(cf_ni_ratio, 2)
                    }
                }, 3
            elif cf_ni_ratio < 0.8:
                return {
                    'year': data.get('fy', 'Unknown'),
                    'type': 'Cash Flow Divergence',
                    'severity': 'MEDIUM',
                    'description': f"Operating CF is {int(cf_ni_ratio * 100)}% of Net Income - monitor accruals",
                    'values': {
                        'ocf_cr': round(ocf / 10000000, 2),
                        'ni_cr': round(ni / 10000000, 2),
                        'ratio': round(cf_ni_ratio, 2)
                    }
                }, 1
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_receivables_growth(current, previous):
        """Check if receivables growing faster than revenue"""
        try:
            # Data quality check: Skip if receivables data is missing or negligible
            # (common for IT services companies with quarterly snapshots)
            MIN_RECEIVABLES = 10000000  # 1 Crore minimum threshold

            if (not current.get('receivables') or current['receivables'] < MIN_RECEIVABLES or
                not previous.get('receivables') or previous['receivables'] < MIN_RECEIVABLES):
                return None, 0

            # Also skip if revenue is too low
            if previous['revenue'] < MIN_RECEIVABLES:
                return None, 0

            rev_growth = (current['revenue'] - previous['revenue']) / previous['revenue']
            rec_growth = (current['receivables'] - previous['receivables']) / previous['receivables']

            if rec_growth > rev_growth * 1.5 and rec_growth > 0.1:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Receivables Buildup',
                    'severity': 'HIGH',
                    'description': f"Receivables growing {int(rec_growth * 100)}% vs Revenue {int(rev_growth * 100)}% - possible revenue inflation",
                    'values': {
                        'revenue_growth': round(rev_growth * 100, 2),
                        'receivables_growth': round(rec_growth * 100, 2)
                    }
                }, 3
            elif rec_growth > rev_growth * 1.2:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Receivables Buildup',
                    'severity': 'MEDIUM',
                    'description': f"Receivables growing faster than revenue - watch collection efficiency",
                    'values': {
                        'revenue_growth': round(rev_growth, 2),
                        'receivables_growth': round(rec_growth, 2)
                    }
                }, 2
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_inventory_turnover(current, previous):
        """Check if inventory turnover is declining"""
        try:
            # Data quality check: Skip if inventory data is missing or negligible
            # This is common for service companies (IT, consulting, etc.)
            MIN_INVENTORY = 10000000  # 1 Crore minimum threshold

            if (not current.get('inventory') or current['inventory'] < MIN_INVENTORY or
                not previous.get('inventory') or previous['inventory'] < MIN_INVENTORY):
                return None, 0

            # Also need valid COGS data
            if not current.get('cogs') or not previous.get('cogs'):
                return None, 0

            current_turnover = current['cogs'] / current['inventory']
            previous_turnover = previous['cogs'] / previous['inventory']

            # Sanity check: Turnover should be reasonable (not astronomical)
            # For most companies, turnover between 1x to 100x is normal
            if current_turnover > 1000 or previous_turnover > 1000:
                return None, 0  # Likely bad data

            change_pct = ((current_turnover - previous_turnover) / previous_turnover) * 100

            if current_turnover < previous_turnover * 0.85:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Inventory Deterioration',
                    'severity': 'MEDIUM',
                    'description': f"Inventory turnover declined {abs(int(change_pct))}% - possible obsolete inventory",
                    'values': {
                        'current_turnover': round(current_turnover, 2),
                        'previous_turnover': round(previous_turnover, 2),
                        'change_pct': round(change_pct, 2)
                    }
                }, 2
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_other_income_spike(current, previous):
        """Check if other income is disproportionately high"""
        try:
            current_oi_pct = current['other_income'] / (current['revenue'] + 0.01)
            previous_oi_pct = previous['other_income'] / (previous['revenue'] + 0.01)

            # Check absolute level
            if current_oi_pct > 0.2:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Other Income Dependency',
                    'severity': 'HIGH',
                    'description': f"Other income is {int(current_oi_pct * 100)}% of revenue - unsustainable earnings",
                    'values': {
                        'other_income_pct': round(current_oi_pct * 100, 2)
                    }
                }, 2
            # Check sudden spike
            elif current_oi_pct > previous_oi_pct * 2 and current_oi_pct > 0.05:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Other Income Spike',
                    'severity': 'MEDIUM',
                    'description': f"Other income doubled from {int(previous_oi_pct * 100)}% to {int(current_oi_pct * 100)}% of revenue",
                    'values': {
                        'current_oi_pct': round(current_oi_pct * 100, 2),
                        'previous_oi_pct': round(previous_oi_pct * 100, 2)
                    }
                }, 1
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_reserves_anomaly(current, previous):
        """Check if reserves movement is abnormal (without profit/dividends)"""
        try:
            # Skip if reserves data is missing or zero (data quality issue)
            if current['reserves'] == 0 or previous['reserves'] == 0:
                return None, 0

            reserves_change = current['reserves'] - previous['reserves']
            net_income = current['net_income']

            # Get dividend data if available
            total_dividends = 0
            if 'dividends_paid' in current and current['dividends_paid']:
                total_dividends = abs(current['dividends_paid'])
            elif 'dividend_per_share' in current and current['shares_outstanding']:
                total_dividends = current['dividend_per_share'] * current['shares_outstanding']

            # Case 1: Reserves INCREASED more than profit
            if reserves_change > net_income * 1.3 and reserves_change > 0:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Reserves Anomaly - Unexplained Increase',
                    'severity': 'MEDIUM',
                    'description': f"Reserves increased ₹{int(reserves_change / 10000000)} Cr vs profit ₹{int(net_income / 10000000)} Cr - investigate source (revaluation/FX gains?)",
                    'values': {
                        'reserves_change_cr': round(reserves_change / 10000000, 2),
                        'net_income_cr': round(net_income / 10000000, 2)
                    }
                }, 2

            # Case 2: Reserves DECREASED significantly WITHOUT sufficient dividends
            # Expected decrease = dividends paid
            # If actual decrease > expected, it's a red flag
            elif reserves_change < 0:
                expected_decrease = total_dividends
                actual_decrease = abs(reserves_change)
                unexplained_decrease = actual_decrease - expected_decrease

                # Flag if unexplained decrease > 20% of net income
                if unexplained_decrease > net_income * 0.2 and unexplained_decrease > 1000000000:  # >100 Cr
                    if total_dividends > 0:
                        description = f"Reserves declined ₹{int(actual_decrease / 10000000)} Cr (dividends: ₹{int(expected_decrease / 10000000)} Cr, unexplained: ₹{int(unexplained_decrease / 10000000)} Cr) - investigate losses/write-offs"
                    else:
                        description = f"Reserves declined ₹{int(actual_decrease / 10000000)} Cr with no dividends reported - investigate losses/write-offs/adjustments"

                    return {
                        'year': current.get('fy', 'Unknown'),
                        'type': 'Reserves Anomaly - Unexplained Decrease',
                        'severity': 'MEDIUM',
                        'description': description,
                        'values': {
                            'reserves_decrease_cr': round(actual_decrease / 10000000, 2),
                            'dividends_paid_cr': round(expected_decrease / 10000000, 2),
                            'unexplained_cr': round(unexplained_decrease / 10000000, 2),
                            'net_income_cr': round(net_income / 10000000, 2)
                        }
                    }, 2

            return None, 0

        except Exception as e:
            return None, 0

    @staticmethod
    def _check_working_capital(current, previous):
        """Check if working capital deteriorating"""
        try:
            current_wc = current['current_assets'] - current['current_liabilities']
            previous_wc = previous['current_assets'] - previous['current_liabilities']

            change = current_wc - previous_wc
            change_pct = (change / (abs(previous_wc) + 0.01)) * 100

            if current_wc < 0 and previous_wc > 0:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Working Capital Crisis',
                    'severity': 'HIGH',
                    'description': f"Working capital turned negative - liquidity crisis",
                    'values': {
                        'current_wc_cr': round(current_wc / 10000000, 2),
                        'previous_wc_cr': round(previous_wc / 10000000, 2)
                    }
                }, 3
            elif change_pct < -30:
                return {
                    'year': current.get('fy', 'Unknown'),
                    'type': 'Working Capital Decline',
                    'severity': 'MEDIUM',
                    'description': f"Working capital declined {abs(int(change_pct))}% - watch liquidity",
                    'values': {
                        'change_pct': round(change_pct, 2)
                    }
                }, 1
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_consistent_negative_cf(data_timeseries):
        """Check for consistent negative operating cash flow"""
        try:
            negative_years = 0
            for data in data_timeseries:
                if data['operating_cf'] < 0:
                    negative_years += 1

            if negative_years >= 2:
                return {
                    'type': 'Chronic Negative Cash Flow',
                    'severity': 'HIGH',
                    'description': f"Operating cash flow negative in {negative_years} out of {len(data_timeseries)} years - business model issue",
                    'values': {
                        'negative_years': negative_years,
                        'total_years': len(data_timeseries)
                    }
                }, 3
            else:
                return None, 0

        except:
            return None, 0

    @staticmethod
    def _check_asset_quality_trend(data_timeseries):
        """Check if asset quality deteriorating over time"""
        try:
            if len(data_timeseries) < 3:
                return None, 0

            # Calculate trend in current assets to total assets ratio
            oldest = data_timeseries[-1]
            newest = data_timeseries[0]

            oldest_ca_ratio = oldest['current_assets'] / (oldest['total_assets'] + 0.01)
            newest_ca_ratio = newest['current_assets'] / (newest['total_assets'] + 0.01)

            change = newest_ca_ratio - oldest_ca_ratio

            if change < -0.1:  # 10% decline in current assets ratio
                return {
                    'type': 'Asset Quality Deterioration',
                    'severity': 'MEDIUM',
                    'description': f"Current assets declining as % of total assets - quality concern",
                    'values': {
                        'oldest_ratio': round(oldest_ca_ratio * 100, 2),
                        'newest_ratio': round(newest_ca_ratio * 100, 2)
                    }
                }, 1
            else:
                return None, 0

        except:
            return None, 0


# Example usage
if __name__ == '__main__':
    # Test data - 3 years
    data_timeseries = [
        {  # FY2025 (most recent)
            'fy': 'FY2025',
            'revenue': 1100000000,
            'net_income': 150000000,
            'operating_cf': 80000000,  # Low CF vs profit
            'receivables': 250000000,  # High receivables
            'inventory': 120000000,
            'cogs': 700000000,
            'other_income': 250000000,  # High other income
            'reserves': 500000000,
            'current_assets': 600000000,
            'current_liabilities': 400000000,
            'total_assets': 1200000000
        },
        {  # FY2024
            'fy': 'FY2024',
            'revenue': 1000000000,
            'net_income': 140000000,
            'operating_cf': 130000000,
            'receivables': 180000000,
            'inventory': 100000000,
            'cogs': 650000000,
            'other_income': 50000000,
            'reserves': 400000000,
            'current_assets': 550000000,
            'current_liabilities': 350000000,
            'total_assets': 1100000000
        },
        {  # FY2023 (oldest)
            'fy': 'FY2023',
            'revenue': 950000000,
            'net_income': 135000000,
            'operating_cf': 140000000,
            'receivables': 160000000,
            'inventory': 95000000,
            'cogs': 620000000,
            'other_income': 45000000,
            'reserves': 350000000,
            'current_assets': 520000000,
            'current_liabilities': 330000000,
            'total_assets': 1050000000
        }
    ]

    result = JScore.calculate(data_timeseries)

    print('J-Score Cash Flow Forensics')
    print('=' * 70)
    print(f"J-Score: {result['J_Score']}")
    print(f"Risk Category: {result['Risk_Category']}")
    print(f"Recommendation: {result['Recommendation']}")
    print(f"Years Analyzed: {result['Years_Analyzed']}")
    print(f"Flags Detected: {result['Flags_Count']}")
    print('\nDetailed Flags:')
    for i, flag in enumerate(result['Flags'], 1):
        print(f"\n{i}. {flag['type']} [{flag['severity']}]")
        print(f"   Year: {flag.get('year', 'Multi-year')}")
        print(f"   {flag['description']}")
        if 'values' in flag:
            print(f"   Values: {flag['values']}")
