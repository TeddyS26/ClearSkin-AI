import { useState } from "react";
import { View, Text, Pressable, Image, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CheckCircle, Circle } from "lucide-react-native";

export default function Capture() {
  const [front, setFront] = useState<string|undefined>();
  const [left, setLeft] = useState<string|undefined>();
  const [right, setRight] = useState<string|undefined>();
  const router = useRouter();

  const take = async (setter: (u: string)=>void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission needed", "Camera access is required.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.9, base64: false });
    if (!res.canceled && res.assets?.[0]?.uri) setter(res.assets[0].uri);
  };

  const ready = front && left && right;

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Capture Photos</Text>
          <Text className="text-base text-gray-600">Take three photos of your face from different angles</Text>
        </View>

        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8 px-4">
          <View className="items-center flex-1">
            {front ? <CheckCircle size={28} color="#10B981" strokeWidth={2.5} /> : <Circle size={28} color="#D1D5DB" strokeWidth={2} />}
            <Text className={`text-xs mt-2 ${front ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>Front</Text>
          </View>
          <View className={`flex-1 h-0.5 ${left ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <View className="items-center flex-1">
            {left ? <CheckCircle size={28} color="#10B981" strokeWidth={2.5} /> : <Circle size={28} color="#D1D5DB" strokeWidth={2} />}
            <Text className={`text-xs mt-2 ${left ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>Left</Text>
          </View>
          <View className={`flex-1 h-0.5 ${right ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <View className="items-center flex-1">
            {right ? <CheckCircle size={28} color="#10B981" strokeWidth={2.5} /> : <Circle size={28} color="#D1D5DB" strokeWidth={2} />}
            <Text className={`text-xs mt-2 ${right ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>Right</Text>
          </View>
        </View>

        {/* Front Photo */}
        <Pressable 
          className="mb-4" 
          onPress={() => take(setFront)}
          android_ripple={{ color: "#10B98120" }}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {front ? (
              <Image source={{ uri: front }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
            ) : (
              <View className="h-56 items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
                <View className="bg-emerald-100 p-5 rounded-full mb-4">
                  <Camera size={40} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900 mb-1">Front View</Text>
                <Text className="text-sm text-gray-600">Tap to capture</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Left Photo */}
        <Pressable 
          className="mb-4" 
          onPress={() => take(setLeft)}
          android_ripple={{ color: "#10B98120" }}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {left ? (
              <Image source={{ uri: left }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
            ) : (
              <View className="h-56 items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
                <View className="bg-emerald-100 p-5 rounded-full mb-4">
                  <Camera size={40} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900 mb-1">Left View</Text>
                <Text className="text-sm text-gray-600">Tap to capture</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Right Photo */}
        <Pressable 
          className="mb-6" 
          onPress={() => take(setRight)}
          android_ripple={{ color: "#10B98120" }}
        >
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {right ? (
              <Image source={{ uri: right }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
            ) : (
              <View className="h-56 items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
                <View className="bg-emerald-100 p-5 rounded-full mb-4">
                  <Camera size={40} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900 mb-1">Right View</Text>
                <Text className="text-sm text-gray-600">Tap to capture</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Continue Button */}
        <Pressable 
          disabled={!ready} 
          onPress={() => router.push({ pathname: "/scan/review", params: { front, left, right } })} 
          className={`py-5 rounded-2xl items-center shadow-sm ${ready ? "bg-emerald-500 active:opacity-90" : "bg-gray-300"}`}
          android_ripple={ready ? { color: "#059669" } : undefined}
        >
          <Text className={`text-lg font-bold ${ready ? "text-white" : "text-gray-500"}`}>
            Continue to Review
          </Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
