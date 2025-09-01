import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const Button = ({
  title,
  onPress,
  width = screenWidth * 0.8,
  height = 50,
}: {
  title: string;
  onPress: () => void;
  width?: number;
  height?: number;
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { width: width, height: height }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#004AAD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Button;
