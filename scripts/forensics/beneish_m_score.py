#!/usr/bin/env python3
"""
Beneish M-Score Calculator

The Beneish M-Score is a mathematical model that uses eight financial ratios
to identify whether a company has manipulated its earnings.

M-Score > -2.22 suggests possible earnings manipulation
M-Score < -2.22 suggests company is less likely to be a manipulator

Reference: Beneish, M. D. (1999). "The Detection of Earnings Manipulation"
"""

import math


class BeneishMScore:
    """Calculate Beneish M-Score for earnings manipulation detection"""

    # Threshold for manipulation
    MANIPULATION_THRESHOLD = -2.22

    @staticmethod
    def calculate(current_year, previous_year):
        """
        Calculate Beneish M-Score

        Args:
            current_year: Dict with current year financial data
            previous_year: Dict with previous year financial data

        Returns:
            Dict with M-Score, flag, and component values
        """
        try:
            # Calculate 8 indices
            dsri = BeneishMScore._calculate_dsri(current_year, previous_year)
            gmi = BeneishMScore._calculate_gmi(current_year, previous_year)
            aqi = BeneishMScore._calculate_aqi(current_year, previous_year)
            sgi = BeneishMScore._calculate_sgi(current_year, previous_year)
            depi = BeneishMScore._calculate_depi(current_year, previous_year)
            sgai = BeneishMScore._calculate_sgai(current_year, previous_year)
            lvgi = BeneishMScore._calculate_lvgi(current_year, previous_year)
            tata = BeneishMScore._calculate_tata(current_year)

            # Calculate M-Score using Beneish's formula
            m_score = (
                -4.84 +
                0.92 * dsri +
                0.528 * gmi +
                0.404 * aqi +
                0.892 * sgi +
                0.115 * depi -
                0.172 * sgai +
                4.679 * tata -
                0.327 * lvgi
            )

            # Determine if likely manipulator
            is_manipulator = m_score > BeneishMScore.MANIPULATION_THRESHOLD

            # Risk category
            if m_score > -1.78:
                risk_category = 'HIGH'
            elif m_score > -2.22:
                risk_category = 'MEDIUM'
            else:
                risk_category = 'LOW'

            return {
                'M_Score': round(m_score, 4),
                'Is_Manipulator': is_manipulator,
                'Risk_Category': risk_category,
                'Threshold': BeneishMScore.MANIPULATION_THRESHOLD,
                'Components': {
                    'DSRI': round(dsri, 4),
                    'GMI': round(gmi, 4),
                    'AQI': round(aqi, 4),
                    'SGI': round(sgi, 4),
                    'DEPI': round(depi, 4),
                    'SGAI': round(sgai, 4),
                    'TATA': round(tata, 4),
                    'LVGI': round(lvgi, 4)
                },
                'Interpretation': BeneishMScore._interpret_components({
                    'DSRI': dsri,
                    'GMI': gmi,
                    'AQI': aqi,
                    'SGI': sgi,
                    'DEPI': depi,
                    'SGAI': sgai,
                    'TATA': tata,
                    'LVGI': lvgi
                })
            }

        except Exception as e:
            return {
                'M_Score': None,
                'Is_Manipulator': None,
                'Risk_Category': 'ERROR',
                'Error': str(e)
            }

    @staticmethod
    def _calculate_dsri(current, previous):
        """
        Days Sales in Receivables Index
        Measures whether receivables are growing faster than sales

        DSRI > 1: Receivables growing faster than revenue (red flag)
        """
        try:
            current_dsr = current['receivables'] / (current['revenue'] + 0.01)
            previous_dsr = previous['receivables'] / (previous['revenue'] + 0.01)
            return current_dsr / (previous_dsr + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_gmi(current, previous):
        """
        Gross Margin Index
        Measures deterioration in margins

        GMI > 1: Gross margin declining (red flag - may inflate earnings to compensate)
        """
        try:
            current_gm = current['gross_profit'] / (current['revenue'] + 0.01)
            previous_gm = previous['gross_profit'] / (previous['revenue'] + 0.01)
            return previous_gm / (current_gm + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_aqi(current, previous):
        """
        Asset Quality Index
        Measures proportion of non-current assets other than PPE

        AQI > 1: Asset quality declining (red flag - may be capitalizing costs)
        """
        try:
            current_nca_ratio = 1 - (
                (current['current_assets'] + current['ppe']) /
                (current['total_assets'] + 0.01)
            )
            previous_nca_ratio = 1 - (
                (previous['current_assets'] + previous['ppe']) /
                (previous['total_assets'] + 0.01)
            )
            return current_nca_ratio / (previous_nca_ratio + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_sgi(current, previous):
        """
        Sales Growth Index

        SGI > 1.465: Very high sales growth (red flag - pressure to sustain growth)
        """
        try:
            return current['revenue'] / (previous['revenue'] + 0.01)
        except:
            return 1.0

    @staticmethod
    def _calculate_depi(current, previous):
        """
        Depreciation Index
        Measures changes in depreciation rate

        DEPI > 1: Depreciation rate slowing (red flag - may be extending useful life)
        """
        try:
            current_dep_rate = (
                current['depreciation'] /
                (current['depreciation'] + current['ppe'] + 0.01)
            )
            previous_dep_rate = (
                previous['depreciation'] /
                (previous['depreciation'] + previous['ppe'] + 0.01)
            )
            return previous_dep_rate / (current_dep_rate + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_sgai(current, previous):
        """
        Sales, General, and Administrative Expenses Index

        SGAI > 1: SG&A expenses growing (potential red flag)
        SGAI < 1: SG&A efficiency improving (green flag)
        """
        try:
            current_sgai_ratio = current['sga'] / (current['revenue'] + 0.01)
            previous_sgai_ratio = previous['sga'] / (previous['revenue'] + 0.01)
            return current_sgai_ratio / (previous_sgai_ratio + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_lvgi(current, previous):
        """
        Leverage Index
        Measures change in debt levels

        LVGI > 1: Leverage increasing (red flag)
        """
        try:
            current_leverage = current['total_debt'] / (current['total_assets'] + 0.01)
            previous_leverage = previous['total_debt'] / (previous['total_assets'] + 0.01)
            return current_leverage / (previous_leverage + 0.0001)
        except:
            return 1.0

    @staticmethod
    def _calculate_tata(current):
        """
        Total Accruals to Total Assets
        Measures quality of earnings

        TATA > 0.06: High accruals (red flag - earnings not backed by cash)
        TATA < 0: Negative accruals (very good)
        """
        try:
            # Total Accruals = Net Income - Operating Cash Flow
            total_accruals = current['net_income'] - current['operating_cf']
            return total_accruals / (current['total_assets'] + 0.01)
        except:
            return 0.0

    @staticmethod
    def _interpret_components(components):
        """Provide interpretation of each component"""
        interpretations = []

        if components['DSRI'] > 1.2:
            interpretations.append('DSRI > 1.2: Receivables growing faster than revenue - possible revenue inflation')
        elif components['DSRI'] < 0.9:
            interpretations.append('DSRI < 0.9: Good receivables management')

        if components['GMI'] > 1.1:
            interpretations.append('GMI > 1.1: Declining gross margins - pressure to manipulate earnings')

        if components['AQI'] > 1.1:
            interpretations.append('AQI > 1.1: Deteriorating asset quality - possible cost capitalization')

        if components['SGI'] > 1.465:
            interpretations.append('SGI > 1.465: Very high growth - unsustainable, pressure to manipulate')
        elif components['SGI'] > 1.2:
            interpretations.append('SGI > 1.2: High growth - monitor sustainability')

        if components['DEPI'] > 1.1:
            interpretations.append('DEPI > 1.1: Depreciation rate slowing - possible useful life extension')

        if components['SGAI'] > 1.1:
            interpretations.append('SGAI > 1.1: SG&A expenses growing - operational inefficiency')
        elif components['SGAI'] < 0.9:
            interpretations.append('SGAI < 0.9: SG&A efficiency improving - positive sign')

        if components['TATA'] > 0.06:
            interpretations.append('TATA > 0.06: High accruals - earnings not backed by cash flow')
        elif components['TATA'] < 0:
            interpretations.append('TATA < 0: Negative accruals - very good earnings quality')

        if components['LVGI'] > 1.2:
            interpretations.append('LVGI > 1.2: Significant leverage increase - financial risk')

        return interpretations


# Example usage
if __name__ == '__main__':
    # Test data
    current = {
        'revenue': 1000000000,
        'gross_profit': 400000000,
        'net_income': 150000000,
        'operating_cf': 120000000,
        'receivables': 200000000,
        'current_assets': 500000000,
        'ppe': 300000000,
        'total_assets': 1000000000,
        'depreciation': 50000000,
        'sga': 100000000,
        'total_debt': 300000000
    }

    previous = {
        'revenue': 900000000,
        'gross_profit': 380000000,
        'net_income': 140000000,
        'operating_cf': 130000000,
        'receivables': 160000000,
        'current_assets': 450000000,
        'ppe': 280000000,
        'total_assets': 900000000,
        'depreciation': 45000000,
        'sga': 85000000,
        'total_debt': 250000000
    }

    result = BeneishMScore.calculate(current, previous)

    print('Beneish M-Score Analysis')
    print('=' * 70)
    print(f"M-Score: {result['M_Score']}")
    print(f"Threshold: {result['Threshold']}")
    print(f"Is Manipulator: {result['Is_Manipulator']}")
    print(f"Risk Category: {result['Risk_Category']}")
    print('\nComponents:')
    for key, value in result['Components'].items():
        print(f"  {key}: {value}")
    print('\nInterpretation:')
    for item in result['Interpretation']:
        print(f"  - {item}")
