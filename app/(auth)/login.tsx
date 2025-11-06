import { router } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import CustomToast from "../../components/CustomToast";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false); // ✅ checkbox state

  const phoneRegex = /^[0-9]{10}$/;

  const handlePhoneNumberChange = (inputText: string) => {
    const digitsOnly = inputText.replace(/[^0-9]/g, "").substring(0, 10);
    setPhoneNumber(digitsOnly);
    setError("");
  };

  const handleGetOTP = async () => {
    Keyboard.dismiss();

    if (!acceptedTerms) {
      Toast.show({
        type: "error",
        text1: "Terms Not Accepted",
        text2: "Please accept our Terms of Service to continue.",
      });
      return;
    }

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
      {/* 🔹 Top Logo */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/images/loginlogo.png")}
          style={styles.topImage}
          resizeMode="cover"
        />
      </View>

      {/* 🔹 Bottom Card Section with Background */}
      <View style={styles.bottomCard}>
       <ImageBackground
  source={require("../../assets/images/background.png")}
  style={styles.cardBackground}
  imageStyle={{ borderTopLeftRadius: 30, borderTopRightRadius: 30, width: '110%', height: '110%' }} // enlarge image
  resizeMode="cover"
>

          <Logo showText={false} />
          <Text style={styles.title}>Comfortable Food, Comfortable Stay</Text>
          <Text style={styles.subtitle}>Get started with Tifstay</Text>

          <InputField
            placeholder="Phone Number"
            icon="phone-portrait"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            maxLength={10}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* ✅ Terms Checkbox */}
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
            <TouchableOpacity onPress={() => router.navigate("/register")}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

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
    marginTop: -30,
  },
  cardBackground: {
  flex: 1,
  paddingHorizontal: 24,
  paddingTop: 32,
  backgroundColor: "rgba(255,255,255,0.95)",
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: -2 },
  overflow: "hidden", // ensures rounded corners clip the background image
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 4,
     marginLeft:10
  },
  checkedBox: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
   
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft:10
  },
  footer: {
    marginTop: 10,
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
