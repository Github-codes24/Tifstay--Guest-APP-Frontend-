import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
}

export default function TiffinCard({
  service,
  onPress,
  onBookPress,
}: TiffinCardProps) {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={service.image} style={styles.serviceImage} />
      <View style={styles.serviceInfo}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFA500" />
            <Text style={styles.rating}>{service.rating}</Text>
            <Text style={styles.reviews}>({service.reviews})</Text>
          </View>
        </View>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{service.price}</Text>
          <Text style={styles.oldPrice}>{service.oldPrice}</Text>
          <View style={styles.discount}>
            <Text style={styles.discountText}>10% OFF</Text>
          </View>
        </View>
        <View style={styles.serviceFooter}>
          <View style={styles.tagContainer}>
            {service.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.timingContainer}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.location}>{service.location}</Text>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.timing}>{service.timing}</Text>
          </View>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  serviceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviews: {
    fontSize: 12,
    color: "#6B7280",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  oldPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discount: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 4,
  },
  tag: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "500",
  },
  timingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
  },
  timing: {
    fontSize: 12,
    color: "#6B7280",
  },
  bookButton: {
    backgroundColor: "#004AAD",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  bookButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
