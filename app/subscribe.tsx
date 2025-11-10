import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/ctx/AuthContext";
import { createSubscriptionPayment, hasActiveSubscription } from "../src/lib/billing";
import { Crown, Check, X, Sparkles, Info } from "lucide-react-native";
import { useStripe } from "@stripe/stripe-react-native";

export default function Subscribe() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // If not authenticated, redirect to sign-in
  if (!authLoading && !user) return <Redirect href="/auth/sign-in" />;

  useEffect(() => {
    // Check if user already has active subscription
    async function checkSubscription() {
      try {
        const active = await hasActiveSubscription();
        setHasSubscription(active);
        if (active) {
          // User already has subscription, redirect to home
          router.replace("/(tabs)/home");
        }
      } catch (e) {
        // Error checking subscription
      } finally {
        setCheckingSubscription(false);
      }
    }

    if (user && !authLoading) {
      checkSubscription();
    }
  }, [user, authLoading]);

  // Also check when the screen comes into focus (e.g., returning from checkout)
  useEffect(() => {
    const checkOnFocus = async () => {
      if (user) {
        const active = await hasActiveSubscription();
        if (active) {
          router.replace("/(tabs)/home");
        }
      }
    };

    // Check immediately on mount
    checkOnFocus();

    // Set up interval to check periodically (in case webhook is processing)
    const interval = setInterval(checkOnFocus, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleSubscribe = async () => {
    try {
      setBusy(true);
      
      // Step 1: Create subscription payment intent
      const { paymentIntent, ephemeralKey, customer } = await createSubscriptionPayment();
      
      // Step 2: Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'ClearSkin AI',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          email: user?.email,
        },
        returnURL: 'clearskinai://checkout/success',
        // Enable Apple Pay
        applePay: {
          merchantCountryCode: 'US',
        },
        // Enable Google Pay
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: false, // Production mode
        },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setBusy(false);
        return;
      }

      setBusy(false);

      // Step 3: Present the payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          // User cancelled, do nothing
          return;
        }
        Alert.alert('Payment Error', paymentError.message);
      } else {
        // Payment successful!
        setCheckingSubscription(true);
        
        // Poll for subscription activation
        let attempts = 0;
        while (attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const active = await hasActiveSubscription();
          if (active) {
            setCheckingSubscription(false);
            Alert.alert(
              "Welcome to Premium! 🎉",
              "Your subscription is now active. You have unlimited access to all features.",
              [
                { text: "Start Scanning!", onPress: () => router.replace("/(tabs)/home") }
              ]
            );
            return;
          }
          attempts++;
        }
        
        // If subscription not detected after polling, show success anyway
        setCheckingSubscription(false);
        Alert.alert(
          "Payment Successful!",
          "Your subscription is being activated. You'll have access shortly.",
          [
            { text: "Continue", onPress: () => router.replace("/(tabs)/home") }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert("Subscription Error", e.message ?? String(e));
      setBusy(false);
      setCheckingSubscription(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)/home");
  };

  if (authLoading || checkingSubscription) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  // Don't show subscription page if user already has one
  if (hasSubscription) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-amber-400 rounded-3xl items-center justify-center mb-4 shadow-lg">
              <Crown size={40} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-2">Unlock Premium</Text>
            <Text className="text-gray-600 text-base text-center px-4">
              Get unlimited access to AI-powered skin analysis
            </Text>
          </View>

          {/* Pricing Card */}
          <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
            <View className="items-center mb-6">
              <View className="flex-row items-baseline">
                <Text className="text-5xl font-bold text-emerald-600 mb-1">$3.33</Text>
                <Text className="text-sm text-gray-500 ml-2">USD</Text>
              </View>
              <Text className="text-lg text-gray-600">per month</Text>
            </View>

            <View className="gap-4 mb-6">
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Unlimited skin scans</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">AI-powered analysis</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Personalized recommendations</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Track your skin progress over time</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Cancel anytime</Text>
              </View>
            </View>

            <Pressable 
              disabled={busy} 
              onPress={handleSubscribe} 
              className={`py-5 rounded-2xl items-center ${busy ? "bg-emerald-300" : "bg-emerald-500 active:bg-emerald-600"}`}
              android_ripple={{ color: "#059669" }}
            >
              <Text className="text-white text-lg font-semibold">
                {busy ? "Processing..." : "Subscribe Now"}
              </Text>
            </Pressable>
          </View>

          {/* Free Tier Card */}
          <View className="bg-gray-50 border-2 border-gray-300 rounded-3xl p-8 shadow-sm mb-6">
            <View className="items-center mb-6">
              <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center mb-3">
                <Info size={24} color="#6B7280" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-gray-700 mb-1">Free Tier</Text>
              <Text className="text-base text-gray-600">What you get without subscribing</Text>
            </View>

            <View className="gap-4 mb-4">
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Browse all app sections</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">View your scan history</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Check size={16} color="#10B981" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-700 flex-1">Access previous scan results</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3">
                  <X size={16} color="#EF4444" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-500 flex-1 line-through">Perform new skin scans</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3">
                  <X size={16} color="#EF4444" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-500 flex-1 line-through">Get AI-powered analysis</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3">
                  <X size={16} color="#EF4444" strokeWidth={3} />
                </View>
                <Text className="text-base text-gray-500 flex-1 line-through">Receive personalized skincare routines</Text>
              </View>
            </View>
          </View>

          {/* Skip Button */}
          <Pressable 
            onPress={handleSkip} 
            className="py-4 rounded-2xl items-center bg-gray-100 border border-gray-300 active:bg-gray-200"
            android_ripple={{ color: "#D1D5DB" }}
          >
            <Text className="text-gray-700 text-base font-semibold">Skip for Now</Text>
          </Pressable>

          {/* Legal Text */}
          <Text className="text-xs text-gray-500 text-center mt-6 px-4 leading-4">
            By subscribing, you agree to our Terms of Service. Your subscription will auto-renew monthly until cancelled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

