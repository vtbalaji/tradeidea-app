#!/usr/bin/env python3
"""
Capital Goods Sector Analyzer
For heavy engineering, power equipment, and capital goods companies like BHEL, L&T, etc.
"""

from typing import Dict, List, Any, Optional
from .base_sector import BaseSectorAnalyzer

class CapitalGoodsSectorAnalyzer(BaseSectorAnalyzer):
    """
    Analyzer for Capital Goods/Heavy Engineering sector
    Focus: Order book, execution, working capital, capacity utilization
    """

    # Industry benchmarks for capital goods sector
    BENCHMARKS = {
        'excellent': {
            'order_book_to_sales': 2.5,  # Order book / Annual sales (higher better)
            'order_inflow_growth': 15,   # YoY % (higher better)
            'ebitda_margin': 12,         # % (higher better)
            'working_capital_days': 60,  # Days (lower better)
            'asset_turnover': 1.5,       # Revenue / Total Assets (higher better)
            'roc': 15,                   # Return on Capital % (higher better)
            'debt_equity': 0.5,          # Debt / Equity (lower better)
            'interest_coverage': 6,      # EBIT / Interest (higher better)
            'export_revenue': 20,        # % of total revenue (higher better)
            'capacity_utilization': 80   # % (higher better)
        },
        'good': {
            'order_book_to_sales': 2.0,
            'order_inflow_growth': 10,
            'ebitda_margin': 9,
            'working_capital_days': 90,
            'asset_turnover': 1.2,
            'roc': 12,
            'debt_equity': 0.8,
            'interest_coverage': 4,
            'export_revenue': 15,
            'capacity_utilization': 70
        },
        'acceptable': {
            'order_book_to_sales': 1.5,
            'order_inflow_growth': 5,
            'ebitda_margin': 6,
            'working_capital_days': 120,
            'asset_turnover': 0.9,
            'roc': 9,
            'debt_equity': 1.2,
            'interest_coverage': 2.5,
            'export_revenue': 10,
            'capacity_utilization': 60
        },
        'poor': {
            'order_book_to_sales': 1.0,
            'order_inflow_growth': 0,
            'ebitda_margin': 3,
            'working_capital_days': 150,
            'asset_turnover': 0.6,
            'roc': 6,
            'debt_equity': 1.8,
            'interest_coverage': 1.5,
            'export_revenue': 5,
            'capacity_utilization': 50
        }
    }

    def get_sector_name(self) -> str:
        return "Capital Goods & Engineering"

    def get_key_metrics(self) -> Dict[str, Any]:
        """Get all key capital goods metrics"""
        return {
            'order_book': self._analyze_order_book(),
            'execution': self._analyze_execution(),
            'profitability': self._analyze_profitability(),
            'working_capital': self._analyze_working_capital(),
            'capital_efficiency': self._analyze_capital_efficiency(),
            'financial_health': self._analyze_financial_health(),
            'diversification': self._analyze_diversification(),
            'overall_score': self._calculate_overall_score()
        }

    def _analyze_order_book(self) -> Dict[str, Any]:
        """
        Analyze order book strength and visibility
        Key for capital goods - indicates future revenue visibility
        """
        try:
            latest = self.latest

            # Order book to sales ratio
            order_book = self._safe_float(latest.get('order_book', 0))
            revenue = self._safe_float(latest.get('revenue', 0)) or self._safe_float(latest.get('raw_revenue', 0))

            # Check if order book data is available
            if order_book == 0:
                return {
                    'data_available': False,
                    'order_book': None,
                    'order_book_to_sales': None,
                    'order_book_rating': '⚪',
                    'order_inflow': None,
                    'order_inflow_growth': None,
                    'inflow_rating': '⚪',
                    'visibility_months': None,
                    'trend': [],
                    'interpretation': 'Order book data not available in financial statements. This metric is typically disclosed in quarterly results or investor presentations.'
                }

            if revenue > 0:
                ob_to_sales = order_book / revenue
            else:
                ob_to_sales = 0

            # Order inflow (current year order book - previous year order book + revenue)
            prev_ob = 0
            if len(self.data) > 1:
                prev_ob = self._safe_float(self.data[1].get('order_book', 0))

            order_inflow = order_book - prev_ob + revenue
            order_inflow_growth = 0
            if len(self.data) > 1:
                prev_inflow = self._safe_float(self.data[1].get('order_book', 0))
                if prev_inflow > 0:
                    order_inflow_growth = ((order_inflow - prev_inflow) / prev_inflow) * 100

            # Assessment
            ob_rating = self._get_rating(ob_to_sales, 'order_book_to_sales')
            inflow_rating = self._get_rating(order_inflow_growth, 'order_inflow_growth')

            # Historical trend
            trend_data = []
            for record in self.data[:5]:  # Last 5 years
                year = record.get('period_end', '')[:4]
                ob = self._safe_float(record.get('order_book', 0))
                rev = self._safe_float(record.get('revenue', 0))
                ratio = (ob / rev) if rev > 0 else 0
                trend_data.append({
                    'year': year,
                    'order_book': ob,
                    'revenue': rev,
                    'ratio': ratio
                })

            return {
                'order_book': order_book,
                'order_book_to_sales': round(ob_to_sales, 2),
                'order_book_rating': ob_rating,
                'order_inflow': order_inflow,
                'order_inflow_growth': round(order_inflow_growth, 1),
                'inflow_rating': inflow_rating,
                'visibility_months': round(ob_to_sales * 12, 0),  # Revenue visibility in months
                'trend': trend_data,
                'interpretation': self._interpret_order_book(ob_to_sales, order_inflow_growth)
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_execution(self) -> Dict[str, Any]:
        """
        Analyze execution capability
        Key metrics: Revenue growth, order book conversion
        """
        try:
            # Revenue growth trend
            revenue_cagr = self._calculate_cagr('revenue', 3)

            # Order book conversion (how much of order book converts to revenue)
            latest = self.latest
            revenue = self._safe_float(latest.get('revenue', 0))
            prev_ob = 0
            if len(self.data) > 1:
                prev_ob = self._safe_float(self.data[1].get('order_book', 0))

            conversion_rate = 0
            if prev_ob > 0:
                conversion_rate = (revenue / prev_ob) * 100

            # Asset turnover (execution efficiency)
            total_assets = self._safe_float(latest.get('raw_assets', 0)) or self._safe_float(latest.get('total_assets', 0))
            asset_turnover = 0
            if total_assets > 0 and revenue > 0:
                asset_turnover = revenue / total_assets

            return {
                'revenue_cagr_3y': round(revenue_cagr, 1),
                'order_book_conversion': round(conversion_rate, 1),
                'asset_turnover': round(asset_turnover, 2),
                'asset_turnover_rating': self._get_rating(asset_turnover, 'asset_turnover'),
                'execution_score': self._calculate_execution_score(revenue_cagr, conversion_rate, asset_turnover),
                'interpretation': self._interpret_execution(revenue_cagr, asset_turnover)
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_profitability(self) -> Dict[str, Any]:
        """
        Analyze profitability metrics
        EBITDA margin, operating margin, net margin trends
        """
        try:
            latest = self.latest

            # Margins (use correct field names from database)
            ebitda_margin = self._safe_float(latest.get('ebitda_margin', 0))
            operating_margin = self._safe_float(latest.get('operating_profit_margin', 0))
            net_margin = self._safe_float(latest.get('net_profit_margin', 0))

            # Return on Capital Employed
            # Use operating profit as proxy for EBIT
            ebit = self._safe_float(latest.get('raw_operating_profit', 0))
            total_assets = self._safe_float(latest.get('raw_assets', 0)) or self._safe_float(latest.get('total_assets', 0))
            current_liabilities = self._safe_float(latest.get('raw_current_liabilities', 0)) or self._safe_float(latest.get('current_liabilities', 0))
            capital_employed = total_assets - current_liabilities

            roc = 0
            if capital_employed > 0 and ebit > 0:
                roc = (ebit / capital_employed) * 100

            # Trend analysis
            margin_trend = self._calculate_trend('ebitda_margin', 3)
            roc_trend = []

            for record in self.data[:5]:
                year = record.get('period_end', '')[:4]
                ebit_val = self._safe_float(record.get('ebit', 0))
                assets = self._safe_float(record.get('total_assets', 0))
                curr_liab = self._safe_float(record.get('current_liabilities', 0))
                ce = assets - curr_liab
                roc_val = (ebit_val / ce * 100) if ce > 0 else 0

                roc_trend.append({
                    'year': year,
                    'roc': round(roc_val, 2)
                })

            return {
                'ebitda_margin': round(ebitda_margin, 2),
                'ebitda_rating': self._get_rating(ebitda_margin, 'ebitda_margin'),
                'operating_margin': round(operating_margin, 2),
                'net_margin': round(net_margin, 2),
                'return_on_capital': round(roc, 2),
                'roc_rating': self._get_rating(roc, 'roc'),
                'margin_trend': margin_trend,
                'roc_trend': roc_trend,
                'interpretation': self._interpret_profitability(ebitda_margin, roc)
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_working_capital(self) -> Dict[str, Any]:
        """
        Analyze working capital efficiency
        Critical for capital goods - high WC can strain cash flows
        """
        try:
            latest = self.latest

            # Working capital components
            receivables = self._safe_float(latest.get('receivables', 0))
            inventory = self._safe_float(latest.get('inventory', 0))
            payables = self._safe_float(latest.get('payables', 0))
            revenue = self._safe_float(latest.get('revenue', 0))

            # Days calculation
            receivables_days = (receivables / revenue * 365) if revenue > 0 else 0
            inventory_days = (inventory / revenue * 365) if revenue > 0 else 0
            payables_days = (payables / revenue * 365) if revenue > 0 else 0

            # Cash conversion cycle
            ccc = receivables_days + inventory_days - payables_days

            # Working capital to sales
            current_assets = self._safe_float(latest.get('current_assets', 0))
            current_liabilities = self._safe_float(latest.get('current_liabilities', 0))
            working_capital = current_assets - current_liabilities
            wc_to_sales = (working_capital / revenue * 100) if revenue > 0 else 0

            return {
                'receivables_days': round(receivables_days, 0),
                'inventory_days': round(inventory_days, 0),
                'payables_days': round(payables_days, 0),
                'cash_conversion_cycle': round(ccc, 0),
                'ccc_rating': self._get_rating(ccc, 'working_capital_days', reverse=True),
                'wc_to_sales_pct': round(wc_to_sales, 1),
                'working_capital': working_capital,
                'interpretation': self._interpret_wc(ccc, wc_to_sales)
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_capital_efficiency(self) -> Dict[str, Any]:
        """
        Analyze how efficiently capital is deployed
        """
        try:
            latest = self.latest

            revenue = self._safe_float(latest.get('revenue', 0))
            total_assets = self._safe_float(latest.get('total_assets', 0))
            fixed_assets = self._safe_float(latest.get('fixed_assets', 0))

            # Asset turnover
            asset_turnover = (revenue / total_assets) if total_assets > 0 else 0
            fixed_asset_turnover = (revenue / fixed_assets) if fixed_assets > 0 else 0

            # Capital intensity (fixed assets / revenue)
            capital_intensity = (fixed_assets / revenue * 100) if revenue > 0 else 0

            return {
                'asset_turnover': round(asset_turnover, 2),
                'fixed_asset_turnover': round(fixed_asset_turnover, 2),
                'capital_intensity_pct': round(capital_intensity, 1),
                'rating': self._get_rating(asset_turnover, 'asset_turnover'),
                'interpretation': f"Company generates ₹{asset_turnover:.2f} revenue per ₹1 of assets. " +
                                 f"Capital intensity at {capital_intensity:.1f}% indicates {'heavy' if capital_intensity > 40 else 'moderate' if capital_intensity > 25 else 'light'} asset base."
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_financial_health(self) -> Dict[str, Any]:
        """
        Analyze balance sheet strength
        Critical given cyclical nature and large project requirements
        """
        try:
            latest = self.latest

            # Leverage ratios
            debt = self._safe_float(latest.get('total_debt', 0))
            equity = self._safe_float(latest.get('equity', 0))
            debt_equity = (debt / equity) if equity > 0 else 0

            # Interest coverage
            ebit = self._safe_float(latest.get('ebit', 0))
            interest = self._safe_float(latest.get('interest_expense', 0))
            interest_coverage = (ebit / interest) if interest > 0 else 999

            # Current ratio
            current_assets = self._safe_float(latest.get('current_assets', 0))
            current_liabilities = self._safe_float(latest.get('current_liabilities', 0))
            current_ratio = (current_assets / current_liabilities) if current_liabilities > 0 else 0

            return {
                'debt_equity': round(debt_equity, 2),
                'de_rating': self._get_rating(debt_equity, 'debt_equity', reverse=True),
                'interest_coverage': round(interest_coverage, 2),
                'ic_rating': self._get_rating(interest_coverage, 'interest_coverage'),
                'current_ratio': round(current_ratio, 2),
                'total_debt': debt,
                'health_score': self._calculate_health_score(debt_equity, interest_coverage, current_ratio),
                'interpretation': self._interpret_financial_health(debt_equity, interest_coverage)
            }
        except Exception as e:
            return {'error': str(e)}

    def _analyze_diversification(self) -> Dict[str, Any]:
        """
        Analyze revenue diversification (if data available)
        Government vs private, domestic vs export, segment wise
        """
        try:
            latest = self.latest

            # Export revenue (if available)
            export_revenue = self._safe_float(latest.get('export_revenue', 0))
            total_revenue = self._safe_float(latest.get('revenue', 0))
            export_pct = (export_revenue / total_revenue * 100) if total_revenue > 0 else 0

            # Government dependency (qualitative assessment)
            # For PSUs like BHEL, typically high government exposure

            return {
                'export_revenue_pct': round(export_pct, 1),
                'export_rating': self._get_rating(export_pct, 'export_revenue'),
                'diversification_score': self._calculate_diversification_score(export_pct),
                'interpretation': f"Export revenue at {export_pct:.1f}%. " +
                                 f"{'Good' if export_pct > 20 else 'Moderate' if export_pct > 10 else 'Limited'} international presence."
            }
        except Exception as e:
            return {'error': str(e)}

    def _calculate_overall_score(self) -> Dict[str, Any]:
        """Calculate overall sector health score"""
        try:
            metrics = self.get_key_metrics()

            # Weighted scoring
            weights = {
                'order_book': 0.25,      # Most critical for capital goods
                'execution': 0.20,
                'profitability': 0.20,
                'working_capital': 0.15,
                'financial_health': 0.15,
                'diversification': 0.05
            }

            scores = {}

            # Order book score
            ob_data = metrics.get('order_book', {})
            ob_to_sales = ob_data.get('order_book_to_sales', 0)
            ob_score = self._normalize_score(ob_to_sales, 'order_book_to_sales')
            scores['order_book'] = ob_score

            # Execution score
            exec_data = metrics.get('execution', {})
            scores['execution'] = exec_data.get('execution_score', 0)

            # Profitability score
            prof_data = metrics.get('profitability', {})
            ebitda = prof_data.get('ebitda_margin', 0)
            roc = prof_data.get('return_on_capital', 0)
            scores['profitability'] = (self._normalize_score(ebitda, 'ebitda_margin') +
                                       self._normalize_score(roc, 'roc')) / 2

            # Working capital score
            wc_data = metrics.get('working_capital', {})
            ccc = wc_data.get('cash_conversion_cycle', 0)
            scores['working_capital'] = self._normalize_score(ccc, 'working_capital_days', reverse=True)

            # Financial health score
            fh_data = metrics.get('financial_health', {})
            scores['financial_health'] = fh_data.get('health_score', 0)

            # Diversification score
            div_data = metrics.get('diversification', {})
            scores['diversification'] = div_data.get('diversification_score', 0)

            # Calculate weighted average
            total_score = sum(scores[k] * weights[k] for k in weights.keys())

            # Rating
            if total_score >= 80:
                rating = "Excellent"
                emoji = "🌟"
            elif total_score >= 65:
                rating = "Good"
                emoji = "👍"
            elif total_score >= 50:
                rating = "Acceptable"
                emoji = "👌"
            else:
                rating = "Needs Improvement"
                emoji = "⚠️"

            return {
                'overall_score': round(total_score, 1),
                'rating': rating,
                'emoji': emoji,
                'component_scores': scores,
                'interpretation': self._interpret_overall(total_score, scores)
            }

        except Exception as e:
            return {'error': str(e), 'overall_score': 0, 'rating': 'Error', 'emoji': '❌'}

    # Helper methods for interpretation

    def _interpret_order_book(self, ob_to_sales: float, growth: float) -> str:
        """Interpret order book metrics"""
        visibility = "strong" if ob_to_sales > 2.0 else "moderate" if ob_to_sales > 1.5 else "weak"
        growth_status = "growing" if growth > 10 else "stable" if growth > 0 else "declining"

        return f"Order book provides {visibility} revenue visibility ({ob_to_sales:.1f}x sales). " + \
               f"Order inflow is {growth_status} at {growth:.1f}% YoY."

    def _interpret_execution(self, revenue_cagr: float, asset_turnover: float) -> str:
        """Interpret execution capability"""
        growth = "strong" if revenue_cagr > 12 else "moderate" if revenue_cagr > 6 else "weak"
        efficiency = "efficient" if asset_turnover > 1.2 else "moderate" if asset_turnover > 0.9 else "inefficient"

        return f"Revenue growth is {growth} at {revenue_cagr:.1f}% CAGR. " + \
               f"Asset utilization is {efficiency} at {asset_turnover:.2f}x turnover."

    def _interpret_profitability(self, ebitda: float, roc: float) -> str:
        """Interpret profitability"""
        margin_level = "healthy" if ebitda > 10 else "moderate" if ebitda > 6 else "weak"
        roc_level = "strong" if roc > 12 else "acceptable" if roc > 9 else "weak"

        return f"EBITDA margins are {margin_level} at {ebitda:.1f}%. " + \
               f"Return on capital is {roc_level} at {roc:.1f}%."

    def _interpret_wc(self, ccc: float, wc_to_sales: float) -> str:
        """Interpret working capital"""
        ccc_status = "efficient" if ccc < 90 else "moderate" if ccc < 120 else "stretched"

        return f"Cash conversion cycle is {ccc_status} at {ccc:.0f} days. " + \
               f"Working capital requirement is {wc_to_sales:.1f}% of sales."

    def _interpret_financial_health(self, de: float, ic: float) -> str:
        """Interpret financial health"""
        leverage = "low" if de < 0.5 else "moderate" if de < 1.0 else "high"
        coverage = "comfortable" if ic > 5 else "adequate" if ic > 3 else "tight"

        return f"Leverage is {leverage} with D/E of {de:.2f}. " + \
               f"Interest coverage is {coverage} at {ic:.2f}x."

    def _interpret_overall(self, score: float, components: Dict) -> str:
        """Overall interpretation"""
        strengths = []
        concerns = []

        if components['order_book'] >= 70:
            strengths.append("strong order book")
        elif components['order_book'] < 50:
            concerns.append("weak order book visibility")

        if components['profitability'] >= 70:
            strengths.append("healthy profitability")
        elif components['profitability'] < 50:
            concerns.append("margin pressure")

        if components['financial_health'] >= 70:
            strengths.append("solid balance sheet")
        elif components['financial_health'] < 50:
            concerns.append("stretched financials")

        result = "Company shows "
        if strengths:
            result += ", ".join(strengths)
        if concerns:
            result += (" but faces " if strengths else "") + ", ".join(concerns)

        return result + "."

    def _calculate_execution_score(self, revenue_cagr: float, conversion: float, turnover: float) -> float:
        """Calculate execution capability score"""
        revenue_score = min(revenue_cagr / 15 * 100, 100)  # 15% CAGR = 100
        turnover_score = self._normalize_score(turnover, 'asset_turnover')

        return round((revenue_score * 0.6 + turnover_score * 0.4), 1)

    def _calculate_health_score(self, de: float, ic: float, cr: float) -> float:
        """Calculate financial health score"""
        de_score = self._normalize_score(de, 'debt_equity', reverse=True)
        ic_score = self._normalize_score(ic, 'interest_coverage')
        cr_score = min(cr / 2.0 * 100, 100)  # 2.0 = 100

        return round((de_score * 0.4 + ic_score * 0.4 + cr_score * 0.2), 1)

    def _calculate_diversification_score(self, export_pct: float) -> float:
        """Calculate diversification score"""
        return self._normalize_score(export_pct, 'export_revenue')

    # Abstract method implementations

    def get_peer_comparison(self) -> Dict[str, Any]:
        """
        Compare with peer companies in capital goods sector
        Returns basic peer comparison structure
        """
        return {
            'peers': self.peers,
            'comparison_available': len(self.peers) > 0,
            'note': 'Peer comparison for capital goods sector'
        }

    def get_industry_context(self) -> Dict[str, Any]:
        """
        Get industry trends and context for capital goods sector
        """
        return {
            'key_trends': [
                'Government capex focus on infrastructure development',
                'Push for domestic manufacturing (Make in India)',
                'Energy transition - renewable energy equipment demand',
                'Railway modernization and electrification projects',
                'Defense equipment manufacturing opportunities',
            ],
            'outlook': 'Positive - Driven by government infrastructure spending and energy transition initiatives',
            'challenges': [
                'Long gestation periods for order execution',
                'Working capital intensive business model',
                'Competition from global players',
                'Margin pressure due to commodity price volatility',
            ]
        }

    def get_growth_catalysts(self) -> List[str]:
        """
        Identify sector-specific growth catalysts
        """
        try:
            catalysts = []

            # Check order book metrics
            metrics = self.get_key_metrics()
            order_book = metrics.get('order_book', {})
            ob_to_sales = order_book.get('order_book_to_sales', 0)

            if ob_to_sales > 2.5:
                catalysts.append(f"Strong order book ({ob_to_sales:.1f}x sales) provides multi-year revenue visibility")
            elif ob_to_sales > 1.5:
                catalysts.append(f"Healthy order book ({ob_to_sales:.1f}x sales) ensures near-term growth")

            # Check growth metrics
            inflow_growth = order_book.get('order_inflow_growth', 0)
            if inflow_growth > 15:
                catalysts.append(f"Accelerating order inflow growth ({inflow_growth:.1f}% YoY)")

            # Check profitability improvements
            profitability = metrics.get('profitability', {})
            margin_trend = profitability.get('margin_trend', {})
            if margin_trend.get('trend') == 'improving':
                catalysts.append("Operating leverage driving margin expansion")

            # Execution capability
            execution = metrics.get('execution', {})
            if execution.get('execution_score', 0) > 70:
                catalysts.append("Strong execution track record in order book conversion")

            # Generic catalysts if none specific found
            if not catalysts:
                catalysts = [
                    "Government infrastructure spending creating opportunities",
                    "Energy transition driving equipment demand",
                    "Domestic manufacturing focus benefiting local players",
                ]

            return catalysts[:5]  # Top 5
        except Exception as e:
            return [
                "Government capex on infrastructure",
                "Energy sector modernization",
                "Railway and defense projects",
            ]

    def get_risk_factors(self) -> List[Dict[str, str]]:
        """
        Identify sector-specific risks
        """
        risks = []

        try:
            metrics = self.get_key_metrics()

            # Check working capital risk
            wc = metrics.get('working_capital', {})
            ccc = wc.get('cash_conversion_cycle', 0)
            if ccc > 120:
                risks.append({
                    'factor': 'High Working Capital',
                    'description': f'Cash conversion cycle at {ccc:.0f} days indicates high working capital requirements',
                    'severity': 'HIGH' if ccc > 150 else 'MEDIUM'
                })

            # Check execution risk
            order_book = metrics.get('order_book', {})
            if order_book.get('order_book_to_sales', 0) < 1.5:
                risks.append({
                    'factor': 'Limited Revenue Visibility',
                    'description': 'Low order book may impact revenue predictability',
                    'severity': 'MEDIUM'
                })

            # Check margin pressure
            profitability = metrics.get('profitability', {})
            ebitda = profitability.get('ebitda_margin', 0)
            if ebitda < 6:
                risks.append({
                    'factor': 'Margin Pressure',
                    'description': f'EBITDA margin at {ebitda:.1f}% indicates pricing or cost challenges',
                    'severity': 'MEDIUM'
                })

            # Check financial health
            fh = metrics.get('financial_health', {})
            de = fh.get('debt_equity', 0)
            if de > 1.2:
                risks.append({
                    'factor': 'High Leverage',
                    'description': f'Debt/Equity at {de:.2f} limits financial flexibility',
                    'severity': 'MEDIUM'
                })

            # Generic sector risks
            if not risks:
                risks.append({
                    'factor': 'Long Execution Cycles',
                    'description': 'Capital goods projects have long gestation periods',
                    'severity': 'LOW'
                })

            risks.append({
                'factor': 'Commodity Price Volatility',
                'description': 'Input cost fluctuations can impact margins',
                'severity': 'MEDIUM'
            })

            return risks
        except Exception as e:
            return [{
                'factor': 'Sector Cyclicality',
                'description': 'Capital goods sector tied to economic cycles',
                'severity': 'MEDIUM'
            }]


# Export for convenience
__all__ = ['CapitalGoodsSectorAnalyzer']
