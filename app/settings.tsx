import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput, Modal, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/ctx/AuthContext";
import {
  ArrowLeft,
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
  EyeOff,
  Download,
  MessageSquare
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
  const [exportingData, setExportingData] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  async function loadSubscriptionStatus() {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Try to get subscription
      const sub = await getSubscriptionStatus();

      // If no subscription found, let's check the database directly
      if (!sub && currentUser) {
        const { data: allSubs, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false }); // Get newest first

        // Check if there's ANY subscription
        if (allSubs && allSubs.length > 0) {
          // Prioritize active or trialing subscriptions
          const activeSub = allSubs.find(s => s.status === "active" || s.status === "trialing");

          if (activeSub) {
            setSubscription(activeSub);
          } else {
            setSubscription(allSubs[0]);
          }
          return;
        }
      }

      setSubscription(sub);
    } catch (error) {
      // Error loading subscription
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
        [{
          text: "OK", onPress: () => {
            setShowPasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }
        }]
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
              router.replace("/");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account, all your scan history, and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are You Absolutely Sure?",
              "This is your last chance. All your data will be permanently deleted and cannot be recovered.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: performAccountDeletion,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      if (!user) throw new Error("No user found");

      Alert.alert("Deleting Account", "Please wait while we delete all your data...");

      // 1. Delete all images from storage
      const { data: scanSessions } = await supabase
        .from("scan_sessions")
        .select("id")
        .eq("user_id", user.id);

      if (scanSessions && scanSessions.length > 0) {
        // Delete each scan's images from storage
        for (const scan of scanSessions) {
          const folderPath = `user/${user.id}/${scan.id}`;
          try {
            // List all files in the scan folder
            const { data: files } = await supabase.storage
              .from("scan")
              .list(folderPath);

            if (files && files.length > 0) {
              // Delete all files in the folder
              const filePaths = files.map(file => `${folderPath}/${file.name}`);
              await supabase.storage.from("scan").remove(filePaths);
            }
          } catch (storageError) {
            // Continue even if storage deletion fails
          }
        }

        // Try to delete the entire user folder
        try {
          const { data: userFiles } = await supabase.storage
            .from("scan")
            .list(`user/${user.id}`);

          if (userFiles && userFiles.length > 0) {
            const userFilePaths = userFiles.map(file => `user/${user.id}/${file.name}`);
            await supabase.storage.from("scan").remove(userFilePaths);
          }
        } catch (storageError) {
          // Continue even if this fails
        }
      }

      // 2. Cancel Stripe subscription if exists
      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"]);

      if (activeSubs && activeSubs.length > 0) {
        // Call edge function to cancel Stripe subscription
        for (const sub of activeSubs) {
          if (sub.stripe_subscription_id) {
            try {
              await supabase.functions.invoke('cancel-subscription', {
                body: { subscriptionId: sub.stripe_subscription_id },
                headers: {
                  Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
              });
            } catch (cancelError) {
              // Continue even if cancellation fails - we'll still delete the account
              console.error('Failed to cancel subscription:', cancelError);
            }
          }
        }
      }

      // 3. Delete all scan sessions
      await supabase
        .from("scan_sessions")
        .delete()
        .eq("user_id", user.id);

      // 4. Delete all subscription records
      await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", user.id);

      // 5. Delete the auth user account (this will cascade to other related data)
      const { error: deleteError } = await supabase.rpc("delete_user");

      if (deleteError) {
        throw deleteError;
      }

      // 6. Sign out
      await signOut();

      Alert.alert(
        "Account Deleted",
        "Your account and all associated data have been permanently deleted.",
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Deletion Failed",
        error.message || "Failed to delete account. Please try again or contact support.",
        [{ text: "OK" }]
      );
    }
  };

  const openPrivacyPolicy = () => {
    router.push("/privacy-policy");
  };

  const openTermsOfService = () => {
    router.push("/terms-of-service");
  };

  const openContact = () => {
    router.push("/contact" as any);
  };

  const handleExportData = async () => {
    Alert.alert(
      "Export Your Data",
      "This will generate a JSON file containing all your personal data, scan history, and results. The file will be sent to your registered email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export Data",
          onPress: async () => {
            setExportingData(true);
            try {
              if (!user) throw new Error("No user found");

              // Call the edge function to export and email data
              const response = await supabase.functions.invoke('export-user-data', {
                headers: {
                  Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
              });

              // Check for errors in the response
              if (response.error && response.error.context) {
                try {
                  const errorBody = await response.error.context.text();
                  const errorData = JSON.parse(errorBody);
                  if (errorData.error) {
                    throw new Error(errorData.error);
                  }
                } catch (parseError) {
                  // If we can't parse the error, show generic message
                  throw new Error('Failed to export data. Please try again or contact support.');
                }
              }

              if (response.data && response.data.error) {
                throw new Error(response.data.error);
              }

              if (response.error) {
                throw new Error('Failed to export data. Please try again or contact support.');
              }

              Alert.alert(
                "Export Sent! 📧",
                `Your data has been sent to ${user.email}. Please check your inbox (and spam folder).\n\nThe email includes a JSON file with all your scan history and account information.`,
                [{ text: "OK" }]
              );
            } catch (error: any) {
              Alert.alert(
                "Export Failed",
                error.message || "Failed to export data. Please try again or contact support at contact@clearskinai.ca"
              );
            } finally {
              setExportingData(false);
            }
          },
        },
      ]
    );
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
      className={`bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center ${loading ? "opacity-50" : "active:opacity-70"
        }`}
      android_ripple={{ color: danger ? "#FEE2E2" : "#F3F4F6" }}
    >
      <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${danger ? "bg-red-100" : "bg-gray-100"
        }`}>
        {loading ? (
          <ActivityIndicator size="small" color={danger ? "#EF4444" : "#6B7280"} />
        ) : (
          <Icon size={24} color={danger ? "#EF4444" : "#6B7280"} strokeWidth={2} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-semibold mb-0.5 ${danger ? "text-red-600" : "text-gray-900"
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
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
        <View className="px-5 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-4 active:opacity-60"
            android_ripple={{ color: "#9CA3AF20" }}
          >
            <ArrowLeft size={24} color="#374151" strokeWidth={2.5} />
            <Text className="text-gray-700 font-semibold text-base ml-1">Back</Text>
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

          {/* Support Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Support
            </Text>
            <SettingsButton
              icon={MessageSquare}
              title="Contact & Support"
              subtitle="Get help or send us feedback"
              onPress={openContact}
            />
          </View>

          {/* Legal & Privacy Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">
              Legal & Privacy
            </Text>
            <SettingsButton
              icon={Download}
              title="Export My Data"
              subtitle="Download all your personal data (GDPR)"
              onPress={handleExportData}
              loading={exportingData}
            />
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
            <View className="h-3" />
            <View className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
              <Pressable
                onPress={handleDeleteAccount}
                className="flex-row items-center px-4 py-4 active:bg-red-50"
                android_ripple={{ color: "#FEE2E2" }}
              >
                <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
                  <User size={24} color="#EF4444" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-red-600 mb-0.5">
                    Delete Account
                  </Text>
                  <Text className="text-sm text-red-500">
                    Permanently delete your account and all data
                  </Text>
                </View>
                <ChevronRight size={20} color="#EF4444" strokeWidth={2} />
              </Pressable>
            </View>
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
                    className={`py-4 rounded-xl items-center ${changingPassword ? "bg-emerald-300" : "bg-emerald-500 active:bg-emerald-600"
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
    </>
  );
}
