import { Stack } from "expo-router";
import { useAppState } from "../../context/AppStateProvider";
import { Redirect } from "expo-router";

export default function SecureLayout() {
  const { user } = useAppState();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="(tiffin)" />
      <Stack.Screen name="(hostels)" />
    </Stack>
  );
}
