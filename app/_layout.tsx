import "react-native-reanimated";
import "react-native-gesture-handler";
import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/ctx/AuthContext";
import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

export default function RootLayout() {
  // Disable Android hardware back button globally
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Return true to prevent default back behavior
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              gestureEnabled: false, // Disable iOS swipe back gesture globally
              fullScreenGestureEnabled: false, // Disable full screen gesture on iOS
              animation: 'default',
            }} 
          />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
