import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { hasSeenOnboarding, isAuthenticated } = useAuthStore();

  // Navigation logic
  if (!hasSeenOnboarding) {
    // First time user - show onboarding
    return <Redirect href="/(auth)/onboarding" />;
  } else if (isAuthenticated) {
    // User is logged in - go to dashboard
    return <Redirect href="/(secure)/(tabs)" />;
  } else {
    // User has seen onboarding but not logged in - go to login
    return <Redirect href="/(auth)/login" />;
  }
}
