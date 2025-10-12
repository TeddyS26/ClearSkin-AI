import { Stack } from "expo-router";

export default function ScanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Back gestures and hardware button are disabled globally in root layout
      }}
    />
  );
}

