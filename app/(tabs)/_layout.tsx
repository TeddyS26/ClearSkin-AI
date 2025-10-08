import { Tabs, useRouter, Redirect } from "expo-router";
import { useAuth } from "../../src/ctx/AuthContext";
import { Pressable, View } from "react-native";
import { Home, Sun, Camera, Activity, History } from "lucide-react-native";

function CenterScanButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/scan/capture")}>
      <View className="w-16 h-16 -mt-6 rounded-full bg-black items-center justify-center">
        <Camera size={28} color="white" />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/auth/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="scan-placeholder" options={{ title: "", tabBarButton: () => <CenterScanButton /> }} />
      <Tabs.Screen name="routine" options={{ title: "Routine", tabBarIcon: ({ color, size }) => <Sun color={color} size={size} /> }} />
      <Tabs.Screen name="latest" options={{ title: "Latest", tabBarIcon: ({ color, size }) => <Activity color={color} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }} />
    </Tabs>
  );
}
