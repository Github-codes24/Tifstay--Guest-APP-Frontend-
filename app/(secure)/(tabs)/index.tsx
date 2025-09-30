import React, { useState, useMemo, useRef, useEffect } from "react";
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
import demoData from "@/data/demoData.json";
import { useAppState } from "@/context/AppStateProvider";
import { useAuthStore } from "@/store/authStore";
import { hostellogo, tiffinlogo } from "@/assets/images";
import food1 from "@/assets/images/food1.png";
import hostel1 from "@/assets/images/image/hostelBanner.png";

interface Hostel {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  amenities: string[];
  rating: number;
  image: any;
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
}

interface Filters {
  rating?: number;
  vegNonVeg?: string;
  cost?: string;
  hostelType?: string;
  priceRange?: [number, number];
  amenities?: string[];
  userReviews?: number;
  location?: string;
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

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);
  const [showVegFilterModal, setShowVegFilterModal] = useState(false);
  const [vegFilter, setVegFilter] = useState<"off" | "all" | "veg">("off");
  const [hostelType, setHostelType] = useState("");
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const hostelTypeOptions = ["All", "Boys", "Girls", "Co-ed"];
  const areaOptions = ["All", "Nagpur", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai", "Kolkata"];
  const maxRentOptions = ["All", "5000", "10000", "15000", "20000", "25000", "30000"];

  const hasFilters = Object.keys(appliedFilters).length > 0;
  const vegAnimated = useRef(new Animated.Value(vegFilter !== "off" ? 1 : 0)).current;
  const searchInputRef = useRef<TextInput>(null);

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
      return token;
    } catch (error) {
      console.error("Error fetching auth token:", error);
      Alert.alert("Error", "Failed to retrieve authentication token. Please try again.");
      return null;
    }
  };

  // --- Fetch all hostels ---
  useEffect(() => {
    if (!isHostel) return;

    const fetchAllHostels = async () => {
      const token = await getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const response = await fetch(
          "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getAllHostelsServices",
          { headers }
        );
        const result = await response.json();
        if (result.success) {
          const mappedHostels = result.data.map((hostel: any) => ({
            id: hostel.hostelName + Math.random().toString(),
            name: hostel.hostelName || "Unknown Hostel",
            type: hostel.hostelType || "Unknown",
            location: hostel.fullAddress || "Unknown Location",
            price: hostel.pricing?.price?.toString() || "0",
            amenities: hostel.facilities || [],
            rating: hostel.rating || 0,
            image: imageMapping["hostel1"],
          }));
          setHostels(mappedHostels);
          Alert.alert("Success", `getAllHostelsServices API integrated successfully. Loaded ${mappedHostels.length} hostels.`);
        } else {
          setHostels([]);
          Alert.alert("No Hostels Found", result.message || "No hostels available at the moment.");
        }
      } catch (error) {
        console.error("Failed to fetch hostels:", error);
        setHostels([]);
        Alert.alert("Error", "Failed to fetch hostels. Please check your connection and try again.");
      }
    };

    fetchAllHostels();
  }, [isHostel]);

  // --- Fetch hostels by recent search ---
  useEffect(() => {
    if (!isHostel || !isSearchFocused || !searchQuery) return;

    const fetchRecentSearch = async () => {
      const token = await getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const response = await fetch(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelsByRecentSearch?query=${encodeURIComponent(searchQuery)}`,
          { headers }
        );
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          const mappedHostels = result.data.map((hostel: any) => ({
            id: hostel.hostelName + Math.random().toString(),
            name: hostel.hostelName || "Unknown Hostel",
            type: hostel.hostelType || "Unknown",
            location: hostel.fullAddress || "Unknown Location",
            price: hostel.pricing?.price?.toString() || "0",
            amenities: hostel.facilities || [],
            rating: hostel.rating || 0,
            image: imageMapping["hostel1"],
          }));
          setHostels(mappedHostels);
          Alert.alert("Success", `getHostelsByRecentSearch API integrated successfully. Found ${mappedHostels.length} hostels for "${searchQuery}".`);
        } else {
          setHostels([]);
          Alert.alert("No Results", `No hostels found matching "${searchQuery}".`);
        }
      } catch (error) {
        console.error("Failed to fetch recent search:", error);
        setHostels([]);
        Alert.alert("Error", "Failed to search hostels. Please check your connection and try again.");
      }
    };

    fetchRecentSearch();
  }, [isHostel, isSearchFocused, searchQuery]);

  // --- Fetch hostel suggestions ---
  useEffect(() => {
    if (!isHostel || !isSearchFocused || searchQuery) return;

    const fetchSuggestions = async () => {
      const token = await getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const response = await fetch(
          "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelSuggestions",
          { headers }
        );
        const result = await response.json();
        if (result.success) {
          setSuggestions(result.data || []);
          Alert.alert("Success", "getHostelSuggestions API integrated successfully. Loaded suggestions.");
        } else {
          setSuggestions([]);
          Alert.alert("No Suggestions", result.message || "No suggestions available at the moment.");
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
        Alert.alert("Error", "Failed to fetch suggestions. Please check your connection and try again.");
      }
    };

    fetchSuggestions();
  }, [isHostel, isSearchFocused, searchQuery]);

  // --- Location Modal ---
  useEffect(() => {
    if (!hasSelectedLocation) setShowLocationModal(true);
  }, [hasSelectedLocation]);

  // --- Veg Filter Animation ---
  useEffect(() => {
    Animated.timing(vegAnimated, {
      toValue: vegFilter !== "off" ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [vegFilter]);

  // --- Data mappings ---
  const tiffinServices: TiffinService[] = demoData.tiffinServices.map((service) => ({
    ...service,
    image: imageMapping[service.image] || food1,
  }));

  // --- Filtering logic (Tiffin & Hostels) ---
  const filteredTiffinServices = useMemo(() => {
    let filtered = [...tiffinServices];
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query) ||
          service.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (vegFilter === "veg") {
      filtered = filtered.filter((service) => {
        const tags = service.tags.map((tag) => tag.toLowerCase());
        return tags.includes("veg") && !tags.includes("non-veg");
      });
    } else if (vegFilter === "all") {
      filtered = filtered.filter((service) => {
        const tags = service.tags.map((tag) => tag.toLowerCase());
        return tags.includes("veg") && tags.includes("non-veg");
      });
    }

    if (appliedFilters.rating) {
      filtered = filtered.filter((service) => service.rating >= appliedFilters.rating);
    }

    if (appliedFilters.vegNonVeg) {
      if (appliedFilters.vegNonVeg === "Veg") {
        filtered = filtered.filter((service) => {
          const tags = service.tags.map((tag) => tag.toLowerCase());
          return tags.includes("veg") && !tags.includes("non-veg");
        });
      } else if (appliedFilters.vegNonVeg === "Non-Veg") {
        filtered = filtered.filter((service) =>
          service.tags.map((tag) => tag.toLowerCase()).includes("non-veg")
        );
      }
    }

    if (appliedFilters.cost === "Low to High") {
      filtered.sort(
        (a, b) =>
          parseFloat(a.price.replace(/[^0-9]/g, "")) -
          parseFloat(b.price.replace(/[^0-9]/g, ""))
      );
    } else if (appliedFilters.cost === "High to Low") {
      filtered.sort(
        (a, b) =>
          parseFloat(b.price.replace(/[^0-9]/g, "")) -
          parseFloat(a.price.replace(/[^0-9]/g, ""))
      );
    }

    return filtered;
  }, [tiffinServices, searchQuery, vegFilter, appliedFilters]);

  const filteredHostels = useMemo(() => {
    let filtered = [...hostels];
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(
        (hostel) =>
          hostel.name.toLowerCase().includes(query) ||
          hostel.type.toLowerCase().includes(query) ||
          hostel.location.toLowerCase().includes(query) ||
          hostel.amenities.some((amenity) => amenity.toLowerCase().includes(query))
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
      filtered = filtered.filter((h) => parseInt(h.price) <= max);
    }

    if (appliedFilters.hostelType) {
      filtered = filtered.filter((h) => h.type === appliedFilters.hostelType);
    }
    if (appliedFilters.priceRange) {
      filtered = filtered.filter(
        (h) =>
          parseInt(h.price) >= appliedFilters.priceRange[0] &&
          parseInt(h.price) <= appliedFilters.priceRange[1]
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

    return filtered;
  }, [hostels, searchQuery, hostelType, area, maxRent, appliedFilters]);

  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;

  // --- Handlers ---
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

  const handleTiffinPress = (service: TiffinService) => router.navigate(`/tiffin-details/${service.id}`);
  const handleHostelPress = (hostel: Hostel) => router.navigate(`/hostel-details/${hostel.id}`);
  const handleBookPress = (item: Hostel | TiffinService) => console.log("Book pressed", item);
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
    setIsFilterApplied(Object.keys(filters).length > 0);
  };
  const handleVegFilterApply = (filter: "all" | "veg") => setVegFilter(filter);
  const handleVegTogglePress = () => {
    if (vegFilter === "off") {
      setShowVegFilterModal(true);
    } else {
      setVegFilter("off");
    }
  };
  const handleHostelTypeSelect = (value: string) => setHostelType(value === "All" ? "" : value);
  const handleAreaSelect = (value: string) => setArea(value === "All" ? "" : value);
  const handleMaxRentSelect = (value: string) => setMaxRent(value === "All" ? "" : value);

  const renderTiffinItem = ({ item }: { item: TiffinService }) => (
    <TiffinCard service={item} onPress={() => handleTiffinPress(item)} onBookPress={() => handleBookPress(item)} />
  );
  const renderHostelItem = ({ item }: { item: Hostel }) => (
    <HostelCard hostel={item} onPress={() => handleHostelPress(item)} onBookPress={() => handleBookPress(item)} />
  );
  const keyExtractor = (item: Hostel | TiffinService) => item.id.toString();

  // --- Search Focused View ---
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
          {searchQuery && displayedItems.length > 0 ? (
            <FlatList
              data={displayedItems}
              renderItem={isHostel ? renderHostelItem : renderTiffinItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : searchQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={50} color="#9CA3AF" />
              <Text style={styles.noResultsText}>
                {`No ${isHostel ? "hostels" : "services"} found matching "${searchQuery}"`}
              </Text>
              <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
            </View>
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.suggestionTags}>
                {isHostel ? (
                  suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionTag}
                        onPress={() => setSearchQuery(suggestion)}
                      >
                        <Text style={styles.suggestionTagText}>{suggestion}</Text>
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
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // --- Filtered View ---
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
          <Text style={styles.filteredResultsTitle}>Filtered Results</Text>
          {displayedItems.length > 0 ? (
            <FlatList
              data={displayedItems}
              renderItem={isHostel ? renderHostelItem : renderTiffinItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.backToHomeButton}
                  onPress={() => {
                    setIsFilterApplied(false);
                    setAppliedFilters({});
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
        />
      </View>
    );
  }

  // --- Normal Dashboard View ---
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
        data={displayedItems}
        renderItem={isHostel ? renderHostelItem : renderTiffinItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
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
                      <Text style={styles.bannerTitle}>Premium{"\n"}Hostels</Text>
                      <Text style={styles.bannerSubtitle}>Find your perfect home{"\n"}away from home</Text>
                      <Text style={styles.bannerLink}>Safe & Secure Living</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.bannerTitle}>Indian{"\n"}Cuisine</Text>
                      <Text style={styles.bannerSubtitle}>Enjoy pure taste of your{"\n"}home-made delights</Text>
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
                  }}
                >
                  <Image
                    source={hostellogo}
                    style={styles.image}
                    tintColor={isHostel ? "#fff" : "#004AAD"}
                  />
                  <Text style={styles.serviceButtonText, isHostel && styles.serviceButtonTextSelected}>
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
                    <Dropdown
                      options={hostelTypeOptions}
                      value={hostelType || "All"}
                      onSelect={handleHostelTypeSelect}
                      placeholder="All"
                    />
                  </View>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Area</Text>
                    <Dropdown
                      options={areaOptions}
                      value={area || "All"}
                      onSelect={handleAreaSelect}
                      placeholder="All"
                    />
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
                {!isHostel && !hasFilters && (
                  <TouchableOpacity style={styles.vegToggle} onPress={handleVegTogglePress} activeOpacity={0.7}>
                    <Text style={styles.vegText}>{vegFilter === "off" ? "Non-Veg" : "Veg"}</Text>
                    <View style={[styles.vegSwitchContainer, vegFilter !== "off" && styles.vegSwitchActive]}>
                      <Animated.View
                        style={[
                          styles.vegSwitchThumb,
                          {
                            transform: [
                              {
                                translateX: vegAnimated.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 20],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
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
                  : searchQuery || vegFilter !== "off"
                  ? `${filteredTiffinServices.length} results found`
                  : `${tiffinServices.length} services found in ${userLocation || "Unknown Location"}`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={50} color="#9CA3AF" />
            <Text style={styles.noResultsText}>
              {isHostel ? "No hostels found" : "No tiffin services found"}
            </Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters or search</Text>
          </View>
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
      />
      <VegFilterModal
        visible={showVegFilterModal}
        onClose={() => setShowVegFilterModal(false)}
        currentFilter={vegFilter === "off" ? "all" : vegFilter}
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
  vegToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vegText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  vegSwitchContainer: {
    width: 44,
    height: 24,
    backgroundColor: "red",
    borderRadius: 12,
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: "center",
  },
  vegSwitchActive: {
    backgroundColor: "#10B981",
  },
  vegSwitchThumb: {
    width: 20,
    height: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 16,
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