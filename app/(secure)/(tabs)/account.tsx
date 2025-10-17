import {
  address,
  arrow,
  coin,
  customerService,
  deposit,
  documents,
  logout,
  Privacy,
  profile,
  terms,
  user,
} from "../../../assets/images";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const AccountScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const { logout } = useAuthStore();

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/getProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfileData(response.data.data.guest);
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profileData?.profileImage
                  ? { uri: profileData.profileImage }
                  : user
              }
              style={styles.largeImage}
            />
          </View>
          <Text style={styles.title}>{profileData?.name || "Loading..."}</Text>
        </View>

        <MenuItem
          label="Profile"
          image={profileData?.profileImage ? { uri: profileData.profileImage } : profile}
          backgroundColor="#004AAD"
          textColor="#fff"
          iconTint="#fff"
          customStyle={{ borderRadius: 10 }}
          onpress={() => router.push("/(secure)/account/profile")}
        />

        <MenuItem
          label="Wallet"
          image={require("../../../assets/images/icon/wallet.png")}
          onpress={() => router.push("/(secure)/account/wallet")}
        />
        {/* <MenuItem
          label="Payment Method"
          image={require("../../../assets/images/payment.png")}
          onpress={() => router.push("/(secure)/account/method")}
        /> */}
        <MenuItem
          label="Deposit"
          image={deposit}
          onpress={() => router.push("/(secure)/account/deposite")}
        />
        <MenuItem
          label="Document"
          image={documents}
          onpress={() => router.push("/(secure)/account/withdraw")}
        />
        <MenuItem
          label="Refer & Earn"
          image={coin}
          onpress={() => router.push("/(secure)/account/refer")}
        />
        <MenuItem
          label="Address"
          image={address}
          onpress={() => router.push("/(secure)/account/address")}
        />
        <MenuItem
          label="Privacy Policy"
          image={Privacy}
          onpress={() => router.push("/(secure)/account/privacyPolicy")}
        />
        <MenuItem
          label="Terms and Conditions"
          image={terms}
          onpress={() => router.push("/(secure)/account/termsCondition")}
        />
        <MenuItem
          label="Customer Service"
          image={customerService}
          onpress={() => router.push("/(secure)/account/contactUs")}
        />

        <View style={styles.sectionRow}>
          <Text style={styles.languageText}>Language</Text>
          <TouchableOpacity style={styles.dropdownContainer} activeOpacity={0.7}>
            <Text style={styles.dropdownText}>English</Text>
            <Image
              source={arrow}
              style={[styles.arrowIcon, { tintColor: "grey", transform: [{ rotate: "90deg" }] }]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.languageText}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        <MenuItem
          label="Log Out"
          image={logout}
          onpress={() => setLogoutVisible(true)}
        />
      </ScrollView>

      <Modal
        transparent
        visible={logoutVisible}
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Logout</Text>
            <View style={styles.divider} />
            <Text style={styles.modalMessage}>Are you sure?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const MenuItem = ({
  label,
  image,
  backgroundColor,
  textColor = "grey",
  iconTint = "grey",
  customStyle = {},
  onpress,
}: {
  label: string;
  image: any;
  backgroundColor?: string;
  textColor?: string;
  iconTint?: string;
  customStyle?: ViewStyle;
  onpress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.menuItem, { backgroundColor }, customStyle]}
    onPress={onpress}
  >
    <View style={styles.menuLeft}>
      <Image source={image} style={styles.smallIcon} />
      <Text style={[styles.menuText, { color: textColor }]}>{label}</Text>
    </View>
    <Image source={arrow} style={[styles.arrowIcon, { tintColor: iconTint }]} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f4" },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  profileHeader: { alignItems: "center", marginVertical: 20 },
  profileImageContainer: { position: "relative", width: 86, height: 86 },
  largeImage: { width: 86, height: 86, borderRadius: 43 },
  title: { marginTop: 10, fontSize: 18, textAlign: "center", color: "#0A051F" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, marginHorizontal: 28, marginVertical: 5, borderRadius: 8, justifyContent: "space-between" },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  smallIcon: { width: 24, height: 24, marginRight: 12 },
  menuText: { fontSize: 16 },
  arrowIcon: { width: 18, height: 18 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 28, paddingVertical: 16, paddingHorizontal: 16, borderTopWidth: 0.5, borderTopColor: "lightGrey" },
  languageText: { fontSize: 16, color: "grey" },
  dropdownContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#C4C4C4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 120 },
  dropdownText: { fontSize: 16, color: "#0A0A23" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 64, alignItems: "center", paddingHorizontal: 30 },
  modalTitle: { fontSize: 24, color: "orange", marginBottom: 8 },
  divider: { width: "100%", height: 1, backgroundColor: "lightGrey", marginVertical: 8 },
  modalMessage: { fontSize: 24, color: "#0A051F", marginVertical: 12 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10 },
  cancelButton: { flex: 1, marginRight: 10, borderWidth: 1, borderColor: "#004AAD", borderRadius: 25, paddingVertical: 10, alignItems: "center" },
  cancelText: { fontSize: 16, color: "#004AAD" },
  logoutButton: { flex: 1, backgroundColor: "#004AAD", borderRadius: 25, paddingVertical: 10, alignItems: "center" },
  logoutText: { fontSize: 16, color: "white" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});

export default AccountScreen;
