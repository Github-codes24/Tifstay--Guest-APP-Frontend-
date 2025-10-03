import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
import RatingModal from "@/components/modals/RatingModal";
import TrackOrderModal from "@/components/modals/TrackOrderModal";

interface Order {
  id: string;
  bookingId: string;
  serviceType: "tiffin" | "hostel";
  serviceName: string;
  customer: string;
  startDate?: string;
  endDate?: string;
  mealType?: string;
  foodType?: string;
  plan?: string;
  orderType?: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled" | "completed";
  checkInDate?: string;
  checkOutDate?: string;
  price?: string;
  image?: string;
}

const Booking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

const fetchOrders = async () => {
  setLoading(true);
  try {
    const url =
      activeTab === "pending"
        ? "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPendingHostelBookings"
        : "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getConfirmedHostelBookings";

    const response = await axios.get(url);
    console.log("API Response:", response.data);

    if (response.data.success) {
      const apiOrders: Order[] = response.data.data.map((item: any) => ({
        id: item._id, // booking ID
        bookingId: item._id,
        serviceType: "hostel",
        serviceName: item.hostelId?.hostelName || "Unknown Hostel",
        customer: item.fullName,
        checkInDate: item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : "",
        checkOutDate: item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : "",
        status: item.status.toLowerCase() as Order["status"],
        image: item.userPhoto,
      }));
      setOrders(apiOrders);
    } else {
      setOrders([]);
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    Alert.alert("Error", "Failed to fetch orders");
    setOrders([]);
  }
  setLoading(false);
};


  const filteredOrders = orders;

  const handleTrackOrder = (order: Order) => {
    console.log("Track order:", order.bookingId);
    setTrackingOrder(order);
    setShowTrackOrderModal(true);
  };

  const handleContinueSubscription = (order: Order) => {
    console.log("Continue subscription:", order.bookingId);
    router.push({
      pathname: "/continueSubscriptionScreen",
      params: {
        serviceType: order.serviceType,
        serviceName: order.serviceName,
        price: order.price || "₹8000/month",
        orderId: order.id,
        bookingId: order.bookingId,
      },
    });
  };

  const handleSeeDetails = (order: Order) => {
    console.log("See details:", order.bookingId);
    router.push({
      pathname: "/hostel-details/[id]",
      params: { id: order.id },
    });
  };

  const handleRateNow = (order: Order) => {
    console.log("Rate now:", order.bookingId);
    setSelectedOrder(order);
    setShowRatingModal(true);
  };

  const handleRepeatOrder = (order: Order) => {
    console.log("Repeat order:", order.bookingId);
    router.push({
      pathname: `/hostel-details/[id]`,
      params: { id: order.id, repeatOrder: "true" },
    });
  };

  const handleRatingSubmitSuccess = () => {
    console.log("Rating submitted successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
      case "delivered":
        return "#10B981";
      case "completed":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const isHistoryOrder = (status: string) => ["delivered", "completed"].includes(status);

  const handleProfilePress = () => router.push("/account/profile");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track your bookings</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          <Image source={{ uri: "https://i.pravatar.cc/100" }} style={styles.profileImage} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "confirmed" && styles.activeTab]}
          onPress={() => setActiveTab("confirmed")}
        >
          <Text style={[styles.tabText, activeTab === "confirmed" && styles.activeTabText]}>
            Confirmed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "pending"
                ? "You don't have any pending orders"
                : "You don't have any confirmed orders"}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.bookingId}>Booking #{order.bookingId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hostel Booking:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {order.serviceName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{order.customer}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check-in date:</Text>
                  <Text style={styles.detailValue}>{order.checkInDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check-out date:</Text>
                  <Text style={styles.detailValue}>{order.checkOutDate}</Text>
                </View>
              </View>

              {activeTab === "pending" ? (
                <Button title="Track Order" onPress={() => handleTrackOrder(order)} style={styles.primaryButtonStyle} height={48} />
              ) : (
                <>
                  {order.status === "confirmed" && !isHistoryOrder(order.status) && (
                    <>
                      <Button title="Continue Subscription" onPress={() => handleContinueSubscription(order)} style={styles.primaryButtonStyle} height={48} />
                      <Button title="See Details" onPress={() => handleSeeDetails(order)} style={styles.secondaryButtonStyle} textStyle={styles.secondaryButtonTextStyle} height={48} />
                    </>
                  )}
                  {isHistoryOrder(order.status) && (
                    <View style={styles.buttonRow}>
                      <Button title="Rate Now" onPress={() => handleRateNow(order)} style={styles.rateButtonStyle} textStyle={styles.secondaryButtonTextStyle} width={160} height={48} />
                      <Button title="Repeat Order" onPress={() => handleRepeatOrder(order)} style={styles.repeatButtonStyle} width={160} height={48} />
                    </View>
                  )}
                </>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {selectedOrder && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedOrder(null);
          }}
          serviceType={selectedOrder.serviceType}
          serviceName={selectedOrder.serviceName}
          bookingId={selectedOrder.bookingId}
          onSubmitSuccess={handleRatingSubmitSuccess}
        />
      )}
      {trackingOrder && (
        <TrackOrderModal
          visible={showTrackOrderModal}
          onClose={() => {
            setShowTrackOrderModal(false);
            setTrackingOrder(null);
          }}
          orderId={trackingOrder.bookingId}
          serviceType={trackingOrder.serviceType}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,

    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  activeTab: {
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  bookingSummaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    textAlign: "right",
    paddingVertical: 10,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "400",
  },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  subscriptionNote: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  imageSection: {
    alignItems: "center",
    marginVertical: 12,
  },
  hostelImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  primaryButtonStyle: {
    backgroundColor: colors.primary,
    marginBottom: 8,
    width: "100%",
  },
  secondaryButtonStyle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    width: "100%",
  },
  secondaryButtonTextStyle: {
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rateButtonStyle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
  },
  repeatButtonStyle: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  bottomSpacer: {
    height: 25,
  },
});

export default Booking;
