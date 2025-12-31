import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import LabeledInput from "@/components/LabeledInput";
import CustomButton from "@/components/CustomButton";
import colors from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BASE_URL } from "@/constants/api";
import Toast from "react-native-toast-message"; // ← Added for toast notifications

const fetchProfile = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const res = await fetch(`${BASE_URL}/api/guest/getProfile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to load profile");
  return data.data.guest;
};

const MAX_EMAIL_LENGTH = 35;

const isValidEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

const EditProfile = () => {
  const queryClient = useQueryClient();
  const { fetchProfile: refetchStoreProfile } = useAuthStore();
  const { data: guest } = useQuery({
    queryKey: ["guestProfile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(new Date());
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (guest) {
      setName(guest.name || "");
      setEmail(guest.email || "");

      let phoneNum = guest.phoneNumber || "";
      if (phoneNum) {
        let digits = phoneNum.replace(/[^\d]/g, "");
        if (digits.startsWith("91") && digits.length >= 12) {
          digits = digits.slice(2);
        } else if (digits.length > 10) {
          digits = digits.slice(-10);
        }
        setPhone("+91" + digits);
      } else {
        setPhone("+91");
      }

      setDob(guest.dob || "");
      if (guest.dob) {
        setDate(new Date(guest.dob));
      }
      if (guest.profileImage) {
        setProfileImage({ uri: guest.profileImage });
      }
    }
  }, [guest]);

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^\d]/g, "");

    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }

    setPhone("+91" + cleaned);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShow(false);
      return;
    }

    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    setDate(currentDate);
    setDob(currentDate.toLocaleDateString("en-IN"));
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Email cannot be empty",
      });
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      Toast.show({
        type: "error",
        text1: "Email Too Long",
        text2: `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`,
      });
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address",
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      if (name.trim()) formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (phone.trim() && phone.length > 3)
        formData.append("phoneNumber", phone.trim());
      if (dob.trim()) formData.append("dob", dob.trim());

      if (profileImage && profileImage.uri) {
        formData.append("profileImage", {
          uri: profileImage.uri,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${BASE_URL}/api/guest/editProfile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        queryClient.setQueryData(["guestProfile"], data.data.guest);
        await refetchStoreProfile();

        // Toast.show({
        //   type: "success",
        //   text1: "Success!",
        //   text2: "Profile updated successfully",
        // });

        setSuccessModalVisible(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Failed to update profile",
        });
      }
    } catch (err: any) {
      console.log(err.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setSuccessModalVisible(false);
    router.back();
  };

  // ... JSX remains exactly the same (no changes needed here)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header and rest of JSX unchanged */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1, paddingHorizontal: 12, marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileContainer}>
          <View style={styles.imageWrapper}>
            <TouchableOpacity onPress={pickImage}>
              {profileImage?.uri ? (
                <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
              ) : (
                <Image
                  source={require("../../../assets/images/fallbackdp.png")}
                  style={styles.profileImage}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{name || "Your Name"}</Text>
        </View>

        <View style={{ gap: 8 }}>
          <LabeledInput
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            labelStyle={styles.label}
          />
          <LabeledInput
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            maxLength={35}
            onChangeText={(text) => setEmail(text)}
            labelStyle={styles.label}
          />

          <LabeledInput
            label="Phone Number"
            placeholder="+9199XXXXXX00"
            value={phone}
            editable={false}
            pointerEvents="none"
            keyboardType="phone-pad"
            labelStyle={styles.label}
            inputStyle={{
              color: "#999",
            }}
            inputContainerStyle={{
              backgroundColor: "#F2F2F2",
              borderColor: "#E0E0E0",
            }}
          />

          <TouchableOpacity onPress={() => setShow(true)} activeOpacity={1}>
            <View style={styles.dateInputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#999"
                style={styles.calendarIcon}
              />
              <LabeledInput
                label="Date of Birth"
                placeholder="01/01/2000"
                value={dob}
                onChangeText={() => {}}
                editable={false}
                labelStyle={styles.label}
                inputStyle={{ paddingLeft: 20, marginTop: 5 }}
                inputProps={{ pointerEvents: "none" }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <CustomButton
        title={isSaving ? "Saving..." : "Save"}
        onPress={handleSave}
        disabled={isSaving}
        style={{
          width: "90%",
          alignSelf: "center",
          marginVertical: 20,
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving && <ActivityIndicator color="#fff" style={{ position: "absolute" }} />}
      </CustomButton>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>
              Profile updated successfully
            </Text>
            <TouchableOpacity style={styles.successModalButton} onPress={handleModalClose}>
              <Text style={styles.successModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// styles remain unchanged
const styles = StyleSheet.create({
  // ... (same as your original styles)
  profileContainer: { alignItems: "center", marginTop: 28 },
  profileImage: { width: 86, height: 86, borderRadius: 50, marginBottom: 12 },
  label: { color: colors.title, fontSize: 14, marginBottom: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 5, color: "#000" },
  imageWrapper: {
    position: "relative",
    width: 86,
    height: 86,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary || "#000",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: { marginBottom: 16 },
  successModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  successModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: colors.primary || "#2854C5",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  successModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  dateInputWrapper: { position: "relative" },
  calendarIcon: {
    position: "absolute",
    left: 24,
    top: 45,
    zIndex: 1,
  },
});

export default EditProfile;