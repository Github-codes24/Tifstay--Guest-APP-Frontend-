import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppStateProvider } from "../context/AppStateProvider";
import { FavoritesProvider } from "../context/FavoritesContext";
import { useAuthStore } from "@/store/authStore";
import CustomToast from "@/components/CustomToast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min stale
      cacheTime: 10 * 60 * 1000, // 10 min cache
      retry: 1,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <FavoritesProvider>
          <Navigation />
          <CustomToast />
        </FavoritesProvider>
      </AppStateProvider>
    </QueryClientProvider>
  );
}