import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import colors from "../../constants/colors";
import Header from "../Header";
import { router } from "expo-router";
import { BASE_URL } from "@/constants/api";

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: any) => void;
}

export default function LocationModal({
  visible,
  onClose,
  onLocationSelected,
}: LocationModalProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // ✅ Fetch saved addresses when modal opens
  useEffect(() => {
    if (visible) {
      fetchAddresses();
    }
  }, [visible]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${BASE_URL}/api/guest/address/getAllAddresses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Fix: access actual array
      if (response?.data?.data?.addresses) {
        setAddresses(response.data.data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.log("Error fetching addresses:", error);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleLocationPermission = async () => {
    try {
      setIsGranting(true);
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setIsGranting(false);
        setLocationEnabled(false);
        alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      onLocationSelected(location);
      setLocationEnabled(true);
    } catch (error) {
      console.log("Location error:", error);
      setLocationEnabled(false);
    } finally {
      setIsGranting(false);
      onClose();
    }
  };

  const handleAddressSelect = (address: any) => {
    onLocationSelected(address);
    onClose();
  };

  const handleAddLocation = () => {
    onClose();
    router.push("/(secure)/account/address");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* ===== Header ===== */}
        <View style={styles.header}>
          <Header title="Allow location access" onBack={onClose} />
        </View>

        {/* ===== Content ===== */}
        <View style={styles.content}>
          {/* ===== Location Permission Section ===== */}
          <View style={styles.locationSection}>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color={colors.primary} />

              <Text style={styles.locationText}>
                {isGranting
                  ? "Using location..."
                  : locationEnabled
                  ? "Location access granted"
                  : "Location permission is off"}
              </Text>

              <TouchableOpacity
                style={[
                  styles.allowButton,
                  locationEnabled && { backgroundColor: "#A5A5A5" },
                ]}
                onPress={handleLocationPermission}
                disabled={locationEnabled || isGranting}
              >
                {isGranting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.allowButtonText}>
                    {locationEnabled ? "GRANTED" : "GRANT"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.permissionText}>
              Granting your location will help us provide accurate and
              personalized results near you
            </Text>
          </View>

          {/* ===== Address List Section ===== */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Select Address</Text>
            <Text style={styles.sectionSubtitle}>
              Select your preferred address for this service
            </Text>

            {loadingAddresses ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {addresses.length > 0 ? (
                  <>
                    {addresses.map((addr, index) => (
                      <TouchableOpacity
                        key={addr._id || index}
                        style={styles.addressOption}
                        onPress={() => handleAddressSelect(addr)}
                      >
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={colors.primary}
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.addressText}>
                            {addr.label || "Unnamed"}
                          </Text>
                          <Text
                            style={styles.addressDetails}
                            numberOfLines={1}
                          >
                            {addr.addressLine || addr.address || ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <Text
                    style={{
                      color: "#6B7280",
                      marginBottom: 12,
                      textAlign: "center",
                    }}
                  >
                    No saved addresses found.
                  </Text>
                )}

                {/* Add new address button inside scroll */}
                <TouchableOpacity
                  style={styles.addLocationButton}
                  onPress={handleAddLocation}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.addLocationText}>Add Location</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  locationSection: {
    marginBottom: 24,
    backgroundColor: "#F2EFFD",
    borderRadius: 12,
    padding: 12,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  permissionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 32,
  },
  addressSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  addressDetails: {
    fontSize: 13,
    color: "#6B7280",
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2EFFD",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 12,
  },
  addLocationText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 8,
  },
  allowButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 30,
    width: 78,
    justifyContent: "center",
    alignItems: "center",
  },
  allowButtonText: {
    color: colors.white,
    fontWeight: "500",
    fontSize: 14,
  },
});
