import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { latestCompletedScan, signStoragePaths } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { canScan, hasActiveSubscription } from "../../src/lib/billing";
import { Camera, TrendingUp, Heart, Droplet, AlertCircle, FileText, Lock, Crown, Clock } from "lucide-react-native";

export default function Latest() {
  const [row, setRow] = useState<any>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const r = await latestCompletedScan();
      setRow(r);
      const subStatus = await hasActiveSubscription();
      setHasSubscription(subStatus);
      if (r?.front_path) {
        const map = await signStoragePaths([r.front_path]);
        setFrontUrl(map[r.front_path] ?? null);
      } else {
        setFrontUrl(null);
      }
    } catch (error) {
      // Error fetching latest scan
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  // Set up real-time subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('latest_scan_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // When a scan is inserted or updated, refresh the data
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-emerald-50" edges={["top"]}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }
  
  if (!row) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6 bg-emerald-50" edges={["top"]}>
        <View className="bg-gray-100 p-6 rounded-full mb-6">
          <Camera size={48} color="#10B981" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">No scans yet</Text>
        <Text className="text-gray-600 text-center mb-8 text-base px-8">
          Start your first scan to see your latest results here.
        </Text>
        <Pressable 
          onPress={async () => {
            const allowed = await canScan();
            router.push(allowed ? "/scan/capture" : "/subscribe");
          }} 
          className="bg-emerald-500 px-8 py-4 rounded-2xl active:opacity-90 shadow-sm"
          android_ripple={{ color: "#059669" }}
        >
          <Text className="text-white font-bold text-base">Start a Scan</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Latest Result</Text>
        <Text className="text-sm text-gray-600 mb-6">Your most recent skin analysis</Text>

        {/* Image Card */}
        {frontUrl && (
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6 border border-gray-100">
            <Image source={{ uri: frontUrl }} style={{ width: "100%", height: 320 }} resizeMode="cover" />
          </View>
        )}

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
              {/* Health - locked for free tier */}
              <View className="flex-1 bg-gray-50 p-4 rounded-2xl relative">
                {!hasSubscription && (
                  <View className="absolute inset-0 bg-gray-100/90 rounded-2xl items-center justify-center z-10">
                    <Lock size={20} color="#9CA3AF" />
                  </View>
                )}
                <Text className="text-sm text-gray-600 mb-1">Health</Text>
                <Text className="text-xl font-bold text-gray-900">{hasSubscription ? (row.skin_health_percent ?? "—") : "—"}%</Text>
              </View>
            </View>

            {/* Skin Type - locked for free tier */}
            <View className="bg-gray-50 p-4 rounded-2xl relative">
              {!hasSubscription && (
                <View className="absolute inset-0 bg-gray-100/90 rounded-2xl items-center justify-center z-10">
                  <Lock size={20} color="#9CA3AF" />
                </View>
              )}
              <Text className="text-sm text-gray-600 mb-1">Skin Type</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{hasSubscription ? (row.skin_type ?? "unknown") : "—"}</Text>
            </View>
          </View>
        </View>

        {/* Skin Age Card - New Feature */}
        {row.skin_age && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100 relative">
            {!hasSubscription && (
              <View className="absolute inset-0 bg-white/90 rounded-3xl items-center justify-center z-10">
                <Lock size={28} color="#9CA3AF" />
                <Text className="text-gray-500 font-semibold mt-2">Subscribe to unlock</Text>
              </View>
            )}
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <Clock size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Skin Age</Text>
            </View>
            
            <View className="items-center py-2">
              <View className="bg-emerald-50 rounded-full w-24 h-24 items-center justify-center mb-3">
                <Text className="text-3xl font-bold text-emerald-600">{hasSubscription ? row.skin_age : "?"}</Text>
                <Text className="text-xs text-emerald-700">years</Text>
              </View>
              
              {hasSubscription && row.skin_age_comparison && (
                <View className={`px-3 py-1.5 rounded-full ${
                  row.skin_age_comparison.includes('younger') 
                    ? 'bg-emerald-100' 
                    : row.skin_age_comparison.includes('older')
                    ? 'bg-amber-100'
                    : 'bg-gray-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    row.skin_age_comparison.includes('younger')
                      ? 'text-emerald-700'
                      : row.skin_age_comparison.includes('older')
                      ? 'text-amber-700'
                      : 'text-gray-700'
                  }`}>
                    {row.skin_age_comparison}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Conditions Card - locked for free tier */}
        {hasSubscription ? (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
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
                <Text className="text-base text-gray-700">Redness</Text>
                <Text className="text-base font-semibold text-gray-900">{row.redness_percent ?? "—"}%</Text>
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
        ) : (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100 relative overflow-hidden">
            <View className="absolute inset-0 bg-white/80 z-10 items-center justify-center">
              <View className="items-center">
                <Lock size={32} color="#9CA3AF" />
                <Text className="text-gray-500 font-semibold mt-2">Subscribe to unlock</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <AlertCircle size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Conditions</Text>
            </View>
            <View className="gap-2 opacity-30">
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Text className="text-base text-gray-700">Breakouts</Text>
                <Text className="text-base font-semibold text-gray-900">—</Text>
              </View>
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Text className="text-base text-gray-700">Acne-prone</Text>
                <Text className="text-base font-semibold text-gray-900">—</Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-base text-gray-700">Redness</Text>
                <Text className="text-base font-semibold text-gray-900">—</Text>
              </View>
            </View>
          </View>
        )}

        {/* Upgrade Banner for free tier */}
        {!hasSubscription && (
          <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: '#10B981' }}>
            <View className="flex-row items-center mb-2">
              <Crown size={20} color="#FFF" strokeWidth={2} />
              <Text className="text-lg font-bold text-white ml-2">Unlock Full Analysis</Text>
            </View>
            <Text className="text-white/90 text-sm mb-4">
              Subscribe to see detailed conditions, health metrics, and personalized recommendations.
            </Text>
            <Pressable
              onPress={() => router.push("/subscribe")}
              className="bg-white rounded-xl py-3 px-6 self-start active:opacity-80"
              android_ripple={{ color: "#10B98120" }}
            >
              <Text className="text-emerald-600 font-bold text-base">Subscribe Now</Text>
            </Pressable>
          </View>
        )}

        {/* Full Report Button */}
        <Pressable
          onPress={() => router.push({ pathname: "/scan/result", params: { id: row.id, isFreeTier: !hasSubscription ? "true" : "false" } })}
          className="bg-emerald-500 py-5 rounded-2xl items-center flex-row justify-center shadow-sm active:opacity-90"
          android_ripple={{ color: "#059669" }}
        >
          <View style={{ marginRight: 8 }}>
            <FileText size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text className="text-white font-bold text-lg">View Full Report</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
