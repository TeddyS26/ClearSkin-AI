import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    try {
      if (pw !== pw2) return Alert.alert("Passwords do not match");
      if (pw.length < 8) return Alert.alert("Password must be at least 8 characters");
      setBusy(true);
      const { error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
      if (error) throw error;
      Alert.alert("Account created", "Please sign in now.");
      router.replace("/auth/sign-in");
    } catch (e: any) {
      Alert.alert("Sign up failed", e.message ?? String(e));
    } finally { setBusy(false); }
  };

  return (
    <View className="flex-1 bg-white p-6 gap-6">
      <Text className="text-2xl">Create Account</Text>
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
      <View>
        <Text>Confirm Password</Text>
        <TextInput className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-3"
          value={pw2} onChangeText={setPw2} secureTextEntry />
      </View>

      <Pressable disabled={busy} onPress={onSubmit} className="bg-emerald-500 py-4 rounded-xl items-center">
        <Text className="text-white font-semibold">{busy ? "Creating..." : "Create Account"}</Text>
      </Pressable>

      <Text className="text-center">
        Already have an account? <Link href="/auth/sign-in" className="text-emerald-600">Sign in</Link>
      </Text>
    </View>
  );
}
