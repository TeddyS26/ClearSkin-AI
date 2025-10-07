import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Image, ScrollView, Text } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function Capture() {
  const router = useRouter();
  const [front, setFront] = useState<string | null>(null);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const take = async (set: (uri: string)=>void) => {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.9, base64: false });
    if (!res.canceled && res.assets?.[0]?.uri) set(res.assets[0].uri);
  };

  const uploadAndAnalyze = async () => {
    try {
      if (!front || !left || !right) return Alert.alert('Please capture all 3 angles.');
      setBusy(true);

      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Not signed in.');

      // 1) create row
      const { data: inserted, error: insErr } = await supabase
        .from('scan_sessions').insert({ user_id: user.id }).select().single();
      if (insErr) throw insErr;
      const id = inserted.id as string;

      // 2) upload 3 photos to bucket 'scan'
      const base = `user/${user.id}/${id}`;
      const upload = async (uri: string, name: string) => {
        const res = await fetch(uri);
        const blob = await res.blob();
        const path = `${base}/${name}.jpg`;
        const { error } = await supabase.storage.from('scan').upload(path, blob, {
          contentType: 'image/jpeg', upsert: true
        });
        if (error) throw error;
        return path;
      };

      const frontPath = await upload(front, 'front');
      const leftPath  = await upload(left,  'left');
      const rightPath = await upload(right, 'right');

      // 3) call edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scan_session_id: id,
          front_path: frontPath,
          left_path: leftPath,
          right_path: rightPath
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t);
      }

      router.replace({ pathname: '/scan/result', params: { id } });

    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight:'700' }}>Take your photos</Text>
      <Button title="Capture FRONT" onPress={() => take((u)=>setFront(u))} />
      {front && <Image source={{ uri: front }} style={{ width: 140, height: 180, marginTop: 8 }} />}
      <Button title="Capture LEFT" onPress={() => take((u)=>setLeft(u))} />
      {left && <Image source={{ uri: left }} style={{ width: 140, height: 180, marginTop: 8 }} />}
      <Button title="Capture RIGHT" onPress={() => take((u)=>setRight(u))} />
      {right && <Image source={{ uri: right }} style={{ width: 140, height: 180, marginTop: 8 }} />}
      <Button title={busy ? "Analyzing..." : "Analyze"} onPress={uploadAndAnalyze} disabled={busy} />
      <Text style={{ fontSize:12, color:'#777', marginTop:8 }}>
        Tip: good lighting, remove glasses, keep a neutral expression.
      </Text>
    </ScrollView>
  );
}
