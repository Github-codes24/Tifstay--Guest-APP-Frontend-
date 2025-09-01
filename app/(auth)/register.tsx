import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import Logo from "../../components/Logo";
import colors from "../../constants/colors";
import { useAppState } from "../../context/AppStateProvider";

export default function RegisterScreen() {
  const router = useRouter();
  const { serviceType } = useAppState();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />

        <Text style={styles.title}>Get started with Tifstay</Text>

        <InputField placeholder="Name" icon="person" />
        <InputField
          placeholder="Email"
          icon="mail"
          keyboardType="email-address"
        />
        <InputField placeholder="Password" icon="lock-closed" isPassword />

        <CustomButton
          title="Continue"
          onPress={() => router.navigate("/verify")}
        />
        {serviceType !== 0 && (
          <>
            <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>
            <CustomButton
              title="Continue with Google"
              onPress={() => {}}
              variant="secondary"
              icon={require("../../assets/images/google-icon.png")}
            />
            <CustomButton
              title="Continue with Apple"
              onPress={() => {}}
              variant="secondary"
              icon={require("../../assets/images/apple-icon.png")}
            />
          </>
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
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
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    color: colors.textMuted,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { marginHorizontal: 10, color: colors.textMuted, gap: 12 },
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
