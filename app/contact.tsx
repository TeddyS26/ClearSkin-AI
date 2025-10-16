import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/ctx/AuthContext";
import { ArrowLeft, Mail, Send, MessageSquare, User, Smartphone } from "lucide-react-native";
import { supabase } from "../src/lib/supabase";
import { openContactEmail } from "../src/lib/contact";

export default function Contact() {
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    // Validate inputs
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter your message");
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert("Error", "Please enter a more detailed message (at least 10 characters)");
      return;
    }

    setSending(true);
    try {
      // Call the edge function to send the contact email
      const response = await supabase.functions.invoke('send-contact-email', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          userEmail: user?.email || 'Unknown',
          userName: user?.user_metadata?.full_name || 'Unknown User'
        },
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
          throw new Error('Failed to send message. Please try again.');
        }
      }

      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.error) {
        throw new Error('Failed to send message. Please try again.');
      }

      Alert.alert(
        "Message Sent! 📧",
        "Thank you for contacting us! We'll get back to you as soon as possible.",
        [
          {
            text: "OK",
            onPress: () => {
              setSubject("");
              setMessage("");
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Failed to Send",
        error.message || "Failed to send message via app. Would you like to open your email client instead?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Email",
            onPress: () => openContactEmail(subject, message)
          }
        ]
      );
    } finally {
      setSending(false);
    }
  };

  const handleOpenEmailClient = () => {
    openContactEmail(subject, message);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-5 pt-6 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center mb-4 active:opacity-60"
              android_ripple={{ color: "#9CA3AF20" }}
            >
              <ArrowLeft size={24} color="#374151" strokeWidth={2.5} />
              <Text className="text-gray-700 font-semibold text-base ml-1">Back</Text>
            </Pressable>
            <Text className="text-gray-900 text-3xl font-bold mb-1">Contact & Support</Text>
            <Text className="text-gray-600 text-base">
              We're here to help! Send us a message and we'll get back to you soon.
            </Text>
          </View>

          {/* Contact Form */}
          <View className="px-5">
            {/* Contact Info Card */}
            <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-emerald-100 rounded-xl items-center justify-center mr-4">
                  <Mail size={24} color="#10B981" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    Get in Touch
                  </Text>
                  <Text className="text-sm text-gray-600">
                    We typically respond within 24 hours
                  </Text>
                </View>
              </View>
              <View className="bg-emerald-50 rounded-xl p-3">
                <Text className="text-xs text-emerald-700 font-medium">
                  📧 contact@clearskinai.ca
                </Text>
              </View>
            </View>

            {/* Subject Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Subject</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 border border-gray-200 shadow-sm">
                <MessageSquare size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="What's this about?"
                  className="flex-1 py-4 px-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                />
              </View>
              <Text className="text-gray-500 text-xs mt-1">
                {subject.length}/100 characters
              </Text>
            </View>

            {/* Message Input */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-medium mb-2">Your Message</Text>
              <View className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tell us how we can help you..."
                  className="text-gray-900 min-h-[120px] text-base"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>
              <Text className="text-gray-500 text-xs mt-1">
                {message.length}/1000 characters
              </Text>
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleSendMessage}
              disabled={sending || !subject.trim() || !message.trim()}
              className={`py-4 rounded-xl items-center mb-3 ${
                sending || !subject.trim() || !message.trim()
                  ? "bg-gray-300"
                  : "bg-emerald-500 active:bg-emerald-600"
              }`}
              android_ripple={{ color: "#059669" }}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center">
                  <Send size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-base font-semibold ml-2">
                    Send Message
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Alternative: Open Email Client Button */}
            <Pressable
              onPress={handleOpenEmailClient}
              disabled={!subject.trim() && !message.trim()}
              className={`py-3 rounded-xl items-center mb-4 border-2 ${
                !subject.trim() && !message.trim()
                  ? "border-gray-200 bg-gray-50"
                  : "border-blue-500 bg-blue-50 active:bg-blue-100"
              }`}
              android_ripple={{ color: "#3B82F6" }}
            >
              <View className="flex-row items-center">
                <Smartphone size={18} color={!subject.trim() && !message.trim() ? "#9CA3AF" : "#3B82F6"} strokeWidth={2} />
                <Text className={`text-sm font-medium ml-2 ${
                  !subject.trim() && !message.trim() ? "text-gray-400" : "text-blue-600"
                }`}>
                  Open Email App Instead
                </Text>
              </View>
            </Pressable>

            {/* Help Text */}
            <View className="bg-blue-50 rounded-xl p-4">
              <Text className="text-blue-800 text-sm font-medium mb-1">
                💡 Need help faster?
              </Text>
              <Text className="text-blue-700 text-xs leading-5">
                For urgent issues, you can also email us directly at{" "}
                <Text className="font-semibold">contact@clearskinai.ca</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
