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
  Platform,
  Modal,
  FlatList,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import axios from "axios";
import Toast from "react-native-toast-message";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;

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

    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formattedPhoneNumber = `${selectedCountry.dialCode} ${trimmedPhone}`;

      const requestBody = {
        name: trimmedName,
        phoneNumber: formattedPhoneNumber,
      };
      if (trimmedCode) requestBody.code = trimmedCode;

      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/register",
        requestBody,
        { headers: { "Content-Type": "application/json" } }
      );

      const success = response.data?.success;
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
            params: {
              phoneNumber: trimmedPhone,
              dialCode: selectedCountry.dialCode,
               otpCode: otpCode,
            },
          });
        }, 2000);
      } else {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: response.data?.message || "Something went wrong.",
        });
      }
    } catch (error) {
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
          text2: "Please check your connection.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
       extraHeight={Platform.OS === "android" ? 250 : 120}

        keyboardOpeningTime={0}
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

            {/* NAME */}
            <InputField
              placeholder="Name"
              icon="person"
              value={name}
              onChangeText={setName}
            />

            {/* PHONE */}
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setIsPickerOpen(true)}
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
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>

            {/* REFERRAL */}
            <InputField
              placeholder="Referral Code (optional)"
              icon="code"
              value={code}
              onChangeText={setCode}
            />

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { opacity: isSubmitting ? 0.7 : 1, backgroundColor: colors.primary },
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </KeyboardAwareScrollView>

      {/* COUNTRY MODAL */}
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
    backgroundColor: "#f5f6fa",
    marginBottom: 16,
  },

  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
  },

  flagImage: { width: 28, height: 20, resizeMode: "contain" },
  dialCodeText: { fontSize: 16, fontWeight: "500", marginLeft: 8 },

  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    color: "#000",
    height: "100%",
  },

  submitButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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

  flagInList: { width: 30, height: 20, marginRight: 12 },
  countryNameText: { flex: 1, fontSize: 16 },
});
