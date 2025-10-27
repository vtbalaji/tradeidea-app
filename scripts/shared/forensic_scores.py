"""
Forensic Score Calculations - Single Source of Truth

This module provides unified access to all forensic scoring models:
- Beneish M-Score (Earnings Manipulation Detection)
- Altman Z-Score (Bankruptcy Prediction)
- Piotroski F-Score (Fundamental Strength)
- J-Score (Cash Flow Quality)
- Red Flags Detection

All scripts should import from here for consistency.
"""

import sys
import os

# Add forensics directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
forensics_dir = os.path.join(parent_dir, 'forensics')
sys.path.insert(0, forensics_dir)

# Import and re-export forensic score classes
from beneish_m_score import BeneishMScore
from altman_z_score import AltmanZScore
from piotroski_f_score import PiotroskiFScore
from j_score import JScore
from red_flags import RedFlagsDetector

__all__ = [
    'BeneishMScore',
    'AltmanZScore',
    'PiotroskiFScore',
    'JScore',
    'RedFlagsDetector'
]


# Convenience function for quick F-Score calculation
def calculate_fscore_simple(current_data, previous_data):
    """
    Quick F-Score calculation without full report

    Args:
        current_data: Dict with current year financial data
        previous_data: Dict with previous year financial data

    Returns:
        int: F-Score (0-9)
    """
    result = PiotroskiFScore.calculate(current_data, previous_data)
    return result.get('F_Score', 0)


# Convenience function for quick scoring
def get_all_scores(current_data, previous_data, full_timeseries=None, company_type='manufacturing'):
    """
    Calculate all forensic scores at once

    Args:
        current_data: Dict with current year data
        previous_data: Dict with previous year data (required for M-Score, F-Score)
        full_timeseries: List of dicts for J-Score (optional)
        company_type: 'manufacturing', 'service', or 'emerging_market'

    Returns:
        Dict with all scores
    """
    scores = {}

    # M-Score (requires 2 years)
    if previous_data:
        scores['m_score'] = BeneishMScore.calculate(current_data, previous_data)

    # Z-Score (requires 1 year)
    is_listed = current_data.get('market_cap', 0) > 0
    scores['z_score'] = AltmanZScore.calculate(current_data, company_type, is_listed)

    # F-Score (requires 2 years)
    if previous_data:
        scores['f_score'] = PiotroskiFScore.calculate(current_data, previous_data)

    # J-Score (requires time series)
    if full_timeseries:
        scores['j_score'] = JScore.calculate(full_timeseries)

    # Red Flags (requires time series)
    if full_timeseries:
        scores['red_flags'] = RedFlagsDetector.detect_all(full_timeseries)

    return scores
