#!/usr/bin/env python3
"""
PDF Report Generator for Investment Analysis
Converts JSON analysis to professional PDF reports
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from jinja2 import Template

def format_number(value, decimals=2):
    """Format number with proper decimals"""
    if value is None:
        return "N/A"
    try:
        if isinstance(value, (int, float)):
            if abs(value) >= 10000:
                return f"{value:,.0f}"
            elif decimals == 0:
                return f"{value:,.0f}"
            else:
                return f"{value:,.{decimals}f}"
        return str(value)
    except:
        return "N/A"

def get_recommendation_class(recommendation):
    """Get CSS class for recommendation"""
    rec_lower = recommendation.lower()
    if 'strong buy' in rec_lower:
        return 'strong-buy'
    elif 'buy' in rec_lower:
        return 'buy'
    elif 'hold' in rec_lower:
        return 'hold'
    elif 'strong sell' in rec_lower:
        return 'strong-sell'
    elif 'sell' in rec_lower:
        return 'sell'
    return 'hold'

def get_status_indicator(value, good_threshold, warning_threshold, reverse=False):
    """Get status class and indicator based on value"""
    if value is None or value == "N/A":
        return "warning", "⚠️"

    try:
        val = float(str(value).rstrip('x%'))
        if not reverse:
            if val >= good_threshold:
                return "good", "✅"
            elif val >= warning_threshold:
                return "warning", "⚠️"
            else:
                return "bad", "❌"
        else:
            if val <= good_threshold:
                return "good", "✅"
            elif val <= warning_threshold:
                return "warning", "⚠️"
            else:
                return "bad", "❌"
    except:
        return "warning", "⚠️"

def extract_template_data(json_data):
    """Extract and format data for template"""
    data = {}

    # Basic Info
    data['symbol'] = json_data.get('symbol', 'N/A')
    data['timestamp'] = datetime.fromisoformat(json_data['timestamp'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
    data['year'] = datetime.now().year

    # Recommendation
    recommendation = json_data.get('recommendation', {})
    data['recommendation'] = recommendation.get('recommendation', 'N/A')
    data['recommendation_emoji'] = recommendation.get('emoji', '')
    data['recommendation_class'] = get_recommendation_class(data['recommendation'])
    data['score'] = recommendation.get('score', 0)
    data['key_reasons'] = recommendation.get('reasons', [])[:8]

    # Company Snapshot - get from forensic._loaded_data and technical
    latest_statement = {}
    if 'forensic' in json_data and '_loaded_data' in json_data['forensic']:
        if len(json_data['forensic']['_loaded_data']) > 0:
            latest_statement = json_data['forensic']['_loaded_data'][0]

    technical = json_data.get('technical', {})

    # Market cap in lakhs, convert to crores
    market_cap_raw = latest_statement.get('market_cap', 0) or 0
    data['market_cap'] = format_number(market_cap_raw / 10000000, 0)

    data['current_price'] = format_number(technical.get('current_price', 0))

    # Revenue in lakhs, convert to crores
    revenue_raw = latest_statement.get('raw_revenue', 0) or 0
    data['revenue'] = format_number(revenue_raw / 10000000, 0)

    data['latest_fy'] = latest_statement.get('fy', 'N/A')

    # Growth Metrics - get from growth_metrics
    growth = json_data.get('growth_metrics', {})
    forensic_meta = json_data.get('forensic', {}).get('metadata', {})
    data['years'] = forensic_meta.get('data_years', 5)
    revenue_cagr = growth.get('revenue_cagr', 0)
    profit_cagr = growth.get('profit_cagr', 0)

    data['revenue_cagr'] = format_number(revenue_cagr, 1)
    data['profit_cagr'] = format_number(profit_cagr, 1)

    data['revenue_status'], data['revenue_indicator'] = get_status_indicator(revenue_cagr, 15, 10)
    data['profit_status'], data['profit_indicator'] = get_status_indicator(profit_cagr, 15, 10)

    # Valuation - get from latest_statement and intrinsic_value
    pe = latest_statement.get('pe', 0) or 0
    pb = latest_statement.get('pb', 0) or 0
    ps = latest_statement.get('ps', 0) or 0

    data['pe_ratio'] = format_number(pe, 2) + 'x'
    data['pb_ratio'] = format_number(pb, 2) + 'x'
    data['ps_ratio'] = format_number(ps, 2) + 'x'

    data['pe_status'], data['pe_indicator'] = get_status_indicator(pe, 25, 35, reverse=True)
    data['pb_status'], data['pb_indicator'] = get_status_indicator(pb, 3, 5, reverse=True)
    data['ps_status'], data['ps_indicator'] = get_status_indicator(ps, 5, 10, reverse=True)

    intrinsic = json_data.get('intrinsic_value', {})
    intrinsic_val = intrinsic.get('average_intrinsic', 0) or 0
    data['intrinsic_value'] = format_number(intrinsic_val)

    # Calculate margin of safety
    current_price = technical.get('current_price', 0) or 1
    if intrinsic_val > 0:
        mos = ((intrinsic_val - current_price) / current_price) * 100
    else:
        mos = 0

    data['margin_of_safety'] = format_number(mos, 1)
    data['mos_color'] = '#28a745' if mos > 0 else '#dc3545'

    # Determine valuation status
    if mos > 30:
        data['valuation_status'] = 'SIGNIFICANTLY UNDERVALUED'
        data['valuation_status_class'] = 'good'
    elif mos > 10:
        data['valuation_status'] = 'UNDERVALUED'
        data['valuation_status_class'] = 'good'
    elif mos > -10:
        data['valuation_status'] = 'FAIR'
        data['valuation_status_class'] = 'warning'
    elif mos > -30:
        data['valuation_status'] = 'OVERVALUED'
        data['valuation_status_class'] = 'bad'
    else:
        data['valuation_status'] = 'SIGNIFICANTLY OVERVALUED'
        data['valuation_status_class'] = 'bad'

    # Scenarios - get from scenario_analysis
    scenarios = json_data.get('scenario_analysis', {})
    base_target = scenarios.get('base_case', {}).get('target_price', 0) or 0

    # Check if scenario analysis has valid data (target_price > 0)
    if scenarios and base_target > 0:
        data['has_scenarios'] = True

        # Base case for executive summary
        base_return = scenarios.get('base_case', {}).get('return_pct', 0) or 0

        data['target_price'] = format_number(base_target)
        data['upside'] = format_number(base_return, 1)
        data['upside_label'] = 'Upside' if base_return > 0 else 'Downside'
        data['upside_color'] = '#28a745' if base_return > 0 else '#dc3545'

        # Bull/Base/Bear scenarios
        bull_target = scenarios.get('bull_case', {}).get('target_price', 0) or 0
        bull_return = scenarios.get('bull_case', {}).get('return_pct', 0) or 0

        data['bull_target'] = format_number(bull_target)
        data['bull_return'] = f"{bull_return:+.1f}%" if bull_return else "N/A"
        data['bull_scenario'] = f"Optimistic growth ({scenarios.get('bull_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        data['base_target'] = format_number(base_target)
        data['base_return'] = f"{base_return:+.1f}%" if base_return else "N/A"
        data['base_scenario'] = f"Expected growth ({scenarios.get('base_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        bear_target = scenarios.get('bear_case', {}).get('target_price', 0) or 0
        bear_return = scenarios.get('bear_case', {}).get('return_pct', 0) or 0

        data['bear_target'] = format_number(bear_target)
        data['bear_return'] = f"{bear_return:+.1f}%" if bear_return else "N/A"
        data['bear_scenario'] = f"Conservative growth ({scenarios.get('bear_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        data['weighted_target'] = format_number(scenarios.get('probability_weighted', 0))
    else:
        # Fallback to intrinsic value if scenarios are not available or invalid
        data['has_scenarios'] = False
        data['target_price'] = format_number(intrinsic_val)
        data['upside'] = format_number(mos, 1)
        data['upside_label'] = 'Potential Upside' if mos > 0 else 'Potential Downside'
        data['upside_color'] = '#28a745' if mos > 0 else '#dc3545'

    # Forensic Analysis
    forensic = json_data.get('forensic', {})

    # Beneish M-Score
    beneish = forensic.get('beneish_m_score', {})
    m_score = beneish.get('M_Score', 0)
    data['beneish_score'] = format_number(m_score, 2)
    risk = beneish.get('Risk_Category', 'Unknown').upper()
    data['beneish_risk'] = risk

    if risk == 'LOW':
        data['beneish_risk_class'] = 'low-risk'
        data['beneish_risk_label'] = 'low'
    elif risk == 'MEDIUM':
        data['beneish_risk_class'] = 'medium-risk'
        data['beneish_risk_label'] = 'medium'
    elif risk == 'HIGH':
        data['beneish_risk_class'] = 'high-risk'
        data['beneish_risk_label'] = 'high'
    else:
        data['beneish_risk_class'] = 'medium-risk'
        data['beneish_risk_label'] = 'medium'

    # Piotroski F-Score
    piotroski = forensic.get('piotroski_f_score', {})
    f_score = piotroski.get('F_Score', 0)
    data['piotroski_score'] = f_score
    data['piotroski_strength'] = piotroski.get('Strength_Category', 'Unknown')
    data['piotroski_percent'] = int((f_score / 9) * 100)

    if f_score >= 7:
        data['piotroski_risk_class'] = 'low-risk'
        data['piotroski_risk_label'] = 'low'
        data['piotroski_bar_class'] = 'good'
    elif f_score >= 4:
        data['piotroski_risk_class'] = 'medium-risk'
        data['piotroski_risk_label'] = 'medium'
        data['piotroski_bar_class'] = 'medium'
    else:
        data['piotroski_risk_class'] = 'high-risk'
        data['piotroski_risk_label'] = 'high'
        data['piotroski_bar_class'] = 'bad'

    # Piotroski F-Score Details
    piotroski_details = piotroski.get('Details', {})
    piotroski_items = []
    for key, detail in piotroski_details.items():
        score = detail.get('score', 0)
        description = detail.get('description', '')
        piotroski_items.append({
            'name': key.replace('_', ' ').title(),
            'score': score,
            'status': '✅' if score == 1 else '❌',
            'description': description
        })
    data['piotroski_details'] = piotroski_items

    # J-Score
    jscore_data = forensic.get('j_score', {})
    jscore = jscore_data.get('J_Score', 0)
    data['jscore'] = jscore
    data['jscore_flags'] = jscore_data.get('Total_Flags', 0)
    jscore_risk = jscore_data.get('Risk_Category', 'Unknown').upper()
    data['jscore_risk'] = jscore_risk

    if jscore <= 5:
        data['jscore_risk_class'] = 'low-risk'
        data['jscore_risk_label'] = 'low'
    elif jscore <= 10:
        data['jscore_risk_class'] = 'medium-risk'
        data['jscore_risk_label'] = 'medium'
    else:
        data['jscore_risk_class'] = 'high-risk'
        data['jscore_risk_label'] = 'high'

    # J-Score Flags
    flag_items = []
    for flag in jscore_data.get('Flags', []):
        severity = flag.get('severity', 'MEDIUM').upper()
        flag_items.append({
            'title': flag.get('type', flag.get('flag', '')),  # Try 'type' first, then 'flag'
            'period': flag.get('year', flag.get('period', '')),  # Try 'year' first, then 'period'
            'description': flag.get('description', flag.get('details', '')),  # Try 'description' first, then 'details'
            'severity_class': 'high' if severity == 'HIGH' else 'medium',
            'emoji': '🔴' if severity == 'HIGH' else '⚠️'
        })
    data['jscore_flag_items'] = flag_items

    # Altman Z-Score
    altman = forensic.get('altman_z_score', {})
    z_score = altman.get('Z_Score')
    if z_score is None or altman.get('Risk_Category') == 'N/A - Banking Company':
        data['altman_score'] = 'N/A'
        data['altman_risk'] = 'Not Applicable'
        data['altman_risk_class'] = 'medium-risk'
        data['altman_risk_label'] = 'medium'
    else:
        data['altman_score'] = format_number(z_score, 2)
        altman_risk = altman.get('Risk_Category', 'Unknown')
        data['altman_risk'] = altman_risk

        if 'Safe' in altman_risk:
            data['altman_risk_class'] = 'low-risk'
            data['altman_risk_label'] = 'low'
        elif 'Grey' in altman_risk:
            data['altman_risk_class'] = 'medium-risk'
            data['altman_risk_label'] = 'medium'
        else:
            data['altman_risk_class'] = 'high-risk'
            data['altman_risk_label'] = 'high'

    # Red Flags
    red_flags = forensic.get('red_flags', {})
    data['red_flags_count'] = red_flags.get('total_flags', 0)
    data['red_flags_high'] = red_flags.get('high_severity_count', 0)

    flag_items = []
    for flag in red_flags.get('flags', []):
        severity = flag.get('severity', 'MEDIUM').upper()
        flag_items.append({
            'description': flag.get('flag', ''),
            'severity_class': 'high' if severity == 'HIGH' else 'medium',
            'icon': '🔴' if severity == 'HIGH' else '⚠️'
        })
    data['red_flag_items'] = flag_items

    # Earnings Quality
    earnings = json_data.get('earnings_quality', {})
    cash_conv = earnings.get('cash_conversion', 0)
    data['cash_conversion'] = format_number(cash_conv, 0)
    data['cash_conversion_status'], data['cash_conversion_indicator'] = get_status_indicator(cash_conv, 100, 80)

    accruals = earnings.get('accruals_ratio', 0)
    data['accruals_ratio'] = format_number(abs(accruals), 1)
    data['accruals_status'], data['accruals_indicator'] = get_status_indicator(abs(accruals), 5, 10, reverse=True)

    quality_score = earnings.get('quality_score', 0)
    data['quality_score'] = quality_score
    data['quality_assessment'] = earnings.get('quality_assessment', 'N/A')
    data['quality_score_status'] = 'good' if quality_score >= 7 else 'warning' if quality_score >= 5 else 'bad'

    # Credit Quality
    credit = json_data.get('credit_quality', {})
    de = credit.get('debt_equity', 0)
    data['debt_equity'] = format_number(de, 2)
    data['debt_equity_status'], data['debt_equity_indicator'] = get_status_indicator(de, 0.5, 1.0, reverse=True)

    ic = credit.get('interest_coverage', 0)
    data['interest_coverage'] = format_number(ic, 1)
    data['interest_coverage_status'], data['interest_coverage_indicator'] = get_status_indicator(ic, 5, 3)

    credit_score = credit.get('credit_score', 0)
    data['credit_score'] = credit_score
    data['credit_assessment'] = credit.get('credit_assessment', 'N/A')
    data['credit_score_status'] = 'good' if credit_score >= 7 else 'warning' if credit_score >= 5 else 'bad'

    # Management Quality
    management = json_data.get('management_quality', {})
    mgmt_score = management.get('quality_score', 0)
    data['management_score'] = mgmt_score
    data['management_assessment'] = management.get('assessment', 'N/A')
    data['management_percent'] = int((mgmt_score / 10) * 100)
    data['management_bar_class'] = 'good' if mgmt_score >= 7 else 'medium' if mgmt_score >= 5 else 'bad'
    data['management_highlights'] = management.get('highlights', [])[:5]

    # Sector Analysis
    sector_analysis = json_data.get('sector_analysis', {})
    data['has_sector_analysis'] = bool(sector_analysis and sector_analysis.get('sector'))
    if data['has_sector_analysis']:
        data['sector_name'] = sector_analysis.get('sector', 'N/A')

        # Extract key metrics based on sector
        key_metrics = sector_analysis.get('key_metrics', {})

        # Banking-specific metrics
        if 'asset_quality' in key_metrics:
            asset_quality = key_metrics.get('asset_quality', {})
            profitability = key_metrics.get('profitability', {})
            funding = key_metrics.get('funding', {})
            capital = key_metrics.get('capital', {})

            data['banking_gnpa'] = format_number(asset_quality.get('gross_npa', 0), 2)
            data['banking_gnpa_status'] = asset_quality.get('gross_npa_status', '⚪')
            data['banking_nnpa'] = format_number(asset_quality.get('net_npa', 0), 2)
            data['banking_pcr'] = format_number(asset_quality.get('provision_coverage_ratio', 0), 1)

            data['banking_nim'] = format_number(profitability.get('net_interest_margin', 0), 2)
            data['banking_nim_status'] = profitability.get('nim_status', '⚪')
            data['banking_roa'] = format_number(profitability.get('roa', 0), 2)

            data['banking_casa'] = format_number(funding.get('casa_ratio', 0), 1)
            data['banking_casa_status'] = funding.get('casa_status', '⚪')

            data['banking_car'] = format_number(capital.get('capital_adequacy_ratio', 0), 1)
            data['banking_car_status'] = capital.get('car_status', '⚪')

        # IT-specific metrics
        if 'productivity' in key_metrics:
            productivity = key_metrics.get('productivity', {})
            profitability = key_metrics.get('profitability', {})
            people = key_metrics.get('people_metrics', {})
            digital = key_metrics.get('digital', {})

            data['it_revenue_per_emp'] = format_number(productivity.get('revenue_per_employee', 0), 1)
            data['it_revenue_per_emp_status'] = productivity.get('status', '⚪')

            data['it_ebitda_margin'] = format_number(profitability.get('ebitda_margin', 0), 1)
            data['it_ebitda_status'] = profitability.get('status', '⚪')

            data['it_attrition'] = format_number(people.get('attrition_rate'), 1) if people.get('attrition_rate') is not None else 'N/A'
            data['it_attrition_status'] = people.get('attrition_status', '⚪')
            data['it_utilization'] = format_number(people.get('utilization_rate'), 1) if people.get('utilization_rate') is not None else 'N/A'
            data['it_utilization_status'] = people.get('utilization_status', '⚪')

            data['it_digital_pct'] = format_number(digital.get('digital_revenue_pct'), 1) if digital.get('digital_revenue_pct') is not None else 'N/A'
            data['it_digital_status'] = digital.get('digital_status', '⚪')

        # Capital Goods-specific metrics
        if 'order_book' in key_metrics:
            order_book = key_metrics.get('order_book', {})
            execution = key_metrics.get('execution', {})
            profitability = key_metrics.get('profitability', {})
            working_capital = key_metrics.get('working_capital', {})
            financial_health = key_metrics.get('financial_health', {})

            # Handle None values for order book (data may not be available)
            data['cg_order_book_ratio'] = format_number(order_book.get('order_book_to_sales'), 2) if order_book.get('order_book_to_sales') is not None else 'N/A'
            data['cg_order_book_status'] = order_book.get('order_book_rating', '⚪')
            data['cg_visibility_months'] = format_number(order_book.get('visibility_months'), 0) if order_book.get('visibility_months') is not None else 'N/A'
            data['cg_order_inflow_growth'] = format_number(order_book.get('order_inflow_growth'), 1) if order_book.get('order_inflow_growth') is not None else 'N/A'

            data['cg_revenue_cagr'] = format_number(execution.get('revenue_cagr_3y', 0), 1)
            data['cg_asset_turnover'] = format_number(execution.get('asset_turnover', 0), 2)
            data['cg_asset_turnover_status'] = execution.get('asset_turnover_rating', '⚪')

            data['cg_ebitda_margin'] = format_number(profitability.get('ebitda_margin', 0), 1)
            data['cg_ebitda_status'] = profitability.get('ebitda_rating', '⚪')
            data['cg_roc'] = format_number(profitability.get('return_on_capital', 0), 1)
            data['cg_roc_status'] = profitability.get('roc_rating', '⚪')

            data['cg_ccc'] = format_number(working_capital.get('cash_conversion_cycle', 0), 0)
            data['cg_ccc_status'] = working_capital.get('ccc_rating', '⚪')

            data['cg_debt_equity'] = format_number(financial_health.get('debt_equity', 0), 2)
            data['cg_debt_equity_status'] = financial_health.get('de_rating', '⚪')
            data['cg_interest_coverage'] = format_number(financial_health.get('interest_coverage', 0), 1)
            data['cg_interest_coverage_status'] = financial_health.get('ic_rating', '⚪')

        # Overall score
        overall = key_metrics.get('overall_score', {})
        data['sector_health_score'] = overall.get('score_percentage', 0)
        data['sector_rating'] = overall.get('rating', 'N/A')
        data['sector_rating_emoji'] = overall.get('rating_emoji', '⚪')

        # Industry context
        industry = sector_analysis.get('industry_context', {})
        data['sector_trends'] = industry.get('key_trends', [])[:5]  # Top 5 trends
        data['sector_outlook'] = industry.get('outlook', 'N/A')

        # Growth catalysts
        data['growth_catalysts'] = sector_analysis.get('growth_catalysts', [])[:5]  # Top 5

    # Technical Analysis
    data['has_technical'] = bool(technical and technical.get('current_price', 0) > 0)
    if data['has_technical']:
        data['tech_trend'] = technical.get('trend', 'Unknown')
        data['tech_trend_emoji'] = technical.get('trend_emoji', '⚪')
        data['tech_last_updated'] = technical.get('last_updated', 'N/A')

        # Moving Averages
        data['tech_ma_20'] = format_number(technical.get('ma_20', 0))
        data['tech_ma_50'] = format_number(technical.get('ma_50', 0))
        data['tech_ma_200'] = format_number(technical.get('ma_200', 0))

        # RSI
        rsi = technical.get('rsi', 50)
        data['tech_rsi'] = format_number(rsi, 1)
        if rsi > 70:
            data['tech_rsi_status'] = 'bad'
            data['tech_rsi_label'] = 'Overbought'
            data['tech_rsi_color'] = '#dc3545'
        elif rsi < 30:
            data['tech_rsi_status'] = 'good'
            data['tech_rsi_label'] = 'Oversold'
            data['tech_rsi_color'] = '#28a745'
        else:
            data['tech_rsi_status'] = 'good'
            data['tech_rsi_label'] = 'Neutral'
            data['tech_rsi_color'] = '#6c757d'

        # MACD
        macd = technical.get('macd', 0)
        macd_signal = technical.get('macd_signal', 0)
        data['tech_macd'] = format_number(macd, 2)
        data['tech_macd_signal'] = format_number(macd_signal, 2)
        data['tech_macd_status'] = 'good' if macd > macd_signal else 'bad'
        data['tech_macd_label'] = 'Bullish' if macd > macd_signal else 'Bearish'

        # Bollinger Bands
        bb_upper = technical.get('bb_upper', 0)
        bb_lower = technical.get('bb_lower', 0)
        data['tech_bb_upper'] = format_number(bb_upper)
        data['tech_bb_lower'] = format_number(bb_lower)

        # Support/Resistance
        support = technical.get('support_52w', 0)
        resistance = technical.get('resistance_52w', 0)
        data['tech_support'] = format_number(support)
        data['tech_resistance'] = format_number(resistance)

        # Distance from support/resistance
        if current_price > 0 and support > 0:
            support_dist = ((current_price - support) / support) * 100
            data['tech_support_dist'] = format_number(support_dist, 1)
        else:
            data['tech_support_dist'] = 'N/A'

        if current_price > 0 and resistance > 0:
            resistance_dist = ((resistance - current_price) / current_price) * 100
            data['tech_resistance_dist'] = format_number(resistance_dist, 1)
        else:
            data['tech_resistance_dist'] = 'N/A'

        # Volume
        vol_ratio = technical.get('volume_ratio', 1)
        data['tech_volume_ratio'] = format_number(vol_ratio, 2)
        data['tech_volume_status'] = 'good' if vol_ratio > 1.5 else 'warning' if vol_ratio > 0.8 else 'bad'
        data['tech_volume_label'] = 'High' if vol_ratio > 1.5 else 'Normal' if vol_ratio > 0.8 else 'Low'

        # Performance
        data['tech_perf_1m'] = format_number(technical.get('perf_1m', 0), 1)
        data['tech_perf_3m'] = format_number(technical.get('perf_3m', 0), 1)
        data['tech_perf_6m'] = format_number(technical.get('perf_6m', 0), 1)
        data['tech_perf_1y'] = format_number(technical.get('perf_1y', 0), 1)

        # Performance colors
        data['tech_perf_1m_color'] = '#28a745' if technical.get('perf_1m', 0) > 0 else '#dc3545'
        data['tech_perf_3m_color'] = '#28a745' if technical.get('perf_3m', 0) > 0 else '#dc3545'
        data['tech_perf_6m_color'] = '#28a745' if technical.get('perf_6m', 0) > 0 else '#dc3545'
        data['tech_perf_1y_color'] = '#28a745' if technical.get('perf_1y', 0) > 0 else '#dc3545'

        # Volatility
        volatility = technical.get('volatility', 0)
        data['tech_volatility'] = format_number(volatility, 1)
        data['tech_volatility_status'] = 'bad' if volatility > 40 else 'warning' if volatility > 25 else 'good'
        data['tech_volatility_label'] = 'High' if volatility > 40 else 'Moderate' if volatility > 25 else 'Low'

    return data

def generate_pdf_report(json_file, output_pdf=None):
    """Generate PDF report from JSON data"""
    # Check for WeasyPrint
    has_weasyprint = False
    try:
        from weasyprint import HTML, CSS
        has_weasyprint = True
    except (ImportError, OSError) as e:
        if 'pango' in str(e).lower() or 'cairo' in str(e).lower():
            print("⚠️  WeasyPrint requires system libraries (Pango, Cairo)")
            print("   On macOS, install with: brew install pango cairo")
            print("   Falling back to HTML output only.")
        else:
            print("⚠️  WeasyPrint not available. Install with: pip install weasyprint")
            print("   Falling back to HTML output only.")

    try:
        # Load JSON data
        with open(json_file, 'r') as f:
            json_data = json.load(f)

        # Load template
        template_path = Path(__file__).parent / 'report_template.html'
        with open(template_path, 'r') as f:
            template_content = f.read()

        # Extract and format data
        template_data = extract_template_data(json_data)

        # Render template
        template = Template(template_content)
        html_content = template.render(**template_data)

        # Generate output filename
        if output_pdf is None:
            symbol = json_data.get('symbol', 'UNKNOWN')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_pdf = f"investment_report_{symbol}_{timestamp}.pdf"

        # Generate HTML file
        html_file = output_pdf.replace('.pdf', '.html')
        with open(html_file, 'w') as f:
            f.write(html_content)
        print(f"✅ HTML report generated: {html_file}")

        # Generate PDF if WeasyPrint is available
        if has_weasyprint:
            try:
                from weasyprint import HTML, CSS
                HTML(string=html_content).write_pdf(output_pdf)
                print(f"✅ PDF report generated: {output_pdf}")
                return output_pdf
            except Exception as pdf_error:
                print(f"⚠️  PDF generation failed: {pdf_error}")
                print(f"ℹ️  HTML file is available. Open {html_file} in a browser and use Print to PDF")
                return html_file
        else:
            print(f"ℹ️  Open {html_file} in a browser and use Print to PDF")
            return html_file

    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python generate_pdf_report.py <json_file> [output_pdf]")
        print("Example: python generate_pdf_report.py enhanced_report_v2_HDFCBANK_20251029.json")
        sys.exit(1)

    json_file = sys.argv[1]
    output_pdf = sys.argv[2] if len(sys.argv) > 2 else None

    if not Path(json_file).exists():
        print(f"❌ JSON file not found: {json_file}")
        sys.exit(1)

    print(f"📄 Generating PDF report from: {json_file}")
    result = generate_pdf_report(json_file, output_pdf)

    if result:
        print(f"\n✅ Report generation complete!")
    else:
        print(f"\n❌ Report generation failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
