import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated, BackHandler, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createScanSession, uploadThreePhotos, callAnalyzeFunction, waitForScanComplete, isValidScan, deleteScan } from "../../src/lib/scan";
import { Sparkles, Upload, Brain, CheckCircle, Camera } from "lucide-react-native";

export default function Loading() {
  const { front, left, right, context } = useLocalSearchParams<{ front: string; left: string; right: string; context?: string }>();
  const [msg, setMsg] = useState("Starting…");
  const [err, setErr] = useState<string | null>(null);
  const [isInvalidScan, setIsInvalidScan] = useState(false);
  const router = useRouter();
  const [pulseAnim] = useState(new Animated.Value(1));

  // Prevent back navigation during analysis
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

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
        await callAnalyzeFunction(scanId, paths, context?.trim() || undefined);

        setMsg("Finishing up…");
        const row = await waitForScanComplete(scanId, 90_000, 2000);

        if (row.status === "complete") {
          // Check if the scan has valid face detection
          if (isValidScan(row)) {
            router.replace({ pathname: "/scan/result", params: { id: scanId } });
          } else {
            // Invalid scan - no face detected, delete the scan record
            try {
              await deleteScan(scanId);
            } catch {
              // Ignore delete errors
            }
            setIsInvalidScan(true);
            setErr("We couldn't detect a face in your photos. Please make sure your face is clearly visible and well-lit, then try again.");
          }
        } else {
          setErr("Analysis failed. Please try again.");
        }
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, []);

  const getIcon = () => {
    if (isInvalidScan) return <Camera size={80} color="#F59E0B" strokeWidth={2} />;
    if (err) return <CheckCircle size={80} color="#EF4444" strokeWidth={2} />;
    if (msg.includes("Uploading")) return <Upload size={80} color="#10B981" strokeWidth={2} />;
    if (msg.includes("Analyzing")) return <Brain size={80} color="#10B981" strokeWidth={2} />;
    return <Sparkles size={80} color="#10B981" strokeWidth={2} />;
  };

  const getTitle = () => {
    if (isInvalidScan) return "Face Not Detected";
    if (err) return "Something went wrong";
    return "Analyzing your skin";
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-50 items-center justify-center p-6" edges={["top"]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mb-8">
        <View className={`${isInvalidScan ? 'bg-amber-100' : 'bg-emerald-100'} p-8 rounded-full`}>
          {getIcon()}
        </View>
      </Animated.View>

      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {getTitle()}
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
        <View className="items-center">
          <Pressable
            onPress={() => router.replace("/scan/capture")}
            className={`${isInvalidScan ? 'bg-amber-500' : 'bg-emerald-500'} px-8 py-4 rounded-2xl active:opacity-90 shadow-sm mt-4`}
            android_ripple={{ color: isInvalidScan ? "#D97706" : "#059669" }}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
