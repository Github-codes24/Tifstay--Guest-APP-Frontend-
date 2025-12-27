// Updated VerifyScreen.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  ImageBackground,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomToast from "../../components/CustomToast";
import { BASE_URL } from "@/constants/api";

const { height } = Dimensions.get("window");

export default function VerifyScreen() {
  const DIGITS = 4;
  const [otp, setOtp] = useState<string[]>(Array(DIGITS).fill(""));
  const inputRefs = useRef<TextInput[]>([]);
  const { login } = useAuthStore();
  const { phoneNumber, dialCode, otpCode } = useLocalSearchParams();
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Keyboard fix
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => keyboardHideListener.remove();
  }, []);

  // Countdown timer
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

  // Auto-fill OTP on screen load if passed from login
  useEffect(() => {
    if (otpCode && typeof otpCode === 'string') {
      const otpArray = otpCode.split('').slice(0, DIGITS).concat(Array(DIGITS).fill('').slice(otpCode.length));
      setOtp(otpArray);
      // Optional: First empty input pe focus karo (agar partial OTP ho)
      const firstEmptyIndex = otpArray.findIndex(digit => digit === '');
      if (firstEmptyIndex !== -1 && firstEmptyIndex < DIGITS) {
        setTimeout(() => inputRefs.current[firstEmptyIndex]?.focus(), 100);
      }
      // Auto-trigger verify if full after a short delay
      setTimeout(() => {
        const candidate = getSanitizedOtp(otpArray);
        if (candidate.length === DIGITS && !loading) {
          triggerVerify(candidate);
        }
      }, 200);
    }
  }, [otpCode]);

  // Helper to sanitize and join OTP
  const getSanitizedOtp = (arr: string[]) =>
    arr.join("").replace(/\D/g, "").slice(0, DIGITS);

  // Main change handler supporting single char type and multi-char paste
  const handleOtpChange = (value: string, index: number) => {
    // keep only digits
    const digitsOnly = value.replace(/\D/g, "");
    // clone current otp
    const next = [...otp];

    if (digitsOnly.length === 0) {
      // user cleared field
      next[index] = "";
      setOtp(next);
      // move focus to previous if empty
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }

    if (digitsOnly.length === 1) {
      // normal single-digit input
      next[index] = digitsOnly;
      setOtp(next);
      // focus next if exists
      if (index < DIGITS - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // user pasted multiple chars — distribute starting from current index
      let i = index;
      for (const ch of digitsOnly) {
        if (i >= DIGITS) break;
        next[i] = ch;
        i++;
      }
      setOtp(next);
      // focus the next empty or last input
      const firstEmpty = next.findIndex((d) => d === "");
      const focusIdx = firstEmpty === -1 ? DIGITS - 1 : firstEmpty;
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 50);
    }

    // After updating state, compute sanitized OTP from the "next" array and verify if full.
    // (We use the local next array to avoid waiting for state to commit)
    const candidate = getSanitizedOtp(next);

    if (candidate.length === DIGITS) {
      // small delay so UI shows last digit before verifying
      setTimeout(() => {
        triggerVerify(candidate);
      }, 80);
    }
  };

  // handle backspace to move focus left when empty
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    idx: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[idx] === "" && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
        const newOtp = [...otp];
        newOtp[idx - 1] = "";
        setOtp(newOtp);
      } else {
        // clear current cell (this will be handled by onChangeText as well)
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
      }
    }
  };

  const triggerVerify = async (sanitizedOtp?: string) => {
    // If sanitizedOtp provided use that, else build from state
    const otpCode = sanitizedOtp ?? getSanitizedOtp(otp);
    if (otpCode.length !== DIGITS) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: `Please enter a ${DIGITS}-digit OTP.`,
      });
      return;
    }
    await handleVerifyOTP(otpCode);
  };

  const handleVerifyOTP = async (otpCodeParam?: string) => {
    if (loading) return;

    Keyboard.dismiss();
    const otpCode = (otpCodeParam ?? getSanitizedOtp(otp)).trim();
    if (otpCode.length !== DIGITS) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: `Please enter a ${DIGITS}-digit OTP.`,
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhoneNumber = `${dialCode}${phoneNumber}`;
      const response = await axios.post(
        `${BASE_URL}/api/guest/verify-otp`,
        { phoneNumber: formattedPhoneNumber, otp: otpCode }
      );

      if (response.data.success) {
        const token = response.data.token;
        const data = response.data.data;
        const guest = data.guest;
        const guestId = guest._id;
        const newUser = data.newUser;

        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("guestId", guestId);
        await AsyncStorage.setItem("userProfile", JSON.stringify({ guest }));
        login(data, token);

        Toast.show({
          type: "success",
          text1: "OTP Verified",
          text2: "Login successful! Redirecting...",
        });

        setTimeout(() => {
          if (newUser) {
            router.replace('/(auth)/PersonalDetailsScreen');
          } else {
            router.replace('/(secure)/(tabs)');
          }
        }, 1200);
      } else {
        Toast.show({
          type: "error",
          text1: "Verification Failed",
          text2: response.data.message || "Invalid OTP. Please try again.",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResendDisabled) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/api/guest/login`,
        { 
          phoneNumber,
          countryCode: dialCode
        }
      );

      if (response.data.success) {
        const newOtpCode = response.data.otp || response.data.user?.otpCode;

        Toast.show({
          type: "success",
          text1: "OTP Resent Successfully",
          text2: newOtpCode
            ? `Your new OTP is ${newOtpCode}`
            : "A new OTP has been sent to your number.",
        });

        // Auto-fill new OTP if available
        const otpArray = newOtpCode ? newOtpCode.split('').slice(0, DIGITS) : Array(DIGITS).fill("");
        setOtp(otpArray);

        setTimer(30);
        setIsResendDisabled(true);
        // focus first input after resend
        setTimeout(() => {
          const firstEmptyIndex = otpArray.findIndex(digit => digit === '');
          const focusIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
          inputRefs.current[focusIndex]?.focus();
        }, 100);
        // Auto-trigger verify if full after a short delay
        setTimeout(() => {
          const candidate = getSanitizedOtp(otpArray);
          if (candidate.length === DIGITS && !loading) {
            triggerVerify(candidate);
          }
        }, 200);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to resend",
          text2: response.data.message || "Please try again.",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Something went wrong.",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              imageStyle={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
            >
              <Logo showText={false} />
              <Text style={styles.title}>Verify Your OTP</Text>
              <Text style={styles.subtitle}>
                Enter the {DIGITS}-digit code sent to your number
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
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    returnKeyType="done"
                  />
                ))}
              </View>

              <View style={styles.resendContainer}>
                <Text style={styles.resendPrompt}>Didn’t receive the code?</Text>
                {isResendDisabled ? (
                  <Text style={styles.timerText}> Resend in {timer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}> Resend</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, { opacity: loading ? 0.7 : 1 }]}
                onPress={() => triggerVerify()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </ImageBackground>
          </View>

          <CustomToast />
        </ScrollView>
      </KeyboardAvoidingView>
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: 20,
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
    backgroundColor: "#F2F2F2",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  resendPrompt: { fontSize: 14, fontWeight: "500", color: "#333" },
  resendText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  timerText: { fontSize: 14, color: colors.textSecondary, marginLeft: 4 },
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
});