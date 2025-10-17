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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
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
  entityId?: string;  // New field: Actual hostelId or serviceId for reviews
}

const Booking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("pending");
  const [hostelOrders, setHostelOrders] = useState<Order[]>([]);
  const [tiffinOrders, setTiffinOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const fetchOrders = async (tab: "pending" | "confirmed") => {
    setLoading(true);
    try {
      // Fetch hostel orders
      const hostelUrl =
        tab === "pending"
          ? "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPendingHostelBookings"
          : "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getConfirmedHostelBookings";

      const hostelResponse = await axios.get(hostelUrl);
      console.log("Hostel API Response:", hostelResponse.data);

      let fetchedHostelOrders: Order[] = [];
      if (hostelResponse.data.success) {
        fetchedHostelOrders = hostelResponse.data.data.map((item: any) => ({
          id: item._id,
          bookingId: item._id,
          serviceType: "hostel" as const,
          serviceName: item.hostelId?.hostelName || "Unknown Hostel",
          customer: item.fullName || "Unknown User",
          checkInDate: item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : "",
          checkOutDate: item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : "",
          endDate: item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : "",
          status: item.status.toLowerCase() as Order["status"],
          image: item.userPhoto,
          price: item.price, // Assuming price is available; adjust if needed
          entityId: item.hostelId?._id || item.hostelId,  // Use the actual hostel ID for reviews
        }));
      }
      setHostelOrders(fetchedHostelOrders);

      // Fetch tiffin orders
      const tiffinUrl =
        tab === "pending"
          ? "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPendingTiffinOrder"
          : "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getConfirmedTiffinOrder";

      const tiffinResponse = await axios.get(tiffinUrl);
      console.log("Tiffin API Response:", tiffinResponse.data);

      let fetchedTiffinOrders: Order[] = [];
      if (tiffinResponse.data.success) {
        fetchedTiffinOrders = tiffinResponse.data.data.map((item: any) => {
          const choosePlanType = Array.isArray(item.choosePlanType) ? item.choosePlanType[0] : item.choosePlanType;
          // TODO: Confirm the exact field for serviceId from console.log (e.g., item.serviceId, item.tiffinServiceId, or choosePlanType._id)
          // Adjust below if needed based on API structure
          const serviceId = choosePlanType?._id || item.serviceId || item.tiffinServiceId;
          return {
            id: item._id,
            bookingId: item._id,
            serviceType: "tiffin" as const,
            serviceName: `${choosePlanType?.planName || "Unknown"} Tiffin Plan`,
            customer: "You",
            startDate: item.date ? new Date(item.date).toLocaleDateString() : "",
            endDate: item.endDate ? new Date(item.endDate).toLocaleDateString() : "", // Assuming endDate field exists in API; adjust if needed
            plan: choosePlanType?.planName,
            orderType: item.chooseOrderType,
            status: item.status.toLowerCase() as Order["status"],
            price: `₹${choosePlanType?.price || 0}`,
            image: undefined,
            checkInDate: undefined,
            checkOutDate: undefined,
            entityId: serviceId,  // Use the actual service ID for reviews
          };
        });
      }
      setTiffinOrders(fetchedTiffinOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders");
      setHostelOrders([]);
      setTiffinOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const isWithin5DaysOfEnd = (order: Order) => {
    const endDateStr = order.endDate || order.checkOutDate;
    if (!endDateStr) return false;
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return false;
    const fiveDaysBefore = new Date(end.getTime() - 5 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return now >= fiveDaysBefore && now < end;
  };

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

  const handleRateNow = (order: Order) => {
    console.log("Rate now:", order.bookingId);
    const type = order.serviceType === "tiffin" ? "service" : "hostel";
    const params = {
      serviceId: order.entityId,  // Now passing the correct entity ID (hostelId or serviceId)
      guestId: order.id,  // Booking ID (backend likely uses token for guest)
      type: type,
    };
    console.log("Passing params to RateNowScreen:", params);
    router.push({
      pathname: "/account/RateNowScreen",
      params,
    });
  };

  const handleSeeDetails = (order: Order) => {
    console.log("See details:", order.bookingId, "using entityId:", order.entityId);
    let pathname;
    let params;
    if (order.serviceType === "hostel") {
      pathname = "/(secure)/hostel-details/[id]";
      params = { 
        id: order.entityId,  
        bookingId: order.id,
        type: order.serviceType,   
      };
    } else {
      pathname = "/(secure)/tiffin-order-details/[id]";
      params = { 
        id: order.id,  
        type: order.serviceType,   
      };
    }
    router.push({
      pathname,
      params,
    });
  };

  const handleRepeatOrder = (order: Order) => {
    console.log("Repeat order:", order.bookingId);
    const pathname = order.serviceType === "hostel" ? "/hostel-details/[id]" : "/tiffin-details/[id]";
    router.push({
      pathname,
      params: { id: order.entityId, repeatOrder: "true" },  // Also use entityId here for consistency
    });
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

  const renderOrderCard = (order: Order) => (
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
        {order.serviceType === "hostel" ? (
          <>
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
          </>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tiffin Order:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {order.serviceName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Date:</Text>
              <Text style={styles.detailValue}>{order.startDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan:</Text>
              <Text style={styles.detailValue}>{order.plan}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Type:</Text>
              <Text style={styles.detailValue}>{order.orderType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>{order.price}</Text>
            </View>
          </>
        )}
      </View>

      {activeTab === "pending" ? (
        <Button title="Track Order" onPress={() => handleTrackOrder(order)} style={styles.primaryButtonStyle} height={48} />
      ) : (
        <>
          {order.status === "confirmed" && !isHistoryOrder(order.status) && (
            <View>
              {isWithin5DaysOfEnd(order) && (
                <Button title="Continue Subscription" onPress={() => handleContinueSubscription(order)} style={styles.primaryButtonStyle} height={48} />
              )}
              {order.serviceType === "tiffin" ? (
                <View style={styles.buttonRow}>
                  <Button title="Rate Now" onPress={() => handleRateNow(order)} style={styles.rateButtonStyle} textStyle={styles.secondaryButtonTextStyle} width={160} height={48} />
                  <Button title="See Details" onPress={() => handleSeeDetails(order)} style={styles.repeatButtonStyle} width={160} height={48} />
                </View>
              ) : (
                <Button title="Rate Now" onPress={() => handleRateNow(order)} style={styles.primaryButtonStyle} height={48} />
              )}
            </View>
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
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={styles.emptyStateSubtext}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasHostelOrders = hostelOrders.length > 0;
  const hasTiffinOrders = tiffinOrders.length > 0;
  const hasAnyOrders = hasHostelOrders || hasTiffinOrders;

  // Debug log for tab data
  console.log(`Rendering ${activeTab} tab - Hostels: ${hostelOrders.length}, Tiffins: ${tiffinOrders.length}`);

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
        {!hasAnyOrders ? (
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
          <>
            {hasHostelOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="home" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Hostel Bookings ({hostelOrders.length})</Text>
                </View>
                {hostelOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
            {hasTiffinOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="restaurant" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Tiffin Orders ({tiffinOrders.length})</Text>
                </View>
                {tiffinOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "400",
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    textAlign: "right",
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