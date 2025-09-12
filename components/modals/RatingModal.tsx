import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Button from "@/components/Buttons"; // Changed import
import Logo from "@/components/Logo";
import colors from "@/constants/colors";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  serviceType: "tiffin" | "hostel";
  serviceName: string;
  bookingId: string;
  onSubmitSuccess?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  serviceType,
  serviceName,
  bookingId,
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRating = (value: number) => setRating(value);

  const handleCancel = () => {
    setRating(0);
    setTitle("");
    setReview("");
    setShowSuccess(false);
    onClose();
  };

  const handlePost = () => {
    if (!isFormValid) return; // Prevent submission if not valid

    console.log({
      rating,
      title,
      review,
      serviceType,
      serviceName,
      bookingId,
    });

    // Show success screen
    setShowSuccess(true);

    // Auto close after showing success
    setTimeout(() => {
      setShowSuccess(false);
      setRating(0);
      setTitle("");
      setReview("");
      onClose();
      onSubmitSuccess?.();
    }, 2500);
  };

  const isFormValid = rating > 0 && title.trim() && review.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {!showSuccess ? (
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel}>
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    style={styles.backIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rate Now</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Service Info */}
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceType}>
                    Rating{" "}
                    {serviceType === "tiffin" ? "Tiffin Service" : "Hostel"}
                  </Text>
                  <Text style={styles.serviceName}>{serviceName}</Text>
                  <Text style={styles.bookingIdText}>Booking #{bookingId}</Text>
                </View>

                {/* Score */}
                <Text style={styles.label}>
                  Score<Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => handleRating(item)}
                      activeOpacity={0.7}
                    >
                      <AntDesign
                        name={item <= rating ? "star" : "staro"}
                        size={30}
                        color="orange"
                        style={styles.star}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Title Input */}
                <Text style={styles.label}>
                  Title<Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="create-outline" size={20} color="#666" />
                  <TextInput
                    placeholder="Write here.."
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    maxLength={50}
                  />
                </View>

                {/* Review Input */}
                <Text style={styles.label}>
                  Review<Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color="#666"
                    style={styles.textAreaIcon}
                  />
                  <TextInput
                    placeholder="Write here.."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={review}
                    onChangeText={setReview}
                    style={[styles.input, styles.textArea]}
                    maxLength={500}
                  />
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    onPress={handleCancel}
                    style={styles.cancelBtn}
                    textStyle={styles.cancelBtnText}
                  />

                  <Button
                    title="Post"
                    onPress={handlePost}
                    style={
                      isFormValid ? styles.postBtn : styles.postBtnDisabled
                    }
                    textStyle={styles.postBtnText}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Logo showText={false} />
              <Text style={styles.successTitle}>Thanks!</Text>
              <Text style={styles.successDescription}>
                Your review has been submitted and{"\n"}helps others discover
                great deals.
              </Text>

              <Button
                title="Back to Home"
                onPress={handleCancel}
                style={styles.successButton}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backIcon: {
    borderRadius: 80,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  serviceInfo: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  serviceType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  bookingIdText: {
    fontSize: 12,
    color: "#666",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 6,
  },
  required: {
    color: "red",
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "center",
  },
  star: {
    marginHorizontal: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F5FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: "flex-start",
  },
  textAreaIcon: {
    marginTop: 13,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 10,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#004AAD",
    marginTop: 10,
  },
  cancelBtnText: {
    color: "#004AAD",
  },
  postBtn: {
    backgroundColor: "#004AAD",
    marginTop: 10,
  },
  postBtnDisabled: {
    backgroundColor: "#9CA3AF",
    marginTop: 10,
    opacity: 0.7,
  },
  postBtnText: {
    color: "#fff",
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPrimary || "#000",
    marginTop: 20,
  },
  successDescription: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textSecondary || "#666",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 40,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: colors.primary || "#004AAD",
  },
});

export default RatingModal;
