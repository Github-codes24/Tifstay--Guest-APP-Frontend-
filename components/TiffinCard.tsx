import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";
import { router } from "expo-router";

import vegIcon from "@/assets/images/icons/vegIcon.png";
import nonVegIcon from "@/assets/images/icons/non_vegIcon.png";
import bothIcon from "@/assets/images/icons/BothIcon.png";

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
    tags?: string[];
    timing: string;
    location?: any;
  };
  onPress?: () => void;
  onBookPress?: () => void;
  horizontal?: boolean;
}

export default function TiffinCard({
  service,
  onPress,
  onBookPress,
  horizontal = false,
}: TiffinCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(service.id, "tiffin");

  // safely handle tags
  const tags = Array.isArray(service.tags) ? service.tags : [];
  const hasVeg = tags.map((tag) => tag.toLowerCase()).includes("veg");
  const hasNonVeg = tags.map((tag) => tag.toLowerCase()).includes("non-veg");

  const getVegType = () => {
    if (hasVeg && hasNonVeg) return "both";
    if (hasNonVeg) return "non-veg";
    if (hasVeg) return "veg";
    return "both";
  };

  const vegType = getVegType();

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(service, "tiffin");
  };

  return (
    <TouchableOpacity
      style={[styles.serviceCard, horizontal && styles.horizontalContainer]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image source={service.image} style={styles.serviceImage} />
        </View>

        <View style={styles.serviceInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={styles.rating}>{service.rating}</Text>
              <Text style={styles.reviews}>({service.reviews})</Text>
            </View>
            <View style={styles.favoriteButtonContainer}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoritePress}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? "#A5A5A5" : "#A5A5A5"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{service.price}</Text>
              <Text style={styles.oldPrice}>{service.oldPrice}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>10% OFF</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.vegTag}>
              {vegType === "veg" ? (
                <Image source={vegIcon} style={styles.vegIcon} />
              ) : vegType === "non-veg" ? (
                <Image source={nonVegIcon} style={styles.nonVegIcon} />
              ) : (
                <Image source={bothIcon} style={styles.bothIcon} />
              )}
            </View>
            <View style={styles.locationTimeContainer}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText}>
                {service.location
                  ? typeof service.location === "string"
                    ? service.location
                    : service.location.fullAddress || JSON.stringify(service.location)
                  : "-"}
              </Text>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.timingText}>{service.timing}</Text>
            </View>
          </View>

          <View style={styles.bookButtonContainer}>
            <View>
              <Text style={styles.price}>{service.price}</Text>
              <Text style={styles.oldPrice}>{service.oldPrice}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: "/bookingScreen",
                  params: {
                    bookingType: "tiffin",
                    serviceId: service.id.toString(),
                    serviceName: service.name,
                    price: service.price,
                  },
                });
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: { flexDirection: "row", padding: 12 },
  horizontalContainer: { width: "100%", marginBottom: 0 },
  imageContainer: { position: "relative" },
  serviceImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
  favoriteButtonContainer: { margin: 12 },
  favoriteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceInfo: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  serviceName: { fontSize: 16, fontWeight: "600", color: "#1A1A1A", flex: 1, marginRight: 8 },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  rating: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  reviews: { fontSize: 14, color: "#6B7280" },
  serviceDescription: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  price: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
  oldPrice: { fontSize: 14, color: "#9CA3AF", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#E0E7FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 11, color: "#4338CA", fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  vegTag: { marginRight: 8 },
  vegIcon: { width: 52, height: 20 },
  nonVegIcon: { width: 71, height: 19 },
  bothIcon: { width: 46, height: 20 },
  locationTimeContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  locationText: { fontSize: 10, color: "#6B7280", marginRight: 4 },
  timingText: { fontSize: 10, color: "#6B7280" },
  bookButtonContainer: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  bookButton: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: "center", width: 78 },
  bookButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
});
