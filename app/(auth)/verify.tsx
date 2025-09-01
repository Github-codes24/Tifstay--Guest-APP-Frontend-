/* eslint-disable react/no-unescaped-entities */
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import CustomButton from "../../components/CustomButton";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import { useAppState } from "../../context/AppStateProvider";

export default function VerifyScreen() {
  const router = useRouter();
  const { setUser } = useAppState();

  const handleVerify = () => {
    setUser({
      id: "1",
      name: "Tiffin User",
      type: "tiffin",
      phone: "+1234567890",
    });

    router.replace("/(secure)/(tiffin)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter 4 Digit Code</Text>

        <View style={styles.inputRow}>
          {[1, 2, 3, 4].map((_, i) => (
            <TextInput
              key={i}
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        <Text style={styles.resend}>
          Didn't Receive the Code? <Text style={styles.resendLink}>Resend</Text>
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
  subtitle: { textAlign: "center", marginVertical: 8 },
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
    marginBottom: 24,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primaryOrange,
    fontWeight: "600",
  },
});
