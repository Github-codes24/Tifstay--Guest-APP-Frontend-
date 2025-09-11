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
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  // Regex patterns for phone validation
  const phoneRegex = {
    // Exactly 10 digits
    tenDigits: /^[0-9]{10}$/,

    // 10 digits starting with 6, 7, 8, or 9 (Indian mobile numbers)
    indianMobile: /^[6-9][0-9]{9}$/,

    // US phone format: (123) 456-7890 or 123-456-7890
    usFormat: /^($[0-9]{3}$|[0-9]{3})[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/,

    // International format with optional + and country code
    international:
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}$/,
  };

  const validatePhoneNumber = (phoneNum: string) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phoneNum.replace(/\D/g, "");

    // Check if it's exactly 10 digits
    return phoneRegex.tenDigits.test(digitsOnly);

    // Or use Indian mobile validation (starts with 6-9)
    // return phoneRegex.indianMobile.test(digitsOnly);
  };

  const handleGetOTP = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    // Clear error and navigate if validation passes
    setError("");
    router.navigate("/verify");
  };

  const handlePhoneNumberChange = (inputText: string) => {
    // Method 1: Allow only digits using regex
    const digitsOnly = inputText.replace(/[^0-9]/g, "");

    // Method 2: Format as you type (e.g., XXX-XXX-XXXX)
    // const formatted = digitsOnly
    //   .replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    //   .substring(0, 12);

    // Limit to 10 digits
    const limitedInput = digitsOnly.substring(0, 10);
    setPhoneNumber(limitedInput);

    // Real-time validation (optional)
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

        <CustomButton
          title="Get OTP"
          onPress={handleGetOTP}
          // Optional: Disable button if phone number is not 10 digits
          // disabled={phoneNumber.length !== 10}
        />

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
