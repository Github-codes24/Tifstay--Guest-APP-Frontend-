import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import colors from "../../constants/colors";
import Header from "../Header";

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
  const [manualLocation, setManualLocation] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);

  const handleLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    onLocationSelected(location);
    setLocationEnabled(true);
    onClose();
  };

  const handleSelectPreset = (type: string) => {
    onLocationSelected({ type });
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualLocation.trim()) {
      onLocationSelected(manualLocation);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Header title="Allow location access" onBack={onClose} />
        </View>

        <View style={styles.content}>
          <View style={styles.locationSection}>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.locationText}>
                Location permission is off
              </Text>

              {/* Replacing Toggle with Button */}
              <TouchableOpacity
                style={styles.allowButton}
                onPress={handleLocationPermission}
              >
                <Text style={styles.allowButtonText}>GRANT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.permissionText}>
              Granting your location will help us provide accurate and
              personalized results near you
            </Text>
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Select Address</Text>
            <Text style={styles.sectionSubtitle}>
              Select your preferred address for this service
            </Text>

            <TouchableOpacity
              style={styles.addressOption}
              onPress={() => handleSelectPreset("home")}
            >
              <Ionicons name="home" size={20} color={colors.primary} />
              <Text style={styles.addressText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addressOption}
              onPress={() => handleSelectPreset("work")}
            >
              <Ionicons name="briefcase" size={20} color={colors.primary} />
              <Text style={styles.addressText}>Work</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualInput}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder="Enter Location Manually"
                style={styles.input}
                placeholderTextColor={colors.textSecondary}
                value={manualLocation}
                onChangeText={setManualLocation}
                onSubmitEditing={handleManualSubmit}
                returnKeyType="done"
              />
            </TouchableOpacity>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
   
  },
  addressText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  manualInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#F2EFFD",
    borderRadius: 8,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
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
