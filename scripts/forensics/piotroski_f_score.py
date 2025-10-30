#!/usr/bin/env python3
"""
Piotroski F-Score Calculator

The Piotroski F-Score is a 9-point scale that assesses the strength of a
company's financial position. It combines profitability, leverage, liquidity,
and operating efficiency signals.

F-Score 8-9: Strong
F-Score 5-7: Moderate
F-Score 0-4: Weak

Reference: Piotroski, Joseph D. (2000). "Value Investing: The Use of Historical
Financial Statement Information to Separate Winners from Losers"
"""


class PiotroskiFScore:
    """Calculate Piotroski F-Score for fundamental strength assessment"""

    @staticmethod
    def _is_bank(data):
        """
        Detect if company is a bank/financial institution
        Banks have different balance sheet structure (no current assets/liabilities split)
        and different income statement (net interest income, provisions, etc.)
        """
        # Primary indicator: Banks don't have current assets/liabilities split
        # Check if both are zero or None (typical for banks)
        current_assets = data.get('current_assets') or 0
        current_liabilities = data.get('current_liabilities') or 0
        no_current_split = (current_assets == 0 and current_liabilities == 0)

        # Secondary check: Has significant investments (banks have large investment portfolios)
        total_assets = data.get('total_assets') or 1
        investments = data.get('investments') or 0
        high_investment_ratio = (investments / total_assets) > 0.20  # Banks typically >20%

        # Detect bank if no current ratio AND high investments
        return no_current_split and high_investment_ratio

    @staticmethod
    def calculate(current_year, previous_year):
        """
        Calculate Piotroski F-Score

        Args:
            current_year: Dict with current year financial data
            previous_year: Dict with previous year financial data

        Returns:
            Dict with F-Score (0-9) and detailed breakdown
        """
        try:
            score = 0
            details = {}

            # Detect if this is a bank/financial institution
            is_bank = PiotroskiFScore._is_bank(current_year)

            # PROFITABILITY SIGNALS (4 possible points)
            # 1. Positive Return on Assets
            roa_positive, roa_detail = PiotroskiFScore._check_roa_positive(current_year)
            if roa_positive:
                score += 1
            details['ROA_Positive'] = roa_detail

            # 2. Positive Operating Cash Flow
            ocf_positive, ocf_detail = PiotroskiFScore._check_ocf_positive(current_year)
            if ocf_positive:
                score += 1
            details['OCF_Positive'] = ocf_detail

            # 3. Improving Return on Assets
            roa_improved, roa_imp_detail = PiotroskiFScore._check_roa_improvement(current_year, previous_year)
            if roa_improved:
                score += 1
            details['ROA_Improvement'] = roa_imp_detail

            # 4. Quality of Earnings (OCF > Net Income)
            # Note: This test is NOT applicable for banks due to provisions, MTM adjustments, etc.
            if is_bank:
                # For banks, auto-pass this test (banks have different accrual patterns)
                quality_earnings = True
                quality_detail = {
                    'score': 1,
                    'description': 'Quality earnings test skipped for bank (auto-pass)'
                }
            else:
                quality_earnings, quality_detail = PiotroskiFScore._check_accruals_quality(current_year)

            if quality_earnings:
                score += 1
            details['Quality_Earnings'] = quality_detail

            # LEVERAGE, LIQUIDITY, AND SOURCE OF FUNDS (3 possible points)
            # 5. Decrease in Long-term Debt
            debt_decreased, debt_detail = PiotroskiFScore._check_debt_decrease(current_year, previous_year)
            if debt_decreased:
                score += 1
            details['Debt_Change'] = debt_detail

            # 6. Improvement in Current Ratio
            # Note: Banks don't have traditional current assets/liabilities split
            if is_bank:
                # For banks, skip this test (auto-pass)
                liquidity_improved = True
                liq_detail = {
                    'score': 1,
                    'description': 'Liquidity test skipped for bank (no current ratio for banks)'
                }
            else:
                liquidity_improved, liq_detail = PiotroskiFScore._check_liquidity_improvement(current_year, previous_year)

            if liquidity_improved:
                score += 1
            details['Liquidity_Improvement'] = liq_detail

            # 7. No new equity issued
            no_dilution, dilution_detail = PiotroskiFScore._check_no_dilution(current_year, previous_year)
            if no_dilution:
                score += 1
            details['No_Equity_Issuance'] = dilution_detail

            # OPERATING EFFICIENCY (2 possible points)
            # 8. Improvement in Gross Margin
            # Note: For banks, "gross margin" doesn't apply; check operating profit margin instead
            if is_bank:
                margin_improved, margin_detail = PiotroskiFScore._check_margin_improvement_bank(current_year, previous_year)
            else:
                margin_improved, margin_detail = PiotroskiFScore._check_margin_improvement(current_year, previous_year)

            if margin_improved:
                score += 1
            details['Margin_Improvement'] = margin_detail

            # 9. Improvement in Asset Turnover
            turnover_improved, turnover_detail = PiotroskiFScore._check_turnover_improvement(current_year, previous_year)
            if turnover_improved:
                score += 1
            details['Turnover_Improvement'] = turnover_detail

            # Categorize strength
            if score >= 8:
                strength_category = 'Strong'
                investment_quality = 'High Quality'
            elif score >= 5:
                strength_category = 'Moderate'
                investment_quality = 'Average Quality'
            else:
                strength_category = 'Weak'
                investment_quality = 'Low Quality'

            return {
                'F_Score': score,
                'Max_Score': 9,
                'Strength_Category': strength_category,
                'Investment_Quality': investment_quality,
                'Details': details,
                'Summary': PiotroskiFScore._generate_summary(details, score)
            }

        except Exception as e:
            return {
                'F_Score': None,
                'Strength_Category': 'ERROR',
                'Error': str(e)
            }

    @staticmethod
    def _check_roa_positive(data):
        """Check if ROA is positive"""
        try:
            roa = data['net_income'] / (data['total_assets'] + 0.01)
            is_positive = roa > 0
            return is_positive, {
                'score': 1 if is_positive else 0,
                'value': round(roa * 100, 2),
                'description': f"ROA is {round(roa * 100, 2)}% ({'Positive' if is_positive else 'Negative'})"
            }
        except:
            return False, {'score': 0, 'value': None, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_ocf_positive(data):
        """Check if Operating Cash Flow is positive"""
        try:
            ocf = data['operating_cf']
            is_positive = ocf > 0
            ocf_cr = ocf / 10000000  # Convert to crores
            return is_positive, {
                'score': 1 if is_positive else 0,
                'value': round(ocf_cr, 2),
                'description': f"Operating CF is ₹{round(ocf_cr, 2)} Cr ({'Positive' if is_positive else 'Negative'})"
            }
        except:
            return False, {'score': 0, 'value': None, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_roa_improvement(current, previous):
        """Check if ROA improved year-over-year"""
        try:
            current_roa = current['net_income'] / (current['total_assets'] + 0.01)
            previous_roa = previous['net_income'] / (previous['total_assets'] + 0.01)
            improved = current_roa > previous_roa
            change = (current_roa - previous_roa) * 100
            return improved, {
                'score': 1 if improved else 0,
                'current': round(current_roa * 100, 2),
                'previous': round(previous_roa * 100, 2),
                'change': round(change, 2),
                'description': f"ROA {'improved' if improved else 'declined'} from {round(previous_roa * 100, 2)}% to {round(current_roa * 100, 2)}%"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_accruals_quality(data):
        """Check if Operating CF > Net Income (quality of earnings)"""
        try:
            ocf = data['operating_cf']
            ni = data['net_income']
            quality = ocf > ni
            ratio = ocf / (ni + 0.01)
            return quality, {
                'score': 1 if quality else 0,
                'ocf_ni_ratio': round(ratio, 2),
                'description': f"OCF/NI ratio is {round(ratio, 2)} ({'Good quality' if quality else 'Poor quality - high accruals'})"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_debt_decrease(current, previous):
        """Check if long-term debt decreased"""
        try:
            current_debt = current['long_term_debt']
            previous_debt = previous['long_term_debt']
            decreased = current_debt < previous_debt
            change_pct = ((current_debt - previous_debt) / (previous_debt + 0.01)) * 100
            return decreased, {
                'score': 1 if decreased else 0,
                'current': round(current_debt / 10000000, 2),
                'previous': round(previous_debt / 10000000, 2),
                'change_pct': round(change_pct, 2),
                'description': f"Debt {'decreased' if decreased else 'increased'} by {abs(round(change_pct, 2))}%"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_liquidity_improvement(current, previous):
        """Check if current ratio improved"""
        try:
            current_ratio_current = current['current_assets'] / (current['current_liabilities'] + 0.01)
            current_ratio_previous = previous['current_assets'] / (previous['current_liabilities'] + 0.01)
            improved = current_ratio_current > current_ratio_previous
            return improved, {
                'score': 1 if improved else 0,
                'current': round(current_ratio_current, 2),
                'previous': round(current_ratio_previous, 2),
                'description': f"Current ratio {'improved' if improved else 'declined'} from {round(current_ratio_previous, 2)} to {round(current_ratio_current, 2)}"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_no_dilution(current, previous):
        """Check if no new equity was issued (shares outstanding didn't increase)"""
        try:
            current_shares = current['shares_outstanding']
            previous_shares = previous['shares_outstanding']

            # If shares data not available, check share capital instead
            if current_shares == 0 or previous_shares == 0:
                current_shares = current['share_capital']
                previous_shares = previous['share_capital']

            no_new_issue = current_shares <= previous_shares
            change_pct = ((current_shares - previous_shares) / (previous_shares + 0.01)) * 100

            return no_new_issue, {
                'score': 1 if no_new_issue else 0,
                'current': current_shares,
                'previous': previous_shares,
                'change_pct': round(change_pct, 2),
                'description': f"{'No dilution' if no_new_issue else 'Equity diluted'} ({round(change_pct, 2)}% change)"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_margin_improvement(current, previous):
        """Check if gross margin improved"""
        try:
            current_margin = current['gross_profit'] / (current['revenue'] + 0.01)
            previous_margin = previous['gross_profit'] / (previous['revenue'] + 0.01)
            improved = current_margin > previous_margin
            change = (current_margin - previous_margin) * 100
            return improved, {
                'score': 1 if improved else 0,
                'current': round(current_margin * 100, 2),
                'previous': round(previous_margin * 100, 2),
                'change': round(change, 2),
                'description': f"Gross margin {'improved' if improved else 'declined'} from {round(previous_margin * 100, 2)}% to {round(current_margin * 100, 2)}%"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_margin_improvement_bank(current, previous):
        """Check if operating profit margin improved (for banks)"""
        try:
            current_margin = current['operating_profit'] / (current['revenue'] + 0.01)
            previous_margin = previous['operating_profit'] / (previous['revenue'] + 0.01)
            improved = current_margin > previous_margin
            change = (current_margin - previous_margin) * 100
            return improved, {
                'score': 1 if improved else 0,
                'current': round(current_margin * 100, 2),
                'previous': round(previous_margin * 100, 2),
                'change': round(change, 2),
                'description': f"Operating margin {'improved' if improved else 'declined'} from {round(previous_margin * 100, 2)}% to {round(current_margin * 100, 2)}%"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _check_turnover_improvement(current, previous):
        """Check if asset turnover improved"""
        try:
            current_turnover = current['revenue'] / (current['total_assets'] + 0.01)
            previous_turnover = previous['revenue'] / (previous['total_assets'] + 0.01)
            improved = current_turnover > previous_turnover
            change_pct = ((current_turnover - previous_turnover) / (previous_turnover + 0.01)) * 100
            return improved, {
                'score': 1 if improved else 0,
                'current': round(current_turnover, 2),
                'previous': round(previous_turnover, 2),
                'change_pct': round(change_pct, 2),
                'description': f"Asset turnover {'improved' if improved else 'declined'} from {round(previous_turnover, 2)} to {round(current_turnover, 2)}"
            }
        except:
            return False, {'score': 0, 'description': 'Unable to calculate'}

    @staticmethod
    def _generate_summary(details, score):
        """Generate summary of strengths and weaknesses"""
        strengths = []
        weaknesses = []

        for key, value in details.items():
            if value.get('score', 0) == 1:
                strengths.append(value.get('description', key))
            else:
                weaknesses.append(value.get('description', key))

        return {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'overall': f"Company scores {score}/9, showing {'strong' if score >= 8 else 'moderate' if score >= 5 else 'weak'} fundamentals"
        }


# Example usage
if __name__ == '__main__':
    # Test data
    current = {
        'net_income': 150000000,
        'total_assets': 1000000000,
        'operating_cf': 180000000,
        'long_term_debt': 250000000,
        'current_assets': 500000000,
        'current_liabilities': 300000000,
        'shares_outstanding': 100000000,
        'share_capital': 100000000,
        'gross_profit': 400000000,
        'revenue': 1000000000
    }

    previous = {
        'net_income': 140000000,
        'total_assets': 950000000,
        'operating_cf': 160000000,
        'long_term_debt': 300000000,
        'current_assets': 450000000,
        'current_liabilities': 310000000,
        'shares_outstanding': 100000000,
        'share_capital': 100000000,
        'gross_profit': 370000000,
        'revenue': 950000000
    }

    result = PiotroskiFScore.calculate(current, previous)

    print('Piotroski F-Score Analysis')
    print('=' * 70)
    print(f"F-Score: {result['F_Score']}/{result['Max_Score']}")
    print(f"Strength Category: {result['Strength_Category']}")
    print(f"Investment Quality: {result['Investment_Quality']}")
    print('\nDetails:')
    for key, value in result['Details'].items():
        print(f"  {key}: {value.get('description', 'N/A')}")
    print('\nSummary:')
    print(f"  {result['Summary']['overall']}")
    print('\nStrengths:')
    for strength in result['Summary']['strengths']:
        print(f"  + {strength}")
    print('\nWeaknesses:')
    for weakness in result['Summary']['weaknesses']:
        print(f"  - {weakness}")
