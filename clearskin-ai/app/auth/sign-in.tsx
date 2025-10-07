import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../src/ctx/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function SignIn() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!loading && user) return <Redirect href='/(tabs)/home' />;

  const onSubmit = async () => {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw
      });
      if (error) throw error;
      // AuthContext will pick up the new session and redirect
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:24, gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:'700' }}>Sign in</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry={!showPw}
        value={pw}
        onChangeText={setPw}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12 }}
      />

      <Button title={showPw ? "Hide password" : "Show password"} onPress={() => setShowPw(v => !v)} />
      <Button title={busy ? "Signing in..." : "Sign in"} onPress={onSubmit} disabled={busy} />

      <Text style={{ textAlign:'center', marginTop:8 }}>
        New here?{' '}
        <Link href="/auth/sign-up" style={{ color:'#0a7' }}>Create an account</Link>
      </Text>
    </View>
  );
}
