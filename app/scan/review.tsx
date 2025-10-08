import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Review() {
  const { front, left, right } = useLocalSearchParams<{ front: string; left: string; right: string }>();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-xl mb-2">Review your photos</Text>
      {[{label:"Front", uri:front}, {label:"Left", uri:left}, {label:"Right", uri:right}].map((p, i) => (
        <View key={i} className="mb-4">
          <Text className="mb-2">{p.label}</Text>
          <Image source={{ uri: p.uri }} style={{ width: "100%", height: 200, borderRadius: 12 }} />
        </View>
      ))}

      <Pressable className="bg-emerald-500 py-4 rounded-xl items-center mb-3"
        onPress={() => router.push({ pathname: "/scan/loading", params: { front, left, right } })}>
        <Text className="text-white font-semibold">Analyze Photos</Text>
      </Pressable>

      <Pressable className="border border-gray-200 py-4 rounded-xl items-center"
        onPress={() => router.back()}>
        <Text>Retake</Text>
      </Pressable>
    </ScrollView>
  );
}
