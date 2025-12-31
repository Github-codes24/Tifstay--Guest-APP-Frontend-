import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from '@react-navigation/native';
import Toast from "react-native-toast-message";
import colors from "@/constants/colors";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/constants/utils";
import { Linking, Alert } from "react-native";
import { BASE_URL } from "@/constants/api";

const fallbackImage = require("../../../assets/images/fallbackdp.png");

const renderItem = ({ item }) => (
  <View style={styles.historyItem}>
    <Image
      source={item.image ? { uri: item.image } : fallbackImage}
      style={{ height: 34, width: 34, borderRadius: 17 }}
      defaultSource={fallbackImage}
      onError={() => {}}
    />
    <View style={styles.historyInfo}>
      <Text style={styles.historyName}>{item.name}</Text>
      <Text style={styles.historyDate}>{item.date}</Text>
    </View>
    <Text style={styles.historyPoints}>{item.points}</Text>
  </View>
);

const fetchReferralData = async () => {
  const guestId = await AsyncStorage.getItem("guestId");
  if (!guestId) throw new Error("Guest ID not found");
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const response = await fetch(
    `${BASE_URL}/api/guest/referAndEarn/getGuestRefferCode/${guestId}`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const json = await response.json();
  if (!json.success) {
    throw new Error("Failed to fetch referral data");
  }
  return json.data;
};

const fetchPointsData = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const response = await fetch(
    `${BASE_URL}/api/guest/referAndEarn/getPonits`,
    { headers: { Authorization: "Bearer " + token } }
  );
  const json = await response.json();
  if (!json.success) {
    throw new Error("Failed to fetch points data");
  }
  return json.Points?.[0]?.cashBackPoints || null;
};

export default function ReferEarnScreen() {
  const queryClient = useQueryClient();
  const [redeeming, setRedeeming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: referralData,
    isPending: referralLoading,
    refetch: refetchReferral,
  } = useQuery({
    queryKey: ["referralData"],
    queryFn: fetchReferralData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching referral data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch referral data",
      });
    },
  });

  const {
    data: cashBackPoints,
    isPending: pointsLoading,
    refetch: refetchPoints,
  } = useQuery({
    queryKey: ["pointsData"],
    queryFn: fetchPointsData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching points data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch points data",
      });
    },
  });

  const loading = referralLoading || pointsLoading;

  const handleWhatsAppShare = async () => {
    if (!referralData?.code) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Referral code not available",
      });
      return;
    }
    const message = `Hey!
Join Tifstay using my referral code *${referralData.code}* and earn rewards.
Download now!`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "WhatsApp not installed",
        "Please install WhatsApp to share the referral code."
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        await Promise.all([refetchReferral(), refetchPoints()]);
      };
      refresh();
    }, [refetchReferral, refetchPoints])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchReferral(), refetchPoints()]);
    } catch (error) {
      console.error("Error during refresh:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to refresh data",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetchReferral, refetchPoints]);

  const redeemPoints = async () => {
    if (!referralData || referralData.totalPoints <= 0) {
      Toast.show({
        type: "error",
        text1: "No Points",
        text2: "You don't have any points to redeem.",
      });
      return;
    }
    setRedeeming(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Login required",
        });
        return;
      }
      const res = await fetch(
        `${BASE_URL}/api/guest/referAndEarn/reedemCode`,
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
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Redeemed successfully! Wallet amount: ${json.walletAmount}`,
        });
        await queryClient.invalidateQueries({ queryKey: ["referralData"] });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: json.message || "Failed to redeem points",
        });
      }
    } catch (err) {
      console.error("Redeem error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to redeem points",
      });
    } finally {
      setRedeeming(false);
    }
  };

  // Show only first 3 referred users on this screen
  const historyData = useMemo(() => {
    if (
      !referralData ||
      !referralData.referredUsers ||
      referralData.referredUsers.length === 0
    ) {
      return [];
    }

    const limitedUsers = referralData.referredUsers.slice(0, 3);

    return limitedUsers.map((user) => ({
      id: user._id,
      name: user.name || "Unknown User",
      date: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
      points: user.points,
      image: user.image || null,
    }));
  }, [referralData]);

  // Check if there are more than 3 referred users → show "See All" + UX message
  const totalReferredUsers = referralData?.referredUsers?.length || 0;
  const hasMoreThanThree = totalReferredUsers > 3;

  const handleCopyCode = async () => {
    if (!referralData?.code) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No referral code found to copy.",
      });
      return;
    }
    await Clipboard.setStringAsync(referralData.code);
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: "Referral code copied to clipboard.",
    });
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
            {referralData ? referralData.totalPoints.toFixed(2) : "0.00"}
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
        {hasMoreThanThree && (
          <TouchableOpacity onPress={() => router.push("/(secure)/account/ReferralUsersScreen")}>
            <Text style={styles.historyLink}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* UX Message - only when more than 3 users */}
      {hasMoreThanThree && (
        <View style={styles.uxMessageContainer}>
          <Text style={styles.uxMessage}>
            Tap <Text style={{ fontWeight: "700", color: colors.primary }}>See All</Text> to view all your referred users
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.referCard}>
        <Text style={styles.referTitle}>Refer your friends</Text>
        <Text style={styles.referDesc}>
          Refer your friends and earn{" "}
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {cashBackPoints !== null ? cashBackPoints : "—"}
          </Text>{" "}
          points for every successful referral.
        </Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{referralData ? referralData.code : "QR7811"}</Text>
          <TouchableOpacity onPress={handleCopyCode}>
            <Text style={styles.copy}>Copy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.referButton}
          onPress={handleWhatsAppShare}
        >
          <Text style={styles.referButtonText}>Refer Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: colors.grey }}>No referrals yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.horizontalSpacing.space_16, marginTop: theme.verticalSpacing.space_30 },
  pointsCard: { backgroundColor: "#F5F5F5", borderRadius: 8, padding: 16, marginBottom: 24 },
  pointsLabel: { fontSize: 14, color: colors.grey, paddingVertical: 5, fontWeight: "600" },
  pointsValue: { fontSize: 30, fontWeight: "700", color: colors.title, marginTop: 4 },
  redeemButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  redeemButtonText: { color: "#fff", fontWeight: "600" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: "600", color: colors.title },
  historyLink: { fontSize: 14, color: colors.primary },
  uxMessageContainer: { marginBottom: 16, paddingHorizontal: 4 },
  uxMessage: { fontSize: 13, color: colors.grey, textAlign: "center", lineHeight: 18 },
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
  backButton: { width: 30, height: 30, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "600", marginLeft: 10, color: "#000" },
});