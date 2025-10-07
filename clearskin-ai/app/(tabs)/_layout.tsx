import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useAuth } from '../../src/ctx/AuthContext';

function CenterScanButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/scan/capture')}>
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        alignItems:'center', justifyContent:'center',
        marginBottom: 12, // lifts above bar a bit
        backgroundColor: '#111'
      }}>
        <Ionicons name="camera" size={28} color="#fff" />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (!loading && !user) return <Redirect href='/' />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#111' }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />)
        }}
      />
      <Tabs.Screen
        name="scan-placeholder"
        options={{
          title: '',
          tabBarIconStyle: { display: 'none' },
          tabBarLabel: () => null,
          tabBarButton: () => <CenterScanButton />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Routine',
          tabBarIcon: ({ color, size }) => (<Ionicons name="sunny" size={size} color={color} />)
        }}
      />
      <Tabs.Screen
        name="latest"
        options={{
          title: 'Latest',
          tabBarIcon: ({ color, size }) => (<Ionicons name="medkit" size={size} color={color} />)
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (<Ionicons name="time" size={size} color={color} />)
        }}
      />
    </Tabs>
  );
}
