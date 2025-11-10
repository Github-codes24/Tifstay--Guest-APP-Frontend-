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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import CustomToast from "../../components/CustomToast";

const { width, height } = Dimensions.get("window");

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

  // ✅ only allow 10-digit numbers
  const phoneRegex = /^[0-9]{10}$/;

  const handlePhoneNumberChange = (inputText: string) => {
    // remove non-numeric chars and limit to 10 digits
    const digitsOnly = inputText.replace(/[^0-9]/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
  };

  const filteredCountries = useMemo(() => {
    let filtered = countries.filter((country) =>
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
          const sorted = res.data.data.sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
          );
          setCountries(sorted);

          const india = sorted.find((c: any) => c.countryCode === "IN");
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

  const handleCountryChange = async (country: any) => {
    try {
      setLoadingDialCode(true);
      const res = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/country-code?country=${country.name}`
      );
      if (res.data.success) {
        const dial = res.data.data.dialCode || "+0";
        setSelectedCountry({
          ...country,
          dialCode: dial,
        });
      } else {
        setSelectedCountry({
          ...country,
          dialCode: "+0",
        });
      }
    } catch (err) {
      console.log("Error fetching dial code:", err);
      setSelectedCountry({
        ...country,
        dialCode: "+0",
      });
    } finally {
      setLoadingDialCode(false);
    }
  };

  const handleGetOTP = async () => {
    Keyboard.dismiss();

    const trimmedNumber = phoneNumber.trim();

    if (!acceptedTerms) {
      Toast.show({
        type: "error",
        text1: "Terms Not Accepted",
        text2: "Please accept our Terms of Service to continue.",
      });
      return;
    }

    // ✅ Improved validation (only 10 digits allowed)
    if (!phoneRegex.test(trimmedNumber)) {
      Toast.show({
        type: "error",
        text1: "Invalid Number",
        text2: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    const payload = { phoneNumber: trimmedNumber };

    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/login",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        const otpCode = response.data.data?.guest?.otpCode;
        Toast.show({
          type: "success",
          text1: "OTP Sent Successfully",
          text2: `Your OTP is ${otpCode}`,
        });
        setTimeout(() => {
          router.push({
            pathname: "/verify",
            params: { phoneNumber: trimmedNumber },
          });
        }, 3000);
      } else {
        Toast.show({
          type: "error",
          text1: "Guest Not Found",
          text2: "Please register to continue.",
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        Toast.show({
          type: "error",
          text1: "Guest Not Registered",
          text2: "Please register before logging in.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Server Error",
          text2: "Something went wrong. Please try again later.",
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../assets/images/loginlogo.png")}
              style={styles.topImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.bottomCard}>
            <ImageBackground
              source={require("../../assets/images/background.png")}
              style={styles.cardBackground}
              imageStyle={{
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                width: "110%",
                height: "110%",
              }}
              resizeMode="cover"
            >
              <Logo showText={false} />
              <Text style={styles.title}>Comfortable Food, Comfortable Stay</Text>
              <Text style={styles.subtitle}>Get started with Tifstay</Text>

              {/* Phone Number Input */}
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setIsPickerOpen(true)}
                >
                  <Image source={{ uri: selectedCountry.flag }} style={styles.flagImage} />
                  <Text style={styles.dialCodeText}>
                    {loadingDialCode ? "..." : selectedCountry.dialCode}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.numberInput}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  maxLength={10}
                />
              </View>

              {/* Terms */}
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

              <CustomButton title="Get OTP" onPress={handleGetOTP} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don’t have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/register")}>
                  <Text style={styles.footerLink}>Register</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
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
            keyExtractor={(item: any) => item.countryCode}
            renderItem={({ item }: any) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  handleCountryChange(item);
                  setIsPickerOpen(false);
                  setSearchQuery("");
                }}
              >
                <Image source={{ uri: item.flag }} style={styles.flagInList} />
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
  safeArea: { flex: 1, backgroundColor: colors.white },
  imageWrapper: { height: height * 0.35, width: "100%" },
  topImage: { width: "100%", height: "100%" },
  bottomCard: { flex: 1, marginTop: -30 },
  cardBackground: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
  },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center", marginTop: 16 },
  subtitle: { fontSize: 18, fontWeight: "500", textAlign: "center", marginBottom: 24 },
  phoneInputContainer: {
    flexDirection: "row",
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f5f6fa",
    alignItems: "center",
    marginBottom: 16,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
  },
  flagImage: { width: 28, height: 20, resizeMode: "contain" },
  dialCodeText: { fontSize: 16, fontWeight: "500", marginLeft: 8, marginRight: 4 },
  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    height: "100%",
    color: "#000",
  },
  termsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    paddingHorizontal: 8,
    marginTop: 10,
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
  checkedBox: { width: 12, height: 12, backgroundColor: colors.primary },
  termsText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  footer: { marginTop: 10, flexDirection: "row", justifyContent: "center" },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.primary,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  closeText: { fontSize: 24, color: "#fff" },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  flagInList: { width: 30, height: 20, marginRight: 12, resizeMode: "contain" },
  countryNameText: { flex: 1, fontSize: 16 },
});
