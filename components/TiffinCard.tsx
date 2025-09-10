import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface TiffinCardProps {
  service: {
    id: number;
    name: string;
    description: string;
    price: string;
    oldPrice: string;
    rating: number;
    reviews: number;
    image: any;
    tags: string[];
    timing: string;
    location: string;
  };
  onPress?: () => void;
  onBookPress?: () => void;
  isVeg?: boolean;
}

export default function TiffinCard({
  service,
  onPress,
  onBookPress,
  isVeg,
}: TiffinCardProps) {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Left side - Image */}
        <Image source={service.image} style={styles.serviceImage} />

        {/* Right side - Content */}
        <View style={styles.serviceInfo}>
          {/* Title and Rating Row */}
          <View style={styles.headerRow}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {service.name}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={styles.rating}>{service.rating}</Text>
              <Text style={styles.reviews}>({service.reviews})</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{service.price}</Text>
              <Text style={styles.oldPrice}>{service.oldPrice}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>10% OFF</Text>
            </View>
          </View>

          {/* Veg Tag and Location/Time Row */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.vegTag,
                isVeg ? styles.vegTagActive : styles.vegTagInactive,
              ]}
            >
              {isVeg ? (
                <Image
                  source={require("../assets/images/vegIcon.png")}
                  style={styles.vegIcon}
                />
              ) : (
                <Text style={styles.bothText}>Both</Text>
              )}
            </View>
            <View style={styles.locationTimeContainer}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.locationText}>{service.location}</Text>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.timingText}>{service.timing}</Text>
            </View>
          </View>

          {/* Book Button */}
          <View style={styles.bookButtonContainer}>
            <View>
              <Text style={styles.price}>{service.price}</Text>
              <Text style={styles.oldPrice}>{service.oldPrice}</Text>
            </View>
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  reviews: {
    fontSize: 14,
    color: "#6B7280",
  },
  serviceDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  oldPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    color: "#4338CA",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  vegTag: {
    borderRadius: 12,
    paddingVertical: 4,
    // paddingHorizontal handled separately in active/inactive
  },
  vegTagActive: {
    backgroundColor: "#10B981",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  vegTagInactive: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "grey",
    paddingHorizontal: 10,
  },
  vegIcon: {
    width: 52,
    height: 16,
  },
  bothText: {
    fontSize: 10,
    color: "#0A051F",
  },
  locationTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 10,
    color: "#6B7280",
    marginRight: 8,
  },
  timingText: {
    fontSize: 10,
    color: "#6B7280",
  },
  bookButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    width: 78,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
