import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";
import Animated, { useSharedValue, withTiming, FadeIn, FadeOut } from "react-native-reanimated";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useSharedValue(1);

  const { hasSeenOnboarding, isAuthenticated, rehydrated, setHasSeenOnboarding } = useAuthStore();

  // Wait for auth store rehydration
  if (!rehydrated) return null; // show nothing until store is loaded

  // Redirect if user has already seen onboarding or is authenticated
  useEffect(() => {
    if (hasSeenOnboarding || isAuthenticated) {
      router.replace("/(secure)/(tabs)");
    }
  }, [hasSeenOnboarding, isAuthenticated]);

  // Handle "Get Started" or splash auto-navigation
  useEffect(() => {
    // Only run if first-time user
    if (!hasSeenOnboarding && !isAuthenticated) {
      const timer = setTimeout(() => {
        setHasSeenOnboarding(true); // mark onboarding as seen
        router.replace("/login"); // navigate to login
      }, 2000); // 2 seconds splash
      return () => clearTimeout(timer);
    }
  }, []);

  const renderSplash = () => (
    <ImageBackground
      source={require("../../assets/images/background.png")}
      style={styles.background}
      resizeMode="contain"
    >
      <Animated.View
        style={[styles.container, { opacity: fadeAnim }]}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/newlogo.png")}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </ImageBackground>
  );

  // Render nothing if already seen onboarding or authenticated
  if (hasSeenOnboarding || isAuthenticated) return null;

  return <View style={styles.mainContainer}>{renderSplash()}</View>;
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
});
