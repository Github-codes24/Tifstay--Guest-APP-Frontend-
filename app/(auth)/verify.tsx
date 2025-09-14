import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import CustomButton from "../../components/CustomButton";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";

export default function VerifyScreen() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);
  const { login } = useAuthStore();

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 4) {
      Alert.alert("Invalid OTP", "Please enter a 4-digit OTP");
      return;
    }

    // Simulate OTP verification (replace with actual API call)
    if (otpCode === "1234") {
      // Demo OTP
      // Create user object
      const user = {
        id: "user123",
        name: "John Doe",
        phoneNumber: "+1234567890", // Get from previous screen
        email: "john@example.com",
      };

      // Login user
      login(user);

      // Show success screen
      router.replace("/success");
    } else {
      Alert.alert("Invalid OTP", "Please enter correct OTP");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent a 4-digit code to your phone
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <CustomButton title="Verify OTP" onPress={handleVerifyOTP} />

        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
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
    marginBottom: 8,
    marginTop: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: colors.textPrimary,
  },
  resendButton: {
    marginTop: 24,
    alignItems: "center",
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
