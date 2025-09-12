import {
  address,
  arrow,
  coin,
  customerService,
  deposit,
  documents,
  logout,
  payment,
  Privacy,
  profile,
  terms,
  user,
} from "@/assets/images";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const AccountScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogout = () => {
    setLogoutVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image source={user} style={styles.largeImage} />
            {/* <View style={styles.cameraIconContainer}>
              <Image source={Images.photos} style={styles.cameraIcon} />
            </View> */}
          </View>
          <Text style={styles.title}>Maharashtrian Ghar Ka Khana</Text>
        </View>

        {/* Profile Tab */}
        <MenuItem
          label="Profile"
          image={profile}
          backgroundColor="#004AAD"
          textColor="#fff"
          iconTint="#fff"
          customStyle={{
            borderRadius: 10,
          }}
          onpress={() => router.push("/")}
        />

        {/* Menu Items */}
        {/* <MenuItem
          label="wallet"
          // image={wallet}
          onpress={() => router.push("/")}
        /> */}
        <MenuItem
          label="Payment Method"
          image={payment}
          onpress={() => router.push("/")}
        />
        <MenuItem label="Deposite" image={deposit} />

        <MenuItem label="Document" image={documents} />
        <MenuItem label="Refer & Earn" image={coin} />
        <MenuItem label="Address" image={address} />
        <MenuItem label="Privacy Policy" image={Privacy} />
        <MenuItem label="Terms and Conditions" image={terms} />
        <MenuItem label="Customer Service" image={customerService} />
        {/* Language Selector */}
        <View style={styles.sectionRow}>
          <Text style={styles.languageText}>Language</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>English</Text>
            <Image
              source={arrow}
              style={[
                styles.arrowIcon,
                { tintColor: "grey", transform: [{ rotate: "90deg" }] },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.sectionRow}>
          <Text style={styles.languageText}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        {/* Logout */}
        <MenuItem
          label="Log Out"
          image={logout}
          onpress={() => setLogoutVisible(true)}
        />
      </ScrollView>

      {/* Logout Modal */}
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
  container: { flex: 1, backgroundColor: ".#f7f4f4" },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  profileHeader: { alignItems: "center", marginVertical: 20 },
  profileImageContainer: {
    position: "relative",
    width: 86,
    height: 86,
  },
  largeImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 2,
    right: 5,
  },
  cameraIcon: {
    width: 23,
    height: 23,
  },
  title: {
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
    color: "#0A051F",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 28,
    marginVertical: 5,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  smallIcon: { width: 24, height: 24, marginRight: 12 },
  menuText: { fontSize: 16 },
  arrowIcon: { width: 18, height: 18 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 28,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: "lightGrey",
  },
  languageText: {
    fontSize: 16,

    color: "grey",
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
  },
  dropdownText: { fontSize: 16, color: "#0A0A23" },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 64,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  modalTitle: {
    fontSize: 24,

    color: "orange",
    marginBottom: 8,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "lightGrey",
    marginVertical: 8,
  },
  modalMessage: {
    fontSize: 24,

    color: "#0A051F",
    marginVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#004AAD",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#004AAD",
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "#004AAD",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,

    color: "white",
  },
});

export default AccountScreen;
