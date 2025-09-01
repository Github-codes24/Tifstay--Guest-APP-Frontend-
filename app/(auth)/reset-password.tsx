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

export default function ResetPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Logo showText={false} />

        <Text style={styles.title}>New Password</Text>

        <InputField
          placeholder="Enter new password"
          icon="lock-closed"
          isPassword
        />
        <InputField
          placeholder="Confirm new password"
          icon="lock-closed"
          isPassword
        />

        <CustomButton
          title="Send Recovery Link"
          onPress={() => router.push("/auth/success")}
        />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember it. </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.footerLink}>Login</Text>
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
  },
  footer: {
    marginTop: 19,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
    marginRight: 4,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});
