import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/ctx/AuthContext";
import { Calendar, UserCircle, Sparkles, Shield, TrendingUp } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";

type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export default function ProfileSetup() {
  const { user, checkProfileComplete } = useAuth();
  const router = useRouter();
  
  const [profileGender, setProfileGender] = useState<GenderOption | null>(null);
  const [profileDOB, setProfileDOB] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isValidDate = (dateString: string): boolean => {
    // Expected format: YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const today = new Date();
    
    // Must be a valid date, between 13 and 120 years old
    return !isNaN(date.getTime()) && 
           year >= 1900 && 
           year <= today.getFullYear() - 13 &&
           date <= today;
  };

  const handleSaveProfile = async () => {
    // Validate inputs
    if (!profileGender) {
      Alert.alert("Required", "Please select your gender");
      return;
    }

    if (!profileDOB) {
      Alert.alert("Required", "Please enter your date of birth");
      return;
    }

    if (!isValidDate(profileDOB)) {
      Alert.alert("Invalid Date", "Please enter a valid date in YYYY-MM-DD format. You must be at least 13 years old.");
      return;
    }

    const age = calculateAge(profileDOB);

    setSavingProfile(true);
    try {
      if (!user) throw new Error("No user found");

      // Upsert profile (insert if not exists, update if exists)
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          gender: profileGender,
          date_of_birth: profileDOB,
          age: age,
          profile_edited: true,
          profile_edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Update auth context
      await checkProfileComplete();

      // Navigate to main app
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert(
        "Save Failed",
        error.message || "Failed to save profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "bottom"]}>
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-8 pb-6">
            <View className="w-16 h-16 bg-emerald-100 rounded-2xl items-center justify-center mb-4">
              <UserCircle size={32} color="#10B981" strokeWidth={2} />
            </View>
            <Text className="text-gray-900 text-3xl font-bold mb-2">
              Complete Your Profile
            </Text>
            <Text className="text-gray-600 text-base leading-6">
              Help us personalize your skin analysis by providing some basic information about yourself.
            </Text>
          </View>

          {/* Benefits */}
          <View className="px-6 mb-6">
            <View className="bg-emerald-50 rounded-2xl p-4 gap-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Sparkles size={16} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-emerald-800 text-sm flex-1">
                  Get accurate skin age estimation
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <TrendingUp size={16} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-emerald-800 text-sm flex-1">
                  Compare your skin age to your actual age
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                  <Shield size={16} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-emerald-800 text-sm flex-1">
                  Personalized product recommendations
                </Text>
              </View>
            </View>
          </View>

          <View className="px-6">
            {/* Gender Selection */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-semibold mb-3">Gender</Text>
              <Text className="text-gray-600 text-sm mb-3">
                Male and female skin have different characteristics that affect analysis accuracy.
              </Text>
              <View className="gap-2">
                {[
                  { value: 'male' as GenderOption, label: 'Male' },
                  { value: 'female' as GenderOption, label: 'Female' },
                  { value: 'other' as GenderOption, label: 'Other' },
                  { value: 'prefer_not_to_say' as GenderOption, label: 'Prefer not to say' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setProfileGender(option.value)}
                    className={`flex-row items-center p-4 rounded-xl border ${
                      profileGender === option.value
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      profileGender === option.value
                        ? "border-emerald-500"
                        : "border-gray-400"
                    }`}>
                      {profileGender === option.value && (
                        <View className="w-3 h-3 rounded-full bg-emerald-500" />
                      )}
                    </View>
                    <Text className={`text-base ${
                      profileGender === option.value
                        ? "text-emerald-700 font-medium"
                        : "text-gray-700"
                    }`}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date of Birth Input */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-semibold mb-2">Date of Birth</Text>
              <Text className="text-gray-600 text-sm mb-3">
                Your age helps us compare your skin age to your actual age.
              </Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 border border-gray-200">
                <Calendar size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  value={profileDOB}
                  onChangeText={setProfileDOB}
                  placeholder="YYYY-MM-DD (e.g., 1995-06-15)"
                  className="flex-1 py-4 px-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="default"
                  maxLength={10}
                />
              </View>
              <Text className="text-gray-500 text-xs mt-2">
                Format: YYYY-MM-DD • Must be at least 13 years old
              </Text>
            </View>

            {/* Privacy Note */}
            <View className="bg-gray-100 rounded-xl p-4 mb-8">
              <Text className="text-gray-600 text-sm leading-5">
                🔒 Your information is kept private and secure. It{"'"}s only used to improve your skin analysis results and is never shared with third parties.
              </Text>
            </View>

            {/* Continue Button */}
            <Pressable
              onPress={handleSaveProfile}
              disabled={savingProfile || !profileGender || !profileDOB}
              className={`py-4 rounded-xl items-center ${
                savingProfile || !profileGender || !profileDOB
                  ? "bg-gray-300"
                  : "bg-emerald-500 active:bg-emerald-600"
              }`}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Continue to App
                </Text>
              )}
            </Pressable>

            {/* Note about one-time */}
            <Text className="text-gray-400 text-xs text-center mt-4">
              Note: This information can only be set once during account setup.
            </Text>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
