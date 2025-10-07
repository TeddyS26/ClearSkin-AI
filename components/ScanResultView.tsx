import { FlatList, Image, ScrollView, Text, View } from 'react-native';
import type { ScanRow } from '../src/lib/types';

export default function ScanResultView({ row }: { row: ScanRow }) {
  return (
    <ScrollView contentContainerStyle={{ padding:16 }}>
      <Text style={{ fontSize: 22, fontWeight:'700' }}>Results</Text>
      <Text style={{ color:'#777' }}>{new Date(row.created_at).toLocaleString()}</Text>

      <View style={{ marginTop:12, padding:12, borderWidth:1, borderColor:'#eee', borderRadius:12 }}>
        <Text>Skin Score: <Text style={{ fontWeight:'700' }}>{row.skin_score ?? '—'}</Text> / 100</Text>
        <Text>Potential: <Text style={{ fontWeight:'700' }}>{row.skin_potential ?? '—'}</Text> / 100</Text>
        <Text>Skin Health: {row.skin_health_percent ?? '—'}%</Text>
        <Text>Type: {row.skin_type ?? '—'}</Text>
        <Text>Breakouts: {row.breakout_level ?? '—'}</Text>
        <Text>Acne-prone: {row.acne_prone_level ?? '—'}</Text>
        <Text>Oiliness: {row.oiliness_percent ?? '—'}%</Text>
        <Text>Pore health: {row.pore_health ?? '—'}</Text>
      </View>

      <Text style={{ marginTop:16, fontWeight:'700' }}>Issues</Text>
      <FlatList
        data={(row.issues ?? []) as any[]}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Text>- {item.type} {item.severity ? `(${item.severity})` : ''} {item.area ? `• ${item.area}` : ''}</Text>
        )}
      />

      <Text style={{ marginTop:16, fontWeight:'700' }}>Watchlist</Text>
      <FlatList
        data={(row.watchlist_areas ?? []) as any[]}
        keyExtractor={(_, i) => 'w'+i}
        renderItem={({ item }) => (<Text>- {item.area}: {item.reason}</Text>)}
      />

      <Text style={{ marginTop:16, fontWeight:'700' }}>AM routine</Text>
      <FlatList
        data={(row.am_routine ?? []) as any[]}
        keyExtractor={(_, i) => 'am'+i}
        renderItem={({ item }) => (<Text>- {item.step}. {item.what} {item.why ? `• ${item.why}` : ''}</Text>)}
      />

      <Text style={{ marginTop:16, fontWeight:'700' }}>PM routine</Text>
      <FlatList
        data={(row.pm_routine ?? []) as any[]}
        keyExtractor={(_, i) => 'pm'+i}
        renderItem={({ item }) => (<Text>- {item.step}. {item.what} {item.why ? `• ${item.why}` : ''}</Text>)}
      />

      <Text style={{ marginTop:16, fontWeight:'700' }}>Products</Text>
      <FlatList
        data={(row.products ?? []) as any[]}
        keyExtractor={(_, i) => 'p'+i}
        renderItem={({ item }) => (<Text>- {item.name} • {item.type} • {item.reason}</Text>)}
      />

      <Text style={{ marginTop:16, fontSize:12, color:'#777' }}>
        Disclaimer: Informational only; not medical advice.
      </Text>

      <View style={{ flexDirection:'row', gap:8, marginTop:16 }}>
        {row.front_path && <Image style={{ width:80, height:110 }} source={{ uri: getPublicUrl(row.front_path) }} />}
        {row.left_path &&  <Image style={{ width:80, height:110 }} source={{ uri: getPublicUrl(row.left_path) }} />}
        {row.right_path && <Image style={{ width:80, height:110 }} source={{ uri: getPublicUrl(row.right_path) }} />}
      </View>
    </ScrollView>
  );
}

/**
 * For quick thumbnails only:
 * If your bucket is private (recommended), you normally need signed URLs.
 * Here we rely on the edge function to sign when needed. For thumbnails, you can
 * either 1) build another function to sign temporary URLs, or 2) skip thumbnails.
 * For now we return a direct path which won't load if the bucket is private.
 * Replace this with a signed-url fetcher when you want visible thumbs.
 */
function getPublicUrl(path: string) {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scan/${path}`;
}
