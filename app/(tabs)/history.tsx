import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import type { ScanRow } from '../../src/lib/types';

export default function History() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('scan_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setRows((data ?? []) as ScanRow[]);
    };
    load();
  }, []);

  return (
    <View style={{ flex:1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight:'700', marginBottom: 12 }}>Scan History</Text>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/scan/result', params: { id: item.id } })}>
            <View style={{ paddingVertical:10, borderBottomWidth:1, borderColor:'#eee' }}>
              <Text>{new Date(item.created_at).toLocaleString()}</Text>
              <Text>Score {item.skin_score ?? '—'} · {item.skin_type ?? '—'}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
