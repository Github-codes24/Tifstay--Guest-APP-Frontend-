import CustomButton from "@/components/CustomButton"; 
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { BASE_URL } from "@/constants/api";

const AddressScreen = () => {
  const { addressId } = useLocalSearchParams();
  const [isHome, setIsHome] = useState(false);
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [postCode, setPostCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false); // ✅ button loader

  useEffect(() => {
    if (addressId) fetchAddressById();
    else setLoading(false);
  }, [addressId]);

  const fetchAddressById = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No token found!",
        });
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `${BASE_URL}/api/guest/address/getAddress/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const data = response.data.data.address;
        setAddress(data.address);
        setStreet(data.street);
        setPostCode(data.postCode);
        setIsHome(data.label === "Home");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch address",
        });
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch address",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Please enable location permissions in settings.",
        });
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (place) {
        const formattedAddress = [
          place.name,
          place.street,
          place.subLocality,
          place.city,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(formattedAddress);
        setStreet(place.street || place.name || "");
        setPostCode(place.postalCode || "");
      }

      Toast.show({
        type: "success",
        text1: "Location Fetched",
        text2: "Your current location has been filled in.",
      });
    } catch (error) {
      console.log("Location error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to fetch your location.",
      });
    } finally {
      setLocating(false);
    }
  };

  const updateAddress = async () => {
    if (!address || !street || !postCode) {
      Toast.show({
        type: "error",
        text1: "Missing Required Fields",
        text2: "Please fill address, street, and post code.",
      });
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No token found!",
        });
        setSaving(false);
        return;
      }
      const response = await axios.put(
        `${BASE_URL}/api/guest/address/editAddress/${addressId}`,
        {
          address,
          street,
          postCode,
          label: isHome ? "Home" : "Work",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Address updated successfully",
        });
        router.back();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to update address",
        });
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update address",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {addressId ? "Edit Address" : "Add Address"}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../../assets/images/map.png")}
          style={styles.mapImage}
        />

        <TouchableOpacity
          style={styles.locationBox}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.7}
          disabled={locating || saving}
        >
          <Image
            source={require("../../../assets/images/basil.png")}
            style={{ height: 20, width: 20, marginLeft: 12 }}
          />
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "400", color: colors.primary }}>
              Use my current location
            </Text>
          )}
        </TouchableOpacity>

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
            multiline
            labelStyle={styles.label}
          />
          <LabeledInput
            label="Post Code"
            containerStyle={styles.flexInput}
            inputContainerStyle={styles.input}
            value={postCode}
            onChangeText={setPostCode}
            multiline
            labelStyle={styles.label}
          />
        </View>

        <View style={styles.labelSection}>
          <Text style={styles.labelTitle}>Label as</Text>
          <View style={styles.labelRow}>
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setIsHome(true)}
                style={[styles.iconWrapper, isHome ? styles.activeBg : styles.inactiveBg]}
                disabled={saving}
              >
                <Image
                  source={require("../../../assets/images/home1.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <Text style={styles.labelText}>Home</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setIsHome(false)}
                style={[styles.iconWrapper, !isHome ? styles.activeBg : styles.inactiveBg]}
                disabled={saving}
              >
                <Image
                  source={require("../../../assets/images/work.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <Text style={styles.labelText}>Work</Text>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <TouchableOpacity
        onPress={updateAddress}
        activeOpacity={0.8}
        disabled={saving}
        style={[
          styles.saveButton,
          { backgroundColor: saving ? "#ccc" : colors.primary },
        ]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddressScreen;

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
  inputMargin: { marginTop: 20 },
  inputTall: { minHeight: 75 },
  input: { minHeight: 56 },
  label: { fontSize: 14, fontWeight: "600", color: colors.title },
  row: { flexDirection: "row", marginTop: 48, gap: 12 },
  flexInput: { flex: 1 },
  labelSection: { marginTop: 24, paddingHorizontal: 16 },
  labelTitle: { fontSize: 14, marginBottom: 8, color: colors.title },
  labelRow: { flexDirection: "row", gap: 12 },
  iconWrapper: {
    height: 52,
    width: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBg: { backgroundColor: colors.primary },
  inactiveBg: { backgroundColor: colors.inputColor },
  icon: { height: 24, width: 24 },
  labelText: { fontSize: 12, fontWeight: "500", marginTop: 4 },
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
  saveButton: {
    width: "90%",
    alignSelf: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
