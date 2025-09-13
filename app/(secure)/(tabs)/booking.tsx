import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
import RatingModal from "@/components/modals/RatingModal"; // Add this import
import TrackOrderModal from "@/components/modals/TrackOrderModal";
import Profile from "../account/profile";

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
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">(
    "pending"
  );
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Demo data for all orders
  const allOrders: Order[] = [
    {
      id: "1",
      bookingId: "TF2024002",
      serviceType: "tiffin",
      serviceName: "Maharashtrian Ghar Ka Khana",
      customer: "Onil Karmokar",
      startDate: "21/07/25",
      mealType: "Lunch",
      foodType: "Veg",
      plan: "Daily",
      orderType: "Delivery",
      status: "pending",
    },
    {
      id: "2",
      bookingId: "TF2024003",
      serviceType: "tiffin",
      serviceName: "Maharashtrian Ghar Ka Khana",
      customer: "Onil Karmokar",
      startDate: "21/07/25",
      mealType: "Breakfast, Lunch, Dinner",
      foodType: "Veg",
      plan: "Monthly",
      orderType: "Delivery",
      status: "pending",
    },
    {
      id: "7",
      bookingId: "HS2024002",
      serviceType: "hostel",
      serviceName: "Green Valley Boys Hostel",
      customer: "Onil Karmokar",
      checkInDate: "01/10/25",
      checkOutDate: "01/11/25",
      status: "pending",
      image: "hostel1",
    },
    {
      id: "3",
      bookingId: "TF2024001",
      serviceType: "tiffin",
      serviceName: "Maharashtrian Ghar Ka Khana",
      customer: "Onil Karmokar",
      startDate: "21/07/25",
      mealType: "Breakfast, Lunch, Dinner",
      foodType: "Veg",
      plan: "Daily",
      orderType: "Delivery",
      status: "confirmed",
    },
    {
      id: "4",
      bookingId: "TF2023999",
      serviceType: "tiffin",
      serviceName: "Maharashtrian Ghar Ka Khana",
      customer: "Onil Karmokar",
      startDate: "21/07/25",
      mealType: "Lunch",
      foodType: "Veg",
      plan: "Daily",
      orderType: "Delivery",
      status: "delivered",
    },
    {
      id: "5",
      bookingId: "HS2024001",
      serviceType: "hostel",
      serviceName: "Scholars Den Boys Hostel",
      customer: "Onil Karmokar",
      checkInDate: "01/08/25",
      checkOutDate: "01/09/25",
      status: "confirmed",
      image: "hostel1",
    },
    {
      id: "6",
      bookingId: "HS2023998",
      serviceType: "hostel",
      serviceName: "Scholars Den Boys Hostel",
      customer: "Onil Karmokar",
      checkInDate: "01/08/25",
      checkOutDate: "01/09/25",
      status: "completed",
      image: "hostel1",
    },
  ];

  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === "pending") {
      return order.status === "pending";
    } else {
      return ["confirmed", "delivered", "completed"].includes(order.status);
    }
  });

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
        price:
          order.price ||
          (order.serviceType === "tiffin" ? "₹120" : "₹8000/month"),
        orderId: order.id,
        bookingId: order.bookingId,
      },
    });
  };

  const handleSeeDetails = (order: Order) => {
    console.log("See details:", order.bookingId);
    router.push({
      pathname: "/tiffin-order-details/[id]",
      params: {
        id: order.id,
      },
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
      pathname:
        order.serviceType === "tiffin"
          ? `/tiffin-details/[id]`
          : `/hostel-details/[id]`,
      params: {
        id: order.id,
        repeatOrder: "true",
      },
    });
  };

  const handleRatingSubmitSuccess = () => {
    // You can add any additional logic here after successful rating submission
    console.log("Rating submitted successfully!");
    // Optionally refresh orders or show a success toast
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#10B981";
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

  const isHistoryOrder = (status: string) => {
    return ["delivered", "completed"].includes(status);
  };

  const handleProfilePress = () => {
    router.push("/account/profile");
  };

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
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(order.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              {isHistoryOrder(order.status) && activeTab === "confirmed" && (
                <Text style={styles.bookingSummaryLabel}>Booking Summary</Text>
              )}
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {order.serviceType === "tiffin"
                      ? "Tiffin Service"
                      : "Hostel Booking"}
                    :
                  </Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {order.serviceName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{order.customer}</Text>
                </View>

                {order.serviceType === "tiffin" ? (
                  <>
                    {order.startDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Start Date:</Text>
                        <Text style={styles.detailValue}>
                          {order.startDate}
                        </Text>
                      </View>
                    )}
                    {order.mealType && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Meal Type:</Text>
                        <Text style={styles.detailValue}>{order.mealType}</Text>
                      </View>
                    )}
                    {order.plan && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Plan:</Text>
                        <Text style={styles.detailValue}>{order.plan}</Text>
                      </View>
                    )}
                    {order.orderType && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order Type:</Text>
                        <Text style={styles.detailValue}>
                          {order.orderType}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Check-in date:</Text>
                      <Text style={styles.detailValue}>
                        {order.checkInDate}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Check-out date:</Text>
                      <Text style={styles.detailValue}>
                        {order.checkOutDate}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Subscription Note */}
              {isHistoryOrder(order.status) &&
                order.serviceType === "tiffin" && (
                  <Text style={styles.subscriptionNote}>
                    This subscription expired soon, to extend select Continue
                    Subscription.
                  </Text>
                )}

              {activeTab === "pending" ? (
                <Button
                  title="Track Order"
                  onPress={() => handleTrackOrder(order)}
                  style={styles.primaryButtonStyle}
                  height={48}
                />
              ) : (
                <>
                  {order.status === "confirmed" &&
                    !isHistoryOrder(order.status) && (
                      <>
                        <Button
                          title="Continue Subscription"
                          onPress={() => handleContinueSubscription(order)}
                          style={styles.primaryButtonStyle}
                          height={48}
                        />
                        <Button
                          title="See Details"
                          onPress={() => handleSeeDetails(order)}
                          style={styles.secondaryButtonStyle}
                          textStyle={styles.secondaryButtonTextStyle}
                          height={48}
                        />
                      </>
                    )}

                  {isHistoryOrder(order.status) && (
                    <>
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
                    </>
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
    // justifyContent: "space-between",
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
