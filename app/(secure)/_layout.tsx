import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function SecureLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-out" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="(account)" />
      <Stack.Screen name="my-orders" />
      <Stack.Screen name="bookingScreen" />
    </Stack>
  );
}
