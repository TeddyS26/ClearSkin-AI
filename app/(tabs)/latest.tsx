import { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { latestCompletedScan, signStoragePaths } from "../../src/lib/scan";

export default function Latest() {
  const [row, setRow] = useState<any>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const r = await latestCompletedScan();
        setRow(r);
        if (r?.front_path) {
          const map = await signStoragePaths([r.front_path]);
          setFrontUrl(map[r.front_path] ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator /></View>;
  if (!row) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg mb-2">No scans yet</Text>
        <Text className="text-gray-600 text-center mb-6">Start your first scan to see your latest results here.</Text>
        <Pressable onPress={() => router.push("/scan/capture")} className="bg-emerald-600 px-5 py-3 rounded-xl">
          <Text className="text-white font-semibold">Start a scan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-6" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="text-2xl font-semibold mb-4">Latest Result</Text>

      {frontUrl && (
        <Image source={{ uri: frontUrl }} style={{ width: "100%", height: 260, borderRadius: 16, marginBottom: 14 }} />
      )}

      <View className="mb-6">
        <Text>Skin Score: {row.skin_score ?? "—"}/100</Text>
        <Text>Potential: {row.skin_potential ?? "—"}/100</Text>
        <Text>Health: {row.skin_health_percent ?? "—"}%</Text>
        <Text>Type: {row.skin_type ?? "unknown"}</Text>
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">Conditions</Text>
        <Text>Breakouts: {row.breakout_level}</Text>
        <Text>Acne-prone: {row.acne_prone_level}</Text>
        <Text>Redness: {row.redness_percent ?? "—"}%</Text>
        <Text>Oiliness: {row.oiliness_percent ?? "—"}%</Text>
        <Text>Pore health: {row.pore_health ?? "—"}/100</Text>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: "/scan/result", params: { id: row.id } })}
        className="bg-black py-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">Open full report</Text>
      </Pressable>
    </ScrollView>
  );
}
