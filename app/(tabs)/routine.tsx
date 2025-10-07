import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import type { ScanRow } from '../../src/lib/types';

export default function Routine() {
  const [row, setRow] = useState<ScanRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('scan_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setRow(data as ScanRow);
    };
    load();
  }, []);

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Your current routine</Text>
      <Text style={{ fontWeight: '600', marginTop: 8 }}>AM</Text>
      <FlatList
        data={(row?.am_routine ?? []) as any[]}
        keyExtractor={(_, i) => 'am'+i}
        renderItem={({ item }) => <Text>- {item.step}. {item.what} {item.why ? `• ${item.why}` : ''}</Text>}
      />
      <Text style={{ fontWeight: '600', marginTop: 16 }}>PM</Text>
      <FlatList
        data={(row?.pm_routine ?? []) as any[]}
        keyExtractor={(_, i) => 'pm'+i}
        renderItem={({ item }) => <Text>- {item.step}. {item.what} {item.why ? `• ${item.why}` : ''}</Text>}
      />
      {!row && <Text style={{ marginTop: 12 }}>No routine yet — run your first scan.</Text>}
    </View>
  );
}
