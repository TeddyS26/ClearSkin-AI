import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, XCircle } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";

export default function Confirm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    handleConfirmation();
  }, []);

  const handleConfirmation = async () => {
    try {
      // Get the token from URL params
      const token = params.token as string;
      const type = params.type as string;

      if (!token) {
        setStatus("error");
        setMessage("Invalid confirmation link");
        setTimeout(() => router.replace("/auth/sign-in"), 3000);
        return;
      }

      // Verify the email with Supabase
      if (type === "signup" || type === "email") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Confirmation failed");
          setTimeout(() => router.replace("/auth/sign-in"), 3000);
        } else {
          setStatus("success");
          setMessage("Email confirmed successfully!");
          setTimeout(() => router.replace("/(tabs)/home"), 2000);
        }
      } else {
        // For other confirmation types, redirect to sign in
        setStatus("success");
        setMessage("Email confirmed! Please sign in.");
        setTimeout(() => router.replace("/auth/sign-in"), 2000);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage("An error occurred during confirmation");
      setTimeout(() => router.replace("/auth/sign-in"), 3000);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        {status === "loading" && (
          <>
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="text-gray-900 text-xl font-semibold mt-6">
              Confirming your email...
            </Text>
            <Text className="text-gray-600 text-base mt-2 text-center">
              Please wait a moment
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
              <CheckCircle size={48} color="#10B981" strokeWidth={2.5} />
            </View>
            <Text className="text-gray-900 text-2xl font-bold text-center mb-3">
              Success!
            </Text>
            <Text className="text-gray-600 text-base text-center">
              {message}
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-4">
              Redirecting you...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
              <XCircle size={48} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text className="text-gray-900 text-2xl font-bold text-center mb-3">
              Oops!
            </Text>
            <Text className="text-gray-600 text-base text-center">
              {message}
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-4">
              Redirecting you to sign in...
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

