import { Stack } from "expo-router";
import { AppStateProvider, useAppState } from "../context/AppStateProvider";

const Navigation = () => {
  const { user } = useAppState();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={user} />
      <Stack.Screen name="(secure)" redirect={!user} />
       <Stack.Screen name="profile1" options={{ headerShown: false }} />

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
