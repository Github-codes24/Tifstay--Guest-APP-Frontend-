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

  // const renderChooseService = () => (
  //   <SafeAreaView style={styles.chooseContainer}>
  //     <View style={styles.chooseContent}>
  //       <View style={styles.chooseLogoSection}>
  //         <View style={styles.chooseLogoContainer}>
  //           <Image
  //             source={require("../../assets/images/logoSub.png")}
  //             style={styles.chooseLogo}
  //             resizeMode="contain"
  //           />
  //         </View>
  //       </View>

  //       <View style={styles.headerSection}>
  //         <Text style={styles.title}>Choose Your Service</Text>
  //         <Text style={styles.subtitle}>Please select your category</Text>
  //       </View>

  //       <View style={styles.optionsContainer}>
  //         {services.map((service) => (
  //           <TouchableOpacity
  //             key={service.id}
  //             style={[
  //               styles.option,
  //               serviceType === service.id && styles.selectedOption,
  //             ]}
  //             onPress={() => handleServiceSelect(service.id)}
  //             activeOpacity={0.7}
  //           >
  //             <View style={styles.optionContent}>
  //               <Ionicons
  //                 name={service.icon as any}
  //                 size={20}
  //                 color={serviceType === service.id ? "#FFFFFF" : "#004AAD"}
  //                 style={styles.optionIcon}
  //               />
  //               <View style={styles.textContainer}>
  //                 <Text
  //                   style={[
  //                     styles.optionTitle,
  //                     serviceType === service.id && styles.selectedText,
  //                   ]}
  //                 >
  //                   {service.title}
  //                 </Text>
  //                 <Text
  //                   style={[
  //                     styles.optionSubtitle,
  //                     serviceType === service.id && styles.selectedSubtext,
  //                   ]}
  //                 >
  //                   {service.subtitle}
  //                 </Text>
  //               </View>
  //             </View>

  //             <Ionicons
  //               name="arrow-forward"
  //               size={20}
  //               color={serviceType === service.id ? "#FFFFFF" : "#004AAD"}
  //             />
  //           </TouchableOpacity>
  //         ))}
  //       </View>
  //     </View>
  //   </SafeAreaView>
  // );

  const screens = [
    { key: "splash", render: renderSplash },
    { key: "onboarding", render: renderOnboarding },
    // { key: "choose-service", render: renderChooseService },
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
  // Splash Screen Styles
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

  // Choose Service Screen Styles
  chooseContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chooseContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chooseLogoSection: {
    alignItems: "center",
    marginTop: height * 0.08,
  },
  chooseLogoContainer: {
    width: 87,
    height: 87,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chooseLogo: {
    width: 67,
    height: 46,
    tintColor: "#004AAD",
  },
  headerSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
  },
  optionsContainer: {
    width: "100%",
    maxWidth: Math.min(333, width - 48),
    alignSelf: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedOption: {
    backgroundColor: "#004AAD",
    borderColor: "#004AAD",
  },
  optionContent: {
    flexDirection: "row",

    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#004AAD",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#004AAD",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  selectedSubtext: {
    color: "#E0E7FF",
  },
});
