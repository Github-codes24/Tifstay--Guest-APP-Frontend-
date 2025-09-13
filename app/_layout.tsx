import { Stack } from "expo-router";
import { AppStateProvider, useAppState } from "../context/AppStateProvider";
import { FavoritesProvider } from "../context/FavoritesContext";

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
      <FavoritesProvider>
        <Navigation />
      </FavoritesProvider>
    </AppStateProvider>
  );
}
