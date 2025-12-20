import "react-native-reanimated";
import "react-native-gesture-handler";
import "../global.css";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/ctx/AuthContext";
import { useEffect } from "react";
import { BackHandler, Platform, LogBox } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { addNotificationResponseListener } from "../src/lib/notifications";

// Suppress known non-critical warnings
LogBox.ignoreLogs([
  // Stripe NativeEventEmitter warnings (known issue, not critical)
  'new NativeEventEmitter() was called with a non-null argument without the required `addListener` method',
  'new NativeEventEmitter() was called with a non-null argument without the required `removeListeners` method',
]);

export default function RootLayout() {
  const router = useRouter();

  // Handle notification taps - navigate to scan result or capture
  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'scan_complete' && data?.scanId) {
        if (data.success) {
          router.push({ pathname: "/scan/result", params: { id: String(data.scanId) } });
        } else {
          router.push("/scan/capture");
        }
      } else if (data?.type === 'scan_reminder') {
        // User tapped the bi-weekly reminder - take them to capture screen
        router.push("/scan/capture");
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Note: Back button prevention is now handled per-screen (e.g., review, loading)
  // rather than globally, to allow natural navigation where appropriate

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || ""}
          merchantIdentifier="merchant.com.clearskin.ai" // For Apple Pay (optional)
        >
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
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
