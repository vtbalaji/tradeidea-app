"""
Banking Sector Analyzer

Comprehensive analysis for banking and NBFC companies with sector-specific metrics:
- Asset Quality: NPA, PCR, Slippage Ratio
- Profitability: NIM, ROA, ROE, Cost-to-Income
- Funding: CASA Ratio, Loan-to-Deposit, Deposit Growth
- Capital: CAR, Tier 1 Ratio
- Growth: Loan Book, Advances, Branch Network
"""

from typing import Dict, List, Any, Optional
from .base_sector import BaseSectorAnalyzer


class BankingSectorAnalyzer(BaseSectorAnalyzer):
    """Banking sector specific analysis"""

    # Industry benchmarks for Indian banking sector
    BENCHMARKS = {
        'excellent': {
            'gnpa': 1.5,  # Gross NPA %
            'nnpa': 0.5,  # Net NPA %
            'nim': 3.5,   # Net Interest Margin %
            'casa': 45,   # CASA Ratio %
            'cost_income': 40,  # Cost-to-Income %
            'car': 16,    # Capital Adequacy %
            'roa': 1.8,   # Return on Assets %
            'pcr': 90     # Provision Coverage Ratio %
        },
        'good': {
            'gnpa': 2.5,
            'nnpa': 1.0,
            'nim': 3.0,
            'casa': 40,
            'cost_income': 45,
            'car': 14,
            'roa': 1.5,
            'pcr': 75
        },
        'acceptable': {
            'gnpa': 4.0,
            'nnpa': 1.5,
            'nim': 2.5,
            'casa': 35,
            'cost_income': 50,
            'car': 12,
            'roa': 1.0,
            'pcr': 60
        }
    }

    # Default peer list for major banks
    DEFAULT_PEERS = {
        'HDFCBANK': ['ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'],
        'ICICIBANK': ['HDFCBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'],
        'SBIN': ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK'],
        'AXISBANK': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK'],
        'KOTAKBANK': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK']
    }

    def __init__(self, symbol: str, data: List[Dict], peers: Optional[List[str]] = None):
        # Auto-detect peers if not provided
        if not peers and symbol in self.DEFAULT_PEERS:
            peers = self.DEFAULT_PEERS[symbol]

        super().__init__(symbol, data, peers)

    def get_sector_name(self) -> str:
        """Return sector name"""
        return "Banking & Financial Services"

    def get_key_metrics(self) -> Dict[str, Any]:
        """
        Calculate banking-specific key metrics

        Returns comprehensive banking metrics with quality assessment
        """
        metrics = {}

        # Asset Quality Metrics
        metrics['asset_quality'] = self._analyze_asset_quality()

        # Profitability Metrics
        metrics['profitability'] = self._analyze_profitability()

        # Funding & Liquidity
        metrics['funding'] = self._analyze_funding()

        # Capital Adequacy
        metrics['capital'] = self._analyze_capital()

        # Growth Metrics
        metrics['growth'] = self._analyze_growth()

        # Operating Efficiency
        metrics['efficiency'] = self._analyze_efficiency()

        # Overall Assessment
        metrics['overall_score'] = self._calculate_overall_score(metrics)

        return metrics

    def _analyze_asset_quality(self) -> Dict[str, Any]:
        """Analyze asset quality - most critical for banks"""

        # Try to get NPA data from different possible field names
        gnpa = (self._safe_get('gross_npa_ratio') or
                self._safe_get('gnpa_percent') or
                self._safe_get('gross_npa'))

        nnpa = (self._safe_get('net_npa_ratio') or
                self._safe_get('nnpa_percent') or
                self._safe_get('net_npa'))

        pcr = (self._safe_get('provision_coverage_ratio') or
               self._safe_get('pcr') or 0)

        # Assess quality
        if gnpa > 0:
            if gnpa < self.BENCHMARKS['excellent']['gnpa']:
                gnpa_quality = 'Excellent'
                gnpa_status = '✅✅'
            elif gnpa < self.BENCHMARKS['good']['gnpa']:
                gnpa_quality = 'Good'
                gnpa_status = '✅'
            elif gnpa < self.BENCHMARKS['acceptable']['gnpa']:
                gnpa_quality = 'Acceptable'
                gnpa_status = '⚠️'
            else:
                gnpa_quality = 'Poor'
                gnpa_status = '❌'
        else:
            gnpa_quality = 'Data Not Available'
            gnpa_status = '⚪'

        if nnpa > 0:
            if nnpa < self.BENCHMARKS['excellent']['nnpa']:
                nnpa_quality = 'Excellent'
                nnpa_status = '✅✅'
            elif nnpa < self.BENCHMARKS['good']['nnpa']:
                nnpa_quality = 'Good'
                nnpa_status = '✅'
            elif nnpa < self.BENCHMARKS['acceptable']['nnpa']:
                nnpa_quality = 'Acceptable'
                nnpa_status = '⚠️'
            else:
                nnpa_quality = 'Poor'
                nnpa_status = '❌'
        else:
            nnpa_quality = 'Data Not Available'
            nnpa_status = '⚪'

        # Provision Coverage Ratio assessment
        if pcr > 0:
            if pcr >= self.BENCHMARKS['excellent']['pcr']:
                pcr_quality = 'Excellent'
                pcr_status = '✅✅'
            elif pcr >= self.BENCHMARKS['good']['pcr']:
                pcr_quality = 'Good'
                pcr_status = '✅'
            elif pcr >= self.BENCHMARKS['acceptable']['pcr']:
                pcr_quality = 'Acceptable'
                pcr_status = '⚠️'
            else:
                pcr_quality = 'Poor'
                pcr_status = '❌'
        else:
            pcr_quality = 'Data Not Available'
            pcr_status = '⚪'

        # Calculate trends
        gnpa_trend = self._calculate_trend('gross_npa_ratio', 3)
        nnpa_trend = self._calculate_trend('net_npa_ratio', 3)

        return {
            'gross_npa': gnpa,
            'gross_npa_quality': gnpa_quality,
            'gross_npa_status': gnpa_status,
            'gross_npa_trend': gnpa_trend,
            'net_npa': nnpa,
            'net_npa_quality': nnpa_quality,
            'net_npa_status': nnpa_status,
            'net_npa_trend': nnpa_trend,
            'provision_coverage_ratio': pcr,
            'pcr_quality': pcr_quality,
            'pcr_status': pcr_status,
            'assessment': self._asset_quality_narrative(gnpa, nnpa, pcr)
        }

    def _analyze_profitability(self) -> Dict[str, Any]:
        """Analyze bank profitability metrics"""

        # Net Interest Margin - the lifeblood of banking
        nim = (self._safe_get('net_interest_margin') or
               self._safe_get('nim') or 0)

        # Return on Assets
        roa = self._safe_get('roa') or 0

        # Return on Equity
        roe = self._safe_get('roe') or 0

        # Assess NIM
        if nim > 0:
            if nim >= self.BENCHMARKS['excellent']['nim']:
                nim_quality = 'Excellent'
                nim_status = '✅✅'
            elif nim >= self.BENCHMARKS['good']['nim']:
                nim_quality = 'Good'
                nim_status = '✅'
            elif nim >= self.BENCHMARKS['acceptable']['nim']:
                nim_quality = 'Acceptable'
                nim_status = '⚠️'
            else:
                nim_quality = 'Poor'
                nim_status = '❌'
        else:
            nim_quality = 'Data Not Available'
            nim_status = '⚪'

        # Assess ROA
        if roa > 0:
            if roa >= self.BENCHMARKS['excellent']['roa']:
                roa_quality = 'Excellent'
                roa_status = '✅✅'
            elif roa >= self.BENCHMARKS['good']['roa']:
                roa_quality = 'Good'
                roa_status = '✅'
            elif roa >= self.BENCHMARKS['acceptable']['roa']:
                roa_quality = 'Acceptable'
                roa_status = '⚠️'
            else:
                roa_quality = 'Poor'
                roa_status = '❌'
        else:
            roa_quality = 'Data Not Available'
            roa_status = '⚪'

        return {
            'net_interest_margin': nim,
            'nim_quality': nim_quality,
            'nim_status': nim_status,
            'roa': roa,
            'roa_quality': roa_quality,
            'roa_status': roa_status,
            'roe': roe,
            'assessment': self._profitability_narrative(nim, roa, roe)
        }

    def _analyze_funding(self) -> Dict[str, Any]:
        """Analyze funding profile and liquidity"""

        # CASA Ratio - indicates low-cost deposit base
        casa = (self._safe_get('casa_ratio') or
                self._safe_get('casa') or 0)

        # Loan to Deposit Ratio
        ltd = (self._safe_get('loan_to_deposit_ratio') or
               self._safe_get('credit_deposit_ratio') or 0)

        # Assess CASA
        if casa > 0:
            if casa >= self.BENCHMARKS['excellent']['casa']:
                casa_quality = 'Excellent'
                casa_status = '✅✅'
            elif casa >= self.BENCHMARKS['good']['casa']:
                casa_quality = 'Good'
                casa_status = '✅'
            elif casa >= self.BENCHMARKS['acceptable']['casa']:
                casa_quality = 'Acceptable'
                casa_status = '⚠️'
            else:
                casa_quality = 'Poor'
                casa_status = '❌'
        else:
            casa_quality = 'Data Not Available'
            casa_status = '⚪'

        # LTD assessment (70-90% is ideal)
        if ltd > 0:
            if 75 <= ltd <= 85:
                ltd_quality = 'Optimal'
                ltd_status = '✅✅'
            elif 70 <= ltd < 75 or 85 < ltd <= 90:
                ltd_quality = 'Good'
                ltd_status = '✅'
            elif 65 <= ltd < 70 or 90 < ltd <= 95:
                ltd_quality = 'Acceptable'
                ltd_status = '⚠️'
            else:
                ltd_quality = 'Concerning'
                ltd_status = '❌'
        else:
            ltd_quality = 'Data Not Available'
            ltd_status = '⚪'

        return {
            'casa_ratio': casa,
            'casa_quality': casa_quality,
            'casa_status': casa_status,
            'loan_to_deposit': ltd,
            'ltd_quality': ltd_quality,
            'ltd_status': ltd_status,
            'assessment': self._funding_narrative(casa, ltd)
        }

    def _analyze_capital(self) -> Dict[str, Any]:
        """Analyze capital adequacy"""

        # Capital Adequacy Ratio (Basel III requirement: 9% minimum)
        car = (self._safe_get('capital_adequacy_ratio') or
               self._safe_get('car') or 0)

        # Tier 1 Capital Ratio
        tier1 = (self._safe_get('tier1_ratio') or
                 self._safe_get('cet1_ratio') or 0)

        # Assess CAR
        if car > 0:
            if car >= self.BENCHMARKS['excellent']['car']:
                car_quality = 'Excellent'
                car_status = '✅✅'
            elif car >= self.BENCHMARKS['good']['car']:
                car_quality = 'Good'
                car_status = '✅'
            elif car >= self.BENCHMARKS['acceptable']['car']:
                car_quality = 'Acceptable'
                car_status = '⚠️'
            else:
                car_quality = 'Poor'
                car_status = '❌'
        else:
            car_quality = 'Data Not Available'
            car_status = '⚪'

        return {
            'capital_adequacy_ratio': car,
            'car_quality': car_quality,
            'car_status': car_status,
            'tier1_ratio': tier1,
            'assessment': self._capital_narrative(car, tier1)
        }

    def _analyze_growth(self) -> Dict[str, Any]:
        """Analyze growth metrics"""

        # Loan book growth
        advances_trend = self._calculate_trend('advances', 3)

        # Deposit growth
        deposits_trend = self._calculate_trend('deposits', 3)

        # Branch network expansion
        branches = self._safe_get('branch_count') or 0

        return {
            'advances_growth': advances_trend,
            'deposits_growth': deposits_trend,
            'branch_count': branches,
            'assessment': self._growth_narrative(advances_trend, deposits_trend)
        }

    def _analyze_efficiency(self) -> Dict[str, Any]:
        """Analyze operating efficiency"""

        # Cost to Income Ratio - lower is better
        cost_income = (self._safe_get('cost_to_income_ratio') or
                       self._safe_get('cost_income_ratio') or 0)

        # Assess efficiency
        if cost_income > 0:
            if cost_income <= self.BENCHMARKS['excellent']['cost_income']:
                quality = 'Excellent'
                status = '✅✅'
            elif cost_income <= self.BENCHMARKS['good']['cost_income']:
                quality = 'Good'
                status = '✅'
            elif cost_income <= self.BENCHMARKS['acceptable']['cost_income']:
                quality = 'Acceptable'
                status = '⚠️'
            else:
                quality = 'Poor'
                status = '❌'
        else:
            quality = 'Data Not Available'
            status = '⚪'

        return {
            'cost_to_income_ratio': cost_income,
            'efficiency_quality': quality,
            'efficiency_status': status,
            'assessment': self._efficiency_narrative(cost_income)
        }

    def _calculate_overall_score(self, metrics: Dict) -> Dict[str, Any]:
        """Calculate overall banking health score"""

        score = 0
        max_score = 0

        # Asset Quality (30%)
        asset = metrics.get('asset_quality', {})
        if asset.get('gross_npa_status') == '✅✅':
            score += 15
        elif asset.get('gross_npa_status') == '✅':
            score += 10
        elif asset.get('gross_npa_status') == '⚠️':
            score += 5
        max_score += 15

        if asset.get('pcr_status') == '✅✅':
            score += 15
        elif asset.get('pcr_status') == '✅':
            score += 10
        elif asset.get('pcr_status') == '⚠️':
            score += 5
        max_score += 15

        # Profitability (25%)
        profit = metrics.get('profitability', {})
        if profit.get('nim_status') == '✅✅':
            score += 12.5
        elif profit.get('nim_status') == '✅':
            score += 8
        elif profit.get('nim_status') == '⚠️':
            score += 4
        max_score += 12.5

        if profit.get('roa_status') == '✅✅':
            score += 12.5
        elif profit.get('roa_status') == '✅':
            score += 8
        elif profit.get('roa_status') == '⚠️':
            score += 4
        max_score += 12.5

        # Funding (20%)
        funding = metrics.get('funding', {})
        if funding.get('casa_status') == '✅✅':
            score += 20
        elif funding.get('casa_status') == '✅':
            score += 13
        elif funding.get('casa_status') == '⚠️':
            score += 7
        max_score += 20

        # Capital (15%)
        capital = metrics.get('capital', {})
        if capital.get('car_status') == '✅✅':
            score += 15
        elif capital.get('car_status') == '✅':
            score += 10
        elif capital.get('car_status') == '⚠️':
            score += 5
        max_score += 15

        # Efficiency (10%)
        efficiency = metrics.get('efficiency', {})
        if efficiency.get('efficiency_status') == '✅✅':
            score += 10
        elif efficiency.get('efficiency_status') == '✅':
            score += 7
        elif efficiency.get('efficiency_status') == '⚠️':
            score += 3
        max_score += 10

        # Calculate percentage
        if max_score > 0:
            score_pct = (score / max_score) * 100
        else:
            score_pct = 0

        # Determine rating
        if score_pct >= 80:
            rating = 'Excellent'
            rating_emoji = '🟢🟢🟢'
        elif score_pct >= 65:
            rating = 'Good'
            rating_emoji = '🟢🟢'
        elif score_pct >= 50:
            rating = 'Average'
            rating_emoji = '🟡'
        elif score_pct >= 35:
            rating = 'Below Average'
            rating_emoji = '🟠'
        else:
            rating = 'Poor'
            rating_emoji = '🔴'

        return {
            'score': round(score, 1),
            'max_score': max_score,
            'score_percentage': round(score_pct, 1),
            'rating': rating,
            'rating_emoji': rating_emoji
        }

    def _asset_quality_narrative(self, gnpa: float, nnpa: float, pcr: float) -> str:
        """Generate narrative for asset quality"""
        if gnpa == 0 and nnpa == 0:
            return "Asset quality data not available for analysis"

        narratives = []

        if gnpa > 0:
            if gnpa < 2:
                narratives.append(f"Excellent asset quality with GNPA at {gnpa:.2f}%")
            elif gnpa < 4:
                narratives.append(f"Good asset quality with GNPA at {gnpa:.2f}%")
            else:
                narratives.append(f"Asset quality concerns with elevated GNPA at {gnpa:.2f}%")

        if pcr > 0:
            if pcr >= 85:
                narratives.append(f"Strong buffer with {pcr:.1f}% provision coverage")
            elif pcr >= 70:
                narratives.append(f"Adequate {pcr:.1f}% provision coverage")
            else:
                narratives.append(f"Low provision coverage at {pcr:.1f}% raises concerns")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _profitability_narrative(self, nim: float, roa: float, roe: float) -> str:
        """Generate narrative for profitability"""
        if nim == 0 and roa == 0:
            return "Profitability data not available"

        narratives = []

        if nim > 0:
            if nim >= 3.5:
                narratives.append(f"Excellent {nim:.2f}% NIM demonstrates strong pricing power")
            elif nim >= 3.0:
                narratives.append(f"Healthy {nim:.2f}% NIM")
            else:
                narratives.append(f"Compressed {nim:.2f}% NIM indicates competitive pressure")

        if roa > 0:
            if roa >= 1.5:
                narratives.append(f"strong {roa:.2f}% ROA")
            elif roa >= 1.0:
                narratives.append(f"decent {roa:.2f}% ROA")
            else:
                narratives.append(f"weak {roa:.2f}% ROA")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _funding_narrative(self, casa: float, ltd: float) -> str:
        """Generate narrative for funding"""
        if casa == 0 and ltd == 0:
            return "Funding data not available"

        narratives = []

        if casa > 0:
            if casa >= 45:
                narratives.append(f"Excellent {casa:.1f}% CASA ratio provides low-cost funding advantage")
            elif casa >= 40:
                narratives.append(f"Strong {casa:.1f}% CASA ratio")
            elif casa >= 35:
                narratives.append(f"Decent {casa:.1f}% CASA ratio")
            else:
                narratives.append(f"Weak {casa:.1f}% CASA ratio increases funding costs")

        if ltd > 0:
            if 75 <= ltd <= 85:
                narratives.append(f"optimal {ltd:.1f}% loan-to-deposit ratio")
            elif ltd > 90:
                narratives.append(f"elevated {ltd:.1f}% LDR may constrain growth")
            elif ltd < 70:
                narratives.append(f"conservative {ltd:.1f}% LDR suggests room for credit growth")

        return ". ".join(narratives) if narratives else "Insufficient data"

    def _capital_narrative(self, car: float, tier1: float) -> str:
        """Generate narrative for capital"""
        if car == 0:
            return "Capital adequacy data not available"

        if car >= 16:
            return f"Strong {car:.1f}% CAR provides comfortable cushion above regulatory minimum of 11.5%, supporting growth aspirations"
        elif car >= 14:
            return f"Healthy {car:.1f}% CAR comfortably above regulatory requirements"
        elif car >= 12:
            return f"Adequate {car:.1f}% CAR meets regulatory standards"
        else:
            return f"Thin {car:.1f}% CAR may require capital infusion for growth"

    def _growth_narrative(self, advances_trend: Dict, deposits_trend: Dict) -> str:
        """Generate narrative for growth"""
        narratives = []

        if advances_trend.get('cagr'):
            adv_cagr = advances_trend['cagr']
            if adv_cagr > 15:
                narratives.append(f"Strong {adv_cagr:.1f}% loan book CAGR")
            elif adv_cagr > 10:
                narratives.append(f"Healthy {adv_cagr:.1f}% loan book growth")
            else:
                narratives.append(f"Modest {adv_cagr:.1f}% loan book growth")

        if deposits_trend.get('cagr'):
            dep_cagr = deposits_trend['cagr']
            if dep_cagr > 15:
                narratives.append(f"rapid {dep_cagr:.1f}% deposit mobilization")
            elif dep_cagr > 10:
                narratives.append(f"steady {dep_cagr:.1f}% deposit growth")

        return ". ".join(narratives) if narratives else "Growth data not available"

    def _efficiency_narrative(self, cost_income: float) -> str:
        """Generate narrative for efficiency"""
        if cost_income == 0:
            return "Efficiency data not available"

        if cost_income <= 40:
            return f"Excellent {cost_income:.1f}% cost-to-income ratio demonstrates operational efficiency"
        elif cost_income <= 45:
            return f"Good {cost_income:.1f}% cost-to-income ratio"
        elif cost_income <= 50:
            return f"Acceptable {cost_income:.1f}% cost-to-income ratio"
        else:
            return f"Elevated {cost_income:.1f}% cost-to-income ratio indicates operational inefficiencies"

    def get_peer_comparison(self) -> Dict[str, Any]:
        """
        Compare with peer banks

        Note: This requires peer data to be loaded separately
        For now, returns structure that can be filled by main analyzer
        """
        return {
            'peers': self.peers,
            'metrics_to_compare': [
                'gross_npa_ratio',
                'net_npa_ratio',
                'net_interest_margin',
                'casa_ratio',
                'roa',
                'roe',
                'capital_adequacy_ratio',
                'cost_to_income_ratio'
            ],
            'note': 'Peer data needs to be loaded separately and passed to comparison module'
        }

    def get_industry_context(self) -> Dict[str, Any]:
        """Get banking industry context - Data-driven only"""
        return {
            'sector': 'Indian Banking',
            'key_trends': [],  # Removed hardcoded trends
            'regulatory_environment': [],  # Removed hardcoded content
            'outlook': None  # Removed static narrative
        }

    def get_growth_catalysts(self) -> List[str]:
        """Identify banking sector growth catalysts - Data-driven only"""
        # Removed hardcoded catalysts - should be derived from actual data/news if needed
        return []

    def get_risk_factors(self) -> List[Dict[str, str]]:
        """Identify banking sector risks - Data-driven only"""
        # Removed hardcoded risk narratives - should be derived from actual data/analysis
        return []
