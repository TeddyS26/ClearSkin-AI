import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Mail, CheckCircle, ArrowRight } from "lucide-react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

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

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert("Error", "No email address found");
      return;
    }

    try {
      setResending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://www.clearskinai.ca/reset-password.html"
      });
      
      if (error) throw error;
      
      Alert.alert("Email sent", "Please check your inbox for the password reset email.");
      setCountdown(30); // Start 30-second countdown
    } catch (error: any) {
      Alert.alert("Failed to resend", error.message || "Please try again later.");
    } finally {
      setResending(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
                <Mail size={40} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
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
                  1. Open the email we just sent{"\n"}
                  2. Tap the "Reset Password" button{"\n"}
                  3. You'll be redirected back to the app
                </Text>
              </View>

              <Pressable 
                onPress={handleResendEmail}
                disabled={resending || countdown > 0}
                className={`py-4 rounded-2xl items-center mt-4 mb-6 ${
                  resending || countdown > 0 ? "bg-gray-300" : "bg-emerald-500 active:bg-emerald-600"
                }`}
                android_ripple={{ color: "#059669" }}
              >
                <Text className="text-white text-lg font-semibold">
                  {resending 
                    ? "Sending..." 
                    : countdown > 0 
                      ? `Resend in ${countdown}s` 
                      : "Resend password reset email"
                  }
                </Text>
              </Pressable>

              <View className="pt-4 border-t border-gray-200">
                <Text className="text-center text-gray-600 mb-4">
                  Remember your password?
                </Text>
                <Link href="/auth/sign-in" asChild>
                  <Pressable className="flex-row items-center justify-center py-3 px-6 bg-white border-2 border-emerald-200 rounded-2xl active:bg-emerald-50">
                    <Text className="text-emerald-600 font-semibold mr-2">Continue to sign in</Text>
                    <ArrowRight size={20} color="#10B981" />
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
        >
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

              <View className="mt-4">
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
              </View>

              <View className="pt-4 border-t border-gray-200">
                <Text className="text-center text-gray-600 mb-4">
                  Remember your password?
                </Text>
                <Link href="/auth/sign-in" asChild>
                  <Pressable className="flex-row items-center justify-center py-3 px-6 bg-white border-2 border-emerald-200 rounded-2xl active:bg-emerald-50">
                    <Text className="text-emerald-600 font-semibold mr-2">Continue to sign in</Text>
                    <ArrowRight size={20} color="#10B981" />
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
