import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getScan } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import HeatmapOverlay from "../../components/HeatmapOverlay";
import HeatmapLegend from "../../components/HeatmapLegend";
import { TrendingUp, AlertCircle, MapPin, Sun, Moon, Package, ArrowLeft } from "lucide-react-native";

type Mode = "breakouts" | "oiliness" | "dryness" | "redness";
const MODES: Mode[] = ["breakouts", "oiliness", "dryness", "redness"];

type PhotoView = "front" | "left" | "right";
const PHOTO_VIEWS: PhotoView[] = ["front", "left", "right"];
const PHOTO_LABELS: Record<PhotoView, string> = {
  front: "Front",
  left: "Left",
  right: "Right"
};

// Helper: request signed URLs for all 3 photos from your Edge Function
async function signPhotoPaths(paths: { front?: string | null; left?: string | null; right?: string | null }) {
  const pathsToSign = [paths.front, paths.left, paths.right].filter(Boolean) as string[];
  if (pathsToSign.length === 0) return { front: null, left: null, right: null };
  
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sign-storage-urls`;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ paths: pathsToSign }),
  });
  
  if (!res.ok) return { front: null, left: null, right: null };
  const json = await res.json();
  const results = json?.results ?? [];
  
  return {
    front: paths.front ? results[0]?.url ?? null : null,
    left: paths.left ? results[1]?.url ?? null : null,
    right: paths.right ? results[2]?.url ?? null : null,
  };
}

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{ front: string | null; left: string | null; right: string | null }>({ 
    front: null, 
    left: null, 
    right: null 
  });
  const [mode, setMode] = useState<Mode>("breakouts");
  const [photoView, setPhotoView] = useState<PhotoView>("front");

  useEffect(() => {
    (async () => {
      try {
        const r = await getScan(id!);
        setRow(r);
        const urls = await signPhotoPaths({
          front: r.front_path,
          left: r.left_path,
          right: r.right_path
        });
        setPhotoUrls(urls);
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
        {/* Back Button */}
        <Pressable
          onPress={() => router.push("/(tabs)/history")}
          className="flex-row items-center mb-4 active:opacity-60"
          android_ripple={{ color: "#10B98120" }}
        >
          <ArrowLeft size={24} color="#10B981" strokeWidth={2.5} />
          <Text className="text-emerald-600 font-semibold text-base ml-1">Back</Text>
        </Pressable>

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
        {(photoUrls.front || photoUrls.left || photoUrls.right) && row?.overlays && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <MapPin size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Heatmaps</Text>
            </View>
            
            {/* Heatmap Mode Filter (Breakouts, Oiliness, etc.) */}
            <View className="flex-row gap-1.5 mb-3">
              {MODES.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`flex-1 px-2 py-2.5 rounded-xl ${mode === m ? "bg-emerald-500" : "bg-gray-100"}`}
                  android_ripple={{ color: "#10B98120" }}
                >
                  <Text className={`text-xs font-semibold text-center capitalize ${mode === m ? "text-white" : "text-gray-700"}`}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Photo View Selector (Front, Left, Right) */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
              {PHOTO_VIEWS.map((view) => (
                <Pressable
                  key={view}
                  onPress={() => setPhotoView(view)}
                  className={`flex-1 py-2 rounded-lg ${photoView === view ? "bg-white" : ""}`}
                  style={photoView === view ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                  } : undefined}
                  android_ripple={{ color: "#10B98120" }}
                >
                  <Text className={`text-sm font-semibold text-center ${photoView === view ? "text-emerald-600" : "text-gray-500"}`}>
                    {PHOTO_LABELS[view]}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Heatmap Overlay */}
            {photoUrls[photoView] && (
              <View className="rounded-2xl overflow-hidden mb-4">
                <HeatmapOverlay
                  photoUri={photoUrls[photoView]!}
                  overlays={row.overlays}
                  which={photoView}
                  mode={mode}
                />
              </View>
            )}
            
            {!photoUrls[photoView] && (
              <View className="bg-gray-50 p-8 rounded-2xl items-center mb-4">
                <Text className="text-gray-500 text-center">
                  {PHOTO_LABELS[photoView]} photo not available
                </Text>
              </View>
            )}
            
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
