import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Image, Alert, ScrollView, ActivityIndicator } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CheckCircle, Circle, ArrowLeft, Crown, Lock } from "lucide-react-native";
import { authorizeScan } from "../../src/lib/scan";
import * as ImageManipulator from 'expo-image-manipulator';

type CaptureMode = "front" | "left" | "right" | null;

export default function Capture() {
  const [front, setFront] = useState<string|undefined>();
  const [left, setLeft] = useState<string|undefined>();
  const [right, setRight] = useState<string|undefined>();
  const [captureMode, setCaptureMode] = useState<CaptureMode>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    // Check if user is authorized to scan
    async function checkAuth() {
      try {
        const result = await authorizeScan();
        setIsAuthorized(result.allowed);
        setAuthInfo(result);
      } catch (e) {
        setIsAuthorized(false);
      }
    }
    checkAuth();
  }, []);

  const handleSubscribe = () => {
    router.push("/subscribe");
  };

  const take = async (mode: CaptureMode) => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission needed", "Camera access is required.");
        return;
      }
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission needed", "Camera access is required.");
        return;
      }
    }
    setCaptureMode(mode);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        // Flip the image horizontally to correct the mirror effect from front camera
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ flip: ImageManipulator.FlipType.Horizontal }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        const correctedUri = manipulatedImage.uri;
        
        if (captureMode === "front") setFront(correctedUri);
        else if (captureMode === "left") setLeft(correctedUri);
        else if (captureMode === "right") setRight(correctedUri);
      }
      
      setCaptureMode(null);
    } catch (error) {
      Alert.alert("Error", "Failed to capture photo");
      setCaptureMode(null);
    }
  };

  const ready = front && left && right;

  const getModeTitle = () => {
    if (captureMode === "front") return "Front View";
    if (captureMode === "left") return "Left View";
    if (captureMode === "right") return "Right View";
    return "";
  };

  // Camera View UI
  if (captureMode) {
    return (
      <View className="flex-1 bg-black">
        <CameraView 
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          mirror={false}
        >
          {/* Top Section with Title */}
          <View style={{ paddingTop: 60, paddingBottom: 20, alignItems: 'center' }}>
            <Text className="text-white text-xl font-semibold">{getModeTitle()}</Text>
          </View>

          {/* Middle Section with Face Guide */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Instruction Text Above Frame */}
            <Text className="text-white text-base font-medium text-center mb-8 px-8">
              Position your face within the frame
            </Text>

            {/* Face Guide Oval with Corner Brackets */}
            <View style={{ width: 280, height: 400, position: 'relative' }}>
              {/* Oval Border */}
              <View 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderWidth: 3,
                  borderColor: '#10B981',
                  borderRadius: 140,
                }}
              />
              
              {/* Top-Left Corner Bracket */}
              <View style={{ position: 'absolute', top: 0, left: 0 }}>
                <View style={{ width: 40, height: 3, backgroundColor: '#10B981' }} />
                <View style={{ width: 3, height: 40, backgroundColor: '#10B981' }} />
              </View>
              
              {/* Top-Right Corner Bracket */}
              <View style={{ position: 'absolute', top: 0, right: 0 }}>
                <View style={{ width: 40, height: 3, backgroundColor: '#10B981', marginLeft: 'auto' }} />
                <View style={{ width: 3, height: 40, backgroundColor: '#10B981', marginLeft: 'auto' }} />
              </View>
              
              {/* Bottom-Left Corner Bracket */}
              <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
                <View style={{ width: 3, height: 40, backgroundColor: '#10B981' }} />
                <View style={{ width: 40, height: 3, backgroundColor: '#10B981' }} />
              </View>
              
              {/* Bottom-Right Corner Bracket */}
              <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
                <View style={{ width: 3, height: 40, backgroundColor: '#10B981', marginLeft: 'auto' }} />
                <View style={{ width: 40, height: 3, backgroundColor: '#10B981', marginLeft: 'auto' }} />
              </View>
            </View>
          </View>

          {/* Bottom Section with Capture Button */}
          <View style={{ paddingBottom: 50, alignItems: 'center' }}>
            <Pressable
              onPress={capturePhoto}
              style={{ opacity: 1 }}
              testID="capture-button"
            >
              <View style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                borderWidth: 4, 
                borderColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent'
              }}>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32, 
                  backgroundColor: 'white' 
                }} />
              </View>
            </Pressable>
            
            {/* Cancel Button */}
            <Pressable
              onPress={() => setCaptureMode(null)}
              style={{ marginTop: 20 }}
              testID="cancel-camera-button"
            >
              <Text className="text-white text-base font-medium">Cancel</Text>
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  }

  // Loading state
  if (isAuthorized === null) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-600 mt-4">Checking access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Paywall screen - user not authorized
  if (!isAuthorized) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
        >
          <View className="flex-1">
            {/* Back Button */}
            <Pressable
              onPress={() => router.push("/(tabs)/home")}
              className="flex-row items-center mb-6 active:opacity-60"
              android_ripple={{ color: "#10B98120" }}
            >
              <ArrowLeft size={24} color="#10B981" strokeWidth={2.5} />
              <Text className="text-emerald-600 font-semibold text-base ml-1">Back</Text>
            </Pressable>

            {/* Icon and Title */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-amber-400 rounded-3xl items-center justify-center mb-4 shadow-lg">
                <Lock size={48} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Subscription Required
              </Text>
              <Text className="text-gray-600 text-base text-center px-4">
                You need an active subscription or scan credits to perform skin analysis
              </Text>
            </View>

            {/* Pricing Card */}
            <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <View className="items-center mb-6">
                <Crown size={32} color="#F59E0B" strokeWidth={2} />
                <Text className="text-4xl font-bold text-emerald-600 mt-4 mb-1">$3.33</Text>
                <Text className="text-base text-gray-600">per month</Text>
              </View>

              <View className="gap-3 mb-6">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                    <CheckCircle size={16} color="#10B981" strokeWidth={3} />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">Unlimited skin scans</Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                    <CheckCircle size={16} color="#10B981" strokeWidth={3} />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">AI-powered analysis</Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                    <CheckCircle size={16} color="#10B981" strokeWidth={3} />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">Personalized recommendations</Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3">
                    <CheckCircle size={16} color="#10B981" strokeWidth={3} />
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">Cancel anytime</Text>
                </View>
              </View>

              <Pressable 
                onPress={handleSubscribe} 
                className="py-5 rounded-2xl items-center bg-emerald-500 active:bg-emerald-600"
                android_ripple={{ color: "#059669" }}
              >
                <Text className="text-white text-lg font-semibold">Subscribe Now</Text>
              </Pressable>
            </View>

            {/* Info */}
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <Text className="text-sm text-blue-800 text-center">
                Subscribe to get unlimited access to all skin analysis features
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Photo Selection UI
  return (
    <SafeAreaView className="flex-1 bg-emerald-50" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-6">
        {/* Back Button */}
        <Pressable
          onPress={() => router.push("/(tabs)/home")}
          className="flex-row items-center mb-4 active:opacity-60"
          android_ripple={{ color: "#10B98120" }}
        >
          <ArrowLeft size={24} color="#10B981" strokeWidth={2.5} />
          <Text className="text-emerald-600 font-semibold text-base ml-1">Back</Text>
        </Pressable>

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
          onPress={() => take("front")}
          android_ripple={{ color: "#10B98120" }}
          testID="front-photo-button"
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
          onPress={() => take("left")}
          android_ripple={{ color: "#10B98120" }}
          testID="left-photo-button"
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
          onPress={() => take("right")}
          android_ripple={{ color: "#10B98120" }}
          testID="right-photo-button"
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
          testID="continue-button"
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
