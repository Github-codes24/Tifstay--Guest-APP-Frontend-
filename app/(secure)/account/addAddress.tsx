import CustomButton from "@/components/CustomButton";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddAddressScreen = () => {
  const [isHome, setIsHome] = useState(true);
  const [address, setAddress] = useState("123 Main Street, Dharampeth, Nagpur - 440010");
  const [street, setStreet] = useState("123 Main Street");
  const [postCode, setPostCode] = useState("440010");
  const [loading, setLoading] = useState(false);

  const saveAddress = async () => {
    if (!address || !street || !postCode) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token"); // get token from AsyncStorage
      if (!token) {
        Alert.alert("Error", "User not logged in");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/address/addAddress",
        {
          address,
          street,
          postCode,
          label: isHome ? "Home" : "Work",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API Response:", response.data); // log full response

      if (response.data.success) {
        Alert.alert("Success", response.data.message || "Address added successfully ✅");
        router.back();
      } else {
        Alert.alert("Error", response.data.message || "Something went wrong ❌");
      }
    } catch (error) {
      console.log("Error response:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to add address ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address</Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <Image
          source={require("../../../assets/images/map.png")}
          style={styles.mapImage}
        />

        {/* Use Current Location */}
        <View style={styles.locationBox}>
          <Image
            source={require("../../../assets/images/basil.png")}
            style={{ height: 20, width: 20, marginLeft: 12 }}
          />
          <Text style={styles.locationText}>Use my current location</Text>
        </View>

        {/* Address Fields */}
        <LabeledInput
          label="Address"
          containerStyle={styles.inputMargin}
          inputContainerStyle={styles.inputTall}
          value={address}
          onChangeText={setAddress}
          multiline
          labelStyle={styles.label}
        />

        <View style={styles.row}>
          <LabeledInput
            label="Street"
            containerStyle={styles.flexInput}
            inputContainerStyle={styles.input}
            value={street}
            onChangeText={setStreet}
            labelStyle={styles.label}
          />
          <LabeledInput
            label="Post Code"
            containerStyle={styles.flexInput}
            inputContainerStyle={styles.input}
            value={postCode}
            onChangeText={setPostCode}
            labelStyle={styles.label}
          />
        </View>

        {/* Label as (Home / Work) */}
        <View style={styles.labelSection}>
          <Text style={styles.labelTitle}>Label as</Text>
          <View style={styles.labelRow}>
            <TouchableOpacity
              onPress={() => setIsHome(true)}
              style={[styles.iconWrapper, isHome ? styles.activeBg : styles.inactiveBg]}
            >
              <Image
                source={require("../../../assets/images/home1.png")}
                style={[styles.icon, { tintColor: isHome ? colors.white : colors.primary }]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsHome(false)}
              style={[styles.iconWrapper, !isHome ? styles.activeBg : styles.inactiveBg]}
            >
              <Image
                source={require("../../../assets/images/work.png")}
                style={[styles.icon, { tintColor: !isHome ? colors.white : colors.primary }]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Save Button */}
      <CustomButton
        title={loading ? "Saving..." : "Save"}
        onPress={saveAddress}
        disabled={loading}
        style={{ width: "90%", alignSelf: "center", marginVertical: 12 }}
      />
    </SafeAreaView>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, backgroundColor: colors.white },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  mapImage: { width: "100%", height: 226, resizeMode: "cover", marginTop: 28 },
  locationBox: {
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  locationText: { fontSize: 14, fontWeight: "400", color: colors.primary },
  inputMargin: { marginTop: 20 },
  inputTall: { minHeight: 75 },
  input: { minHeight: 56 },
  label: { fontSize: 14, fontWeight: "600", color: colors.title },
  row: { flexDirection: "row", marginTop: 48, gap: 12 },
  flexInput: { flex: 1 },
  labelSection: { marginTop: 24, paddingHorizontal: 16 },
  labelTitle: { fontSize: 14, marginBottom: 8, color: colors.title },
  labelRow: { flexDirection: "row", gap: 12 },
  iconWrapper: { height: 52, width: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  activeBg: { backgroundColor: colors.primary },
  inactiveBg: { backgroundColor: colors.inputColor },
  icon: { height: 24, width: 24 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});
