import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import ScanResultView from '../../components/ScanResultView';
import { supabase } from '../../src/lib/supabase';
import type { ScanRow } from '../../src/lib/types';

export default function Latest() {
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

  if (!row) return <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text>No scans yet.</Text></View>;

  return <ScanResultView row={row} />;
}
