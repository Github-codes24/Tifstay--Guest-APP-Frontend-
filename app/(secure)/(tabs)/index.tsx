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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LocationModal from "@/components/modals/LocationModal";
import VegFilterModal from "@/components/modals/VegFilterModal";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import food1 from "@/assets/images/food1.png";
import hostel1 from "@/assets/images/image/hostelBanner.png";
import demoData from "@/data/demoData.json";
import colors from "@/constants/colors";
import FilterModal from "@/components/modals/FilterModal";
import { useAppState } from "@/context/AppStateProvider";
import { useAuthStore } from "@/store/authStore";
import * as Location from "expo-location";
import Dropdown from "@/components/Dropdown";
import { hostellogo, tiffinlogo } from "@/assets/images";

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

  // Local states
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

  const hostelTypeOptions = ["All", "Boys", "Girls", "Co-ed"];
  const areaOptions = [
    "All",
    "Nagpur",
    "Mumbai",
    "Pune",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
  ];
  const maxRentOptions = [
    "All",
    "5000",
    "10000",
    "15000",
    "20000",
    "25000",
    "30000",
  ];

  const hasFilters = Object.keys(appliedFilters).length > 0;
  const vegAnimated = useRef(
    new Animated.Value(vegFilter !== "off" ? 1 : 0)
  ).current;
  const searchInputRef = useRef<TextInput>(null);

  const imageMapping: { [key: string]: any } = {
    food1: food1,
    hostel1: require("../../../assets/images/image/hostelBanner.png"),
  };

  useEffect(() => {
    if (!hasSelectedLocation) {
      setShowLocationModal(true);
    }
  }, [hasSelectedLocation]);

  useEffect(() => {
    Animated.timing(vegAnimated, {
      toValue: vegFilter !== "off" ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [vegFilter]);

  const tiffinServices = demoData.tiffinServices.map((service) => ({
    ...service,
    image: imageMapping[service.image] || food1,
  }));

  const hostels = demoData.hostels.map((hostel) => ({
    ...hostel,
    image:
      imageMapping[hostel.image] ||
      require("../../../assets/images/image/hostelBanner.png"),
  }));

  const filteredTiffinServices = useMemo(() => {
    let filtered = [...tiffinServices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query) ||
          service.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply veg filter
    if (vegFilter === "veg") {
      // Pure Veg - Show only items with ONLY veg tag
      filtered = filtered.filter((service) => {
        const tags = service.tags.map((tag) => tag.toLowerCase());
        return tags.includes("veg") && !tags.includes("non-veg");
      });
    } else if (vegFilter === "all") {
      // All Restaurants (when toggle is ON) - Show only items with BOTH tags
      filtered = filtered.filter((service) => {
        const tags = service.tags.map((tag) => tag.toLowerCase());
        return tags.includes("veg") && tags.includes("non-veg");
      });
    }
    // vegFilter === "off" shows everything (no filter)

    // Apply filter modal filters for tiffin
    if (!isHostel && appliedFilters.rating) {
      filtered = filtered.filter(
        (service) => service.rating >= appliedFilters.rating
      );
    }

    if (!isHostel && appliedFilters.vegNonVeg) {
      if (appliedFilters.vegNonVeg === "Veg") {
        filtered = filtered.filter((service) => {
          const tags = service.tags.map((tag) => tag.toLowerCase());
          return tags.includes("veg") && !tags.includes("non-veg");
        });
      } else if (appliedFilters.vegNonVeg === "Non-Veg") {
        filtered = filtered.filter((service) => {
          const tags = service.tags.map((tag) => tag.toLowerCase());
          return tags.includes("non-veg");
        });
      }
    }

    if (!isHostel && appliedFilters.cost === "Low to High") {
      filtered.sort(
        (a: any, b: any) =>
          parseFloat(a.price.replace(/[^0-9]/g, "")) -
          parseFloat(b.price.replace(/[^0-9]/g, ""))
      );
    } else if (!isHostel && appliedFilters.cost === "High to Low") {
      filtered.sort(
        (a: any, b: any) =>
          parseFloat(b.price.replace(/[^0-9]/g, "")) -
          parseFloat(a.price.replace(/[^0-9]/g, ""))
      );
    }

    return filtered;
  }, [searchQuery, tiffinServices, vegFilter, appliedFilters, isHostel]);

  const filteredHostels = useMemo(() => {
    let filtered = [...hostels];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (hostel) =>
          hostel.name.toLowerCase().includes(query) ||
          hostel.type.toLowerCase().includes(query) ||
          hostel.location.toLowerCase().includes(query) ||
          hostel.amenities.some((amenity) =>
            amenity.toLowerCase().includes(query)
          )
      );
    }

    if (hostelType && hostelType !== "All") {
      filtered = filtered.filter((hostel) => hostel.type === hostelType);
    }

    if (area && area !== "All") {
      filtered = filtered.filter((hostel) =>
        hostel.location.toLowerCase().includes(area.toLowerCase())
      );
    }
    if (maxRent && maxRent !== "All") {
      const maxRentValue = parseInt(maxRent);
      filtered = filtered.filter(
        (hostel) => parseInt(hostel.price) <= maxRentValue
      );
    }

    if (isHostel && appliedFilters.hostelType) {
      filtered = filtered.filter(
        (hostel) => hostel.type === appliedFilters.hostelType
      );
    }

    if (isHostel && appliedFilters.priceRange) {
      filtered = filtered.filter(
        (hostel) =>
          parseInt(hostel.price) >= appliedFilters.priceRange[0] &&
          parseInt(hostel.price) <= appliedFilters.priceRange[1]
      );
    }

    if (
      isHostel &&
      appliedFilters.amenities &&
      appliedFilters.amenities.length > 0
    ) {
      filtered = filtered.filter((hostel) =>
        appliedFilters.amenities.every((amenity: string) =>
          hostel.amenities.includes(amenity)
        )
      );
    }

    if (isHostel && appliedFilters.userReviews) {
      filtered = filtered.filter(
        (hostel) => hostel.rating >= appliedFilters.userReviews
      );
    }

    if (isHostel && appliedFilters.location) {
      filtered = filtered.filter((hostel) =>
        hostel.location.includes(appliedFilters.location)
      );
    }

    return filtered;
  }, [
    searchQuery,
    hostels,
    appliedFilters,
    isHostel,
    hostelType,
    area,
    maxRent,
  ]);

  const handleLocationSelected = async (location: any) => {
    setShowLocationModal(false);

    if (location.coords) {
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          const formattedAddress = `${address.street || ""} ${
            address.city || ""
          } ${address.region || ""}`.trim();
          setUserLocation(formattedAddress || "Current Location");
        } else {
          setUserLocation("Current Location");
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        setUserLocation("Current Location");
      }
    } else if (location.type) {
      if (location.type === "home") {
        setUserLocation("Home Location");
      } else if (location.type === "work") {
        setUserLocation("Work Location");
      }
    } else if (typeof location === "string") {
      setUserLocation(location);
    }

    setHasSelectedLocation(true);
    console.log("Location selected:", location);
  };

  const handleLocationModalClose = () => {
    setShowLocationModal(false);
    if (!hasSelectedLocation) {
      setHasSelectedLocation(true);
    }
  };

  const handleTiffinPress = (service: any) => {
    console.log("Tiffin pressed:", service);
    router.navigate(`/tiffin-details/${service.id}`);
  };

  const handleHostelPress = (hostel: any) => {
    console.log("Hostel pressed:", hostel);
    router.navigate(`/hostel-details/${hostel.id}`);
  };

  const handleBookPress = (item: any) => {
    console.log("Book pressed:", item);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleProfilePress = () => {
    router.push("/account");
  };

  const handleSearchBack = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleApplyFilters = (filters: any) => {
    setAppliedFilters(filters);
    setIsFilterApplied(Object.keys(filters).length > 0);
    console.log("Applied filters:", filters);
  };

  const handleVegFilterApply = (filter: "all" | "veg") => {
    setVegFilter(filter);
  };

  const handleVegTogglePress = () => {
    if (vegFilter === "off") {
      // If toggle is OFF, turn it ON and show modal
      setShowVegFilterModal(true);
    } else {
      // If toggle is ON (either "all" or "veg"), turn it OFF
      setVegFilter("off");
    }
  };

  const handleHostelTypeSelect = (value: string) => {
    setHostelType(value === "All" ? "" : value);
  };

  const handleAreaSelect = (value: string) => {
    setArea(value === "All" ? "" : value);
  };

  const handleMaxRentSelect = (value: string) => {
    setMaxRent(value === "All" ? "" : value);
  };

  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;

  const renderTiffinItem = ({ item }: { item: any }) => (
    <TiffinCard
      service={item}
      onPress={() => handleTiffinPress(item)}
      onBookPress={() => handleBookPress(item)}
    />
  );

  const renderHostelItem = ({ item }: { item: any }) => (
    <HostelCard
      hostel={item}
      onPress={() => handleHostelPress(item)}
      onBookPress={() => handleBookPress(item)}
    />
  );

  const keyExtractor = (item: any) => item.id.toString();

  // Search focused view
  if (isSearchFocused) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.searchFocusedHeader}>
            <TouchableOpacity
              style={styles.searchBackButton}
              onPress={handleSearchBack}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.searchFocusedInputContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                ref={searchInputRef}
                placeholder={
                  isHostel ? "Search for hostel..." : "Tiffin Service"
                }
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
          <Text style={styles.searchResultsTitle}>
            {searchQuery ? "Search Results" : "Popular Searches"}
          </Text>

          {searchQuery && displayedItems.length > 0 ? (
            <FlatList
              data={displayedItems}
              renderItem={isHostel ? renderHostelItem : renderTiffinItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
            />
          ) : searchQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={50} color="#9CA3AF" />
              <Text style={styles.noResultsText}>
                {`No ${
                  isHostel ? "hostels" : "services"
                } found matching "${searchQuery}"`}
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.suggestionTags}>
                {isHostel ? (
                  <>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("WiFi")}
                    >
                      <Text style={styles.suggestionTagText}>WiFi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("AC")}
                    >
                      <Text style={styles.suggestionTagText}>AC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Near College")}
                    >
                      <Text style={styles.suggestionTagText}>Near College</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Parking")}
                    >
                      <Text style={styles.suggestionTagText}>Parking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Mess")}
                    >
                      <Text style={styles.suggestionTagText}>Mess</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Veg")}
                    >
                      <Text style={styles.suggestionTagText}>Veg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Maharashtrian")}
                    >
                      <Text style={styles.suggestionTagText}>
                        Maharashtrian
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Healthy")}
                    >
                      <Text style={styles.suggestionTagText}>Healthy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Home Style")}
                    >
                      <Text style={styles.suggestionTagText}>Home Style</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionTag}
                      onPress={() => setSearchQuery("Budget")}
                    >
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

  // Filtered view
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
                  No {isHostel ? "hostels" : "tiffin services"} match your
                  filters
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Try adjusting your filters
                </Text>
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

  // Normal dashboard view
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons name="home" size={20} color="#000" />
              <Text style={styles.locationText}>Home Location</Text>
              <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.locationSubtext}>{userLocation}</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
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
                  placeholder={
                    isHostel
                      ? "Search for hostel..."
                      : "Search for tiffin services..."
                  }
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
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: hasFilters ? colors.primary : "#F2EFFD",
                  },
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons
                  name="options"
                  size={22}
                  color={hasFilters ? "white" : "#2563EB"}
                />
              </TouchableOpacity>
            </View>

            {!searchQuery && !hasFilters && (
              <View style={styles.banner}>
                <Image
                  source={isHostel ? hostel1 : food1}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerContent}>
                  {isHostel ? (
                    <>
                      <Text style={styles.bannerTitle}>
                        Premium{"\n"}Hostels
                      </Text>
                      <Text style={styles.bannerSubtitle}>
                        Find your perfect home{"\n"}away from home
                      </Text>
                      <Text style={styles.bannerLink}>
                        Safe & Secure Living
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.bannerTitle}>
                        Indian{"\n"}Cuisine
                      </Text>
                      <Text style={styles.bannerSubtitle}>
                        Enjoy pure taste of your{"\n"}home-made delights
                      </Text>
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
                  style={[
                    styles.serviceButton,
                    !isHostel && styles.serviceButtonSelected,
                  ]}
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
                  {/* <Ionicons
                    name="restaurant"
                    size={24}
                    color={!isHostel ? "#fff" : "#004AAD"}
                  /> */}
                  <Image
                  source={tiffinlogo}
                  tintColor={!isHostel ? "#fff" : "#004AAD"}
                  style={styles.image}
                  />
                    
                  
                  <Text
                    style={[
                      styles.serviceButtonText,
                      !isHostel && styles.serviceButtonTextSelected,
                    ]}
                  >
                    Tiffin/Restaurants
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.serviceButton,
                    isHostel && styles.serviceButtonSelected,
                  ]}
                  onPress={() => {
                    setIsHostel(true);
                    setSearchQuery("");
                    setAppliedFilters({});
                    setIsFilterApplied(false);
                  }}
                >
                  {/* <Ionicons
                    name="business"
                    size={24}
                    color={isHostel ? "#fff" : "#004AAD"}
                  /> */}
                   <Image
                  source={hostellogo}
                 tintColor={isHostel ? "#fff" : "#004AAD"}
                  style={styles.image}
                  />
                  <Text
                    style={[
                      styles.serviceButtonText,
                      isHostel && styles.serviceButtonTextSelected,
                    ]}
                  >
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
                  <TouchableOpacity
                    style={styles.vegToggle}
                    onPress={handleVegTogglePress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vegText}>
                      {vegFilter === "off" ? "Non-Veg" : "Veg"}
                    </Text>
                    <View
                      style={[
                        styles.vegSwitchContainer,
                        vegFilter !== "off" && styles.vegSwitchActive,
                      ]}
                    >
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
                    : `${filteredHostels.length} properties found in ${userLocation}`
                  : hasFilters
                  ? `${filteredTiffinServices.length} filtered results`
                  : searchQuery || vegFilter !== "off"
                  ? `${filteredTiffinServices.length} results found`
                  : `${tiffinServices.length} services found in ${userLocation}`}
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
            <Text style={styles.noResultsSubtext}>
              Try adjusting your filters or search
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* All Modals */}
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  searchWrapperFocused: {
    marginTop: 20,
    gap: 8,
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
  searchContainerFocused: {
    backgroundColor: "#F2EFFD",
    borderColor: "#6B7EF5",
    paddingHorizontal: 12,
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
    backgroundColor: "#F2EFFD",
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
    // flexDirection: "row",
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    // paddingHorizontal: 20,
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
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  image:{
    width:24,
    height:24
  },
});
