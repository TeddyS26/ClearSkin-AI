import { View, Text } from "react-native";

export default function HeatmapLegend({ mode }: { mode: "breakouts"|"oiliness"|"dryness"|"redness" }) {
  const label = (() => {
    switch (mode) {
      case "breakouts": return "Green = clear, Red = more breakouts";
      case "oiliness":  return "Green = less oily, Red = very oily";
      case "dryness":   return "Green = hydrated, Red = very dry";
      case "redness":   return "Green = low redness, Red = high redness";
    }
  })();

  return (
    <View className="mt-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-600 font-medium">Good</Text>
        <View className="flex-row flex-1 mx-2 h-2 rounded-full overflow-hidden">
          <View className="flex-1" style={{ backgroundColor: "rgba(0,200,0,0.5)" }} />
          <View className="flex-1" style={{ backgroundColor: "rgba(255,215,0,0.5)" }} />
          <View className="flex-1" style={{ backgroundColor: "rgba(255,140,0,0.5)" }} />
          <View className="flex-1" style={{ backgroundColor: "rgba(255,0,0,0.5)" }} />
        </View>
        <Text className="text-xs text-gray-600 font-medium">Severe</Text>
      </View>
      <Text className="text-xs text-gray-500 text-center">{label}</Text>
    </View>
  );
}
