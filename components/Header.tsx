import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  backIconName?: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  backButtonStyle?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  backIconName = "chevron-back",
  rightContent,
  style,
  titleStyle,
  backButtonStyle,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, style]}>
      {showBackButton ? (
        <TouchableOpacity
          style={[styles.backButton, backButtonStyle]}
          onPress={handleBack}
        >
          <Ionicons name={backIconName} size={28} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>

      {rightContent ? (
        <View style={styles.rightContentContainer}>{rightContent}</View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // paddingTop: 26,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 36,
  },
  rightContentContainer: {
    minWidth: 36,
    alignItems: "flex-end",
  },
});

export default Header;
