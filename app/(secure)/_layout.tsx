import { Stack, Redirect } from "expo-router";
import { useAppState } from "../../context/AppStateProvider";

export default function SecureLayout() {
  const { user } = useAppState();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-out" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="payment" />
      {/* Rest of all screens which is not tab */}
    </Stack>
  );
}
