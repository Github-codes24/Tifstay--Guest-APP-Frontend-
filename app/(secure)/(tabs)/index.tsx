import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LocationModal from "@/components/LocationModal";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import { food1 } from "@/assets/images";
import demoData from "@/data/demoData.json";

// Import images mapping
const imageMapping: { [key: string]: any } = {
  food1: food1,
  hostel1: require("../../../assets/images/hostel1.png"),
};

export default function DashboardScreen() {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [userLocation, setUserLocation] = useState("Nagpur, Maharashtra");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);

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
    if (!searchQuery.trim()) return tiffinServices;

    const query = searchQuery.toLowerCase();
    return tiffinServices.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.location.toLowerCase().includes(query) ||
        service.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, tiffinServices]);

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
  };

  const handleHostelPress = (hostel: any) => {
    console.log("Hostel pressed:", hostel);
  };

  const handleBookPress = (item: any) => {
    console.log("Book pressed:", item);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const displayedItems = isHostel ? filteredHostels : filteredTiffinServices;
  const totalItems = isHostel ? hostels.length : tiffinServices.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Fixed Header */}
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
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder={
              isHostel
                ? "Search for hostels, locations, amenities..."
                : "Search for tiffin services, cuisines..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Ionicons name="mic" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#004AAD" />
          </TouchableOpacity>
        </View>

        {!searchQuery && (
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
                Tiffin/ Restaurants
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

        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery
                ? "Search Results"
                : isHostel
                ? "Available Hostels"
                : "Available Tiffin Services"}
            </Text>
            {!isHostel && (
              <TouchableOpacity style={styles.vegToggle}>
                <Text style={styles.vegText}>Veg</Text>
                <View style={styles.vegSwitch} />
              </TouchableOpacity>
            )}
          </View>

          {isHostel ? (
            <>
              <Text style={styles.servicesCount}>
                {searchQuery
                  ? `${filteredHostels.length} results found`
                  : `${hostels.length} hostels found in ${userLocation}`}
              </Text>
              {filteredHostels.length > 0 ? (
                filteredHostels.map((hostel) => (
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
                {searchQuery
                  ? `${filteredTiffinServices.length} results found`
                  : `${tiffinServices.length} services found in ${userLocation}`}
              </Text>
              {filteredTiffinServices.length > 0 ? (
                filteredTiffinServices.map((service) => (
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
                    <Text style={styles.suggestionTagText}>Near College</Text>
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
                    <Text style={styles.suggestionTagText}>Maharashtrian</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
  filterButton: {
    marginLeft: 12,
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
    color: "#1B5E20",
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "#2E7D32",
    marginTop: 4,
  },
  bannerLink: {
    fontSize: 12,
    color: "#388E3C",
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
    backgroundColor: "#004AAD",
    borderColor: "#004AAD",
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#004AAD",
  },
  serviceButtonTextSelected: {
    color: "#fff",
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
    fontSize: 14,
    fontWeight: "500",
  },
  vegSwitch: {
    width: 40,
    height: 24,
    backgroundColor: "#10B981",
    borderRadius: 12,
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
