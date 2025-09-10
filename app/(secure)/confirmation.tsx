// screens/Confirmation.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import Button from "@/components/Buttons";
import { food1 } from "@/assets/images";
import Logo from "@/components/Logo";

const Confirmation: React.FC = () => {
  const bookingDetails = {
    id: "hkl4882266",
    tiffinService: "Maharashtrian Ghar Ka Khana",
    customer: "Onil Karmokar",
    startDate: "21/07/25",
    mealType: "Lunch",
    foodType: "Veg",
    orderType: "Delivery",
    plan: "Daily",
  };

  const handleCallAdmin = () => {
    console.log("Calling admin...");
  };

  const handleChatAdmin = () => {
    console.log("Opening chat...");
  };

  const handleBookNow = () => {
    router.push("/hostel-details/1 ?serviceType=tiffin");
  };

  const handleGoToOrder = () => {
    router.push("/orders");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Booking Submitted!</Text>
          <Text style={styles.subtitle}>
            Your tiffin booking request has been sent successfully.
          </Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tiffin Service:</Text>
            <Text style={styles.detailValue}>
              {bookingDetails.tiffinService}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{bookingDetails.customer}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>{bookingDetails.startDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Meal Type:</Text>
            <Text style={styles.detailValue}>{bookingDetails.mealType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Food Type:</Text>
            <Text style={styles.detailValue}>{bookingDetails.foodType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Type:</Text>
            <Text style={styles.detailValue}>{bookingDetails.orderType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan:</Text>
            <Text style={styles.detailValue}>{bookingDetails.plan}</Text>
          </View>

          <View style={[styles.detailRow]}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.orderId}>#{bookingDetails.id}</Text>
          </View>
        </View>

        {/* What's Next Section */}
        <View style={styles.whatsNextSection}>
          <Text style={styles.sectionTitle}>{"What's Next?"}</Text>

          <View style={styles.preferenceCard}>
            <Text style={styles.preferenceTitle}>Meal Preference</Text>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceNumberText}>1</Text>
              <Text style={styles.preferenceText}>Provider Contact</Text>
            </View>
            <View>
              <Text style={styles.preferenceDescription}>
                The tiffin provider will contact you within 1 hours to confirm
                your booking.
              </Text>
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceNumberText}>2</Text>
              <Text style={styles.preferenceText}>Delivery Setup</Text>
            </View>
            <View>
              <Text style={styles.preferenceDescription}>
                Discuss delivery address, timing, and any special requirements.
              </Text>
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceNumberText}>3</Text>
              <Text style={styles.preferenceText}>Delivery Setup</Text>
            </View>
            <View>
              <Text style={styles.preferenceDescription}>
                Discuss delivery address, timing, and any special requirements.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.adminContactRow}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCallAdmin}
          >
            <Ionicons name="call-outline" size={20} color="#004AAD" />
            <Text style={styles.contactButtonText}>Call to Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactButton, styles.chatButton]}
            onPress={handleChatAdmin}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#004AAD" />
            <Text style={styles.contactButtonText}>Chat with Admin</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.contactNote}>
          Having issue? Contact our support team at +34 12345 5210
        </Text>

        {/* Hostel Recommendation */}
        <View style={styles.hostelCard}>
          <View style={styles.hostelHeader}>
            <View>
              <Text style={styles.hostelTitle}>Green Valley Boys Hostel</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.locationText}>
                  Near VNIT, Medical College
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>4.2</Text>
                <Text style={styles.reviews}>(95)</Text>
              </View>
            </View>
            <Image source={food1} style={styles.hostelImage} />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>₹8000/month</Text>
            <Text style={styles.priceSubtext}>Deposit: ₹5000</Text>
          </View>

          <View style={styles.amenitiesRow}>
            <View style={styles.amenityItem}>
              <Ionicons name="wifi" size={16} color="#666" />
              <Text style={styles.amenityText}>Wifi</Text>
            </View>
            <View style={styles.amenityItem}>
              <MaterialCommunityIcons name="food" size={16} color="#666" />
              <Text style={styles.amenityText}>Mess</Text>
            </View>
            <View style={styles.amenityItem}>
              <MaterialCommunityIcons name="shower" size={16} color="#666" />
              <Text style={styles.amenityText}>Geyser</Text>
            </View>
            <View style={styles.amenityItem}>
              <MaterialCommunityIcons
                name="washing-machine"
                size={16}
                color="#666"
              />
              <Text style={styles.amenityText}>Laundry</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={handleBookNow}
          >
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Go To Order Screen"
            onPress={handleGoToOrder}
            width={undefined}
            style={styles.orderButton}
          />

          <Button
            title="Back to Home"
            onPress={handleBackToHome}
            width={undefined}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  titleSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 26,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  summaryCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: "#A5A5A5",
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
  },
  whatsNextSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: "#A5A5A5",
    borderWidth: 1,
  },
  preferenceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  preferenceOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    marginLeft: 8,
  },
  preferenceNumber: {
    fontSize: 10,
    color: "#000",
    fontWeight: "400",
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  preferenceNumberText: {
    fontSize: 10,
    color: "#000",
    fontWeight: "400",
    textAlign: "center",
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  preferenceDescription: {
    fontSize: 12,
    color: "#666",
    marginLeft: 28,
    marginBottom: 16,
    lineHeight: 18,
  },
  adminContactRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    marginHorizontal: 16,
    padding: 6,
    borderRadius: 4,
    marginBottom: 16,
    borderColor: "#A5A5A5",
    borderWidth: 1,
  },
  chatButton: {
    marginLeft: 0,
  },
  contactButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    marginLeft: 6,
  },
  contactNote: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  hostelCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderColor: "#A5A5A5",
    borderWidth: 1,
  },
  hostelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  hostelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  hostelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  priceSubtext: {
    fontSize: 13,
    color: "#666",
  },
  amenitiesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  amenityText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  bookNowButton: {
    backgroundColor: "#E8F0FE",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  bookNowText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "600",
  },
  actionButtons: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  orderButton: {
    marginBottom: 16,
    alignSelf: "center",
  },

  backButton: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#004AAD",
  },
  backButtonText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Confirmation;
