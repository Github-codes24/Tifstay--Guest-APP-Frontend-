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
      <Stack.Screen name="(tabs)" />
      {/* Rest of all screens which is not tab */}
    </Stack>
  );
}
