import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    try {
      if (!email.trim()) return Alert.alert("Email required", "Please enter your email address");
      
      setBusy(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://www.clearskinai.ca/reset-password.html"
      });
      
      if (error) throw error;
      
      setEmailSent(true);
    } catch (e: any) {
      if (e.message?.includes("Invalid email")) {
        Alert.alert("Invalid email", "Please enter a valid email address.");
      } else if (e.message?.includes("rate limit")) {
        Alert.alert("Too many attempts", "Please wait a moment before trying again.");
      } else {
        Alert.alert("Error", e.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="px-5 py-4 border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-3 active:opacity-60"
            android_ripple={{ color: "#9CA3AF20" }}
          >
            <ArrowLeft size={24} color="#374151" strokeWidth={2.5} />
            <Text className="text-gray-700 font-semibold text-base ml-1">Back</Text>
          </Pressable>
          <Text className="text-gray-900 text-xl font-semibold">Check Your Email</Text>
        </View>

        <ScrollView className="flex-1 px-5 py-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md mx-auto shadow-lg">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
                <CheckCircle size={40} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</Text>
              <Text className="text-gray-600 text-center leading-6">
                We've sent a password reset link to{" "}
                <Text className="font-semibold text-gray-900">{email}</Text>
              </Text>
            </View>

            <View className="space-y-4">
              <View className="bg-emerald-50 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <CheckCircle size={20} color="#10B981" />
                  <Text className="text-emerald-800 font-semibold ml-2">What's next?</Text>
                </View>
                <Text className="text-emerald-700 text-sm leading-5">
                  1. Check your email inbox{"\n"}
                  2. Click the "Reset Password" button{"\n"}
                  3. Create a new password
                </Text>
              </View>

              <View className="pt-4 border-t border-gray-200">
                <Text className="text-center text-gray-600 mb-4">
                  Didn't receive the email?
                </Text>
                <Pressable 
                  onPress={() => setEmailSent(false)}
                  className="flex-row items-center justify-center py-3 px-6 bg-white border-2 border-emerald-200 rounded-2xl active:bg-emerald-50"
                >
                  <Text className="text-emerald-600 font-semibold">Try again</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="px-5 py-4 border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-3 active:opacity-60"
          android_ripple={{ color: "#9CA3AF20" }}
        >
          <ArrowLeft size={24} color="#374151" strokeWidth={2.5} />
          <Text className="text-gray-700 font-semibold text-base ml-1">Back</Text>
        </Pressable>
        <Text className="text-gray-900 text-xl font-semibold">Reset Password</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 py-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md mx-auto shadow-lg">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
                <Mail size={40} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</Text>
              <Text className="text-gray-600 text-center leading-6">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </Text>
            </View>

            <View className="space-y-6">
              <View>
                <Text className="text-gray-700 text-sm font-medium mb-2">Email Address</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Mail size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={busy}
                className={`py-4 rounded-xl items-center ${
                  busy ? "bg-emerald-300" : "bg-emerald-500 active:bg-emerald-600"
                }`}
                android_ripple={{ color: "#059669" }}
              >
                <Text className="text-white text-lg font-semibold">
                  {busy ? "Sending..." : "Send Reset Link"}
                </Text>
              </Pressable>

              <View className="pt-4 border-t border-gray-200">
                <Text className="text-center text-gray-600 mb-4">
                  Remember your password?
                </Text>
                <Link href="/auth/sign-in" asChild>
                  <Pressable className="flex-row items-center justify-center py-3 px-6 bg-white border-2 border-emerald-200 rounded-2xl active:bg-emerald-50">
                    <Text className="text-emerald-600 font-semibold">Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
