import { Link, Redirect } from 'expo-router';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../src/ctx/AuthContext';

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Redirect href='/(tabs)/home' />;

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 12 }}>ClearSkin AI</Text>
      <Text style={{ textAlign:'center', marginBottom: 24 }}>
        Snap 3 angles. Get a skin score, oil/dry slider, issues, routines, and products.
      </Text>
      <Link href="/auth/sign-in" asChild><Button title="Sign in" onPress={()=>{}} /></Link>
      <View style={{ height:8 }} />
      <Link href="/auth/sign-up" asChild><Button title="Create account" onPress={()=>{}} /></Link>
    </View>
  );
}
