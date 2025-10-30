"""
Peer Comparison Module

Comprehensive peer comparison functionality for relative valuation and competitive analysis.
"""

from typing import Dict, List, Any, Optional
import duckdb


class PeerComparator:
    """Compare company with sector peers"""

    def __init__(self, symbol: str, peers: List[str], fundamentals_conn, eod_conn):
        """
        Initialize peer comparator

        Args:
            symbol: Primary company symbol
            peers: List of peer symbols
            fundamentals_conn: DuckDB connection to fundamentals.duckdb
            eod_conn: DuckDB connection to eod.duckdb
        """
        self.symbol = symbol
        self.peers = peers
        self.fund_conn = fundamentals_conn
        self.eod_conn = eod_conn

    def get_comparative_metrics(self, metrics: List[str]) -> Dict[str, Any]:
        """
        Get comparative metrics for symbol and peers

        Args:
            metrics: List of metric names to compare

        Returns:
            Dict with comparison data
        """
        if not self.peers:
            return {'error': 'No peers specified'}

        companies = [self.symbol] + self.peers
        comparison_data = {}

        for company in companies:
            company_data = self._load_latest_data(company)
            if company_data:
                comparison_data[company] = {}
                for metric in metrics:
                    comparison_data[company][metric] = company_data.get(metric)

        return {
            'companies': companies,
            'metrics': metrics,
            'data': comparison_data,
            'summary': self._generate_summary(comparison_data, metrics)
        }

    def compare_valuations(self) -> Dict[str, Any]:
        """
        Compare valuation multiples with peers

        Returns valuation comparison
        """
        valuation_metrics = ['pe', 'pb', 'ps', 'ev_ebitda', 'market_cap']
        comparison = self.get_comparative_metrics(valuation_metrics)

        if 'error' in comparison:
            return comparison

        # Calculate premium/discount vs peer average
        analysis = {}
        data = comparison['data']

        for metric in valuation_metrics:
            if metric == 'market_cap':
                continue  # Skip for average calculation

            peer_values = []
            for peer in self.peers:
                val = data.get(peer, {}).get(metric)
                if val and val > 0:
                    peer_values.append(float(val))

            if peer_values:
                peer_avg = sum(peer_values) / len(peer_values)
                symbol_val = data.get(self.symbol, {}).get(metric)

                if symbol_val and symbol_val > 0:
                    premium = ((float(symbol_val) - peer_avg) / peer_avg) * 100
                    analysis[metric] = {
                        'value': symbol_val,
                        'peer_average': peer_avg,
                        'premium_discount': premium,
                        'assessment': 'Premium' if premium > 0 else 'Discount'
                    }

        comparison['valuation_analysis'] = analysis
        return comparison

    def compare_profitability(self) -> Dict[str, Any]:
        """Compare profitability metrics with peers"""
        profitability_metrics = ['roe', 'roa', 'operating_margin', 'net_margin', 'ebitda_margin']
        comparison = self.get_comparative_metrics(profitability_metrics)

        if 'error' in comparison:
            return comparison

        # Rank companies by each metric
        rankings = {}
        data = comparison['data']

        for metric in profitability_metrics:
            metric_values = []
            for company in comparison['companies']:
                val = data.get(company, {}).get(metric)
                if val and val > 0:
                    metric_values.append((company, float(val)))

            # Sort descending (higher is better)
            metric_values.sort(key=lambda x: x[1], reverse=True)
            rankings[metric] = metric_values

            # Find rank of primary symbol
            for i, (company, val) in enumerate(metric_values):
                if company == self.symbol:
                    comparison[f'{metric}_rank'] = i + 1
                    comparison[f'{metric}_total'] = len(metric_values)
                    break

        comparison['rankings'] = rankings
        return comparison

    def compare_growth(self) -> Dict[str, Any]:
        """Compare growth metrics with peers"""
        growth_metrics = ['revenue_cagr', 'profit_cagr', 'eps_cagr']

        comparison = {'companies': [self.symbol] + self.peers, 'growth_data': {}}

        for company in comparison['companies']:
            data = self._load_multi_year_data(company, years=3)
            if data and len(data) >= 2:
                growth_data = self._calculate_growth_metrics(data)
                comparison['growth_data'][company] = growth_data

        # Rank by revenue growth
        if comparison['growth_data']:
            growth_ranking = []
            for company, metrics in comparison['growth_data'].items():
                revenue_cagr = metrics.get('revenue_cagr', 0)
                if revenue_cagr:
                    growth_ranking.append((company, revenue_cagr))

            growth_ranking.sort(key=lambda x: x[1], reverse=True)
            comparison['revenue_growth_ranking'] = growth_ranking

        return comparison

    def compare_financial_health(self) -> Dict[str, Any]:
        """Compare financial health metrics with peers"""
        health_metrics = ['debt_to_equity', 'current_ratio', 'interest_coverage', 'debt_equity']
        comparison = self.get_comparative_metrics(health_metrics)

        if 'error' in comparison:
            return comparison

        # Assess relative health
        data = comparison['data']
        health_scores = {}

        for company in comparison['companies']:
            score = 0
            max_score = 0

            # Debt to equity (lower is better)
            de = data.get(company, {}).get('debt_to_equity') or data.get(company, {}).get('debt_equity')
            if de is not None and de >= 0:
                if de < 0.5:
                    score += 30
                elif de < 1.0:
                    score += 20
                elif de < 1.5:
                    score += 10
                max_score += 30

            # Current ratio (higher is better, but not too high)
            cr = data.get(company, {}).get('current_ratio')
            if cr and cr > 0:
                if 1.5 <= cr <= 3.0:
                    score += 30
                elif 1.0 <= cr < 1.5 or 3.0 < cr <= 4.0:
                    score += 20
                elif cr > 0.5:
                    score += 10
                max_score += 30

            # Interest coverage (higher is better)
            ic = data.get(company, {}).get('interest_coverage')
            if ic and ic > 0:
                if ic >= 5:
                    score += 40
                elif ic >= 3:
                    score += 25
                elif ic >= 1.5:
                    score += 15
                max_score += 40

            if max_score > 0:
                health_scores[company] = {
                    'score': score,
                    'max_score': max_score,
                    'percentage': (score / max_score) * 100
                }

        comparison['health_scores'] = health_scores
        return comparison

    def generate_peer_comparison_table(self, metrics: List[str]) -> Dict[str, Any]:
        """
        Generate formatted peer comparison table

        Args:
            metrics: List of metrics to include

        Returns:
            Table data structure
        """
        comparison = self.get_comparative_metrics(metrics)

        if 'error' in comparison:
            return comparison

        # Format for table display
        table_data = {
            'headers': ['Metric'] + comparison['companies'],
            'rows': []
        }

        for metric in metrics:
            row = {'metric': metric, 'values': {}}

            for company in comparison['companies']:
                val = comparison['data'].get(company, {}).get(metric)
                row['values'][company] = val

            table_data['rows'].append(row)

        # Add averages row
        avg_row = {'metric': 'Peer Average', 'values': {}}
        for company in comparison['companies']:
            if company == self.symbol:
                avg_row['values'][company] = '-'
            else:
                avg_row['values'][company] = '-'  # Calculate average
        table_data['rows'].append(avg_row)

        return table_data

    def compare_market_position(self) -> Dict[str, Any]:
        """Compare market position (market cap, revenue scale)"""
        scale_metrics = ['market_cap', 'raw_revenue', 'raw_net_profit']
        comparison = self.get_comparative_metrics(scale_metrics)

        if 'error' in comparison:
            return comparison

        # Rank by market cap
        market_caps = []
        data = comparison['data']

        for company in comparison['companies']:
            mcap = data.get(company, {}).get('market_cap')
            if mcap and mcap > 0:
                market_caps.append((company, float(mcap)))

        market_caps.sort(key=lambda x: x[1], reverse=True)
        comparison['market_cap_ranking'] = market_caps

        # Market share (if revenue available)
        revenues = []
        for company in comparison['companies']:
            rev = data.get(company, {}).get('raw_revenue')
            if rev and rev > 0:
                revenues.append((company, float(rev)))

        if revenues:
            total_revenue = sum(r[1] for r in revenues)
            market_shares = {}
            for company, rev in revenues:
                market_shares[company] = (rev / total_revenue) * 100

            comparison['market_share'] = market_shares

        return comparison

    def _load_latest_data(self, symbol: str) -> Optional[Dict]:
        """Load latest financial data for a symbol"""
        try:
            query = f"""
                SELECT *
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                ORDER BY end_date DESC
                LIMIT 1
            """
            result = self.fund_conn.execute(query).fetchdf()
            if not result.empty:
                return result.iloc[0].to_dict()
            return None
        except Exception as e:
            print(f'  ⚠️  Error loading data for {symbol}: {e}')
            return None

    def _load_multi_year_data(self, symbol: str, years: int = 3) -> Optional[List[Dict]]:
        """Load multi-year data for a symbol"""
        try:
            query = f"""
                SELECT *
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                AND quarter = 'Q4'
                ORDER BY end_date DESC
                LIMIT {years}
            """
            result = self.fund_conn.execute(query).fetchdf()
            if not result.empty:
                return [row.to_dict() for _, row in result.iterrows()]
            return None
        except Exception as e:
            print(f'  ⚠️  Error loading multi-year data for {symbol}: {e}')
            return None

    def _calculate_growth_metrics(self, data: List[Dict]) -> Dict[str, float]:
        """Calculate growth metrics from multi-year data"""
        if len(data) < 2:
            return {}

        # Sort oldest to newest
        data = sorted(data, key=lambda x: x.get('end_date', ''))

        latest = data[-1]
        oldest = data[0]
        years = len(data) - 1

        metrics = {}

        # Revenue CAGR
        rev_latest = latest.get('raw_revenue', 0)
        rev_oldest = oldest.get('raw_revenue', 0)
        if rev_latest and rev_oldest and rev_oldest > 0:
            revenue_cagr = ((rev_latest / rev_oldest) ** (1 / years) - 1) * 100
            metrics['revenue_cagr'] = round(revenue_cagr, 1)

        # Profit CAGR
        prof_latest = latest.get('raw_net_profit', 0)
        prof_oldest = oldest.get('raw_net_profit', 0)
        if prof_latest and prof_oldest and prof_oldest > 0:
            profit_cagr = ((prof_latest / prof_oldest) ** (1 / years) - 1) * 100
            metrics['profit_cagr'] = round(profit_cagr, 1)

        # EPS CAGR
        eps_latest = latest.get('eps', 0)
        eps_oldest = oldest.get('eps', 0)
        if eps_latest and eps_oldest and eps_oldest > 0:
            eps_cagr = ((eps_latest / eps_oldest) ** (1 / years) - 1) * 100
            metrics['eps_cagr'] = round(eps_cagr, 1)

        return metrics

    def _generate_summary(self, comparison_data: Dict, metrics: List[str]) -> Dict[str, Any]:
        """Generate summary statistics"""
        summary = {}

        for metric in metrics:
            values = []
            for company in comparison_data:
                val = comparison_data[company].get(metric)
                if val and val > 0:
                    values.append(float(val))

            if values:
                summary[metric] = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'median': sorted(values)[len(values) // 2]
                }

        return summary

    def format_comparison_for_html(self, comparison: Dict[str, Any]) -> str:
        """
        Format comparison data as HTML table

        Args:
            comparison: Comparison data from any compare_* method

        Returns:
            HTML string
        """
        if 'error' in comparison:
            return f"<p>{comparison['error']}</p>"

        html = '<table>\n<thead>\n<tr>\n<th>Company</th>\n'

        # Get metrics from first company's data
        if comparison.get('data'):
            first_company = comparison['companies'][0]
            metrics = list(comparison['data'].get(first_company, {}).keys())

            for metric in metrics:
                html += f'<th>{metric.replace("_", " ").title()}</th>\n'

            html += '</tr>\n</thead>\n<tbody>\n'

            # Data rows
            for company in comparison['companies']:
                html += f'<tr>\n<td><strong>{company}</strong></td>\n'

                for metric in metrics:
                    val = comparison['data'].get(company, {}).get(metric)
                    if val is None:
                        html += '<td>-</td>\n'
                    elif isinstance(val, float):
                        html += f'<td>{val:,.2f}</td>\n'
                    else:
                        html += f'<td>{val}</td>\n'

                html += '</tr>\n'

            html += '</tbody>\n</table>'

        return html
