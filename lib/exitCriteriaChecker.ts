/**
 * Exit Criteria Checker
 * Helper functions to check if exit criteria are met for a position
 */

export interface ExitCriteria {
  exitBelow50EMA?: boolean;
  exitBelowPrice?: number | null;
  exitAtStopLoss?: boolean;
  exitAtTarget?: boolean;
  customNote?: string;
}

export interface PortfolioPosition {
  symbol: string;
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  exitCriteria?: ExitCriteria;
}

export interface ExitAlert {
  shouldExit: boolean;
  reasons: string[];
  criticalLevel: 'warning' | 'alert' | 'critical';
}

/**
 * Check if any exit criteria are met for a position
 */
export function checkExitCriteria(
  position: PortfolioPosition,
  ema50Value?: number
): ExitAlert {
  const reasons: string[] = [];
  let criticalLevel: 'warning' | 'alert' | 'critical' = 'warning';

  if (!position.exitCriteria) {
    return { shouldExit: false, reasons: [], criticalLevel: 'warning' };
  }

  const { exitCriteria, currentPrice, stopLoss, target1 } = position;

  // Check if stop loss is hit (most critical)
  if (exitCriteria.exitAtStopLoss && currentPrice <= stopLoss) {
    reasons.push(`Stop loss hit at ₹${stopLoss}`);
    criticalLevel = 'critical';
  }

  // Check if price is below 50 EMA
  if (exitCriteria.exitBelow50EMA && ema50Value && currentPrice < ema50Value) {
    reasons.push(`Price below 50 EMA (₹${ema50Value.toFixed(2)})`);
    if (criticalLevel === 'warning') criticalLevel = 'alert';
  }

  // Check if price is below custom exit price
  if (
    exitCriteria.exitBelowPrice &&
    exitCriteria.exitBelowPrice > 0 &&
    currentPrice < exitCriteria.exitBelowPrice
  ) {
    reasons.push(`Price below exit level ₹${exitCriteria.exitBelowPrice}`);
    if (criticalLevel === 'warning') criticalLevel = 'alert';
  }

  // Check if target is reached
  if (exitCriteria.exitAtTarget && currentPrice >= target1) {
    reasons.push(`Target reached at ₹${target1}`);
    if (criticalLevel === 'warning') criticalLevel = 'alert';
  }

  return {
    shouldExit: reasons.length > 0,
    reasons,
    criticalLevel,
  };
}

/**
 * Get exit criteria summary as readable text
 */
export function getExitCriteriaSummary(exitCriteria: ExitCriteria): string[] {
  const summary: string[] = [];

  if (exitCriteria.exitBelow50EMA) {
    summary.push('Exit if price goes below 50 EMA');
  }

  if (exitCriteria.exitBelowPrice) {
    summary.push(`Exit if price goes below ₹${exitCriteria.exitBelowPrice}`);
  }

  if (exitCriteria.exitAtStopLoss) {
    summary.push('Exit if stop loss is hit');
  }

  if (exitCriteria.exitAtTarget) {
    summary.push('Exit if target is reached');
  }

  if (exitCriteria.customNote) {
    summary.push(exitCriteria.customNote);
  }

  return summary;
}

/**
 * Check if position is approaching exit criteria (within 2% threshold)
 */
export function isApproachingExitCriteria(
  position: PortfolioPosition,
  ema50Value?: number
): { approaching: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!position.exitCriteria) {
    return { approaching: false, warnings: [] };
  }

  const { exitCriteria, currentPrice, stopLoss, target1 } = position;
  const threshold = 0.02; // 2% threshold

  // Approaching stop loss
  if (exitCriteria.exitAtStopLoss) {
    const distanceToSL = ((currentPrice - stopLoss) / stopLoss) * 100;
    if (distanceToSL <= 5 && distanceToSL > 0) {
      warnings.push(`Approaching stop loss (${distanceToSL.toFixed(1)}% away)`);
    }
  }

  // Approaching 50 EMA
  if (exitCriteria.exitBelow50EMA && ema50Value) {
    const distanceToEMA = ((currentPrice - ema50Value) / ema50Value) * 100;
    if (distanceToEMA <= 2 && distanceToEMA > 0) {
      warnings.push(`Approaching 50 EMA (${distanceToEMA.toFixed(1)}% away)`);
    }
  }

  // Approaching custom exit price
  if (exitCriteria.exitBelowPrice && exitCriteria.exitBelowPrice > 0) {
    const distanceToExit =
      ((currentPrice - exitCriteria.exitBelowPrice) / exitCriteria.exitBelowPrice) * 100;
    if (distanceToExit <= 2 && distanceToExit > 0) {
      warnings.push(`Approaching exit level (${distanceToExit.toFixed(1)}% away)`);
    }
  }

  // Approaching target
  if (exitCriteria.exitAtTarget) {
    const distanceToTarget = ((target1 - currentPrice) / currentPrice) * 100;
    if (distanceToTarget <= 2 && distanceToTarget > 0) {
      warnings.push(`Approaching target (${distanceToTarget.toFixed(1)}% away)`);
    }
  }

  return {
    approaching: warnings.length > 0,
    warnings,
  };
}
