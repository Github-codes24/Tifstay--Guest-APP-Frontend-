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
  RefreshControl, // Add this import for pull-to-refresh
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  status: "pending" | "confirmed" | "delivered" | "cancelled" | "completed" | "rejected";
  checkInDate?: string;
  checkOutDate?: string;
  price?: string;
  image?: string;
  entityId?: string; // Actual _id string for the service/hostel (for reviews/navigation)
}

const Booking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "rejected">(
    "pending"
  );
  const [hostelOrders, setHostelOrders] = useState<Order[]>([]);
  const [tiffinOrders, setTiffinOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add state for pull-to-refresh

  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const fetchOrders = async (tab: "pending" | "confirmed" | "rejected") => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch hostel orders
      let hostelUrl: string;
      if (tab === "pending") {
        hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPendingHostelBookings";
      } else if (tab === "confirmed") {
        hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getConfirmedHostelBookings";
      } else {
        hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRejectedHostelBookings";
      }

      const hostelResponse = await axios.get(hostelUrl, { headers });
      console.log("Hostel API Response:", hostelResponse.data);

      let fetchedHostelOrders: Order[] = [];
      if (hostelResponse.data.success) {
        fetchedHostelOrders = hostelResponse.data.data.map((item: any) => {
          let priceValue = item.price;
          if (tab === "rejected") {
            priceValue = item.AppiledCoupon?.finalprice || 0;
          }
          return {
            id: item._id,
            bookingId: item.bookingId || item._id, // Use bookingId if available, fallback to _id
            serviceType: "hostel" as const,
            serviceName: item.hostelId?.hostelName || "Unknown Hostel",
            customer: item.fullName || "Unknown User",
            checkInDate: item.checkInDate
              ? new Date(item.checkInDate).toLocaleDateString()
              : "",
            checkOutDate: item.checkOutDate
              ? new Date(item.checkOutDate).toLocaleDateString()
              : "",
            endDate: item.checkOutDate
              ? new Date(item.checkOutDate).toLocaleDateString()
              : "",
            status: item.status.toLowerCase() as Order["status"],
            image: item.userPhoto,
            price: priceValue ? `₹${priceValue}` : undefined,
            // FIXED: Extract _id as string; handle object or string input
            entityId: typeof item.hostelId === "object" ? item.hostelId?._id : (typeof item.hostelId === "string" ? item.hostelId : undefined),
          };
        });
        // DEBUG: Log hostel orders statuses
        console.log("Fetched Hostel Orders:", fetchedHostelOrders.map(o => ({ id: o.id, status: o.status, serviceType: o.serviceType })));
      }
      setHostelOrders(fetchedHostelOrders);

      // Fetch tiffin orders
      let tiffinUrl: string;
      if (tab === "pending") {
        tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPendingTiffinOrder";
      } else if (tab === "confirmed") {
        tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getConfirmedTiffinOrder";
      } else {
        tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getRejectedTiffinOrder";
      }

      const tiffinResponse = await axios.get(tiffinUrl, { headers });
      console.log("Token res:", token);
      console.log("Tiffin API Response:", tiffinResponse);

      let fetchedTiffinOrders: Order[] = [];
      if (tiffinResponse.data.success) {
        fetchedTiffinOrders = tiffinResponse.data.data.map((item: any) => {
          const tiffins = item.tiffins || [];
          const mealType = [...new Set(tiffins.map((t: any) => t.mealType))].join(", ");
          const foodType = [...new Set(tiffins.map((t: any) => t.foodType))].join(", ");
          const plan = [...new Set(tiffins.map((t: any) => t.planName))].join(", ");
          const orderType = [...new Set(tiffins.map((t: any) => t.orderType))].join(", ");
          const totalPrice = tiffins.reduce((sum: number, t: any) => sum + (t.price || 0), 0);

          // FIXED: Handle serviceName to prioritize valid names, skip "N/A" or empty
          const serviceName = (item.tiffinServiceName && item.tiffinServiceName !== "N/A" && item.tiffinServiceName.trim() !== "")
            ? item.tiffinServiceName
            : (item.tiffinServiceId?.tiffinName || "Unknown Tiffin Service");

          return {
            id: item._id,
            bookingId: item.bookingId,
            serviceType: "tiffin" as const,
            serviceName,
            customer: "You",
            startDate: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
            endDate: "", // Not provided by backend
            mealType,
            foodType,
            plan,
            orderType,
            status: (item.status || "").toLowerCase() as Order["status"],
            price: `₹${totalPrice}`,
            image: undefined,
            // FIXED: Extract _id as string from tiffinServiceId (object); fallback if string
            entityId: typeof item.tiffinServiceId === "object" ? item.tiffinServiceId?._id : (typeof item.tiffinServiceId === "string" ? item.tiffinServiceId : undefined),
          };
        });
        // DEBUG: Log tiffin orders statuses (especially for "confirmed" tab)
        console.log("Fetched Tiffin Orders:", fetchedTiffinOrders.map(o => ({ id: o.id, status: o.status, serviceType: o.serviceType })));
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

  // Add handleRefresh function for pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrders(activeTab);
    } catch (error) {
      console.error("Error during refresh:", error);
      Alert.alert("Error", "Failed to refresh orders");
    } finally {
      setRefreshing(false);
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
    console.log("=== DEBUG: handleTrackOrder called ===");
    console.log("Track order clicked for bookingId:", order.bookingId);
    console.log("Order details:", { id: order.id, status: order.status, serviceType: order.serviceType });
    console.log("Current modal state before set:", { showTrackOrderModal, trackingOrder: trackingOrder ? 'exists' : null });
    
    if (!order.id) {
      console.error("=== ERROR: Invalid order ID for tracking ===");
      Alert.alert("Error", "Cannot track this order. Invalid details.");
      return;
    }
    
    setTrackingOrder(order);
    setShowTrackOrderModal(true);
    
    // Note: State updates are async, so log after a tick if needed (use setTimeout for immediate check)
    setTimeout(() => {
      console.log("=== DEBUG: Modal state after set (next tick) ===");
      console.log("showTrackOrderModal:", true);
      console.log("trackingOrder:", order.id);
    }, 0);
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
    
    if (!order.entityId) {
      console.error("Missing entityId for order:", order);
      Alert.alert("Error", "Invalid service details. Please try again.");
      return;
    }
    const params = {
      serviceId: order.entityId, // Now guaranteed string
      guestId: order.id,
      type: type,
    };
    console.log("Passing params to RateNowScreen:", params);
    router.push({
      pathname: "/account/RateNowScreen",
      params,
    });
  };

  const handleSeeDetails = (order: Order) => {
    console.log(
      "See details:",
      order.bookingId,
      "using entityId:",
      order.entityId,
    );
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
    const pathname =
      order.serviceType === "hostel"
        ? "/hostel-details/[id]"
        : "/tiffin-details/[id]";
    // FIXED: Null check for entityId
    if (!order.entityId) {
      Alert.alert("Error", "Invalid service details for repeat order.");
      return;
    }
    router.push({
      pathname,
      params: { id: order.entityId, repeatOrder: "true" },
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
      case "rejected":
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
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const isHistoryOrder = (status: string) =>
    ["delivered", "completed"].includes(status);

  const handleProfilePress = () => router.push("/account/profile");

  const renderOrderCard = (order: Order) => {
    // DEBUG: Log order details and conditions for button visibility
    console.log("=== DEBUG: Rendering Order Card ===");
    console.log("Order:", { id: order.id, status: order.status, serviceType: order.serviceType, activeTab });
    console.log("Conditions check:", {
      isConfirmedTab: activeTab === "confirmed",
      statusIsConfirmed: order.status === "confirmed",
      isNotHistory: !isHistoryOrder(order.status),
      isTiffin: order.serviceType === "tiffin",
      within5Days: isWithin5DaysOfEnd(order),
    });
    console.log("Track button should show:", activeTab === "confirmed" && order.status === "confirmed" && !isHistoryOrder(order.status) && order.serviceType === "tiffin");

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.bookingId}>
            {order.serviceType === "hostel"
              ? "Booking Summary"
              : `Booking #${order.bookingId}`}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(order.status)}20` },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(order.status) }]}
            >
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        {order.serviceType !== "hostel" && (
          <Text style={styles.orderedOneLbl}>Order On {order.startDate}</Text>
        )}

        <View style={styles.orderDetails}>
          {order.serviceType === "hostel" ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hostel Booking:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {order.serviceName}
                </Text>
              </View>
              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{order.customer}</Text>
              </View> */}
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
                <Text style={styles.detailLabel}>Tiffin Service:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {order.serviceName}
                </Text>
              </View>
              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{order.customer}</Text>
              </View> */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>{order.startDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meal Type:</Text>
                <Text style={styles.detailValue}>{order.mealType}</Text>
              </View>
              {order.foodType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Food Type:</Text>
                  <Text style={styles.detailValue}>{order.foodType}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <Text style={styles.detailValue}>{order.plan}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Type:</Text>
                <Text style={styles.detailValue}>{order.orderType}</Text>
              </View>
            </>
          )}
        </View>

        {activeTab === "pending" ? null : (
          <>
            {order.status === "confirmed" && !isHistoryOrder(order.status) && (
              <View>
                {isWithin5DaysOfEnd(order) && (
                  <Button
                    title="Continue Subscription"
                    onPress={() => handleContinueSubscription(order)}
                    style={styles.primaryButtonStyle}
                    height={48}
                  />
                )}
                {order.serviceType === "tiffin" ? (
                  <View>
                    <View style={styles.buttonRow}>
                      <Button
                        title="Rate Now"
                        onPress={() => handleRateNow(order)}
                        style={styles.rateButtonStyle}
                        textStyle={styles.secondaryButtonTextStyle}
                        width={160}
                        height={48}
                      />
                      <Button
                        title="See Details"
                        onPress={() => handleSeeDetails(order)}
                        style={styles.repeatButtonStyle}
                        width={160}
                        height={48}
                      />
                    </View>
                    <Button
                      title="Track Now"
                      onPress={() => {
                        // DEBUG: Log button click
                        console.log("=== DEBUG: Track Now Button Clicked ===");
                        console.log("Order for track:", { id: order.id, bookingId: order.bookingId });
                        handleTrackOrder(order);
                      }}
                      style={styles.primaryButtonStyle}
                      height={48}
                    />
                  </View>
                ) : (
                  <Button
    title="Rate Now"
    onPress={() => handleRateNow(order)}
    textStyle={styles.secondaryButtonTextStyle}
    style={[styles.rateButtonStyle, { width: 430, marginTop:10 }]}
    height={48}
  />
                )}
              </View>
            )}
            {order.status === "rejected" && (
              <View style={styles.buttonRow}>
                {/* <Button
                  title="See Details"
                  onPress={() => handleSeeDetails(order)}
                  style={styles.rateButtonStyle}
                  textStyle={styles.secondaryButtonTextStyle}
                  width={160}
                  height={48}
                /> <Button
                  title="Repeat Order"
                  onPress={() => handleRepeatOrder(order)}
                  style={styles.repeatButtonStyle}
                  width={160}
                  height={48}
                /> */} */}
                
              </View>
            )}
            {isHistoryOrder(order.status) && (
              <View style={styles.buttonRow}>
                <Button
                  title="Rate Now"
                  onPress={() => handleRateNow(order)}
                  style={styles.rateButtonStyle}
                  textStyle={styles.secondaryButtonTextStyle}
                  width={160}
                  height={48}
                />
                <Button
                  title="Repeat Order"
                  onPress={() => handleRepeatOrder(order)}
                  style={styles.repeatButtonStyle}
                  width={160}
                  height={48}
                />
              </View>
            )}
          </>
        )}
      </View>
    );
  };

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
  console.log(
    `Rendering ${activeTab} tab - Hostels: ${hostelOrders.length}, Tiffins: ${tiffinOrders.length}`,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track your bookings</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
        >
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "confirmed" && styles.activeTab]}
          onPress={() => setActiveTab("confirmed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "confirmed" && styles.activeTabText,
            ]}
          >
            Confirmed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rejected" && styles.activeTab]}
          onPress={() => setActiveTab("rejected")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rejected" && styles.activeTabText,
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        } // Add pull-to-refresh here
      >
        {!hasAnyOrders ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "pending"
                ? "You don't have any pending orders"
                : activeTab === "confirmed"
                ? "You don't have any confirmed orders"
                : "You don't have any rejected orders"}
            </Text>
          </View>
        ) : (
          <>
            {hasHostelOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="home" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Hostel Bookings ({hostelOrders.length})
                  </Text>
                </View>
                {hostelOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
            {hasTiffinOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="restaurant"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    Tiffin Orders ({tiffinOrders.length})
                  </Text>
                </View>
                {tiffinOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* DEBUG: Log before modal render */}
      {console.log("=== DEBUG: Checking Modal Render ===", { 
        trackingOrder: trackingOrder ? trackingOrder.id : null, 
        showTrackOrderModal,
        orderId: trackingOrder?.id,
        serviceType: trackingOrder?.serviceType 
      })}
      
      {trackingOrder && (
        <TrackOrderModal
          visible={showTrackOrderModal}
          onClose={() => {
            console.log("=== DEBUG: Modal Close Called ===");
            setShowTrackOrderModal(false);
            setTrackingOrder(null);
          }}
          orderId={trackingOrder.id}
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
    fontSize: 15,
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
    paddingVertical: 0,
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderedOneLbl: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
    flex: 1,
    marginTop: -14,
    marginBottom: 10,
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
    marginTop: 8,
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
  width: 230,
  alignSelf: "center",

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