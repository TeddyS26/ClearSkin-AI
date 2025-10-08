import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, Redirect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";

export default function SignIn() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);

  if (!loading && user) return <Redirect href='/(tabs)/home' />;

  const onSubmit = async () => {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert("Sign in failed", e.message ?? String(e));
    } finally { setBusy(false); }
  };

  return (
    <View className="flex-1 bg-white p-6 gap-6">
      <Text className="text-2xl">Sign In</Text>
      <View>
        <Text>Email</Text>
        <TextInput className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-3"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>
      <View>
        <Text>Password</Text>
        <TextInput className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-3"
          value={pw} onChangeText={setPw} secureTextEntry />
      </View>

      <Pressable disabled={busy} onPress={onSubmit} className="bg-emerald-500 py-4 rounded-xl items-center">
        <Text className="text-white font-semibold">{busy ? "Signing in..." : "Sign In"}</Text>
      </Pressable>

      <Text className="text-center">
        Don’t have an account? <Link href="/auth/sign-up" className="text-emerald-600">Sign up</Link>
      </Text>
    </View>
  );
}
