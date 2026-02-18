import { computeNumericDelta, formatDelta, isDeltaPositive, FIELD_POLARITY } from '../compare';

describe('computeNumericDelta', () => {
  describe('higher_better fields', () => {
    it('should return positive delta with isPositive=true when value increases', () => {
      const delta = computeNumericDelta(72, 85, 'skin_score');
      expect(delta).not.toBeNull();
      expect(delta?.value).toBe(13);
      expect(delta?.direction).toBe('up');
      expect(delta?.isPositive).toBe(true);
    });

    it('should return negative delta with isPositive=false when value decreases', () => {
      const delta = computeNumericDelta(85, 72, 'skin_score');
      expect(delta).not.toBeNull();
      expect(delta?.value).toBe(13);
      expect(delta?.direction).toBe('down');
      expect(delta?.isPositive).toBe(false);
    });

    it('should handle zero delta', () => {
      const delta = computeNumericDelta(75, 75, 'skin_potential');
      expect(delta).not.toBeNull();
      expect(delta?.value).toBe(0);
      expect(delta?.direction).toBe('neutral');
      expect(delta?.isPositive).toBe(false);
    });

    it('should handle edge value 100', () => {
      const delta = computeNumericDelta(90, 100, 'skin_health_percent');
      expect(delta?.value).toBe(10);
      expect(delta?.isPositive).toBe(true);
    });

    it('should handle edge value 0', () => {
      const delta = computeNumericDelta(10, 0, 'skin_potential');
      expect(delta?.value).toBe(10);
      expect(delta?.direction).toBe('down');
      expect(delta?.isPositive).toBe(false);
    });
  });

  describe('lower_better fields', () => {
    it('should return isPositive=true when skin_age decreases (improvement)', () => {
      const delta = computeNumericDelta(32, 28, 'skin_age');
      expect(delta).not.toBeNull();
      expect(delta?.value).toBe(4);
      expect(delta?.direction).toBe('down');
      expect(delta?.isPositive).toBe(true);
    });

    it('should return isPositive=false when skin_age increases (regression)', () => {
      const delta = computeNumericDelta(28, 32, 'skin_age');
      expect(delta).not.toBeNull();
      expect(delta?.value).toBe(4);
      expect(delta?.direction).toBe('up');
      expect(delta?.isPositive).toBe(false);
    });

    it('should handle redness_percent decrease (improvement)', () => {
      const delta = computeNumericDelta(45, 30, 'redness_percent');
      expect(delta?.isPositive).toBe(true);
      expect(delta?.direction).toBe('down');
    });

    it('should handle oiliness_percent decrease (improvement)', () => {
      const delta = computeNumericDelta(65, 55, 'oiliness_percent');
      expect(delta?.isPositive).toBe(true);
      expect(delta?.direction).toBe('down');
    });

    it('should handle blackheads_estimated_count decrease (improvement)', () => {
      const delta = computeNumericDelta(47, 23, 'blackheads_estimated_count');
      expect(delta?.isPositive).toBe(true);
      expect(delta?.value).toBe(24);
    });
  });

  describe('null handling', () => {
    it('should return null if before is null', () => {
      const delta = computeNumericDelta(null, 80, 'skin_score');
      expect(delta).toBeNull();
    });

    it('should return null if after is null', () => {
      const delta = computeNumericDelta(75, null, 'skin_score');
      expect(delta).toBeNull();
    });

    it('should return null if both are null', () => {
      const delta = computeNumericDelta(null, null, 'skin_score');
      expect(delta).toBeNull();
    });
  });

  describe('unknown fields', () => {
    it('should default to higher_better polarity for unknown fields', () => {
      const delta = computeNumericDelta(50, 60, 'unknown_field');
      expect(delta?.isPositive).toBe(true);
      expect(delta?.direction).toBe('up');
    });
  });
});

describe('formatDelta', () => {
  it('should format positive delta with + sign', () => {
    const delta = computeNumericDelta(72, 85, 'skin_score');
    expect(formatDelta(delta)).toBe('+13');
  });

  it('should format negative delta with - sign', () => {
    const delta = computeNumericDelta(85, 72, 'skin_score');
    expect(formatDelta(delta)).toBe('-13');
  });

  it('should format zero delta as "0"', () => {
    const delta = computeNumericDelta(75, 75, 'skin_score');
    expect(formatDelta(delta)).toBe('0');
  });

  it('should handle null delta', () => {
    expect(formatDelta(null)).toBe('');
  });

  it('should handle single digit delta', () => {
    const delta = computeNumericDelta(32, 28, 'skin_age');
    expect(formatDelta(delta)).toBe('-4');
  });
});

describe('isDeltaPositive', () => {
  it('should return true for improvement', () => {
    const delta = computeNumericDelta(72, 85, 'skin_score');
    expect(isDeltaPositive(delta)).toBe(true);
  });

  it('should return false for regression', () => {
    const delta = computeNumericDelta(85, 72, 'skin_score');
    expect(isDeltaPositive(delta)).toBe(false);
  });

  it('should return false for null delta', () => {
    expect(isDeltaPositive(null)).toBe(false);
  });

  it('should correctly evaluate inverted-polarity improvement', () => {
    const delta = computeNumericDelta(32, 28, 'skin_age');
    expect(isDeltaPositive(delta)).toBe(true);
  });
});

describe('FIELD_POLARITY', () => {
  it('should define polarity for all delta-comparable fields', () => {
    expect(FIELD_POLARITY.skin_score).toBe('higher_better');
    expect(FIELD_POLARITY.skin_potential).toBe('higher_better');
    expect(FIELD_POLARITY.skin_health_percent).toBe('higher_better');
    expect(FIELD_POLARITY.skin_age).toBe('lower_better');
    expect(FIELD_POLARITY.skin_age_confidence).toBe('higher_better');
    expect(FIELD_POLARITY.redness_percent).toBe('lower_better');
    expect(FIELD_POLARITY.oiliness_percent).toBe('lower_better');
    expect(FIELD_POLARITY.pore_health).toBe('higher_better');
    expect(FIELD_POLARITY.blackheads_estimated_count).toBe('lower_better');
  });
});
