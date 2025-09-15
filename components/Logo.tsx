import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import colors from "../constants/colors";

interface LogoProps {
  showText?: boolean;
  subtitle?: string;
}

const Logo: React.FC<LogoProps> = ({ showText = true, subtitle }) => {
  return (
    <View style={styles.logoSection}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logoSub.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <>
          <Text style={styles.brandName}>Tifstay</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </>
      )}
    </View>
  );
};

export default Logo;

const styles = StyleSheet.create({
  logoSection: {
    alignItems: "center",
    marginTop: 40,
  },
  logoContainer: {
    width: 87,
    height: 87,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    width: 67,
    height: 46,
    tintColor: colors.primary,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
});
