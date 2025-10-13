import { Tabs, useRouter, Redirect } from "expo-router";
import { useAuth } from "../../src/ctx/AuthContext";
import { Pressable, View, Platform } from "react-native";
import { Home, Sun, Camera, Activity, History, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { hasActiveSubscription } from "../../src/lib/billing";

function CenterScanButton() {
  const router = useRouter();
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Check subscription status
    async function checkSub() {
      const active = await hasActiveSubscription();
      setHasSubscription(active);
    }
    checkSub();
    
    // Recheck periodically
    const interval = setInterval(checkSub, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Pressable 
      onPress={() => hasSubscription ? router.push("/scan/capture") : router.push("/subscribe")}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View 
        className={`w-20 h-20 rounded-full items-center justify-center shadow-lg ${
          hasSubscription ? "bg-emerald-500" : "bg-gray-400"
        }`} 
        style={{
          shadowColor: hasSubscription ? "#10B981" : "#9CA3AF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {hasSubscription ? (
          <Camera size={36} color="white" strokeWidth={2.5} />
        ) : (
          <Lock size={36} color="white" strokeWidth={2.5} />
        )}
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/auth/sign-in" />;

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color, size }) => <Home color={color} size={28} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="latest" 
        options={{ 
          title: "Latest", 
          tabBarIcon: ({ color, size }) => <Activity color={color} size={28} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="scan-placeholder" 
        options={{ 
          title: "", 
          tabBarButton: (props) => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <CenterScanButton />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="routine" 
        options={{ 
          title: "Routine", 
          tabBarIcon: ({ color, size }) => <Sun color={color} size={28} strokeWidth={2} /> 
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: "History", 
          tabBarIcon: ({ color, size }) => <History color={color} size={28} strokeWidth={2} /> 
        }} 
      />
    </Tabs>
  );
}
