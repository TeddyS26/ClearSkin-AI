import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async () => {
    try {
      if (!email.trim()) return Alert.alert('Email is required');
      if (pw.length < 8) return Alert.alert('Password must be at least 8 characters');
      if (pw !== pw2) return Alert.alert('Passwords do not match');

      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw
      });
      if (error) throw error;

      // If "Confirm email" is ON, user must verify email before signing in.
      // Either way, send them to Sign In page with a friendly message.
      Alert.alert('Account created', 'Sign in with your email and password.');
      router.replace('/auth/sign-in');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:24, gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:'700' }}>Create account</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12 }}
      />

      <TextInput
        placeholder="Password (min 8 chars)"
        secureTextEntry={!showPw}
        value={pw}
        onChangeText={setPw}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12 }}
      />

      <TextInput
        placeholder="Confirm password"
        secureTextEntry={!showPw}
        value={pw2}
        onChangeText={setPw2}
        style={{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12 }}
      />

      <Button title={showPw ? "Hide passwords" : "Show passwords"} onPress={() => setShowPw(v => !v)} />
      <Button title={busy ? "Creating..." : "Create account"} onPress={onSubmit} disabled={busy} />

      <Text style={{ textAlign:'center', marginTop:8 }}>
        Already have an account?{' '}
        <Link href="/auth/sign-in" style={{ color:'#0a7' }}>Sign in</Link>
      </Text>
    </View>
  );
}
