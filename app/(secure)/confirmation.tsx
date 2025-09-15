import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Button from "@/components/Buttons";
import Logo from "@/components/Logo";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import demoData from "@/data/demoData.json";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 40; // 20px padding on each side
const CARD_MARGIN = 10;

const Confirmation: React.FC = () => {
  const params = useLocalSearchParams();
  const { serviceType, serviceName } = params;
  const isTiffin = serviceType === "tiffin";

  const orderId = `${isTiffin ? "mk" : "hkl"}${Math.floor(
    Math.random() * 10000000
  )}`;

  const tiffinBookingDetails = {
    id: orderId,
    tiffinService: serviceName || "Maharashtrian Ghar Ka Khana",
    customer: "Onil Karmokar",
    startDate: "21/07/25",
    mealType: "Lunch",
    foodType: "Veg",
    orderType: "Delivery",
    plan: "Daily",
  };

  const hostelBookingDetails = {
    id: orderId,
    hostelBooking: serviceName || "Scholars Den Boys Hostel",
    customer: "Onil Karmokar",
    checkInDate: "01/08/25",
  };

  const bookingDetails = isTiffin ? tiffinBookingDetails : hostelBookingDetails;

  const getRecommendations = () => {
    if (isTiffin) {
      return demoData.hostels.slice(0, 3).map((hostel) => ({
        ...hostel,
        image: require("../../assets/images/hostel1.png"),
      }));
    } else {
      return demoData.tiffinServices.slice(0, 3).map((service) => ({
        ...service,
        image: require("../../assets/images/food1.png"),
      }));
    }
  };

  const recommendations = getRecommendations();

  const handleCallAdmin = () => {
    console.log("Calling admin...");
  };

  const handleChatAdmin = () => {
    console.log("Opening chat...");
  };

  const handleBookNow = (item: any) => {
    if (isTiffin) {
      router.push(`/hostel-details/${item.id}`);
    } else {
      router.push(`/tiffin-details/${item.id}`);
    }
  };

  const handleGoToOrder = () => {
    router.push({
      pathname: "/booking",
      params: {
        serviceType: isTiffin ? "tiffin" : "hostel",
      },
    });
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
            Your {isTiffin ? "tiffin" : "hostel"} booking request has been sent
            successfully.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceText}>↓ Invoice</Text>
            </TouchableOpacity>
          </View>

          {isTiffin ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tiffin Service:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.tiffinService}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.customer}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.startDate}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meal Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.mealType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.foodType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.orderType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.plan}
                </Text>
              </View>
              <View style={[styles.detailRow]}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.orderId}>#{tiffinBookingDetails.id}</Text>
              </View>
            </>
          ) : (
            // Hostel booking summary
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hostel Booking :</Text>
                <Text style={styles.detailValue}>
                  {hostelBookingDetails.hostelBooking}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer :</Text>
                <Text style={styles.detailValue}>
                  {hostelBookingDetails.customer}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in date :</Text>
                <Text style={styles.detailValue}>
                  {hostelBookingDetails.checkInDate}
                </Text>
              </View>
            </>
          )}
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

        {isTiffin && (
          <View style={styles.whatsNextSection}>
            <Text style={styles.sectionTitle}>{"What's Next?"}</Text>

            <View style={styles.preferenceCard}>
              <Text style={styles.preferenceTitle}>Meal Preference</Text>

              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>1</Text>
                <Text style={styles.preferenceText}>Provider Contact</Text>
              </View>
              <Text style={styles.preferenceDescription}>
                The tiffin provider will contact you within 1 hours to confirm
                your booking.
              </Text>

              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>2</Text>
                <Text style={styles.preferenceText}>Delivery Setup</Text>
              </View>
              <Text style={styles.preferenceDescription}>
                Discuss delivery address, timing, and any special requirements.
              </Text>

              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>3</Text>
                <Text style={styles.preferenceText}>Enjoy Your Meals</Text>
              </View>
              <Text style={styles.preferenceDescription}>
                Fresh, homemade tiffin will be delivered to your schedule.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationTitle}>
            {isTiffin ? "Healthy Bites Tiffin" : "Green Valley Boys Hostel"}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
            decelerationRate="fast"
            contentContainerStyle={styles.recommendationsContent}
            style={styles.recommendationsScroll}
          >
            {recommendations.map((item: any, index: number) => (
              <View key={item.id} style={styles.cardWrapper}>
                <View style={styles.recommendationCard}>
                  {isTiffin ? (
                    <HostelCard
                      hostel={item}
                      onPress={() => handleBookNow(item)}
                      onBookPress={() => handleBookNow(item)}
                      horizontal={true}
                    />
                  ) : (
                    <TiffinCard
                      service={item}
                      onPress={() => handleBookNow(item)}
                      onBookPress={() => handleBookNow(item)}
                      horizontal={true}
                    />
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isTiffin && (
            <Button
              title="Go To Order Screen"
              onPress={handleGoToOrder}
              width={undefined}
              style={styles.orderButton}
            />
          )}

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
    marginTop: 16,
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
    backgroundColor: "#fff",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceText: {
    color: "#4A90E2",
    fontSize: 14,
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
  adminContactRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderColor: "#A5A5A5",
    borderWidth: 1,
    backgroundColor: "#fff",
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
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  whatsNextSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: "#A5A5A5",
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  preferenceCard: {
    marginTop: 8,
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
    marginTop: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    marginLeft: 8,
  },
  preferenceNumberText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
    textAlign: "center",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    lineHeight: 20,
  },
  preferenceDescription: {
    fontSize: 12,
    color: "#666",
    marginLeft: 28,
    marginBottom: 12,
    lineHeight: 18,
  },
  recommendationsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingHorizontal: 20,
    color: "#1F2937",
  },
  recommendationsScroll: {
    flexGrow: 0,
  },
  recommendationsContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN,
  },
  cardWrapper: {
    width: CARD_WIDTH + CARD_MARGIN * 2,
    paddingHorizontal: CARD_MARGIN,
  },
  recommendationCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  orderButton: {
    marginBottom: 16,
    width: "100%",
  },
  backButton: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#004AAD",
    width: "100%",
  },
  backButtonText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Confirmation;
