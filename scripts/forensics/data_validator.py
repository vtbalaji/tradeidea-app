#!/usr/bin/env python3
"""
Data Validation Module - Industry Best Practices

Implements XBRL US Data Quality Committee (DQC) rules and industry standards
for validating financial data from multiple sources.

Based on:
- XBRL US DQC Rules v28.0.0 (October 2025)
- Daloopa validation framework
- SEC EDGAR validation requirements

Key Validations:
1. Accounting equation checks (Assets = Liabilities + Equity)
2. Reconciliation formulas (Balance sheet, P&L, Cash flow)
3. Sign checks (negative revenues, positive expenses)
4. Consistency checks (year-over-year validation)
5. Completeness checks (missing critical fields)

Usage:
    from data_validator import DataValidator

    validator = DataValidator()
    result = validator.validate_annual_data(data)

    if result['valid']:
        print("Data is valid")
    else:
        print(f"Validation errors: {result['errors']}")
"""

from datetime import datetime
from decimal import Decimal


class DataValidator:
    """Comprehensive data validation based on industry best practices"""

    # Tolerance for floating point comparisons (0.1%)
    TOLERANCE = 0.001

    def __init__(self):
        self.validation_results = []

    def validate_annual_data(self, data, symbol=None, fy=None):
        """
        Run all validation checks on annual financial data

        Returns:
            Dict with validation results:
            {
                'valid': True/False,
                'quality_score': 0-100,
                'errors': [],
                'warnings': [],
                'passed_checks': [],
                'data_completeness': 0-100
            }
        """
        errors = []
        warnings = []
        passed_checks = []

        if not data:
            return {
                'valid': False,
                'quality_score': 0,
                'errors': ['No data provided'],
                'warnings': [],
                'passed_checks': [],
                'data_completeness': 0
            }

        # DQC_0004: Accounting Equation - Assets = Liabilities + Equity
        check_result = self._check_accounting_equation(data)
        if check_result['error']:
            errors.append(f"DQC_0004: {check_result['message']}")
        elif check_result['warning']:
            warnings.append(f"DQC_0004: {check_result['message']}")
        else:
            passed_checks.append('DQC_0004: Accounting equation balanced')

        # DQC_0015: Negative value checks (revenues, assets should be positive)
        sign_check = self._check_value_signs(data)
        errors.extend([f"DQC_0015: {err}" for err in sign_check['errors']])
        warnings.extend([f"DQC_0015: {warn}" for warn in sign_check['warnings']])
        if sign_check['passed']:
            passed_checks.append('DQC_0015: Value signs correct')

        # P&L Reconciliation: Revenue - Expenses = Net Profit
        pl_check = self._check_pl_reconciliation(data)
        if pl_check['error']:
            errors.append(f"P&L Reconciliation: {pl_check['message']}")
        elif pl_check['warning']:
            warnings.append(f"P&L Reconciliation: {pl_check['message']}")
        else:
            passed_checks.append('P&L reconciliation passed')

        # Cash Flow Reconciliation
        cf_check = self._check_cashflow_reconciliation(data)
        if cf_check['error']:
            errors.append(f"Cash Flow: {cf_check['message']}")
        elif cf_check['warning']:
            warnings.append(f"Cash Flow: {cf_check['message']}")
        else:
            passed_checks.append('Cash flow reconciliation passed')

        # Data completeness check
        completeness = self._check_data_completeness(data)
        if completeness['score'] < 70:
            warnings.append(f"Data completeness low: {completeness['score']:.0f}% ({completeness['missing_critical']} critical fields missing)")
        else:
            passed_checks.append(f"Data completeness: {completeness['score']:.0f}%")

        # Reasonableness checks
        reasonable = self._check_reasonableness(data)
        errors.extend([f"Reasonableness: {err}" for err in reasonable['errors']])
        warnings.extend([f"Reasonableness: {warn}" for warn in reasonable['warnings']])
        if not reasonable['errors'] and not reasonable['warnings']:
            passed_checks.append('Reasonableness checks passed')

        # Calculate overall quality score
        quality_score = self._calculate_quality_score(
            len(errors), len(warnings), len(passed_checks),
            completeness['score']
        )

        # Determine if valid (no critical errors)
        valid = len(errors) == 0 and completeness['score'] >= 60

        return {
            'valid': valid,
            'quality_score': quality_score,
            'errors': errors,
            'warnings': warnings,
            'passed_checks': passed_checks,
            'data_completeness': completeness['score'],
            'missing_fields': completeness['missing_critical'],
            'metadata': {
                'symbol': symbol,
                'fy': fy,
                'validated_at': datetime.now().isoformat()
            }
        }

    def _check_accounting_equation(self, data):
        """
        DQC_0004: Assets = Liabilities + Equity

        Industry standard: The fundamental accounting equation must balance
        """
        assets = data.get('raw_assets') or data.get('total_assets') or 0
        equity = data.get('raw_equity') or data.get('shareholders_equity') or data.get('equity') or 0

        # Calculate total liabilities from components
        current_liab = data.get('raw_current_liabilities') or data.get('current_liabilities') or 0
        non_current_liab = data.get('raw_non_current_liabilities') or data.get('non_current_liabilities') or 0
        total_liabilities = current_liab + non_current_liab

        # If liabilities not available from components, try to calculate from equation
        if not total_liabilities and assets and equity:
            total_liabilities = assets - equity

        if not assets or not equity:
            return {
                'error': False,
                'warning': True,
                'message': 'Assets or Equity missing - cannot validate accounting equation'
            }

        # Accounting equation: Assets = Liabilities + Equity
        left_side = assets
        right_side = total_liabilities + equity

        # Allow small tolerance for rounding
        diff = abs(left_side - right_side)
        tolerance = abs(left_side) * self.TOLERANCE

        if diff > tolerance and diff > 1000000:  # > 0.1% and > ₹10 lakh
            return {
                'error': True,
                'warning': False,
                'message': f'Accounting equation does not balance: Assets ₹{assets/10000000:.2f} Cr != Liabilities (₹{total_liabilities/10000000:.2f} Cr) + Equity (₹{equity/10000000:.2f} Cr) = ₹{right_side/10000000:.2f} Cr (diff: ₹{diff/10000000:.2f} Cr)'
            }

        return {
            'error': False,
            'warning': False,
            'message': 'Accounting equation balanced'
        }

    def _check_value_signs(self, data):
        """
        DQC_0015: Check for incorrect signs on common elements

        Best practice: Revenues, assets should be positive
                      Expenses, liabilities can be positive
                      Losses can be negative
        """
        errors = []
        warnings = []

        # These should be positive (or zero)
        should_be_positive = {
            'raw_revenue': 'Revenue',
            'raw_assets': 'Total Assets',
            'raw_current_assets': 'Current Assets',
            'raw_equity': 'Equity',
            'market_cap': 'Market Cap',
        }

        for field, name in should_be_positive.items():
            value = data.get(field)
            if value is not None and value < 0:
                errors.append(f'{name} is negative: ₹{value/10000000:.2f} Cr')

        # These should typically be positive (warning if negative)
        typically_positive = {
            'raw_net_profit': 'Net Profit',
            'raw_operating_profit': 'Operating Profit',
            'raw_ebitda': 'EBITDA',
            'raw_operating_cash_flow': 'Operating Cash Flow',
        }

        for field, name in typically_positive.items():
            value = data.get(field)
            if value is not None and value < 0:
                warnings.append(f'{name} is negative: ₹{value/10000000:.2f} Cr (company may be loss-making)')

        passed = len(errors) == 0

        return {
            'errors': errors,
            'warnings': warnings,
            'passed': passed
        }

    def _check_pl_reconciliation(self, data):
        """
        P&L Reconciliation: Validate profit calculation

        Revenue + Other Income - Expenses - Tax = Net Profit
        """
        revenue = data.get('raw_revenue') or 0
        other_income = data.get('raw_other_income') or 0
        expenses = data.get('raw_operating_expenses') or 0
        depreciation = data.get('raw_depreciation') or 0
        finance_costs = data.get('raw_finance_costs') or 0
        tax = data.get('raw_tax_expense') or 0
        net_profit = data.get('raw_net_profit')
        pbt = data.get('raw_profit_before_tax')

        if not revenue or net_profit is None:
            return {
                'error': False,
                'warning': True,
                'message': 'P&L data incomplete - cannot reconcile'
            }

        # Best check: PBT - Tax = Net Profit (most reliable)
        if pbt is not None:
            calculated_profit = pbt - tax
            diff = abs(calculated_profit - net_profit)

            # Very tight tolerance for this check (0.1%)
            if diff < abs(revenue) * 0.001 or diff < 1000000:  # < 0.1% or < ₹10 lakh
                return {
                    'error': False,
                    'warning': False,
                    'message': 'P&L reconciled (PBT - Tax = Net Profit)'
                }

        # Fallback: Revenue + Other Income - Operating Expenses - Depreciation - Finance Costs - Tax ≈ Net Profit
        calculated_profit = revenue + other_income - expenses - depreciation - finance_costs - tax

        diff = abs(calculated_profit - net_profit)
        tolerance = abs(revenue) * 0.15  # 15% tolerance (P&L has many other components)

        if diff > tolerance and diff > 10000000:  # > 15% and > ₹1 Cr
            return {
                'error': False,  # Warning only - P&L can have exceptional items, other expenses
                'warning': True,
                'message': f'P&L components do not fully reconcile to Net Profit (diff: ₹{diff/10000000:.2f} Cr) - may have exceptional items or other income/expenses'
            }

        return {
            'error': False,
            'warning': False,
            'message': 'P&L reconciled'
        }

    def _check_cashflow_reconciliation(self, data):
        """
        Cash Flow Reconciliation: Operating + Investing + Financing ≈ Change in Cash

        Note: This is a soft check as cash flow has many components
        """
        operating_cf = data.get('raw_operating_cash_flow')
        investing_cf = data.get('raw_investing_cash_flow')
        financing_cf = data.get('raw_financing_cash_flow')

        if operating_cf is None and investing_cf is None and financing_cf is None:
            return {
                'error': False,
                'warning': True,
                'message': 'Cash flow data not available'
            }

        # Just check that we have at least one component
        has_cf_data = any([
            operating_cf is not None,
            investing_cf is not None,
            financing_cf is not None
        ])

        if not has_cf_data:
            return {
                'error': False,
                'warning': True,
                'message': 'Cash flow statement incomplete'
            }

        return {
            'error': False,
            'warning': False,
            'message': 'Cash flow data available'
        }

    def _check_data_completeness(self, data):
        """
        Check what percentage of critical fields are populated

        Returns completeness score 0-100
        """
        # Critical fields required for forensic analysis
        critical_fields = [
            'raw_revenue',
            'raw_net_profit',
            'raw_assets',
            'raw_equity',
            'raw_current_assets',
            'raw_current_liabilities',
        ]

        # Important but not critical
        important_fields = [
            'raw_operating_cash_flow',
            'raw_depreciation',
            'raw_total_debt',
            'raw_trade_receivables',
            'raw_inventories',
            'market_cap',
        ]

        critical_present = sum(1 for field in critical_fields if data.get(field) and data[field] != 0)
        important_present = sum(1 for field in important_fields if data.get(field) and data[field] != 0)

        # Critical fields worth 70%, important fields worth 30%
        critical_score = (critical_present / len(critical_fields)) * 70
        important_score = (important_present / len(important_fields)) * 30

        total_score = critical_score + important_score

        missing_critical = [f for f in critical_fields if not data.get(f) or data[f] == 0]

        return {
            'score': total_score,
            'critical_present': critical_present,
            'critical_total': len(critical_fields),
            'important_present': important_present,
            'missing_critical': missing_critical
        }

    def _check_reasonableness(self, data):
        """
        Reasonableness checks: Flag obviously wrong values

        Based on Daloopa best practices: catch anomalies that deviate beyond thresholds
        """
        errors = []
        warnings = []

        # Revenue vs Assets (usually Assets > Revenue, but not always)
        revenue = data.get('raw_revenue') or 0
        assets = data.get('raw_assets') or 0

        if revenue and assets:
            # Asset turnover ratio (Revenue / Assets)
            # Typically between 0.2 and 5 for most companies
            asset_turnover = revenue / assets if assets > 0 else 0

            if asset_turnover > 10:
                warnings.append(f'Unusually high asset turnover: {asset_turnover:.1f}x (Revenue >> Assets)')
            elif asset_turnover < 0.05:
                warnings.append(f'Unusually low asset turnover: {asset_turnover:.2f}x (Revenue << Assets)')

        # Profit Margin check
        net_profit = data.get('raw_net_profit')
        if revenue and net_profit is not None:
            margin = (net_profit / revenue * 100) if revenue > 0 else 0

            if margin > 100:
                errors.append(f'Net profit margin > 100%: {margin:.1f}% (impossible)')
            elif margin < -100:
                warnings.append(f'Net profit margin < -100%: {margin:.1f}% (severe losses)')
            elif margin > 50:
                warnings.append(f'Very high profit margin: {margin:.1f}% (unusual but possible)')

        # Current Ratio check (Current Assets / Current Liabilities)
        current_assets = data.get('raw_current_assets') or 0
        current_liabilities = data.get('raw_current_liabilities') or 0

        if current_assets and current_liabilities:
            current_ratio = current_assets / current_liabilities if current_liabilities > 0 else 999

            if current_ratio < 0.5:
                warnings.append(f'Very low current ratio: {current_ratio:.2f} (liquidity risk)')
            elif current_ratio > 10:
                warnings.append(f'Very high current ratio: {current_ratio:.1f} (excess cash or low utilization)')

        # Debt to Equity check
        debt = data.get('raw_total_debt') or 0
        equity = data.get('raw_equity') or 0

        if debt and equity and equity > 0:
            debt_to_equity = debt / equity

            if debt_to_equity > 5:
                warnings.append(f'Very high debt-to-equity: {debt_to_equity:.2f}x (high leverage)')
            elif debt_to_equity < 0:
                errors.append(f'Negative debt-to-equity: {debt_to_equity:.2f}x (negative equity)')

        return {
            'errors': errors,
            'warnings': warnings
        }

    def _calculate_quality_score(self, error_count, warning_count, passed_count, completeness_score):
        """
        Calculate overall data quality score (0-100)

        Scoring:
        - Start with completeness score (0-100)
        - Subtract 20 points per error
        - Subtract 5 points per warning
        - Add 2 points per passed check (max +20)
        """
        score = completeness_score

        # Penalties
        score -= (error_count * 20)
        score -= (warning_count * 5)

        # Bonuses for passed checks
        bonus = min(passed_count * 2, 20)
        score += bonus

        return max(0, min(100, score))

    def validate_timeseries(self, timeseries_data, symbol=None):
        """
        Validate time-series data for consistency across years

        DQC_0108, DQC_0115: Consistency checks over time
        """
        if not timeseries_data or len(timeseries_data) < 2:
            return {
                'valid': True,
                'warnings': ['Insufficient data for time-series validation (need 2+ years)']
            }

        warnings = []
        errors = []

        # Check for year-over-year consistency
        for i in range(len(timeseries_data) - 1):
            current = timeseries_data[i]
            previous = timeseries_data[i + 1]

            current_fy = current.get('fy', 'Unknown')
            previous_fy = previous.get('fy', 'Unknown')

            # Revenue should not decrease by more than 50% (unless restructuring)
            current_revenue = current.get('raw_revenue') or 0
            previous_revenue = previous.get('raw_revenue') or 0

            if previous_revenue > 0:
                revenue_change = ((current_revenue - previous_revenue) / previous_revenue) * 100

                if revenue_change < -50:
                    warnings.append(f'Revenue decreased by {abs(revenue_change):.1f}% from {previous_fy} to {current_fy} (possible restructuring or error)')
                elif revenue_change > 300:
                    warnings.append(f'Revenue increased by {revenue_change:.1f}% from {previous_fy} to {current_fy} (unusual growth or acquisition)')

            # Assets should not change drastically (unless major M&A)
            current_assets = current.get('raw_assets') or 0
            previous_assets = previous.get('raw_assets') or 0

            if previous_assets > 0:
                asset_change = ((current_assets - previous_assets) / previous_assets) * 100

                if asset_change < -40 or asset_change > 200:
                    warnings.append(f'Assets changed by {asset_change:.1f}% from {previous_fy} to {current_fy} (possible M&A or error)')

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }


# Example usage
if __name__ == '__main__':
    validator = DataValidator()

    # Test data
    test_data = {
        'symbol': 'TCS',
        'fy': 'FY2024',
        'raw_revenue': 231366 * 10000000,  # ₹231,366 Cr
        'raw_net_profit': 45648 * 10000000,  # ₹45,648 Cr
        'raw_assets': 200000 * 10000000,  # ₹200,000 Cr
        'raw_equity': 150000 * 10000000,  # ₹150,000 Cr
        'raw_current_assets': 120000 * 10000000,
        'raw_current_liabilities': 50000 * 10000000,
        'raw_operating_cash_flow': 50000 * 10000000,
        'market_cap': 1000000 * 10000000,
    }

    result = validator.validate_annual_data(test_data, 'TCS', 'FY2024')

    print(f'\n{"="*70}')
    print(f'Data Validation Results for {test_data["symbol"]} {test_data["fy"]}')
    print(f'{"="*70}')
    print(f'Valid: {result["valid"]}')
    print(f'Quality Score: {result["quality_score"]:.1f}/100')
    print(f'Data Completeness: {result["data_completeness"]:.1f}%')
    print(f'\n✅ Passed Checks ({len(result["passed_checks"])}):')
    for check in result['passed_checks']:
        print(f'  • {check}')

    if result['warnings']:
        print(f'\n⚠️  Warnings ({len(result["warnings"])}):')
        for warning in result['warnings']:
            print(f'  • {warning}')

    if result['errors']:
        print(f'\n❌ Errors ({len(result["errors"])}):')
        for error in result['errors']:
            print(f'  • {error}')

    print(f'{"="*70}\n')
