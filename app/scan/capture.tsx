import { useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

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
    <View className="flex-1 bg-white p-6">
      <Text className="text-xl mb-4">Capture three photos</Text>

      <Pressable className="mb-3" onPress={() => take(setFront)}>
        <Text className="text-emerald-600 mb-2">Front</Text>
        {front ? <Image source={{ uri: front }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
               : <View className="h-44 bg-gray-100 rounded-xl items-center justify-center"><Text>Tap to capture</Text></View>}
      </Pressable>

      <Pressable className="mb-3" onPress={() => take(setLeft)}>
        <Text className="text-emerald-600 mb-2">Left</Text>
        {left ? <Image source={{ uri: left }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
              : <View className="h-44 bg-gray-100 rounded-xl items-center justify-center"><Text>Tap to capture</Text></View>}
      </Pressable>

      <Pressable className="mb-6" onPress={() => take(setRight)}>
        <Text className="text-emerald-600 mb-2">Right</Text>
        {right ? <Image source={{ uri: right }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
               : <View className="h-44 bg-gray-100 rounded-xl items-center justify-center"><Text>Tap to capture</Text></View>}
      </Pressable>

      <Pressable disabled={!ready} onPress={() =>
        router.push({ pathname: "/scan/review", params: { front, left, right } })
      } className={`py-4 rounded-xl items-center ${ready ? "bg-emerald-500" : "bg-gray-300"}`}>
        <Text className="text-white font-semibold">Review</Text>
      </Pressable>
    </View>
  );
}
