import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppStateProvider } from "../context/AppStateProvider";
import { FavoritesProvider } from "../context/FavoritesContext";
import { Slot } from "expo-router";
import CustomToast from "@/components/CustomToast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min stale
      retry: 1,
    },
  },
});

// Note: we intentionally avoid reading auth store here to prevent
// early navigation decisions. Route redirects are handled in `app/index.tsx`
// after the persisted store has rehydrated.
// Keep layout minimal: render a Slot so expo-router mounts the navigator
// immediately. Any redirect decisions should happen in route-level files
// (like `app/index.tsx`) after the store has hydrated.

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <FavoritesProvider>
          {/* Render the Slot so child routes / navigators mount immediately */}
          <Slot />
          <CustomToast />
        </FavoritesProvider>
      </AppStateProvider>
    </QueryClientProvider>
  );
}