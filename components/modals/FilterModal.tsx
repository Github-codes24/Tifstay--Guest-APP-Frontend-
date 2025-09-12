import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
// import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Header from "../Header";
import colors from "@/constants/colors";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  isHostel: boolean;
  currentFilters?: any;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  isHostel,
  currentFilters = {},
}) => {
  // Tiffin Filters
  const [rating, setRating] = useState(currentFilters.rating || 4.5);
  const [cost, setCost] = useState(currentFilters.cost || "Low to High");
  const [offers, setOffers] = useState(
    currentFilters.offers || "Get 10% OFF on your first tiffin order"
  );
  const [cashback, setCashback] = useState(
    currentFilters.cashback || "Get ₹50 cashback on UPI payment"
  );
  const [vegNonVeg, setVegNonVeg] = useState(currentFilters.vegNonVeg || "Veg");
  const [cuisine, setCuisine] = useState(currentFilters.cuisine || "Roti");

  // Hostel Filters
  const [location, setLocation] = useState(currentFilters.location || "Nagpur");
  const [distance, setDistance] = useState(currentFilters.distance || 2);
  const [priceRange, setPriceRange] = useState(
    currentFilters.priceRange || [5000, 12000]
  );
  const [hostelType, setHostelType] = useState(
    currentFilters.hostelType || "Boys"
  );
  const [roomType, setRoomType] = useState(currentFilters.roomType || "Single");
  const [acNonAc, setAcNonAc] = useState(currentFilters.acNonAc || "Select");
  const [selectedAmenities, setSelectedAmenities] = useState(
    currentFilters.amenities || []
  );
  const [userReviews, setUserReviews] = useState(
    currentFilters.userReviews || 4.5
  );

  const amenities = [
    "Wi-Fi",
    "Study Hall",
    "Security",
    "Mess",
    "Common TV",
    "Laundry",
  ];

  const handleApplyFilters = () => {
    const filters = isHostel
      ? {
          location,
          distance,
          priceRange,
          hostelType,
          roomType,
          acNonAc,
          amenities: selectedAmenities,
          userReviews,
        }
      : {
          rating,
          cost,
          offers,
          cashback,
          vegNonVeg,
          cuisine,
        };

    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    if (isHostel) {
      setLocation("Nagpur");
      setDistance(2);
      setPriceRange([5000, 12000]);
      setHostelType("Boys");
      setRoomType("Single");
      setAcNonAc("Select");
      setSelectedAmenities([]);
      setUserReviews(4.5);
    } else {
      setRating(4.5);
      setCost("Low to High");
      setOffers("Get 10% OFF on your first tiffin order");
      setCashback("Get ₹50 cashback on UPI payment");
      setVegNonVeg("Veg");
      setCuisine("Roti");
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev: string[]) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title="Filter"
          onBack={onClose}
          rightContent={
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Map Section - Common for both */}
          {/* <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 21.1458,
                longitude: 79.0882,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            />
          </View> */}

          {isHostel ? (
            // Hostel Filters
            <>
              {/* Location */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Location*</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{location}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Distance */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Distance*</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>{distance} km</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={10}
                    value={distance}
                    onValueChange={setDistance}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={colors.primary}
                  />
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Price Range*</Text>
                <View style={styles.priceRangeContainer}>
                  <Text style={styles.priceText}>₹{priceRange[0]}</Text>
                  <Text style={styles.priceText}>₹{priceRange[1]}</Text>
                </View>
                <View style={styles.rangeSliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={20000}
                    value={priceRange[0]}
                    onValueChange={(value) =>
                      setPriceRange([value, priceRange[1]])
                    }
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={colors.primary}
                  />
                </View>
              </View>

              {/* Hostel Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Hostel Type</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{hostelType}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Room Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Room-Type</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{roomType}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* AC/Non-AC */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>AC / Non-AC</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{acNonAc}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Amenities */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {amenities.map((amenity) => (
                    <TouchableOpacity
                      key={amenity}
                      style={[
                        styles.amenityButton,
                        selectedAmenities.includes(amenity) &&
                          styles.amenityButtonSelected,
                      ]}
                      onPress={() => toggleAmenity(amenity)}
                    >
                      <Ionicons
                        name={
                          amenity === "Wi-Fi"
                            ? "wifi"
                            : amenity === "Study Hall"
                            ? "book"
                            : amenity === "Security"
                            ? "shield-checkmark"
                            : amenity === "Mess"
                            ? "restaurant"
                            : amenity === "Common TV"
                            ? "tv"
                            : "shirt"
                        }
                        size={20}
                        color={
                          selectedAmenities.includes(amenity)
                            ? "#fff"
                            : colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.amenityText,
                          selectedAmenities.includes(amenity) &&
                            styles.amenityTextSelected,
                        ]}
                      >
                        {amenity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* User Reviews */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>User Reviews*</Text>
                <View style={styles.ratingContainer}>
                  {[3.5, 3.8, 4.2, 4.5, 4.8, 5.0].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.ratingButton,
                        userReviews === value && styles.ratingButtonSelected,
                      ]}
                      onPress={() => setUserReviews(value)}
                    >
                      <Text
                        style={[
                          styles.ratingText,
                          userReviews === value && styles.ratingTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            // Tiffin Filters
            <>
              {/* User Ratings */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>User Ratings*</Text>
                <View style={styles.ratingContainer}>
                  {[3.5, 3.8, 4.2, 4.5, 4.8, 5.0].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.ratingButton,
                        rating === value && styles.ratingButtonSelected,
                      ]}
                      onPress={() => setRating(value)}
                    >
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text
                        style={[
                          styles.ratingText,
                          rating === value && styles.ratingTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cost */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Cost</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{cost}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Offers */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Offers</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {offers}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Cashback */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Cashback</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {cashback}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Veg/Non-veg */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Veg/Non-veg</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{vegNonVeg}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Cuisine */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Cuisine</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{cuisine}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  resetText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  map: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    gap: 4,
  },
  ratingButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  ratingTextSelected: {
    color: "#fff",
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  priceRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  rangeSliderContainer: {
    marginTop: 8,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#F0F4FF",
    gap: 6,
  },
  amenityButtonSelected: {
    backgroundColor: colors.primary,
  },
  amenityText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  amenityTextSelected: {
    color: "#fff",
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default FilterModal;
