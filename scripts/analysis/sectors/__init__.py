"""
Sector-specific analysis modules

Each sector has unique metrics and analysis requirements:
- Banking: NPA, CASA, NIM, CAR, PCR
- IT: Revenue per employee, attrition, utilization, client concentration
- Pharma: R&D spend, product pipeline, regulatory approvals
- Auto: Volume growth, EBITDA/vehicle, market share
- FMCG: Distribution reach, ad spend, volume vs value growth
"""

from .base_sector import BaseSectorAnalyzer
from .banking_sector import BankingSectorAnalyzer
from .it_sector import ITSectorAnalyzer

__all__ = ['BaseSectorAnalyzer', 'BankingSectorAnalyzer', 'ITSectorAnalyzer']
