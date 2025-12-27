import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import colors from "@/constants/colors";

const PrivacyPolicyScreen = () => {
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/staticPage/get-privacy-policy"
        );

        if (response.data.success) {
          const data = response.data.data;

          // ✅ Fallback check for empty array or missing description
          if (!data || data.length === 0 || !data[0]?.description) {
            setPolicy("No privacy policy available.");
          } else {
            setPolicy(data[0].description);
          }
        } else {
          setPolicy("Failed to load privacy policy.");
        }
      } catch (error) {
        console.error("API Error:", error);
        Alert.alert("API Error", error.message);
        setPolicy("An error occurred while fetching privacy policy.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollContent}>
          <Text style={styles.paragraph}>{policy}</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: "#000",
  },
  scrollContent: {
    paddingHorizontal: 19,
  },
  paragraph: {
    fontSize: 16,
    color: "#444",
    fontWeight: "400",
    marginTop: 8,
  },
});