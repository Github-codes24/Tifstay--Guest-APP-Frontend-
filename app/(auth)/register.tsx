import { useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName || !trimmedPhone) {
      Alert.alert("Error", "Please enter both name and phone number");
      return;
    }

    if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      Alert.alert("Error", "Name can only contain letters and spaces");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      Alert.alert("Error", "Enter a valid 10-digit Indian phone number");
      return;
    }

    try {
      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/register",
        {
          name: trimmedName,
          phoneNumber: trimmedPhone,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const success = response.data?.success;
      const message = response.data?.message;
      const otpCode = response.data?.data?.guest?.otpCode;

      if (success) {
        Alert.alert(
          "Success",
          `Account registered!\nOTP: ${otpCode}`,
          [
            {
              text: "OK",
              onPress: () =>
                router.push({
                  pathname: "/verify",
                  params: { phoneNumber: trimmedPhone, otp: otpCode },
                }),
            },
          ]
        );
      } else {
        Alert.alert("Registration Failed", message || "Unknown error");
      }
    } catch (error: any) {
      if (error.response) {
        // ✅ Just show clean error message
        const serverMessage =
          error.response.data?.message || "User already registered";
        Alert.alert("Registration Failed", serverMessage);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />

        <Text style={styles.title}>Get started with Tifstay</Text>

        <InputField
          placeholder="Name"
          icon="person"
          value={name}
          onChangeText={setName}
        />
        <InputField
          placeholder="Phone Number"
          icon="phone-portrait"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <CustomButton title="Continue" onPress={handleRegister} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.footerLink}>Log In</Text>
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
  container: { flex: 1, paddingHorizontal: 24, backgroundColor: colors.white },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 16,
    color: colors.textPrimary,
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
    fontWeight: "500",
    marginRight: 4,
  },
  footerLink: { color: colors.primary, fontWeight: "600", fontSize: 16 },
});
