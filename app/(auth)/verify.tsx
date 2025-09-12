import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import { useAppState } from "../../context/AppStateProvider";

export default function VerifyScreen() {
  const { setUser } = useAppState();

  const [timer, setTimer] = useState<number>(0);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer > 0) {
      setIsResendDisabled(true);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle OTP input change
  const handleInputChange = (text: string, index: number) => {
    if (/^\d?$/.test(text)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = text;
      setOtp(updatedOtp);

      if (text && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      if (!text && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResend = () => {
    if (!isResendDisabled) {
      console.log("OTP resent");
      setTimer(30);
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleVerify = () => {
    const isComplete = otp.every((digit) => digit.trim() !== "");

    if (!isComplete) {
      Alert.alert("Incomplete OTP", "Please enter all 4 digits.");
      return;
    }

    const finalOtp = otp.join("");
    console.log("Verifying OTP:", finalOtp);

    setUser({
      id: "1",
      name: "Guest User",
      phone: "+1234567890",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter 4 Digit Code</Text>

        <View style={styles.inputRow}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={1}
              value={otp[index]}
              onChangeText={(text) => handleInputChange(text, index)}
            />
          ))}
        </View>

        <Text style={styles.resend}>
          {" Didn't Receive the Code?"}
          {isResendDisabled ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          )}
        </Text>

        <CustomButton title="Verify" onPress={handleVerify} />
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
    marginTop: 16,
  },
  subtitle: {
    textAlign: "center",
    marginVertical: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    marginHorizontal: 8,
    fontSize: 20,
  },
  resend: {
    textAlign: "center",
    marginBottom: 28,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primaryOrange,
    fontWeight: "600",
    marginBottom: -5,
  },
  timerText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
