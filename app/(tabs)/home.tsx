import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/ctx/AuthContext";
import { Camera, TrendingUp, TrendingDown, Droplet, Zap, Crown, Lock } from "lucide-react-native";
import { latestCompletedScan, getRecentCompletedScans } from "../../src/lib/scan";
import { supabase } from "../../src/lib/supabase";
import { hasActiveSubscription } from "../../src/lib/billing";
import Svg, { Circle } from "react-native-svg";

// Circular Progress Component
function CircularProgress({ 
  value, 
  size = 100, 
  strokeWidth = 8 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - value) / 100) * circumference;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text className="text-gray-900 text-3xl font-bold">{value}</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const userName = user?.email?.split('@')[0] || 'there';
  const [latestScan, setLatestScan] = useState<any>(null);
  const [previousScan, setPreviousScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const scans = await getRecentCompletedScans(2);
      setLatestScan(scans[0] || null);
      setPreviousScan(scans[1] || null);
      
      // Check subscription status
      const subStatus = await hasActiveSubscription();
      setHasSubscription(subStatus);
      setCheckingSubscription(false);
    } catch (error) {
      console.error("Error fetching latest scan:", error);
      setCheckingSubscription(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  // Set up real-time subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('scan_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // When a scan is inserted or updated, refresh the data
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCheckingSubscription(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Calculate days ago
  const getDaysAgo = () => {
    if (!latestScan?.created_at) return "No scans yet";
    const scanDate = new Date(latestScan.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - scanDate.getTime());
    const hoursAgo = diffTime / (1000 * 60 * 60);
    
    // If less than 24 hours ago, show "Today"
    if (hoursAgo < 24) return "Today";
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Calculate improvement from previous scan
  const getImprovement = () => {
    if (!latestScan?.skin_score || !previousScan?.skin_score) return null;
    return latestScan.skin_score - previousScan.skin_score;
  };

  const improvementValue = getImprovement();

  // Get oiliness status text based on percentage
  const getOilinessStatus = (percent: number) => {
    if (percent < 30) return "Low";
    if (percent < 50) return "Normal";
    if (percent < 70) return "High";
    return "Very High";
  };

  // Get pore health status text based on score
  const getPoreHealthStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs attention";
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        <View className="px-5 pt-6">
          {/* Subscription Status Banner */}
          {!checkingSubscription && !hasSubscription && (
            <Pressable
              onPress={() => router.push("/subscribe")}
              className="bg-gradient-to-r bg-emerald-500 rounded-2xl p-4 mb-6 shadow-sm active:opacity-90"
              android_ripple={{ color: "#059669" }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                  <Crown size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base mb-0.5">
                    Unlock Premium Features
                  </Text>
                  <Text className="text-white/90 text-sm">
                    Subscribe now for unlimited skin scans
                  </Text>
                </View>
                <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-lg">›</Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* Header */}
          <View className="mb-6">
            <Text className="text-gray-900 text-3xl font-bold mb-1">
              Hello, {userName.charAt(0).toUpperCase() + userName.slice(1)}
            </Text>
            <Text className="text-gray-600 text-base">
              {checkingSubscription 
                ? "Welcome back" 
                : hasSubscription 
                ? "Your skin journey continues" 
                : "Browse your skin history"}
            </Text>
          </View>

          {/* Latest Scan Card */}
          <Pressable 
            onPress={() => router.push("/(tabs)/latest")}
            className="bg-white rounded-3xl p-6 mb-5 shadow-sm active:opacity-90"
            android_ripple={{ color: "#10B98120" }}
          >
            {/* Card Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-gray-900 text-base font-semibold">
                Latest Scan
              </Text>
              <Text className="text-gray-500 text-sm">
                {getDaysAgo()}
              </Text>
            </View>

            {latestScan ? (
              <>
                {/* Score and Description */}
                <View className="flex-row items-start mb-5">
                  {/* Circular Progress */}
                  <View style={{ marginRight: 20 }}>
                    <CircularProgress value={latestScan.skin_score ?? 0} size={90} strokeWidth={8} />
                  </View>

                  {/* Score Info */}
                  <View className="flex-1 pt-2">
                    <View className="flex-row items-center mb-2">
                      <View style={{ marginRight: 6 }}>
                        {improvementValue !== null && improvementValue > 0 ? (
                          <TrendingUp size={20} color="#10B981" strokeWidth={2} />
                        ) : improvementValue !== null && improvementValue < 0 ? (
                          <TrendingDown size={20} color="#EF4444" strokeWidth={2} />
                        ) : (
                          <TrendingUp size={20} color="#6B7280" strokeWidth={2} />
                        )}
                      </View>
                      <Text className="text-gray-900 text-lg font-semibold">
                        Skin Score
                      </Text>
                    </View>
                    <Text className="text-gray-700 text-sm mb-2">
                      {improvementValue !== null && improvementValue > 0
                        ? "Your skin is showing improvement"
                        : improvementValue !== null && improvementValue < 0
                        ? "Your score has decreased slightly"
                        : improvementValue === 0
                        ? "Your score remains stable"
                        : "Track your progress with more scans"}
                    </Text>
                    {improvementValue !== null && improvementValue !== 0 && (
                      <Text className={`text-sm font-medium ${improvementValue > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {improvementValue > 0 ? '+' : ''}{improvementValue} from last scan
                      </Text>
                    )}
                  </View>
                </View>

                {/* Potential and Skin Type */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-600 text-xs mb-1">
                      Potential
                    </Text>
                    <Text className="text-gray-900 text-xl font-bold">
                      {latestScan.skin_potential ?? "—"}%
                    </Text>
                  </View>
                  <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-600 text-xs mb-1">
                      Skin Type
                    </Text>
                    <Text className="text-gray-900 text-xl font-bold capitalize">
                      {latestScan.skin_type ?? "Normal"}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View className="py-6">
                <Text className="text-gray-600 text-center text-base mb-2">
                  No scans yet
                </Text>
                <Text className="text-gray-500 text-center text-sm">
                  Start your first scan to track your skin health
                </Text>
              </View>
            )}
          </Pressable>

          {/* Take a New Scan Button */}
          {checkingSubscription ? (
            // Loading state - show neutral button while checking subscription
            <View className="rounded-3xl py-4 mb-6 flex-row items-center justify-center shadow-sm bg-gray-200">
              <Text className="text-base font-semibold text-gray-400">
                Loading...
              </Text>
            </View>
          ) : (
            <Pressable 
              onPress={() => hasSubscription ? router.push("/scan/capture") : router.push("/subscribe")}
              className={`rounded-3xl py-4 mb-6 flex-row items-center justify-center shadow-sm ${
                hasSubscription 
                  ? "bg-emerald-500 active:opacity-90" 
                  : "bg-gray-300 active:opacity-90"
              }`}
              android_ripple={{ color: hasSubscription ? "#059669" : "#D1D5DB" }}
            >
              <View style={{ marginRight: 10 }}>
                {hasSubscription ? (
                  <Camera size={22} color="white" strokeWidth={2} />
                ) : (
                  <Lock size={22} color="#9CA3AF" strokeWidth={2} />
                )}
              </View>
              <Text className={`text-base font-semibold ${
                hasSubscription ? "text-white" : "text-gray-500"
              }`}>
                {hasSubscription ? "Take a New Scan" : "Subscribe to Scan"}
              </Text>
            </Pressable>
          )}

          {/* Quick Insights */}
          {latestScan && (
            <View>
              <Text className="text-gray-900 text-lg font-bold mb-4">
                Quick Insights
              </Text>

              {/* Oiliness */}
              {latestScan.oiliness_percent != null && (
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-cyan-100 w-12 h-12 rounded-2xl items-center justify-center" style={{ marginRight: 12 }}>
                        <Droplet size={24} color="#06B6D4" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-semibold mb-0.5">
                          Oiliness
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {getOilinessStatus(latestScan.oiliness_percent)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-900 text-lg font-bold">
                      {latestScan.oiliness_percent}%
                    </Text>
                  </View>
                  {/* Progress Bar */}
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-green-600 rounded-full" 
                      style={{ width: `${latestScan.oiliness_percent}%` }}
                    />
                  </View>
                </View>
              )}

              {/* Pore Health */}
              {latestScan.pore_health != null && (
                <View className="bg-white rounded-3xl p-5 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-amber-100 w-12 h-12 rounded-2xl items-center justify-center" style={{ marginRight: 12 }}>
                        <Zap size={24} color="#F59E0B" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-semibold mb-0.5">
                          Pore Health
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {getPoreHealthStatus(latestScan.pore_health)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-900 text-lg font-bold">
                      {latestScan.pore_health}/100
                    </Text>
                  </View>
                  {/* Progress Bar */}
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-green-600 rounded-full" 
                      style={{ width: `${latestScan.pore_health}%` }}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
