import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { router } from "expo-router";
import colors from "@/constants/colors";
import { arrow } from "@/assets/images";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const MyProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/getProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data.data.guest);
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const displayValue = (value: string | undefined) => value || "";



  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { justifyContent: "space-between" }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={16} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/account/editProfile")}>
          <Text style={{ color: colors.primary, fontWeight: "500" }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image
            source={
              profile?.profileImage
                ? { uri: profile.profileImage }
                : require("@/assets/images/user.png")
            }
            style={styles.profileImage}
          />

          <Text style={styles.profileName}>{displayValue(profile?.name) || "Loading..."}</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            icon={require("@/assets/images/name.png")}
            label="Name"
            value={displayValue(profile?.name)}
          />
          <InfoRow
            icon={require("@/assets/images/email1.png")}
            label="Email"
            value={displayValue(profile?.email)}
          />
          <InfoRow
            icon={require("@/assets/images/phone.png")}
            label="Phone Number"
            value={displayValue(profile?.phoneNumber)}
          />
          <InfoRow
            icon={require("@/assets/images/cal.png")}
            label="Date of Birth"
            value={displayValue(profile?.dob)}
          />
        </View>

        <MenuItem
          label="Manage Profile"
          icon={require("@/assets/images/manage.png")}
          onPress={() => router.push("/account/editProfile")}
        />
        <MenuItem
          label="Change Password"
          icon={require("@/assets/images/lock1.png")}
          onPress={() => router.push("/(secure)/account/changepass")}
        />
        <MenuItem
          label="Delete Account"
          icon={require("@/assets/images/del.png")}
          onPress={() => router.push("/(secure)/account/deleteAccount")}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Image source={icon} style={styles.infoIcon} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({ label, icon, onPress }: { label: string; icon: any; onPress?: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Image source={icon} style={styles.menuIcon} />
      <Text style={styles.menuText}>{label}</Text>
    </View>
    <Image source={arrow} style={styles.arrowIcon} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 30 },
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
  profileSection: { alignItems: "center", marginTop: 24, marginBottom: 16 },
  profileImage: { width: 86, height: 86, borderRadius: 43 },
  profileName: { fontSize: 18, marginTop: 12 },
  infoCard: {
    backgroundColor: "#F8F5FF",
    marginHorizontal: 26,
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
  },
  infoRow: { flexDirection: "row", marginBottom: 16 },
  infoIcon: { width: 40, height: 40, marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 14, fontWeight: "600", color: colors.title, marginBottom: 2 },
  infoValue: { fontSize: 12, color: colors.grey, lineHeight: 20 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    backgroundColor: "#F8F7FF",
    marginTop: 16,
    height: 72,
    marginHorizontal: 26,
    borderRadius: 12,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuIcon: { width: 40, height: 40, marginRight: 12 },
  menuText: { fontSize: 14, color: colors.title },
  arrowIcon: { width: 18, height: 18, tintColor: colors.title },
});

export default MyProfileScreen;
