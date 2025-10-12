import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { listScans, signStoragePaths, fmtDate } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { Calendar, TrendingUp } from "lucide-react-native";

type Row = any;

export default function History() {
  const [items, setItems] = useState<Row[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const fetchPage = useCallback(async (next?: boolean) => {
    const data = await listScans({ limit: 20, cursor: next ? cursor : undefined });
    if (next) setItems(prev => [...prev, ...data]);
    else setItems(data);
    // set new cursor to last item's created_at
    const last = data.at(-1);
    setCursor(last?.created_at ?? null);

    // sign thumbnails for new rows
    const paths = data.map((r: Row) => r.front_path).filter(Boolean);
    const map = await signStoragePaths(paths);
    setThumbs(prev => ({ ...prev, ...map }));
  }, [cursor]);

  useEffect(() => {
    (async () => {
      try { await fetchPage(false); } finally { setLoading(false); }
    })();
  }, []);

  // Set up real-time subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const channel = supabase
      .channel('history_scan_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_sessions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // When a scan is inserted or updated, refresh the data
          if (mounted) {
            try {
              const data = await listScans({ limit: 20, cursor: undefined });
              if (mounted) {
                setItems(data);
                const last = data.at(-1);
                setCursor(last?.created_at ?? null);
                const paths = data.map((r: Row) => r.front_path).filter(Boolean);
                const map = await signStoragePaths(paths);
                if (mounted) {
                  setThumbs(prev => ({ ...prev, ...map }));
                }
              }
            } catch (err) {
              // Silently fail if component unmounted
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(false);
    setRefreshing(false);
  }, [fetchPage]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-emerald-50" edges={["top"]}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6 bg-emerald-50" edges={["top"]}>
        <View className="bg-gray-100 p-6 rounded-full mb-6">
          <Calendar size={48} color="#10B981" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">No history yet</Text>
        <Text className="text-gray-600 text-center text-base">
          Run your first scan and it will appear here.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <FlatList
      className="flex-1"
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Scan History</Text>
          <Text className="text-sm text-gray-600">Track your skin journey over time</Text>
        </View>
      }
      renderItem={({ item }) => {
        const thumb = thumbs[item.front_path];
        return (
          <Pressable
            onPress={() => router.push({ pathname: "/scan/result", params: { id: item.id } })}
            className="flex-row items-center mb-4 bg-white rounded-2xl shadow-sm p-4 active:opacity-90 border border-gray-100"
            android_ripple={{ color: "#10B98120" }}
          >
            <View className="w-20 h-20 rounded-2xl overflow-hidden mr-4 bg-gray-100">
              {thumb ? (
                <Image source={{ uri: thumb }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <TrendingUp size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <View className="bg-emerald-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-emerald-700 font-bold text-sm">
                    {item.skin_score ?? "—"}/100
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded ${item.status === 'complete' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Text className={`text-xs font-semibold ${item.status === 'complete' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-600 text-sm mb-1">
                {item.skin_type ? `${item.skin_type} skin` : 'Skin analysis'}
              </Text>
              <Text className="text-gray-500 text-xs">{fmtDate(item.created_at)}</Text>
            </View>
          </Pressable>
        );
      }}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (cursor) fetchPage(true).catch(() => {});
      }}
      ListFooterComponent={() => 
        cursor ? (
          <View className="py-4">
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        ) : null
      }
      />
    </SafeAreaView>
  );
}
