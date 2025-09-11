// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import {
//   Image,
//   ScrollView,
//   StyleSheet,
//   Switch,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// interface MenuItem {
//   id: string;
//   icon: any;
//   title: string;
//   hasArrow?: boolean;
//   onPress?: () => void;
// }

// export default function ProfileScreen() {
//   const router = useRouter();
//   const [darkMode, setDarkMode] = useState(false);

//   const menuItems: MenuItem[] = [
//     {
//       id: "profile",
//       icon: "person-outline",
//       title: "Profile",
//       hasArrow: true,
//       onPress: () => console.log("Profile pressed"),
//     },
//     {
//       id: "wallet",
//       icon: "wallet-outline",
//       title: "Wallet",
//       hasArrow: true,
//       onPress: () => console.log("Wallet pressed"),
//     },
//     {
//       id: "payment",
//       icon: "card-outline",
//       title: "Payment Methods",
//       hasArrow: true,
//       onPress: () => console.log("Payment Methods pressed"),
//     },
//     {
//       id: "deposit",
//       icon: "trending-up-outline",
//       title: "Deposit",
//       hasArrow: true,
//       onPress: () => console.log("Deposit pressed"),
//     },
//     {
//       id: "documents",
//       icon: "document-text-outline",
//       title: "Documents",
//       hasArrow: true,
//       onPress: () => console.log("Documents pressed"),
//     },
//     {
//       id: "refer",
//       icon: "gift-outline",
//       title: "Refer & Earn",
//       hasArrow: true,
//       onPress: () => console.log("Refer & Earn pressed"),
//     },
//     {
//       id: "address",
//       icon: "location-outline",
//       title: "Address",
//       hasArrow: true,
//       onPress: () => console.log("Address pressed"),
//     },
//     {
//       id: "privacy",
//       icon: "shield-checkmark-outline",
//       title: "Privacy Policy",
//       hasArrow: true,
//       onPress: () => console.log("Privacy Policy pressed"),
//     },
//     {
//       id: "terms",
//       icon: "newspaper-outline",
//       title: "Terms and Conditions",
//       hasArrow: true,
//       onPress: () => console.log("Terms and Conditions pressed"),
//     },
//     {
//       id: "support",
//       icon: "headset-outline",
//       title: "Customer Service",
//       hasArrow: true,
//       onPress: () => console.log("Customer Service pressed"),
//     },
//   ];

//   const handleLogout = () => {
//     console.log("Logout pressed");
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={["top"]}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Account</Text>
//         <View style={styles.headerRight} />
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Profile Section */}
//         <View style={styles.profileSection}>
//           <Image
//             source={{ uri: "https://i.pravatar.cc/100" }}
//             style={styles.profileImage}
//           />
//           <Text style={styles.profileName}>Onil Karmokar</Text>
//         </View>

//         {/* Menu Items */}
//         <View style={styles.menuContainer}>
//           {menuItems.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={styles.menuItem}
//               onPress={item.onPress}
//             >
//               <View style={styles.menuItemLeft}>
//                 <Ionicons name={item.icon} size={24} color="#374151" />
//                 <Text style={styles.menuItemText}>{item.title}</Text>
//               </View>
//               {item.hasArrow && (
//                 <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
//               )}
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Settings Section */}
//         <View style={styles.settingsSection}>
//           {/* Language Selector */}
//           <View style={styles.settingItem}>
//             <Text style={styles.settingLabel}>Language</Text>
//             <TouchableOpacity style={styles.languageButton}>
//               <Text style={styles.languageText}>English</Text>
//               <Ionicons name="chevron-down" size={18} color="#374151" />
//             </TouchableOpacity>
//           </View>

//           {/* Dark Mode Toggle */}
//           <View style={styles.settingItem}>
//             <Text style={styles.settingLabel}>Dark Mode</Text>
//             <Switch
//               value={darkMode}
//               onValueChange={setDarkMode}
//               trackColor={{ false: "#E5E7EB", true: "#004AAD" }}
//               thumbColor="#fff"
//             />
//           </View>
//         </View>

//         {/* Logout Button */}
//         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={24} color="#DC2626" />
//           <Text style={styles.logoutText}>Log Out</Text>
//           <Ionicons name="chevron-forward" size={20} color="#DC2626" />
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E5E7EB",
//   },
//   backButton: {
//     width: 40,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#111827",
//   },
//   headerRight: {
//     width: 40,
//   },
//   profileSection: {
//     alignItems: "center",
//     paddingVertical: 24,
//     backgroundColor: "#fff",
//     marginBottom: 8,
//   },
//   profileImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 12,
//   },
//   profileName: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#111827",
//   },
//   menuContainer: {
//     backgroundColor: "#fff",
//     marginBottom: 8,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   menuItemLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 16,
//   },
//   menuItemText: {
//     fontSize: 16,
//     color: "#374151",
//   },
//   settingsSection: {
//     backgroundColor: "#fff",
//     paddingVertical: 8,
//     marginBottom: 8,
//   },
//   settingItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },
//   settingLabel: {
//     fontSize: 16,
//     color: "#374151",
//   },
//   languageButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: "#F3F4F6",
//     borderRadius: 8,
//   },
//   languageText: {
//     fontSize: 14,
//     color: "#374151",
//   },
//   logoutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#fff",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     marginBottom: 20,
//   },
//   logoutText: {
//     flex: 1,
//     marginLeft: 16,
//     fontSize: 16,
//     color: "#DC2626",
//     fontWeight: "500",
//   },
// });

import { address, arrow, coin, customerService, deposit, documents, logout, payment, Privacy, profile, terms, user, wallet } from "@/assets/images";
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
          onpress={() => router.push("/TrackOrder")}
        />

        {/* Menu Items */}
        <MenuItem
          label="wallet"
          image={wallet}
         onpress={() => router.push("/RateNow")}
        />
        <MenuItem
          label="Payment Method"
          image={payment}
            onpress={() => router.push("/Confirmation")}
        />
        <MenuItem label="Deposite" 
        image={deposit} 
        
        />

        <MenuItem
          label="Document"
          image={documents}
         
        />
        <MenuItem
          label="Refer & Earn"
          image={coin}
        
        />
        <MenuItem
          label="Address"
          
          image={address}
        />
         <MenuItem
          label="Privacy Policy"
         
          image={Privacy}
        />
         <MenuItem
          label="Terms and Conditions"
         
          image={terms}
        />
         <MenuItem
          label="Customer Service"
         
          image={customerService}
        />
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
  backgroundColor ,
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
    <Image
      source={arrow}
      style={[styles.arrowIcon, { tintColor: iconTint }]}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ".#f7f4f4" },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  profileHeader: { alignItems: "center", marginVertical: 20 },
  profileImageContainer: {
    position: 'relative',
    width: 86,
    height: 86,
  },
  largeImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraIconContainer: {
    position: 'absolute',
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
    color: '#0A051F',
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
  menuText: { fontSize: 16,  },
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
   color:  "#004AAD",
  },
  logoutButton: {
    flex: 1,
    backgroundColor:  "#004AAD",
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
