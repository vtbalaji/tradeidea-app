"""
Historical Trend Tables Module

Generate table-based visualizations for historical trends.
Faster to implement than charts and works better in PDF reports.
"""

from typing import Dict, List, Any, Optional


class TrendTableGenerator:
    """Generate historical trend tables for financial metrics"""

    def __init__(self, data: List[Dict], years: int = 5):
        """
        Initialize trend table generator

        Args:
            data: Historical financial data (sorted latest first)
            years: Number of years to include
        """
        self.data = data[:years] if len(data) > years else data
        self.years = years

    def generate_financial_trends_table(self) -> Dict[str, Any]:
        """
        Generate comprehensive financial trends table

        Returns year-over-year progression of key metrics
        """
        if not self.data:
            return {'error': 'No data available'}

        # Extract years/periods
        periods = []
        for item in reversed(self.data):  # Oldest to newest for left-to-right reading
            fy = item.get('fy', item.get('period', 'N/A'))
            periods.append(fy)

        # Build metric rows
        metrics = {
            'Revenue (₹ Cr)': self._build_metric_row('raw_revenue', 10000000, 0),  # Lakhs to Crores
            'Net Profit (₹ Cr)': self._build_metric_row('raw_profit', 10000000, 0),
            'Operating Margin (%)': self._build_metric_row('operating_margin', 1, 1),
            'Net Margin (%)': self._build_metric_row('net_margin', 1, 1),
            'ROE (%)': self._build_metric_row('roe', 1, 1),
            'ROA (%)': self._build_metric_row('roa', 1, 1),
            'EPS (₹)': self._build_metric_row('eps', 1, 2),
            'Debt/Equity': self._build_metric_row('debt_equity', 1, 2),
        }

        # Calculate CAGR for key metrics
        cagrs = {
            'Revenue CAGR': self._calculate_cagr('raw_revenue', 10000000),
            'Profit CAGR': self._calculate_cagr('raw_profit', 10000000),
            'EPS CAGR': self._calculate_cagr('eps', 1),
        }

        return {
            'periods': periods,
            'metrics': metrics,
            'cagrs': cagrs,
            'years_covered': len(periods)
        }

    def generate_banking_trends_table(self) -> Dict[str, Any]:
        """
        Generate banking-specific trends table

        Returns historical progression of banking metrics
        """
        if not self.data:
            return {'error': 'No data available'}

        periods = []
        for item in reversed(self.data):
            fy = item.get('fy', 'N/A')
            periods.append(fy)

        metrics = {
            'Advances (₹ Cr)': self._build_metric_row('advances', 10000000, 0),
            'Deposits (₹ Cr)': self._build_metric_row('deposits', 10000000, 0),
            'CASA Ratio (%)': self._build_metric_row('casa_ratio', 1, 1),
            'Gross NPA (%)': self._build_metric_row('gross_npa_ratio', 1, 2),
            'Net NPA (%)': self._build_metric_row('net_npa_ratio', 1, 2),
            'PCR (%)': self._build_metric_row('provision_coverage_ratio', 1, 1),
            'NIM (%)': self._build_metric_row('net_interest_margin', 1, 2),
            'CAR (%)': self._build_metric_row('capital_adequacy_ratio', 1, 1),
            'Cost/Income (%)': self._build_metric_row('cost_to_income_ratio', 1, 1),
        }

        # Asset quality trend
        gnpa_trend = self._assess_trend('gross_npa_ratio', reverse=True)  # Lower is better
        nnpa_trend = self._assess_trend('net_npa_ratio', reverse=True)

        return {
            'periods': periods,
            'metrics': metrics,
            'asset_quality_trend': gnpa_trend,
            'years_covered': len(periods)
        }

    def generate_quarterly_trends_table(self, quarters: int = 8) -> Dict[str, Any]:
        """
        Generate quarterly trends table

        Args:
            quarters: Number of quarters to include

        Returns quarterly progression
        """
        # Filter for quarterly data
        quarterly_data = [d for d in self.data if 'Q' in str(d.get('period', ''))][:quarters]

        if not quarterly_data:
            return {'error': 'No quarterly data available'}

        periods = []
        for item in reversed(quarterly_data):
            period = item.get('period', 'N/A')
            periods.append(period)

        metrics = {
            'Revenue (₹ Cr)': self._build_metric_row_from_data(quarterly_data, 'raw_revenue', 10000000, 0),
            'Net Profit (₹ Cr)': self._build_metric_row_from_data(quarterly_data, 'raw_profit', 10000000, 0),
            'Operating Margin (%)': self._build_metric_row_from_data(quarterly_data, 'operating_margin', 1, 1),
            'Net Margin (%)': self._build_metric_row_from_data(quarterly_data, 'net_margin', 1, 1),
            'EPS (₹)': self._build_metric_row_from_data(quarterly_data, 'eps', 1, 2),
        }

        # QoQ and YoY growth
        latest_q = quarterly_data[0]
        prev_q = quarterly_data[1] if len(quarterly_data) > 1 else None
        yoy_q = quarterly_data[4] if len(quarterly_data) > 4 else None

        growth = {}
        if prev_q:
            growth['revenue_qoq'] = self._calc_growth(
                latest_q.get('raw_revenue'), prev_q.get('raw_revenue')
            )
            growth['profit_qoq'] = self._calc_growth(
                latest_q.get('raw_profit'), prev_q.get('raw_profit')
            )

        if yoy_q:
            growth['revenue_yoy'] = self._calc_growth(
                latest_q.get('raw_revenue'), yoy_q.get('raw_revenue')
            )
            growth['profit_yoy'] = self._calc_growth(
                latest_q.get('raw_profit'), yoy_q.get('raw_profit')
            )

        return {
            'periods': periods,
            'metrics': metrics,
            'growth': growth,
            'quarters_covered': len(periods)
        }

    def generate_valuation_trends_table(self) -> Dict[str, Any]:
        """
        Generate valuation multiples trend table

        Returns historical valuation metrics
        """
        if not self.data:
            return {'error': 'No data available'}

        periods = []
        for item in reversed(self.data):
            fy = item.get('fy', 'N/A')
            periods.append(fy)

        metrics = {
            'P/E Ratio': self._build_metric_row('pe', 1, 1),
            'P/B Ratio': self._build_metric_row('pb', 1, 2),
            'P/S Ratio': self._build_metric_row('ps', 1, 2),
            'EV/EBITDA': self._build_metric_row('ev_ebitda', 1, 1),
            'Dividend Yield (%)': self._build_metric_row('dividend_yield', 1, 2),
        }

        # Calculate average valuations
        averages = {}
        for metric_name, values in metrics.items():
            valid_values = [v for v in values if v is not None and v > 0]
            if valid_values:
                averages[metric_name] = {
                    'avg': sum(valid_values) / len(valid_values),
                    'min': min(valid_values),
                    'max': max(valid_values)
                }

        return {
            'periods': periods,
            'metrics': metrics,
            'averages': averages,
            'years_covered': len(periods)
        }

    def _build_metric_row(self, field: str, divisor: float = 1, decimals: int = 2) -> List[Optional[float]]:
        """Build a row of values for a metric across years"""
        values = []
        for item in reversed(self.data):  # Oldest to newest
            val = item.get(field)
            if val and val > 0:
                values.append(round(val / divisor, decimals))
            else:
                values.append(None)
        return values

    def _build_metric_row_from_data(self, data_list: List[Dict], field: str,
                                     divisor: float = 1, decimals: int = 2) -> List[Optional[float]]:
        """Build metric row from specific data list (e.g., quarterly)"""
        values = []
        for item in reversed(data_list):
            val = item.get(field)
            if val and val > 0:
                values.append(round(val / divisor, decimals))
            else:
                values.append(None)
        return values

    def _calculate_cagr(self, field: str, divisor: float = 1) -> Optional[float]:
        """Calculate CAGR for a metric"""
        values = []
        for item in self.data:
            val = item.get(field)
            if val and val > 0:
                values.append(val / divisor)

        if len(values) < 2:
            return None

        # Latest to oldest
        latest = values[0]
        oldest = values[-1]
        years = len(values) - 1

        if oldest == 0:
            return None

        cagr = ((latest / oldest) ** (1 / years) - 1) * 100
        return round(cagr, 1)

    def _assess_trend(self, field: str, reverse: bool = False) -> Dict[str, Any]:
        """
        Assess trend direction for a metric

        Args:
            field: Field name
            reverse: If True, lower is better (e.g., NPA)
        """
        values = []
        for item in self.data:
            val = item.get(field)
            if val and val > 0:
                values.append(float(val))

        if len(values) < 2:
            return {'trend': 'Unknown', 'direction': '⚪', 'change': 0}

        # Latest vs oldest
        latest = values[0]
        oldest = values[-1]
        change = ((latest - oldest) / oldest) * 100

        # Determine trend
        if reverse:
            # For metrics where lower is better (NPA, cost ratios)
            if change < -10:
                trend = 'Improving'
                direction = '🟢🟢'
            elif change < -5:
                trend = 'Improving'
                direction = '🟢'
            elif change < 5:
                trend = 'Stable'
                direction = '🟡'
            elif change < 10:
                trend = 'Deteriorating'
                direction = '🔴'
            else:
                trend = 'Deteriorating'
                direction = '🔴🔴'
        else:
            # For metrics where higher is better (revenue, margins)
            if change > 10:
                trend = 'Strong Growth'
                direction = '🟢🟢'
            elif change > 5:
                trend = 'Growth'
                direction = '🟢'
            elif change > -5:
                trend = 'Stable'
                direction = '🟡'
            elif change > -10:
                trend = 'Declining'
                direction = '🔴'
            else:
                trend = 'Sharp Decline'
                direction = '🔴🔴'

        return {
            'trend': trend,
            'direction': direction,
            'change': round(change, 1),
            'latest': latest,
            'oldest': oldest
        }

    def _calc_growth(self, current: Optional[float], previous: Optional[float]) -> Optional[float]:
        """Calculate percentage growth"""
        if not current or not previous or previous == 0:
            return None
        return round(((current - previous) / previous) * 100, 1)

    def format_for_html(self, table_data: Dict[str, Any]) -> str:
        """
        Format table data as HTML

        Args:
            table_data: Output from any generate_*_table method

        Returns HTML string
        """
        if 'error' in table_data:
            return f"<p>{table_data['error']}</p>"

        periods = table_data['periods']
        metrics = table_data['metrics']

        html = '<table>\n<thead>\n<tr>\n<th>Metric</th>\n'

        # Header row with periods
        for period in periods:
            html += f'<th>{period}</th>\n'

        # Add CAGR column if available
        if 'cagrs' in table_data:
            html += '<th>CAGR</th>\n'

        html += '</tr>\n</thead>\n<tbody>\n'

        # Data rows
        for metric_name, values in metrics.items():
            html += f'<tr>\n<td><strong>{metric_name}</strong></td>\n'

            for value in values:
                if value is None:
                    html += '<td>-</td>\n'
                else:
                    html += f'<td>{value:,.2f}</td>\n'

            # Add CAGR if available
            if 'cagrs' in table_data:
                cagr_key = metric_name.split('(')[0].strip() + ' CAGR'
                cagr = table_data['cagrs'].get(cagr_key)
                if cagr:
                    color = '#28a745' if cagr > 10 else '#6c757d' if cagr > 0 else '#dc3545'
                    html += f'<td style="color: {color}; font-weight: bold;">{cagr:+.1f}%</td>\n'
                else:
                    html += '<td>-</td>\n'

            html += '</tr>\n'

        html += '</tbody>\n</table>'

        return html
