import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { listScans, signStoragePaths, fmtDate } from "../../src/lib/scan";

type Row = any;

export default function History() {
  const [items, setItems] = useState<Row[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const router = useRouter();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(false);
    setRefreshing(false);
  }, [fetchPage]);

  if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator /></View>;

  if (!items.length) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg mb-2">No history yet</Text>
        <Text className="text-gray-600 text-center">Run your first scan and it will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const thumb = thumbs[item.front_path];
        return (
          <Pressable
            onPress={() => router.push({ pathname: "/scan/result", params: { id: item.id } })}
            className="flex-row items-center mb-4 bg-white rounded-xl border border-gray-200 p-3"
          >
            <View style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", marginRight: 12, backgroundColor: "#F3F4F6" }}>
              {thumb ? <Image source={{ uri: thumb }} style={{ width: "100%", height: "100%" }} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-semibold">Score {item.skin_score ?? "—"}/100</Text>
              <Text className="text-gray-600 text-sm">{fmtDate(item.created_at)}</Text>
              <Text className="text-gray-600 text-sm">Status: {item.status}</Text>
            </View>
          </Pressable>
        );
      }}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (cursor) fetchPage(true).catch(() => {});
      }}
      ListFooterComponent={() => (cursor ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null)}
    />
  );
}
