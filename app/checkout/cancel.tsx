import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { XCircle } from "lucide-react-native";

export default function CheckoutCancel() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center mb-6">
          <XCircle size={56} color="#6B7280" strokeWidth={2.5} />
        </View>
        <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Checkout Cancelled
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          No worries! You can subscribe anytime to unlock premium features.
        </Text>
        
        <Pressable 
          onPress={() => router.replace("/(tabs)/home")}
          className="bg-emerald-500 px-8 py-4 rounded-2xl active:opacity-90"
          android_ripple={{ color: "#059669" }}
        >
          <Text className="text-white text-base font-semibold">Go to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

