import React from "react";
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors"; // तुम्हारा colors
import { useFavorites } from "@/context/FavoritesContext";
import vegIcon from "@/assets/images/icons/vegIcon.png"; // तुम्हारे icons same
import nonVegIcon from "@/assets/images/icons/non_vegIcon.png";
import bothIcon from "@/assets/images/icons/BothIcon.png";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive (पुराने से same)
const getDeviceSize = () => {
  if (SCREEN_WIDTH < 360) return "xs";
  if (SCREEN_WIDTH < 400) return "sm";
  if (SCREEN_WIDTH < 768) return "md";
  return "lg";
};
const DEVICE_SIZE = getDeviceSize();

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
  xs: { title: 15, description: 12, price: 20, info: 9 },
  sm: { title: 16, description: 13, price: 21, info: 10 },
  md: { title: 17, description: 13, price: 22, info: 10 },
  lg: { title: 18, description: 14, price: 24, info: 11 },
}[DEVICE_SIZE];

interface TiffinCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    price: string;
    oldPrice: string;
    rating: number;
    reviews: number;
    image: any;
    tags?: string[];
    mealPreferences?: { type: string; time: string }[];
    location?: any;
    lowestPrice?: string | number;
    timing?: string; // Fallback for single timing
  };
  onPress?: () => void;
  onBookPress?: () => void;
  onFavoritePress?: () => void;
  horizontal?: boolean;
  isFavorited?: boolean;
}

export default function TiffinCard({
  service,
  onPress,
  onBookPress,
  onFavoritePress,
  horizontal = false,
  isFavorited,
}: TiffinCardProps) {
  const { isFavorite } = useFavorites(); // same
  const isFav = isFavorited !== undefined ? isFavorited : isFavorite(service.id, "tiffin");
  console.log("id", isFav); // same

  // safely handle tags (तुम्हारा logic same)
  const tags = Array.isArray(service.tags) ? service.tags : [];
  const hasVeg = tags.map((tag) => tag.toLowerCase()).includes("veg");
  const hasNonVeg = tags.map((tag) => tag.toLowerCase()).includes("non-veg");
  const getVegType = () => { // same
    if (hasVeg && hasNonVeg) return "both";
    if (hasNonVeg) return "non-veg";
    if (hasVeg) return "veg";
    return "both";
  };
  const vegType = getVegType();

  // Compute combined timing (updated to use service.mealPreferences or fallback to timing)
  const computeTiming = (preferences: { type: string; time: string }[] | undefined): string => {
    if (!preferences || preferences.length === 0) return service.timing || "-";
    const parseStartTime = (timeStr: string): number => {
      const start = timeStr.split(" - ")[0];
      const [timePart, period] = start.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const sorted = [...preferences].sort((a, b) => parseStartTime(a.time) - parseStartTime(b.time));
    const firstStart = sorted[0].time.split(" - ")[0];
    const lastEnd = sorted[sorted.length - 1].time.split(" - ")[1];
    return `${firstStart} - ${lastEnd}`;
  };
  const combinedTiming = computeTiming(service.mealPreferences);

  const handleFavoritePress = (e: any) => { // same
    e.stopPropagation();
    onFavoritePress?.();
  };

  const locationText = service?.location
    ? typeof service.location === "string"
      ? service.location
      : service.location.fullAddress || JSON.stringify(service.location) 
    : "-";

  // Format lowestPrice if it's a number
  const formattedLowestPrice = typeof service.lowestPrice === "number" 
    ? `${service.lowestPrice}` 
    : service.lowestPrice || "-";

  return (
    <TouchableOpacity
      style={[styles.card, horizontal && styles.horizontalCard]}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`Tiffin service: ${service.name}`}
    >
      {/* Image Section (पुराना) */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageSection}>
          <Image
            source={service.image} // no error handling in original, kept same
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
            accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={19}
              color={isFav ? "#FF4D4D" : "#6B7280"}
            />
          </TouchableOpacity>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={styles.ratingText}>{service.rating?.toFixed(1) || "0.0"}</Text>
            <Text style={styles.reviewsText}>({service.reviews || 0})</Text>
          </View>
          {/* Veg/Non-Veg Tag (पुराना dot style, but with तुम्हारे icons integrated) */}
          <View style={styles.vegTypeBadge}>
            <View
              style={[
                styles.vegDot,
                {
                  backgroundColor:
                    vegType === "veg" ? "#22C55E" : vegType === "non-veg" ? "#EF4444" : "#F97316",
                },
              ]}
            />
            <Text style={styles.vegTypeText}>
              {vegType === "both" ? "Both Veg & Non-Veg" : vegType === "veg" ? "Veg" : "Non-Veg"}
            </Text>
            {/* Optional: Overlay icons if needed, but dot for compact */}
          </View>
        </View>
      </View>
      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Header with discount (पुराना) */}
        <View style={styles.header}>
          <Text style={styles.serviceName} numberOfLines={1} ellipsizeMode="tail">
            {service.name}
          </Text>
          {service?.lowestPrice && ( // same condition
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>10% OFF</Text>
            </View>
          )}
        </View>
        {/* Description (same) */}
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {service.description}
        </Text>
        {/* Location & Time - Compact (पुराना with divider) */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={12} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="time" size={12} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {combinedTiming}
            </Text>
          </View>
        </View>
        {/* Price & Book Button (updated to show price details + lowest pricing) */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            {/* <View style={styles.priceRow}>
              <Text style={styles.price}>{service.price}</Text>
              <Text style={styles.perWeek}>/month</Text>
            </View>
            {service?.oldPrice && ( // same
              <Text style={styles.oldPrice}>{service.oldPrice}</Text>
            )} */}
            {service?.lowestPrice && ( // extra for up to
              <Text style={[styles.price,{fontSize:21}]}>From ₹{formattedLowestPrice}/-</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={(e) => { // same
              e.stopPropagation();
              onBookPress?.();
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Book tiffin service"
          >
            <Text style={styles.bookButtonText}>Book</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Styles (तुम्हारे को merge किया पुराने UI से)
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
    borderColor: colors.border, // तुम्हारा border
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
  vegTypeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  contentSection: {
    padding: SPACING.content,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  serviceName: {
    fontSize: FONT_SIZES.title,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: "#FEF3C7", // updated yellow
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#D97706",
  },
  description: {
    fontSize: FONT_SIZES.description,
    color: "#6B7280",
    lineHeight: 17,
    marginBottom: 7,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    backgroundColor: "#F9FAFB",
    padding: 7,
    borderRadius: 9,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 11,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 6,
  },
  infoText: {
    fontSize: FONT_SIZES.info,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: FONT_SIZES.price,
    fontWeight: "800",
    color: colors.primary || "#2563EB",
    letterSpacing: -0.5,
  },
  perWeek: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 3,
  },
  oldPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  highestPrice: {
    fontSize: 14,
    color: "#10B981",
    marginTop: 2,
    fontWeight: "700",
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