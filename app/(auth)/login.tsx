import { router } from "expo-router";
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

export default function LoginScreen() {
  const { serviceType, setUser } = useAppState();

  const handleLogin = () => {
    //Call api to login
    setUser({
      name: "John Doe",
      email: "john.doe@example.com",
      role: "guest",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />
        <Text style={styles.title}>Get started with Tifstay</Text>

        <InputField
          placeholder="example@gmail.com"
          icon="mail"
          keyboardType="email-address"
        />
        <InputField placeholder="Password" icon="lock-closed" isPassword />
        {serviceType !== 0 && (
          <TouchableOpacity
            onPress={() => router.navigate("/forgot-password")}
            style={styles.forgotWrapper}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <CustomButton title="Continue" onPress={handleLogin} />
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
          <Text style={styles.footerText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.navigate("/register")}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles
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
  forgotWrapper: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    marginHorizontal: 10,
    color: colors.textMuted,
    fontSize: 14,
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
