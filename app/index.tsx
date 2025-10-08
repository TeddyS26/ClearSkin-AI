import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Welcome() {
  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-4xl mb-2">ClearSkin AI</Text>
      <Text className="text-gray-600 mb-12 text-center">AI-powered skin analysis</Text>

      <Link href="/auth/sign-up" asChild>
        <Pressable className="w-full bg-emerald-500 py-4 rounded-xl items-center mb-3">
          <Text className="text-white font-semibold">Get Started</Text>
        </Pressable>
      </Link>

      <Link href="/auth/sign-in" asChild>
        <Pressable className="w-full border border-emerald-200 py-4 rounded-xl items-center">
          <Text className="text-emerald-700 font-semibold">I already have an account</Text>
        </Pressable>
      </Link>
    </View>
  );
}
