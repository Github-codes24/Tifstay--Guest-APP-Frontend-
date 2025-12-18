import React, { useState } from "react";
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors"; // तुम्हारा colors import
import { useFavorites } from "@/context/FavoritesContext";
import { theme } from "@/constants/utils";
// import hostel1 from "@/assets/images/image/hostelBanner.png"; // तुम्हारा fallback

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive breakpoints (पुराने से लिया)
const getDeviceSize = () => {
  if (SCREEN_WIDTH < 360) return "xs";
  if (SCREEN_WIDTH < 400) return "sm";
  if (SCREEN_WIDTH < 768) return "md";
  return "lg";
};
const DEVICE_SIZE = getDeviceSize();

// Responsive values (पुराने से exact)
const SPACING = {
  xs: { card: 10, content: 10, image: 8 },
  sm: { card: 12, content: 11, image: 10 },
  md: { card: 14, content: 12, image: 12 },
  lg: { card: 16, content: 14, image: 14 },
}[DEVICE_SIZE];

const IMAGE_HEIGHT = {
  xs: 130,
  sm: 145,
  md: 160,
  lg: 180,
}[DEVICE_SIZE];

const FONT_SIZES = {
  xs: { title: 16, location: 11, price: 20 },
  sm: { title: 17, location: 12, price: 21 },
  md: { title: 18, location: 12, price: 22 },
  lg: { title: 19, location: 13, price: 24 },
}[DEVICE_SIZE];

const MAX_AMENITIES = {
  xs: 3,
  sm: 3,
  md: 4,
  lg: 4,
}[DEVICE_SIZE];

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
  const { isFavorite } = useFavorites(); // तुम्हारा logic same
  const isFav = isFavorited !== undefined ? isFavorited : isFavorite(hostel.id, "hostel");
  const [imageSource, setImageSource] = useState(hostel.image); // तुम्हारा image state same
  const service = hostel; // तुम्हारा alias same

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoritePress?.(); // तुम्हारा handler same
  };

  // --- Add this helper and debug logging ---
function normalizeSubLocation(subLocation: any) : string {
  if (subLocation === null || typeof subLocation === 'undefined' || subLocation === '') return '';
  if (typeof subLocation === 'string') return subLocation;
  if (Array.isArray(subLocation)) {
    if (subLocation.length === 0) return '';
    // Extract names from array of objects (nearbyLandmarks)
    const names = subLocation
      .filter((item: any) => item && typeof item === 'object' && 'name' in item && typeof item.name === 'string')
      .map((item: any) => item.name)
      .slice(0, 2); // Limit to first 2 for compactness
    if (names.length > 0) {
      return names.join(', ');
    } else {
      // Fallback: join stringified items (but avoid [object Object])
      return subLocation.slice(0, 2).map((item: any) => String(item.name || item || '')).filter(Boolean).join(', ') || '';
    }
  }
  if (typeof subLocation === 'object') {
    // Single object case
    if ('name' in subLocation && typeof subLocation.name === 'string') return subLocation.name;
    // Fallback to safe stringify
    try { return JSON.stringify(subLocation).replace(/["{}]/g, ''); } catch { return String(subLocation); }
  }
  return String(subLocation);
}


  const totalBeds = (hostel?.availableBeds || 0) + (hostel?.occupiedBeds || 0); 

  const displayAmenities = (hostel.amenities ?? []).slice(0, MAX_AMENITIES); // पुराना UI logic
  const remainingAmenities = Math.max(0, (hostel.amenities ?? []).length - MAX_AMENITIES);

  const normalizedSubLoc = normalizeSubLocation(hostel?.subLocation);
const compactLocation = (hostel?.location || '') + (normalizedSubLoc ? ` • ${normalizedSubLoc.split(',')[0].trim()}` : '');


  return (
    <TouchableOpacity
      style={[styles.card, horizontal && styles.horizontalCard]}
      onPress={onPress} // तुम्हारा onPress same
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`Hostel: ${hostel.name || ''}`}
    >
      {/* Image Section with Padding (पुराना UI) */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageSection}>
          <Image
            source={imageSource}
            style={styles.image}
            onError={(error) => { // तुम्हारा error handling same
              console.log('Hostel image load failed:', error.nativeEvent.error, 'URL:', hostel.image?.uri);
              // setImageSource(hostel1);
            }}
            onLoad={() => console.log('Hostel image loaded successfully:', hostel.image?.uri)} // तुम्हारा onLoad same
            // defaultSource={hostel1} // extra fallback
            resizeMode="cover"
          />
          {/* Gradient Overlay (पुराना) */}
          <View style={styles.imageOverlay} />
          {/* Favorite Button (पुराना, top-right) */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"} // तुम्हारा isFav same
              size={19}
              color={isFav ? "#FF4D4D" : "#6B7280"} // updated color for filled
            />
          </TouchableOpacity>
          {/* Rating Badge (पुराना, top-left) */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={styles.ratingText}>{(hostel.rating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({hostel.reviews || 0})</Text>
          </View>
          {/* Type Badge (पुराना, bottom-left) */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{hostel.type || ''}</Text>
          </View>
        </View>
      </View>
      {/* Content Section (पुराना UI) */}
      <View style={styles.contentSection}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.hostelName} numberOfLines={1} ellipsizeMode="tail">
            {hostel.name || ''}
          </Text>
        </View>
        {/* Location - Compact (पुराना) */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color="#EF4444" />
          <Text style={styles.locationText} numberOfLines={1}>
            {compactLocation || ''}
          </Text>
        </View>
        {/* Beds Info - Compact 3 columns (पुराना) */}
        <View style={styles.bedsContainer}>
          <View style={styles.bedInfoCard}>
            <Ionicons name="bed" size={15} color={colors.primary || "#2563EB"} />
            <View style={styles.bedInfoText}>
              <Text style={styles.bedLabel}>Available</Text>
              <Text style={styles.bedValue}>{(hostel.availableBeds || 0).toString()}</Text>
            </View>
          </View>
          <View style={styles.bedInfoCard}>
            <Ionicons name="people" size={15} color="#F59E0B" />
            <View style={styles.bedInfoText}>
              <Text style={styles.bedLabel}>Occupied</Text>
              <Text style={styles.bedValue}>{(hostel.occupiedBeds || 0).toString()}</Text>
            </View>
          </View>
          <View style={styles.bedInfoCard}>
            <Ionicons name="grid" size={15} color="#10B981" />
            <View style={styles.bedInfoText}>
              <Text style={styles.bedLabel}>Total</Text>
              <Text style={styles.bedValue}>{totalBeds.toString()}</Text>
            </View>
          </View>
        </View>
        {/* Amenities - Single Row Only (पुराना) */}
        {displayAmenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <View style={styles.amenitiesRow}>
              {displayAmenities
                .filter(amenity => amenity && typeof amenity === 'string') // Safety filter
                .map((amenity, index) => (
                  <View key={`${amenity}-${index}`} style={styles.amenityChip}>
                    <Ionicons
                      name={amenityIcons[amenity] || "checkmark-circle"} // तुम्हारा amenityIcons same
                      size={11}
                      color={colors.primary || "#2563EB"}
                    />
                    <Text style={styles.amenityText} numberOfLines={1}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              {remainingAmenities > 0 && (
                <View style={styles.amenityChip}>
                  <Text style={styles.amenityMoreText}>+{remainingAmenities}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        {/* Footer (पुराना) */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{hostel.price || '₹0'}</Text>
              {/* <Text style={styles.perMonth}>/month</Text> */}
            </View>
            <Text style={styles.deposit}>Deposit: {hostel.deposit || "Contact"}</Text> {/* तुम्हारा deposit same */}
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={(e) => { // तुम्हारा onBookPress same
              e.stopPropagation();
              onBookPress && onBookPress();
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Book hostel"
          >
            <Text style={styles.bookButtonText}>Book</Text> {/* Updated text to match old UI, but can change to "Book Now" */}
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Styles (तुम्हारे old styles को पुराने UI
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: SPACING.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6", 
  },
  horizontalCard: {
    width: "100%",
  },
  imageWrapper: {
    padding: SPACING.image,
    paddingBottom: 0,
  },
  imageSection: {
    width: "100%",
    height: IMAGE_HEIGHT,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // updated from तुम्हारा rgba
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  reviewsText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(37, 99, 235, 0.95)", // updated for blue
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 11,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contentSection: {
    padding: SPACING.content,
  },
  header: {
    marginBottom: 7,
  },
  hostelName: {
    fontSize: FONT_SIZES.title,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    backgroundColor: "#FEF2F2", // red tint for location
    padding: 7,
    borderRadius: 9,
    gap: 5,
  },
  locationText: {
    fontSize: FONT_SIZES.location,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  bedsContainer: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 9,
  },
  bedInfoCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bedInfoText: {
    flex: 1,
  },
  bedLabel: {
    fontSize: 8,
    color: "#6B7280",
    fontWeight: "500",
  },
  bedValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  amenitiesContainer: {
    marginBottom: 9,
  },
  amenitiesRow: {
    flexDirection: "row",
    gap: 5,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 3,
    flexShrink: 1,
  },
  amenityText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#1E40AF",
    maxWidth: 65,
  },
  amenityMoreText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1E40AF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize:theme.fontSizes.size_18,
    fontWeight: "700",
    color: colors.primary || "#2563EB",
    letterSpacing: -0.5,
  },
  perMonth: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 3,
  },
  deposit: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  bookButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 9,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary || "#2563EB",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});