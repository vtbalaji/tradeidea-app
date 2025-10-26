#!/usr/bin/env python3
"""
Altman Z-Score Calculator

The Altman Z-Score predicts the probability of a company going bankrupt
within two years.

Z-Score > 2.99: Safe Zone
Z-Score 1.81 - 2.99: Grey Zone
Z-Score < 1.81: Distress Zone

Reference: Altman, Edward I. (1968). "Financial Ratios, Discriminant Analysis
and the Prediction of Corporate Bankruptcy"
"""


class AltmanZScore:
    """Calculate Altman Z-Score for bankruptcy prediction"""

    # Thresholds
    SAFE_ZONE = 2.99
    GREY_ZONE_LOWER = 1.81

    @staticmethod
    def calculate(data, company_type='manufacturing', is_listed=True):
        """
        Calculate Altman Z-Score

        Args:
            data: Dict with financial data
            company_type: 'manufacturing', 'service', or 'emerging_market'
            is_listed: Whether company is publicly listed

        Returns:
            Dict with Z-Score, risk category, and component values
        """
        try:
            # Calculate components
            x1 = AltmanZScore._calculate_x1(data)
            x2 = AltmanZScore._calculate_x2(data)
            x3 = AltmanZScore._calculate_x3(data)
            x4 = AltmanZScore._calculate_x4(data, is_listed)
            x5 = AltmanZScore._calculate_x5(data)

            # Select appropriate model
            if company_type == 'manufacturing' and is_listed:
                # Original Z-Score (1968)
                z_score = 1.2*x1 + 1.4*x2 + 3.3*x3 + 0.6*x4 + 1.0*x5
                safe_threshold = 2.99
                distress_threshold = 1.81
            elif company_type == 'service' or not is_listed:
                # Z'-Score for private firms and non-manufacturers (1983)
                z_score = 0.717*x1 + 0.847*x2 + 3.107*x3 + 0.420*x4 + 0.998*x5
                safe_threshold = 2.9
                distress_threshold = 1.23
            else:  # emerging_market
                # Z''-Score for emerging markets (1995)
                z_score = 6.56*x1 + 3.26*x2 + 6.72*x3 + 1.05*x4
                safe_threshold = 2.6
                distress_threshold = 1.1

            # Determine risk category
            if z_score > safe_threshold:
                risk_category = 'Safe'
                bankruptcy_probability = 'Very Low (<10%)'
            elif z_score > distress_threshold:
                risk_category = 'Grey Zone'
                bankruptcy_probability = 'Moderate (10-20%)'
            else:
                risk_category = 'Distress'
                bankruptcy_probability = 'High (>90%)'

            return {
                'Z_Score': round(z_score, 4),
                'Risk_Category': risk_category,
                'Bankruptcy_Probability': bankruptcy_probability,
                'Model_Type': company_type,
                'Safe_Threshold': safe_threshold,
                'Distress_Threshold': distress_threshold,
                'Components': {
                    'X1_Working_Capital_to_Assets': round(x1, 4),
                    'X2_Retained_Earnings_to_Assets': round(x2, 4),
                    'X3_EBIT_to_Assets': round(x3, 4),
                    'X4_Market_Value_to_Liabilities': round(x4, 4),
                    'X5_Sales_to_Assets': round(x5, 4)
                },
                'Interpretation': AltmanZScore._interpret_components(x1, x2, x3, x4, x5, risk_category)
            }

        except Exception as e:
            return {
                'Z_Score': None,
                'Risk_Category': 'ERROR',
                'Error': str(e)
            }

    @staticmethod
    def _calculate_x1(data):
        """
        X1 = Working Capital / Total Assets
        Measures liquidity relative to company size

        Positive: Company has excess current assets
        Negative: Liquidity problems
        """
        working_capital = data['current_assets'] - data['current_liabilities']
        return working_capital / (data['total_assets'] + 0.01)

    @staticmethod
    def _calculate_x2(data):
        """
        X2 = Retained Earnings / Total Assets
        Measures cumulative profitability

        Higher is better (more retained profits)
        """
        return data['retained_earnings'] / (data['total_assets'] + 0.01)

    @staticmethod
    def _calculate_x3(data):
        """
        X3 = EBIT / Total Assets
        Measures operating efficiency

        Higher is better (more productive assets)
        """
        return data['ebit'] / (data['total_assets'] + 0.01)

    @staticmethod
    def _calculate_x4(data, is_listed):
        """
        X4 = Market Value of Equity / Total Liabilities
        Measures how much assets can decline before liabilities exceed assets

        For listed companies: Use market cap
        For private companies: Use book value
        """
        if is_listed and data.get('market_cap', 0) > 0:
            equity_value = data['market_cap']
        else:
            equity_value = data['equity']

        total_liabilities = data['total_assets'] - data['equity']
        return equity_value / (total_liabilities + 0.01)

    @staticmethod
    def _calculate_x5(data):
        """
        X5 = Sales / Total Assets
        Measures asset turnover

        Higher is better (more efficient use of assets)
        """
        return data['revenue'] / (data['total_assets'] + 0.01)

    @staticmethod
    def _interpret_components(x1, x2, x3, x4, x5, risk_category):
        """Provide interpretation of each component"""
        interpretations = []

        # X1 - Working Capital
        if x1 < 0:
            interpretations.append('X1 Negative: Liquidity crisis - current liabilities exceed current assets')
        elif x1 < 0.1:
            interpretations.append('X1 Low: Tight liquidity position')
        elif x1 > 0.3:
            interpretations.append('X1 Strong: Healthy liquidity cushion')

        # X2 - Retained Earnings
        if x2 < 0:
            interpretations.append('X2 Negative: Accumulated losses - company never been profitable or distributed all earnings')
        elif x2 < 0.1:
            interpretations.append('X2 Low: Limited retained earnings buffer')
        elif x2 > 0.3:
            interpretations.append('X2 Strong: Good history of profitability')

        # X3 - EBIT to Assets (ROA before tax)
        if x3 < 0:
            interpretations.append('X3 Negative: Operating losses - business model not viable')
        elif x3 < 0.05:
            interpretations.append('X3 Low: Poor asset productivity')
        elif x3 > 0.15:
            interpretations.append('X3 Strong: Highly productive assets')

        # X4 - Equity to Liabilities
        if x4 < 0.5:
            interpretations.append('X4 Low: Highly leveraged - equity worth less than half of liabilities')
        elif x4 < 1.0:
            interpretations.append('X4 Moderate: Liabilities exceed equity value')
        elif x4 > 2.0:
            interpretations.append('X4 Strong: Equity worth more than twice the liabilities')

        # X5 - Asset Turnover
        if x5 < 0.5:
            interpretations.append('X5 Low: Poor asset utilization - may be asset-heavy industry')
        elif x5 > 2.0:
            interpretations.append('X5 High: Efficient asset utilization')

        # Overall assessment
        if risk_category == 'Distress':
            interpretations.append('OVERALL: High bankruptcy risk - immediate action required')
        elif risk_category == 'Grey Zone':
            interpretations.append('OVERALL: Uncertain financial health - requires close monitoring')
        else:
            interpretations.append('OVERALL: Financially healthy - low bankruptcy risk')

        return interpretations

    @staticmethod
    def calculate_trend(data_timeseries, company_type='manufacturing', is_listed=True):
        """
        Calculate Z-Score trend over multiple years

        Args:
            data_timeseries: List of dicts with financial data (newest to oldest)
            company_type: Type of company
            is_listed: Whether publicly listed

        Returns:
            Dict with trend analysis
        """
        trend = []

        for data in data_timeseries:
            result = AltmanZScore.calculate(data, company_type, is_listed)
            trend.append({
                'year': data.get('fy', 'Unknown'),
                'z_score': result['Z_Score'],
                'risk_category': result['Risk_Category']
            })

        # Analyze trend
        if len(trend) >= 2:
            recent_z = trend[0]['z_score']
            old_z = trend[-1]['z_score']

            if recent_z and old_z:
                change = recent_z - old_z
                if change > 0.5:
                    trend_direction = 'Improving'
                elif change < -0.5:
                    trend_direction = 'Deteriorating'
                else:
                    trend_direction = 'Stable'
            else:
                trend_direction = 'Unknown'
        else:
            trend_direction = 'Insufficient Data'

        return {
            'trend': trend,
            'direction': trend_direction
        }


# Example usage
if __name__ == '__main__':
    # Test data
    data = {
        'current_assets': 500000000,
        'current_liabilities': 300000000,
        'total_assets': 1000000000,
        'retained_earnings': 250000000,
        'ebit': 120000000,
        'equity': 600000000,
        'market_cap': 800000000,
        'revenue': 1200000000
    }

    result = AltmanZScore.calculate(data, company_type='manufacturing', is_listed=True)

    print('Altman Z-Score Analysis')
    print('=' * 70)
    print(f"Z-Score: {result['Z_Score']}")
    print(f"Risk Category: {result['Risk_Category']}")
    print(f"Bankruptcy Probability: {result['Bankruptcy_Probability']}")
    print(f"Model Type: {result['Model_Type']}")
    print(f"\nThresholds:")
    print(f"  Safe Zone: > {result['Safe_Threshold']}")
    print(f"  Distress Zone: < {result['Distress_Threshold']}")
    print('\nComponents:')
    for key, value in result['Components'].items():
        print(f"  {key}: {value}")
    print('\nInterpretation:')
    for item in result['Interpretation']:
        print(f"  - {item}")
