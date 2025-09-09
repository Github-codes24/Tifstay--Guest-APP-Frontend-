import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface ButtonProps {
  title: string;
  onPress: () => void;
  width?: number;
  height?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button = ({
  title,
  onPress,
  width = screenWidth * 0.8,
  height = 50,
  style,
  textStyle,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: width, height: height },
        style, // Custom styles will override default styles
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
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
