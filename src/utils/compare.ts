/**
 * Utilities for computing and displaying deltas between two scan sessions.
 * Handles polarity (fields where higher is better vs. lower is better).
 */

/**
 * Polarity map: defines whether higher or lower is better for each numeric field.
 * 'higher_better': larger value = improvement
 * 'lower_better': smaller value = improvement
 */
export const FIELD_POLARITY: Record<string, 'higher_better' | 'lower_better'> = {
  skin_score: 'higher_better',
  skin_potential: 'higher_better',
  skin_health_percent: 'higher_better',
  skin_age: 'lower_better',
  skin_age_confidence: 'higher_better',
  redness_percent: 'lower_better',
  oiliness_percent: 'lower_better',
  pore_health: 'higher_better',
  blackheads_estimated_count: 'lower_better',
};

export interface DeltaResult {
  value: number; // Absolute difference (always positive)
  direction: 'up' | 'down' | 'neutral'; // Movement direction
  isPositive: boolean; // True if this represents an improvement
}

/**
 * Compute the delta between two numeric values, accounting for field polarity.
 * Returns null if either value is null.
 * 
 * @param before The earlier/baseline value
 * @param after The later/current value
 * @param field The field name (used to look up polarity)
 * @returns Delta result with value, direction, and whether it's positive (improvement)
 */
export function computeNumericDelta(
  before: number | null,
  after: number | null,
  field: string
): DeltaResult | null {
  if (before === null || after === null) {
    return null;
  }

  const polarity = FIELD_POLARITY[field] || 'higher_better';
  const diff = after - before;
  const absDiff = Math.abs(diff);

  // Determine if this is an improvement
  let isPositive = false;
  if (polarity === 'higher_better') {
    isPositive = diff > 0;
  } else {
    // lower_better: improvement is when diff < 0 (value decreased)
    isPositive = diff < 0;
  }

  // Determine direction based on raw difference
  let direction: 'up' | 'down' | 'neutral';
  if (diff > 0) direction = 'up';
  else if (diff < 0) direction = 'down';
  else direction = 'neutral';

  return {
    value: absDiff,
    direction,
    isPositive,
  };
}

/**
 * Format a delta result as a display string.
 * Returns signed string like "+13", "-5", "0".
 * 
 * @param delta The delta result from computeNumericDelta
 * @returns Formatted string with sign
 */
export function formatDelta(delta: DeltaResult | null): string {
  if (!delta) return '';
  if (delta.direction === 'neutral') return '0';
  const sign = delta.direction === 'up' ? '+' : '-';
  return `${sign}${delta.value}`;
}

/**
 * Determine if a delta represents an improvement.
 * Accounts for field polarity (e.g., lower skin_age is better).
 * 
 * @param delta The delta result
 * @returns True if the delta is positive (improvement)
 */
export function isDeltaPositive(delta: DeltaResult | null): boolean {
  return delta?.isPositive ?? false;
}
