import { View, Text, Image, Pressable, ScrollView, Modal, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, RotateCcw, Sparkles } from "lucide-react-native";
import { useState } from "react";

export default function Review() {
  const { front, left, right } = useLocalSearchParams<{ front: string; left: string; right: string }>();
  const router = useRouter();
  const [expandedImage, setExpandedImage] = useState<{ uri: string; label: string } | null>(null);
  const screenHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Review Photos</Text>
          <Text className="text-base text-gray-600">Make sure all photos are clear and well-lit</Text>
        </View>

        {[
          { label: "Front View", uri: front, testID: "image-front" },
          { label: "Left View", uri: left, testID: "image-left" },
          { label: "Right View", uri: right, testID: "image-right" }
        ].map((p, i) => (
          <View key={i} className="mb-4">
            <View className="flex-row items-center mb-2">
              <View style={{ marginRight: 8 }}>
                <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text className="text-base font-semibold text-gray-900">{p.label}</Text>
            </View>
            <Pressable 
              testID={p.testID}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 active:opacity-90"
              onPress={() => setExpandedImage({ uri: p.uri, label: p.label })}
            >
              <Image source={{ uri: p.uri }} style={{ width: "100%", height: 240 }} resizeMode="cover" />
            </Pressable>
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

      {/* Full-size Image Modal */}
      <Modal
        visible={expandedImage !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExpandedImage(null)}
      >
        <Pressable 
          className="flex-1 bg-black/85" 
          onPress={() => setExpandedImage(null)}
        >
          <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
            {/* Header with label and close button */}
            <View className="flex-row justify-between items-center px-6 py-4">
              <Text className="text-white font-semibold text-xl">{expandedImage?.label}</Text>
              <Pressable
                onPress={() => setExpandedImage(null)}
                className="bg-emerald-500 px-4 py-2 rounded-full active:bg-emerald-600"
              >
                <Text className="text-white font-bold text-sm">Close</Text>
              </Pressable>
            </View>

            {/* Expandable Image */}
            <View className="flex-1 justify-center items-center px-4">
              <View style={{ 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10
              }}>
                {expandedImage && (
                  <Image 
                    source={{ uri: expandedImage.uri }} 
                    style={{ 
                      width: Dimensions.get('window').width - 32, 
                      height: screenHeight * 0.72,
                      borderRadius: 32,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }} 
                    resizeMode="contain" 
                  />
                )}
              </View>
            </View>

            {/* Tap anywhere hint */}
            <View className="pb-4 px-6">
              <Text className="text-white/60 text-center text-sm">Tap outside image to close</Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
