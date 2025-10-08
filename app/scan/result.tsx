import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getScan } from "../../src/lib/scan";

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setRow(await getScan(id!)); }
      catch (e: any) { setErr(e.message ?? String(e)); }
    })();
  }, [id]);

  if (err) return <View className="flex-1 items-center justify-center"><Text>{err}</Text></View>;
  if (!row) return <View className="flex-1 items-center justify-center"><Text>Loading…</Text></View>;

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-semibold mb-4">Your Results</Text>

      <View className="mb-6">
        <Text>Skin Score: {row.skin_score ?? "—"}/100</Text>
        <Text>Potential: {row.skin_potential ?? "—"}/100</Text>
        <Text>Health: {row.skin_health_percent ?? "—"}%</Text>
        <Text>Type: {row.skin_type}</Text>
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">Conditions</Text>
        <Text>Breakouts: {row.breakout_level}</Text>
        <Text>Acne-prone: {row.acne_prone_level}</Text>
        <Text>Scarring: {row.scarring_level}</Text>
        <Text>Redness: {row.redness_percent ?? "—"}%</Text>
        <Text>Razor burn: {row.razor_burn_level}</Text>
        <Text>Blackheads: {row.blackheads_level}{row.blackheads_estimated_count != null ? ` (~${row.blackheads_estimated_count})` : ""}</Text>
        <Text>Oiliness: {row.oiliness_percent ?? "—"}%</Text>
        <Text>Pore health: {row.pore_health ?? "—"}/100</Text>
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">AM Routine</Text>
        {(row.am_routine ?? []).map((s: any, i: number) => <Text key={i}>{s.step}. {s.what} — {s.why}</Text>)}
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">PM Routine</Text>
        {(row.pm_routine ?? []).map((s: any, i: number) => <Text key={i}>{s.step}. {s.what} — {s.why}</Text>)}
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">Products</Text>
        {(row.products ?? []).map((p: any, i: number) => <Text key={i}>• {p.name} ({p.type}) — {p.reason}</Text>)}
      </View>
    </ScrollView>
  );
}
