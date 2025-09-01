// components/CustomButton.tsx
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: ImageSourcePropType;
}

const CustomButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, variant === "secondary" && styles.secondary]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {icon && (
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        )}
        <Text
          style={[
            styles.text,
            {
              color:
                variant === "secondary" ? colors.textPrimary : colors.white,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    width: 357,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  content: {
    flexDirection: "row", // 👈 align icon + text in the same row
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
