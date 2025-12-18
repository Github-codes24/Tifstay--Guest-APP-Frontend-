// Updated PersonalDetailsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomToast from "../../components/CustomToast"; // Adjust path as needed

const PersonalDetailsScreen = () => {
  const { user } = useAuthStore(); // Assuming store has user after login
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneNumber = user?.guest?.phoneNumber || "";
  const isDoneDisabled = name.trim().length === 0 || loading;

  const handleBack = () => {
    router.back();
  };

  const handleDone = async () => {
    if (isDoneDisabled || !name.trim()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No authentication token found.",
        });
        return;
      }

      const body: any = {
        name: name.trim(),
        phoneNumber,
      };
      if (referralCode.trim()) {
        body.referralCode = referralCode.trim();
      }
    

      const response = await axios.put(
        "https://tifstay-project-be.onrender.com/api/guest/editProfile",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Optionally update store with new profile data
        // e.g., useAuthStore.getState().updateProfile(response.data.data);
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Redirecting to dashboard...",
        });
        setTimeout(() => {
          router.replace('/(secure)/(tabs)');
        }, 1200);
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: response.data.message || "Please try again.",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Back Arrow + Heading (inline) */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={handleBack}
                style={{ marginRight: 6 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <Text style={styles.header}>Personal Details</Text>
            </View>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.label}>What's your name?</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#B0B0B0"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Referral Code */}
            <View style={styles.section}>
              <Text style={styles.label}>Referral code (optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter referral code"
                  placeholderTextColor="#B0B0B0"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Done button */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isDoneDisabled}
            onPress={handleDone}
            style={[
              styles.doneButton,
              isDoneDisabled && styles.doneButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.doneText,
                  isDoneDisabled && styles.doneTextDisabled,
                ]}
              >
                Done
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomToast />
    </SafeAreaView>
  );
};

export default PersonalDetailsScreen;

// Styles remain EXACTLY SAME as you provided
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 18,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
  },
  doneButton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
  },
  doneButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  doneText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  doneTextDisabled: {
    color: "#B0B0B0",
  },
});