import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { hasSeenOnboarding, isAuthenticated, rehydrated } = useAuthStore();

  // Wait for persisted store to hydrate before making redirect decisions.
  if (!rehydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  } else if (isAuthenticated) {
    return <Redirect href="/(secure)/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
