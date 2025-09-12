import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import colors from "@/constants/colors";

export interface OrderData {
  id: string;
  bookingId: string;
  serviceType: "tiffin" | "hostel";
  serviceName: string;
  customer: string;
  startDate?: string;
  mealType?: string;
  plan?: string;
  orderType?: string;
  status: "pending" | "confirmed" | "delivered" | "completed";
  checkInDate?: string;
  checkOutDate?: string;
  image?: any;
}

interface OrderCardProps {
  order: OrderData;
  onTrackOrder?: () => void;
  onContinueSubscription?: () => void;
  onSeeDetails?: () => void;
  onRateNow?: () => void;
  onRepostOrder?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onTrackOrder,
  onContinueSubscription,
  onSeeDetails,
  onRateNow,
  onRepostOrder,
}) => {
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
        return "Confirmed";
      default:
        return status;
    }
  };

  const isHistory = ["delivered", "completed"].includes(order.status);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bookingId}>Booking #{order.bookingId}</Text>
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

      {/* Booking Summary for history items */}
      {isHistory && (
        <Text style={styles.bookingSummaryTitle}>Booking Summary</Text>
      )}

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {order.serviceType === "tiffin"
              ? "Tiffin Service:"
              : "Hostel Booking:"}
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
                <Text style={styles.detailValue}>{order.startDate}</Text>
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
                <Text style={styles.detailValue}>{order.orderType}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-in date:</Text>
              <Text style={styles.detailValue}>{order.checkInDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-out date:</Text>
              <Text style={styles.detailValue}>{order.checkOutDate}</Text>
            </View>
          </>
        )}
      </View>

      {/* Subscription Note */}
      {isHistory && order.serviceType === "tiffin" && (
        <Text style={styles.subscriptionNote}>
          This subscription expired soon, to extend select Continue
          Subscription.
        </Text>
      )}

      {/* Hostel Image */}
      {order.serviceType === "hostel" && order.image && isHistory && (
        <View style={styles.imageContainer}>
          <Image source={order.image} style={styles.hostelImage} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {order.status === "pending" ? (
          <TouchableOpacity style={styles.primaryButton} onPress={onTrackOrder}>
            <Text style={styles.primaryButtonText}>Track Order</Text>
          </TouchableOpacity>
        ) : isHistory ? (
          <>
            {order.serviceType === "tiffin" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onContinueSubscription}
              >
                <Text style={styles.primaryButtonText}>
                  Continue Subscription
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSeeDetails}
            >
              <Text style={styles.secondaryButtonText}>See Details</Text>
            </TouchableOpacity>
            {order.status === "delivered" && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.halfButton, styles.rateButton]}
                  onPress={onRateNow}
                >
                  <Text style={styles.rateButtonText}>Rate Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.halfButton, styles.repostButton]}
                  onPress={onRepostOrder}
                >
                  <Text style={styles.repostButtonText}>Repost Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onTrackOrder}
            >
              <Text style={styles.primaryButtonText}>Track Order</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
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
  bookingSummaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 110,
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
  },
  subscriptionNote: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  hostelImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  rateButton: {
    backgroundColor: "#F3F4F6",
  },
  rateButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  repostButton: {
    backgroundColor: colors.primary,
  },
  repostButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OrderCard;
