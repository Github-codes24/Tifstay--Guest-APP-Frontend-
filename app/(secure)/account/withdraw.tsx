import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // ← Added
import colors from "@/constants/colors";

const COLORS = {
  bg: "#FFFFFF",
  text: "#0A0A0A",
  subText: "#6B7280",
  border: "#E5E7EB",
  dashed: "#D1D5DB",
  primaryBlue: "#1A73E8",
  card: "#FFFFFF",
  shadow: "rgba(16, 24, 40, 0.04)",
};

export default function DocumentsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // ── Fetch profile for guest ID ──────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return null;

      const res = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/getProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data?.data?.guest || null;
    },
    staleTime: 5 * 60 * 1000, // Same as your global default
  });

  // ── Cached fetch of existing Aadhaar ───────────────────────────────
  const { data: aadhaarUrl, isLoading: fetchLoading } = useQuery<string | null>({
    queryKey: ["aadhaar"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return null;

      const res = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/documents/documents",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data?.documents?.aadhaarCard || null;
    },
    staleTime: 5 * 60 * 1000, // Same as your global default
  });

  // ── Upload / Update mutation (invalidates cache on success) ───────
  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("You must be logged in");

      const formData = new FormData();
      formData.append("aadhaarCard", {
        uri,
        type: "image/jpeg",
        name: "aadhaar.jpg",
      } as any);

      const res = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/documents/uploadAadhaar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data.success) throw new Error("Upload failed");

      return res.data.data?.aadhaarUrl || uri;
    },
    onSuccess: (newUrl) => {
      const previousUrl = queryClient.getQueryData<string | null>(["aadhaar"]);
      queryClient.setQueryData(["aadhaar"], newUrl); // Instant optimistic update (no extra API call)
      Alert.alert("Success", previousUrl ? "Aadhaar updated!" : "Aadhaar uploaded!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to upload Aadhaar. Please try again.");
    },
  });

  const loading = fetchLoading || uploadMutation.isPending || profileLoading;

  // ── Pick image → trigger mutation ─────────────────────────────────
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to upload.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      uploadMutation.mutate(uri); // ← Triggers cached update
    } catch (err) {
      console.log("Image pick error:", err);
    }
  };

  // ── Open modal with Aadhaar image via API ─────────────────────────
  const openModal = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !profile?._id) {
      Alert.alert("Error", "Please log in again.");
      return;
    }

    try {
      const res = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/viewAdharCard/${profile._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setModalImageUrl(res.data.aadhaarCard);
        setModalVisible(true);
      } else {
        Alert.alert("Error", "Failed to fetch Aadhaar.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch Aadhaar image.");
    }
  };

  const onDigiLocker = () => {
    Alert.alert("DigiLocker", "Hook this to your DigiLocker flow.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Upload your document</Text>

        {/* Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="camera-outline" size={18} color="#111" />
            <Text style={styles.cardTitle}>Aadhaar Card Photo</Text>
          </View>

          {loading ? (
            <View style={[styles.dashedArea, { justifyContent: "center" }]}>
              <ActivityIndicator size="small" color={COLORS.primaryBlue} />
              <Text style={{ fontSize: 12, marginTop: 8, color: COLORS.subText }}>
                Please wait...
              </Text>
            </View>
          ) : (
            <View style={styles.dashedArea}>
              {aadhaarUrl ? (
                <Pressable onPress={openModal} style={styles.previewContainer}>
                  <Image source={{ uri: aadhaarUrl }} style={styles.preview} resizeMode="cover" />
                </Pressable>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.uploadTitle}>No Aadhaar uploaded</Text>
                  <Text style={styles.uploadHint}>Upload a clear Aadhaar photo</Text>
                </View>
              )}
            </View>
          )}

          {/* Upload / Update Button */}
          <Pressable
            onPress={pickAndUploadImage}
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {aadhaarUrl ? "Update Aadhaar" : "Upload Aadhaar"}
            </Text>
          </Pressable>
        </View>

        {/* <Text style={styles.orText}>Or</Text> */}

        {/* DigiLocker */}
        {/* <Pressable onPress={onDigiLocker} style={styles.digilockerBtn}>
          <Text style={styles.digilockerText}>Verify with DigiLocker</Text>
        </Pressable> */}
      </ScrollView>

      {/* Aadhaar Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalClose} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
          {modalImageUrl && (
            <Image source={{ uri: modalImageUrl }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.title,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  pageTitle: {
    fontSize: 16,
    color: colors.title,
    marginBottom: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.title },
  dashedArea: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.dashed,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  preview: { width: "100%", height: "100%" },
  uploadTitle: { marginTop: 6, fontSize: 12, color: colors.grey, fontWeight: "600" },
  uploadHint: { marginTop: 4, fontSize: 10, color: colors.grey },
  primaryBtn: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
  },
  primaryBtnText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 14 },
  orText: {
    textAlign: "center",
    marginVertical: 16,
    color: COLORS.subText,
    fontWeight: "600",
  },
  digilockerBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  digilockerText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  // ── Modal Styles ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  modalImage: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
  },
});