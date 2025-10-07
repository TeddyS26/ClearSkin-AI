import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import ScanResultView from '../../components/ScanResultView';
import { supabase } from '../../src/lib/supabase';
import type { ScanRow } from '../../src/lib/types';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<ScanRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const { data } = await supabase.from('scan_sessions').select('*').eq('id', id).maybeSingle();
      if (!cancelled && data) setRow(data as ScanRow);
      if (!cancelled && (data?.status === 'pending' || data?.status === 'processing')) {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [id]);

  if (!row || row.status === 'pending' || row.status === 'processing') {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Analyzing your photos…</Text>
      </View>
    );
  }
  if (row.status === 'failed') {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text>Analysis failed. Please try again.</Text>
    </View>;
  }
  return <ScanResultView row={row} />;
}
