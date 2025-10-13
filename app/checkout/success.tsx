import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import { hasActiveSubscription } from "../../src/lib/billing";

export default function CheckoutSuccess() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Poll for subscription activation
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      const active = await hasActiveSubscription();
      
      if (active || attempts > 10) {
        setChecking(false);
        clearInterval(checkInterval);
        // Wait a moment then redirect
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 1500);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 bg-emerald-500 rounded-full items-center justify-center mb-6">
          <CheckCircle size={56} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Payment Successful! 🎉
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          {checking 
            ? "Activating your subscription..."
            : "Your subscription is now active. You have unlimited access to all features!"}
        </Text>
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-500 text-sm mt-4">
          {checking ? "Please wait..." : "Redirecting to home..."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

