import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, RotateCcw, Sparkles, ArrowLeft } from "lucide-react-native";

export default function Review() {
  const { front, left, right } = useLocalSearchParams<{ front: string; left: string; right: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Review Photos</Text>
          <Text className="text-base text-gray-600">Make sure all photos are clear and well-lit</Text>
        </View>

        {[
          { label: "Front View", uri: front },
          { label: "Left View", uri: left },
          { label: "Right View", uri: right }
        ].map((p, i) => (
          <View key={i} className="mb-4">
            <View className="flex-row items-center mb-2">
              <View style={{ marginRight: 8 }}>
                <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text className="text-base font-semibold text-gray-900">{p.label}</Text>
            </View>
            <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: 240 }} resizeMode="cover" />
            </View>
          </View>
        ))}

        {/* Analyze Button */}
        <Pressable 
          className="bg-emerald-500 py-5 rounded-2xl items-center mb-4 shadow-sm flex-row justify-center active:opacity-90"
          android_ripple={{ color: "#059669" }}
          onPress={() => router.push({ pathname: "/scan/loading", params: { front, left, right } })}
        >
          <View style={{ marginRight: 8 }}>
            <Sparkles size={22} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text className="text-white font-bold text-lg">Start Analysis</Text>
        </Pressable>

        {/* Retake Button */}
        <Pressable 
          className="bg-white border-2 border-gray-200 py-5 rounded-2xl items-center flex-row justify-center active:opacity-90"
          android_ripple={{ color: "#10B98120" }}
          onPress={() => router.back()}
        >
          <View style={{ marginRight: 8 }}>
            <RotateCcw size={20} color="#6B7280" />
          </View>
          <Text className="text-gray-700 font-semibold text-base">Retake Photos</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
