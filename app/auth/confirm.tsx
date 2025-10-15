import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

export default function Confirm() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    (async () => {
      try {
        // Handle initial deep link (when app is cold-started from the email link)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleUrl(initialUrl);
          return;
        }

        // If no initial URL (navigated here internally), try to read current URL from router
        // This is a no-op but keeps UX consistent
        setBusy(false);
        setMessage("You're all set. Redirecting…");
        router.replace("/subscribe");
      } catch (e: any) {
        setBusy(false);
        Alert.alert("Confirmation failed", e.message ?? String(e));
        router.replace("/auth/sign-in");
      }
    })();

    // Also subscribe to URL events in case the app is already open
    const sub = Linking.addEventListener("url", async ({ url }) => {
      await handleUrl(url);
    });
    return () => sub.remove();
  }, []);

  async function handleUrl(url: string) {
    try {
      setBusy(true);
      setMessage("Finalizing confirmation…");

      // Supabase sends tokens in the hash fragment for email links.
      // Example: clearskinai://auth/confirm#access_token=...&refresh_token=...&type=signup
      const hashIndex = url.indexOf("#");
      const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";
      const params = new URLSearchParams(fragment);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) throw error;
        setMessage("Email confirmed! Redirecting…");
        router.replace("/subscribe");
        return;
      }

      // Some flows (PKCE/OAuth) provide a `code` param instead
      const parsed = Linking.parse(url);
      const code = (parsed.queryParams?.code as string | undefined) ?? undefined;
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setMessage("Signed in. Redirecting…");
        router.replace("/subscribe");
        return;
      }

      throw new Error("No tokens found in confirmation link.");
    } catch (e: any) {
      Alert.alert("Confirmation failed", e.message ?? String(e));
      router.replace("/auth/sign-in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center p-8">
        <View className="bg-white rounded-3xl p-8 items-center w-full max-w-md">
          {busy ? (
            <ActivityIndicator size="large" color="#10B981" />
          ) : null}
          <Text className="text-lg text-gray-800 mt-4 text-center">{message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

 