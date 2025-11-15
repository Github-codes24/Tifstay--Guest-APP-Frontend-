import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

const TermsAndConditionsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<{ title?: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const res = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/staticPage/get-terms-and-conditions"
      );

      if (res.data.success) {
        // ✅ Fallback for empty or missing data
        if (res.data.data && res.data.data.length > 0) {
          setTerms(res.data.data[0]);
        } else {
          setTerms(null);
        }
      } else {
        setError("Failed to fetch terms.");
      }
    } catch (err) {
      console.error("Error fetching terms:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {terms?.title || "Terms and Conditions"}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loader}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      ) : !terms ? (
        // ✅ Fallback shown top-left instead of centered
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.paragraph}>
            No Terms and Conditions available at the moment.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.paragraph}>{terms.description}</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  paragraph: {
    fontSize: 16,
    color: colors.title,
    marginTop: 8,
    lineHeight: 22,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
});