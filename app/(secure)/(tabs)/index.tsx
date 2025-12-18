import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Keyboard,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import LocationModal from "@/components/modals/LocationModal";
import VegFilterModal from "@/components/modals/VegFilterModal";
import FilterModal from "@/components/modals/FilterModal";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import Dropdown from "@/components/Dropdown";
import colors from "@/constants/colors";
import { useAppState } from "@/context/AppStateProvider";
import { useAuthStore } from "@/store/authStore";
import { useFavorites } from "@/context/FavoritesContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hostellogo, tiffinlogo } from "@/assets/images";
import fallbackDp from "@/assets/images/fallbackdp.png"; 
import food1 from "@/assets/images/food1.png";
import hostel1 from "@/assets/images/image/hostelBanner.png";
import { BackHandler } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview"; 
interface Hostel {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  amenities: string[];
  rating: number;
  reviews?: number;
  image: any;
  availableBeds?: number;
  occupiedBeds?: number;
  subLocation?: string;
  deposit?: string;
  planType?: string;
  roomType?: string;
  acNonAc?: string;
}
interface TiffinService {
  id: string;
  name: string;
  description: string;
  location: string;
  price: string;
  tags: string[];
  rating: number;
  reviews?: number;
  image: any;
  pricing: any[];
  foodType: string;
  vegPhotos?: string[];
  nonVegPhotos?: string[];
  mealPreferences?: { type: string; time: string }[];
  overallTiming?: string;
  lowestPrice?: string;
}
interface Filters {
  rating?: number;
  vegNonVeg?: string;
  cost?: string;
  offers?: string;
  cashback?: string;
  cuisine?: string;
  location?: string;
  distance?: number;
  priceRange?: [number, number];
  hostelType?: string;
  roomType?: string;
  acNonAc?: string;
  planType?: string;
  amenities?: string[];
  userReviews?: number;
}
export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    appliedFilters,
    setAppliedFilters,
    isSearchFocused,
    setIsSearchFocused,
  } = useAppState();
  const {
    user,
    userLocation,
    setUserLocation,
    hasSelectedLocation,
    setHasSelectedLocation,
    profileData,
    fetchProfile,
  } = useAuthStore();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);
  const [showVegFilterModal, setShowVegFilterModal] = useState(false);
  const [vegFilter, setVegFilter] = useState<"off" | "veg_all" | "veg_only">("off");
  const [hostelType, setHostelType] = useState("");
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchVisibleCount, setSearchVisibleCount] = useState(10);
  // New states for Chat modal
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(""); // To pre-fill message if needed
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const vegToggleAnimated = useRef(new Animated.Value(vegFilter !== "off" ? 1 : 0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const allHostelsRef = useRef<Hostel[]>([]);
  const allTiffinsRef = useRef<TiffinService[]>([]);
  const isNavigatingRef = useRef(false);
  const imageMapping: { [key: string]: any } = {
    food1,
    hostel1,
  };
  const chatUrl = 'https://tawk.to/chat/6931375d98a8f2197d548a66/1jbk40hmr';
  // --- Auth token helper ---
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("No auth token found in AsyncStorage");
        Alert.alert(
          "Authentication Required",
          "Please log in to access hostel services.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => router.push("/login") },
          ]
        );
      }
      console.log("Auth token retrieved:", token ? "Valid token" : "No token");
      console.log('token', token)
      return token;
    } catch (error) {
      console.error("Error fetching auth token:", error);
      Alert.alert("Error", "Failed to retrieve authentication token. Please try again.");
      return null;
    }
  };
  // --- Add Favorite Tiffin Service API (returns full result for toggle) ---
  const addTiffinFavoriteAPI = async (tiffinId: string): Promise<{ success: boolean; message: string }> => {
    console.log("Adding tiffin favorite API called for ID:", tiffinId);
    const token = await getAuthToken();
    if (!token) {
      console.log("No token for add tiffin favorite");
      return { success: false, message: "No token" };
    }
    console.log("token", token);
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/addFavouriteTiffinService",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tiffinServiceId: tiffinId }),
        }
      );
      const result = await response.json();
      console.log("Add Tiffin Favorite API Response:", result);
      return result;
    } catch (error) {
      console.error("Failed to add tiffin favorite:", error);
      return { success: false, message: "Network error" };
    }
  };
  // --- Add Favorite Hostel Service API (returns full result for toggle) ---
  const addHostelFavoriteAPI = async (hostelId: string): Promise<{ success: boolean; message: string }> => {
    console.log("Adding hostel favorite API called for ID:", hostelId);
    const token = await getAuthToken();
    if (!token) {
      console.log("No token for add hostel favorite");
      return { success: false, message: "No token" };
    }
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/addFavouriteHostelService",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hostelServiceId: hostelId }),
        }
      );
      const result = await response.json();
      console.log("Add Hostel Favorite API Response:", result);
      return result;
    } catch (error) {
      console.error("Failed to add hostel favorite:", error);
      return { success: false, message: "Network error" };
    }
  };
  // --- Toggle Favorite Handler ---
  const handleFavoriteToggle = useCallback(async (item: TiffinService | Hostel) => {
    console.log("Favorite toggle called for item:", item.id);
    const type = "amenities" in item ? "hostel" : "tiffin";
    const id = item.id;
    console.log("Toggling favorite for ID:", id, "Type:", type, "Currently favorite:", isFavorite(id, type));
    // Call the toggle API (same endpoint handles add/remove)
    const result = await (type === "tiffin" ? addTiffinFavoriteAPI(id) : addHostelFavoriteAPI(id));
    if (result.success) {
      if (result.message.includes("added")) {
        // Add to frontend
        console.log("Adding to favorites via API toggle");
        addToFavorites({ id, type, data: item });
        Toast.show({ type: "success", text1: "Success", text2: "Added successfully" });
      } else if (result.message.includes("removed")) {
        // Remove from frontend
        console.log("Removing from favorites via API toggle");
        removeFromFavorites(id, type);
        Toast.show({ type: "success", text1: "Success", text2: "Removed successfully from favourites" });
      } else {
        // Unexpected message, but success, perhaps log
        console.log("Unexpected success message:", result.message);
        Toast.show({ type: "success", text1: "Success", text2: "Favorites updated" });
      }
    } else {
      console.log("API toggle failed:", result.message);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to update favorites. Please try again." });
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);
  // --- Compute Image for Tiffin based on vegFilter ---
  const computeTiffinImage = useCallback((tiffin: any, currentVegFilter: string) => {
    if (currentVegFilter !== "off") {
      // Veg filter applied: prioritize vegPhotos
      if (tiffin.vegPhotos && tiffin.vegPhotos.length > 0) {
        return { uri: tiffin.vegPhotos[0] };
      } else if (tiffin.nonVegPhotos && tiffin.nonVegPhotos.length > 0) {
        // Fallback to non-veg if no veg photos (though filter should ensure veg availability)
        return { uri: tiffin.nonVegPhotos[0] };
      }
    } else {
      // No veg filter: show any available image (prefer non-veg if both, to allow change on toggle)
      if (tiffin.nonVegPhotos && tiffin.nonVegPhotos.length > 0) {
        return { uri: tiffin.nonVegPhotos[0] };
      } else if (tiffin.vegPhotos && tiffin.vegPhotos.length > 0) {
        return { uri: tiffin.vegPhotos[0] };
      }
    }
    // Ultimate fallback
    return food1;
  }, []);
  // --- Unified Fetch Hostels Function ---
  const fetchHostels = useCallback(async (filters: Filters, searchQuery: string = "", baseData: Hostel[] = []): Promise<Hostel[]> => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // Build dynamic params
    const params = new URLSearchParams();
    // Search (always include if present)
    if (searchQuery.trim()) {
      params.append("search", encodeURIComponent(searchQuery.trim()));
    }
    // Only append non-empty filters
    if (filters.location) params.append("location", filters.location);
    // Normalize planType (map UI label to backend value)
    let normalizedPlanType = filters.planType;
    if (filters.planType) {
      const planTypeMap: { [key: string]: string } = {
        "Per Day": "perDay",
        "Weekly": "weekly",
        "Monthly": "monthly",
      };
      normalizedPlanType = planTypeMap[filters.planType] || filters.planType.toLowerCase().replace(/\s+/g, '');
      params.append("planType", normalizedPlanType);
    }
    if (filters.hostelType) params.append("hostelType", filters.hostelType);
    if (filters.roomType) params.append("roomType", filters.roomType);
    if (filters.acNonAc) params.append("acNonAc", filters.acNonAc);
    if (filters.rating) params.append("minRating", filters.rating.toString());
    // Price range (nested format)
    if (filters.priceRange && filters.priceRange.length === 2) {
      const priceStr = `${filters.priceRange[0]}-${filters.priceRange[1]}`;
      params.append("priceRange", priceStr);
    }
    // Amenities (comma-joined)
    if (filters.amenities && filters.amenities.length > 0) {
      params.append("amenities", filters.amenities.join(","));
    }
    const url = `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getAllHostelsServices?${params.toString()}`;
    console.log("🔍 Hostel Fetch URL:", url); // Debug log
    console.log("🔍 Normalized planType:", normalizedPlanType); // Debug: Confirm normalization
    try {
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log("getAllHostelsServices response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const mappedHostels = result.data.map((hostel: any) => {
          let imageUrl = hostel.hostelPhotos?.[0];
          if (imageUrl && (imageUrl.includes('/video/') || imageUrl.match(/\.mp4$/i))) {
            imageUrl = hostel.roomPhotos?.[0];
          }
          if (!imageUrl && hostel.roomPhotos?.length > 0) {
            imageUrl = hostel.roomPhotos[0];
          }
          return {
            id: hostel.hostelId || `hostel-${Math.random().toString(36).substr(2, 9)}`,
            name: hostel.hostelName || "Unknown Hostel",
            type: hostel.hostelType || "Unknown",
            location: hostel.fullAddress || "Unknown Location",
            price:
              hostel.pricing?.monthly
                ? `₹${hostel.pricing.monthly} /MONTHLY`
                : hostel.pricing?.weekly
                  ? `₹${hostel.pricing.weekly} /WEEKLY`
                  : hostel.pricing?.perDay
                    ? `₹${hostel.pricing.perDay} / PER DAY`
                    : "N/A",
            amenities: hostel.facilities || [],
            rating: hostel.averageRating || 0,
            reviews: hostel.totalReviews || 0,
            availableBeds: hostel.availableBeds || 0,
            occupiedBeds: hostel.occupiedBeds || 0,
            subLocation: hostel.nearbyLandmarks || "",
            deposit: `₹${hostel.securityDeposit || hostel.weeklyDeposit || hostel.perDayDepost || 0}`,
            image: imageUrl ? { uri: imageUrl } : imageMapping["hostel1"],
            planType: hostel.planType || "",
            roomType: hostel.roomType || "",
            acNonAc: hostel.acNonAc || "",
          };
        });
        return mappedHostels;
      } else if (searchQuery.trim() && baseData.length > 0) {
        // Backend empty / failed → fallback to client-side on baseData
        console.warn("Backend hostel search empty or failed, falling back to client-side filter");
        return baseData.filter((hostel) => {
          const lowerQuery = trimmedQuery;
          const nameMatch = hostel.name.toLowerCase().includes(lowerQuery);
          const locMatch = hostel.location.toLowerCase().includes(lowerQuery);
          return nameMatch || locMatch;
        });
      } else {
        console.warn("getAllHostelsServices failed:", result.message);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
      if (searchQuery.trim() && baseData.length > 0) {
        // Error → client fallback
        console.warn("Hostel search network/error fallback to client-side");
        return baseData.filter((hostel) => {
          const lowerQuery = trimmedQuery;
          const nameMatch = hostel.name.toLowerCase().includes(lowerQuery);
          const locMatch = hostel.location.toLowerCase().includes(lowerQuery);
          return nameMatch || locMatch;
        });
      }
      return [];
    }
  }, []);
  // --- React Query Functions (Tiffin updated to include veg/nonVeg photos) ---
  const fetchTiffinServicesQuery = async (): Promise<TiffinService[]> => {
    const token = await getAuthToken();
    if (!token) return [];
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const params = new URLSearchParams();
    // If a price sort is applied from filters (e.g., "low to high" / "high to low"), forward it to backend
    if (appliedFilters.cost) {
      params.append("priceSort", appliedFilters.cost);
    }
    const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAllTiffinServices?${params.toString()}`;
    try {
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log("getAllTiffinServices response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        const mapped = result.data.map((tiffin: any) => {
          const foodTags: string[] = [];
          tiffin.pricing.forEach((p: any) => {
            const ft = p.foodType.toLowerCase();
            if (ft === "veg") foodTags.push("veg");
            if (ft === "both veg & non-veg") {
              foodTags.push("veg");
              foodTags.push("non-veg");
            }
            if (ft === "non-veg") foodTags.push("non-veg");
          });
          const uniqueTags = [...new Set(foodTags)];
          const offersText = tiffin.pricing.map((p: any) => p.offers).join(" ");
          const fullDesc = `${tiffin.description} ${offersText}`;
          // Default image (any available, no filter)
          const defaultImage = computeTiffinImage(tiffin, "off");
          const firstPrice = tiffin.pricing[0];
          const price = firstPrice ? `₹${firstPrice.monthlyDelivery || 0}` : "₹0";
          const lowestPrice = tiffin.lowestPricing?.toString() || "0";
          const mealPreferences = tiffin.mealTimings?.map((m: any) => ({
            type: m.mealType,
            time: `${m.startTime} - ${m.endTime}`,
          })) || [];
          const mealTimings = tiffin.mealTimings || [];
          let overallStart = '-';
          let overallEnd = '-';
          if (mealTimings.length > 0) {
            overallStart = mealTimings[0].startTime || '-';
            overallEnd = mealTimings[mealTimings.length - 1].endTime || '-';
          }
          const overallTiming = `${overallStart} → ${overallEnd}`;
          return {
            id: tiffin._id,
            name: tiffin.tiffinName,
            description: fullDesc,
            location: tiffin.location.fullAddress,
            price,
            tags: uniqueTags,
            rating: tiffin.averageRating,
            reviews: tiffin.totalReviews || 0,
            image: defaultImage,
            vegPhotos: tiffin.vegPhotos || [],
            nonVegPhotos: tiffin.nonVegPhotos || [],
            pricing: tiffin.pricing,
            mealPreferences,
            overallTiming,
            foodType: tiffin.foodType,
            lowestPrice,
          };
        });
        return mapped;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch tiffins:", error);
      return [];
    }
  };
  const fetchTiffinRecentSearch = async (
    query: string,
    priceSort = "",
    minRating = 0,
    foodTypeParam?: string,
    allData: TiffinService[] = []
  ): Promise<TiffinService[]> => {
    if (!query.trim()) {
      return [];
    }
    setIsSearching(true);
    const trimmedQuery = query.trim().toLowerCase();
    const encodedQuery = encodeURIComponent(query.trim());
    const token = await getAuthToken();
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const params = new URLSearchParams({
      search: encodedQuery,
    });
    if (minRating > 0) {
      // Normalized to simple number like fetchHostels
      params.append("minRating", minRating.toString());
    }
    if (foodTypeParam) {
      params.append("foodType", foodTypeParam);
    }
    // Forward price sort to backend when provided so backend returns ordered results
    if (priceSort) {
      params.append("priceSort", priceSort);
    }
    const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAllTiffinServices?${params.toString()}`;
    console.log("🔍 Tiffin Search URL:", url);
    console.log("🔍 Decoded Query for Debug:", decodeURIComponent(encodedQuery));
    try {
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log("getAllTiffinServices search response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Backend success with data → extra client-side partial/case-insensitive filter (name + desc + location)
        const backendFiltered = result.data.filter((tiffin: any) => {
          const lowerQuery = trimmedQuery;
          const nameMatch = (tiffin.tiffinName || "").toLowerCase().includes(lowerQuery);
          const descMatch = (tiffin.description || "").toLowerCase().includes(lowerQuery);
          const locMatch = (tiffin.location?.fullAddress || "").toLowerCase().includes(lowerQuery);
          return nameMatch || descMatch || locMatch;
        });
        // Map with FULL data (offers in desc, pricing array, mealPreferences, etc.) for consistency with allTiffinServicesData
        const mapped = backendFiltered.map((tiffin: any) => {
          const foodTags: string[] = [];
          const offersText = tiffin.pricing?.map((p: any) => p.offers || "").join(" ") || "";
          const fullDesc = `${tiffin.description || ""} ${offersText}`.trim();
          tiffin.pricing?.forEach((p: any) => {
            const ft = p.foodType?.toLowerCase();
            if (ft === "veg") foodTags.push("veg");
            if (ft === "both veg & non-veg") {
              foodTags.push("veg");
              foodTags.push("non-veg");
            }
            if (ft === "non-veg") foodTags.push("non-veg");
          });
          const uniqueTags = [...new Set(foodTags)];
          const mealPreferences = tiffin.mealTimings?.map((m: any) => ({
            type: m.mealType,
            time: `${m.startTime} - ${m.endTime}`,
          })) || [];
          // Default image (any available, no filter applied here)
          const defaultImage = computeTiffinImage(tiffin, "off");
          const firstPrice = tiffin.pricing?.[0];
          const price = firstPrice ? `₹${firstPrice.monthlyDelivery || 0}` : "₹0";
          const lowestPrice = tiffin.lowestPricing?.toString() || "0";
          const mealTimings = tiffin.mealTimings || [];
          let overallStart = '-';
          let overallEnd = '-';
          if (mealTimings.length > 0) {
            overallStart = mealTimings[0].startTime || '-';
            overallEnd = mealTimings[mealTimings.length - 1].endTime || '-';
          }
          const overallTiming = `${overallStart} → ${overallEnd}`;
          return {
            id: tiffin._id,
            name: tiffin.tiffinName,
            description: fullDesc,
            location: tiffin.location?.fullAddress || "Unknown",
            price,
            tags: uniqueTags,
            rating: tiffin.averageRating || 0,
            reviews: tiffin.totalReviews || 0,
            image: defaultImage,
            vegPhotos: tiffin.vegPhotos || [],
            nonVegPhotos: tiffin.nonVegPhotos || [],
            pricing: tiffin.pricing || [],
            mealPreferences,
            overallTiming,
            foodType: tiffin.foodType || "",
            lowestPrice,
          };
        });
        return mapped;
      } else {
        // Backend empty / failed → fallback to client-side on allTiffinServicesData
        console.warn("Backend tiffin search empty or failed, falling back to client-side filter");
        return allData.filter((service) => {
          const lowerQuery = trimmedQuery;
          const nameMatch = service.name.toLowerCase().includes(lowerQuery);
          const descMatch = service.description.toLowerCase().includes(lowerQuery);
          const locMatch = service.location.toLowerCase().includes(lowerQuery);
          const tagsMatch = service.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
          return nameMatch || descMatch || locMatch || tagsMatch;
        });
      }
    } catch (err) {
      console.error("❌ Tiffin Search Error:", err);
      // Error → client fallback
      console.warn("Tiffin search network/error fallback to client-side");
      return allData.filter((service) => {
        const lowerQuery = trimmedQuery;
        const nameMatch = service.name.toLowerCase().includes(lowerQuery);
        const descMatch = service.description.toLowerCase().includes(lowerQuery);
        const locMatch = service.location.toLowerCase().includes(lowerQuery);
        const tagsMatch = service.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
        return nameMatch || descMatch || locMatch || tagsMatch;
      });
    } finally {
      setIsSearching(false);
    }
  };
  // --- Fetch cities ---
  const fetchCitiesQuery = async (): Promise<string[]> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getCitiesFromHostelServices",
        { headers }
      );
      const result = await response.json();
      console.log("getCitiesFromHostelServices response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("getCitiesFromHostelServices failed:", result.message || "No data returned");
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      return [];
    }
  };
  // --- Fetch hostel types ---
  const fetchHostelTypesQuery = async (): Promise<string[]> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelTypes",
        { headers }
      );
      const result = await response.json();
      console.log("getHostelTypes response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("getHostelTypes failed:", result.message || "No data returned");
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch hostel types:", error);
      return [];
    }
  };
  // --- Fetch room types ---
  const fetchRoomTypesQuery = async (): Promise<string[]> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRoomTypes",
        { headers }
      );
      const result = await response.json();
      console.log("getRoomTypes response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data)) {
        return result.data.map(String);
      } else {
        console.warn("getRoomTypes failed:", result.message || "No data returned");
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch room types:", error);
      return [];
    }
  };
  // --- Fetch plan types ---
  const fetchPlanTypesQuery = async (): Promise<string[]> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPlanTypes",
        { headers }
      );
      const result = await response.json();
      console.log("getPlanTypes response:", JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn("getPlanTypes failed:", result.message || "No data returned");
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch plan types:", error);
      return [];
    }
  };
  const fetchSuggestionsQuery = useCallback(async (): Promise<string[]> => {
    const token = await getAuthToken();
    if (!token) return [];
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    try {
      const url = isHostel
        ? "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelSuggestions"
        : "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinSuggestions";
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log(`${isHostel ? "getHostel" : "getTiffin"}Suggestions response:`, JSON.stringify(result, null, 2));
      if (result.success && result.data && Array.isArray(result.data)) {
        let suggs = (isHostel
          ? result.data.map((item: any) => String(item.hostelName || "Unknown Hostel"))
          : result.data.map((item: any) => String(item.tiffinName || "Unknown"))
        ).filter((s: string) => s.trim());
        // LIMIT: Slice to first 6 suggestions
        suggs = suggs.slice(0, 6);
        console.log("🔍 Limited Suggestions Count:", suggs.length); // Debug log
        return suggs;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Failed to fetch ${isHostel ? "hostel" : "tiffin"} suggestions:`, error);
      return [];
    }
  }, [isHostel]);
  // --- React Query Hooks (Updated for Hostels) ---
  const filtersKey = useMemo(() => JSON.stringify(appliedFilters), [appliedFilters]);
  const { data: allHostelsData = [], isLoading: isLoadingHostels, refetch: refetchHostels } = useQuery({
    queryKey: ['allHostels', filtersKey, isHostel],
    queryFn: () => fetchHostels(appliedFilters, ''),
    enabled: isHostel,
  });
  const { data: allTiffinServicesData = [], isLoading: isLoadingTiffins, refetch: refetchTiffins } = useQuery({
    queryKey: ['allTiffins', appliedFilters.cost || ""],
    queryFn: fetchTiffinServicesQuery,
  });
  const { data: citiesData = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCitiesQuery,
    enabled: isHostel,
  });
  const { data: hostelTypesData = [], isLoading: isLoadingHostelTypes } = useQuery({
    queryKey: ['hostelTypes'],
    queryFn: fetchHostelTypesQuery,
    enabled: isHostel,
  });
  const { data: roomTypesData = [], isLoading: isLoadingRoomTypes } = useQuery({
    queryKey: ['roomTypes'],
    queryFn: fetchRoomTypesQuery,
    enabled: isHostel,
  });
  const { data: planTypesData = [], isLoading: isLoadingPlanTypes } = useQuery({
    queryKey: ['planTypes'],
    queryFn: fetchPlanTypesQuery,
    enabled: isHostel,
  });
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ['suggestions', isHostel],
    queryFn: fetchSuggestionsQuery,
    enabled: isSearchFocused && !searchQuery.trim(),
  });
  // --- Fixed: Replace useQuery with manual getQueryData to avoid missing queryFn error and support debounced/manual setQueryData ---
  const normalizedSearchQuery = searchQuery.trim();
  const searchedHostelsData = queryClient.getQueryData<Hostel[]>(['searchedItems', 'hostels', normalizedSearchQuery]) || [];
  const searchedTiffinsData = queryClient.getQueryData<TiffinService[]>(['searchedItems', 'tiffins', normalizedSearchQuery]) || [];
  const hostelTypeOptions = useMemo(() => ["All", ...hostelTypesData], [hostelTypesData]);
  const areaOptions = useMemo(() => ["All", ...citiesData], [citiesData]);
  const maxRentOptions = ["All", "5000", "10000", "15000", "20000", "25000", "30000"];
  const hasFilters = useMemo(() => {
    return Object.keys(appliedFilters).length > 0;
  }, [appliedFilters]);
  const isVegFiltered = useMemo(() => vegFilter !== "off", [vegFilter]);
  const isFiltered = useMemo(() => hasFilters || isVegFiltered, [hasFilters, isVegFiltered]);
  // --- Refetch data when FilterModal opens if data is missing ---
  useEffect(() => {
    if (showFilterModal && isHostel) {
      if (citiesData.length === 0 && !isLoadingCities) refetchHostels();
      if (hostelTypesData.length === 0 && !isLoadingHostelTypes) refetchHostels();
      if (roomTypesData.length === 0 && !isLoadingRoomTypes) refetchHostels();
      if (planTypesData.length === 0 && !isLoadingPlanTypes) refetchHostels();
    }
  }, [showFilterModal, isHostel, citiesData.length, hostelTypesData.length, roomTypesData.length, planTypesData.length, isLoadingCities, isLoadingHostelTypes, isLoadingRoomTypes, isLoadingPlanTypes, refetchHostels]); // FIX: Use .length to avoid re-fetch on same array ref
  // --- Enhanced BackHandler with double-back-to-exit ---
  useFocusEffect(
    useCallback(() => {
      let backPressCount = 0;

      const onBackPress = () => {
        if (isSearchFocused) {
          handleSearchBack(); // Existing logic for search mode
          return true;
        }

        // Root-level double-back-to-exit (handles the stack issue)
        backPressCount += 1;

        if (backPressCount === 1) {
          // Toast.show({
          //   type: "info",
          //   text1: "Press back again to exit",
          //   visibilityTime: 2000,
          // });
        } else if (backPressCount === 2) {
          BackHandler.exitApp();
          return true;
        }

        // Reset count after 2 seconds
        setTimeout(() => {
          backPressCount = 0;
        }, 2000);

        return true; // Consume the press (prevents stack pop)
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [isSearchFocused, handleSearchBack]) // Dependencies
  );
  // --- Reset visible count on mode/filter/search changes ---
  useEffect(() => {
    setVisibleCount(10);
  }, [isHostel, appliedFilters, searchQuery, isSearchFocused, vegFilter]);
  useEffect(() => {
    if (isSearchFocused && searchQuery) {
      setSearchVisibleCount(10);
    }
  }, [isSearchFocused, searchQuery]);
  // Update refs for stable base data
  useEffect(() => {
    allHostelsRef.current = allHostelsData;
  }, [allHostelsData]);
  useEffect(() => {
    allTiffinsRef.current = allTiffinServicesData;
  }, [allTiffinServicesData]);
  // --- Unified Search Debounce Effect (Updated for Hostels: Invalidate instead of manual fetch) ---
  useEffect(() => {
    if (!isSearchFocused || !searchQuery.trim() || searchQuery.length < 2) {
      setIsSearching(false);
      return;
    }
    const trimmedQuery = searchQuery.trim();
    const fetchSearch = async () => {
      setIsSearching(true);
      const priceSort = appliedFilters.cost || "";
      const minRating = appliedFilters.rating || 0;
      let vegValue: string | undefined;
      if (vegFilter !== "off") {
        vegValue = "Veg";
      } else {
        vegValue = appliedFilters.vegNonVeg || undefined;
      }
      if (isHostel) {
        // Manual fetch and set for hostels to match tiffin logic
        const data = await fetchHostels(appliedFilters, trimmedQuery, allHostelsRef.current);
        const key = ["searchedItems", "hostels", trimmedQuery];
        queryClient.setQueryData(key, data);
      } else {
        const data = await fetchTiffinRecentSearch(trimmedQuery, priceSort, minRating, vegValue, allTiffinsRef.current);
        const key = ["searchedItems", "tiffins", trimmedQuery];
        queryClient.setQueryData(key, data);
      }
      setIsSearching(false);
    };
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(fetchSearch, 500);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [isHostel, isSearchFocused, searchQuery, appliedFilters.cost, appliedFilters.rating, appliedFilters.vegNonVeg, vegFilter]);
  // --- Location Modal ---
  useEffect(() => {
    if (!hasSelectedLocation) setShowLocationModal(true);
  }, [hasSelectedLocation]);
  // --- Veg Filter Animation ---
  useEffect(() => {
    Animated.timing(vegToggleAnimated, {
      toValue: vegFilter !== "off" ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // color & layout animations require JS driver
    }).start();
  }, [vegFilter]);
  // --- Fetch profile if not loaded ---
  useEffect(() => {
    if (!profileData) {
      fetchProfile();
    }
  }, [profileData, fetchProfile]);
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile(); // Refetch on focus to ensure fresh data
    }, [fetchProfile])
  );
  // --- Data mappings ---
  const tiffinServices = allTiffinServicesData;
  // --- Filtering logic (Tiffin updated to override image based on vegFilter) ---
  const filteredTiffinServices = useMemo(() => {
    console.log("🔍 Client Filtering Tiffins - Applied:", appliedFilters, "VegFilter:", vegFilter); // Debug
    const baseTiffins = isSearchFocused ? searchedTiffinsData : allTiffinServicesData;
    let filtered = [...baseTiffins];
    const query = searchQuery.toLowerCase().trim();
    if (query && !(isSearchFocused && searchQuery)) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query) ||
          service.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    // Veg filtering logic
    if (vegFilter !== "off") {
      if (vegFilter === "veg_only") {
        // Veg Only: pure veg
        filtered = filtered.filter((service) =>
          service.tags.includes("veg") && !service.tags.includes("non-veg")
        );
      } else {
        // veg_all: veg + both
        filtered = filtered.filter((service) =>
          service.tags.includes("veg")
        );
      }
    } else if (appliedFilters.vegNonVeg) {
      // Apply FilterModal veg filter
      if (appliedFilters.vegNonVeg === "Veg") {
        // Pure veg
        filtered = filtered.filter((service) =>
          service.tags.includes("veg") && !service.tags.includes("non-veg")
        );
      } else if (appliedFilters.vegNonVeg === "Non-Veg") {
        filtered = filtered.filter((service) =>
          service.tags.includes("non-veg") && !service.tags.includes("veg")
        );
      } else if (appliedFilters.vegNonVeg === "Both Veg & Non-Veg") {
        filtered = filtered.filter((service) =>
          service.tags.includes("veg") && service.tags.includes("non-veg")
        );
      }
    }
    // Rating filter
    const minRatingFilter = appliedFilters.rating || 0;
    if (minRatingFilter > 0) {
      filtered = filtered.filter((service) => service.rating >= minRatingFilter);
    }
    // FIXED: Price sort logic - Use exact match to avoid substring overlap (e.g., "high to low" contains "low")
    const priceSort = appliedFilters.cost || "";
    if (priceSort) {
      console.log("🔍 Applying client-side price sort:", priceSort); // Debug: Log to confirm trigger
      const getPriceNum = (service: TiffinService) => {
        // Prefer `lowestPrice` (backend's field) since backend sorts by this value.
        // Fallback to the displayed `price` string when `lowestPrice` is unavailable.
        const source = (service as any).lowestPrice || service.price || "";
        const num = String(source).replace(/[^0-9]/g, "");
        return parseInt(num, 10) || 0;
      };
      filtered.sort((a, b) => {
        const pa = getPriceNum(a);
        const pb = getPriceNum(b);
        const sortLower = priceSort.toLowerCase();
        if (sortLower === "low to high") {
          return pa - pb; // Ascending
        } else if (sortLower === "high to low") {
          return pb - pa; // Descending
        }
        return 0;
      });
    }
    if (appliedFilters.offers) {
      filtered = filtered.filter((service) =>
        service.description.toLowerCase().includes(appliedFilters.offers.toLowerCase())
      );
    }
    if (appliedFilters.cashback) {
      filtered = filtered.filter((service) =>
        service.description.toLowerCase().includes(appliedFilters.cashback.toLowerCase())
      );
    }
    if (appliedFilters.cuisine) {
      filtered = filtered.filter((service) =>
        service.description.toLowerCase().includes(appliedFilters.cuisine.toLowerCase())
      );
    }
    // Override images based on current vegFilter
    filtered = filtered.map((service) => ({
      ...service,
      image: computeTiffinImage(service, vegFilter),
    }));
    console.log("🔍 Filtered Tiffins Count:", filtered.length); // Debug
    return filtered;
  }, [allTiffinServicesData, searchedTiffinsData, searchQuery, isSearchFocused, appliedFilters, vegFilter, computeTiffinImage]);
  const filteredHostels = useMemo(() => {
    const baseHostels = isSearchFocused ? searchedHostelsData : allHostelsData;
    let filtered = [...baseHostels];
    // Optional: Light client filter for search if backend partial-match is weak
    if (searchQuery.trim() && !isSearchFocused) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((h) =>
        h.name.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query)
      );
    }
    // Backend handles all other filters: hostelType, priceRange, amenities, userReviews, location, distance, planType, roomType, acNonAc
    // Legacy client-side (remove if not needed):
    if (hostelType && hostelType !== "All") {
      filtered = filtered.filter((h) => h.type === hostelType);
    }
    if (area && area !== "All") {
      filtered = filtered.filter((h) => h.location.toLowerCase().includes(area.toLowerCase()));
    }
    if (maxRent && maxRent !== "All") {
      const max = parseInt(maxRent);
      filtered = filtered.filter((h) => parseInt(h.price.replace(/[^0-9]/g, "")) <= max);
    }
    return filtered;
  }, [allHostelsData, searchedHostelsData, searchQuery, isSearchFocused, hostelType, area, maxRent]);
  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;
  const visibleItems = useMemo(() => displayedItems.slice(0, visibleCount), [displayedItems, visibleCount]);
  const searchVisibleItems = useMemo(() => {
    if (isHostel) {
      return searchedHostelsData.slice(0, searchVisibleCount);
    } else {
      // For search, override images here too if vegFilter active
      return filteredTiffinServices.slice(0, searchVisibleCount);
    }
  }, [isHostel, searchedHostelsData, filteredTiffinServices, searchVisibleCount]);
  const handleLoadMore = useCallback(() => {
    const increment = 10;
    if (visibleCount < displayedItems.length) {
      setVisibleCount(prev => Math.min(prev + increment, displayedItems.length));
    }
  }, [visibleCount, displayedItems.length]);
  const handleLoadMoreSearch = useCallback(() => {
    const increment = 10;
    const currentData = isHostel ? searchedHostelsData : filteredTiffinServices;
    if (searchVisibleCount < currentData.length) {
      setSearchVisibleCount(prev => Math.min(prev + increment, currentData.length));
    }
  }, [searchVisibleCount, isHostel, searchedHostelsData, filteredTiffinServices]);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isHostel) {
        await refetchHostels();
        const priceSort = appliedFilters.cost || "";
        const minRating = appliedFilters.rating || 0;
        let vegValue: string | undefined;
        if (vegFilter !== "off") {
          vegValue = "Veg";
        } else {
          vegValue = appliedFilters.vegNonVeg || undefined;
        }
        if (isSearchFocused && searchQuery.trim()) {
          const trimmed = searchQuery.trim();
          const data = await fetchHostels(appliedFilters, trimmed, allHostelsRef.current);
          const key = ["searchedItems", "hostels", trimmed];
          queryClient.setQueryData(key, data);
        }
      } else {
        await refetchTiffins();
        const priceSort = appliedFilters.cost || "";
        const minRating = appliedFilters.rating || 0;
        let vegValue: string | undefined;
        if (vegFilter !== "off") {
          vegValue = "Veg";
        } else {
          vegValue = appliedFilters.vegNonVeg || undefined;
        }
        if (isSearchFocused && searchQuery.trim()) {
          const trimmed = searchQuery.trim();
          const data = await fetchTiffinRecentSearch(trimmed, priceSort, minRating, vegValue, allTiffinsRef.current);
          const key = ["searchedItems", "tiffins", trimmed];
          queryClient.setQueryData(key, data);
        }
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Error", "Failed to refresh data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [isHostel, isSearchFocused, searchQuery, appliedFilters.cost, appliedFilters.rating, appliedFilters.vegNonVeg, vegFilter, refetchHostels, refetchTiffins]);
  // --- Handlers --- (unchanged)
  const handleLocationSelected = async (location: any) => {
    setShowLocationModal(false);
    if (location.coords) {
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUserLocation(
          address
            ? `${address.street || ""} ${address.city || ""} ${address.region || ""}`.trim()
            : "Current Location"
        );
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        setUserLocation("Current Location");
        Alert.alert("Error", "Failed to retrieve location details. Using default location.");
      }
    } else if (typeof location === "string") {
      setUserLocation(location);
    } else if (location.type === "home") {
      setUserLocation("Home Location");
    } else if (location.type === "work") {
      setUserLocation("Work Location");
    }
    setHasSelectedLocation(true);
  };
  const handleLocationModalClose = () => {
    setShowLocationModal(false);
    if (!hasSelectedLocation) setHasSelectedLocation(true);
  };
  // Navigate to tiffin details with ID via params
  const handleTiffinPress = (service: TiffinService) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push({
      pathname: "/tiffin-details/[id]",
      params: { id: service.id, type: "tiffin", fullServiceData: JSON.stringify(service) },
    });
    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };
  // Navigate to hostel details
  const handleHostelPress = (hostel: Hostel) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push({
      pathname: "/hostel-details/[id]", // match folder + dynamic file
      params: { id: hostel.id, type: "hostel", fullServiceData: JSON.stringify(hostel) },
    });
    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };
  const handleBookPress = (item: Hostel | TiffinService) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if ("amenities" in item) {
      router.push({
        pathname: "/hostel-details/[id]",
        params: { id: item.id, type: "hostel" },
      });
    } else {
      // For tiffin, navigate to details (or handle booking logic)
      router.push({
        pathname: "/tiffin-details/[id]",
        params: {
          id: item.id,
          type: "tiffin",
          fullServiceData: JSON.stringify(item)
        },
      });
    }
    setTimeout(() => { isNavigatingRef.current = false; }, 500);
  };
  const handleClearSearch = () => setSearchQuery("");
  const handleProfilePress = () => router.push("/account");
  const handleSearchBack = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };
  const handleApplyFilters = (filters: Filters) => {
    setAppliedFilters(filters);
  };
  const handleVegFilterApply = (filter: "all" | "veg") => {
    setVegFilter(filter === "all" ? "veg_all" : "veg_only");
    setShowVegFilterModal(false);
  };
  const handleHostelTypeSelect = (value: string) => setHostelType(value === "All" ? "" : value);
  const handleAreaSelect = (value: string) => setArea(value === "All" ? "" : value);
  const handleMaxRentSelect = (value: string) => setMaxRent(value === "All" ? "" : value);
  const renderTiffinItem = ({ item }: { item: TiffinService }) => (
    <TiffinCard
      service={item}
      onPress={() => handleTiffinPress(item)}
      onBookPress={() => handleBookPress(item)}
      onFavoritePress={() => {
        console.log("Tiffin heart icon clicked in dashboard for ID:", item.id);
        handleFavoriteToggle(item);
      }}
    />
  );
  const renderHostelItem = ({ item }: { item: Hostel }) => (
    <HostelCard
      hostel={item}
      onPress={() => handleHostelPress(item)}
      onBookPress={() => handleBookPress(item)}
      onFavoritePress={() => {
        console.log("Hostel heart icon clicked in dashboard for ID:", item.id);
        handleFavoriteToggle(item);
      }}
    />
  );
  const keyExtractor = (item: Hostel | TiffinService) => (item.id || Math.random().toString()).toString();
  // New handlers for help modal (Chat only)
  const handleOpenHelp = () => {
    setSelectedMessage(""); // Reset
    setShowHelpModal(true);
  };
  const handleCloseHelp = () => {
    setShowHelpModal(false);
    setSelectedMessage(""); // Reset on close
  };
  // Injected JS to send pre-selected message if any (only for chat)
  const injectedJavaScript = useMemo(() => {
    if (!selectedMessage) {
      return '';
    }
    return `
      (function() {
        if (typeof Tawk_API !== 'undefined') {
          Tawk_API.onLoad = function() {
            Tawk_API.visitor.sendMessage('${selectedMessage}');
            // Optional: Set visitor attributes
            Tawk_API.setAttributes({
              name: '${user?.name || 'User'}',
              email: '${user?.email || ''}',
              location: '${userLocation || ''}'
            });
          };
        }
      })();
      true;
    `;
  }, [selectedMessage, user, userLocation]);
  // --- Search Focused View (FIX: Ensure <Text> wrappers; stringify suggestions; LIMIT MAP TO 6) ---
  if (isSearchFocused) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.searchFocusedHeader}>
            <TouchableOpacity style={styles.searchBackButton} onPress={handleSearchBack}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.searchFocusedInputContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                ref={searchInputRef}
                placeholder={isHostel ? "Search for hostel..." : "Tiffin Service"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchFocusedInput}
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>{searchQuery ? "Search Results" : "Popular Searches"}</Text>
          {searchQuery ? (
            isSearching ? (
              <View style={styles.noResultsContainer}>
                <ActivityIndicator size="large" color="#6B7280" />
                <Text style={styles.noResultsSubtext}>Searching for "{searchQuery}"...</Text>
              </View>
            ) : isHostel ? (
              searchedHostelsData.length > 0 ? (
                <FlatList
                  data={searchVisibleItems}
                  renderItem={renderHostelItem}
                  keyExtractor={keyExtractor}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  onEndReached={handleLoadMoreSearch}
                  onEndReachedThreshold={0.5}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={50} color="#9CA3AF" />
                  <Text style={styles.noResultsText}>
                    {`No hostels found matching "${searchQuery}"`}
                  </Text>
                  <Text style={styles.noResultsSubtext}>Try searching with different keywords like "AC" or "Near College"</Text>
                </View>
              )
            ) : searchedTiffinsData.length > 0 ? (
              <FlatList
                data={searchVisibleItems}
                renderItem={renderTiffinItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                onEndReached={handleLoadMoreSearch}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={50} color="#9CA3AF" />
                <Text style={styles.noResultsText}>
                  {`No services found matching "${searchQuery}"`}
                </Text>
                <Text style={styles.noResultsSubtext}>Try searching with different keywords like "Veg" or "Maharashtrian"</Text>
              </View>
            )
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.suggestionTags}>
                {isHostel ? (
                  suggestionsData.length > 0 ? (
                    suggestionsData.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => setSearchQuery(suggestion)}
                        accessibilityRole="button"
                        accessibilityLabel={`Search for ${suggestion}`}
                      >
                        {/* FIX: Explicit <Text> with string */}
                        <Text style={styles.suggestionTagText}>{String(suggestion)}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("WiFi")} accessibilityRole="button" accessibilityLabel="Search for WiFi">
                        <Text style={styles.suggestionTagText}>WiFi</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("AC")} accessibilityRole="button" accessibilityLabel="Search for AC">
                        <Text style={styles.suggestionTagText}>AC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Near College")} accessibilityRole="button" accessibilityLabel="Search for Near College">
                        <Text style={styles.suggestionTagText}>Near College</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Parking")} accessibilityRole="button" accessibilityLabel="Search for Parking">
                        <Text style={styles.suggestionTagText}>Parking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Mess")} accessibilityRole="button" accessibilityLabel="Search for Mess">
                        <Text style={styles.suggestionTagText}>Mess</Text>
                      </TouchableOpacity>
                    </>
                  )
                ) : (
                  suggestionsData.length > 0 ? (
                    suggestionsData.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => setSearchQuery(suggestion)}
                        accessibilityRole="button"
                        accessibilityLabel={`Search for ${suggestion}`}
                      >
                        {/* FIX: Explicit <Text> with string */}
                        <Text style={styles.suggestionTagText}>{String(suggestion)}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Veg")} accessibilityRole="button" accessibilityLabel="Search for Veg">
                        <Text style={styles.suggestionTagText}>Veg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Maharashtrian")} accessibilityRole="button" accessibilityLabel="Search for Maharashtrian">
                        <Text style={styles.suggestionTagText}>Maharashtrian</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Healthy")} accessibilityRole="button" accessibilityLabel="Search for Healthy">
                        <Text style={styles.suggestionTagText}>Healthy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Home Style")} accessibilityRole="button" accessibilityLabel="Search for Home Style">
                        <Text style={styles.suggestionTagText}>Home Style</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Budget")} accessibilityRole="button" accessibilityLabel="Search for Budget">
                        <Text style={styles.suggestionTagText}>Budget</Text>
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>
            </View>
          )}
        </View>
        {/* Help FAB - Positioned absolutely to overlay */}
        <TouchableOpacity style={styles.chatFab} onPress={handleOpenHelp}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
        </TouchableOpacity>
        {/* Help Modal (Chat only) */}
        <Modal visible={showHelpModal} animationType="slide" presentationStyle="fullScreen">
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseHelp} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Apollo AI Assistant</Text>
            </View>
            <WebView
              source={{ uri: chatUrl }}
              style={styles.webview}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              injectedJavaScript={injectedJavaScript}
              renderLoading={() => <ActivityIndicator size="large" color="#6B7280" style={styles.loadingIndicator} />}
            />
          </SafeAreaView>
        </Modal>
      </View>
    );
  }
  // --- Normal Dashboard View --- (FIX: Ensure banner text is wrapped)
  // Added profileSource computation for fallback image handling
  const profileSource = profileData?.profileImage ? { uri: profileData.profileImage } : fallbackDp;
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationButton} onPress={() => setShowLocationModal(true)} accessibilityRole="button" accessibilityLabel="Change location">
              <Ionicons name="home" size={20} color="#000" />
              <Text style={styles.locationText}>Home Location</Text>
              <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.locationSubtext}>{userLocation || "Unknown Location"}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push("/(secure)/Cartscreen")}
              accessibilityRole="button"
              accessibilityLabel="View cart"
            >
              <Ionicons name="cart-outline" size={29} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress} accessibilityRole="button" accessibilityLabel="View profile">
              <Image
                source={profileSource} // Updated to use conditional source with local fallback
                style={styles.profileImage}
              />
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
      <FlatList
        data={visibleItems}
        renderItem={isHostel ? renderHostelItem : renderTiffinItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  ref={searchInputRef}
                  placeholder={isHostel ? "Search for hostel..." : "Search for tiffin services..."}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  style={styles.searchInput}
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Search input"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.micButton}>
                  <Ionicons name="mic" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: hasFilters ? colors.primary : "#F2EFFD" }]}
                onPress={() => setShowFilterModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Open filters"
              >
                <Ionicons name="options" size={22} color={hasFilters ? "white" : "#2563EB"} />
              </TouchableOpacity>
            </View>
            {!searchQuery && (
              <View style={styles.banner}>
                <Image source={isHostel ? hostel1 : food1} style={styles.bannerImage} resizeMode="cover" />
                <View style={styles.bannerContent}>
                  {isHostel ? (
                    <>
                      {/* FIX: Explicit <Text> for multiline */}
                      <Text style={styles.bannerTitle}>Premium{'\n'}Hostels</Text>
                      <Text style={styles.bannerSubtitle}>Find your perfect home{'\n'}away from home</Text>
                      <Text style={styles.bannerLink}>Safe & Secure Living</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.bannerTitle}>Indian{'\n'}Cuisine</Text>
                      <Text style={styles.bannerSubtitle}>Enjoy pure taste of your{'\n'}home-made delights</Text>
                      <Text style={styles.bannerLink}>www.website.com</Text>
                    </>
                  )}
                </View>
              </View>
            )}
            <View style={styles.serviceSection}>
              <Text style={styles.sectionTitle}>What are you looking for?</Text>
              <View style={styles.serviceButtons}>
                <TouchableOpacity
                  style={[styles.serviceButton, !isHostel && styles.serviceButtonSelected]}
                  onPress={() => {
                    setIsHostel(false);
                    setSearchQuery("");
                    setAppliedFilters({});
                    setHostelType("");
                    setArea("");
                    setMaxRent("");
                    setVegFilter("off");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to Tiffin/Restaurants"
                >
                 <Ionicons
    name="restaurant-sharp"  // Ye icon tiffin/restaurant ke liye best hai
    size={24}  // Size same rakho jaise image tha (styles.image mein width/height 24 tha)
    color={!isHostel ? "#fff" : "#004AAD"}  // Tint color same rakho
  />
                  <Text style={[styles.serviceButtonText, !isHostel && styles.serviceButtonTextSelected]}>
                    Tiffin/Restaurants
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.serviceButton, isHostel && styles.serviceButtonSelected]}
                  onPress={() => {
                    setIsHostel(true);
                    setSearchQuery("");
                    setAppliedFilters({});
                    setHostelType("");
                    setArea("");
                    setMaxRent("");
                    setVegFilter("off");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to PG/Hostels"
                >
                  <Image
                    source={hostellogo}
                    style={styles.image}
                    tintColor={isHostel ? "#fff" : "#004AAD"}
                  />
                  <Text style={[styles.serviceButtonText, isHostel && styles.serviceButtonTextSelected]}>
                    PG/Hostels
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {isHostel && !hasFilters && !isVegFiltered && (
              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Hostel Type</Text>
                    {isLoadingHostelTypes ? (
                      <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                      <Dropdown
                        options={hostelTypeOptions}
                        value={hostelType || "All"}
                        onSelect={handleHostelTypeSelect}
                        placeholder="All"
                      />
                    )}
                  </View>
                  {/* <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Area</Text>
                    {isLoadingCities ? (
                      <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                      <Dropdown
                        options={areaOptions}
                        value={area || "All"}
                        onSelect={handleAreaSelect}
                        placeholder="All"
                      />
                    )}
                  </View> */}
                  {/* <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Max Rent (₹)</Text>
                    <Dropdown
                      options={maxRentOptions}
                      value={maxRent || "All"}
                      onSelect={handleMaxRentSelect}
                      placeholder="All"
                    />
                  </View> */}
                </View>
              </View>
            )}
            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isFiltered
                    ? "Available Results"
                    : searchQuery
                      ? "Search Results"
                      : isHostel
                        ? "Available Accommodations"
                        : "Available Results"}
                </Text>
                {!isHostel && (
                  <TouchableOpacity
                    style={styles.vegToggleButton}
                    onPress={() => {
                      if (vegFilter === "off") {
                        setShowVegFilterModal(true);
                      } else {
                        setVegFilter("off");
                      }
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={vegFilter === "off" ? "Enable veg filter" : "Disable veg filter"}
                  >
                    <View style={styles.vegLabelContainer}>
                      <Text style={styles.vegLabelText}>VEG</Text>
                    </View>
                    <Animated.View style={styles.vegToggleTrack}>
                      <Animated.View
                        style={[
                          styles.vegToggleThumb,
                          {
                            borderRadius: vegFilter === "off" ? 2 : 11,
                            backgroundColor: vegFilter === "off" ? "transparent" : "green",
                            borderWidth: vegFilter === "off" ? 1.5 : 0,
                            borderColor: vegFilter === "off" ? "green" : "transparent",
                          },
                          {
                            transform: [
                              {
                                translateX: vegToggleAnimated.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 18],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        {vegFilter === "off" ? (
                          <View style={styles.greenDot} />
                        ) : (
                          <Animated.View
                            style={[
                              styles.leafContainer,
                              {
                                opacity: vegToggleAnimated,
                                transform: [
                                  {
                                    scale: vegToggleAnimated.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                                  }
                                ],
                              },
                            ]}
                          >
                            <Ionicons name="leaf" size={10} color="#FFFFFF" />
                          </Animated.View>
                        )}
                      </Animated.View>
                    </Animated.View>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.servicesCount}>
                {isHostel
                  ? hasFilters
                    ? `${filteredHostels.length} Available results`
                    : searchQuery
                      ? `${filteredHostels.length} results found`
                      : `${filteredHostels.length} properties found in ${userLocation || "Unknown Location"}`
                  : isFiltered
                    ? `${filteredTiffinServices.length} Available results`
                    : searchQuery || isVegFiltered
                      ? `${filteredTiffinServices.length} results found`
                      : `${tiffinServices.length} services found in ${userLocation || "Unknown Location"}`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isHostel && (isLoadingHostels || isLoadingCities || isLoadingHostelTypes || isLoadingRoomTypes || isLoadingPlanTypes) ? (
            <View style={styles.noResultsContainer}>
              <ActivityIndicator size="large" color="#6B7280" />
              <Text style={styles.noResultsSubtext}>
                {isLoadingCities
                  ? "Loading cities..."
                  : isLoadingHostelTypes
                    ? "Loading hostel types..."
                    : isLoadingRoomTypes
                      ? "Loading room types..."
                      : isLoadingPlanTypes
                        ? "Loading plan types..."
                        : "Loading hostels..."}
              </Text>
            </View>
          ) : !isHostel && isLoadingTiffins ? (
            <View style={styles.noResultsContainer}>
              <ActivityIndicator size="large" color="#6B7280" />
              <Text style={styles.noResultsSubtext}>Loading tiffins...</Text>
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={50} color="#9CA3AF" />
              <Text style={styles.noResultsText}>
                {isHostel ? "No hostels found" : "No tiffin services found"}
              </Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your filters or search</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for FAB
      />
      {/* Help FAB - Positioned absolutely to overlay */}
      <TouchableOpacity style={styles.chatFab} onPress={handleOpenHelp}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
      </TouchableOpacity>
      {/* Help Modal (Chat only) */}
      <Modal visible={showHelpModal} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseHelp} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Apollo AI Assistant</Text>
          </View>
          <WebView
            source={{ uri: chatUrl }}
            style={styles.webview}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            injectedJavaScript={injectedJavaScript}
            renderLoading={() => <ActivityIndicator size="large" color="#6B7280" style={styles.loadingIndicator} />}
          />
        </SafeAreaView>
      </Modal>
      <LocationModal
        visible={showLocationModal}
        onClose={handleLocationModalClose}
        onLocationSelected={handleLocationSelected}
      />
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        isHostel={isHostel}
        currentFilters={appliedFilters}
        cities={citiesData}
        isLoadingCities={isLoadingCities}
        hostelTypes={hostelTypesData}
        isLoadingHostelTypes={isLoadingHostelTypes}
        roomTypes={roomTypesData}
        isLoadingRoomTypes={isLoadingRoomTypes}
        planTypes={planTypesData}
        isLoadingPlanTypes={isLoadingPlanTypes}
      />
      <VegFilterModal
        visible={showVegFilterModal}
        onClose={() => setShowVegFilterModal(false)}
        currentFilter={vegFilter === "off" || vegFilter === "veg_all" ? "all" : "veg"}
        onApply={handleVegFilterApply}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  safeArea: {
    backgroundColor: "#fff",
  },
  header: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },
  cartButton: {
    marginLeft: 12,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flex: 1,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2EFFD",
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1F2937",
    paddingTop: 0,        // Add these
    paddingBottom: 0,     // Add these
    textAlignVertical: "center", // Android-specific
    includeFontPadding: false,
  },
  micButton: {
    marginLeft: 8,
  },
  filterButton: {
    borderRadius: 8,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchResultsContainer: {
    paddingTop: 20,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  banner: {
    marginTop: 20,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  bannerContent: {
    padding: 20,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.white,
    marginTop: 4,
  },
  bannerLink: {
    fontSize: 12,
    color: colors.white,
    marginTop: 8,
  },
  serviceSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  serviceButtons: {
    flexDirection: "row",
    gap: 12,
  },
  serviceButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serviceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  serviceButtonTextSelected: {
    color: colors.white,
  },
  filterSection: {
    marginTop: 20,
    zIndex: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 10,
    width: '100%'
  },
  filterItem: {
    flex: 1,
    zIndex: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 9,
    zIndex: 1,
    marginLeft: 5
  },
  servicesSection: {
    marginTop: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vegToggleButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
    height: 56, // smaller height
    width: 55, // smaller width
  },
  vegLabelContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  vegLabelText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#374151",
  },
  vegToggleTrack: {
    width: 30,
    height: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    backgroundColor: "transparent",
    position: "relative",
    paddingHorizontal: 2,
  },
  vegToggleThumb: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    top: 0,
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "green",
  },
  leafContainer: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  servicesCount: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  suggestionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  suggestionTagText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "500",
  },
  searchFocusedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  searchFocusedInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2EFFD",
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    borderColor: "#6B7EF5",
    paddingHorizontal: 16,
  },
  searchFocusedInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1F2937",
  },
  recentSearchesContainer: {
    marginTop: 20,
  },
  image: {
    width: 24,
    height: 24,
  },
  // New styles for help FAB and modal
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalClose: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
});