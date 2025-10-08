import "react-native-reanimated";
import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/ctx/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
