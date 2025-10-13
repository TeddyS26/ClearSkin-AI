import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { latestCompletedScan } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { Sun, Moon, CheckCircle2, Sparkles } from "lucide-react-native";

export default function Routine() {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const r = await latestCompletedScan();
      setRow(r);
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
      .channel('routine_scan_changes')
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

  if (!row || (!row.am_routine && !row.pm_routine)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6 bg-emerald-50" edges={["top"]}>
        <View className="bg-gray-100 p-6 rounded-full mb-6">
          <Sparkles size={48} color="#10B981" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">No routine yet</Text>
        <Text className="text-gray-600 text-center mb-8 text-base px-8">
          Complete a scan to get your personalized skincare routine.
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
        <Text className="text-2xl font-bold text-gray-900 mb-1">Your Routine</Text>
        <Text className="text-sm text-gray-600 mb-6">Personalized skincare recommendations</Text>

        {/* AM Routine */}
        {row.am_routine && row.am_routine.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center mb-5">
              <View className="bg-amber-100 p-3 rounded-2xl" style={{ marginRight: 12 }}>
                <Sun size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Morning Routine</Text>
                <Text className="text-sm text-gray-600">Start your day fresh</Text>
              </View>
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
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
            <View className="flex-row items-center mb-5">
              <View className="bg-indigo-100 p-3 rounded-2xl" style={{ marginRight: 12 }}>
                <Moon size={24} color="#6366F1" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Evening Routine</Text>
                <Text className="text-sm text-gray-600">Wind down and repair</Text>
              </View>
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

        {/* Products (if available) */}
        {row.products && row.products.length > 0 && (
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View style={{ marginRight: 8 }}>
                <CheckCircle2 size={24} color="#10B981" strokeWidth={2} />
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
