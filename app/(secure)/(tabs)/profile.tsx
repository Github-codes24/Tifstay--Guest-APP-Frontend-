import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface MenuItem {
  id: string;
  icon: any;
  title: string;
  hasArrow?: boolean;
  onPress?: () => void;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: "profile",
      icon: "person-outline",
      title: "Profile",
      hasArrow: true,
      onPress: () => console.log("Profile pressed"),
    },
    {
      id: "wallet",
      icon: "wallet-outline",
      title: "Wallet",
      hasArrow: true,
      onPress: () => console.log("Wallet pressed"),
    },
    {
      id: "payment",
      icon: "card-outline",
      title: "Payment Methods",
      hasArrow: true,
      onPress: () => console.log("Payment Methods pressed"),
    },
    {
      id: "deposit",
      icon: "trending-up-outline",
      title: "Deposit",
      hasArrow: true,
      onPress: () => console.log("Deposit pressed"),
    },
    {
      id: "documents",
      icon: "document-text-outline",
      title: "Documents",
      hasArrow: true,
      onPress: () => console.log("Documents pressed"),
    },
    {
      id: "refer",
      icon: "gift-outline",
      title: "Refer & Earn",
      hasArrow: true,
      onPress: () => console.log("Refer & Earn pressed"),
    },
    {
      id: "address",
      icon: "location-outline",
      title: "Address",
      hasArrow: true,
      onPress: () => console.log("Address pressed"),
    },
    {
      id: "privacy",
      icon: "shield-checkmark-outline",
      title: "Privacy Policy",
      hasArrow: true,
      onPress: () => console.log("Privacy Policy pressed"),
    },
    {
      id: "terms",
      icon: "newspaper-outline",
      title: "Terms and Conditions",
      hasArrow: true,
      onPress: () => console.log("Terms and Conditions pressed"),
    },
    {
      id: "support",
      icon: "headset-outline",
      title: "Customer Service",
      hasArrow: true,
      onPress: () => console.log("Customer Service pressed"),
    },
  ];

  const handleLogout = () => {
    console.log("Logout pressed");
    onClick={() => {
      
    }}
    
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Onil Karmokar</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#374151" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.hasArrow && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          {/* Language Selector */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Language</Text>
            <TouchableOpacity style={styles.languageButton}>
              <Text style={styles.languageText}>English</Text>
              <Ionicons name="chevron-down" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#E5E7EB", true: "#004AAD" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
          <Ionicons name="chevron-forward" size={20} color="#DC2626" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    width: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  menuContainer: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#374151",
  },
  settingsSection: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#374151",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  languageText: {
    fontSize: 14,
    color: "#374151",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  logoutText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "500",
  },
});
