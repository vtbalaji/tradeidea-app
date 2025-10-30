"""
Base Sector Analyzer

Abstract base class for sector-specific analysis
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional


class BaseSectorAnalyzer(ABC):
    """Base class for sector-specific analysis"""

    def __init__(self, symbol: str, data: List[Dict], peers: Optional[List[str]] = None):
        """
        Initialize sector analyzer

        Args:
            symbol: Stock symbol
            data: Historical financial data (sorted latest first)
            peers: List of peer company symbols
        """
        self.symbol = symbol
        self.data = data
        self.peers = peers or []
        self.latest = data[0] if data else {}

    @abstractmethod
    def get_sector_name(self) -> str:
        """Return sector name"""
        pass

    @abstractmethod
    def get_key_metrics(self) -> Dict[str, Any]:
        """
        Calculate sector-specific key metrics

        Returns:
            Dict with sector-specific metrics
        """
        pass

    @abstractmethod
    def get_peer_comparison(self) -> Dict[str, Any]:
        """
        Compare with peer companies

        Returns:
            Dict with peer comparison data
        """
        pass

    @abstractmethod
    def get_industry_context(self) -> Dict[str, Any]:
        """
        Get industry trends and context

        Returns:
            Dict with industry analysis
        """
        pass

    @abstractmethod
    def get_growth_catalysts(self) -> List[str]:
        """
        Identify sector-specific growth catalysts

        Returns:
            List of growth catalyst descriptions
        """
        pass

    @abstractmethod
    def get_risk_factors(self) -> List[Dict[str, str]]:
        """
        Identify sector-specific risks

        Returns:
            List of risk factors with severity and description
        """
        pass

    def analyze(self) -> Dict[str, Any]:
        """
        Run complete sector analysis

        Returns:
            Complete sector analysis report
        """
        return {
            'sector': self.get_sector_name(),
            'key_metrics': self.get_key_metrics(),
            'peer_comparison': self.get_peer_comparison(),
            'industry_context': self.get_industry_context(),
            'growth_catalysts': self.get_growth_catalysts(),
            'risk_factors': self.get_risk_factors()
        }

    def _safe_get(self, field: str, default: Any = 0) -> Any:
        """Safely get field from latest data"""
        return self.latest.get(field, default) or default

    def _calculate_trend(self, field: str, years: int = 3) -> Dict[str, Any]:
        """
        Calculate trend for a metric

        Args:
            field: Field name
            years: Number of years to analyze

        Returns:
            Dict with trend analysis
        """
        values = []
        for i in range(min(years, len(self.data))):
            val = self.data[i].get(field)
            if val and val > 0:
                values.append(float(val))

        if len(values) < 2:
            return {'trend': 'Unknown', 'direction': '⚪'}

        # Calculate CAGR
        cagr = ((values[0] / values[-1]) ** (1 / (len(values) - 1)) - 1) * 100

        # Determine trend
        if cagr > 10:
            trend = 'Strong Growth'
            direction = '🟢🟢'
        elif cagr > 5:
            trend = 'Growth'
            direction = '🟢'
        elif cagr > -5:
            trend = 'Stable'
            direction = '🟡'
        elif cagr > -10:
            trend = 'Declining'
            direction = '🔴'
        else:
            trend = 'Sharp Decline'
            direction = '🔴🔴'

        return {
            'cagr': cagr,
            'trend': trend,
            'direction': direction,
            'latest': values[0],
            'oldest': values[-1]
        }
