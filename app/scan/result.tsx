import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getScan } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import HeatmapOverlay from "../../components/HeatmapOverlay";
import HeatmapLegend from "../../components/HeatmapLegend";
import { TrendingUp, AlertCircle, MapPin, Sun, Moon, Package } from "lucide-react-native";

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

  if (err) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-emerald-50 p-6" edges={["top"]}>
        <Text className="text-lg text-red-600 text-center">{err}</Text>
      </SafeAreaView>
    );
  }
  
  if (!row) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-emerald-50" edges={["top"]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-base text-gray-600 mt-4">Loading results...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Your Results</Text>
        <Text className="text-sm text-gray-600 mb-6">Complete skin analysis and recommendations</Text>

        {/* Overview Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View style={{ marginRight: 8 }}>
              <TrendingUp size={24} color="#10B981" strokeWidth={2} />
            </View>
            <Text className="text-xl font-bold text-gray-900">Overview</Text>
          </View>
          
          <View className="gap-3">
            <View className="flex-row items-center justify-between bg-emerald-50 p-4 rounded-2xl">
              <Text className="text-base text-gray-700 font-medium">Skin Score</Text>
              <Text className="text-2xl font-bold text-emerald-600">{row.skin_score ?? "—"}/100</Text>
            </View>
            
            <View className="flex-row gap-3">
              <View className="flex-1 bg-gray-50 p-4 rounded-2xl">
                <Text className="text-sm text-gray-600 mb-1">Potential</Text>
                <Text className="text-xl font-bold text-gray-900">{row.skin_potential ?? "—"}/100</Text>
              </View>
              <View className="flex-1 bg-gray-50 p-4 rounded-2xl">
                <Text className="text-sm text-gray-600 mb-1">Health</Text>
                <Text className="text-xl font-bold text-gray-900">{row.skin_health_percent ?? "—"}%</Text>
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-2xl">
              <Text className="text-sm text-gray-600 mb-1">Skin Type</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{row.skin_type ?? "unknown"}</Text>
            </View>
          </View>
        </View>

        {/* Conditions Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View style={{ marginRight: 8 }}>
              <AlertCircle size={24} color="#10B981" strokeWidth={2} />
            </View>
            <Text className="text-xl font-bold text-gray-900">Conditions</Text>
          </View>
          
          <View className="gap-2">
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Breakouts</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{row.breakout_level}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Acne-prone</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{row.acne_prone_level}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Scarring</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{row.scarring_level}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Redness</Text>
              <Text className="text-base font-semibold text-gray-900">{row.redness_percent ?? "—"}%</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Razor Burn</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{row.razor_burn_level}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Blackheads</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">
                {row.blackheads_level}
                {row.blackheads_estimated_count != null ? ` (~${row.blackheads_estimated_count})` : ""}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-base text-gray-700">Oiliness</Text>
              <Text className="text-base font-semibold text-gray-900">{row.oiliness_percent ?? "—"}%</Text>
            </View>
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base text-gray-700">Pore Health</Text>
              <Text className="text-base font-semibold text-gray-900">{row.pore_health ?? "—"}/100</Text>
            </View>
          </View>
        </View>

        {/* Heatmaps */}
        {frontUrl && row?.overlays && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <MapPin size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Heatmaps</Text>
            </View>
            
            <View className="flex-row flex-wrap gap-2 mb-4">
              {MODES.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`px-4 py-2 rounded-full ${mode === m ? "bg-emerald-500" : "bg-gray-100"}`}
                  android_ripple={{ color: "#10B98120" }}
                >
                  <Text className={`text-sm font-semibold capitalize ${mode === m ? "text-white" : "text-gray-700"}`}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View className="rounded-2xl overflow-hidden mb-4">
              <HeatmapOverlay
                photoUri={frontUrl}
                overlays={row.overlays}
                which="front"
                mode={mode}
              />
            </View>
            
            <HeatmapLegend mode={mode} />
          </View>
        )}

        {/* Watchlist */}
        {Array.isArray(row.watchlist_areas) && row.watchlist_areas.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <AlertCircle size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Watchlist</Text>
            </View>
            
            <View className="gap-3">
              {row.watchlist_areas.map((w: any, i: number) => (
                <View key={i} className="bg-amber-50 p-4 rounded-2xl">
                  <Text className="text-base font-semibold text-gray-900 mb-1">{w.area}</Text>
                  <Text className="text-sm text-gray-600">{w.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AM Routine */}
        {row.am_routine && row.am_routine.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <Sun size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Morning Routine</Text>
            </View>
            
            <View className="gap-4">
              {row.am_routine.map((s: any, i: number) => (
                <View key={i} className="flex-row">
                  <View className="bg-emerald-100 w-8 h-8 rounded-full items-center justify-center mt-0.5" style={{ marginRight: 12 }}>
                    <Text className="text-emerald-700 font-bold text-sm">{s.step}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">{s.what}</Text>
                    <Text className="text-sm text-gray-600 leading-5">{s.why}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PM Routine */}
        {row.pm_routine && row.pm_routine.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <Moon size={24} color="#6366F1" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Evening Routine</Text>
            </View>
            
            <View className="gap-4">
              {row.pm_routine.map((s: any, i: number) => (
                <View key={i} className="flex-row">
                  <View className="bg-emerald-100 w-8 h-8 rounded-full items-center justify-center mt-0.5" style={{ marginRight: 12 }}>
                    <Text className="text-emerald-700 font-bold text-sm">{s.step}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">{s.what}</Text>
                    <Text className="text-sm text-gray-600 leading-5">{s.why}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Products */}
        {row.products && row.products.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <Package size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Recommended Products</Text>
            </View>
            
            <View className="gap-3">
              {row.products.map((p: any, i: number) => (
                <View key={i} className="bg-gray-50 p-4 rounded-2xl">
                  <Text className="text-base font-semibold text-gray-900 mb-1">{p.name}</Text>
                  <Text className="text-xs text-emerald-600 font-medium mb-2 uppercase">{p.type}</Text>
                  <Text className="text-sm text-gray-600 leading-5">{p.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
