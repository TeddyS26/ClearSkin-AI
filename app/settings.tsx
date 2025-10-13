import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/ctx/AuthContext";
import { 
  ChevronLeft, 
  CreditCard, 
  Lock, 
  LogOut, 
  Crown,
  ChevronRight,
  User,
  FileText,
  Shield,
  X,
  Eye,
  EyeOff
} from "lucide-react-native";
import { openBillingPortal, getSubscriptionStatus } from "../src/lib/billing";
import { supabase } from "../src/lib/supabase";

export default function Settings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  async function loadSubscriptionStatus() {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("👤 Current User ID:", currentUser?.id);
      
      // Try to get subscription
      const sub = await getSubscriptionStatus();
      console.log("📊 Subscription data:", JSON.stringify(sub, null, 2));
      console.log("📊 Subscription status:", sub?.status);
      console.log("📊 Is active?", sub?.status === "active");
      
      // If no subscription found, let's check the database directly
      if (!sub && currentUser) {
        const { data: allSubs, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false }); // Get newest first
        
        console.log("🔍 Direct DB query - All subscriptions:", JSON.stringify(allSubs, null, 2));
        console.log("🔍 Direct DB query - Error:", error);
        
        // Check if there's ANY subscription
        if (allSubs && allSubs.length > 0) {
          console.log("✅ Found subscription(s) in database:", allSubs.length);
          
          // Prioritize active or trialing subscriptions
          const activeSub = allSubs.find(s => s.status === "active" || s.status === "trialing");
          
          if (activeSub) {
            console.log("✅ Using ACTIVE subscription:", activeSub.id);
            setSubscription(activeSub);
          } else {
            console.log("⚠️ No active subscription found, using most recent:", allSubs[0].status);
            setSubscription(allSubs[0]);
          }
          return;
        }
      }
      
      setSubscription(sub);
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleManageSubscription = async () => {
    try {
      await openBillingPortal();
      // Refresh subscription status after returning from portal
      setTimeout(() => loadSubscriptionStatus(), 1000);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open billing portal");
    }
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      // First, verify the current password by trying to sign in with it
      if (!user?.email) {
        Alert.alert("Error", "User email not found");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert("Error", "Current password is incorrect");
        setChangingPassword(false);
        return;
      }

      // If verification successful, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert(
        "Success",
        "Your password has been changed successfully",
        [{ text: "OK", onPress: () => {
          setShowPasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/auth/sign-in");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL("https://clearskinai.com/privacy");
  };

  const openTermsOfService = () => {
    Linking.openURL("https://clearskinai.com/terms");
  };

  const SettingsButton = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    danger = false,
    loading = false 
  }: { 
    icon: any; 
    title: string; 
    subtitle?: string; 
    onPress: () => void; 
    danger?: boolean;
    loading?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center ${
        loading ? "opacity-50" : "active:opacity-70"
      }`}
      android_ripple={{ color: danger ? "#FEE2E2" : "#F3F4F6" }}
    >
      <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
        danger ? "bg-red-100" : "bg-gray-100"
      }`}>
        {loading ? (
          <ActivityIndicator size="small" color={danger ? "#EF4444" : "#6B7280"} />
        ) : (
          <Icon size={24} color={danger ? "#EF4444" : "#6B7280"} strokeWidth={2} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-semibold mb-0.5 ${
          danger ? "text-red-600" : "text-gray-900"
        }`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-600">{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
    </Pressable>
  );

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <View className="bg-gray-50 rounded-2xl p-4 mb-3">
      <Text className="text-xs text-gray-600 mb-1">{label}</Text>
      <Text className="text-base text-gray-900 font-medium">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm active:opacity-70 mb-4"
            android_ripple={{ color: "#F3F4F6" }}
          >
            <ChevronLeft size={24} color="#374151" strokeWidth={2} />
          </Pressable>
          <Text className="text-gray-900 text-3xl font-bold mb-1">Settings</Text>
          <Text className="text-gray-600 text-base">
            Manage your account and preferences
          </Text>
        </View>

        <View className="px-5">
          {/* Account Information Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Account Information
            </Text>
            <InfoCard label="Email" value={user?.email || "Not available"} />
          </View>

          {/* Subscription Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Subscription
            </Text>
            
            {/* Debug Info - Remove this after testing */}
            {!loading && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                <Text className="text-yellow-800 text-xs font-bold mb-1">DEBUG INFO:</Text>
                {subscription ? (
                  <>
                    <Text className="text-yellow-700 text-xs">Status: {subscription.status || 'null'}</Text>
                    <Text className="text-yellow-700 text-xs">ID: {subscription.id || 'null'}</Text>
                    <Text className="text-yellow-700 text-xs">Stripe Sub ID: {subscription.stripe_subscription_id || 'null'}</Text>
                    <Text className="text-yellow-700 text-xs">Created: {subscription.created_at || 'null'}</Text>
                  </>
                ) : (
                  <Text className="text-yellow-700 text-xs">No subscription record found in database</Text>
                )}
              </View>
            )}
            
            {loading ? (
              <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : subscription && (subscription.status === "active" || subscription.status === "trialing") ? (
              <>
                <View className="bg-white rounded-2xl p-5 mb-3 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-amber-100 rounded-xl items-center justify-center mr-4">
                      <Crown size={24} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 mb-0.5">
                        Premium Subscription
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Active and ready to use
                      </Text>
                    </View>
                  </View>
                  <View className="bg-emerald-50 rounded-xl p-3">
                    <Text className="text-xs text-emerald-700 font-medium">
                      ✓ Unlimited scans • AI Analysis • Progress Tracking
                    </Text>
                  </View>
                </View>
                <SettingsButton
                  icon={CreditCard}
                  title="Manage Subscription"
                  subtitle="Update payment method or cancel"
                  onPress={handleManageSubscription}
                />
              </>
            ) : (
              <View className="bg-white rounded-2xl p-5 shadow-sm">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-4">
                    <User size={24} color="#6B7280" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-0.5">
                      Free Plan
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Upgrade to unlock all features
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push("/subscribe")}
                  className="bg-emerald-500 rounded-xl py-3 items-center active:opacity-90"
                  android_ripple={{ color: "#059669" }}
                >
                  <Text className="text-white font-semibold text-base">
                    Upgrade to Premium
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Security Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Security
            </Text>
            <SettingsButton
              icon={Lock}
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => setShowPasswordModal(true)}
            />
          </View>

          {/* Legal & Privacy Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Legal & Privacy
            </Text>
            <SettingsButton
              icon={Shield}
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={openPrivacyPolicy}
            />
            <SettingsButton
              icon={FileText}
              title="Terms of Service"
              subtitle="Our terms and conditions"
              onPress={openTermsOfService}
            />
          </View>

          {/* Account Actions Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Account Actions
            </Text>
            <SettingsButton
              icon={LogOut}
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
            />
          </View>

          {/* App Version */}
          <View className="items-center py-6">
            <Text className="text-gray-500 text-sm">ClearSkin AI</Text>
            <Text className="text-gray-400 text-xs mt-1">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-2xl font-bold">Change Password</Text>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:opacity-70"
              >
                <X size={20} color="#374151" strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Current Password</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Lock size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrentPassword}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">New Password</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Lock size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Must be at least 8 characters</Text>
              </View>

              {/* Confirm New Password */}
              <View className="mb-6">
                <Text className="text-gray-700 text-sm font-medium mb-2">Confirm New Password</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Lock size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 py-4 px-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <Pressable
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  className={`py-4 rounded-xl items-center ${
                    changingPassword ? "bg-emerald-300" : "bg-emerald-500 active:bg-emerald-600"
                  }`}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Change Password
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="py-4 rounded-xl items-center bg-gray-100 active:bg-gray-200"
                >
                  <Text className="text-gray-700 text-base font-semibold">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
