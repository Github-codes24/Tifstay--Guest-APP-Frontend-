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
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const AddAddressScreen = () => {
  const [isHome, setIsHome] = useState(true);
  const [address, setAddress] = useState("123 Main Street, Dharampeth, Nagpur - 440010");
  const [street, setStreet] = useState("123 Main Street");
  const [postCode, setPostCode] = useState("440010");
  const [loading, setLoading] = useState(false);

  const saveAddress = async () => {
    if (!address || !street || !postCode) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill all fields before saving.",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "User not logged in.",
        });
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

      console.log("API Response:", response.data);

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Address Added",
          text2: response.data.message || "Your address was added successfully.",
        });
        router.back();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.log("Error response:", error.response?.data || error.message);
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: error.response?.data?.message || "Failed to add address.",
      });
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
            {/* Home */}
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setIsHome(true)}
            >
              <View
                style={[
                  styles.iconWrapper,
                  isHome ? styles.activeBg : styles.inactiveBg,
                ]}
              >
                <Image
                  source={require("../../../assets/images/home1.png")}
                  style={[
                    styles.icon,
                    { tintColor: isHome ? colors.white : colors.primary },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.iconLabel,
                  { color: isHome ? colors.primary : colors.title },
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            {/* Work */}
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setIsHome(false)}
            >
              <View
                style={[
                  styles.iconWrapper,
                  !isHome ? styles.activeBg : styles.inactiveBg,
                ]}
              >
                <Image
                  source={require("../../../assets/images/work.png")}
                  style={[
                    styles.icon,
                    { tintColor: !isHome ? colors.white : colors.primary },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.iconLabel,
                  { color: !isHome ? colors.primary : colors.title },
                ]}
              >
                Work
              </Text>
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
  labelRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 32,
  },
  iconContainer: {
    alignItems: "center",
  },
  iconWrapper: {
    height: 50,
    width: 50,
    borderRadius: 35, // ✅ perfect circle
    alignItems: "center",
    justifyContent: "center",
  },
  activeBg: { backgroundColor: colors.primary },
  inactiveBg: { backgroundColor: colors.inputColor },
  icon: { height: 28, width: 28 },
  iconLabel: { fontSize: 14, fontWeight: "500", marginTop: 6 },
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
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});
