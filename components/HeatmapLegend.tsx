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
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: "#4B5563" }}>Good</Text>
        <View style={{ flexDirection: "row", flex: 1, marginHorizontal: 8, height: 8, borderRadius: 9999, overflow: "hidden" }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,200,0,0.4)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,215,0,0.4)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,140,0,0.4)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,0,0,0.4)" }} />
        </View>
        <Text style={{ fontSize: 12, color: "#4B5563" }}>Severe</Text>
      </View>
      <Text style={{ fontSize: 12, color: "#6B7280" }}>{label}</Text>
    </View>
  );
}
