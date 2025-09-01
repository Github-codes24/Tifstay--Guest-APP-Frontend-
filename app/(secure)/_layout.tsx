import { Stack } from "expo-router";

export default function SecureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(guest)" />
    </Stack>
  );
}
