"""
Reusable analysis modules

These modules can be used across different sectors:
- company_overview: Business description, history, segments
- peer_comparison: Comparative analysis with competitors
- growth_catalysts: Specific growth drivers and opportunities
- risk_analysis: Detailed risk assessment
- management_analysis: Leadership evaluation
- trend_tables: Historical trend tables
"""

from .trend_tables import TrendTableGenerator
from .peer_comparison import PeerComparator

__all__ = ['TrendTableGenerator', 'PeerComparator']
