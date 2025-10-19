import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import * as AuthSession from "expo-auth-session";
import { Mail, CheckCircle, ArrowRight } from "lucide-react-native";

export default function CheckEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const email = params.email as string;

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert("Error", "No email address found");
      return;
    }

    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: "https://www.clearskinai.ca/confirm.html"
        }
      });
      
      if (error) throw error;
      
      Alert.alert("Email sent", "Please check your inbox for the confirmation email.");
      setCountdown(30); // Start 30-second countdown
    } catch (error: any) {
      Alert.alert("Failed to resend", error.message || "Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
              <Mail size={40} color="#10B981" strokeWidth={2} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
            <Text className="text-gray-600 text-center leading-6">
              We've sent a confirmation link to{" "}
              <Text className="font-semibold text-gray-900">{email}</Text>
            </Text>
          </View>

          <View className="space-y-4">
            <View className="bg-emerald-50 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <CheckCircle size={20} color="#10B981" />
                <Text className="text-emerald-800 font-semibold ml-2">What's next?</Text>
              </View>
              <Text className="text-emerald-700 text-sm leading-5">
                1. Open the email we just sent{"\n"}
                2. Tap the "Confirm Your Email" button{"\n"}
                3. You'll be redirected back to the app
              </Text>
            </View>

            <Pressable 
              onPress={handleResendEmail}
              disabled={resending || countdown > 0}
              className={`py-4 rounded-2xl items-center mt-4 mb-6 ${
                resending || countdown > 0 ? "bg-gray-300" : "bg-emerald-500 active:bg-emerald-600"
              }`}
              android_ripple={{ color: "#059669" }}
            >
              <Text className="text-white text-lg font-semibold">
                {resending 
                  ? "Sending..." 
                  : countdown > 0 
                    ? `Resend in ${countdown}s` 
                    : "Resend confirmation email"
                }
              </Text>
            </Pressable>

            <View className="pt-4 border-t border-gray-200">
              <Text className="text-center text-gray-600 mb-4">
                Already confirmed your email?
              </Text>
              <Link href="/auth/sign-in" asChild>
                <Pressable className="flex-row items-center justify-center py-3 px-6 bg-white border-2 border-emerald-200 rounded-2xl active:bg-emerald-50">
                  <Text className="text-emerald-600 font-semibold mr-2">Continue to sign in</Text>
                  <ArrowRight size={20} color="#10B981" />
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
