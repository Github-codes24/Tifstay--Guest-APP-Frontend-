import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
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
import { useAuthStore } from "@/store/authStore"; // ✅ Import store
import DateTimePicker from '@react-native-community/datetimepicker';

const fetchProfile = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(
    "https://tifstay-project-be.onrender.com/api/guest/getProfile",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to load profile");
  return data.data.guest;
};

const EditProfile = () => {
  const queryClient = useQueryClient();
  const { fetchProfile: refetchStoreProfile } = useAuthStore(); // ✅ Get store's fetchProfile

  const { data: guest } = useQuery({
    queryKey: ["guestProfile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // ✅ cache for 5 mins
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(new Date());
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  React.useEffect(() => {
    if (guest) {
      setName(guest.name || "");
      setEmail(guest.email || "");
      setPhone(guest.phoneNumber || "");
      setDob(guest.dob || "");
      if (guest.dob) {
        setDate(new Date(guest.dob));
      }
      if (guest.profileImage) setProfileImage({ uri: guest.profileImage });
    }
  }, [guest]);

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
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
    setDob(currentDate.toLocaleDateString('en-IN'));
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const formData = new FormData();

      if (name.trim()) formData.append("name", name.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (phone.trim()) formData.append("phoneNumber", phone.trim());
      if (dob.trim()) formData.append("dob", dob.trim());

      if (profileImage && profileImage.uri) {
        formData.append("profileImage", {
          uri: profileImage.uri,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/editProfile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        // ✅ update cached data instantly (no refetch) - for local MyProfile query
        queryClient.setQueryData(["guestProfile"], data.data.guest);

        // ✅ Refetch global store profile to update Dashboard header immediately
        await refetchStoreProfile();

        setSuccessModalVisible(true);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.log(err.message);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleModalClose = () => {
    setSuccessModalVisible(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
    {/* Profile Image */}
    <TouchableOpacity onPress={pickImage}>
      {profileImage?.uri ? (
        <Image
          source={{ uri: profileImage.uri }}
          style={styles.profileImage}
        />
      ) : (
        <Image
          source={require("../../../assets/images/fallbackdp.png")}
          style={styles.profileImage}
        />
      )}
    </TouchableOpacity>

    {/* Camera Icon Overlay */}
    <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
      <Ionicons name="camera" size={18} color="#fff" />
    </TouchableOpacity>
  </View>

  <Text style={styles.headerTitle}>{name}</Text>
</View>


        <View style={{ gap: 8 }}>
          <LabeledInput
            label="Name"
            value={name}
            onChangeText={setName}
            labelStyle={styles.label}
          />
          <LabeledInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            labelStyle={styles.label}
          />
          <LabeledInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            labelStyle={styles.label}
          />
          <TouchableOpacity onPress={() => setShow(true)} activeOpacity={1}>
            <LabeledInput
              label="Date of Birth"
              value={dob || "Select Date"}
              onChangeText={() => {}} // No-op to prevent editing
              editable={false}
              labelStyle={styles.label}
              inputProps={{ pointerEvents: 'none' }} // Assuming LabeledInput accepts inputProps to forward to TextInput
            />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <CustomButton
        title="Save"
        onPress={handleSave}
        style={{ width: "90%", alignSelf: "center", marginVertical: 0 }}
      />

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      {/* Success Modal */}
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
            <Text style={styles.successModalMessage}>Profile updated successfully</Text>
            <TouchableOpacity style={styles.successModalButton} onPress={handleModalClose}>
              <Text style={styles.successModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: colors.primary || '#2854C5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  successModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EditProfile;