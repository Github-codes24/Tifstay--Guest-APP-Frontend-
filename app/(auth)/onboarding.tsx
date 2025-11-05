import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2000); // ⏱ show splash for 2 seconds
    return () => clearTimeout(timer);
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
