import React from 'react';
import { render } from '@testing-library/react-native';
import DeltaBadge from '../DeltaBadge';

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
}));

describe('DeltaBadge', () => {
  describe('positive deltas', () => {
    it('should render green badge with up arrow for improvement', () => {
      const { getByText } = render(
        <DeltaBadge before={72} after={85} field="skin_score" />
      );
      
      // Check that +13 is displayed
      expect(getByText('+13')).toBeTruthy();
    });

    it('should render green badge for skin_potential improvement', () => {
      const { getByText } = render(
        <DeltaBadge before={80} after={92} field="skin_potential" />
      );
      
      expect(getByText('+12')).toBeTruthy();
    });

    it('should render green badge for skin_health_percent improvement', () => {
      const { getByText } = render(
        <DeltaBadge before={60} after={75} field="skin_health_percent" />
      );
      
      expect(getByText('+15')).toBeTruthy();
    });
  });

  describe('negative deltas (regressions)', () => {
    it('should render red badge with down arrow for regression', () => {
      const { getByText } = render(
        <DeltaBadge before={85} after={72} field="skin_score" />
      );
      
      expect(getByText('-13')).toBeTruthy();
    });

    it('should render red badge for skin_potential regression', () => {
      const { getByText } = render(
        <DeltaBadge before={92} after={80} field="skin_potential" />
      );
      
      expect(getByText('-12')).toBeTruthy();
    });
  });

  describe('neutral deltas (no change)', () => {
    it('should render gray badge for zero delta', () => {
      const { getByText } = render(
        <DeltaBadge before={75} after={75} field="skin_score" />
      );
      
      expect(getByText('0')).toBeTruthy();
    });
  });

  describe('inverted polarity fields (lower is better)', () => {
    it('should render green badge when skin_age decreases (improvement)', () => {
      const { getByText } = render(
        <DeltaBadge before={32} after={28} field="skin_age" />
      );
      
      expect(getByText('-4')).toBeTruthy();
    });

    it('should render red badge when skin_age increases (regression)', () => {
      const { getByText } = render(
        <DeltaBadge before={28} after={32} field="skin_age" />
      );
      
      expect(getByText('+4')).toBeTruthy();
    });

    it('should render green badge when redness_percent decreases (improvement)', () => {
      const { getByText } = render(
        <DeltaBadge before={45} after={30} field="redness_percent" />
      );
      
      expect(getByText('-15')).toBeTruthy();
    });

    it('should render red badge when oiliness_percent increases (regression)', () => {
      const { getByText } = render(
        <DeltaBadge before={55} after={65} field="oiliness_percent" />
      );
      
      expect(getByText('+10')).toBeTruthy();
    });

    it('should render green badge when blackheads decrease (improvement)', () => {
      const { getByText } = render(
        <DeltaBadge before={47} after={23} field="blackheads_estimated_count" />
      );
      
      expect(getByText('-24')).toBeTruthy();
    });
  });

  describe('null handling', () => {
    it('should return null if before is null', () => {
      const { queryByText } = render(
        <DeltaBadge before={null} after={85} field="skin_score" />
      );
      
      // No delta text should be rendered
      expect(queryByText(/[+-]?\d+|0/)).toBeNull();
    });

    it('should return null if after is null', () => {
      const { queryByText } = render(
        <DeltaBadge before={72} after={null} field="skin_score" />
      );
      
      // No delta text should be rendered
      expect(queryByText(/[+-]?\d+|0/)).toBeNull();
    });

    it('should return null if both are null', () => {
      const { queryByText } = render(
        <DeltaBadge before={null} after={null} field="skin_score" />
      );
      
      // No delta text should be rendered
      expect(queryByText(/[+-]?\d+|0/)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle large deltas', () => {
      const { getByText } = render(
        <DeltaBadge before={20} after={95} field="skin_score" />
      );
      
      expect(getByText('+75')).toBeTruthy();
    });

    it('should handle small deltas', () => {
      const { getByText } = render(
        <DeltaBadge before={75} after={76} field="skin_score" />
      );
      
      expect(getByText('+1')).toBeTruthy();
    });

    it('should handle edge value 0', () => {
      const { getByText } = render(
        <DeltaBadge before={10} after={0} field="pore_health" />
      );
      
      expect(getByText('-10')).toBeTruthy();
    });

    it('should handle edge value 100', () => {
      const { getByText } = render(
        <DeltaBadge before={90} after={100} field="skin_score" />
      );
      
      expect(getByText('+10')).toBeTruthy();
    });
  });
});
