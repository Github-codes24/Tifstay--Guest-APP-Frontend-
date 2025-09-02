import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import colors from "../constants/colors";

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

  const handleLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    onLocationSelected(location);
    onClose();
  };

  const handleSelectPreset = (type: string) => {
    onLocationSelected({ type });
    onClose();
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
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Allow location access</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.locationText}>Location permission is off</Text>
            <Switch
              value={locationEnabled}
              onValueChange={(value) => {
                setLocationEnabled(value);
                if (value) handleLocationPermission();
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <Text style={styles.permissionText}>
            Granting your location will help us provide accurate and
            personalized results near you
          </Text>

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
              />
            </TouchableOpacity>
          </View>

          {/* Avatar Group */}
          <View style={styles.avatarGroup}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.avatar, { marginLeft: i > 1 ? -10 : 0 }]}
              >
                <Image
                  source={{ uri: `https://i.pravatar.cc/100?img=${i}` }}
                  style={styles.avatarImage}
                />
              </View>
            ))}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    backgroundColor: colors.border,
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
    backgroundColor: colors.border,
    borderRadius: 12,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  avatarGroup: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
});
