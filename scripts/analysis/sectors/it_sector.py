"""
IT Sector Analyzer

Comprehensive analysis for IT & Software companies with sector-specific metrics:
- Revenue Metrics: Per employee, onsite/offshore mix
- Profitability: EBITDA margins, operating margins
- People Metrics: Headcount, attrition, utilization
- Client Metrics: Top client concentration, geography mix
- Growth: Deal wins, order book, digital revenue %
"""

from typing import Dict, List, Any, Optional
from .base_sector import BaseSectorAnalyzer


class ITSectorAnalyzer(BaseSectorAnalyzer):
    """IT sector specific analysis"""

    # Industry benchmarks for Indian IT sector
    BENCHMARKS = {
        'excellent': {
            'revenue_per_employee': 35,  # Lakhs per employee
            'ebitda_margin': 25,         # %
            'attrition': 12,             # % (lower is better)
            'utilization': 85,           # %
            'top_client_concentration': 10,  # % (lower is better)
            'digital_revenue': 60        # % of total revenue
        },
        'good': {
            'revenue_per_employee': 28,
            'ebitda_margin': 20,
            'attrition': 15,
            'utilization': 80,
            'top_client_concentration': 15,
            'digital_revenue': 50
        },
        'acceptable': {
            'revenue_per_employee': 22,
            'ebitda_margin': 15,
            'attrition': 20,
            'utilization': 75,
            'top_client_concentration': 20,
            'digital_revenue': 40
        }
    }

    # Default peer list for major IT companies
    DEFAULT_PEERS = {
        'TCS': ['INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
        'INFY': ['TCS', 'WIPRO', 'HCLTECH', 'TECHM'],
        'WIPRO': ['TCS', 'INFY', 'HCLTECH', 'TECHM'],
        'HCLTECH': ['TCS', 'INFY', 'WIPRO', 'TECHM'],
        'TECHM': ['TCS', 'INFY', 'WIPRO', 'HCLTECH']
    }

    def __init__(self, symbol: str, data: List[Dict], peers: Optional[List[str]] = None):
        # Auto-detect peers if not provided
        if not peers and symbol in self.DEFAULT_PEERS:
            peers = self.DEFAULT_PEERS[symbol]

        super().__init__(symbol, data, peers)

    def get_sector_name(self) -> str:
        """Return sector name"""
        return "Information Technology"

    def get_key_metrics(self) -> Dict[str, Any]:
        """
        Calculate IT-specific key metrics

        Returns comprehensive IT metrics with quality assessment
        """
        metrics = {}

        # Revenue Productivity
        metrics['productivity'] = self._analyze_productivity()

        # Profitability Metrics
        metrics['profitability'] = self._analyze_profitability()

        # People Metrics
        metrics['people_metrics'] = self._analyze_people_metrics()

        # Client Metrics
        metrics['client_metrics'] = self._analyze_client_metrics()

        # Growth Metrics
        metrics['growth'] = self._analyze_growth()

        # Digital Transformation
        metrics['digital'] = self._analyze_digital_metrics()

        # Overall Assessment
        metrics['overall_score'] = self._calculate_overall_score(metrics)

        return metrics

    def _analyze_productivity(self) -> Dict[str, Any]:
        """Analyze revenue productivity metrics"""

        # Revenue per employee (in lakhs)
        revenue_per_emp = self._safe_get('revenue_per_employee') or 0
        headcount = self._safe_get('headcount') or 0
        raw_revenue = self._safe_get('raw_revenue') or 0
        raw_employee_benefits = self._safe_get('raw_employee_benefits') or 0

        # Estimate headcount from employee benefits if not available
        # Average IT employee cost in India: ~18 lakhs/year (15-25 range)
        if headcount == 0 and raw_employee_benefits > 0:
            avg_cost_per_employee = 1800000  # 18 lakhs in rupees
            headcount = int(raw_employee_benefits / avg_cost_per_employee)

        # Calculate revenue per employee if not directly available
        if revenue_per_emp == 0 and headcount > 0 and raw_revenue > 0:
            # raw_revenue is in rupees, convert to lakhs per employee
            revenue_per_emp = (raw_revenue / 100000) / headcount

        # Assess productivity
        if revenue_per_emp > 0:
            if revenue_per_emp >= self.BENCHMARKS['excellent']['revenue_per_employee']:
                quality = 'Excellent'
                status = '✅✅'
            elif revenue_per_emp >= self.BENCHMARKS['good']['revenue_per_employee']:
                quality = 'Good'
                status = '✅'
            elif revenue_per_emp >= self.BENCHMARKS['acceptable']['revenue_per_employee']:
                quality = 'Acceptable'
                status = '⚠️'
            else:
                quality = 'Below Par'
                status = '❌'
        else:
            quality = 'Data Not Available'
            status = '⚪'

        # Trend analysis
        revenue_trend = self._calculate_trend('revenue_per_employee', 3)

        return {
            'revenue_per_employee': revenue_per_emp,
            'headcount': headcount,
            'quality': quality,
            'status': status,
            'trend': revenue_trend,
            'assessment': self._productivity_narrative(revenue_per_emp, headcount)
        }

    def _analyze_profitability(self) -> Dict[str, Any]:
        """Analyze IT profitability metrics"""

        # EBITDA Margin (these fields exist in database)
        ebitda_margin = self._safe_get('ebitda_margin') or 0
        operating_margin = self._safe_get('operating_profit_margin') or 0
        net_margin = self._safe_get('net_profit_margin') or 0

        # Assess EBITDA margin
        if ebitda_margin > 0:
            if ebitda_margin >= self.BENCHMARKS['excellent']['ebitda_margin']:
                quality = 'Excellent'
                status = '✅✅'
            elif ebitda_margin >= self.BENCHMARKS['good']['ebitda_margin']:
                quality = 'Good'
                status = '✅'
            elif ebitda_margin >= self.BENCHMARKS['acceptable']['ebitda_margin']:
                quality = 'Acceptable'
                status = '⚠️'
            else:
                quality = 'Poor'
                status = '❌'
        else:
            quality = 'Data Not Available'
            status = '⚪'

        # Margin trends
        ebitda_trend = self._calculate_trend('ebitda_margin', 3)

        return {
            'ebitda_margin': ebitda_margin,
            'operating_margin': operating_margin,
            'net_margin': net_margin,
            'quality': quality,
            'status': status,
            'trend': ebitda_trend,
            'assessment': self._profitability_narrative(ebitda_margin, operating_margin, net_margin)
        }

    def _analyze_people_metrics(self) -> Dict[str, Any]:
        """Analyze workforce metrics"""

        # Attrition rate (lower is better)
        attrition = self._safe_get('attrition_rate') or 0

        # Utilization rate
        utilization = self._safe_get('utilization_rate') or 0

        # Assess attrition (lower is better)
        if attrition > 0:
            if attrition <= self.BENCHMARKS['excellent']['attrition']:
                attrition_quality = 'Excellent'
                attrition_status = '✅✅'
            elif attrition <= self.BENCHMARKS['good']['attrition']:
                attrition_quality = 'Good'
                attrition_status = '✅'
            elif attrition <= self.BENCHMARKS['acceptable']['attrition']:
                attrition_quality = 'Acceptable'
                attrition_status = '⚠️'
            else:
                attrition_quality = 'High'
                attrition_status = '❌'
        else:
            attrition_quality = 'Data Not Available'
            attrition_status = '⚪'

        # Assess utilization
        if utilization > 0:
            if utilization >= self.BENCHMARKS['excellent']['utilization']:
                util_quality = 'Excellent'
                util_status = '✅✅'
            elif utilization >= self.BENCHMARKS['good']['utilization']:
                util_quality = 'Good'
                util_status = '✅'
            elif utilization >= self.BENCHMARKS['acceptable']['utilization']:
                util_quality = 'Acceptable'
                util_status = '⚠️'
            else:
                util_quality = 'Poor'
                util_status = '❌'
        else:
            util_quality = 'Data Not Available'
            util_status = '⚪'

        return {
            'attrition_rate': attrition if attrition > 0 else None,
            'attrition_quality': attrition_quality,
            'attrition_status': attrition_status,
            'utilization_rate': utilization if utilization > 0 else None,
            'utilization_quality': util_quality,
            'utilization_status': util_status,
            'assessment': self._people_narrative(attrition, utilization)
        }

    def _analyze_client_metrics(self) -> Dict[str, Any]:
        """Analyze client concentration and geography"""

        # Top client concentration
        top_client_pct = self._safe_get('top_client_percentage') or 0

        # Geography revenue split
        north_america = self._safe_get('revenue_north_america_pct') or 0
        europe = self._safe_get('revenue_europe_pct') or 0
        india = self._safe_get('revenue_india_pct') or 0

        # Assess concentration (lower is better)
        if top_client_pct > 0:
            if top_client_pct <= self.BENCHMARKS['excellent']['top_client_concentration']:
                quality = 'Well Diversified'
                status = '✅✅'
            elif top_client_pct <= self.BENCHMARKS['good']['top_client_concentration']:
                quality = 'Diversified'
                status = '✅'
            elif top_client_pct <= self.BENCHMARKS['acceptable']['top_client_concentration']:
                quality = 'Moderate Risk'
                status = '⚠️'
            else:
                quality = 'High Concentration'
                status = '❌'
        else:
            quality = 'Data Not Available'
            status = '⚪'

        return {
            'top_client_percentage': top_client_pct,
            'concentration_quality': quality,
            'concentration_status': status,
            'revenue_north_america_pct': north_america,
            'revenue_europe_pct': europe,
            'revenue_india_pct': india,
            'assessment': self._client_narrative(top_client_pct, north_america)
        }

    def _analyze_growth(self) -> Dict[str, Any]:
        """Analyze growth metrics"""

        # Revenue growth
        revenue_trend = self._calculate_trend('raw_revenue', 3)

        # Headcount growth
        headcount_trend = self._calculate_trend('headcount', 3)

        # Order book / deal wins
        order_book = self._safe_get('order_book_tcv') or 0

        return {
            'revenue_growth': revenue_trend,
            'headcount_growth': headcount_trend,
            'order_book_tcv': order_book,
            'assessment': self._growth_narrative(revenue_trend, headcount_trend)
        }

    def _analyze_digital_metrics(self) -> Dict[str, Any]:
        """Analyze digital transformation metrics"""

        # Digital revenue percentage
        digital_pct = self._safe_get('digital_revenue_pct') or 0

        # Cloud revenue
        cloud_revenue_pct = self._safe_get('cloud_revenue_pct') or 0

        # Assess digital transformation
        if digital_pct > 0:
            if digital_pct >= self.BENCHMARKS['excellent']['digital_revenue']:
                quality = 'Digital Leader'
                status = '✅✅'
            elif digital_pct >= self.BENCHMARKS['good']['digital_revenue']:
                quality = 'Strong Digital'
                status = '✅'
            elif digital_pct >= self.BENCHMARKS['acceptable']['digital_revenue']:
                quality = 'Transitioning'
                status = '⚠️'
            else:
                quality = 'Legacy Heavy'
                status = '❌'
        else:
            quality = 'Data Not Available'
            status = '⚪'

        return {
            'digital_revenue_pct': digital_pct if digital_pct > 0 else None,
            'cloud_revenue_pct': cloud_revenue_pct if cloud_revenue_pct > 0 else None,
            'digital_quality': quality,
            'digital_status': status,
            'assessment': self._digital_narrative(digital_pct, cloud_revenue_pct)
        }

    def _calculate_overall_score(self, metrics: Dict) -> Dict[str, Any]:
        """Calculate overall IT sector health score"""

        score = 0
        max_score = 0

        # Productivity (25%)
        prod = metrics.get('productivity', {})
        if prod.get('status') == '✅✅':
            score += 25
        elif prod.get('status') == '✅':
            score += 18
        elif prod.get('status') == '⚠️':
            score += 10
        max_score += 25

        # Profitability (25%)
        profit = metrics.get('profitability', {})
        if profit.get('status') == '✅✅':
            score += 25
        elif profit.get('status') == '✅':
            score += 18
        elif profit.get('status') == '⚠️':
            score += 10
        max_score += 25

        # People Metrics (20%)
        people = metrics.get('people_metrics', {})
        if people.get('attrition_status') == '✅✅':
            score += 10
        elif people.get('attrition_status') == '✅':
            score += 7
        elif people.get('attrition_status') == '⚠️':
            score += 4
        max_score += 10

        if people.get('utilization_status') == '✅✅':
            score += 10
        elif people.get('utilization_status') == '✅':
            score += 7
        elif people.get('utilization_status') == '⚠️':
            score += 4
        max_score += 10

        # Client Metrics (15%)
        client = metrics.get('client_metrics', {})
        if client.get('concentration_status') == '✅✅':
            score += 15
        elif client.get('concentration_status') == '✅':
            score += 10
        elif client.get('concentration_status') == '⚠️':
            score += 5
        max_score += 15

        # Digital Transformation (15%)
        digital = metrics.get('digital', {})
        if digital.get('digital_status') == '✅✅':
            score += 15
        elif digital.get('digital_status') == '✅':
            score += 10
        elif digital.get('digital_status') == '⚠️':
            score += 5
        max_score += 15

        # Calculate percentage
        if max_score > 0:
            score_pct = (score / max_score) * 100
        else:
            score_pct = 0

        # Determine rating
        if score_pct >= 80:
            rating = 'Tier 1 IT Leader'
            rating_emoji = '🟢🟢🟢'
        elif score_pct >= 65:
            rating = 'Strong Performer'
            rating_emoji = '🟢🟢'
        elif score_pct >= 50:
            rating = 'Average'
            rating_emoji = '🟡'
        elif score_pct >= 35:
            rating = 'Below Average'
            rating_emoji = '🟠'
        else:
            rating = 'Weak'
            rating_emoji = '🔴'

        return {
            'score': round(score, 1),
            'max_score': max_score,
            'score_percentage': round(score_pct, 1),
            'rating': rating,
            'rating_emoji': rating_emoji
        }

    # Narrative generators
    def _productivity_narrative(self, rev_per_emp: float, headcount: int) -> str:
        """Generate narrative for productivity"""
        if rev_per_emp == 0:
            return "Productivity data not available"

        narratives = []

        if rev_per_emp >= 35:
            narratives.append(f"Excellent ₹{rev_per_emp:.1f}L revenue/employee demonstrates high productivity")
        elif rev_per_emp >= 28:
            narratives.append(f"Good ₹{rev_per_emp:.1f}L revenue/employee")
        elif rev_per_emp >= 22:
            narratives.append(f"Decent ₹{rev_per_emp:.1f}L revenue/employee")
        else:
            narratives.append(f"Weak ₹{rev_per_emp:.1f}L revenue/employee indicates productivity challenges")

        if headcount > 0:
            narratives.append(f"with {headcount:,} employees")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _profitability_narrative(self, ebitda: float, operating: float, net: float) -> str:
        """Generate narrative for profitability"""
        if ebitda == 0 and operating == 0:
            return "Profitability data not available"

        narratives = []

        if ebitda > 0:
            if ebitda >= 25:
                narratives.append(f"Excellent {ebitda:.1f}% EBITDA margin demonstrates pricing power")
            elif ebitda >= 20:
                narratives.append(f"Strong {ebitda:.1f}% EBITDA margin")
            elif ebitda >= 15:
                narratives.append(f"Decent {ebitda:.1f}% EBITDA margin")
            else:
                narratives.append(f"Compressed {ebitda:.1f}% EBITDA margin under pressure")

        if net > 0:
            narratives.append(f"{net:.1f}% net margin")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _people_narrative(self, attrition: float, utilization: float) -> str:
        """Generate narrative for people metrics"""
        if attrition == 0 and utilization == 0:
            return "People metrics not available"

        narratives = []

        if attrition > 0:
            if attrition <= 12:
                narratives.append(f"Excellent {attrition:.1f}% attrition shows strong retention")
            elif attrition <= 15:
                narratives.append(f"Good {attrition:.1f}% attrition")
            elif attrition <= 20:
                narratives.append(f"Moderate {attrition:.1f}% attrition")
            else:
                narratives.append(f"High {attrition:.1f}% attrition raises retention concerns")

        if utilization > 0:
            if utilization >= 85:
                narratives.append(f"excellent {utilization:.1f}% utilization")
            elif utilization >= 80:
                narratives.append(f"good {utilization:.1f}% utilization")
            else:
                narratives.append(f"low {utilization:.1f}% utilization")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _client_narrative(self, top_client: float, north_america: float) -> str:
        """Generate narrative for client metrics"""
        if top_client == 0:
            return "Client concentration data not available"

        narratives = []

        if top_client > 0:
            if top_client <= 10:
                narratives.append(f"Well-diversified with top client at {top_client:.1f}%")
            elif top_client <= 15:
                narratives.append(f"Diversified portfolio with top client at {top_client:.1f}%")
            else:
                narratives.append(f"High client concentration with top client at {top_client:.1f}%")

        if north_america > 0:
            narratives.append(f"{north_america:.1f}% revenue from North America")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _growth_narrative(self, revenue_trend: Dict, headcount_trend: Dict) -> str:
        """Generate narrative for growth"""
        narratives = []

        if revenue_trend.get('cagr'):
            rev_cagr = revenue_trend['cagr']
            if rev_cagr > 15:
                narratives.append(f"Strong {rev_cagr:.1f}% revenue CAGR")
            elif rev_cagr > 10:
                narratives.append(f"Healthy {rev_cagr:.1f}% revenue growth")
            else:
                narratives.append(f"Modest {rev_cagr:.1f}% revenue growth")

        if headcount_trend.get('cagr'):
            hc_cagr = headcount_trend['cagr']
            narratives.append(f"{hc_cagr:.1f}% headcount CAGR")

        return ". ".join(narratives) if narratives else "Growth data not available"

    def _digital_narrative(self, digital_pct: float, cloud_pct: float) -> str:
        """Generate narrative for digital transformation"""
        if digital_pct == 0:
            return "Digital transformation data not available"

        if digital_pct >= 60:
            return f"Digital leader with {digital_pct:.1f}% digital revenue, positioning well for future growth"
        elif digital_pct >= 50:
            return f"Strong digital presence at {digital_pct:.1f}% of revenue"
        elif digital_pct >= 40:
            return f"Transitioning to digital with {digital_pct:.1f}% digital revenue"
        else:
            return f"Legacy-heavy business with only {digital_pct:.1f}% digital revenue"

    def get_peer_comparison(self) -> Dict[str, Any]:
        """Compare with peer IT companies"""
        return {
            'peers': self.peers,
            'metrics_to_compare': [
                'revenue_per_employee',
                'ebitda_margin',
                'operating_margin',
                'attrition_rate',
                'utilization_rate',
                'digital_revenue_pct',
                'roe',
                'roa'
            ],
            'note': 'Peer data needs to be loaded separately and passed to comparison module'
        }

    def get_industry_context(self) -> Dict[str, Any]:
        """Get IT industry context - Data-driven only"""
        return {
            'sector': 'Indian IT Services',
            'key_trends': [],  # Removed hardcoded trends
            'regulatory_environment': [],  # Removed hardcoded content
            'outlook': None  # Removed static narrative
        }

    def get_growth_catalysts(self) -> List[str]:
        """Identify IT sector growth catalysts - Data-driven only"""
        # Removed hardcoded catalysts - should be derived from actual data/news if needed
        return []

    def get_risk_factors(self) -> List[Dict[str, str]]:
        """Identify IT sector risks - Data-driven only"""
        # Removed hardcoded risk narratives - should be derived from actual data/analysis
        return []
