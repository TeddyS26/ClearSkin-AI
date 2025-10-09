import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getScan } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import HeatmapOverlay from "../../components/HeatmapOverlay";
import HeatmapLegend from "../../components/HeatmapLegend";

type Mode = "breakouts" | "oiliness" | "dryness" | "redness";
const MODES: Mode[] = ["breakouts", "oiliness", "dryness", "redness"];

// Helper: request a signed URL for the front photo from your Edge Function
async function signFrontPath(frontPath?: string | null) {
  if (!frontPath) return null;
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sign-storage-urls`;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ paths: [frontPath] }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.results?.[0]?.url ?? null;
}

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("breakouts");

  useEffect(() => {
    (async () => {
      try {
        const r = await getScan(id!);
        setRow(r);
        const signed = await signFrontPath(r.front_path);
        setFrontUrl(signed);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, [id]);

  if (err) return <View className="flex-1 items-center justify-center"><Text>{err}</Text></View>;
  if (!row) return <View className="flex-1 items-center justify-center"><Text>Loading…</Text></View>;

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-semibold mb-4">Your Results</Text>

      {/* Overview */}
      <View className="mb-6">
        <Text>Skin Score: {row.skin_score ?? "—"}/100</Text>
        <Text>Potential: {row.skin_potential ?? "—"}/100</Text>
        <Text>Health: {row.skin_health_percent ?? "—"}%</Text>
        <Text>Type: {row.skin_type}</Text>
      </View>

      {/* Conditions */}
      <View className="mb-6">
        <Text className="font-semibold mb-2">Conditions</Text>
        <Text>Breakouts: {row.breakout_level}</Text>
        <Text>Acne-prone: {row.acne_prone_level}</Text>
        <Text>Scarring: {row.scarring_level}</Text>
        <Text>Redness: {row.redness_percent ?? "—"}%</Text>
        <Text>Razor burn: {row.razor_burn_level}</Text>
        <Text>
          Blackheads: {row.blackheads_level}
          {row.blackheads_estimated_count != null ? ` (~${row.blackheads_estimated_count})` : ""}
        </Text>
        <Text>Oiliness: {row.oiliness_percent ?? "—"}%</Text>
        <Text>Pore health: {row.pore_health ?? "—"}/100</Text>
      </View>

      {/* Heatmaps (NEW) */}
      {frontUrl && row?.region_scores && (
        <View className="mb-8">
          <Text className="text-xl font-semibold mb-3">Heatmaps</Text>
          <View className="flex-row gap-2 mb-3">
            {MODES.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={`px-3 py-2 rounded-full ${mode === m ? "bg-emerald-600" : "bg-gray-200"}`}
              >
                <Text className={`${mode === m ? "text-white" : "text-gray-800"}`}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <HeatmapOverlay
            photoUri={frontUrl}
            overlays={row.overlays}
            which="front"
            mode={mode}
          />
          <HeatmapLegend mode={mode} />
        </View>
      )}

      {/* Watchlist areas (if any) */}
      {Array.isArray(row.watchlist_areas) && row.watchlist_areas.length > 0 && (
        <View className="mb-8">
          <Text className="text-xl font-semibold mb-2">Watchlist</Text>
          {row.watchlist_areas.map((w: any, i: number) => (
            <View key={i} className="mb-2">
              <Text>• {w.area}: {w.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AM / PM Routines */}
      <View className="mb-6">
        <Text className="font-semibold mb-2">AM Routine</Text>
        {(row.am_routine ?? []).map((s: any, i: number) => (
          <Text key={i}>{s.step}. {s.what} — {s.why}</Text>
        ))}
      </View>

      <View className="mb-6">
        <Text className="font-semibold mb-2">PM Routine</Text>
        {(row.pm_routine ?? []).map((s: any, i: number) => (
          <Text key={i}>{s.step}. {s.what} — {s.why}</Text>
        ))}
      </View>

      {/* Products */}
      <View className="mb-12">
        <Text className="font-semibold mb-2">Products</Text>
        {(row.products ?? []).map((p: any, i: number) => (
          <Text key={i}>• {p.name} ({p.type}) — {p.reason}</Text>
        ))}
      </View>
    </ScrollView>
  );
}
