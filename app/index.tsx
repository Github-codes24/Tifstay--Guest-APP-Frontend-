import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { hasSeenOnboarding, isAuthenticated } = useAuthStore();

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  } else if (isAuthenticated) {
    return <Redirect href="/(secure)/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
