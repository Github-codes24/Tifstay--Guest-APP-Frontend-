import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { arrow } from "@/assets/images";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchProfile = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await axios.get(
    "https://tifstay-project-be.onrender.com/api/guest/getProfile",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data.data.guest;
};

const fetchProfileImage = async (guestId: string) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const response = await axios.get(
    `https://tifstay-project-be.onrender.com/api/guest/viewProfileImage/${guestId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data.profileImage;
};

const MyProfileScreen = () => {
  const queryClient = useQueryClient();
  const [cachedProfile, setCachedProfile] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>("");
  const { width, height } = useWindowDimensions();

  // ✅ Load cached profile from AsyncStorage first
  useEffect(() => {
    (async () => {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setCachedProfile(parsed.guest);
      }
    })();
  }, []);

  // ✅ Fetch with React Query
  const {
    data: profile,
    refetch,
  } = useQuery({
    queryKey: ["guestProfile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    initialData: cachedProfile,
    onSuccess: async (freshData) => {
      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify({ guest: freshData })
      );
    },
  });

  // ✅ Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleImagePress = async () => {
    if (profile?._id) {
      try {
        const imageUrl = await fetchProfileImage(profile._id);
        if (imageUrl) {
          setFullImageUrl(imageUrl);
          setShowImageModal(true);
        }
      } catch (error) {
        // Fallback to cached image if API fails
        if (profile?.profileImage) {
          setFullImageUrl(profile.profileImage);
          setShowImageModal(true);
        }
      }
    }
  };

  const closeImageModal = () => setShowImageModal(false);

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

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          {/* ✅ If no image, show empty circle */}
          <TouchableOpacity onPress={handleImagePress}>
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require("../../../assets/images/fallbackdp.png")}
                style={styles.profileImage}
              />
            )}
          </TouchableOpacity>

          {/* ✅ Only show name if available */}
          {profile?.name ? (
            <Text style={styles.profileName}>{profile.name}</Text>
          ) : null}
        </View>

        {/* Info section */}
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

        {/* Menu Items */}
        {/* <MenuItem
          label="Manage Profile"
          icon={require("@/assets/images/manage.png")}
          onPress={() => router.push("/account/editProfile")}
        />
        <MenuItem
          label="Change Password"
          icon={require("@/assets/images/lock1.png")}
          onPress={() => router.push("/(secure)/account/changepass")}
        /> */}
        <MenuItem
          label="Delete Account"
          icon={require("@/assets/images/del.png")}
          onPress={() => router.push("/(secure)/account/deleteAccount")}
        />
      </ScrollView>

      {/* 🔹 Profile Image Modal */}
      <Modal
        transparent
        visible={showImageModal}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageViewer}
            activeOpacity={1}
            onPress={closeImageModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: fullImageUrl }}
                style={[
                  styles.fullImage,
                  {
                    width: width * 0.9,
                    height: height * 0.7,
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageCloseButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
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
  emptyCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f0f0f0",
  },
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
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  imageViewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    resizeMode: "contain",
  },
  imageCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
});

export default MyProfileScreen;