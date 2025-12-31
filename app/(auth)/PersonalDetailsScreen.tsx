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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import Toast from "react-native-toast-message";
import CustomToast from "../../components/CustomToast";
import { BASE_URL } from "@/constants/api";

const PersonalDetailsScreen = () => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneNumber = user?.guest?.phoneNumber || "";
  const isDoneDisabled = name.trim().length === 0 || loading;

  const handleBack = () => {
    router.back();
  };

  const handleDone = async () => {
    if (isDoneDisabled) return;

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
        `${BASE_URL}/api/guest/editProfile`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Redirecting to dashboard...",
        });

        setTimeout(() => {
          router.replace("/(secure)/(tabs)");
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
      {/* 🔒 FIXED HEADER */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Personal Details</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* 📜 SCROLLABLE FORM */}
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: 130 }, // space for Done button
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔒 FIXED BOTTOM DONE BUTTON */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
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
      </View>

      <CustomToast />
    </SafeAreaView>
  );
};

export default PersonalDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* HEADER */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    marginRight: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
  },

  /* FORM */
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  /* DONE BUTTON */
  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
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
