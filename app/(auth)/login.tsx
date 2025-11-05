import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  Keyboard,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import CustomToast from "../../components/CustomToast"; // ✅ make sure path matches your structure

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const phoneRegex = /^[0-9]{10}$/;

  const handlePhoneNumberChange = (inputText: string) => {
    const digitsOnly = inputText.replace(/[^0-9]/g, "").substring(0, 10);
    setPhoneNumber(digitsOnly);
    setError("");
  };

  const handleGetOTP = async () => {
    Keyboard.dismiss(); // ✅ ensures toast appears above keyboard

    if (!phoneRegex.test(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Invalid Number",
        text2: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/login",
        { phoneNumber },
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
            params: { phoneNumber },
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
      {/* 🔹 Top Background Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/images/loginlogo.png")}
          style={styles.topImage}
          resizeMode="cover"
        />
      </View>

      {/* 🔹 Bottom White Card Section */}
      <View style={styles.bottomCard}>
        <Logo showText={false} />
        <Text style={styles.title}>Get started with Tifstay</Text>
        <Text style={styles.subtitle}>Guest</Text>

        <InputField
          placeholder="Phone Number"
          icon="phone-portrait"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={handlePhoneNumberChange}
          maxLength={10}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <CustomButton title="Get OTP" onPress={handleGetOTP} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.navigate("/register")}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Custom Toast */}
      <CustomToast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageWrapper: {
    height: height * 0.35,
    width: "100%",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  bottomCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    color: "#000",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
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
});
