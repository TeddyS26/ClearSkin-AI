import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react-native";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const { access_token, refresh_token, type } = useLocalSearchParams();

  useEffect(() => {
    // Check if we have the required tokens
    if (!access_token || !refresh_token || type !== 'recovery') {
      setError("Invalid password reset link. Please try again.");
    }
  }, [access_token, refresh_token, type]);

  const onSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setBusy(true);
    setError("");

    try {
      // Set the session using the tokens from the reset link
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.replace("/auth/sign-in");
      }, 2000);

    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
                <CheckCircle size={40} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</Text>
              <Text className="text-gray-600 text-center leading-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
                <Lock size={40} color="#EF4444" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Reset Failed</Text>
              <Text className="text-gray-600 text-center leading-6 mb-6">
                {error}
              </Text>
              <Pressable
                onPress={() => router.replace("/auth/forgot-password")}
                className="py-3 px-6 bg-emerald-500 rounded-xl active:bg-emerald-600"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </Pressable>
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
                <Lock size={40} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Set New Password</Text>
              <Text className="text-gray-600 text-center leading-6">
                Enter your new password below to complete the reset process.
              </Text>
            </View>

            <View className="space-y-6">
              <View>
                <Text className="text-gray-700 text-sm font-medium mb-2">New Password</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Lock size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 text-sm font-medium mb-2">Confirm Password</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Lock size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </Pressable>
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
                    {busy ? "Updating..." : "Update Password"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
