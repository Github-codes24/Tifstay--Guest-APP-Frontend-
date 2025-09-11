import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LocationModal from "@/components/LocationModal";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import food1 from "@/assets/images/food1.png";
import hostel1 from "@/assets/images/hostel1.png";
import demoData from "@/data/demoData.json";
import colors from "@/constants/colors";
3;
// import FilterModal from "@/components/modals/FilterModal";

export default function DashboardScreen() {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [showFliterModal, setShowFilterModal] = useState(true);
  const [userLocation, setUserLocation] = useState("Nagpur, Maharashtra");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [hostelType, setHostelType] = useState("Boys");
  const [area, setArea] = useState("Nagpur");
  const [maxRent, setMaxRent] = useState("10000");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const vegAnimated = useRef(new Animated.Value(isVegOnly ? 1 : 0)).current;
  const searchInputRef = useRef<TextInput>(null); // Add ref for TextInput

  const imageMapping: { [key: string]: any } = {
    food1: food1,
    hostel1: require("../../../assets/images/hostel1.png"),
  };

  useEffect(() => {
    Animated.timing(vegAnimated, {
      toValue: isVegOnly ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isVegOnly]);

  const tiffinServices = demoData.tiffinServices.map((service) => ({
    ...service,
    image: imageMapping[service.image] || food1,
  }));

  const hostels = demoData.hostels.map((hostel) => ({
    ...hostel,
    image:
      imageMapping[hostel.image] ||
      require("../../../assets/images/hostel1.png"),
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

    if (isVegOnly) {
      filtered = filtered.filter(
        (service) =>
          service.tags.includes("Veg") || service.tags.includes("veg")
      );
    }

    return filtered;
  }, [searchQuery, tiffinServices, isVegOnly]);

  const filteredHostels = useMemo(() => {
    if (!searchQuery.trim()) return hostels;

    const query = searchQuery.toLowerCase();
    return hostels.filter(
      (hostel) =>
        hostel.name.toLowerCase().includes(query) ||
        hostel.type.toLowerCase().includes(query) ||
        hostel.location.toLowerCase().includes(query) ||
        hostel.amenities.some((amenity) =>
          amenity.toLowerCase().includes(query)
        )
    );
  }, [searchQuery, hostels]);

  const handleLocationSelected = (location: any) => {
    setShowLocationModal(false);
    console.log("Location selected:", location);
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
  const onhandlePress = () => {
    router.push("../");
  };
  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {!isSearchFocused && (
          <View style={styles.header}>
            <View style={styles.locationContainer}>
              <TouchableOpacity style={styles.locationButton}>
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
        )}
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View
          style={[
            styles.searchWrapper,
            isSearchFocused && styles.searchWrapperFocused,
          ]}
        >
          <View
            style={[
              styles.searchContainer,
              isSearchFocused && styles.searchContainerFocused,
            ]}
          >
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              ref={searchInputRef} // Add ref here
              placeholder={
                isSearchFocused
                  ? isHostel
                    ? "Search for hostel..."
                    : "Tiffin Service"
                  : isHostel
                  ? "Search for hostel..."
                  : "Search for tiffin services..."
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Only set search focused to false if there's no search query
                if (!searchQuery.trim()) {
                  setIsSearchFocused(false);
                }
              }}
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
            style={styles.filterButton}
            //  onPress={()=>router.push("/(secure)/(tabs)/filter")}
            onPress={() => router.push("../../")}
          >
            <Ionicons name="options" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {isSearchFocused ? (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Searched Results</Text>
            {searchQuery && displayedItems.length > 0 ? (
              displayedItems.map((item: any) =>
                isHostel ? (
                  <HostelCard
                    key={item.id}
                    hostel={item}
                    onPress={() => handleHostelPress(item)}
                    onBookPress={() => handleBookPress(item)}
                  />
                ) : (
                  <TiffinCard
                    key={item.id}
                    service={item}
                    onPress={() => handleTiffinPress(item)}
                    onBookPress={() => handleBookPress(item)}
                  />
                )
              )
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
            ) : null}
          </View>
        ) : (
          <>
            {!isHostel && !searchQuery && (
              <View style={styles.banner}>
                <Image
                  source={food1}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>Indian{"\n"}Cuisine</Text>
                  <Text style={styles.bannerSubtitle}>
                    Enjoy pure taste of your{"\n"}home-made delights
                  </Text>
                  <Text style={styles.bannerLink}>www.website.com</Text>
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
                  }}
                >
                  <Ionicons
                    name="restaurant"
                    size={24}
                    color={!isHostel ? "#fff" : "#004AAD"}
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
                  }}
                >
                  <Ionicons
                    name="business"
                    size={24}
                    color={isHostel ? "#fff" : "#004AAD"}
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

            {isHostel && (
              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Hostel Type</Text>
                    <TouchableOpacity style={styles.filterDropdown}>
                      <Text style={styles.filterValue}>{hostelType}</Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Area</Text>
                    <TouchableOpacity style={styles.filterDropdown}>
                      <Text style={styles.filterValue}>{area}</Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Max Rent (₹)</Text>
                    <TouchableOpacity style={styles.filterDropdown}>
                      <Text style={styles.filterValue}>{maxRent}</Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {searchQuery
                    ? "Search Results"
                    : isHostel
                    ? "Available Accommodations"
                    : "Available Tiffin Services"}
                </Text>
                {!isHostel && (
                  <TouchableOpacity
                    style={styles.vegToggle}
                    onPress={() => setIsVegOnly(!isVegOnly)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vegText}>Veg</Text>
                    <View
                      style={[
                        styles.vegSwitchContainer,
                        isVegOnly && styles.vegSwitchActive,
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

              {isHostel ? (
                <>
                  <Text style={styles.servicesCount}>
                    {searchQuery
                      ? `${filteredHostels.length} results found`
                      : `${hostels.length} properties found in ${userLocation}`}
                  </Text>
                  {filteredHostels.length > 0 ? (
                    filteredHostels.map((hostel: any) => (
                      <HostelCard
                        key={hostel.id}
                        hostel={hostel}
                        onPress={() => handleHostelPress(hostel)}
                        onBookPress={() => handleBookPress(hostel)}
                      />
                    ))
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search" size={50} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>
                        {`No hostels found matching "${searchQuery}"`}
                      </Text>
                      <Text style={styles.noResultsSubtext}>
                        Try searching with different keywords
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.servicesCount}>
                    {searchQuery || isVegOnly
                      ? `${filteredTiffinServices.length} results found`
                      : `${tiffinServices.length} services found in ${userLocation}`}
                  </Text>
                  {filteredTiffinServices.length > 0 ? (
                    filteredTiffinServices.map((service: any) => (
                      <TiffinCard
                        key={service.id}
                        service={service}
                        onPress={() => handleTiffinPress(service)}
                        onBookPress={() => handleBookPress(service)}
                      />
                    ))
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search" size={50} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>
                        {`No tiffin services found matching "${searchQuery}"`}
                      </Text>
                      <Text style={styles.noResultsSubtext}>
                        Try searching with different keywords
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {searchQuery && displayedItems.length > 0 && (
              <View style={styles.searchSuggestions}>
                <Text style={styles.suggestionTitle}>Popular Searches</Text>
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
                        <Text style={styles.suggestionTagText}>
                          Near College
                        </Text>
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
                    </>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelected={handleLocationSelected}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
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
    paddingHorizontal: 20,
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  searchContainerFocused: {
    backgroundColor: "#F0F4FF",
    borderColor: "#6B7EF5",
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "500",
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  banner: {
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
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
    paddingHorizontal: 20,
    marginTop: 20,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 6,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterValue: {
    fontSize: 14,
    color: "#1F2937",
  },
  servicesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
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
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  vegSwitchActive: {
    backgroundColor: "#10B981",
  },
  vegSwitchThumb: {
    width: 20,
    height: 20,
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
  searchSuggestions: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
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
});
