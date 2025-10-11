import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/ctx/AuthContext";
import { Camera, TrendingUp, Droplet, Zap } from "lucide-react-native";
import { latestCompletedScan } from "../../src/lib/scan";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const scan = await latestCompletedScan();
        setLatestScan(scan);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculate days ago
  const getDaysAgo = () => {
    if (!latestScan?.created_at) return "No scans yet";
    const scanDate = new Date(latestScan.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - scanDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Calculate improvement from previous scan
  const getImprovement = () => {
    // This would ideally compare with previous scan
    // For now, we'll use a placeholder
    return latestScan?.skin_score ? 5 : 0;
  };

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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-5 pt-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-gray-900 text-3xl font-bold mb-1">
              Hello, {userName.charAt(0).toUpperCase() + userName.slice(1)}
            </Text>
            <Text className="text-gray-600 text-base">
              Your skin journey continues
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
                    <CircularProgress value={latestScan.skin_score ?? 82} size={90} strokeWidth={8} />
                  </View>

                  {/* Score Info */}
                  <View className="flex-1 pt-2">
                    <View className="flex-row items-center mb-2">
                      <View style={{ marginRight: 6 }}>
                        <TrendingUp size={20} color="#10B981" strokeWidth={2} />
                      </View>
                      <Text className="text-gray-900 text-lg font-semibold">
                        Skin Score
                      </Text>
                    </View>
                    <Text className="text-gray-700 text-sm mb-2">
                      Your skin is showing improvement
                    </Text>
                    <Text className="text-emerald-500 text-sm font-medium">
                      +{getImprovement()} from last scan
                    </Text>
                  </View>
                </View>

                {/* Potential and Skin Type */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-600 text-xs mb-1">
                      Potential
                    </Text>
                    <Text className="text-gray-900 text-xl font-bold">
                      {latestScan.skin_potential ?? 92}%
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
          <Pressable 
            onPress={() => router.push("/scan/capture")}
            className="bg-emerald-500 rounded-3xl py-4 mb-6 flex-row items-center justify-center shadow-sm active:opacity-90"
            android_ripple={{ color: "#059669" }}
          >
            <View style={{ marginRight: 10 }}>
              <Camera size={22} color="white" strokeWidth={2} />
            </View>
            <Text className="text-white text-base font-semibold">
              Take a New Scan
            </Text>
          </Pressable>

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
