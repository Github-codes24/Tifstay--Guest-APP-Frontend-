import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
// import * as Sharing from 'expo-sharing'; // Commented out due to missing module
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "./Buttons";
import colors from "@/constants/colors";
import { AMENITY_ICONS, DEFAULT_AMENITY_ICON } from "@/constants/iconMappings";
import ShareModal from "./modals/ShareModal";
import Header from "../components/Header";
import RoomSelectionModal from "./modals/RoomSelectionModal";
import { useFavorites } from "@/context/FavoritesContext"; // Fixed path

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const paramId = params.id as string;
  const paramType = params.type as "tiffin" | "hostel";

  const [mappedData, setMappedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showRoomSelectionModal, setShowRoomSelectionModal] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fixed: Import all needed functions from context
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();

  // Auth token helper (reused from DashboardScreen logic)
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("No auth token found in AsyncStorage");
      }
      console.log("Auth token retrieved:", token ? "Valid token" : "No token");
      return token;
    } catch (error) {
      console.error("Error fetching auth token:", error);
      return null;
    }
  };

  // --- Fetch full tiffin details by ID ---
  const fetchTiffinById = async (id: string): Promise<any | null> => {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    try {
      const response = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinServiceById/${id}`,
        { headers }
      );
      const result = await response.json();
      console.log("getTiffinServiceById response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        return result.data;
      } else {
        console.warn("getTiffinServiceById failed:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch tiffin details:", error);
      return null;
    }
  };

  // --- Fetch full hostel details by ID ---
  const fetchHostelById = async (id: string): Promise<any | null> => {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    try {
      const response = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelServicesById/${id}`,
        { headers }
      );
      const result = await response.json();
      console.log("getHostelServiceById response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        return result.data;
      } else {
        console.warn("getHostelServiceById failed:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch hostel details:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!mappedData?.id || activeTab !== "Reviews") {
      console.log("Skipping fetch: ", { paramType, id: mappedData?.id, activeTab });
      return;
    }

    const fetchReviews = async () => {
      setIsLoadingReviews(true);

      const token = await getAuthToken();
      console.log("Token:", token);

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        // Use the same endpoint structure as hostel for tiffin reviews
        const url = paramType === "hostel"
          ? `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRatingsandReviews/${mappedData.id}`
          : `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRatingsandReviews/${mappedData.id}`;
        console.log("Fetching reviews from:", url);

        const response = await fetch(url, { headers });
        console.log("Fetch status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`${paramType}Review response:`, result);

        if (result.success) {
          const mappedReviews = result.data.map((review: any) => {
            const [d, m, y] = review.reviewDate.split('/'); 
            return {
              id: review._id,
              name: review.guest?.name || review.user?.name || "Anonymous",
              avatar: review.guest?.profileImage || review.user?.profileImage || null,
              rating: review.rating,
              comment: review.review,
              date: new Date(y, m - 1, d).toLocaleDateString(), 
            };
          });
          console.log("Mapped reviews:", mappedReviews);
          setReviews(mappedReviews);
          setMappedData((prev: any) => ({
            ...prev,
            userReviews: mappedReviews,
            rating: parseFloat(result.averageRating) || 0,
            reviewCount: result.totalReviews || 0
          }));
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [paramType, mappedData?.id, activeTab]);

  // Map full API data to component-expected structure
  useEffect(() => {
    console.log("🟢 ProductDetails processing:", { paramId, paramType });

    const processData = async () => {
      if (!paramId || !paramType) {
        console.error("No ID or type provided");
        return;
      }

      setIsLoadingDetails(true);
      try {
        let fullApiData = null;

        if (paramType === "tiffin") {
          // Check if full data was passed from Dashboard
          const passedDataStr = params.fullServiceData as string;
          if (passedDataStr) {
            try {
              const passedData = JSON.parse(passedDataStr);
              if (passedData && passedData.pricing && passedData.id === paramId) {
                fullApiData = passedData;
                console.log("Using passed full service data from Dashboard (includes pricing with plan IDs)");
              }
            } catch (parseError) {
              console.warn("Failed to parse passed data, falling back to API fetch:", parseError);
            }
          }
          // Fallback to fetch if not passed or invalid
          if (!fullApiData) {
            fullApiData = await fetchTiffinById(paramId);
          }
        } else if (paramType === "hostel") {
          fullApiData = await fetchHostelById(paramId);
        }

        if (!fullApiData) {
          console.error(`Failed to fetch ${paramType} details`);
          return;
        }

        console.log(`Full ${paramType} API Data:`, JSON.stringify(fullApiData, null, 2));

        let processedData: any = {};

        if (paramType === "hostel") {
          const apiData = fullApiData;

          const rooms = Array.isArray(apiData.rooms) ? apiData.rooms : [];
          const totalBeds = rooms.reduce((acc: number, room: any) => {
            return acc + (Array.isArray(room.totalBeds) ? room.totalBeds.length : 0);
          }, 0);
          const availableBeds = rooms.reduce((acc: number, room: any) => {
            if (!Array.isArray(room.totalBeds)) return acc;
            return acc + room.totalBeds.filter((bed: any) => bed.status === "Unoccupied").length;
          }, 0);

          // Calculate daily if not provided (monthly / 30)
          const monthlyPrice = typeof apiData.pricing?.monthly === 'number' ? apiData.pricing.monthly : 0;
          const dailyPrice = typeof apiData.pricing?.daily === 'number' ? apiData.pricing.daily : Math.floor(monthlyPrice / 30);
          const weeklyPrice = typeof apiData.pricing?.weekly === 'number' ? apiData.pricing.weekly : 0;

          // Images
          const images = Array.isArray(apiData.hostelPhotos) ? apiData.hostelPhotos.map((p: string) => ({ uri: p })) : [];

          processedData = {
            id: apiData._id,
            name: apiData.hostelName || "Unknown Hostel",
            type: apiData.hostelType || "Boys Hostel",
            description: apiData.description || "No description available.",
            images,
            totalRooms: typeof apiData.totalRooms === 'number' ? apiData.totalRooms : rooms.length,
            totalBeds,
            availableBeds,
            deposit: typeof apiData.securityDeposit === 'number' ? apiData.securityDeposit : 0,
            offer: apiData.offers ? parseInt(apiData.offers.replace('%', '')) : null,
            amenities: Array.isArray(apiData.facilities) ? apiData.facilities : [],
            fullAddress: typeof apiData.location?.fullAddress === 'string' ? apiData.location.fullAddress : "",
            sublocation: typeof apiData.location?.area === 'string' ? apiData.location.area : "",
            rulesAndPolicies: typeof apiData.rulesAndPolicies === 'string' ? apiData.rulesAndPolicies : "Default rules: No smoking, visitors till 8 PM.",
            userReviews: Array.isArray(apiData.userReviews) ? apiData.userReviews : [],
            reviewCount: typeof apiData.reviewCount === 'number' ? apiData.reviewCount : 0,
            rating: typeof apiData.rating === 'number' ? apiData.rating : 0,
            reviews: 0, // Fallback
            price: `₹${monthlyPrice}/MONTH`,
            daily: dailyPrice,
            weekly: weeklyPrice,
            location: typeof apiData.location?.nearbyLandmarks === 'string' ? apiData.location.nearbyLandmarks : "Unknown",
            rooms: rooms, // Keep for potential use
          };
        } else if (paramType === "tiffin") {
          // Handle single image or photos array
          let images = [];
          if (fullApiData.image && fullApiData.image.uri) {
            images = [{ uri: fullApiData.image.uri }];
          } else {
            const photos = fullApiData.photos || [];
            images = photos.length > 0 ? photos.map((p: string) => ({ uri: p })) : [];
          }
          const mealPreferences = fullApiData.mealTimings?.map((m: any) => ({
            type: m.mealType,
            time: `${m.startTime} - ${m.endTime}`,
          })) || [];
          const whatsIncluded = fullApiData.includedItems || fullApiData.whatsIncluded || [];
          const whyChooseUs = fullApiData.whyChooseUs || fullApiData.highlights || [];
          const orderTypes = fullApiData.orderTypes || ['Dining', 'Delivery'];
          const pricing = fullApiData.pricing || [];
          const offersText = pricing.map((p: any) => p.offers).join(" ");
          const fullDesc = `${fullApiData.description} ${offersText}`;

          // Derive tags from pricing
          const foodTags: string[] = [];
          pricing.forEach((p: any) => {
            const ft = p.foodType?.toLowerCase();
            if (ft?.includes("veg")) foodTags.push("Veg");
            if (ft?.includes("non-veg")) foodTags.push("Non-Veg");
          });
          const tags = [...new Set(foodTags)];

          const firstPlan = pricing[0];
          const price = firstPlan ? `₹${firstPlan.monthlyDelivery || firstPlan.monthlyDining || 0}/Month` : "₹0/Month";
          const offer = firstPlan?.offers ? firstPlan.offers : null;
          const rating = parseFloat(fullApiData.averageRating) || 0;
          const reviewCount = fullApiData.totalReviews || 0;
          const fullAddress = fullApiData.location?.fullAddress || "";
          const servingRadius = `${fullApiData.location?.serviceRadius || 5} km`;
          const location = fullApiData.location?.nearbyLandmarks || fullAddress || "Unknown";
          const timing = fullApiData.mealTimings ? fullApiData.mealTimings.map((m: any) => `${m.startTime} - ${m.endTime}`).join(', ') : "7 AM - 9 PM";
          const isOffline = fullApiData.isOffline || false;
          const offlineReason = fullApiData.offlineReason || "";
          const comeBackAt = fullApiData.comeBackAt || "";

          processedData = {
            id: fullApiData.id || fullApiData._id,
            name: fullApiData.tiffinName,
            description: fullDesc,
            images,
            tags,
            mealPreferences,
            whatsIncluded,
            orderTypes,
            whyChooseUs,
            fullAddress,
            servingRadius,
            rating,
            reviewCount,
            price,
            offer,
            timing,
            userReviews: [], // Will be fetched separately if needed
            foodType: fullApiData.foodType,
            pricing,
            isOffline,
            offlineReason,
            comeBackAt,
            location,
            contactInfo: {
              phone: fullApiData.ownerId?.phoneNumber || '',
              whatsapp: fullApiData.ownerId?.phoneNumber ? `+91${fullApiData.ownerId.phoneNumber}` : '',
            },
            owner: fullApiData.ownerId,
          };
        }

        setMappedData(processedData);
      } catch (error) {
        console.error("Error processing data:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    processData();
  }, [paramId, paramType]);

  // Fixed: Now isFavorite is available, use mappedData
  const isFav = mappedData ? isFavorite(mappedData.id, paramType) : false;

  // Inside ProductDetails component

  // Add this helper for API calls
  const addFavoriteToBackend = async (serviceId: string, serviceType: "tiffin" | "hostel") => {
    const token = await getAuthToken();
    if (!token) {
      console.warn("No token, skipping backend favorite add");
      return false;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    let url: string;
    let body: { [key: string]: string } = {};

    if (serviceType === "hostel") {
      url = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/addFavouriteHostelService";
      body = { hostelServiceId: serviceId };
    } else {
      url = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/addFavouriteTiffinService";
      body = { tiffinServiceId: serviceId };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const result = await response.json();
      console.log(`Add favorite ${serviceType} response:`, result);
      return result.success || false;
    } catch (error) {
      console.error(`Failed to add favorite ${serviceType}:`, error);
      return false;
    }
  };

  // Update handleFavoritePress
  const handleFavoritePress = async () => {
    if (!mappedData) return;

    const serviceId = mappedData.id;
    const serviceType = paramType;

    if (isFav) {
      // Remove logic (local context only; add remove API if backend supports it)
      removeFromFavorites(serviceId, serviceType);
      Alert.alert("Success", "Removed successfully from favourites");
    } else {
      // Add to local context first (for instant UI feedback)
      addToFavorites({
        id: serviceId,
        type: serviceType,
        data: mappedData,
      });

      // Then call backend API
      const success = await addFavoriteToBackend(serviceId, serviceType);
      if (!success) {
        // Optional: Revert local if backend fails
        removeFromFavorites(serviceId, serviceType);
        Alert.alert("Error", "Failed to add to favorites. Please try again.");
      } else {
        Alert.alert("Success", "Added successfully");
      }
    }
  };

  const handleShare = async (platform: string) => {
    if (!mappedData) return;
    setShowShareModal(false);

    // Generate deep link using expo-linking
    const deepLink = Linking.createURL('/product-details', {
      queryParams: { id: paramId, type: paramType }
    });

    const message =
      paramType === "tiffin"
        ? `Check out this amazing tiffin service: ${mappedData.name} - ${mappedData.description}\n\nOpen in app: ${deepLink}`
        : `Check out this great hostel: ${mappedData.name} - ${mappedData.description}\n\nOpen in app: ${deepLink}`;

    try {
      if (platform === "whatsapp") {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        await Linking.openURL(whatsappUrl);
      } else if (platform === "messenger") {
        // For Messenger, use native share sheet as fallback (or implement fb-messenger:// if needed)
        // Note: fb-messenger://share is limited; native share works better for links
        const messengerUrl = `fb-messenger://share?link=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(messengerUrl);
        if (canOpen) {
          await Linking.openURL(messengerUrl);
        } else {
          // Fallback to alert since expo-sharing not available
          Alert.alert("Share", message);
        }
      } else if (platform === "copylink") {
        await Clipboard.setStringAsync(deepLink);
        // Optionally, copy the full message too, but link is key
      }

      // Show confirmation modal after a brief delay
      setTimeout(() => {
        setShowConfirmationModal(true);
      }, 500);
    } catch (error) {
      console.error("Share error:", error);
      // Fallback to alert since expo-sharing not available
      Alert.alert("Share", message);
    }
  };

  // Early return if data not ready
  if (!mappedData && !isLoadingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={paramType === "tiffin" ? "Tiffin Details" : "Hostel Details"}
          backIconName="chevron-back"
          onBack={() => router.back()}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={paramType === "tiffin" ? "Tiffin Details" : "Hostel Details"}
          backIconName="chevron-back"
          onBack={() => router.back()}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10 }}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== HEADER SECTION ====================
  const renderHeader = () => (
    <Header
      title={paramType === "tiffin" ? "Tiffin Details" : "Hostel Details"}
      backIconName="chevron-back"
      onBack={() => router.back()}
    />
  );

  // ==================== IMAGE CAROUSEL SECTION ====================
  const renderImageCarousel = () => {
    const imageWidth = width - 32;

    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={mappedData.images || []}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={imageWidth}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / imageWidth
            );
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <Image source={item} style={styles.image} />
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {(mappedData.images || []).map((_: any, index: number) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentImageIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Favorite button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={24}
            color={isFav ? "#A5A5A5" : "#A5A5A5"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ==================== BASIC INFO SECTION ====================
  const renderBasicInfo = () => (
    <View style={styles.basicInfo}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{mappedData.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFA500" />
          <Text style={styles.rating}>
            {mappedData.rating} ({mappedData.reviews || mappedData.reviewCount})
          </Text>
        </View>
      </View>

      {/* Rating */}

      {/* Tags for Hostel */}
      {paramType === "hostel" && (
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{mappedData.type}</Text>
          </View>
          <View style={styles.locationTag}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationTagText}>{mappedData.location}</Text>
          </View>
        </View>
      )}

      {/* Hostel-specific location info */}
      {paramType === "hostel" && mappedData.sublocation && (
        <Text style={styles.sublocation}>{mappedData.sublocation}</Text>
      )}

      {/* Hostel room availability */}
      {paramType === "hostel" && (
        <View style={styles.roomAvailability}>
          <Text style={styles.roomText}>Total Rooms: {mappedData.totalRooms}</Text>
          <View style={styles.bedInfo}>
            <Ionicons name="bed-outline" size={16} color="#666" />
            <Text style={styles.roomText}>
              {mappedData.availableBeds}/{mappedData.totalBeds} bed available
            </Text>
          </View>
        </View>
      )}

      {/* Description */}
      <Text style={styles.description}>{mappedData.description}</Text>

      {/* Tags and timing for Tiffin */}
      {paramType === "tiffin" && (
        <View style={styles.tiffinTags}>
          {mappedData.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.greenTag}>
              <Text style={styles.greenTagText}>{tag}</Text>
            </View>
          ))}
          <View style={styles.timingTag}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.timingText}>{mappedData.location}</Text>
          </View>
          <View style={styles.timingTag}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timingText}>{mappedData.timing}</Text>
          </View>
        </View>
      )}

      {/* Pricing Section */}
      {renderPricingSection()}
    </View>
  );

  // ==================== PRICING SECTION ====================
  const renderPricingSection = () => {
    if (paramType === "hostel") {
      return (
        <View style={styles.pricingBox}>
          <View style={styles.priceRow}>
            <Text style={styles.oldPrice}>₹{mappedData.daily}/day</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.oldPrice}>₹{mappedData.weekly}/week</Text>
          </View>
          <View style={styles.priceMainRow}>
            <Text style={styles.currentPrice}>{mappedData.price}</Text>
            {mappedData.offer && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{mappedData.offer}% OFF</Text>
              </View>
            )}
          </View>
          <Text style={styles.depositNote}>
            Note: You have to pay security deposit of {mappedData.deposit} on monthly
            booking. It will be refunded to you on check-out.
          </Text>
        </View>
      );
    } else {
      // For tiffin - dynamic pricing
      return (
        <View style={styles.tiffinPricing}>
          {mappedData.pricing?.map((plan: any, index: number) => (
            <View key={index} style={styles.pricingPlan}>
              <View style={styles.pricingHeader}>
                <Text 
                  style={styles.pricingSectionTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {plan.planType} ({plan.foodType})
                </Text>
                {plan.offers && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{plan.offers}</Text>
                  </View>
                )}
              </View>
              <View style={styles.pricingColumns}>
                {/* Dining prices column */}
                <View style={styles.pricingColumn}>
                  <Text style={styles.priceItem}>Dining ₹{plan.perMealDining}/day</Text>
                  <Text style={styles.priceItem}>Dining ₹{plan.weeklyDining}/week</Text>
                  <Text style={styles.priceItem}>Dining ₹{plan.monthlyDining}/Month</Text>
                </View>
                {/* Delivery prices column */}
                <View style={styles.pricingColumn}>
                  <Text style={styles.priceItem}>Delivery ₹{plan.perMealDelivery}/day</Text>
                  <Text style={styles.priceItem}>Delivery ₹{plan.weeklyDelivery}/week</Text>
                  <Text style={styles.priceItem}>Delivery ₹{plan.monthlyDelivery}/month</Text>
                </View>
              </View>
            </View>
          )) || (
              <View style={styles.pricingPlan}>
                <Text style={styles.priceItem}>{mappedData.price}</Text>
              </View>
            )}
        </View>
      );
    }
  };

  // ==================== TABS SECTION ====================
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "Details" && styles.activeTab]}
        onPress={() => setActiveTab("Details")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "Details" && styles.activeTabText,
          ]}
        >
          Details
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "Reviews" && styles.activeTab]}
        onPress={() => setActiveTab("Reviews")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "Reviews" && styles.activeTabText,
          ]}
        >
          Reviews
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ==================== TIFFIN DETAILS SECTION ====================
  const renderTiffinDetails = () => (
    <View style={styles.detailsContainer}>
      {/* Offline warning if applicable */}
      {mappedData.isOffline && (
        <View style={styles.offlineWarning}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
          <Text style={styles.offlineText}>
            Currently offline: {mappedData.offlineReason}. Back on {mappedData.comeBackAt}.
          </Text>
        </View>
      )}

      {/* Meal Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Preference</Text>
        {mappedData.mealPreferences?.map((meal: any, index: number) => (
          <View key={index} style={styles.mealPrefItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.mealPrefText}>
              {meal.type} ({meal.time})
            </Text>
          </View>
        ))}
      </View>

      {/* What's Included */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"What's included"}</Text>
        {mappedData.whatsIncluded?.map((item: string, index: number) => (
          <View key={index} style={styles.includedItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.includedText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Order Type Available */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Type Available</Text>
        {mappedData.orderTypes?.map((orderType: string, index: number) => (
          <View key={index} style={styles.orderTypeItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.orderTypeText}>{orderType}</Text>
          </View>
        ))}
      </View>

      {/* Why Choose Us */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        {mappedData.whyChooseUs?.map((item: string, index: number) => (
          <View key={index} style={styles.whyItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.whyText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Location */}
      <View style={[styles.section, styles.locationSection]}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>{mappedData.location}</Text>
          <Text style={styles.locationAddress}>{mappedData.fullAddress}</Text>
          <Text style={styles.serviceRadius}>
            Service Radius: {mappedData.servingRadius}
          </Text>
          {mappedData.contactInfo && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>Phone: {mappedData.contactInfo.phone}</Text>
              <Text style={styles.contactText}>WhatsApp: {mappedData.contactInfo.whatsapp}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // ==================== HOSTEL DETAILS SECTION ====================
  const renderHostelDetails = () => (
    <View style={styles.detailsContainer}>
      {/* Facilities & Amenities */}
      <View style={[styles.section, styles.facilitiesSection]}>
        <Text style={styles.sectionTitle}>Facilities & Amenities</Text>
        <View style={styles.facilitiesContainer}>
          <View style={styles.facilitiesGrid}>
            {mappedData.amenities?.map((amenity: any, index: number) => {
              const amenityName =
                typeof amenity === "string" ? amenity : amenity.name;
              const isAvailable =
                typeof amenity === "string"
                  ? true
                  : amenity.available !== false;
              const iconName =
                AMENITY_ICONS[amenityName] || DEFAULT_AMENITY_ICON;

              return (
                <View key={index} style={styles.facilityItem}>
                  <Ionicons
                    name={iconName as any}
                    size={20}
                    color={isAvailable ? "#333" : "#ccc"}
                    style={styles.facilityIcon}
                  />
                  <Text
                    style={[
                      styles.facilityText,
                      !isAvailable && styles.unavailableFacility,
                    ]}
                  >
                    {amenityName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Rules & Policies */}
      <View style={[styles.section, styles.rulesSection]}>
        <Text style={styles.sectionTitle}>Rules & Policies</Text>
        <View style={styles.rulesBox}>
          <Ionicons
            name="alert-circle"
            size={20}
            color="#FFA726"
            style={styles.rulesIcon}
          />
          <Text style={styles.rulesText}>
            {mappedData.rulesAndPolicies ||
              "No smoking inside premises. Visitors allowed till 8 PM. Mess timing: 7-10 AM, 12-2 PM, 7-9 PM. Maintain cleanliness in common areas."}
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={[styles.section, styles.locationSection]}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>Near Medical College</Text>
          <Text style={styles.locationAddress}>
            {mappedData.fullAddress || `${mappedData.sublocation}, ${mappedData.location}`}
          </Text>
        </View>
      </View>
    </View>
  );

  // ==================== REVIEWS SECTION ====================
  const renderReviews = () => (
    <View style={styles.reviewsContainer}>
      {isLoadingReviews ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews} // Use the fetched reviews for both types now
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reviews available yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  {/* Avatar with initials */}
                  <View style={styles.avatar}>
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {item.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </Text>
                    )}
                  </View>
                  <View style={styles.reviewerDetails}>
                    <Text style={styles.reviewerName}>{item.name}</Text>
                    <View style={styles.reviewRatingRow}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={14}
                          color={i < item.rating ? "#FFA500" : "#E0E0E0"}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewDate}>{item.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{item.comment}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
        />
      )}
    </View>
  );

  // ==================== BOTTOM BUTTONS SECTION ====================
  const renderBottomButtons = () => (
    <View style={styles.bottomContainer}>
      {paramType === "tiffin" ? (
        <>
          <Button
            title="Order Now"
            // Inside your Button onPress (full handler)
            onPress={async () => {
              try {
                // Fetch real user data from storage
                const storedUser = await AsyncStorage.getItem('userProfile');
                const userDataObj = storedUser
                  ? JSON.parse(storedUser)
                  : { name: "", phoneNumber: "", email: "" };

                router.push({
                  pathname: "/bookingScreen",  // Adjust if using full path like "/(secure)/bookingScreen"
                  params: {
                    bookingType: "tiffin",
                    serviceData: JSON.stringify({
                      serviceId: mappedData.id,  // ✅ Now enables API fetches
                      serviceName: mappedData.name,
                      price: mappedData.price,
                      foodType: mappedData.foodType || (mappedData.tags ? mappedData.tags[0] || "Veg" : "Veg"),
                      mealPreferences: mappedData.mealPreferences || [
                        { type: "Breakfast", time: "7-9 AM" },
                        { type: "Lunch", time: "12-2 PM" },
                        { type: "Dinner", time: "7-9 PM" }
                      ],
                      orderTypes: mappedData.orderTypes || ["Dining", "Delivery"],
                      pricing: mappedData.pricing || [],
                      location: mappedData.fullAddress || "",
                      contactInfo: mappedData.contactInfo || { phone: "", whatsapp: "" },
                    }),
                    userData: JSON.stringify(userDataObj),  // ✅ Now autofills real name/phone if stored
                    defaultPlan: "monthly",
                    date: new Date().toISOString().split('T')[0],  // 2025-10-09 (today)
                  },
                });
              } catch (error) {
                console.error("Navigation error:", error);
                alert("Failed to prepare booking. Please try again.");
              }
            }}
            width={width - 48}
            height={56}
            style={styles.primaryButton}
          />
          <Button
            title="Share This Meal"
            onPress={() => setShowShareModal(true)}
            width={width - 48}
            height={56}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        </>
      ) : (
        <>
          <Button
            title="Select Room"
            onPress={() => setShowRoomSelectionModal(true)} // Open modal instead
            width={width - 48}
            height={56}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
          <Button
            title="Share With Friend"
            onPress={() => setShowShareModal(true)}
            width={width - 48}
            height={56}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        </>
      )}
    </View>
  );
  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderImageCarousel()}
        {renderBasicInfo()}
        {renderTabs()}
        {activeTab === "Details"
          ? paramType === "tiffin"
            ? renderTiffinDetails()
            : renderHostelDetails()
          : renderReviews()}
        {renderBottomButtons()}
      </ScrollView>
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={mappedData.name}
        type={paramType}
      />
      {/* Add Room Selection Modal for Hostels */}
      {paramType === "hostel" && (
        <RoomSelectionModal
          visible={showRoomSelectionModal}
          onClose={() => setShowRoomSelectionModal(false)}
          hostelData={{
            id: mappedData.id,
            name: mappedData.name,
            price: mappedData.price,
            deposit: mappedData.deposit,
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Image carousel styles
  imageContainer: {
    height: 250,
    position: "relative",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 15,
    overflow: "hidden",
  },
  image: {
    width: width - 32, // Full screen width minus margins (16 * 2)
    height: 250,
    resizeMode: "cover", // This ensures the image fills the space properly
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Basic info styles
  basicInfo: {
    padding: 16,
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#000",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rating: {
    marginLeft: 4,
    color: "#666",
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  tag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  locationTagText: {
    fontSize: 12,
    color: "#666060",
    fontWeight: "500",
  },
  sublocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  roomAvailability: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomText: {
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  bedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  tiffinTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  greenTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  greenTagText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  timingTag: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
  },
  timingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },

  // Pricing styles
  // Pricing styles
  pricingBox: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    marginBottom: 4,
  },
  priceMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  oldPrice: {
    fontSize: 14,
    color: "#999",
    // textDecorationLine: "line-through",
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1976D2",
  },
  discountBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
  },
  discountText: {
    fontSize: 11,
    color: "#1976D2",
    fontWeight: "600",
  },
  depositNote: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    lineHeight: 18,
  },

  // Tiffin pricing styles
  tiffinPricing: {
    marginTop: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  pricingPlan: {
    marginBottom: 20,
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pricingSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1976D2",
    flex: 1,
    marginRight: 8,
  },
  pricingColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pricingColumn: {
    flex: 1,
  },
  priceItem: {
    fontSize: 12,
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#1976D2",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#1976D2",
    fontWeight: "500",
  },

  // Details container
  detailsContainer: {
    padding: 16,
  },
  section: {
    paddingHorizontal: 16,
    // marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    // marginBottom: 12,
    color: "#000",
  },
  // Tiffin details specific styles
  mealPrefItem: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  mealPrefText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  includedItem: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#666",
  },
  includedText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  orderTypeItem: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  orderTypeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  whyItem: {
    flexDirection: "row",
    // paddingVertical: 4,
  },
  whyText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },

  // Location section styles
  locationSection: {
    marginBottom: 0,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
  },
  locationBox: {
    // padding: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#000",
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  serviceRadius: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  // Hostel details specific styles
  facilitiesSection: {
    marginBottom: 20,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  facilitiesContainer: {
    borderRadius: 12,
    padding: 16,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    gap: 8,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 4,
  },
  facilityIcon: {
    marginRight: 6,
  },
  facilityText: {
    fontSize: 13,
    color: "#333",
    flexShrink: 1,
  },
  unavailableFacility: {
    color: "#ccc",
  },
  rulesSection: {
    marginBottom: 20,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 10,
    gap: 10,
  },
  rulesBox: {
    backgroundColor: "#FFF8E5",
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rulesIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  rulesText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },

  // Reviews styles
  reviewsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1976D2",
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#000",
  },
  reviewRatingRow: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
    marginLeft: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  reviewSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 40,
  },

  // Bottom buttons styles
  bottomContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  // Offline warning
  offlineWarning: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
  },
});