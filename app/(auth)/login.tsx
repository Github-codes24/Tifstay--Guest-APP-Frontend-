
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
          onPress={() => router.navigate("/verify")}
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
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