import React, { useState, useEffect, useCallback } from "react";
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
  Modal,
  BackHandler
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
// import * as Sharing from 'expo-sharing'; // Commented out due to missing module
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query"; // Add this import
import Toast from "react-native-toast-message";
import Button from "./Buttons";
import colors from "@/constants/colors";
import { AMENITY_ICONS, DEFAULT_AMENITY_ICON } from "@/constants/iconMappings";
import ShareModal from "./modals/ShareModal";
import Header from "../components/Header";
import RoomSelectionModal from "./modals/RoomSelectionModal";
import { useFavorites } from "@/context/FavoritesContext"; // Fixed path
import { theme } from "@/constants/utils";
import { BASE_URL } from "@/constants/api";
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
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [reviews, setReviews] = useState([]);
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
        `${BASE_URL}/api/guest/tiffinServices/getTiffinServiceById/${id}`,
        { headers }
      );
      const result = await response.json();
      console.log("getTiffinServiceById response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        // Normalize to object if array
        return Array.isArray(result.data) ? result.data[0] : result.data;
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
        `${BASE_URL}/api/guest/hostelServices/getHostelServicesById/${id}`,
        { headers }
      );
      const result = await response.json();
      console.log("getHostelServiceById response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        // Normalize to object if array
        return Array.isArray(result.data) ? result.data[0] : result.data;
      } else {
        console.warn("getHostelServiceById failed:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch hostel details:", error);
      return null;
    }
  };

  // Extracted fetchReviews logic for useQuery (returns mapped data for caching)
  const fetchReviews = useCallback(async () => {
    const token = await getAuthToken();
    console.log("Token:", token);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      // Note: For tiffin, this endpoint looks incorrect (using hostelServices).
      // Assuming it's intentional or backend handles it; otherwise, change to /tiffinServices/getRatingsandReviews
      const url = paramType === "hostel"
        ? `${BASE_URL}/api/guest/hostelServices/getRatingsandReviews/${paramId}`
        : `${BASE_URL}/api/guest/hostelServices/getRatingsandReviews/${paramId}`;
      console.log("Fetching reviews from:", url);
      const response = await fetch(url, { headers });
      console.log("Fetch status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log(`${paramType} Review response:`, result);
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
        return {
          reviews: mappedReviews,
          averageRating: parseFloat(result.averageRating) || 0,
          totalReviews: result.totalReviews || 0
        };
      } else {
        return {
          reviews: [],
          averageRating: 0,
          totalReviews: 0
        };
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0
      };
    }
  }, [paramType, paramId]);

  // React Query hook for reviews (caches for 5min by default from QueryClient)
  const {
    data: reviewsResult,
    isLoading: isLoadingReviews
  } = useQuery({
    queryKey: ['reviews', paramType, paramId],
    queryFn: fetchReviews,
    enabled: activeTab === 'Reviews' && !!paramId, // Only fetch when tab is active (matches current behavior)
    staleTime: 5 * 60 * 1000, // Inherit 5min from QueryClient, but explicit for clarity
  });

  // Update local state when query data is available
  useEffect(() => {
    if (reviewsResult) {
      setReviews(reviewsResult.reviews);
      setMappedData((prev: any) => ({
        ...prev,
        userReviews: reviewsResult.reviews,
        rating: reviewsResult.averageRating,
        reviewCount: reviewsResult.totalReviews
      }));
    }
  }, [reviewsResult]);

  // Helper function to parse time string to minutes since midnight for sorting
  const parseTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  // Truncate description helper
  const truncateDescription = (desc: string, maxLength: number = 150): string => {
    if (!desc || desc.length <= maxLength) return desc || "Not available";
    return desc.substring(0, maxLength).trim() + '...';
  };

  // Map full API data to component-expected structure
  useEffect(() => {
    console.log("🟢 ProductDetails processing:", { paramId, paramType });
    const processData = async () => {
      if (!paramId || !paramType) {
        console.error("No ID or type provided");
        return;
      }
      // Note: Removed setIsLoadingDetails here; handle in render if needed
      try {
        let fullApiData = null;
        if (paramType === "tiffin") {
          // Always fetch full data from API to ensure complete fields like whatsIncludes, serviceFeatures, contactInfo, etc.
          fullApiData = await fetchTiffinById(paramId);
        } else if (paramType === "hostel") {
          // Fixed: Use paramId instead of hardcoded ID to fetch the correct hostel with weeklyDeposit
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
          const totalBedsCalc = rooms.reduce((acc: number, room: any) => {
            return acc + (Array.isArray(room.totalBeds) ? room.totalBeds.length : 0);
          }, 0);
          const availableBedsCalc = rooms.reduce((acc: number, room: any) => {
            if (!Array.isArray(room.totalBeds)) return acc;
            return acc + room.totalBeds.filter((bed: any) => bed.status === "Unoccupied").length;
          }, 0);
          // Use API values if available, fallback to calculated
          const totalBeds = typeof apiData.totalBeds === 'number' ? apiData.totalBeds : totalBedsCalc;
          const availableBeds = typeof apiData.availableBeds === 'number' ? apiData.availableBeds : availableBedsCalc;
          // Calculate daily if not provided (monthly / 30)
          const monthlyPrice = typeof apiData.pricing?.monthly === 'number' ? apiData.pricing.monthly : 0;
          const dailyPrice = typeof apiData.pricing?.perDay === 'number' ? apiData.pricing.perDay : Math.floor(monthlyPrice / 30);
          const weeklyPrice = typeof apiData.pricing?.weekly === 'number' ? apiData.pricing.weekly : 0;
          // Determine primary pricing tier (monthly > weekly > daily)
          let primaryAmount = 0;
          let primaryPeriod = '';
          let depositAmount = apiData.securityDeposit || apiData.weeklyDeposit || apiData.perDayDeposit || 0;

          if (monthlyPrice > 0) {
            primaryAmount = monthlyPrice;
            primaryPeriod = 'MONTH';
            depositAmount = apiData.securityDeposit || 0;
          } else if (weeklyPrice > 0) {
            primaryAmount = weeklyPrice;
            primaryPeriod = 'WEEK';
            depositAmount = apiData.weeklyDeposit || 0;
          } else if (dailyPrice > 0) {
            primaryAmount = dailyPrice;
            primaryPeriod = 'DAY';
            depositAmount = apiData.perDayDeposit || 0;
          }

          const priceText = `₹${primaryAmount}/${primaryPeriod}`;
          // Deposits from API
          const securityDeposit = typeof apiData.securityDeposit === 'number' ? apiData.securityDeposit : 0;
          const weeklyDeposit = typeof apiData.weeklyDeposit === 'number' ? apiData.weeklyDeposit : 0;
          const perDayDeposit = typeof apiData.perDayDeposit === 'number' ? apiData.perDayDeposit : 0;
          // Images
          const images = Array.isArray(apiData.hostelPhotos) ? apiData.hostelPhotos.map((p: string) => ({ uri: p })) : [];
          processedData = {
            id: apiData._id,
            name: apiData.hostelName || "Unknown Hostel",
            type: apiData.hostelType || "Boys Hostel",
            description: truncateDescription(apiData.description),
            images,
            totalRooms: typeof apiData.totalRooms === 'number' ? apiData.totalRooms : rooms.length,
            totalBeds,
            availableBeds,
            deposit: depositAmount,
            securityDeposit,
            weeklyDeposit,
            perDayDeposit,
            offer: apiData.offers ? parseInt(apiData.offers.replace('%', '')) : null,
            amenities: Array.isArray(apiData.facilities) ? apiData.facilities : [],
            fullAddress: typeof apiData.location?.fullAddress === 'string' ? apiData.location.fullAddress : "Not available",
            sublocation: Array.isArray(apiData.location?.nearbyLandmarks)
              ? apiData.location.nearbyLandmarks.map((l: any) => `${l.name} - ${l.distance}`).join(', ')
              : (typeof apiData.location?.nearbyLandmarks === 'string' ? apiData.location.nearbyLandmarks : "Not available"),
            location: typeof apiData.location?.fullAddress === 'string' ? apiData.location.fullAddress : "Unknown",
            rulesAndPolicies: typeof apiData.rulesAndPolicies === 'string' ? apiData.rulesAndPolicies : "Not available",
            userReviews: Array.isArray(apiData.userReviews) ? apiData.userReviews : [],
            reviewCount: typeof apiData.totalReviews === 'number' ? apiData.totalReviews : 0,
            rating: typeof apiData.averageRating === 'number' ? apiData.averageRating : 0,
            reviews: 0, // Fallback
            price: priceText,
            primaryPeriod,
            daily: dailyPrice,
            weekly: weeklyPrice,
            rooms: rooms, // Keep for potential use
            monthly: monthlyPrice,
          };
          // Debug log for deposits
          console.log('🔍 MappedData Deposits:', {
            securityDeposit,
            weeklyDeposit,
            perDayDeposit,
            deposit: depositAmount,
            primaryPeriod
          });
        } else if (paramType === "tiffin") {
          // Handle images from vegPhotos, nonVegPhotos, or fallback
          const vegPhotos = fullApiData.vegPhotos || [];
          const nonVegPhotos = fullApiData.nonVegPhotos || [];
          let images = [...vegPhotos, ...nonVegPhotos].filter(Boolean).map((p: string) => ({ uri: p }));
          if (images.length === 0 && fullApiData.image?.uri) {
            images = [{ uri: fullApiData.image.uri }];
          }
          // Handle mealPreferences from mealTimings or direct
          let mealPreferences = [];
          let timing = "7 AM - 9 PM";
          if (fullApiData.mealTimings && fullApiData.mealTimings.length > 0) {
            // Sort by parsed startTime to ensure chronological order
            const sortedTimings = [...fullApiData.mealTimings].sort((a, b) => {
              const aMinutes = parseTimeToMinutes(a.startTime);
              const bMinutes = parseTimeToMinutes(b.startTime);
              return aMinutes - bMinutes;
            });
            const firstStart = sortedTimings[0].startTime;
            const lastEnd = sortedTimings[sortedTimings.length - 1].endTime;
            timing = `${firstStart} - ${lastEnd}`;
            // Map for individual preferences
            mealPreferences = fullApiData.mealTimings.map((m: any) => ({
              type: m.mealType,
              time: `${m.startTime} - ${m.endTime}`,
            }));
          }
          const whatsIncluded = fullApiData.whatsIncludes ? fullApiData.whatsIncludes.split(', ').map(item => item.trim()).filter(Boolean) : [];
          const whyChooseUs = fullApiData.serviceFeatures || [];
          const orderTypes = fullApiData.orderTypes || ['Dining', 'Delivery'];
          const pricing = fullApiData.pricing || [];
          const offersText = pricing.map((p: any) => p.offers).filter(Boolean).join(" ");
          const fullDesc = `${fullApiData.description || ''} ${offersText}`.trim();
          // Derive tags from tags or foodType
          const tags = fullApiData.tags || (fullApiData.foodType ? [fullApiData.foodType] : []);
          const firstPlan = pricing[0];
          const price = firstPlan ? `₹${firstPlan.monthlyDelivery || firstPlan.monthlyDining || 0}/Month` : "₹0/Month";
          const offer = firstPlan?.offers ? firstPlan.offers : null;
          const rating = parseFloat(fullApiData.averageRating) || 0;
          const reviewCount = fullApiData.totalReviews || 0;
          // Handle location as object or string
          let fullAddress = "";
          let servingRadiusNum = 5;
          let nearbyLandmarks = "";
          if (typeof fullApiData.location === 'string') {
            fullAddress = fullApiData.location;
          } else {
            fullAddress = fullApiData.location?.fullAddress || "";
            servingRadiusNum = fullApiData.location?.serviceRadius || 5;
            nearbyLandmarks = Array.isArray(fullApiData.location?.nearbyLandmarks)
              ? fullApiData.location.nearbyLandmarks.map((l: any) => `${l.name} (${l.distance})`).join(', ')
              : fullApiData.location?.area || "";
          }
          const servingRadius = `${servingRadiusNum} km`;
          const location = fullAddress || "Not available";
          const isOffline = fullApiData.offlineDetails?.isOffline || false;
          const offlineReason = fullApiData.offlineDetails?.offlineReason || fullApiData.offlineReason || "";
          const comeBackAt = fullApiData.offlineDetails?.comeBackAt || fullApiData.comeBackAt || "";
          // Handle contactInfo preferring direct contactInfo, fallback to owner
          const contactPhone = fullApiData.contactInfo?.phone || fullApiData.owner?.phoneNumber || '';
          const contactWhatsapp = fullApiData.contactInfo?.whatsapp || fullApiData.contactInfo?.phone || fullApiData.owner?.phoneNumber || '';
          processedData = {
            id: fullApiData.id || fullApiData._id,
            name: fullApiData.name || fullApiData.tiffinName,
            description: fullDesc,
            images,
            tags,
            mealPreferences,
            whatsIncluded,
            orderTypes,
            whyChooseUs,
            fullAddress,
            servingRadius,
            nearbyLandmarks,
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
              phone: contactPhone.toString(),
              whatsapp: contactWhatsapp ? `+91${contactWhatsapp}` : '',
            },
            owner: fullApiData.owner,
            isOpenForSale: fullApiData.isOpenForSale !== undefined ? fullApiData.isOpenForSale : true,

          };

        }
        setMappedData(processedData);
      } catch (error) {
        console.error("Error processing data:", error);
      }
    };
    processData();
  }, [paramId, paramType]);

  // Show offline modal if not open for sale
  useEffect(() => {
    if (mappedData && paramType === "tiffin" && !mappedData.isOpenForSale) {
      setShowOfflineModal(true);
    }
  }, [mappedData, paramType]);
  const isFav = mappedData ? isFavorite(mappedData.id, paramType) : false;
  const addFavoriteToBackend = async (serviceId: string, serviceType: "tiffin" | "hostel") => {
    const token = await getAuthToken();
    if (!token) {
      console.warn("No token, skipping backend favorite add");
      return { success: false };
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    let url: string;
    let body: { [key: string]: string } = {};
    if (serviceType === "hostel") {
      url = `${BASE_URL}/api/guest/hostelServices/addFavouriteHostelService`;
      body = { hostelServiceId: serviceId };
    } else {
      url = `${BASE_URL}/api/guest/tiffinServices/addFavouriteTiffinService`;
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
      return result;
    } catch (error) {
      console.error(`Failed to add favorite ${serviceType}:`, error);
      return { success: false };
    }
  };

  // Update handleFavoritePress
  const handleFavoritePress = async () => {
    if (!mappedData) return;
    const serviceId = mappedData.id;
    const serviceType = paramType;
    const wasFavorite = isFav;
    const expectedAction = wasFavorite ? 'remove' : 'add';
    // Toggle local immediately for UI feedback
    if (wasFavorite) {
      removeFromFavorites(serviceId, serviceType);
    } else {
      addToFavorites({
        id: serviceId,
        type: serviceType,
        data: mappedData,
      });
    }
    // Call API (toggle)
    const result = await addFavoriteToBackend(serviceId, serviceType);
    if (result.success) {
      const action = result.message.includes('added') ? 'add' : 'remove';
      if (action !== expectedAction) {
        // Revert local state
        if (expectedAction === 'add') {
          removeFromFavorites(serviceId, serviceType);
        } else {
          addToFavorites({
            id: serviceId,
            type: serviceType,
            data: mappedData,
          });
        }
        Toast.show({
          type: 'error',
          text1: 'Sync Error',
          text2: 'Local and server state mismatch. Please try again.',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: wasFavorite ? 'Removed from favorites' : 'Added to favorites',
        });
      }
    } else {
      // Revert local state on failure
      if (expectedAction === 'add') {
        removeFromFavorites(serviceId, serviceType);
      } else {
        addToFavorites({
          id: serviceId,
          type: serviceType,
          data: mappedData,
        });
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update favorites. Please try again.',
      });
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (showRoomSelectionModal) {
        setShowRoomSelectionModal(false);
        return true; // ← default back ko rok deta hai
      }
      return false; // ← default navigation chalega
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [showRoomSelectionModal]);
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
  if (!mappedData) {
    return (
      <SafeAreaView>
        <View style={[styles.container, { marginTop: theme.verticalSpacing.space_20 }]}>
          <Header
            title={paramType === "tiffin" ? "Tiffin Details" : "Hostel Details"}
            backIconName="chevron-back"
            onBack={() => router.back()}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10 }}>Loading details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }



  // ==================== HEADER SECTION ====================
  const renderHeader = () => (

    <View style={{ marginTop: theme.verticalSpacing.space_30 }}>
      <Header
        title={paramType === "tiffin" ? "Tiffin Details" : "Hostel Details"}
        backIconName="chevron-back"
        onBack={() => router.back()}
      />
    </View>

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
            color={isFav ? "red" : "#A5A5A5"}
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
            {mappedData.rating} ({mappedData.reviewCount})
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
            <Text style={styles.locationTagText}>{mappedData?.location}</Text>
          </View>
        </View>
      )}
      {/* Hostel-specific location info */}
      {paramType === "hostel" && mappedData.sublocation && mappedData.sublocation !== "Not available" && (
        <Text style={styles.sublocation}>{mappedData.sublocation}</Text>
      )}
      {/* Hostel room availability */}
      {paramType === "hostel" && (
        <View style={styles.roomAvailability}>
          <Text style={styles.roomText}>Total Rooms: {mappedData.totalRooms || "Not available"}</Text>
          <View style={styles.bedInfo}>
            <Ionicons name="bed-outline" size={16} color="#666" />
            <Text style={styles.roomText}>
              {mappedData.availableBeds || 0}/{mappedData.totalBeds || 0} bed available
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
            <View key={index} style={tag === 'Non-Veg' ? styles.redTag : styles.greenTag}>
              <Text style={tag === 'Non-Veg' ? styles.redTagText : styles.greenTagText}>{tag}</Text>
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
  // ==================== PRICING SECTION ====================
  const renderPricingSection = () => {
    if (paramType === "hostel") {
      const plans = [
        {
          key: "daily",
          label: "Daily",
          price: mappedData.daily || 0,
          deposit: mappedData.perDayDeposit || 0,
          isPrimary: mappedData.primaryPeriod === "DAY",
        },
        {
          key: "weekly",
          label: "Weekly",
          price: mappedData.weekly || 0,
          deposit: mappedData.weeklyDeposit || 0,
          isPrimary: mappedData.primaryPeriod === "WEEK",
        },
        {
          key: "monthly",
          label: "Monthly",
          price: mappedData.monthly || 0,
          deposit: mappedData.securityDeposit || 0,
          isPrimary: mappedData.primaryPeriod === "MONTH",
        },
      ].filter(plan => plan.price > 0);

      if (plans.length === 0) {
        return (
          <View style={styles.fallbackPrice}>
            <Text style={styles.currentPrice}>{mappedData.price}</Text>
          </View>
        );
      }

      return (
        <View style={styles.pricingSectionContainer}>
          <Text style={styles.pricingSectionTitle}>Choose Your Stay Plan</Text>

          <View style={styles.plansWrapper}>
            {plans.map((plan) => (
              <View
                key={plan.key}
                style={[
                  styles.planCard,
                  plan.isPrimary && styles.primaryPlanCard,
                ]}
              >
                {plan.isPrimary && (
                  <View style={styles.popularRibbon}>
                    <Text style={styles.popularRibbonText}>MOST POPULAR</Text>
                  </View>
                )}

                <Text style={styles.planLabel}>{plan.label}</Text>

                <Text style={styles.planPrice}>
                  ₹{plan.price.toLocaleString("en-IN")}
                </Text>

                <Text style={styles.planPer}>per {plan.label.toLowerCase()}</Text>

                {mappedData.offer && plan.isPrimary && (
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerText}>{mappedData.offer}% OFF</Text>
                  </View>
                )}

                <View style={styles.depositWrapper}>
                  {plan.deposit > 0 ? (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
                      <Text style={styles.depositAmount}>
                        + ₹{plan.deposit.toLocaleString("en-IN")}
                      </Text>
                      <Text style={styles.depositLabel}>Security Deposit</Text>
                      <Text style={styles.refundableText}>Fully Refundable</Text>
                    </>
                  ) : (
                    <Text style={styles.noDepositText}>No Deposit Required</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.bottomNote}>
            Prices per person • Deposits fully refundable
          </Text>
        </View>
      );
    }

    // Tiffin pricing (unchanged rahega)
    return (
      <View style={styles.tiffinPricing}>
        {mappedData.pricing?.map((plan: any, index: number) => (
          <View key={index} style={styles.pricingPlan}>
            <View style={styles.pricingHeader}>
              <Text
                style={[styles.pricingSectionTitle, { color: '#1976D2' }]}
                numberOfLines={1}
              >
                {plan.planType} ({plan.foodType})
              </Text>
            </View>
            <View style={styles.pricingColumns}>
              {(plan.weeklyDining > 0 || plan.monthlyDining > 0) && (
                <View style={styles.pricingColumn}>
                  <Text style={styles.priceItem}>Dining ₹{plan.weeklyDining}/week</Text>
                  <Text style={styles.priceItem}>Dining ₹{plan.monthlyDining}/Month</Text>
                </View>
              )}
              {(plan.weeklyDelivery > 0 || plan.monthlyDelivery > 0) && (
                <View style={styles.pricingColumn}>
                  <Text style={styles.priceItem}>Delivery ₹{plan.weeklyDelivery}/week</Text>
                  <Text style={styles.priceItem}>Delivery ₹{plan.monthlyDelivery}/month</Text>
                </View>
              )}
            </View>
          </View>
        )) || (
            <View style={styles.pricingPlan}>
              <Text style={styles.priceItem}>{mappedData.price}</Text>
            </View>
          )}
      </View>
    );
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
          <Ionicons name="alert-circle-outline" size={20} color="red" />
          <Text style={styles.offlineText}>
            Currently offline: Please Check again after sometime.
          </Text>
        </View>
      )}
      {/* Not open for sale message */}
      {!mappedData.isOpenForSale && (
        <View style={styles.offlineWarning}>
          <Ionicons name="storefront-outline" size={20} color="red" />
          <Text style={styles.offlineText}>
            This store currently exceeded the order limit. Check back after sometime.
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
          {mappedData.nearbyLandmarks && mappedData.nearbyLandmarks !== "" && (
            <View style={styles.landmarkContainer}>
              <Ionicons name="location-outline" size={16} color="#4CAF50" style={styles.landmarkIcon} />
              <Text style={styles.landmarkText}>Nearby: {mappedData.nearbyLandmarks}</Text>
            </View>
          )}
          <Text style={styles.serviceRadius}>
            Service Radius: {mappedData.servingRadius}
          </Text>
          {mappedData.contactInfo && Object.values(mappedData.contactInfo).some(Boolean) && (
            <View style={styles.contactInfo}>
              {/* {mappedData.contactInfo.phone && (
                <Text style={styles.contactText}>Phone: {mappedData.contactInfo.phone}</Text>
              )}
              {mappedData.contactInfo.whatsapp && (
                <Text style={styles.contactText}>WhatsApp: {mappedData.contactInfo.whatsapp}</Text>
              )} */}
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
            {mappedData.rulesAndPolicies}
          </Text>
        </View>
      </View>
      {/* Location */}
      <View style={[styles.section, styles.locationSection]}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>{mappedData.location}</Text>
          {mappedData.sublocation && mappedData.sublocation !== "Not available" && (
            <View style={styles.landmarkContainer}>
              <Ionicons name="location-outline" size={16} color="#4CAF50" style={styles.landmarkIcon} />
              <Text style={styles.landmarkText}>Nearby: {mappedData.sublocation}</Text>
            </View>
          )}
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
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews available yet.</Text>
      ) : (
        <FlatList
          data={reviews}
          scrollEnabled={false}
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
              if (!mappedData.isOpenForSale) {
                // Optionally show toast or alert, but since disabled, no action
                return;
              }
              try {
                // Fetch real user data from storage
                const storedUser = await AsyncStorage.getItem('userProfile');
                const userDataObj = storedUser
                  ? JSON.parse(storedUser)
                  : { name: "", phoneNumber: "", email: "" };
                router.push({
                  pathname: "/bookingScreen", // Adjust if using full path like "/(secure)/bookingScreen"
                  params: {
                    bookingType: "tiffin",
                    serviceData: JSON.stringify({
                      serviceId: mappedData.id, // ✅ Now enables API fetches
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
                    userData: JSON.stringify(userDataObj), // ✅ Now autofills real name/phone if stored
                    defaultPlan: "monthly",
                    date: new Date().toISOString().split('T')[0], // 2025-11-19 (today)
                  },
                });
              } catch (error) {
                console.error("Navigation error:", error);
                alert("Failed to prepare booking. Please try again.");
              }
            }}
            width={width - 48}
            height={56}
            style={[
              styles.primaryButton,
              !mappedData.isOpenForSale && {
                backgroundColor: '#ccc',
                opacity: 0.7
              }
            ]}
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

  // ==================== OFFLINE MODAL ====================
  const renderOfflineModal = () => (
    <Modal
      visible={showOfflineModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowOfflineModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name="storefront-outline" size={60} color={colors.primary} />
          <Text style={styles.modalTitle}>Currently Not Accepting orders</Text>
          <Text style={styles.modalMessage}>
            We’re online but have reached our order limit. Please check back soon!
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowOfflineModal(false)}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, marginBottom: theme.verticalSpacing.space_20 }}>
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
        {paramType === "tiffin" && renderOfflineModal()}
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
      </View>
    </SafeAreaView>
  );
}

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
    backgroundColor: "orange",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  greenTagText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  redTag: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  redTagText: {
    fontSize: 12,
    color: "#C62828",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  rightSideContent: {
    alignItems: "flex-end",
    gap: 8,
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
  depositContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  depositAmount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  depositNotesContainer: {
    marginTop: 12,
  },
  depositNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  depositNote: {
    fontSize: 15,
    color: "#666",
    lineHeight: 16,
    flex: 1,
    marginLeft: 4,
    fontWeight: 500
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
    paddingVertical: 3,
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
    paddingVertical: 3,
  },
  orderTypeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  whyItem: {
    flexDirection: "row",
    paddingVertical: 3,
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
    fontWeight: "300",
    marginBottom: 4,
    color: "#000",
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  landmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  landmarkIcon: {
    marginRight: 8,
  },
  landmarkText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
    flex: 1,
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
    backgroundColor: "pink",
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: "red",
    marginLeft: 8,
    flex: 1,
    fontWeight: 400
  },
  depositamt: {
    fontSize: 18,
    fontWeight: 500,
    color: "#1976D2"
  },
  // Offline modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pricingSectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    marginVertical: 12,
  },
  pricingSectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 28,
  },
  plansWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch", // Yeh important hai – sab cards same height mein
  },
  planCard: {
    width: (width - 64 - 32) / 3, // 3 cards ke liye perfect equal width
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryPlanCard: {
    borderColor: colors.primary,
    borderWidth: 2.5,
    backgroundColor: "#F8FDFF",
  },
  popularRibbon: {
    position: "absolute",
    top: -14,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 30,
  },
  popularRibbonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  planLabel: {
    fontSize: 17,
    color: "#444",
    fontWeight: "600",
    marginBottom: 14,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  planPer: {
    fontSize: 15,
    color: "#777",
    marginBottom: 24,
  },
  offerBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginVertical: 12,
  },
  offerText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "700",
  },
  depositWrapper: {
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  depositAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  depositLabel: {
    fontSize: 14,
    color: "#666",
  },
  refundableText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  noDepositText: {
    fontSize: 15,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 16,
  },
  bottomNote: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
  fallbackPrice: {
    padding: 20,
    alignItems: "center",
  },
});