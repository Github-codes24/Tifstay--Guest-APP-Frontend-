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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import CustomButton from "../../components/CustomButton";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomToast from "../../components/CustomToast";

const { width, height } = Dimensions.get("window");

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
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (!value && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter a 4-digit OTP.",
      });
      return;
    }
    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/verify-otp",
        { phoneNumber, otp: otpCode }
      );

      if (response.data.success) {
        const token = response.data.token;
        const guest = response.data.data.guest;
        const guestId = guest._id;

        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("guestId", guestId);
        await AsyncStorage.setItem("userProfile", JSON.stringify({ guest }));
        login(response.data.data, token);

        Toast.show({
          type: "success",
          text1: "OTP Verified",
          text2: "Login successful! Redirecting...",
        });

        setTimeout(() => {
          router.replace("/(secure)/(tabs)");
        }, 2000);
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
    }
  };

  const handleResend = () => {
    if (isResendDisabled) return;
    setOtp(["", "", "", ""]);
    setTimer(30);
    setIsResendDisabled(true);
    Toast.show({
      type: "info",
      text1: "OTP Resent",
      text2: "A new OTP has been sent to your number.",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🔹 Top Logo Section */}
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
          imageStyle={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
        >
          <Logo showText={false} />
          <Text style={styles.title}>Verify Your OTP</Text>
          <Text style={styles.subtitle}>Enter the 4-digit code sent to your number</Text>

          {/* 🔹 OTP Inputs */}
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

          {/* 🔹 Resend OTP Section */}
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

          {/* 🔹 Verify Button */}
          <CustomButton title="Verify OTP" onPress={handleVerifyOTP} />
        </ImageBackground>
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
    marginTop: -30,
  },
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
  resendPrompt: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
