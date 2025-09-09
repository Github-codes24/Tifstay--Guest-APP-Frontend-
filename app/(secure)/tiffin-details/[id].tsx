import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { food1 } from "@/assets/images";
import demoData from "@/data/demoData.json";
import colors from "@/constants/colors";
import Button from "../../../components/Buttons";

const { width: screenWidth } = Dimensions.get("window");

// Type definitions for better type safety
interface MealPreference {
  type: string;
  time: string;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

interface TiffinService {
  id: number;
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  monthlyPrice: string;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
  timing: string;
  location: string;
  fullAddress: string;
  deliveryTime: string;
  deliveryFee: string;
  servingRadius: string;
  mealPreferences: MealPreference[];
  whatsIncluded: string[];
  orderTypes: string[];
  whyChooseUs: string[];
  userReviews: Review[];
}

export default function TiffinDetails() {
  // Get the ID from the route parameters
  const params = useLocalSearchParams();
  const id = parseInt(params?.id as string);

  // State management
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [isFavorited, setIsFavorited] = useState(false);

  // Find the tiffin service by ID from demo data
  const tiffinService = demoData.tiffinServices.find(
    (service) => service.id === id
  ) as TiffinService | undefined;

  // Error handling if service not found
  if (!tiffinService) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tiffin service not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handler functions
  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
  };

  const handleOrderNow = () => {
    console.log("Order Now pressed for:", tiffinService.name);
    // Navigate to order screen or show order modal
  };

  const handleShareMeal = () => {
    console.log("Share meal pressed");
    // Implement share functionality
  };

  // Helper function to render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={14} color="#FFA500" />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFA500" />
      );
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={14}
          color="#FFA500"
        />
      );
    }

    return stars;
  };

  // Render the Details tab content
  const renderDetailsContent = () => (
    <View style={styles.tabContent}>
      {/* Meal Preference Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Preference</Text>
        {tiffinService.mealPreferences.map((meal, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.listItemText}>
              {meal.type} {meal.time}
            </Text>
          </View>
        ))}
      </View>

      {/* What's Included Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"What's Included"}</Text>
        {tiffinService.whatsIncluded.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Order Type Available Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Type Available</Text>
        {tiffinService.orderTypes.map((type, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.listItemText}>{type}</Text>
          </View>
        ))}
      </View>

      {/* Why Choose Us Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        {tiffinService.whyChooseUs.map((reason, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.listItemText}>{reason}</Text>
          </View>
        ))}
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.locationText}>{tiffinService.fullAddress}</Text>
        <Text style={styles.servingRadius}>
          Service Radius: {tiffinService.servingRadius}
        </Text>
      </View>
    </View>
  );

  // Render the Reviews tab content
  const renderReviewsContent = () => (
    <View style={styles.tabContent}>
      {tiffinService.userReviews.map((review) => (
        <View key={review.id} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              {/* Avatar with first letter of name */}
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {review.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.reviewerDetails}>
                <Text style={styles.reviewerName}>{review.name}</Text>
                <View style={styles.reviewRating}>
                  {renderStars(review.rating)}
                </View>
              </View>
            </View>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tiffin Details</Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? "#FF4757" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image source={food1} style={styles.mainImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
        </View>

        {/* Service Info Section */}
        <View style={styles.serviceInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceName}>{tiffinService.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFA500" />
              <Text style={styles.ratingText}>{tiffinService.rating}</Text>
            </View>
          </View>

          <Text style={styles.serviceDescription}>
            {tiffinService.description}
          </Text>

          {/* Tags Section */}
          <View style={styles.tagsContainer}>
            {tiffinService.tags.includes("Veg") && (
              <View style={styles.vegTag}>
                <Ionicons name="leaf" size={12} color="#10B981" />
                <Text style={styles.vegText}>Pure Veg</Text>
              </View>
            )}
            <View style={styles.infoTag}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.tagText}>{tiffinService.location}</Text>
            </View>
            <View style={styles.infoTag}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.tagText}>{tiffinService.timing}</Text>
            </View>
          </View>

          <Text style={styles.reviewCount}>
            {tiffinService.reviews} Reviews
          </Text>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingHeader}>
            <Text style={styles.pricingTitle}>With One Meal (Veg)</Text>
            <View style={styles.vegIndicator}>
              <Text style={styles.vegIndicatorText}>100% VEG</Text>
            </View>
          </View>

          <View style={styles.pricingDetails}>
            <View style={styles.pricingRow}>
              <Text style={styles.label}>Dining ₹135/day</Text>
              <Text style={styles.value}>Delivery ₹150/day</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.label}>Dining ₹3500/month</Text>
              <Text style={styles.value}>Delivery ₹3900/month</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.label}>Dining ₹2200/Month</Text>
              <Text style={styles.value}>Delivery ₹5500/month</Text>
            </View>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryTimeContainer}>
                <Ionicons name="time-outline" size={16} color="#10B981" />
                <Text style={styles.deliveryTimeText}>
                  {tiffinService.deliveryTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "details" && styles.activeTab]}
            onPress={() => setActiveTab("details")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "details" && styles.activeTabText,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reviews" && styles.activeTabText,
              ]}
            >
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "details"
          ? renderDetailsContent()
          : renderReviewsContent()}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <Button
          title="Order Now"
          onPress={handleOrderNow}
          width={screenWidth * 0.9}
        />
        <TouchableOpacity style={styles.shareButton} onPress={handleShareMeal}>
          <Text style={styles.shareButtonText}>Share This Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  favoriteButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: screenWidth,
    height: 250,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  serviceInfo: {
    padding: 16,
    backgroundColor: "#fff",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  vegTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  vegText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  infoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#6B7280",
  },
  reviewCount: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  pricingSection: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    marginTop: 1,
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  vegIndicator: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vegIndicatorText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  pricingDetails: {
    gap: 8,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  deliveryInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deliveryTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deliveryTimeText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 1,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  tabContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B7280",
    marginTop: 6,
    marginRight: 10,
  },
  listItemText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  servingRadius: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  reviewItem: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  reviewComment: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
    gap: 10,
  },
  shareButton: {
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
