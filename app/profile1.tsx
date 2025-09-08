import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";

// Import the router if needed
// import { router } from "expo-router";

const MyProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
                      <TouchableOpacity onPress={() => router.push('/profile')}>
      <Image
        source={require('../assets/images/backicon.png')}
        style={styles.headerIcon}
      />
    </TouchableOpacity>
                <Text style={styles.headerTitle}>My profile</Text>
                
              </View>
        <View style={styles.profileSection}>
          <Image
            source={require("../assets/images/user.png")}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Onil Karmokar</Text>
        </View>

        <View style={styles.infoCard}>
         <InfoRow
        icon={require("../assets/images/name.png")}
        label="Address"
        value="Maharashtrian Ghar Ka Khana"
/>

          <InfoRow
            icon={require("../assets/images/email.png")}
            label="Email"
            value="maharashtrian@gmail.com"
          />
          <InfoRow
            icon={require("../assets/images/phone.png")}
            label="Phone Number"
            value="715-601-4598"
          />
          <InfoRow
            icon={require("../assets/images/calender.png")}
            label="Date Of Birth"
            value={'12.09.2008'}
          />
        </View>

        <MenuItem
          label="Manage Profile"
          icon={require("../assets/images/manageprofile.png")}
        />

        <MenuItem
          label="Change Password"
          icon={require("../assets/images/lock.png")}
          // onPress={() => router.push("/(accountScreens)/changePassword")}
        />

        <MenuItem
          label="Delete Account"
          icon={require("../assets/images/delet.png")}
          // onPress={() => router.push("/(accountScreens)/deleteAccount")}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <Image source={icon} style={styles.infoIcon} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuItem = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: any;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Image source={icon} style={styles.menuIcon} />
      <Text style={styles.menuText}>{label}</Text>
    </View>
    {/* Optional arrow or navigation icon can be added here */}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
  flexDirection: "row", // 👈 horizontal layout
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: "white",

},
headerTitle: {
    marginTop:15,
  fontSize: 20,
  marginLeft:20,
  fontWeight: "bold",
  color: "#0A051F",
},
headerIcon: {
  marginTop:15,
  width: 28,
  height: 28,
  resizeMode: "contain",
},
  profileSection: {
    alignItems: "center",
    // marginTop: 24,
    marginBottom: 16,
  },
  profileImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  profileName: {
    fontSize: 18,
    // marginTop: 12,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "#F8F5FF",
    marginHorizontal: 26,
    borderRadius: 12,
    padding: 16,
    // marginTop: 14,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#0A051F",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: "grey",
    lineHeight: 20,
  },
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
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: "#0A051F",
    fontWeight:400
  },
});

export default MyProfileScreen;
