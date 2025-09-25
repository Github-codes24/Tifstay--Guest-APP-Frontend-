import { router, useLocalSearchParams } from "expo-router";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import CustomButton from "../../components/CustomButton";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import axios from "axios";

export default function VerifyScreen() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);
  const { login } = useAuthStore();
  const { phoneNumber } = useLocalSearchParams();
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResendDisabled) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResendDisabled]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      Alert.alert("Invalid OTP", "Please enter a 4-digit OTP");
      return;
    }
    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/verify-otp",
        { phoneNumber, otp: otpCode }
      );
      if (response.data.success) {
        const token = response.data.token; // get token from response
        // Save in Zustand + AsyncStorage
        await AsyncStorage.setItem("token", token);
        login(response.data.data, token);

        router.replace("/(secure)/(tabs)");
      } else {
        Alert.alert("Failed", response.data.message || "OTP verification failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleResend = () => {
    if (isResendDisabled) return;
    setOtp(["", "", "", ""]);
    setTimer(30);
    setIsResendDisabled(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />
        <Text style={styles.title}>Verify OTP</Text>
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
        <View style={styles.resendContainer}>
          <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
          {isResendDisabled ? (
            <Text style={styles.timerText}> Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}> Resend</Text>
            </TouchableOpacity>
          )}
        </View>
        <CustomButton title="Verify" onPress={handleVerifyOTP} />
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
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: colors.textPrimary,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 12,
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
    backgroundColor: "#EDEDED",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resendPrompt: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  resendText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "500",
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
