import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";
import hostel1 from "@/assets/images/image/hostelBanner.png"; // Your existing fallback

interface HostelCardProps {
  hostel: {
    id: string;
    name: string;
    type: string;
    location: string;
    price: string;
    rating: number;
    reviews?: number;
    amenities: string[];
    image: any;
    availableBeds?: number;
    occupiedBeds?: number;
    subLocation?: string;
    deposit?: string;
    horizontal?: boolean;
  };
  onPress?: () => void;
  horizontal?: boolean;
  onBookPress?: () => void;
  onFavoritePress?: () => void;
  isFavorited?: boolean;
}

const amenityIcons: { [key: string]: string } = {
  WiFi: "wifi",
  Mess: "restaurant",
  Security: "shield-checkmark",
  Laundry: "shirt",
  AC: "snow",
  Gym: "fitness",
  Parking: "car",
};

export default function HostelCard({
  hostel,
  onPress,
  onBookPress,
  onFavoritePress,
  horizontal = false,
  isFavorited,
}: HostelCardProps) {
  const { isFavorite } = useFavorites();
  const isFav = isFavorited !== undefined ? isFavorited : isFavorite(hostel.id, "hostel");
  const [imageSource, setImageSource] = useState(hostel.image); // Start with provided source
  const service = hostel;

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoritePress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.hostelCard, horizontal && styles.horizontalContainer]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image 
            source={imageSource}
            style={styles.hostelImage}
            onError={(error) => {
              console.log('Hostel image load failed:', error.nativeEvent.error, 'URL:', hostel.image?.uri);
              setImageSource(hostel1); // Fall back to default image
            }}
            // Optional: Add onLoad for success logging if needed
            onLoad={() => console.log('Hostel image loaded successfully:', hostel.image?.uri)}
          />
        </View>

        <View style={styles.hostelInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={styles.rating}>{hostel.rating}</Text>
              <Text style={styles.ratingCount}>({hostel.reviews || 0})</Text>
            </View>
            <View style={styles.favoriteButtonContainer}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoritePress}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? "red" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.typeLocationRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{hostel.type}</Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.locationText}>{hostel.location}</Text>
            </View>
          </View>

          <Text style={styles.sublocation}>{hostel.subLocation || ""}</Text>

          <View style={styles.bedsRow}>
            <Ionicons name="bed-outline" size={16} color="#6B7280" />
            <Text style={styles.bedsText}>
              {hostel.availableBeds} available 
              {hostel.occupiedBeds ? ` (${hostel.occupiedBeds} occupied)` : ''}
            </Text>
          </View>

          <View style={styles.amenitiesRow}>
            {(hostel.amenities ?? []).slice(0, 4).map((amenity) => (
              <View key={amenity} style={styles.amenityItem}>
                <Ionicons
                  name={amenityIcons[amenity] || "checkmark-circle"}
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}

          </View>

          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{hostel.price}</Text>
              <Text style={styles.deposit}>Deposit: {hostel.deposit || "Contact for details"}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={(e) => {
                e.stopPropagation();
                onBookPress && onBookPress(); // Use the onBookPress prop
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
  hostelCard: {
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
    borderColor: "#F3F4F6",
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  horizontalContainer: {
    width: "100%",
    marginBottom: 0,
  },
  imageContainer: {
    position: "relative",
  },
  hostelImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 12,
  },
  favoriteButtonContainer: {
    margin: 12,
  },
  favoriteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hostelInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  hostelName: {
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
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  typeLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  typeTag: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
  },
  sublocation: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  bedsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  bedsText: {
    fontSize: 13,
    color: "#6B7280",
  },
  amenitiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 2,
    marginBottom: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderColor: "#DBEAFE",
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    margin: 2,
  },
  amenityText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#6B7280",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },
  deposit: {
    fontSize: 12,
    color: "#6B7280",
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});