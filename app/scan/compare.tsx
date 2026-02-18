import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getScan, signStoragePaths, fmtDate } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import HeatmapOverlay from "../../components/HeatmapOverlay";
import HeatmapLegend from "../../components/HeatmapLegend";
import DeltaBadge from "../../src/components/DeltaBadge";
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  MapPin,
  Sun,
  Moon,
  Package,
  Clock,
} from "lucide-react-native";

type Mode = "breakouts" | "oiliness" | "dryness" | "redness";
const MODES: Mode[] = ["breakouts", "oiliness", "dryness", "redness"];

type PhotoView = "front" | "left" | "right";
const PHOTO_VIEWS: PhotoView[] = ["front", "left", "right"];
const PHOTO_LABELS: Record<PhotoView, string> = {
  front: "Front",
  left: "Left",
  right: "Right",
};

type PhotoUrls = { front: string | null; left: string | null; right: string | null };

/** Sign up to 3 photo paths (front/left/right) for a single scan. */
async function signScanPhotos(scan: any): Promise<PhotoUrls> {
  const paths = [scan.front_path, scan.left_path, scan.right_path].filter(Boolean) as string[];
  if (!paths.length) return { front: null, left: null, right: null };

  const map = await signStoragePaths(paths);

  return {
    front: scan.front_path ? map[scan.front_path] ?? null : null,
    left: scan.left_path ? map[scan.left_path] ?? null : null,
    right: scan.right_path ? map[scan.right_path] ?? null : null,
  };
}

/** Side-by-side row for a single numeric field with delta badge. */
function NumericRow({
  label,
  beforeVal,
  afterVal,
  field,
  suffix = "",
}: {
  label: string;
  beforeVal: number | null;
  afterVal: number | null;
  field: string;
  suffix?: string;
}) {
  const fmt = (v: number | null) => (v !== null && v !== undefined ? `${v}${suffix}` : "—");

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1 items-start">
        <Text className="text-sm font-semibold text-gray-900">{fmt(beforeVal)}</Text>
      </View>
      <View className="flex-1 items-center gap-1">
        <Text className="text-xs text-gray-500">{label}</Text>
        <DeltaBadge before={beforeVal} after={afterVal} field={field} />
      </View>
      <View className="flex-1 items-end">
        <Text className="text-sm font-semibold text-gray-900">{fmt(afterVal)}</Text>
      </View>
    </View>
  );
}

/** Side-by-side row for a categorical field (no delta). */
function CatRow({
  label,
  beforeVal,
  afterVal,
}: {
  label: string;
  beforeVal: string | null;
  afterVal: string | null;
}) {
  const fmt = (v: string | null) =>
    v && v !== "unknown" ? v.charAt(0).toUpperCase() + v.slice(1) : "Unknown";

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1 items-start">
        <Text className="text-sm font-semibold text-gray-900 capitalize">{fmt(beforeVal)}</Text>
      </View>
      <View className="flex-1 items-center">
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      <View className="flex-1 items-end">
        <Text className="text-sm font-semibold text-gray-900 capitalize">{fmt(afterVal)}</Text>
      </View>
    </View>
  );
}

/** Section card wrapper. */
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
      <View className="flex-row items-center mb-4">
        <View style={{ marginRight: 8 }}>{icon}</View>
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function Compare() {
  const { olderScanId, newerScanId } = useLocalSearchParams<{
    olderScanId: string;
    newerScanId: string;
  }>();
  const router = useRouter();

  const [before, setBefore] = useState<any>(null);
  const [after, setAfter] = useState<any>(null);
  const [beforePhotos, setBeforePhotos] = useState<PhotoUrls>({
    front: null,
    left: null,
    right: null,
  });
  const [afterPhotos, setAfterPhotos] = useState<PhotoUrls>({
    front: null,
    left: null,
    right: null,
  });
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("breakouts");
  const [photoView, setPhotoView] = useState<PhotoView>("front");

  useEffect(() => {
    (async () => {
      try {
        // Fetch both scans in parallel
        const [scanA, scanB] = await Promise.all([
          getScan(olderScanId!),
          getScan(newerScanId!),
        ]);
        setBefore(scanA);
        setAfter(scanB);

        // Sign photo paths for both scans (up to 6 paths total)
        const [photosA, photosB] = await Promise.all([
          signScanPhotos(scanA),
          signScanPhotos(scanB),
        ]);
        setBeforePhotos(photosA);
        setAfterPhotos(photosB);
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, [olderScanId, newerScanId]);

  // --- Loading & Error States ---
  if (err) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-emerald-50 p-6"
        edges={["top"]}
      >
        <Text className="text-lg text-red-600 text-center">{err}</Text>
      </SafeAreaView>
    );
  }

  if (!before || !after) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-emerald-50"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-base text-gray-600 mt-4">Loading comparison...</Text>
      </SafeAreaView>
    );
  }

  // --- Helpers ---
  const showSkinAge = before.skin_age || after.skin_age;
  const showHeatmaps =
    (beforePhotos.front || beforePhotos.left || beforePhotos.right || afterPhotos.front || afterPhotos.left || afterPhotos.right) &&
    (before.overlays || after.overlays);
  const showWatchlist =
    (Array.isArray(before.watchlist_areas) && before.watchlist_areas.length > 0) ||
    (Array.isArray(after.watchlist_areas) && after.watchlist_areas.length > 0);
  const showAmRoutine =
    (before.am_routine?.length > 0) || (after.am_routine?.length > 0);
  const showPmRoutine =
    (before.pm_routine?.length > 0) || (after.pm_routine?.length > 0);
  const showProducts =
    (before.products?.length > 0) || (after.products?.length > 0);

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

          <Text className="text-2xl font-bold text-gray-900 mb-1">Compare Scans</Text>
          <Text className="text-sm text-gray-600 mb-4">Side-by-side analysis of your skin progress</Text>

          {/* Date Headers */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 bg-gray-100 rounded-xl py-2 px-3 mr-2">
              <Text className="text-xs text-gray-500 mb-0.5">Before</Text>
              <Text className="text-sm font-semibold text-gray-900">{fmtDate(before.created_at)}</Text>
            </View>
            <View className="flex-1 bg-emerald-100 rounded-xl py-2 px-3 ml-2">
              <Text className="text-xs text-emerald-600 mb-0.5">After</Text>
              <Text className="text-sm font-semibold text-emerald-900">{fmtDate(after.created_at)}</Text>
            </View>
          </View>

          {/* Overview Section */}
          <Section
            icon={<TrendingUp size={24} color="#10B981" strokeWidth={2} />}
            title="Overview"
          >
            <NumericRow
              label="Skin Score"
              beforeVal={before.skin_score}
              afterVal={after.skin_score}
              field="skin_score"
              suffix="/100"
            />
            <NumericRow
              label="Potential"
              beforeVal={before.skin_potential}
              afterVal={after.skin_potential}
              field="skin_potential"
              suffix="/100"
            />
            <NumericRow
              label="Health"
              beforeVal={before.skin_health_percent}
              afterVal={after.skin_health_percent}
              field="skin_health_percent"
              suffix="%"
            />
            <CatRow
              label="Skin Type"
              beforeVal={before.skin_type}
              afterVal={after.skin_type}
            />
          </Section>

          {/* Skin Age Section */}
          {showSkinAge && (
            <Section
              icon={<Clock size={24} color="#10B981" strokeWidth={2} />}
              title="Skin Age"
            >
              <NumericRow
                label="Skin Age"
                beforeVal={before.skin_age}
                afterVal={after.skin_age}
                field="skin_age"
                suffix=" yrs"
              />
              <NumericRow
                label="Confidence"
                beforeVal={before.skin_age_confidence}
                afterVal={after.skin_age_confidence}
                field="skin_age_confidence"
                suffix="%"
              />
              <CatRow
                label="Comparison"
                beforeVal={before.skin_age_comparison}
                afterVal={after.skin_age_comparison}
              />
            </Section>
          )}

          {/* Conditions Section */}
          <Section
            icon={<AlertCircle size={24} color="#10B981" strokeWidth={2} />}
            title="Conditions"
          >
            <CatRow label="Breakouts" beforeVal={before.breakout_level} afterVal={after.breakout_level} />
            <CatRow label="Acne-prone" beforeVal={before.acne_prone_level} afterVal={after.acne_prone_level} />
            <CatRow label="Scarring" beforeVal={before.scarring_level} afterVal={after.scarring_level} />
            <NumericRow label="Redness" beforeVal={before.redness_percent} afterVal={after.redness_percent} field="redness_percent" suffix="%" />
            <CatRow label="Razor Burn" beforeVal={before.razor_burn_level} afterVal={after.razor_burn_level} />
            <CatRow label="Blackheads" beforeVal={before.blackheads_level} afterVal={after.blackheads_level} />
            <NumericRow label="Blackheads Count" beforeVal={before.blackheads_estimated_count} afterVal={after.blackheads_estimated_count} field="blackheads_estimated_count" />
            <NumericRow label="Oiliness" beforeVal={before.oiliness_percent} afterVal={after.oiliness_percent} field="oiliness_percent" suffix="%" />
            <NumericRow label="Pore Health" beforeVal={before.pore_health} afterVal={after.pore_health} field="pore_health" suffix="/100" />
          </Section>

          {/* Heatmaps Section */}
          {showHeatmaps && (
            <Section
              icon={<MapPin size={24} color="#10B981" strokeWidth={2} />}
              title="Heatmaps"
            >
              {/* Mode Selector */}
              <View className="flex-row gap-1.5 mb-3">
                {MODES.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    className={`flex-1 px-2 py-2.5 rounded-xl ${mode === m ? "bg-emerald-500" : "bg-gray-100"}`}
                    android_ripple={{ color: "#10B98120" }}
                  >
                    <Text
                      className={`text-xs font-semibold text-center capitalize ${mode === m ? "text-white" : "text-gray-700"}`}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Photo View Selector */}
              <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
                {PHOTO_VIEWS.map((view) => (
                  <Pressable
                    key={view}
                    onPress={() => setPhotoView(view)}
                    className={`flex-1 py-2 rounded-lg ${photoView === view ? "bg-white" : ""}`}
                    style={
                      photoView === view
                        ? {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                          }
                        : undefined
                    }
                    android_ripple={{ color: "#10B98120" }}
                  >
                    <Text
                      className={`text-sm font-semibold text-center ${photoView === view ? "text-emerald-600" : "text-gray-500"}`}
                    >
                      {PHOTO_LABELS[view]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Side-by-side Heatmaps */}
              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 text-center mb-2">Before</Text>
                  {beforePhotos[photoView] ? (
                    <View className="rounded-xl overflow-hidden">
                      <HeatmapOverlay
                        photoUri={beforePhotos[photoView]!}
                        overlays={before.overlays}
                        which={photoView}
                        mode={mode}
                      />
                    </View>
                  ) : (
                    <View className="bg-gray-50 p-6 rounded-xl items-center">
                      <Text className="text-gray-400 text-xs text-center">N/A</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-emerald-600 text-center mb-2">After</Text>
                  {afterPhotos[photoView] ? (
                    <View className="rounded-xl overflow-hidden">
                      <HeatmapOverlay
                        photoUri={afterPhotos[photoView]!}
                        overlays={after.overlays}
                        which={photoView}
                        mode={mode}
                      />
                    </View>
                  ) : (
                    <View className="bg-gray-50 p-6 rounded-xl items-center">
                      <Text className="text-gray-400 text-xs text-center">N/A</Text>
                    </View>
                  )}
                </View>
              </View>

              <HeatmapLegend mode={mode} />
            </Section>
          )}

          {/* Watchlist Section */}
          {showWatchlist && (
            <Section
              icon={<AlertCircle size={24} color="#F59E0B" strokeWidth={2} />}
              title="Watchlist"
            >
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 text-center mb-2">Before</Text>
                  {(before.watchlist_areas ?? []).length > 0 ? (
                    (before.watchlist_areas as any[]).map((w: any, i: number) => (
                      <View key={i} className="bg-amber-50 p-3 rounded-xl mb-2">
                        <Text className="text-xs font-semibold text-gray-900 mb-0.5">{w.area}</Text>
                        <Text className="text-xs text-gray-600">{w.reason}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-emerald-600 text-center mb-2">After</Text>
                  {(after.watchlist_areas ?? []).length > 0 ? (
                    (after.watchlist_areas as any[]).map((w: any, i: number) => (
                      <View key={i} className="bg-amber-50 p-3 rounded-xl mb-2">
                        <Text className="text-xs font-semibold text-gray-900 mb-0.5">{w.area}</Text>
                        <Text className="text-xs text-gray-600">{w.reason}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
              </View>
            </Section>
          )}

          {/* AM Routine Section */}
          {showAmRoutine && (
            <Section
              icon={<Sun size={24} color="#F59E0B" strokeWidth={2} />}
              title="Morning Routine"
            >
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 text-center mb-2">Before</Text>
                  {(before.am_routine ?? []).length > 0 ? (
                    (before.am_routine as any[]).map((s: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center mb-1">
                          <View className="bg-emerald-100 w-5 h-5 rounded-full items-center justify-center mr-1.5">
                            <Text className="text-emerald-700 font-bold text-[10px]">{s.step}</Text>
                          </View>
                          <Text className="text-xs font-semibold text-gray-900 flex-1">{s.what}</Text>
                        </View>
                        <Text className="text-[10px] text-gray-600 leading-4">{s.why}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-emerald-600 text-center mb-2">After</Text>
                  {(after.am_routine ?? []).length > 0 ? (
                    (after.am_routine as any[]).map((s: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center mb-1">
                          <View className="bg-emerald-100 w-5 h-5 rounded-full items-center justify-center mr-1.5">
                            <Text className="text-emerald-700 font-bold text-[10px]">{s.step}</Text>
                          </View>
                          <Text className="text-xs font-semibold text-gray-900 flex-1">{s.what}</Text>
                        </View>
                        <Text className="text-[10px] text-gray-600 leading-4">{s.why}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
              </View>
            </Section>
          )}

          {/* PM Routine Section */}
          {showPmRoutine && (
            <Section
              icon={<Moon size={24} color="#6366F1" strokeWidth={2} />}
              title="Evening Routine"
            >
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 text-center mb-2">Before</Text>
                  {(before.pm_routine ?? []).length > 0 ? (
                    (before.pm_routine as any[]).map((s: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center mb-1">
                          <View className="bg-emerald-100 w-5 h-5 rounded-full items-center justify-center mr-1.5">
                            <Text className="text-emerald-700 font-bold text-[10px]">{s.step}</Text>
                          </View>
                          <Text className="text-xs font-semibold text-gray-900 flex-1">{s.what}</Text>
                        </View>
                        <Text className="text-[10px] text-gray-600 leading-4">{s.why}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-emerald-600 text-center mb-2">After</Text>
                  {(after.pm_routine ?? []).length > 0 ? (
                    (after.pm_routine as any[]).map((s: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center mb-1">
                          <View className="bg-emerald-100 w-5 h-5 rounded-full items-center justify-center mr-1.5">
                            <Text className="text-emerald-700 font-bold text-[10px]">{s.step}</Text>
                          </View>
                          <Text className="text-xs font-semibold text-gray-900 flex-1">{s.what}</Text>
                        </View>
                        <Text className="text-[10px] text-gray-600 leading-4">{s.why}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
              </View>
            </Section>
          )}

          {/* Products Section */}
          {showProducts && (
            <Section
              icon={<Package size={24} color="#10B981" strokeWidth={2} />}
              title="Recommended Products"
            >
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 text-center mb-2">Before</Text>
                  {(before.products ?? []).length > 0 ? (
                    (before.products as any[]).map((p: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <Text className="text-xs font-semibold text-gray-900 mb-0.5">{p.name}</Text>
                        <Text className="text-[10px] text-emerald-600 font-medium uppercase mb-1">{p.type}</Text>
                        <Text className="text-[10px] text-gray-600 leading-4">{p.reason}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-emerald-600 text-center mb-2">After</Text>
                  {(after.products ?? []).length > 0 ? (
                    (after.products as any[]).map((p: any, i: number) => (
                      <View key={i} className="bg-gray-50 p-3 rounded-xl mb-2">
                        <Text className="text-xs font-semibold text-gray-900 mb-0.5">{p.name}</Text>
                        <Text className="text-[10px] text-emerald-600 font-medium uppercase mb-1">{p.type}</Text>
                        <Text className="text-[10px] text-gray-600 leading-4">{p.reason}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 text-center py-3">None</Text>
                  )}
                </View>
              </View>
            </Section>
          )}

          {/* Disclaimer */}
          <Text className="text-xs text-gray-400 text-center mt-6 mb-2 px-4">
            This is not medical advice. Consult a healthcare professional for diagnosis or treatment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
