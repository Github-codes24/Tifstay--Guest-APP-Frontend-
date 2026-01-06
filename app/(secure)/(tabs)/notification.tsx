import Header from "@/components/Header";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BASE_URL } from "@/constants/api";
import { SectionList } from "react-native";

interface Notification {
  _id: string;
  navigationId?: string;
  title: string;
  isRead: boolean;
  createdTime: string;

  // Hostel flags
  isHostelBookingPaymentSuccess?: boolean;
  isHostelTransactionReceived?: boolean;
  isHostelBookingSubmittedForApproval?: boolean;
  isHostelBookingWalletPaymentSuccess?: boolean;
  isHostelBookingRazorPayPaymentSuccess?: boolean;
  isHostelRazorPayTransactionReceived?: boolean;
  isHostelWalletTransactionReceived?: boolean;
  isHostelBookingApproved?: boolean;
  isHostelBookingRazorPayPaymentFailed?: boolean;

  // Wallet flags
  isWalletPaymentSuccess?: boolean;
  isWalletTransactionReceived?: boolean;
  isWalletCredited?: boolean;
  isWalletDebited?: boolean;

  // Deposit flags
  isGuestDepositPaymentSuccess?: boolean;
  isGuestDepositTransactionReceived?: boolean;

  // Others
  isHostelBookingRejected?: boolean;
  isHostelPendingBookingReminder?: boolean;
  isTiffinPendingBookingReminder?: boolean;
  isTiffinBookingSubmittedForApproval?: boolean;
  isTiffinBookingRazorPayPaymentFailed?: boolean;

  // Expiry reminders
  isHostelBookingExpiryReminder?: boolean;
  isTiffinExpiryNotification?: boolean;

  // Tiffin confirmed notifications
  isTiffinBookingApproved?: boolean;
  isTiffinFirstOrderDeliveredOrServed?: boolean;

  // Tiffin rejected notification
  isTiffinBookingRejected?: boolean;

  // Tiffin Razorpay payment success (for pending tab)
  isTiffinBookingRazorPayPaymentSuccess?: boolean;

  // Tiffin Wallet payment success
  isTiffinBookingWalletPaymentSuccess?: boolean;

  // Pending order reminders for cart navigation
  isTiffinPendingOrderReminder?: boolean;

  // NEW: Hostel first booking done
  isHostelFirstBookingDone?: boolean;
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const fetchNotifications = async (pageNum: number, isLoadMore = false) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(
        `${BASE_URL}/api/guest/notification/getAllNotification?page=${pageNum}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newNotifs: Notification[] = response.data.data || [];
        const pagination = response.data.pagination;

        setTotalPages(pagination?.totalPages || 1);

        // Sort newest first
        newNotifs.sort((a, b) => b._id.localeCompare(a._id));

        if (isLoadMore) {
          setNotifications((prev) => [...prev, ...newNotifs]);
        } else {
          setNotifications(newNotifs);
        }

        setPage(pageNum);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    fetchNotifications(page + 1, true);
  };

  // NEW: Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${BASE_URL}/api/guest/notification/markAsRead/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Icon logic (unchanged)
  const getIconName = (item: Notification): keyof typeof Ionicons.glyphMap => {
    if (item.isHostelBookingExpiryReminder || item.isTiffinExpiryNotification) return "time";

    if (
      item.isTiffinBookingApproved ||
      item.isTiffinFirstOrderDeliveredOrServed ||
      item.isHostelBookingApproved ||
      item.isHostelBookingRazorPayPaymentSuccess ||
      item.isTiffinBookingRazorPayPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isHostelFirstBookingDone
    ) return "checkmark-circle";

    if (
      item.isWalletPaymentSuccess ||
      item.isWalletCredited ||
      item.isWalletDebited ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelWalletTransactionReceived
    ) return "wallet";

    if (item.isHostelBookingRejected || item.isTiffinBookingRejected) return "close-circle";

    if (item.isHostelPendingBookingReminder || item.isTiffinPendingOrderReminder) return "cart";

    if (item.isHostelRazorPayTransactionReceived) return "card";
    if (item.isHostelBookingSubmittedForApproval) return "hourglass";
    if (item.isGuestDepositPaymentSuccess || item.isGuestDepositTransactionReceived) return "cash";

    return "notifications";
  };

  // All helper functions (unchanged)
  const isHostelPendingReminder = (item: Notification) => !!item.isHostelPendingBookingReminder;
  const isTiffinPendingOrderReminder = (item: Notification) => !!item.isTiffinPendingOrderReminder;
  const isTiffinRazorPayPaymentSuccessNotification = (item: Notification) =>
    !!item.isTiffinBookingRazorPayPaymentSuccess;
  const isTiffinWalletPaymentSuccess = (item: Notification) =>
    !!item.isTiffinBookingWalletPaymentSuccess;
  const isTiffinBookingConfirmedNotification = (item: Notification) =>
    !!(item.isTiffinBookingApproved || item.isTiffinFirstOrderDeliveredOrServed);
  const isTiffinBookingRejectedNotification = (item: Notification) => !!item.isTiffinBookingRejected;
  const isHostelExpiryReminder = (item: Notification) => !!item.isHostelBookingExpiryReminder;
  const isTiffinExpiryReminder = (item: Notification) => !!item.isTiffinExpiryNotification;
  const isTiffinBookingNotification = (item: Notification) =>
    !!(
      item.isTiffinRazorPayPaymentSuccess ||
      item.isTiffinRazorPayTransactionReceived ||
      item.isTiffinBookingSubmittedForApproval
    );
  const isHostelBookingApprovedNotification = (item: Notification) => !!item.isHostelBookingApproved;
  const isHostelBookingNotification = (item: Notification) =>
    !!(
      item.isHostelBookingRazorPayPaymentSuccess ||
      item.isHostelRazorPayTransactionReceived ||
      item.isHostelBookingSubmittedForApproval
    );
  const isWalletNotification = (item: Notification) =>
    !!(
      item.isWalletPaymentSuccess ||
      item.isWalletTransactionReceived ||
      item.isWalletCredited ||
      item.isWalletDebited ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelWalletTransactionReceived
    );
  const isDepositNotification = (item: Notification) =>
    !!(item.isGuestDepositPaymentSuccess || item.isGuestDepositTransactionReceived);
  const isTiffinPaymentFailed = (item: Notification) => !!item.isTiffinBookingRazorPayPaymentFailed;
  const isHostelPaymentFailed = (item: Notification) => !!item.isHostelBookingRazorPayPaymentFailed;
  const isHostelFirstBookingDoneNotification = (item: Notification) => !!item.isHostelFirstBookingDone;

  const getBackgroundColor = (item: Notification): string => {
    if (
      item.isWalletPaymentSuccess ||
      item.isWalletCredited ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelBookingRazorPayPaymentSuccess ||
      item.isHostelBookingApproved ||
      item.isGuestDepositPaymentSuccess ||
      item.isTiffinBookingApproved ||
      item.isTiffinFirstOrderDeliveredOrServed ||
      item.isTiffinBookingRazorPayPaymentSuccess ||
      item.isHostelFirstBookingDone
    ) {
      return "#F8F9FF"; // Success green background
    }
    return "#F8F9FF"; // Default background
  };

  // UPDATED: handlePress now marks as read first if unread
  const handlePress = async (item: Notification) => {
    // Mark as read if not already read
    if (!item.isRead) {
      await markAsRead(item._id);
    }

    // Existing navigation logic (unchanged)
    if (isHostelExpiryReminder(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "pending", service: "hostel" } });
      return;
    }
    if (isTiffinExpiryReminder(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "pending", service: "tiffin" } });
      return;
    }
    if (isHostelFirstBookingDoneNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "confirmed", service: "hostel" } });
      return;
    }
    if (isTiffinWalletPaymentSuccess(item)) {
      router.push("/account/wallet");
      return;
    }
    if (isHostelPendingReminder(item)) {
      router.push({ pathname: "/(secure)/Cartscreen", params: { tab: "hostel" } });
      return;
    }
    if (isTiffinPendingOrderReminder(item)) {
      router.push({ pathname: "/(secure)/Cartscreen", params: { tab: "tiffin" } });
      return;
    }
    if (isTiffinRazorPayPaymentSuccessNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "pending", service: "tiffin" } });
      return;
    }
    if (isTiffinBookingRejectedNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "rejected", service: "tiffin" } });
      return;
    }
    if (isTiffinBookingConfirmedNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "confirmed", service: "tiffin" } });
      return;
    }
    if (isTiffinPaymentFailed(item)) {
      router.push({ pathname: "/(secure)/Cartscreen", params: { tab: "tiffin" } });
      return;
    }
    if (isHostelPaymentFailed(item)) {
      router.push({ pathname: "/(secure)/Cartscreen", params: { tab: "hostel" } });
      return;
    }
    if (isTiffinBookingNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "pending", service: "tiffin" } });
      return;
    }
    if (isHostelBookingApprovedNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "confirmed", service: "hostel" } });
      return;
    }
    if (isHostelBookingNotification(item)) {
      router.push({ pathname: "/(secure)/(tabs)/booking", params: { tab: "pending", service: "hostel" } });
      return;
    }
    if (isDepositNotification(item)) {
      router.push("/(secure)/account/deposite");
      return;
    }
    if (isWalletNotification(item)) {
      router.push("/account/wallet");
      return;
    }
  };

  // Group by date (unchanged)
  const grouped = notifications.reduce(
    (acc: Record<string, Notification[]>, item) => {
      let dateLabel = "Unknown";
      if (item.createdTime) {
        if (item.createdTime.includes("ago") || item.createdTime.toLowerCase().includes("today")) {
          dateLabel = "Today";
        } else {
          dateLabel = item.createdTime;
        }
      }
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(item);
      return acc;
    },
    {}
  );

  const sortedGroupKeys = Object.keys(grouped).sort((a) => (a === "Today" ? -1 : 1));

  const sections = sortedGroupKeys.map((date) => ({
    title: date,
    data: grouped[date],
  }));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Header title="Notifications" />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#004AAD" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Header title="Notifications" />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: getBackgroundColor(item),
                    // Slight highlight for unread
                    opacity: item.isRead ? 1 : 1,
                    borderLeftWidth: item.isRead ? 0 : 4,
                    borderLeftColor: item.isRead ? "transparent" : "#004AAD",
                  },
                ]}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={getIconName(item)} size={28} color="#004AAD" />
                </View>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      !item.isRead && { fontWeight: "800" }, // Bolder if unread
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.dateLabel}>{title}</Text>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#004AAD" />
              </View>
            ) : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  dateLabel: {
    fontSize: 16,
    color: "#9C9BA6",
    marginVertical: 16,
    fontWeight: "600",
  },
  card: {
    minHeight: 100,
    flexDirection: "row",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    backgroundColor: "white",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0A051F",
    lineHeight: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});