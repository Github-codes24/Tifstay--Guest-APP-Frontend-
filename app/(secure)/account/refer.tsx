import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // ✅ added for copy functionality
import colors from "@/constants/colors";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const renderItem = ({ item }) => (
  <View style={styles.historyItem}>
    <Image
      source={require("../../../assets/images/user.png")}
      style={{ height: 34, width: 34 }}
    />
    <View style={styles.historyInfo}>
      <Text style={styles.historyName}>{item.name}</Text>
      <Text style={styles.historyDate}>{item.date}</Text>
    </View>
    <Text style={styles.historyPoints}>{item.points}</Text>
  </View>
);

export default function ReferEarnScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false); // redeem button loading

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const guestId = await AsyncStorage.getItem("guestId");
        if (!guestId) {
          console.warn("Guest ID not found in AsyncStorage");
          setLoading(false);
          return;
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Error", "Login required");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `https://tifstay-project-be.onrender.com/api/guest/referAndEarn/getGuestRefferCode/${guestId}`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  const redeemPoints = async () => {
    if (!data || data.totalPoints <= 0) {
      Alert.alert("No Points", "You don't have any points to redeem.");
      return;
    }

    setRedeeming(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Login required");
        return;
      }

      const res = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/referAndEarn/reedemCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      const json = await res.json();
      if (json.success) {
        Alert.alert("Success", `Redeemed successfully! Wallet amount: ${json.walletAmount}`);
        setData((prev) => (prev ? { ...prev, totalPoints: 0 } : prev));
      } else {
        Alert.alert("Error", json.message || "Failed to redeem points");
      }
    } catch (err) {
      console.error("Redeem error:", err);
      Alert.alert("Error", "Failed to redeem points");
    } finally {
      setRedeeming(false);
    }
  };

  const historyData = useMemo(() => {
    if (!data || !data.referredUser || data.referredUser.length === 0) {
      return [];
    }
    const pointsPerUser = Math.floor(data.totalPoints / data.referredUser.length);
    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });
    return data.referredUser.map((userId) => ({
      id: userId,
      name: userId.substring(userId.length - 6).toUpperCase(),
      date: currentDate,
      points: pointsPerUser,
    }));
  }, [data]);

  const handleCopyCode = async () => {
    if (!data?.code) {
      Alert.alert("Error", "No referral code found to copy.");
      return;
    }
    await Clipboard.setStringAsync(data.code);
    Alert.alert("Copied!", "Referral code copied to clipboard.");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={16} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Total Points</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.pointsValue}>
            {data ? data.totalPoints.toFixed(2) : "0.00"}
          </Text>
          <TouchableOpacity
            style={[styles.redeemButton, { opacity: redeeming ? 0.6 : 1 }]}
            onPress={redeemPoints}
            disabled={redeeming}
          >
            <Text style={styles.redeemButtonText}>
              {redeeming ? "Redeeming..." : "Redeem"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Point Earned History</Text>
        <Text style={styles.historyLink}>See All</Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.referCard}>
        <Text style={styles.referTitle}>Refer your friends</Text>
        <Text style={styles.referDesc}>
          Refer your friends and earn 201 points for every successful referral.
        </Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{data ? data.code : "QR7811"}</Text>

          {/* ✅ Touchable Copy Button */}
          <TouchableOpacity onPress={handleCopyCode}>
            <Text style={styles.copy}>Copy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.referButton}>
          <Text style={styles.referButtonText}>Refer Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
      </View>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  pointsCard: { backgroundColor: "#F5F5F5", borderRadius: 8, padding: 16, marginBottom: 24 },
  pointsLabel: { fontSize: 14, color: colors.grey, paddingVertical: 5, fontWeight: "600" },
  pointsValue: { fontSize: 30, fontWeight: "700", color: colors.title, marginTop: 4 },
  redeemButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  redeemButtonText: { color: "#fff", fontWeight: "600" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: "600", color: colors.title },
  historyLink: { fontSize: 14, color: colors.primary },
  historyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyName: { fontSize: 15, fontWeight: "500", color: colors.grey },
  historyDate: { fontSize: 13, color: colors.gray },
  historyPoints: { fontSize: 15, fontWeight: "600", color: colors.grey },
  footer: { paddingTop: 24 },
  referCard: { backgroundColor: "#F5F5F5", borderRadius: 8, padding: 16 },
  referTitle: { fontSize: 16, fontWeight: "600", color: colors.title, marginBottom: 4 },
  referDesc: { fontSize: 14, color: colors.grey, marginBottom: 12, fontWeight: "600" },
  codeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  code: { fontSize: 30, fontWeight: "700", color: colors.title },
  copy: { fontSize: 14, color: colors.grey, fontWeight: "600" },
  referButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  referButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});
