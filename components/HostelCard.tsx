import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface HostelCardProps {
  hostel: {
    id: number;
    name: string;
    type: string;
    location: string;
    price: string;
    rating: number;
    amenities: string[];
    image: any;
  };
  onPress?: () => void;
  onBookPress?: () => void;
}

export default function HostelCard({
  hostel,
  onPress,
  onBookPress,
}: HostelCardProps) {
  return (
    <TouchableOpacity
      style={styles.hostelCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={hostel.image} style={styles.hostelImage} />
      <View style={styles.hostelInfo}>
        <Text style={styles.hostelName}>{hostel.name}</Text>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{hostel.type}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.locationText}>{hostel.location}</Text>
        </View>
        <View style={styles.amenitiesRow}>
          {hostel.amenities.slice(0, 3).map((amenity) => (
            <View key={amenity} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{hostel.price}</Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={(e) => {
              e.stopPropagation();
              onBookPress?.();
            }}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hostelCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hostelImage: {
    width: "100%",
    height: 200,
  },
  hostelInfo: {
    padding: 16,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: "#4338CA",
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
  },
  amenitiesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  amenityTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityText: {
    fontSize: 12,
    color: "#4B5563",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#004AAD",
  },
  bookButton: {
    backgroundColor: "#004AAD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
