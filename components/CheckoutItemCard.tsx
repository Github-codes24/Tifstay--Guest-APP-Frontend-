import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface TiffinCheckoutData {
  id: string;
  title: string;
  imageUrl: string;
  mealType: string;
  foodType: string;
  startDate: string;
  plan: string;
  orderType: string;
  price: string;
}

export interface HostelCheckoutData {
  id: string;
  title: string;
  imageUrl: string;
  guestName: string;
  contact: string;
  checkInDate: string;
  checkOutDate: string;
  rent: string;
  deposit: string;
}

interface CheckoutItemCardProps {
  serviceType: "tiffin" | "hostel";
  data: TiffinCheckoutData | HostelCheckoutData;
}

const CheckoutItemCard: React.FC<CheckoutItemCardProps> = ({
  serviceType,
  data,
}) => {
  const isTiffin = serviceType === "tiffin";

  return (
    <View style={styles.container}>
      <Image source={{ uri: data.imageUrl }} style={styles.image} />
      <View style={styles.itemInfo}>
        <Text style={styles.title}>{data.title}</Text>

        {isTiffin ? (
          // Tiffin Details
          <>
            {/* <DetailRow
              label="Meal Type"
              value={(data as TiffinCheckoutData).mealType}
            /> */}
            <DetailRow
              label="Food Type"
              value={(data as TiffinCheckoutData).foodType}
            />
            <DetailRow
              label="Start Date"
              value={(data as TiffinCheckoutData).startDate}
            />
            <DetailRow label="Plan" value={(data as TiffinCheckoutData).plan} />
            <DetailRow
              label="Order Type"
              value={(data as TiffinCheckoutData).orderType}
            />
            <DetailRow
              label="Price"
              value={(data as TiffinCheckoutData).price}
            />
          </>
        ) : (
          // Hostel Details
          <>
            <DetailRow
              label="Guest Name"
              value={(data as HostelCheckoutData).guestName}
            />
            <DetailRow
              label="Contact"
              value={(data as HostelCheckoutData).contact}
            />
            <DetailRow
              label="Check-in date"
              value={(data as HostelCheckoutData).checkInDate}
            />
            <DetailRow
              label="Check-out date"
              value={(data as HostelCheckoutData).checkOutDate}
            />
            <DetailRow label="Rent" value={(data as HostelCheckoutData).rent} />
            <DetailRow
              label="Deposit"
              value={(data as HostelCheckoutData).deposit}
            />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.calendarIcon}>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailColon}>:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    position: "relative",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    width: 85,
  },
  detailColon: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 6,
  },
  detailValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  calendarIcon: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 4,
  },
});

export default CheckoutItemCard;
