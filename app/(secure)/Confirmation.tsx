import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const { serviceType, serviceName, id, guestName: paramGuestName, amount: paramAmount } = params;
  const isTiffin = serviceType === "tiffin";

  const [bookingDetails, setBookingDetails] = useState(null);
  const [tiffinDetails, setTiffinDetails] = useState(null);
  const [randomTiffin, setRandomTiffin] = useState(null);
  const [randomTiffins, setRandomTiffins] = useState([]);
  const [randomHostels, setRandomHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (id) {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            setLoading(false);
            return;
          }

          let response;
          if (isTiffin) {
            response = await axios.get(
              `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinBookingByIdafterPayment/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data.success) {
              setTiffinDetails(response.data.data);
            }
          } else {
            response = await axios.get(
              `https://tifstay-project-be.onrender.com/api/guest/hostelServices/gethostelBookingByIdafterPayment/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data.success) {
              setBookingDetails(response.data.data);
            }
          }
        } catch (error) {
          console.error("Error fetching booking details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, isTiffin]);

  useEffect(() => {
    const fetchRandomTiffins = async () => {
      if (!isTiffin) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          const tiffins = [];
          for (let i = 0; i < 3; i++) {
            const response = await axios.get(
              "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRandomTiffinService",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data.success) {
              const service = response.data.data;
              // Ensure arrays
              service.vegPhotos = Array.isArray(service.vegPhotos) ? service.vegPhotos : service.vegPhotos ? [service.vegPhotos] : [];
              service.nonVegPhotos = Array.isArray(service.nonVegPhotos) ? service.nonVegPhotos : service.nonVegPhotos ? [service.nonVegPhotos] : [];
              // Set image for card
              service.image = service.vegPhotos[0] || service.nonVegPhotos[0];
              // Derive price, rating, etc. for card
              const firstPricing = service.pricing?.[0];
              service.price = firstPricing ? `₹${firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0}/Month` : "₹0/Month";
              service.oldPrice = firstPricing ? `₹${Math.round((firstPricing.monthlyDelivery || 0) * 1.1)}/Month` : "";
              service.rating = parseFloat(service.averageRating) || 0;
              service.reviews = service.totalReviews || 0;
              service.description = service.description || "Delicious home-cooked meals.";
              service.timing = service.mealTimings?.map((m: any) => `${m.startTime}-${m.endTime}`).join(' | ') || "7AM-9PM";
              // Tags from foodType
              service.tags = [service.foodType?.includes('Veg') ? 'Veg' : '', service.foodType?.includes('Non-Veg') ? 'Non-Veg' : ''].filter(Boolean);

              const locationString = service.location
                ? `${service.location.area || ''}${service.location.nearbyLandmarks ? `, ${service.location.nearbyLandmarks}` : ''}${service.location.fullAddress ? `, ${service.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
                : 'Location not available';
              service.location = locationString;
              // Set name if it's under a different key (adjust based on API response for tiffins)
              service.name = service.tiffinServiceName || service.serviceName || service.name || "Unnamed Tiffin Service";
              tiffins.push(service);
            }
          }
          setRandomTiffins(tiffins);
          if (tiffins.length > 0) {
            setRandomTiffin(tiffins[0]);
          }
        } catch (error) {
          console.error("Error fetching random tiffins:", error);
        }
      }
    };

    fetchRandomTiffins();
  }, [isTiffin]);

  useEffect(() => {
    const fetchRandomHostels = async () => {
      if (isTiffin) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          const hostels = [];
          for (let i = 0; i < 3; i++) {
            const response = await axios.get(
              "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getRandomHostelServices",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data.success) {
              const hostel = response.data.data;
              // Ensure array
              hostel.hostelPhotos = Array.isArray(hostel.hostelPhotos) ? hostel.hostelPhotos : hostel.hostelPhotos ? [hostel.hostelPhotos] : [];
              // Set image for card
              if (hostel.hostelPhotos[0]) {
                hostel.image = hostel.hostelPhotos[0].replace(/\.jpg\.jpg$/, ".jpg");
              } else {
                hostel.image = "https://via.placeholder.com/400x300?text=No+Image";
              }

              // Derive price, rating, etc. for card
              hostel.price = `₹${hostel.pricing?.monthly || hostel.pricing?.perDay || 0}/Month`; // Fallback to perDay if no monthly
              hostel.type = hostel.hostelType || "Boys Hostel";
              hostel.rating = parseFloat(hostel.averageRating) || 0;
              hostel.reviews = hostel.totalReviews || 0;
              hostel.availableBeds = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.filter((bed: any) => bed.status === "Unoccupied") || []).length, 0) || 0;
              hostel.amenities = (hostel.facilities || []).map((f: any) => f.name || f).filter(Boolean);
              hostel.deposit = `₹${hostel.securityDeposit || 0}`;
              hostel.description = hostel.description || "Comfortable stay with all amenities.";

              const locationString = hostel.location
                ? `${hostel.location.area || ''}${hostel.location.nearbyLandmarks ? `, ${hostel.location.nearbyLandmarks}` : ''}${hostel.location.fullAddress ? `, ${hostel.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
                : 'Location not available';
              hostel.location = locationString;
              // Set name to match what HostelCard expects (likely 'name')
              hostel.name = hostel.hostelName || "Unnamed Hostel";
              hostels.push(hostel);
            }
          }
          setRandomHostels(hostels);
        } catch (error) {
          console.error("Error fetching random hostels:", error);
        }
      }
    };

    fetchRandomHostels();
  }, [isTiffin]);

  const tiffinBookingDetails = tiffinDetails ? {
    bookingId: tiffinDetails.bookingId,
    tiffinService: tiffinDetails.tiffinServiceName,
    customer: tiffinDetails.guestName,
    amount: tiffinDetails.amount,
    startDate: formatDate(tiffinDetails.startDate),
    mealType: tiffinDetails.mealType || "Lunch",
    foodType: tiffinDetails.foodType || "Veg",
    orderType: tiffinDetails.orderType || "Delivery",
    planType: tiffinDetails.planType || "Daily",
  } : {
    bookingId: id || `${isTiffin ? "mk" : "hkl"}${Math.floor(
      Math.random() * 10000000
    )}`,
    tiffinService: serviceName || "Maharashtrian Ghar Ka Khana",
    customer: paramGuestName || "Onil Karmokar",
    amount: paramAmount || 'N/A',
    startDate: "21/07/25",
    mealType: "Lunch",
    foodType: "Veg",
    orderType: "Delivery",
    planType: "Daily",
  };

  const hostelBookingDetails = bookingDetails ? {
    id: id,
    hostelBooking: bookingDetails.hostelName,
    customer: bookingDetails.guestName,
    checkInDate: formatDate(bookingDetails.checkInDate),
    amount: bookingDetails.amount,
  } : {
    id: id || `${isTiffin ? "mk" : "hkl"}${Math.floor(
      Math.random() * 10000000
    )}`,
    hostelBooking: serviceName || "Scholars Den Boys Hostel",
    customer: paramGuestName || "Onil Karmokar",
    checkInDate: "01/08/25",
    amount: paramAmount || 'N/A',
  };

  const currentBookingDetails = isTiffin ? tiffinBookingDetails : hostelBookingDetails;

  const getRecommendations = () => {
    if (isTiffin) {
      return randomHostels.length > 0
        ? randomHostels
        : (demoData.hostels?.slice(0, 3) || []).map((hostel, index) => {
          // Ensure arrays and set props for demoData
          hostel.hostelPhotos = Array.isArray(hostel.hostelPhotos) ? hostel.hostelPhotos : hostel.hostelPhotos ? [hostel.hostelPhotos] : [];
          hostel.image = hostel.hostelPhotos[0] || hostel.image; // Fallback to existing image if set
          hostel.price = `₹${hostel.pricing?.monthly || hostel.pricing?.perDay || 0}/Month`;
          hostel.type = hostel.hostelType || "Boys Hostel";
          hostel.rating = parseFloat(hostel.averageRating) || 0;
          hostel.reviews = hostel.totalReviews || 0;
          hostel.availableBeds = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.filter((bed: any) => bed.status === "Unoccupied") || []).length, 0) || 0;
          hostel.amenities = (hostel.facilities || []).map((f: any) => f.name || f).filter(Boolean);
          hostel.deposit = `₹${hostel.securityDeposit || 0}`;
          hostel.description = hostel.description || "Comfortable stay with all amenities.";

          const locationString = hostel.location
            ? `${hostel.location.area || ''}${hostel.location.nearbyLandmarks ? `, ${hostel.location.nearbyLandmarks}` : ''}${hostel.location.fullAddress ? `, ${hostel.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
            : 'Location not available';
          hostel.location = locationString;
          // Set name to match what HostelCard expects
          hostel.name = hostel.hostelName || hostel.name || `Demo Hostel ${index + 1}`;
          return hostel;
        });
    } else {
      return randomTiffins.length > 0 ? randomTiffins : (demoData.tiffinServices?.slice(0, 3) || []).map((service, index) => {
        // Ensure arrays and set props for demoData
        service.vegPhotos = Array.isArray(service.vegPhotos) ? service.vegPhotos : service.vegPhotos ? [service.vegPhotos] : [];
        service.nonVegPhotos = Array.isArray(service.nonVegPhotos) ? service.nonVegPhotos : service.nonVegPhotos ? [service.nonVegPhotos] : [];
        service.image = service.vegPhotos[0] || service.nonVegPhotos[0] || service.image;
        const firstPricing = service.pricing?.[0];
        service.price = firstPricing ? `₹${firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0}/Month` : "₹0/Month";
        service.oldPrice = firstPricing ? `₹${Math.round((firstPricing.monthlyDelivery || 0) * 1.1)}/Month` : "";
        service.rating = parseFloat(service.averageRating) || 0;
        service.reviews = service.totalReviews || 0;
        service.description = service.description || "Delicious home-cooked meals.";
        service.timing = service.mealTimings?.map((m: any) => `${m.startTime}-${m.endTime}`).join(' | ') || "7AM-9PM";
        service.tags = [service.foodType?.includes('Veg') ? 'Veg' : '', service.foodType?.includes('Non-Veg') ? 'Non-Veg' : ''].filter(Boolean);

        const locationString = service.location
          ? `${service.location.area || ''}${service.location.nearbyLandmarks ? `, ${service.location.nearbyLandmarks}` : ''}${service.location.fullAddress ? `, ${service.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
          : 'Location not available';
        service.location = locationString;
        // Set name to match what TiffinCard expects
        service.name = service.tiffinServiceName || service.serviceName || service.name || `Demo Tiffin ${index + 1}`;
        return service;
      });
    }
  };

  const recommendations = getRecommendations();

  const handleCallAdmin = () => {
    Linking.openURL("tel:5146014598");
  };

  const handleChatAdmin = () => {
    router.push('/account/chatScreen');
  };

  const handleBookNow = (item: any) => {
    if (isTiffin) {
      router.push(`/hostel-details/${item.id || item._id}`);
    } else {
      router.push(`/tiffin-details/${item.id || item._id}`);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meal Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.mealType}
                </Text>
              </View> */}
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
                <Text style={styles.detailLabel}>Plan Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.planType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  ₹{tiffinBookingDetails.amount || 'N/A'}
                </Text>
              </View>
              <View style={[styles.detailRow]}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.orderId}>#{tiffinBookingDetails.bookingId}</Text>
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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount :</Text>
                <Text style={styles.detailValue}>
                  ₹{hostelBookingDetails.amount || 'N/A'}
                </Text>
              </View>
              <View style={[styles.detailRow]}>
                {/* <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.orderId}>#{hostelBookingDetails.id}</Text> */}
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
            {isTiffin ? "Recommended Hostels" : "Recommended Tiffin Services"}
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
              <View key={item.id || item._id || index} style={styles.cardWrapper}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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