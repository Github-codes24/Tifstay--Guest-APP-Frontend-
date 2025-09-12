import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
import { router } from "expo-router";
import { facebook, link, whatsapp } from "@/assets/images";
import * as Clipboard from "expo-clipboard";

const { width } = Dimensions.get("window");

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  type: "tiffin" | "hostel";
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  title,
  type,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const shareOptions = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: whatsapp,
      color: "#25D366",
    },
    {
      id: "facebook",
      name: "Messenger",
      icon: facebook,
      color: "#0084FF",
    },
    {
      id: "copylink",
      name: "Copy Link",
      icon: link,
      color: "#666",
    },
  ];

  const handleShare = async (platform: string) => {
    const message =
      type === "tiffin"
        ? `Check out this amazing tiffin service: ${title}`
        : `Check out this great hostel: ${title}`;

    const shareUrl = "https://yourapp.com/share"; // Replace with your actual share URL

    try {
      switch (platform) {
        case "whatsapp":
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(
            message + "\n" + shareUrl
          )}`;

          if (Platform.OS === "ios") {
            // For iOS, check if WhatsApp is installed
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
              await Linking.openURL(whatsappUrl);
              setTimeout(() => {
                setShowConfirmation(true);
              }, 1000);
            } else {
              Alert.alert(
                "WhatsApp not installed",
                "Please install WhatsApp to share via WhatsApp."
              );
            }
          } else {
            // For Android, try to open directly
            try {
              await Linking.openURL(whatsappUrl);
              setTimeout(() => {
                setShowConfirmation(true);
              }, 1000);
            } catch (error) {
              Alert.alert(
                "WhatsApp not installed",
                "Please install WhatsApp to share via WhatsApp."
              );
            }
          }
          break;

        case "facebook":
          const messengerUrl = Platform.select({
            ios: `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`,
            android: `fb-messenger://share?link=${encodeURIComponent(
              shareUrl
            )}&app_id=YOUR_APP_ID`,
          });

          try {
            if (messengerUrl) {
              await Linking.openURL(messengerUrl);
              setTimeout(() => {
                setShowConfirmation(true);
              }, 1000);
            }
          } catch (error) {
            // Fallback to Facebook web share
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`;
            await Linking.openURL(fbUrl);
            setTimeout(() => {
              setShowConfirmation(true);
            }, 1000);
          }
          break;

        case "copylink":
          try {
            await Clipboard.setStringAsync(shareUrl);
            Alert.alert(
              "Link Copied!",
              "The link has been copied to your clipboard.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setTimeout(() => {
                      setShowConfirmation(true);
                    }, 500);
                  },
                },
              ]
            );
          } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            Alert.alert("Error", "Failed to copy link to clipboard.");
          }
          break;

        default:
          console.log(`Sharing via ${platform}: ${message}`);
          setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Unable to share. Please try again.");
    }
  };

  const handleGoHome = () => {
    setShowConfirmation(false);
    onClose();
    router.push("/");
  };

  const handleModalClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  if (showConfirmation) {
    // Full screen confirmation
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleModalClose}
      >
        <SafeAreaView style={styles.confirmationContainer}>
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationIconContainer}>
              <Ionicons name="home" size={60} color={colors.primary} />
            </View>

            <Text style={styles.confirmationTitle}>
              {type === "tiffin"
                ? "Your meal has been shared successfully!"
                : "Hostel shared!"}
            </Text>

            <Text style={styles.confirmationSubtitle}>
              {type === "tiffin"
                ? "Your friend gets a warm meal, and you earn rewards. Keep sharing and keep earning!"
                : "You've just helped a friend discover a great stay — and earned a reward for it!"}
            </Text>

            <View style={styles.confirmationButtonContainer}>
              <Button
                title="Go to Home"
                onPress={handleGoHome}
                style={styles.confirmationButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Share options modal
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalWrapper}>
          <View style={styles.shareContainer}>
            <Text style={styles.shareTitle}>
              Share {type === "tiffin" ? "With Friend" : "With Friend"}
            </Text>

            <Text style={styles.shareSubtitle}>Share via</Text>

            <View style={styles.shareOptions}>
              {shareOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.shareOption}
                  onPress={() => handleShare(option.id)}
                >
                  <View style={styles.iconContainer}>
                    <Image
                      source={option.icon}
                      style={styles.socialIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.optionText}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
  modalWrapper: {
    width: width - 48,
    justifyContent: "center",
    alignItems: "center",
  },
  shareContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#FF6B35",
  },
  shareSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  shareOption: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  socialIcon: {
    width: 50,
    height: 50,
  },
  optionText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },

  // Confirmation styles
  confirmationContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  confirmationContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmationIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#000",
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  confirmationButtonContainer: {
    position: "absolute",
    bottom: 50,
    left: 24,
    right: 24,
  },
  confirmationButton: {
    width: "100%",
    backgroundColor: colors.primary || "#004AAD",
  },
});

export default ShareModal;
