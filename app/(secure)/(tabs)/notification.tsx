import Header from "@/components/Header";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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

  // NEW: Hostel first booking done → Confirmed tab + Hostel section
  isHostelFirstBookingDone?: boolean;
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      let page = 1;
      let allNotifications: Notification[] = [];
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await axios.get(
          `https://tifstay-project-be.onrender.com/api/guest/notification/getAllNotification?page=${page}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const newNotifs = response.data.data || [];
          allNotifications = [...allNotifications, ...newNotifs];
          totalPages = response.data.pagination?.totalPages || 1;
        }
        page++;
      }

      allNotifications.sort((a, b) => b._id.localeCompare(a._id));
      setNotifications(allNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Icon logic
  const getIconName = (item: Notification): keyof typeof Ionicons.glyphMap => {
    // Expiry reminder icon
    if (item.isHostelBookingExpiryReminder || item.isTiffinExpiryNotification) {
      return "time";
    }

    // Success / approved / first booking done icons
    if (
      item.isTiffinBookingApproved ||
      item.isTiffinFirstOrderDeliveredOrServed ||
      item.isHostelBookingApproved ||
      item.isHostelBookingRazorPayPaymentSuccess ||
      item.isTiffinBookingRazorPayPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isHostelFirstBookingDone  // NEW: Same success icon
    ) {
      return "checkmark-circle";
    }

    // Wallet-related icons
    if (
      item.isWalletPaymentSuccess ||
      item.isWalletCredited ||
      item.isWalletDebited ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelWalletTransactionReceived
    ) {
      return "wallet";
    }

    // Rejected icon
    if (item.isHostelBookingRejected || item.isTiffinBookingRejected) {
      return "close-circle";
    }

    // Pending reminders (cart reminders)
    if (item.isHostelPendingBookingReminder || item.isTiffinPendingOrderReminder) {
      return "cart";
    }

    if (item.isHostelRazorPayTransactionReceived) {
      return "card";
    }
    if (item.isHostelBookingSubmittedForApproval) {
      return "hourglass";
    }
    if (item.isGuestDepositPaymentSuccess || item.isGuestDepositTransactionReceived) {
      return "cash";
    }
    return "notifications";
  };

  // Helper functions
  const isHostelPendingReminder = (item: Notification): boolean => {
    return !!item.isHostelPendingBookingReminder;
  };

  const isTiffinPendingOrderReminder = (item: Notification): boolean => {
    return !!item.isTiffinPendingOrderReminder;
  };

  const isTiffinRazorPayPaymentSuccessNotification = (item: Notification): boolean => {
    return !!item.isTiffinBookingRazorPayPaymentSuccess;
  };

  const isTiffinWalletPaymentSuccess = (item: Notification): boolean => {
    return !!item.isTiffinBookingWalletPaymentSuccess;
  };

  const isTiffinBookingConfirmedNotification = (item: Notification): boolean => {
    return !!(item.isTiffinBookingApproved || item.isTiffinFirstOrderDeliveredOrServed);
  };

  const isTiffinBookingRejectedNotification = (item: Notification): boolean => {
    return !!item.isTiffinBookingRejected;
  };

  const isHostelExpiryReminder = (item: Notification): boolean => {
    return !!item.isHostelBookingExpiryReminder;
  };

  const isTiffinExpiryReminder = (item: Notification): boolean => {
    return !!item.isTiffinExpiryNotification;
  };

  const isTiffinBookingNotification = (item: Notification): boolean => {
    return !!(
      item.isTiffinRazorPayPaymentSuccess ||
      item.isTiffinRazorPayTransactionReceived ||
      item.isTiffinBookingSubmittedForApproval
    );
  };

  const isHostelBookingApprovedNotification = (item: Notification): boolean => {
    return !!item.isHostelBookingApproved;
  };

  const isHostelBookingNotification = (item: Notification): boolean => {
    return !!(
      item.isHostelBookingRazorPayPaymentSuccess ||
      item.isHostelRazorPayTransactionReceived ||
      item.isHostelBookingSubmittedForApproval
    );
  };

  const isWalletNotification = (item: Notification): boolean => {
    return !!(
      item.isWalletPaymentSuccess ||
      item.isWalletTransactionReceived ||
      item.isWalletCredited ||
      item.isWalletDebited ||
      item.isHostelBookingWalletPaymentSuccess ||
      item.isTiffinBookingWalletPaymentSuccess ||
      item.isHostelWalletTransactionReceived
    );
  };

  const isDepositNotification = (item: Notification): boolean => {
    return !!(item.isGuestDepositPaymentSuccess || item.isGuestDepositTransactionReceived);
  };

  const isTiffinPaymentFailed = (item: Notification): boolean => {
    return !!item.isTiffinBookingRazorPayPaymentFailed;
  };

  const isHostelPaymentFailed = (item: Notification): boolean => {
    return !!item.isHostelBookingRazorPayPaymentFailed;
  };

  // NEW: Hostel first booking done
  const isHostelFirstBookingDoneNotification = (item: Notification): boolean => {
    return !!item.isHostelFirstBookingDone;
  };

  // Background color for success
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
      item.isHostelFirstBookingDone  // NEW: Success background
    ) {
      return "#E8F5E9"; // Light green
    }
    return "#F8F9FF"; // Default
  };

  // Navigation handler
  const handlePress = (item: Notification) => {
    // 1. Expiry reminders
    if (isHostelExpiryReminder(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "pending", service: "hostel" },
      });
      return;
    }

    if (isTiffinExpiryReminder(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "pending", service: "tiffin" },
      });
      return;
    }

    // NEW: Hostel First Booking Done → Confirmed tab + Hostel section
    if (isHostelFirstBookingDoneNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "confirmed", service: "hostel" },
      });
      return;
    }

    // Tiffin Wallet Payment Success → Wallet screen
    if (isTiffinWalletPaymentSuccess(item)) {
      router.push("/account/wallet");
      return;
    }

    // Pending reminders → Cartscreen
    if (isHostelPendingReminder(item)) {
      router.push({
        pathname: "/(secure)/Cartscreen",
        params: { tab: "hostel" },
      });
      return;
    }

    if (isTiffinPendingOrderReminder(item)) {
      router.push({
        pathname: "/(secure)/Cartscreen",
        params: { tab: "tiffin" },
      });
      return;
    }

    // Tiffin Razorpay Payment Success → Booking pending tab
    if (isTiffinRazorPayPaymentSuccessNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "pending", service: "tiffin" },
      });
      return;
    }

    // Rejected
    if (isTiffinBookingRejectedNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "rejected", service: "tiffin" },
      });
      return;
    }

    // Confirmed
    if (isTiffinBookingConfirmedNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "confirmed", service: "tiffin" },
      });
      return;
    }

    // Payment failed reminders
    if (isTiffinPaymentFailed(item)) {
      router.push({
        pathname: "/(secure)/Cartscreen",
        params: { tab: "tiffin" },
      });
      return;
    }

    if (isHostelPaymentFailed(item)) {
      router.push({
        pathname: "/(secure)/Cartscreen",
        params: { tab: "hostel" },
      });
      return;
    }

    // General tiffin booking flow
    if (isTiffinBookingNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "pending", service: "tiffin" },
      });
      return;
    }

    // Hostel approved (existing)
    if (isHostelBookingApprovedNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "confirmed", service: "hostel" },
      });
      return;
    }

    // Hostel booking flow
    if (isHostelBookingNotification(item)) {
      router.push({
        pathname: "/(secure)/(tabs)/booking",
        params: { tab: "pending", service: "hostel" },
      });
      return;
    }

    // Deposit & Wallet (general)
    if (isDepositNotification(item)) {
      router.push("/(secure)/account/deposite");
      return;
    }

    if (isWalletNotification(item)) {
      router.push("/account/wallet");
      return;
    }
  };

  // Group by date
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

  if (loading) {
    return (
      <>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "white" }}>
          <Header title="Notifications" />
        </SafeAreaView>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#004AAD" />
        </View>
      </>
    );
  }

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "white" }}>
        <Header title="Notifications" />
      </SafeAreaView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {sortedGroupKeys.map((date) => (
          <View key={date}>
            <Text style={styles.dateLabel}>{date}</Text>
            {grouped[date].map((item) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.card, { backgroundColor: getBackgroundColor(item) }]}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name={getIconName(item)} size={28} color="#004AAD" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {notifications.length === 0 && (
          <Text style={styles.emptyText}>No notifications yet</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  dateLabel: { fontSize: 16, color: "#9C9BA6", marginVertical: 16, fontWeight: "600" },
  card: {
    height: 100,
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
  textContainer: { flex: 1, justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "bold", color: "#0A051F", lineHeight: 20 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#999", fontSize: 16 },
});