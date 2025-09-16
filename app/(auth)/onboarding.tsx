import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Buttons";
import { useAuthStore } from "@/store/authStore";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedStyle,
  runOnJS,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Create a separate component for the animated dot
const AnimatedDot = ({
  index,
  scrollX,
  currentIndex,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  currentIndex: number;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const widthInterpolation = interpolate(
      scrollX.value,
      inputRange,
      index === 0 ? [8, 24, 8] : [8, 24, 8],
      Extrapolate.CLAMP
    );

    const opacityInterpolation = interpolate(
      scrollX.value,
      inputRange,
      index === 0 ? [0.5, 1, 0.5] : [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );

    const scale = currentIndex === index ? 1.2 : 0.8;

    return {
      width: widthInterpolation,
      opacity: opacityInterpolation,
      transform: [{ scale: withSpring(scale) }],
    };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: "#FF6B00" }, animatedDotStyle]}
    />
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useAnimatedRef<Animated.FlatList<any>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setHasSeenOnboarding } = useAuthStore();

  // Reanimated values
  const scrollX = useSharedValue(0);
  const fadeAnim = useSharedValue(1);

  const handleGetStarted = () => {
    setHasSeenOnboarding(true);
    router.replace("/login");
  };

  useEffect(() => {
    if (currentIndex === 0) {
      const timer = setTimeout(() => {
        // Animate the fade effect
        fadeAnim.value = withTiming(0.3, { duration: 200 }, () => {
          fadeAnim.value = withTiming(1, { duration: 200 });
        });

        // Scroll to next screen with spring animation
        scrollRef.current?.scrollToIndex({ index: 1, animated: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;

      // Update current index based on scroll position
      const newIndex = Math.round(event.contentOffset.x / width);
      if (newIndex !== currentIndex) {
        runOnJS(setCurrentIndex)(newIndex);
      }
    },
    onMomentumEnd: (event) => {
      // Ensure proper snapping to page
      const offsetX = event.contentOffset.x;
      const newIndex = Math.round(offsetX / width);

      if (newIndex !== currentIndex) {
        runOnJS(setCurrentIndex)(newIndex);
      }
    },
  });

  // Animated dots component with Reanimated
  const AnimatedDots = () => {
    return (
      <View style={styles.fixedDotsContainer}>
        <View style={styles.dotsContainer}>
          {[0, 1].map((index) => (
            <AnimatedDot
              key={index}
              index={index}
              scrollX={scrollX}
              currentIndex={currentIndex}
            />
          ))}
        </View>
      </View>
    );
  };

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
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </ImageBackground>
  );

  const renderOnboarding = () => (
    <SafeAreaView style={styles.onboardingContainer}>
      <Animated.View
        style={[styles.onboardingContent, { opacity: fadeAnim }]}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
      >
        <View style={styles.onboardingLogoSection}>
          <Animated.View
            style={styles.onboardingLogoContainer}
            entering={FadeIn.delay(200).duration(600)}
          >
            <Image
              source={require("../../assets/images/logoSub.png")}
              style={styles.onboardingLogo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.Text
            style={styles.brandName}
            entering={FadeIn.delay(300).duration(600)}
          >
            Tifstay
          </Animated.Text>
          <Animated.Text
            style={styles.onboardingSubtitle}
            entering={FadeIn.delay(400).duration(600)}
          >
            Find home-style meals &{"\n"}hostels in one app.
          </Animated.Text>
        </View>

        <View style={styles.middleSection}>
          <Animated.Image
            source={require("../../assets/images/food-tray.png")}
            style={styles.foodImage}
            resizeMode="cover"
            entering={FadeIn.delay(500).duration(700)}
          />

          <Animated.View entering={FadeIn.delay(600).duration(800)}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              width={width - 48}
              height={56}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );

  const screens = [
    { key: "splash", render: renderSplash },
    { key: "onboarding", render: renderOnboarding },
  ];

  return (
    <View style={styles.mainContainer}>
      <Animated.FlatList
        ref={scrollRef}
        data={screens}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={{ width }}>{item.render()}</View>
        )}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        bounces={false}
      />
      <AnimatedDots />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  fixedDotsContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
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
  logo: {
    width: 228,
    tintColor: "#004AAD",
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  onboardingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 100,
  },
  onboardingLogoSection: {
    alignItems: "center",
    marginTop: 40,
  },
  onboardingLogoContainer: {
    width: 87,
    height: 87,
    backgroundColor: "#ffff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  onboardingLogo: {
    width: 67,
    height: 46,
    tintColor: "#004AAD",
  },
  middleSection: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
    paddingTop: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  foodImage: {
    width: width - 48,
    height: (width - 48) * 0.6,
    borderRadius: 16,
  },
});