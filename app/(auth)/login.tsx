import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import axios from "axios";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const phoneRegex = {
    tenDigits: /^[0-9]{10}$/,
    indianMobile: /^[6-9][0-9]{9}$/,
    usFormat: /^($[0-9]{3}$|[0-9]{3})[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/,
    international:
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}$/,
  };

  const validatePhoneNumber = (phoneNum: string) => {
    const digitsOnly = phoneNum.replace(/\D/g, "");
    return phoneRegex.tenDigits.test(digitsOnly);
  };

  const handleGetOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setError("");
    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/login",
        { phoneNumber },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        const otpCode = response.data.data?.guest?.otpCode;

        Alert.alert(
          "OTP Sent",
          `Your OTP is ${otpCode}`, // only show OTP
          [
            {
              text: "OK",
              onPress: () =>
                router.push({
                  pathname: "/verify",
                  params: { phoneNumber }, // pass only phone number
                }),
            },
          ]
        );
      } else {
        Alert.alert("Login Failed", response.data.message || "Unknown error");
      }
    } catch (error: any) {
if (error.response) {
  const serverMessage = error.response.data?.message || "Something went wrong";
  Alert.alert("Login Failed", serverMessage);
} else if (error.request) {
  Alert.alert(
    "Network Error",
    "No response from server. Please check your connection."
  );
} else {
  Alert.alert("Error", error.message);
}

    }
  };

  const handlePhoneNumberChange = (inputText: string) => {
    const digitsOnly = inputText.replace(/[^0-9]/g, "");
    const limitedInput = digitsOnly.substring(0, 10);
    setPhoneNumber(limitedInput);

    if (limitedInput.length === 10) {
      if (!phoneRegex.tenDigits.test(limitedInput)) {
        setError("Invalid phone number format");
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />
        <Text style={styles.title}>Get started with Tifstay</Text>

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
          <Text style={styles.footerText}>{"Don't have an account?"} </Text>
          <TouchableOpacity onPress={() => router.navigate("/register")}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 16,
    color: colors.textPrimary,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
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
