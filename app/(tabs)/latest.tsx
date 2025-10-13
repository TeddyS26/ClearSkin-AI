import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { latestCompletedScan, signStoragePaths } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { Camera, TrendingUp, Heart, Droplet, AlertCircle, FileText } from "lucide-react-native";

export default function Latest() {
  const [row, setRow] = useState<any>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const r = await latestCompletedScan();
      setRow(r);
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
          onPress={() => router.push("/scan/capture")} 
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

        {/* Full Report Button */}
        <Pressable
          onPress={() => router.push({ pathname: "/scan/result", params: { id: row.id } })}
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
