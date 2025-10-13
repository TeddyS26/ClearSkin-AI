import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/ctx/AuthContext";
import { Mail, Lock } from "lucide-react-native";

export default function SignIn() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(""); 
  const [pw, setPw] = useState(""); 
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // @ts-ignore - route exists but not in generated types yet
      router.replace("/subscribe");
    }
  }, [loading, user]);

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
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
      >
        <View className="bg-white rounded-3xl p-8 shadow-lg">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
            <Text className="text-base text-gray-600">Sign in to continue your skin journey</Text>
          </View>

          <View className="gap-5">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1">
                <View style={{ marginRight: 12 }}>
                  <Mail size={20} color="#6B7280" />
                </View>
                <TextInput 
                  className="flex-1 h-12 text-base text-gray-900"
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none" 
                  keyboardType="email-address"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1">
                <View style={{ marginRight: 12 }}>
                  <Lock size={20} color="#6B7280" />
                </View>
                <TextInput 
                  className="flex-1 h-12 text-base text-gray-900"
                  value={pw} 
                  onChangeText={setPw} 
                  secureTextEntry
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <Pressable 
              disabled={busy} 
              onPress={onSubmit} 
              className={`py-4 rounded-2xl items-center mt-2 ${busy ? "bg-emerald-300" : "bg-emerald-500 active:bg-emerald-600"}`}
              android_ripple={{ color: "#059669" }}
            >
              <Text className="text-white text-lg font-semibold">{busy ? "Signing in..." : "Sign In"}</Text>
            </Pressable>

            <Text className="text-center text-base text-gray-600 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="text-emerald-600 font-semibold">
                Sign up
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
