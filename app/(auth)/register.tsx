import { useRouter } from "expo-router";
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
  Modal,
  FlatList,
  TextInput,
  Keyboard,
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

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(INITIAL_COUNTRY);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDialCode, setLoadingDialCode] = useState(false);

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

  const handleRegister = async () => {
    Keyboard.dismiss();

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedCode = code.trim();

    if (!trimmedName || !trimmedPhone) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter both name and phone number.",
      });
      return;
    }

    if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      Toast.show({
        type: "error",
        text1: "Invalid Name",
        text2: "Name can only contain letters and spaces.",
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit Indian phone number.",
      });
      return;
    }

    try {
      const requestBody: any = {
        name: trimmedName,
        phoneNumber: trimmedPhone,
      };
      if (trimmedCode) requestBody.code = trimmedCode;

      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/register",
        requestBody,
        { headers: { "Content-Type": "application/json" } }
      );

      const success = response.data?.success;
      const message = response.data?.message;
      const otpCode = response.data?.data?.guest?.otpCode;

      if (success) {
        Toast.show({
          type: "success",
          text1: "Registration Successful",
          text2: `Your OTP is ${otpCode}`,
        });

        setTimeout(() => {
          router.push({
            pathname: "/verify",
            params: { phoneNumber: trimmedPhone, otp: otpCode },
          });
        }, 2000);
      } else {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: message || "Something went wrong. Please try again.",
        });
      }
    } catch (error: any) {
      if (error.response) {
        const serverMessage =
          error.response.data?.message || "User already registered.";
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: serverMessage,
        });
      } else if (error.request) {
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Please check your connection and try again.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
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
          {/* 🔹 Top Logo Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../assets/images/loginlogo.png")}
              style={styles.topImage}
              resizeMode="cover"
            />
          </View>

          {/* 🔹 Bottom Section */}
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

              <InputField
                placeholder="Name"
                icon="person"
                value={name}
                onChangeText={setName}
              />

              {/* Country Picker + Phone */}
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
                  onChangeText={setPhoneNumber}
                  maxLength={15}
                />
              </View>

              <InputField
                placeholder="Referral Code (optional)"
                icon="code"
                value={code}
                onChangeText={setCode}
              />

              <CustomButton title="Continue" onPress={handleRegister} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.footerLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔹 Country Picker Modal */}
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

      {/* ✅ Toast */}
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
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 1,
  },
  phoneInputContainer: {
    flexDirection: "row",
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f5f6fa", // 🩶 same as name/referral
    marginBottom: 16,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    height: "100%",
  },
  flagImage: { width: 28, height: 20, resizeMode: "contain" },
  dialCodeText: { fontSize: 16, fontWeight: "500", marginLeft: 8 },
  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    height: "100%",
    backgroundColor: "transparent",
    color: "#000",
  },
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
