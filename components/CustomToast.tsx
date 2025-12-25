import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.toastBox, styles.successBox]}>
      <Ionicons name="checkmark-circle" size={28} color={colors.white} />
      <View style={styles.textContainer}>
        <Text style={[stsadyles.text1, styles.whiteText]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.text2, styles.whiteText]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={[styles.toastBox, styles.errorBox]}>
      <Ionicons name="close-circle" size={28} color={colors.white} />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.whiteText]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.text2, styles.whiteText]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View style={[styles.toastBox, styles.infoBox]}>
      <Ionicons name="information-circle" size={28} color={colors.white} />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.whiteText]} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.text2, styles.whiteText]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    backdropFilter: "blur(12px)" as any, // iOS glassy effect
    ...(Platform.OS === "android" && {
      backgroundColor: "rgba(0,0,0,0.85)",
    }),
  },
  successBox: {
    backgroundColor: colors.primary,
  },
  errorBox: {
    backgroundColor: "#FF4C4C",
  },
  infoBox: {
    backgroundColor: "#007BFF",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  text1: {
    fontSize: 16,
    fontWeight: "700",
  },
  text2: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  whiteText: {
    color: "#fff",
  },
});

export default function CustomToast() {
  return (
    <Toast
      config={toastConfig}
      position="bottom"
      bottomOffset={70}
      visibilityTime={2600}
      autoHide
    />
  );
}
