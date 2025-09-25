import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
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

const EditProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
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
      if (data.success) {
        const guest = data.data.guest;
        setName(guest.name);
        setEmail(guest.email);
        setPhone(guest.phoneNumber);
        setDob(guest.dob);
      }
    } catch (err: any) {
      console.log(err.message);
    }
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

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("dob", dob);
      formData.append("phoneNumber", phone);

      if (profileImage) {
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
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );
      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Profile updated successfully");
        router.back();
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.log(err.message);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
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
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage.uri }
                  : require("../../../assets/images/user.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
        </View>

        <View style={{ gap: 8 }}>
          <LabeledInput label="Name" value={name} onChangeText={setName} labelStyle={styles.label} />
          <LabeledInput label="Email" value={email} onChangeText={setEmail} labelStyle={styles.label} />
          <LabeledInput label="Phone Number" value={phone} onChangeText={setPhone} labelStyle={styles.label} />
          <LabeledInput label="Date of Birth" value={dob} onChangeText={setDob} labelStyle={styles.label} />
        </View>
      </KeyboardAwareScrollView>

      <CustomButton title="Save" onPress={handleSave} style={{ width: "90%", alignSelf: "center", marginVertical: 0 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileContainer: { alignItems: "center", marginTop: 28 },
  profileImage: { width: 86, height: 86, borderRadius: 50, marginBottom: 12 },
  label: { color: colors.title, fontSize: 14, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});

export default EditProfile;
