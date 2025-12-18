import { router } from "expo-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  Dimensions,
  Keyboard,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import InputField from "../../components/InputField";
import CustomToast from "../../components/CustomToast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const { height } = Dimensions.get("window");

const INITIAL_COUNTRY = {
  name: "India",
  countryCode: "IN",
  flag: "https://flagcdn.com/w320/in.png",
  dialCode: "+91",
};

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(INITIAL_COUNTRY);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDialCode, setLoadingDialCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phoneRegex = /^[0-9]{10}$/;

  const handlePhoneNumberChange = (inputText) => {
    const digitsOnly = inputText.replace(/[^0-9]/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
  };

  const filteredCountries = useMemo(() => {
    let filtered = countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [countries, searchQuery]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/countries"
        );

        if (res.data.success) {
          const sorted = res.data.data.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setCountries(sorted);

          const india = sorted.find((c) => c.countryCode === "IN");
          if (india) {
            setSelectedCountry((prev) => ({
              ...prev,
              flag: india.flag || prev.flag,
            }));
          }
        }
      } catch (err) {
        console.log("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = async (country) => {
    try {
      setLoadingDialCode(true);
      const encodedCountryName = encodeURIComponent(country.name);
      const res = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/country-code?country=${encodedCountryName}`
      );

      setSelectedCountry({
        ...country,
        dialCode: res.data.success ? res.data.data.dialCode : "+91",
      });
    } catch {
      setSelectedCountry({
        ...country,
        dialCode: "+91",
      });
    } finally {
      setLoadingDialCode(false);
    }
  };

 const handleGetOTP = async () => {
  if (isLoading) return;
  setIsLoading(true);
  Keyboard.dismiss();

  if (!acceptedTerms) {
    Toast.show({
      type: "error",
      text1: "Terms Not Accepted",
      text2: "Please accept our Terms of Service to continue.",
    });
    setIsLoading(false);
    return;
  }

  if (!phoneRegex.test(phoneNumber.trim())) {
    Toast.show({
      type: "error",
      text1: "Invalid Number",
      text2: "Please enter a valid 10-digit phone number.",
    });
    setIsLoading(false);
    return;
  }

  try {
    const response = await axios.post(
      "https://tifstay-project-be.onrender.com/api/guest/login",
      { 
        phoneNumber: phoneNumber.trim(),
        countryCode: selectedCountry.dialCode
      }
    );

    if (response.data.success) {
      const otpCode = response.data.otp || response.data.user?.otpCode;
      Toast.show({
        type: "success",
        text1: "OTP Sent Successfully",
        text2: `Your OTP is ${otpCode}`,
      });
      setTimeout(() => {
        router.push({
          pathname: "/verify",
          params: {
            phoneNumber: phoneNumber.trim(),
            dialCode: selectedCountry.dialCode,
            otpCode: otpCode,
          },
        });
        setIsLoading(false);
      }, 2000);
    } else {
      // Handle non-success responses that didn't throw (e.g., 2xx with success: false)
      Toast.show({
        type: "error",
        text1: "Guest Not Found",
        text2: "Please register to continue.",
      });
      setIsLoading(false);
    }
  } catch (error) {
    // Inspect error for unregistered guest case
    const errorData = error.response?.data;
    const isUnregisteredGuest =
      errorData &&
      (errorData.success === false ||
       errorData.message?.toLowerCase().includes("guest not found") ||
       errorData.message?.toLowerCase().includes("not registered") ||
       error.response?.status === 404);

    // Check for blocked account
    const isBlockedAccount =
      errorData &&
      errorData.message?.toLowerCase().includes("blocked");

    if (isBlockedAccount) {
      Toast.show({
        type: "error",
        text1: "Account Blocked",
        text2: "Guest account is blocked. Please contact support.",
      });
    } else if (isUnregisteredGuest) {
      Toast.show({
        type: "error",
        text1: "Guest Not Registered",
        text2: "Please register first.",
      });
    } else {
      // Generic server/network error
      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: "Something went wrong. Please try again later.",
      });
    }
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Platform.OS === "android" ? 140 : 50}
        extraHeight={Platform.OS === "android" ? 100 : 20}
        enableOnAndroid
        keyboardOpeningTime={0}
      >
        {/* TOP IMAGE */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("../../assets/images/loginlogo.png")}
            style={styles.topImage}
            resizeMode="cover"
          />
        </View>

        {/* LOWER CARD */}
        <View style={styles.bottomCard}>
          <ImageBackground
            source={require("../../assets/images/background.png")}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            <Logo showText={false} />

            <Text style={styles.title}>Comfortable Food, Comfortable Stay</Text>
            <Text style={styles.subtitle}>Get started with Tifstay</Text>

            {/* PHONE INPUT */}
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setIsPickerOpen(true)}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: selectedCountry.flag }}
                  style={styles.flagImage}
                />
                <Text style={styles.dialCodeText}>
                  {loadingDialCode ? "..." : selectedCountry.dialCode}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.numberInput}
                placeholder="Phone Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                maxLength={10}
              />
            </View>

            {/* TERMS */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                {acceptedTerms && <View style={styles.checkedBox} />}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our{" "}
                <Text style={{ color: colors.primary }}>Terms of Service</Text>
              </Text>
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { opacity: isLoading ? 0.7 : 1 },
              ]}
              onPress={handleGetOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyText}>Get OTP</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            {/* <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don’t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => !isLoading && router.replace("/PersonalDetailsScreen")}
              >
                <Text style={styles.footerLink}>Register</Text>
              </TouchableOpacity>
            </View> */}
          </ImageBackground>
        </View>
      </KeyboardAwareScrollView>

      {/* COUNTRY LIST MODAL */}
      <Modal
        visible={isPickerOpen}
        animationType="slide"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setIsPickerOpen(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <InputField
              placeholder="Search country"
              icon="search"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.countryCode}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  handleCountryChange(item);
                  setIsPickerOpen(false);
                  setSearchQuery("");
                }}
              >
                <Image
                  source={{ uri: item.flag }}
                  style={styles.flagInList}
                />
                <Text style={styles.countryNameText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      <CustomToast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // prevents cut bottom
  },
  imageWrapper: {
    height: height * 0.32,
    width: "100%",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  bottomCard: {
    flex: 1,
    marginTop: -40,
  },
  cardBackground: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  cardImage: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    opacity:1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 22,
  },
  phoneInputContainer: {
    flexDirection: "row",
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f5f6fa",
    alignItems: "center",
    marginBottom: 14,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
  },
  flagImage: {
    width: 28,
    height: 20,
    resizeMode: "contain",
  },
  dialCodeText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    height: 50,
    color: "#000",
  },
  termsContainer: {
    flexDirection: "row",
    marginBottom: 18,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginRight: 8,
  },
  checkedBox: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    flexWrap: "wrap",
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeText: {
    fontSize: 24,
    color: "#fff",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  flagInList: {
    width: 30,
    height: 20,
    marginRight: 12,
  },
  countryNameText: {
    flex: 1,
    fontSize: 16,
  },
});