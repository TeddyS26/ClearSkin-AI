import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createScanSession, uploadThreePhotos, callAnalyzeFunction, waitForScanComplete } from "../../src/lib/scan";
import { Sparkles, Upload, Brain, CheckCircle } from "lucide-react-native";

export default function Loading() {
  const { front, left, right } = useLocalSearchParams<{ front: string; left: string; right: string }>();
  const [msg, setMsg] = useState("Starting…");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setMsg("Creating session…");
        const { scanId, userId } = await createScanSession();

        setMsg("Uploading photos…");
        const paths = await uploadThreePhotos(scanId, userId, { front: front!, left: left!, right: right! });

        setMsg("Analyzing your skin…");
        await callAnalyzeFunction(scanId, paths);

        setMsg("Finishing up…");
        const row = await waitForScanComplete(scanId, 90_000, 2000);

        if (row.status === "complete") {
          router.replace({ pathname: "/scan/result", params: { id: scanId } });
        } else {
          setErr("Analysis failed. Please try again.");
        }
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, []);

  const getIcon = () => {
    if (err) return <CheckCircle size={80} color="#EF4444" strokeWidth={2} />;
    if (msg.includes("Uploading")) return <Upload size={80} color="#10B981" strokeWidth={2} />;
    if (msg.includes("Analyzing")) return <Brain size={80} color="#10B981" strokeWidth={2} />;
    return <Sparkles size={80} color="#10B981" strokeWidth={2} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-50 items-center justify-center p-6" edges={["top"]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mb-8">
        <View className="bg-emerald-100 p-8 rounded-full">
          {getIcon()}
        </View>
      </Animated.View>

      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {err ? "Something went wrong" : "Analyzing your skin"}
      </Text>
      
      <Text className="text-base text-gray-600 text-center mb-8 px-4">
        {err ?? msg}
      </Text>

      {!err && (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#10B981" />
          <Text className="text-sm text-emerald-600 font-medium">
            This may take a moment...
          </Text>
        </View>
      )}

      {err && (
        <Text className="text-sm text-red-500 text-center mt-4">
          Please go back and try again
        </Text>
      )}
    </SafeAreaView>
  );
}
