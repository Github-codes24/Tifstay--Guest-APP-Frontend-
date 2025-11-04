import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch existing uploaded Aadhaar
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/documents/documents",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.documents?.aadhaarCard) {
          setImageUri(res.data.documents.aadhaarCard);
        }
      } catch (err) {
        console.log("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // ✅ Pick and upload image directly
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
      await handleUpload(uri); // upload immediately
    } catch (err) {
      console.log("Image pick error:", err);
    }
  };

  // ✅ Upload Aadhaar (used for both upload & update)
  const handleUpload = async (uri: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You must be logged in to upload documents.");
        return;
      }

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

      if (res.data.success) {
        Alert.alert("Success", imageUri ? "Aadhaar updated!" : "Aadhaar uploaded!");
        setImageUri(res.data.data?.aadhaarUrl || uri);
      } else {
        Alert.alert("Error", "Upload failed. Try again.");
      }
    } catch (error: any) {
      console.log("Upload error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to upload Aadhaar. Please try again.");
    } finally {
      setLoading(false);
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
        <Text style={styles.pageTitle}>Upload your document or DigiLocker</Text>

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
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
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
              {imageUri ? "Update Aadhaar" : "Upload Aadhaar"}
            </Text>
          </Pressable>
        </View>

        {/* <Text style={styles.orText}>Or</Text> */}

        {/* DigiLocker */}
        {/* <Pressable onPress={onDigiLocker} style={styles.digilockerBtn}>
          <Text style={styles.digilockerText}>Verify with DigiLocker</Text>
        </Pressable> */}
      </ScrollView>
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
});
