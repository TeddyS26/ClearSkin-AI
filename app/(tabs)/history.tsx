import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { listScans, signStoragePaths, fmtDate } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { hasActiveSubscription } from "../../src/lib/billing";
import { Calendar, TrendingUp, Circle, CircleCheck } from "lucide-react-native";

type Row = any;

export default function History() {
  const [items, setItems] = useState<Row[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareModeLoading, setCompareModeLoading] = useState(false);
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

  // Derive button label from state
  const headerButtonLabel = !compareMode
    ? "Compare"
    : selectedIds.length === 2
      ? "Compare"
      : "Cancel";

  const handleHeaderButton = useCallback(async () => {
    if (!compareMode) {
      // Not in compare mode → check subscription then enter
      setCompareModeLoading(true);
      try {
        const hasSubscription = await hasActiveSubscription();
        if (!hasSubscription) {
          router.push("/subscribe");
        } else {
          setCompareMode(true);
          setSelectedIds([]);
        }
      } catch (err) {
        console.error("Failed to check subscription:", err);
      } finally {
        setCompareModeLoading(false);
      }
    } else if (selectedIds.length === 2) {
      // Two selected → navigate to compare screen
      const scanA = items.find(i => i.id === selectedIds[0])!;
      const scanB = items.find(i => i.id === selectedIds[1])!;
      const [olderScanId, newerScanId] =
        new Date(scanA.created_at) < new Date(scanB.created_at)
          ? [scanA.id, scanB.id]
          : [scanB.id, scanA.id];

      router.push({
        pathname: "/scan/compare",
        params: { olderScanId, newerScanId },
      });
    } else {
      // In compare mode with <2 selected → cancel
      setCompareMode(false);
      setSelectedIds([]);
    }
  }, [compareMode, selectedIds, items, router]);

  const handleScanPress = useCallback((scanId: string) => {
    if (compareMode) {
      // In compare mode: toggle selection (max 2)
      setSelectedIds(prev => {
        if (prev.includes(scanId)) {
          // Deselect
          return prev.filter(id => id !== scanId);
        } else if (prev.length < 2) {
          // Select (if under limit)
          return [...prev, scanId];
        } else {
          // At limit, no-op
          return prev;
        }
      });
    } else {
      // Normal mode: navigate to result
      router.push({ pathname: "/scan/result", params: { id: scanId } });
    }
  }, [compareMode, router]);

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
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold text-gray-900">Scan History</Text>
            <Pressable
              onPress={handleHeaderButton}
              disabled={compareModeLoading}
              className={`px-4 py-2 rounded-lg ${
                headerButtonLabel === 'Cancel'
                  ? 'bg-gray-200'
                  : 'bg-emerald-500'
              } ${compareModeLoading ? 'opacity-60' : ''}`}
              android_ripple={{ color: "#10B98120" }}
            >
              {compareModeLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className={`text-sm font-semibold ${
                  headerButtonLabel === 'Cancel' ? 'text-gray-600' : 'text-white'
                }`}>
                  {headerButtonLabel}
                </Text>
              )}
            </Pressable>
          </View>
          <Text className="text-sm text-gray-600">
            {compareMode ? "Select up to 2 scans to compare" : "Track your skin journey over time"}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const thumb = thumbs[item.front_path];
        const isSelected = selectedIds.includes(item.id);
        
        return (
          <Pressable
            onPress={() => handleScanPress(item.id)}
            className={`flex-row items-center mb-4 rounded-2xl shadow-sm p-4 active:opacity-90 border ${
              isSelected
                ? 'bg-emerald-50 border-emerald-500'
                : 'bg-white border-gray-100'
            }`}
            android_ripple={{ color: "#10B98120" }}
          >
            {compareMode && (
              <View className="mr-3">
                {isSelected ? (
                  <CircleCheck size={22} color="#10B981" strokeWidth={2} />
                ) : (
                  <Circle size={22} color="#D1D5DB" strokeWidth={1.5} />
                )}
              </View>
            )}
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
