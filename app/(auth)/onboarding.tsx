import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Buttons";
import { useAppState } from "../../context/AppStateProvider";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setServiceType, serviceType } = useAppState();

  // Auto-advance from splash after 3 seconds
  useEffect(() => {
    if (currentIndex === 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 1, animated: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleServiceSelect = (serviceId: number) => {
    setServiceType(serviceId);
    router.push({
      pathname: "/login",
      params: { serviceType: serviceId },
    });
  };

  const services = [
    {
      id: 0,
      icon: "school-outline",
      title: "I'm a Guest",
      subtitle: "Looking for hostels/tiffin services",
    },
    {
      id: 1,
      icon: "restaurant-outline",
      title: "I'm a Tiffin Provider",
      subtitle: "Want to list my tiffin service",
    },
    {
      id: 2,
      icon: "business-outline",
      title: "I'm a Hostel Owners",
      subtitle: "Want to list my tiffin service",
    },
  ];

  const renderSplash = () => (
    <ImageBackground
      source={require("../../assets/images/background.png")}
      style={styles.background}
      resizeMode="contain"
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </ImageBackground>
  );

  const renderOnboarding = () => (
    <SafeAreaView style={styles.onboardingContainer}>
      <View style={styles.onboardingContent}>
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
            onPress={() => router.navigate("/login")}
            width={width - 48}
            height={56}
          />
        </View>
        <View style={styles.onboardingDotsContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.onboardingActiveDot]} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );

  const screens = [
    { key: "splash", render: renderSplash },
    { key: "onboarding", render: renderOnboarding },
  ];

  return (
    <FlatList
      ref={flatListRef}
      data={screens}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => <View style={{ width }}>{item.render()}</View>}
      onScroll={(event) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(newIndex);
      }}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  // Splash Screen
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
  dotsContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  activeDot: {
    backgroundColor: "#FF6B00",
    width: 24,
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
    paddingBottom: 30,
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
  onboardingDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  onboardingActiveDot: {
    backgroundColor: "#FF6B35",
    width: 24,
  },
});
