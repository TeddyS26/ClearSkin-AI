import { View, Text } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { computeNumericDelta, formatDelta } from '../utils/compare';

interface DeltaBadgeProps {
  before: number | null;
  after: number | null;
  field: string;
}

/**
 * Displays a colored delta badge showing improvement or regression.
 * Returns null if either value is null.
 * 
 * - Green background + ↑ = improvement (advancement in the right direction)
 * - Red background + ↓ = regression (movement in wrong direction)
 * - Gray background + no icon = no change (0 delta or neutral)
 * 
 * @component
 */
export default function DeltaBadge({ before, after, field }: DeltaBadgeProps) {
  const delta = computeNumericDelta(before, after, field);

  if (!delta) {
    return null;
  }

  const deltaStr = formatDelta(delta);
  const isPositive = delta.isPositive;
  const isNeutral = delta.direction === 'neutral';

  // Determine colors: green for improvement, red for regression, gray for neutral
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-600';
  let iconColor = '#4B5563';

  if (!isNeutral) {
    if (isPositive) {
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-700';
      iconColor = '#10B981';
    } else {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      iconColor = '#EF4444';
    }
  }

  return (
    <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-lg ${bgColor}`}>
      {!isNeutral && (
        <>
          {isPositive ? (
            <ArrowUp size={14} color={iconColor} strokeWidth={2.5} />
          ) : (
            <ArrowDown size={14} color={iconColor} strokeWidth={2.5} />
          )}
        </>
      )}
      <Text className={`text-xs font-semibold ${textColor}`}>
        {deltaStr}
      </Text>
    </View>
  );
}
