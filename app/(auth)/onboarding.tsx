import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Buttons";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setHasSeenOnboarding } = useAuthStore();

  const handleGetStarted = () => {
    // Mark onboarding as completed
    setHasSeenOnboarding(true);
    // Navigate to login
    router.replace("/login");
  };

  // Animation values
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-advance from splash after 3 seconds
  useEffect(() => {
    if (currentIndex === 0) {
      const timer = setTimeout(() => {
        // Add fade animation before scrolling
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        flatListRef.current?.scrollToIndex({ index: 1, animated: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleServiceSelect = (serviceId: number) => {
    router.push({
      pathname: "/login",
      params: { serviceType: serviceId },
    });
  };

  // Animated dots component
  const AnimatedDots = () => {
    const inputRange = [0, width];

    return (
      <View style={styles.dotsWrapper}>
        <View style={styles.dotsContainer}>
          {[0, 1].map((index) => {
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: index === 0 ? [24, 8] : [8, 24],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: index === 0 ? [1, 0.5] : [0.5, 1],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: opacity,
                    backgroundColor:
                      currentIndex === index ? "#FF6B00" : "#E0E0E0",
                  },
                ]}
              />
            );
          })}
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
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <AnimatedDots />
    </ImageBackground>
  );

  const renderOnboarding = () => (
    <SafeAreaView style={styles.onboardingContainer}>
      <Animated.View style={[styles.onboardingContent, { opacity: fadeAnim }]}>
        <View style={styles.onboardingLogoSection}>
          <View style={styles.onboardingLogoContainer}>
            <Image
              source={require("../../assets/images/logoSub.png")}
              style={styles.onboardingLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Tifstay</Text>
          <Text style={styles.onboardingSubtitle}>
            Find home-style meals &{"\n"}hostels in one app.
          </Text>
        </View>

        <View style={styles.middleSection}>
          <Image
            source={require("../../assets/images/food-tray.png")}
            style={styles.foodImage}
            resizeMode="cover"
          />

          <Button
            title="Get Started"
            onPress={handleGetStarted} // Changed this line
            width={width - 48}
            height={56}
          />
        </View>
      </Animated.View>
      <AnimatedDots />
    </SafeAreaView>
  );

  const screens = [
    { key: "splash", render: renderSplash },
    { key: "onboarding", render: renderOnboarding },
  ];

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={screens}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => <View style={{ width }}>{item.render()}</View>}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          useNativeDriver: false,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(newIndex);
          },
        }
      )}
      scrollEventThrottle={16}
      decelerationRate="fast"
      snapToInterval={width}
      snapToAlignment="center"
    />
  );
}

const styles = StyleSheet.create({
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

  // Unified dots positioning
  dotsWrapper: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },

  // Onboarding Screen Styles
  onboardingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  onboardingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 100, // Adjusted to accommodate dots
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
