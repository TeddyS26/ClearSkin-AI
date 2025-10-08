import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/ctx/AuthContext";

export default function Home() {
  const { user, signOut } = useAuth();
  return (
    <View className="flex-1 bg-white p-6 gap-4">
      <Text className="text-xl">Welcome {user?.email ?? ""}</Text>
      <Link href="/scan/capture" asChild>
        <Pressable className="bg-emerald-500 py-4 rounded-xl items-center"><Text className="text-white font-semibold">Start a scan</Text></Pressable>
      </Link>
      <Pressable onPress={signOut} className="border border-gray-200 py-3 rounded-xl items-center"><Text>Sign out</Text></Pressable>
    </View>
  );
}
