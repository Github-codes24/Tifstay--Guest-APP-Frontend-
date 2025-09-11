import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { useNavigation } from "@react-navigation/native";
import CustomButton from "@/components/CustomButton";
import colors from "@/constants/colors";
import Logo from "@/components/Logo";

const ConfirmationScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Logo showText={false} />

      <Text style={styles.title}>Thanks!</Text>
      <Text style={styles.description}>
        Your review has been submitted and{"\n"}helps others discover great deals.
      </Text>

      <CustomButton
        title="Back to Home"
        onPress={() => ('')} // Replace "Home" with your actual home screen route
        style={styles.button}
      />
    </View>
  );
};

export default ConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
   
    color: colors.textPrimary,
  },
  description: {
    fontSize: 16,
    fontWeight:400,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 20,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
  },
});
