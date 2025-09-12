import React from "react";
import { View, Text, StyleSheet, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Button from "./Buttons";
import colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  type: "tiffin" | "hostel";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  type,
}) => {
  const handleGoHome = () => {
    onClose();
    router.push("/");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="home" size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>
            Your {type === "tiffin" ? "meal" : "hostel"} has been shared
            successfully!
          </Text>

          <Text style={styles.subtitle}>
            Your friend gets a warm meal, and you earn rewards. Keep sharing and
            keep earning!
          </Text>

          <Button
            title="Go to Home"
            onPress={handleGoHome}
            width={width - 96}
            height={48}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    alignItems: "center",
    width: width - 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    width: "100%",
  },
});

export default ConfirmationModal;
