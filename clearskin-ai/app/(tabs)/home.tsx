import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import type { ScanRow } from '../../src/lib/types';

export default function Home() {
  const router = useRouter();
  const [latest, setLatest] = useState<ScanRow | null>(null);
  const [history, setHistory] = useState<ScanRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rows } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!mounted) return;
      if (rows && rows.length) {
        setLatest(rows[0] as ScanRow);
        setHistory(rows.slice(0, 10) as ScanRow[]);
      } else {
        setLatest(null);
        setHistory([]);
      }
    };
    load();
    const i = setInterval(load, 3000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  return (
    <View style={{ flex:1, padding:16 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Welcome back 👋</Text>
      </View>

      <View style={{ padding:12, borderWidth:1, borderColor:'#eee', borderRadius:12, marginBottom:16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 4 }}>Latest</Text>
        {latest ? (
          <>
            <Text>Skin Score: {latest.skin_score ?? '—'} / 100</Text>
            <Text>Potential: {latest.skin_potential ?? '—'} / 100</Text>
            <Text>Type: {latest.skin_type ?? '—'}</Text>
            <Pressable onPress={() => router.push(`/latest`)}>
              <Text style={{ marginTop: 8, color:'#0a7' }}>Open latest details</Text>
            </Pressable>
          </>
        ) : <Text>No scans yet.</Text>}
      </View>

      <Button title="Start new scan" onPress={() => router.push('/scan/capture')} />

      <Text style={{ marginTop: 24, fontSize: 18, fontWeight: '700' }}>History</Text>
      <FlatList
        data={history}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/scan/result', params: { id: item.id } })}>
            <View style={{ paddingVertical:10, borderBottomWidth:1, borderColor:'#f0f0f0' }}>
              <Text>{new Date(item.created_at).toLocaleString()}</Text>
              <Text>Score {item.skin_score ?? '—'} · {item.skin_type ?? '—'}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
