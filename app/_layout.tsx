import { Stack } from "expo-router";
import { AppStateProvider } from "../context/AppStateProvider";
import { FavoritesProvider } from "../context/FavoritesContext";
import { useAuthStore } from "@/store/authStore";

const Navigation = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={isAuthenticated} />
      <Stack.Screen name="(secure)" redirect={!isAuthenticated} />
      <Stack.Screen name="index" />
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
