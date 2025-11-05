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
  Alert,
  ActivityIndicator,
  RefreshControl,
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
import { hostellogo, tiffinlogo } from "@/assets/images";
import food1 from "@/assets/images/food1.png";
import hostel1 from "@/assets/images/image/hostelBanner.png";
import { BackHandler } from 'react-native';
interface Hostel {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  amenities: string[];
  rating: number;
  image: any;
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
  image: any;
  pricing: any[];
  foodType: string;
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
  const {
    isFilterApplied,
    setIsFilterApplied,
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
  } = useAuthStore();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);
  const [showVegFilterModal, setShowVegFilterModal] = useState(false);
  const [vegFilter, setVegFilter] = useState<"off" | "veg">("off");
  const [hostelType, setHostelType] = useState("");
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [allHostels, setAllHostels] = useState<Hostel[]>([]);
  const [allTiffinServices, setAllTiffinServices] = useState<TiffinService[]>([]);
  const [searchedHostels, setSearchedHostels] = useState<Hostel[]>([]);
  const [searchedTiffins, setSearchedTiffins] = useState<TiffinService[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHostels, setIsLoadingHostels] = useState(false);
  const [isLoadingTiffins, setIsLoadingTiffins] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [hostelTypes, setHostelTypes] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [planTypes, setPlanTypes] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingHostelTypes, setIsLoadingHostelTypes] = useState(false);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(false);
  const [isLoadingPlanTypes, setIsLoadingPlanTypes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchVisibleCount, setSearchVisibleCount] = useState(10);
  const hostelTypeOptions = useMemo(() => ["All", ...hostelTypes], [hostelTypes]);
  const areaOptions = useMemo(() => ["All", ...cities], [cities]);
  const maxRentOptions = ["All", "5000", "10000", "15000", "20000", "25000", "30000"];
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const vegToggleAnimated = useRef(new Animated.Value(vegFilter !== "off" ? 1 : 0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const imageMapping: { [key: string]: any } = {
    food1,
    hostel1,
  };
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
        Alert.alert("Success", "Added successfully");
      } else if (result.message.includes("removed")) {
        // Remove from frontend
        console.log("Removing from favorites via API toggle");
        removeFromFavorites(id, type);
        Alert.alert("Success", "Removed successfully from favourites");
      } else {
        // Unexpected message, but success, perhaps log
        console.log("Unexpected success message:", result.message);
        Alert.alert("Success", "Favorites updated");
      }
    } else {
      console.log("API toggle failed:", result.message);
      Alert.alert("Error", "Failed to update favorites. Please try again.");
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);
  // --- Fetch all hostels ---
  const fetchAllHostels = async () => {
    setIsLoadingHostels(true);
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const response = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getAllHostelsServices",
        { headers }
      );
      const result = await response.json();
      console.log("getAllHostelServices response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        const mappedHostels = result.data.map((hostel: any) => ({
          id: hostel.hostelId || `hostel-${Math.random().toString(36).substr(2, 9)}`,
          name: hostel.hostelName || "Unknown Hostel",
          type: hostel.hostelType || "Unknown",
          location: hostel.fullAddress || "Unknown Location",
          price: `₹${hostel.pricing?.monthly || 0}/MONTH`,
          amenities: hostel.facilities || [],
          rating: hostel.rating || 0,
          image: imageMapping["hostel1"],
          planType: hostel.planType || "",
          roomType: hostel.roomType || "",
          acNonAc: hostel.acNonAc || "",
        }));
        setAllHostels(mappedHostels);
        await AsyncStorage.setItem("cachedHostels", JSON.stringify(mappedHostels));
      } else {
        console.warn("getAllHostelServices failed:", result.message);
        const cachedHostels = await AsyncStorage.getItem("cachedHostels");
        if (cachedHostels) {
          setAllHostels(JSON.parse(cachedHostels));
        } else {
          setAllHostels([]);
          Alert.alert("No Hostels Found", result.message || "No hostels available at the moment.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
      const cachedHostels = await AsyncStorage.getItem("cachedHostels");
      if (cachedHostels) {
        setAllHostels(JSON.parse(cachedHostels));
      } else {
        setAllHostels([]);
        Alert.alert("Error", "Failed to fetch hostels. Please check your connection and try again.");
      }
    } finally {
      setIsLoadingHostels(false);
    }
  };
  // --- Fetch tiffin services (FIX: Always append foodType if present) ---
  const fetchTiffinServices = async (search = "", priceSort = "", minRating = 0, foodType?: string) => {
    setIsLoadingTiffins(true);
    const token = await getAuthToken();
    if (!token) {
      setIsLoadingTiffins(false);
      return;
    }
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const params = new URLSearchParams({
      search,
      priceSort,
    });
    if (minRating > 0) {
      params.append("rating", `${minRating} & above`);
    }
    // FIX: Always append foodType if present (consistent with search; backend handles "Both")
    if (foodType) {
      params.append("foodType", foodType);
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
          const image = tiffin.photos?.[0] ? { uri: tiffin.photos[0] } : food1;
          const firstPrice = tiffin.pricing[0];
          const price = firstPrice ? `₹${firstPrice.monthlyDelivery || 0}` : "₹0";
          const mealPreferences = tiffin.mealTimings?.map((m: any) => ({
            type: m.mealType,
            time: `${m.startTime} - ${m.endTime}`,
          })) || [];
          return {
            id: tiffin._id,
            name: tiffin.tiffinName,
            description: fullDesc,
            location: tiffin.location.fullAddress,
            price,
            tags: uniqueTags,
            rating: tiffin.averageRating,
            image,
            pricing: tiffin.pricing,
            mealPreferences,
            foodType: tiffin.foodType,
          };
        });
        setAllTiffinServices(mapped);
        await AsyncStorage.setItem("cachedTiffins", JSON.stringify(mapped));
      } else {
        const cached = await AsyncStorage.getItem("cachedTiffins");
        if (cached) {
          setAllTiffinServices(JSON.parse(cached));
        } else {
          setAllTiffinServices([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tiffins:", error);
      const cached = await AsyncStorage.getItem("cachedTiffins");
      if (cached) {
        setAllTiffinServices(JSON.parse(cached));
      } else {
        setAllTiffinServices([]);
      }
    } finally {
      setIsLoadingTiffins(false);
    }
  };
  // --- Fetch tiffin recent search (enhanced with filters) ---
  const fetchTiffinRecentSearch = async (
    query: string,
    priceSort = "",
    minRating = 0,
    foodTypeParam?: string
  ) => {
    if (!query.trim()) {
      setSearchedTiffins([]);
      return;
    }
    const token = await getAuthToken();
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const params = new URLSearchParams({
      search: query.trim(), // 🔥 Already correct: using 'search' param
      ...(priceSort && { priceSort }),
      ...(minRating > 0 && { rating: `${minRating} & above` }),
    });
    if (foodTypeParam) {
      params.append("foodType", foodTypeParam);
    }
    const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAllTiffinServices?${params.toString()}`;
    console.log("🔍 Tiffin Search URL:", url);
    setIsSearching(true);
    try {
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log("getAllTiffinServices search response:", JSON.stringify(result, null, 2));
      const data = result.data || [];
      if (result.success && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((tiffin: any) => {
          const tags: string[] = [];
          tiffin.pricing?.forEach((p: any) => {
            const ft = p.foodType?.toLowerCase();
            if (ft?.includes("veg")) tags.push("veg");
            if (ft?.includes("non-veg")) tags.push("non-veg");
          });
          return {
            id: tiffin._id,
            name: tiffin.tiffinName,
            description: `${tiffin.description || ""}`,
            location: tiffin.location?.fullAddress || "Unknown",
            price: `₹${tiffin.pricing?.[0]?.monthlyDelivery || 0}`,
            tags: [...new Set(tags)],
            rating: tiffin.averageRating || 0,
            image: tiffin.photos?.[0]
              ? { uri: tiffin.photos[0] }
              : food1,
          };
        });
        setSearchedTiffins(mapped);
      } else {
        setSearchedTiffins([]);
      }
    } catch (err) {
      console.error("❌ Tiffin Search Error:", err);
      setSearchedTiffins([]);
    } finally {
      setIsSearching(false);
    }
  };
  // --- Fetch hostel search (FIX: Use 'search' param; add fallback filtering on allHostels if backend fails; fix encoding) ---
  const fetchHostelSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchedHostels([]);
      return;
    }
    setIsSearching(true);
    const trimmedQuery = query.trim().toLowerCase(); // FIX: Normalize query
    const token = await getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // 🔥 FIX: Single encode; log decoded for debug
    const encodedSearch = encodeURIComponent(query.trim());
    const params = new URLSearchParams({
      search: encodedSearch,
    });
    // Wire in filters if applied
    if (appliedFilters.hostelType) params.append("hostelType", appliedFilters.hostelType);
    if (appliedFilters.roomType) params.append("roomType", appliedFilters.roomType);
    if (appliedFilters.acNonAc) params.append("acNonAc", appliedFilters.acNonAc);
    if (appliedFilters.planType) params.append("planType", appliedFilters.planType);
    if (appliedFilters.priceRange) {
      params.append("priceRangeMin", appliedFilters.priceRange[0].toString());
      params.append("priceRangeMax", appliedFilters.priceRange[1].toString());
    }
    if (appliedFilters.location) params.append("location", appliedFilters.location);
    if (appliedFilters.rating) params.append("rating", appliedFilters.rating.toString());
    const url = `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getAllHostelsServices?${params.toString()}`;
    console.log("🔍 Hostel Search URL:", url);
    console.log("🔍 Decoded Query for Debug:", decodeURIComponent(encodedSearch)); // FIX: Debug log
    try {
      const response = await fetch(url, { headers });
      const result = await response.json();
      console.log(
        "getHostelsByRecentSearch response:",
        JSON.stringify(result, null, 2)
      );
      if (result.success && result.data && Array.isArray(result.data)) {
        // Client-side filter as backup (case-insensitive partial match)
        const filtered = result.data.filter((hostel: any) =>
          (hostel.hostelName || "").toLowerCase().includes(trimmedQuery)
        );
        const mappedHostels = filtered.map((hostel: any) => ({
          id: hostel.hostelId || `hostel-${Math.random().toString(36).substr(2, 9)}`,
          name: hostel.hostelName || "Unknown Hostel",
          type: hostel.hostelType || "Unknown",
          location: hostel.fullAddress || "Unknown Location",
          price: `₹${hostel.pricing?.monthly || 0}/MONTH`,
          amenities: hostel.facilities || [],
          rating: hostel.rating || 0,
          image: imageMapping["hostel1"],
          planType: hostel.planType || "",
          roomType: hostel.roomType || "",
          acNonAc: hostel.acNonAc || "",
        }));
        setSearchedHostels(mappedHostels);
      } else {
        // FIX: Backend failed? Fallback to client-side filter on allHostels
        console.warn("Backend search failed, falling back to client-side filter:", result.message);
        const clientFiltered = allHostels.filter((hostel) =>
          hostel.name.toLowerCase().includes(trimmedQuery)
        );
        setSearchedHostels(clientFiltered);
        if (clientFiltered.length === 0) {
          Alert.alert("Search Tip", "Try broader keywords – searching locally now.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch recent search:", error);
      // FIX: Fallback on error too
      const clientFiltered = allHostels.filter((hostel) =>
        hostel.name.toLowerCase().includes(trimmedQuery)
      );
      setSearchedHostels(clientFiltered);
      Alert.alert(
        "Error",
        "Search failed. Showing local results. Retry?",
        [{ text: "Retry", onPress: () => fetchHostelSearch(query) }]
      );
    } finally {
      setIsSearching(false);
    }
  }, [appliedFilters, allHostels]); // FIX: Added allHostels dep for fallback
  // --- Fetch cities ---
  const fetchCities = async () => {
    setIsLoadingCities(true);
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
        setCities(result.data);
      } else {
        console.warn("getCitiesFromHostelServices failed:", result.message || "No data returned");
        setCities([]);
        Alert.alert("Error", result.message || "Failed to fetch cities.");
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      setCities([]);
      Alert.alert("Error", "Failed to fetch cities. Please check your connection and try again.");
    } finally {
      setIsLoadingCities(false);
    }
  };
  // --- Fetch hostel types ---
  const fetchHostelTypes = async () => {
    setIsLoadingHostelTypes(true);
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
        setHostelTypes(result.data);
      } else {
        console.warn("getHostelTypes failed:", result.message || "No data returned");
        setHostelTypes([]);
        Alert.alert("Error", result.message || "Failed to fetch hostel types.");
      }
    } catch (error) {
      console.error("Failed to fetch hostel types:", error);
      setHostelTypes([]);
      Alert.alert("Error", "Failed to fetch hostel types. Please check your connection and try again.");
    } finally {
      setIsLoadingHostelTypes(false);
    }
  };
  // --- Fetch room types ---
  const fetchRoomTypes = async () => {
    setIsLoadingRoomTypes(true);
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
        setRoomTypes(result.data.map(String));
      } else {
        console.warn("getRoomTypes failed:", result.message || "No data returned");
        setRoomTypes([]);
        Alert.alert("Error", result.message || "Failed to fetch room types.");
      }
    } catch (error) {
      console.error("Failed to fetch room types:", error);
      setRoomTypes([]);
      Alert.alert("Error", "Failed to fetch room types. Please check your connection and try again.");
    } finally {
      setIsLoadingRoomTypes(false);
    }
  };
  // --- Fetch plan types ---
  const fetchPlanTypes = async () => {
    setIsLoadingPlanTypes(true);
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
        setPlanTypes(result.data);
      } else {
        console.warn("getPlanTypes failed:", result.message || "No data returned");
        setPlanTypes([]);
        Alert.alert("Error", result.message || "Failed to fetch plan types.");
      }
    } catch (error) {
      console.error("Failed to fetch plan types:", error);
      setPlanTypes([]);
      Alert.alert("Error", "Failed to fetch plan types. Please check your connection and try again.");
    } finally {
      setIsLoadingPlanTypes(false);
    }
  };
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isHostel) {
        if (isSearchFocused && searchQuery.trim()) {
          await fetchHostelSearch(searchQuery);
        } else {
          await fetchAllHostels();
        }
      } else {
        const priceSort = appliedFilters.cost || "";
        const minRating = appliedFilters.rating || 0;
        const vegValue = appliedFilters.vegNonVeg || (vegFilter === "veg" ? "Veg" : undefined);
        if (isSearchFocused && searchQuery.trim()) {
          await fetchTiffinRecentSearch(searchQuery, priceSort, minRating, vegValue);
        } else {
          await fetchTiffinServices(searchQuery || "", priceSort, minRating, vegValue);
        }
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Error", "Failed to refresh data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [isHostel, isSearchFocused, searchQuery, appliedFilters.cost, appliedFilters.rating, vegFilter, fetchHostelSearch]);
  // --- Refetch data when FilterModal opens if data is missing ---
  useEffect(() => {
    if (showFilterModal && isHostel) {
      if (cities.length === 0 && !isLoadingCities) fetchCities();
      if (hostelTypes.length === 0 && !isLoadingHostelTypes) fetchHostelTypes();
      if (roomTypes.length === 0 && !isLoadingRoomTypes) fetchRoomTypes();
      if (planTypes.length === 0 && !isLoadingPlanTypes) fetchPlanTypes();
    }
  }, [showFilterModal, isHostel, cities.length, hostelTypes.length, roomTypes.length, planTypes.length]); // FIX: Use .length to avoid re-fetch on same array ref
  // --- Fetch data when switching to hostel mode ---
  useEffect(() => {
    if (!isHostel) {
      setCities([]);
      setHostelTypes([]);
      setRoomTypes([]);
      setPlanTypes([]);
      return;
    }
    let isMounted = true;
    Promise.all([fetchAllHostels(), fetchCities(), fetchHostelTypes(), fetchRoomTypes(), fetchPlanTypes()]).then(() => {
      if (!isMounted) return;
    });
    return () => {
      isMounted = false;
    };
  }, [isHostel]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearchFocused) {
        handleSearchBack();  // Call your existing back handler
        return true;  // "true" = "I handled it, don't exit app"
      }
      return false;  // Let normal back happen elsewhere
    });

    return () => backHandler.remove();  // Cleanup when unmount
  }, [isSearchFocused]);  // Re-run if search mode changes
  // --- Fetch tiffin data when switching to tiffin mode ---
  useEffect(() => {
    if (!isHostel) {
      fetchTiffinServices();
    } else {
      setAllTiffinServices([]);
    }
  }, [isHostel]);
  // --- Fetch based on filters for tiffin ---
  useEffect(() => {
    if (!isHostel) {
      const priceSort = appliedFilters.cost || "";
      const minRating = appliedFilters.rating || 0;
      const vegValue = appliedFilters.vegNonVeg || (vegFilter === "veg" ? "Veg" : undefined);
      if (!isSearchFocused) {
        fetchTiffinServices(searchQuery, priceSort, minRating, vegValue);
      }
    }
  }, [isHostel, appliedFilters.cost, appliedFilters.rating, vegFilter, isSearchFocused, searchQuery]);
  // --- Reset visible count on mode/filter/search changes ---
  useEffect(() => {
    setVisibleCount(10);
  }, [isHostel, appliedFilters, searchQuery, isSearchFocused]);
  useEffect(() => {
    if (isSearchFocused && searchQuery) {
      setSearchVisibleCount(10);
    }
  }, [isSearchFocused, searchQuery]);
  // --- Unified Search Debounce Effect (FIX: Combined for both modes to avoid duplication) ---
  useEffect(() => {
    if (!isSearchFocused || !searchQuery.trim()) {
      if (isHostel) setSearchedHostels([]);
      else setSearchedTiffins([]);
      setIsSearching(false);
      return;
    }
    const trimmedQuery = searchQuery.trim();
    const fetchSearch = async () => {
      setIsSearching(true);
      if (isHostel) {
        await fetchHostelSearch(trimmedQuery);
      } else {
        const priceSort = appliedFilters.cost || "";
        const minRating = appliedFilters.rating || 0;
        const vegValue = appliedFilters.vegNonVeg || (vegFilter === "veg" ? "Veg" : undefined);
        await fetchTiffinRecentSearch(trimmedQuery, priceSort, minRating, vegValue);
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
  }, [isHostel, isSearchFocused, searchQuery, appliedFilters.cost, appliedFilters.rating, vegFilter, fetchHostelSearch]);
  // --- Fetch suggestions (FIX: Ensure strings only; add String() wrapper; LIMIT TO 6) ---
  useEffect(() => {
    if (!isSearchFocused || searchQuery.length > 0) return;
    const fetchSugg = async () => {
      const token = await getAuthToken();
      if (!token) return;
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      try {
        const url = isHostel
          ? "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelSuggestions"
          : "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinSuggestions";
        const response = await fetch(url, { headers });
        const result = await response.json();
        console.log(`${isHostel ? "getHostel" : "getTiffin"}Suggestions response:`, JSON.stringify(result, null, 2));
        if (result.success && result.data && Array.isArray(result.data)) {
          // FIX: Explicit String() to prevent object rendering; filter empty
          let suggs = (isHostel
            ? result.data.map((item: any) => String(item.hostelName || "Unknown Hostel"))
            : result.data.map((item: any) => String(item.tiffinName || "Unknown"))
          ).filter((s: string) => s.trim());
          // LIMIT: Slice to first 6 suggestions
          suggs = suggs.slice(0, 6);
          console.log("🔍 Limited Suggestions Count:", suggs.length); // Debug log
          setSuggestions(suggs);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error(`Failed to fetch ${isHostel ? "hostel" : "tiffin"} suggestions:`, error);
        setSuggestions([]);
      }
    };
    fetchSugg();
  }, [isHostel, isSearchFocused]); // FIX: Removed searchQuery dep (only fetch when empty)
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
  // --- Data mappings ---
  const tiffinServices = allTiffinServices;
  // --- Filtering logic (Tiffin & Hostels) --- (FIX: Enhanced veg filtering for Veg/Non-Veg/Both; added debug log)
  const filteredTiffinServices = useMemo(() => {
    console.log("🔍 Client Filtering Tiffins - Applied:", appliedFilters, "VegFilter:", vegFilter); // Debug
    const baseTiffins = isSearchFocused && searchQuery ? searchedTiffins : tiffinServices;
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
    // FIX: Enhanced Veg/Non-Veg/Both filter - Client-side backup
    const vegFilterValue = appliedFilters.vegNonVeg ||
      (vegFilter === "veg" ? "Veg" : null);
    if (vegFilterValue === "Veg") {
      filtered = filtered.filter((service) =>
        service.tags.includes("veg") && !service.tags.includes("non-veg")
      );
    } else if (vegFilterValue === "Non-Veg") {
      filtered = filtered.filter((service) =>
        service.tags.includes("non-veg") && !service.tags.includes("veg")
      );
    } else if (vegFilterValue === "Both Veg & Non-Veg") {
      filtered = filtered.filter((service) =>
        service.tags.includes("veg") && service.tags.includes("non-veg")
      );
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
        const num = service.price.replace(/[^0-9]/g, "");
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
    console.log("🔍 Filtered Tiffins Count:", filtered.length, "VegValue:", vegFilterValue); // Debug
    return filtered;
  }, [tiffinServices, searchedTiffins, searchQuery, isSearchFocused, appliedFilters, vegFilter]);
  const filteredHostels = useMemo(() => {
    const baseHostels = isSearchFocused && searchQuery ? searchedHostels : allHostels;
    let filtered = [...baseHostels];
    if (!isSearchFocused && searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (hostel) =>
          hostel.name.toLowerCase().includes(query) ||
          hostel.type.toLowerCase().includes(query) ||
          hostel.location.toLowerCase().includes(query) ||
          hostel.amenities.some((amenity) => amenity.toLowerCase().includes(query)) ||
          (hostel.planType && hostel.planType.toLowerCase().includes(query)) ||
          (hostel.roomType && hostel.roomType.toLowerCase().includes(query)) ||
          (hostel.acNonAc && hostel.acNonAc.toLowerCase().includes(query))
      );
    }
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
    if (appliedFilters.hostelType) {
      filtered = filtered.filter((h) => h.type === appliedFilters.hostelType);
    }
    if (appliedFilters.priceRange) {
      filtered = filtered.filter(
        (h) =>
          parseInt(h.price.replace(/[^0-9]/g, "")) >= appliedFilters.priceRange[0] &&
          parseInt(h.price.replace(/[^0-9]/g, "")) <= appliedFilters.priceRange[1]
      );
    }
    if (appliedFilters.amenities?.length) {
      filtered = filtered.filter((h) =>
        appliedFilters.amenities.every((a) => h.amenities.includes(a))
      );
    }
    if (appliedFilters.userReviews) {
      filtered = filtered.filter((h) => h.rating >= appliedFilters.userReviews);
    }
    if (appliedFilters.location) {
      filtered = filtered.filter((h) => h.location.includes(appliedFilters.location));
    }
    if (appliedFilters.distance && appliedFilters.distance > 0) {
      // Placeholder for distance-based filtering (requires coordinates)
      filtered = filtered.filter((h) => true); // Implement actual distance logic if needed
    }
    if (appliedFilters.planType) {
      filtered = filtered.filter((h) => h.planType === appliedFilters.planType);
    }
    if (appliedFilters.roomType) {
      filtered = filtered.filter((h) => h.roomType === appliedFilters.roomType);
    }
    if (appliedFilters.acNonAc) {
      filtered = filtered.filter((h) => h.acNonAc === appliedFilters.acNonAc);
    }
    return filtered;
  }, [allHostels, searchedHostels, searchQuery, isSearchFocused, hostelType, area, maxRent, appliedFilters]);
  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;
  const visibleItems = useMemo(() => displayedItems.slice(0, visibleCount), [displayedItems, visibleCount]);
  const searchVisibleItems = useMemo(() => {
    if (isHostel) {
      return searchedHostels.slice(0, searchVisibleCount);
    } else {
      return filteredTiffinServices.slice(0, searchVisibleCount);
    }
  }, [isHostel, searchedHostels, filteredTiffinServices, searchVisibleCount]);
  const handleLoadMore = useCallback(() => {
    const increment = 10;
    if (visibleCount < displayedItems.length) {
      setVisibleCount(prev => Math.min(prev + increment, displayedItems.length));
    }
  }, [visibleCount, displayedItems.length]);
  const handleLoadMoreSearch = useCallback(() => {
    const increment = 10;
    const currentData = isHostel ? searchedHostels : filteredTiffinServices;
    if (searchVisibleCount < currentData.length) {
      setSearchVisibleCount(prev => Math.min(prev + increment, currentData.length));
    }
  }, [searchVisibleCount, isHostel, searchedHostels, filteredTiffinServices]);
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
    router.push({
      pathname: "/tiffin-details/[id]",
      params: { id: service.id, type: "tiffin", fullServiceData: JSON.stringify(service) },
    });
  };
  // Navigate to hostel details
  const handleHostelPress = (hostel: Hostel) => {
    router.push({
      pathname: "/hostel-details/[id]", // match folder + dynamic file
      params: { id: hostel.id, type: "hostel", fullServiceData: JSON.stringify(hostel) },
    });
  };
  const handleBookPress = (item: Hostel | TiffinService) => {
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
  };
  const handleClearSearch = () => setSearchQuery("");
  const handleProfilePress = () => router.push("/account");
  const handleSearchBack = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setSearchedHostels([]);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
    if (isHostel) {
      fetchAllHostels();
    }
  };
  const handleApplyFilters = (filters: Filters) => {
    setAppliedFilters(filters);
    setIsFilterApplied(Object.keys(filters).length > 0);
    if (isHostel) {
      fetchAllHostels();
    } else {
      // Sync vegFilter with applied vegNonVeg for toggle consistency
      if (filters.vegNonVeg) {
        let newVeg: "off" | "veg" = "off";
        if (filters.vegNonVeg === "Veg") {
          newVeg = "veg";
        }
        setVegFilter(newVeg);
      }
      const priceSort = filters.cost || "";
      const minRating = filters.rating || 0;
      fetchTiffinServices(searchQuery, priceSort, minRating);
    }
  };
  const handleVegFilterApply = (filter: "all" | "veg") => {
    const newVeg = filter === "all" ? "off" : "veg";
    setVegFilter(newVeg);
    const newFilters = { ...appliedFilters };
    if (filter === "all") {
      delete newFilters.vegNonVeg;
    } else {
      newFilters.vegNonVeg = "Veg";
    }
    setAppliedFilters(newFilters);
    setIsFilterApplied(Object.keys(newFilters).length > 0);
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
                <Text style={styles.noResultsSubtext}>Searching...</Text>
              </View>
            ) : isHostel ? (
              searchedHostels.length > 0 ? (
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
                  <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
                </View>
              )
            ) : filteredTiffinServices.length > 0 ? (
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
                <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
              </View>
            )
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.suggestionTags}>
                {isHostel ? (
                  suggestions.length > 0 ? (
                    suggestions.slice(0, 6).map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => setSearchQuery(suggestion)}
                      >
                        {/* FIX: Explicit <Text> with string */}
                        <Text style={styles.suggestionTagText}>{String(suggestion)}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("WiFi")}>
                        <Text style={styles.suggestionTagText}>WiFi</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("AC")}>
                        <Text style={styles.suggestionTagText}>AC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Near College")}>
                        <Text style={styles.suggestionTagText}>Near College</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Parking")}>
                        <Text style={styles.suggestionTagText}>Parking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Mess")}>
                        <Text style={styles.suggestionTagText}>Mess</Text>
                      </TouchableOpacity>
                    </>
                  )
                ) : (
                  suggestions.length > 0 ? (
                    suggestions.slice(0, 6).map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => setSearchQuery(suggestion)}
                      >
                        {/* FIX: Explicit <Text> with string */}
                        <Text style={styles.suggestionTagText}>{String(suggestion)}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Veg")}>
                        <Text style={styles.suggestionTagText}>Veg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Maharashtrian")}>
                        <Text style={styles.suggestionTagText}>Maharashtrian</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Healthy")}>
                        <Text style={styles.suggestionTagText}>Healthy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Home Style")}>
                        <Text style={styles.suggestionTagText}>Home Style</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionTag} onPress={() => setSearchQuery("Budget")}>
                        <Text style={styles.suggestionTagText}>Budget</Text>
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }
  // --- Filtered View --- (unchanged)
  if (isFilterApplied && hasFilters) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.filteredHeader}>
            <TouchableOpacity
              style={styles.filteredBackButton}
              onPress={() => {
                setIsFilterApplied(false);
                setAppliedFilters({});
                if (isHostel) {
                  fetchAllHostels();
                } else {
                  fetchTiffinServices();
                }
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.filteredTitle}>Applied Filter</Text>
          </View>
        </SafeAreaView>
        <View style={styles.filteredSearchContainer}>
          <View style={styles.filteredSearchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder={isHostel ? "Search for hostel..." : "Tiffin Service"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.filteredSearchInput}
              placeholderTextColor="#9CA3AF"
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
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={22} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.filteredResultsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.filteredResultsTitle}>Filtered Results</Text>
            {!isHostel && (
              <TouchableOpacity
                style={styles.vegToggleButton}
                onPress={() => setShowVegFilterModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.vegLabelContainer}>
                  <Text style={styles.vegLabelText}>VEG</Text>
                </View>
                <Animated.View style={[styles.vegToggleTrack]}>
                  {/* Thumb that moves to the right when toggled ON and fills with primary color behind the leaf */}
                  <Animated.View
                    style={[
                      styles.vegToggleThumb,
                      {
                        transform: [
                          {
                            translateX: vegToggleAnimated.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 18], // move right when ON
                            }),
                          },
                        ],
                        // thumb remains green even when OFF; only its position and leaf opacity change
                        // backgroundColor provided by styles.vegToggleThumb
                      },
                    ]}
                  >
                    <Animated.View style={[
                      styles.leafContainer,
                      {
                        opacity: vegToggleAnimated,
                        transform: [
                          {
                            scale: vegToggleAnimated.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                          }
                        ],
                      }
                    ]}>
                      <Ionicons name="leaf" size={12} color="#FFFFFF" />
                    </Animated.View>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.servicesCount}>{displayedItems.length} filtered results</Text>
          {isHostel && isLoadingHostels ? (
            <View style={styles.noResultsContainer}>
              <ActivityIndicator size="large" color="#6B7280" />
              <Text style={styles.noResultsSubtext}>Loading hostels...</Text>
            </View>
          ) : displayedItems.length > 0 ? (
            <FlatList
              data={visibleItems}
              renderItem={isHostel ? renderHostelItem : renderTiffinItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.backToHomeButton}
                  onPress={() => {
                    setIsFilterApplied(false);
                    setAppliedFilters({});
                    if (isHostel) {
                      fetchAllHostels();
                    } else {
                      fetchTiffinServices();
                    }
                  }}
                >
                  <Text style={styles.backToHomeText}>Back to Home</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            <>
              <View style={styles.noResultsContainer}>
                <Ionicons name="filter" size={50} color="#9CA3AF" />
                <Text style={styles.noResultsText}>
                  No {isHostel ? "hostels" : "tiffin services"} match your filters
                </Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
              </View>
              <TouchableOpacity
                style={styles.backToHomeButton}
                onPress={() => {
                  setIsFilterApplied(false);
                  setAppliedFilters({});
                  if (isHostel) {
                    fetchAllHostels();
                  } else {
                    fetchTiffinServices();
                  }
                }}
              >
                <Text style={styles.backToHomeText}>Back to Home</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          isHostel={isHostel}
          currentFilters={appliedFilters}
          cities={cities}
          isLoadingCities={isLoadingCities}
          hostelTypes={hostelTypes}
          isLoadingHostelTypes={isLoadingHostelTypes}
          roomTypes={roomTypes}
          isLoadingRoomTypes={isLoadingRoomTypes}
          planTypes={planTypes}
          isLoadingPlanTypes={isLoadingPlanTypes}
        />
      </View>
    );
  }
  // --- Normal Dashboard View --- (FIX: Ensure banner text is wrapped)
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationButton} onPress={() => setShowLocationModal(true)}>
              <Ionicons name="home" size={20} color="#000" />
              <Text style={styles.locationText}>Home Location</Text>
              <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.locationSubtext}>{userLocation || "Unknown Location"}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: hasFilters ? colors.primary : "#F2EFFD" }]}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options" size={22} color={hasFilters ? "white" : "#2563EB"} />
              </TouchableOpacity>
            </View>
            {!searchQuery && !hasFilters && (
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
                    setIsFilterApplied(false);
                    setHostelType("");
                    setArea("");
                    setMaxRent("");
                    setVegFilter("off");
                    setSearchedHostels([]);
                    setCities([]);
                    setHostelTypes([]);
                    setRoomTypes([]);
                    setPlanTypes([]);
                    fetchTiffinServices();
                  }}
                >
                  <Image
                    source={tiffinlogo}
                    style={styles.image}
                    tintColor={!isHostel ? "#fff" : "#004AAD"}
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
                    setIsFilterApplied(false);
                    setSearchedHostels([]);
                    fetchAllHostels();
                    fetchCities();
                    fetchHostelTypes();
                    fetchRoomTypes();
                    fetchPlanTypes();
                  }}
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
            {isHostel && !hasFilters && (
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
                  <View style={styles.filterItem}>
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
                  </View>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Max Rent (₹)</Text>
                    <Dropdown
                      options={maxRentOptions}
                      value={maxRent || "All"}
                      onSelect={handleMaxRentSelect}
                      placeholder="All"
                    />
                  </View>
                </View>
              </View>
            )}
            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {hasFilters
                    ? "Filtered Results"
                    : searchQuery
                      ? "Search Results"
                      : isHostel
                        ? "Available Accommodations"
                        : "Available Tiffin Service"}
                </Text>
                {!isHostel && (
                  <TouchableOpacity
                    style={styles.vegToggleButton}
                    onPress={() => setShowVegFilterModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.vegLabelContainer}>
                      <Text style={styles.vegLabelText}>VEG</Text>
                    </View>
                    <Animated.View style={styles.vegToggleTrack}>
                      <Animated.View
                        style={[
                          styles.vegToggleThumb,
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
                      </Animated.View>
                    </Animated.View>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.servicesCount}>
                {isHostel
                  ? hasFilters
                    ? `${filteredHostels.length} filtered results`
                    : searchQuery
                      ? `${filteredHostels.length} results found`
                      : `${filteredHostels.length} properties found in ${userLocation || "Unknown Location"}`
                  : hasFilters
                    ? `${filteredTiffinServices.length} filtered results`
                    : searchQuery || vegFilter === "veg"
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
        contentContainerStyle={{ paddingBottom: 20 }}
      />
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
        cities={cities}
        isLoadingCities={isLoadingCities}
        hostelTypes={hostelTypes}
        isLoadingHostelTypes={isLoadingHostelTypes}
        roomTypes={roomTypes}
        isLoadingRoomTypes={isLoadingRoomTypes}
        planTypes={planTypes}
        isLoadingPlanTypes={isLoadingPlanTypes}
      />
      <VegFilterModal
        visible={showVegFilterModal}
        onClose={() => setShowVegFilterModal(false)}
        currentFilter={vegFilter === "off" ? "all" : "veg"}
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
  searchBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
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
  },
  filterItem: {
    flex: 1,
    zIndex: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 6,
    zIndex: 1,
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
    borderRadius: 11,
    backgroundColor: "green", // show green thumb even when OFF
    position: "absolute",
    left: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
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
  filteredHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  filteredBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  filteredTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  filteredSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  filteredSearchBar: {
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
  filteredSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1F2937",
  },
  filteredResultsContainer: {
    flex: 1,
  },
  filteredResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  backToHomeButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backToHomeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
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
});