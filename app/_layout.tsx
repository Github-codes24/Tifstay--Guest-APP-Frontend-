import { Stack } from "expo-router";
import { AppStateProvider, useAppState } from "../context/AppStateProvider";

const Navigation = () => {
  const { user } = useAppState();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={user} />
      <Stack.Screen name="(secure)" redirect={!user} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Navigation />
    </AppStateProvider>
  );
}
