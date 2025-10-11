import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";

export default function Welcome() {
  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center mb-16">
          <View className="w-24 h-24 bg-emerald-500 rounded-3xl items-center justify-center mb-6 shadow-lg">
            <Sparkles size={48} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text className="text-5xl font-bold text-gray-900 mb-3">ClearSkin AI</Text>
          <Text className="text-gray-600 text-lg text-center px-8 leading-6">
            Your personal AI-powered skin analysis companion
          </Text>
        </View>

        <View className="w-full max-w-md px-6">
          <Link href="/auth/sign-up" asChild>
            <Pressable 
              className="w-full bg-emerald-500 py-5 rounded-2xl items-center mb-4 shadow-sm active:opacity-90"
              android_ripple={{ color: "#059669" }}
            >
              <Text className="text-white text-lg font-semibold">Get Started</Text>
            </Pressable>
          </Link>

          <Link href="/auth/sign-in" asChild>
            <Pressable 
              className="w-full bg-white border-2 border-emerald-200 py-5 rounded-2xl items-center active:opacity-90"
              android_ripple={{ color: "#10B98120" }}
            >
              <Text className="text-emerald-600 text-lg font-semibold">I already have an account</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
