import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Animated, BackHandler, Pressable, AppState, AppStateStatus } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createScanSession, uploadThreePhotos, callAnalyzeFunction, waitForScanComplete, isValidScan, deleteScan, getScan } from "../../src/lib/scan";
import { hasActiveSubscription } from "../../src/lib/billing";
import { Sparkles, Upload, Brain, CheckCircle, Camera } from "lucide-react-native";

export default function Loading() {
  const { front, left, right, context } = useLocalSearchParams<{ front: string; left: string; right: string; context?: string }>();
  const [msg, setMsg] = useState("Starting…");
  const [err, setErr] = useState<string | null>(null);
  const [isInvalidScan, setIsInvalidScan] = useState(false);
  const router = useRouter();
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Track the scan ID, free tier status, and app state for background handling
  const scanIdRef = useRef<string | null>(null);
  const isFreeTierRef = useRef<boolean>(false);
  const appState = useRef(AppState.currentState);
  const processingComplete = useRef(false);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App came back to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // If we have a scan ID and processing hasn't completed, check its status
        if (scanIdRef.current && !processingComplete.current) {
          try {
            const row = await getScan(scanIdRef.current);
            if (row.status === "complete") {
              processingComplete.current = true;
              if (isValidScan(row)) {
                router.replace({ pathname: "/scan/result", params: { id: scanIdRef.current, isFreeTier: String(isFreeTierRef.current) } });
              } else {
                try {
                  await deleteScan(scanIdRef.current);
                } catch {
                  // Ignore delete errors
                }
                setIsInvalidScan(true);
                setErr("We couldn't detect a face in your photos. Please make sure your face is clearly visible and well-lit, then try again.");
              }
            } else if (row.status === "failed") {
              processingComplete.current = true;
              setErr("Analysis failed. Please try again.");
            }
            // If still processing, the main useEffect will continue polling
          } catch (e) {
            // Ignore errors, main useEffect will handle
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      if (processingComplete.current) return;
      
      try {
        // Check if user is on free tier (no subscription)
        const hasSubscription = await hasActiveSubscription();
        isFreeTierRef.current = !hasSubscription;
        console.log("Scan loading - hasSubscription:", hasSubscription, "isFreeTier:", isFreeTierRef.current);
        
        setMsg("Creating session…");
        const { scanId, userId } = await createScanSession();
        scanIdRef.current = scanId;

        setMsg("Uploading photos…");
        const paths = await uploadThreePhotos(scanId, userId, { front: front!, left: left!, right: right! });

        setMsg("Analyzing your skin…");
        await callAnalyzeFunction(scanId, paths, context?.trim() || undefined);

        setMsg("Finishing up…");
        const row = await waitForScanComplete(scanId, 180_000, 2500); // Increased timeout to 3 minutes

        if (processingComplete.current) return; // Already handled by app state change
        processingComplete.current = true;

        if (row.status === "complete") {
          // Check if the scan has valid face detection
          if (isValidScan(row)) {
            router.replace({ pathname: "/scan/result", params: { id: scanId, isFreeTier: String(isFreeTierRef.current) } });
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
        <View className="items-center">
          <View className="flex-row items-center gap-2 mb-6">
            <ActivityIndicator size="small" color="#10B981" />
            <Text className="text-sm text-emerald-600 font-medium">
              This may take up to a minute...
            </Text>
          </View>
          

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
