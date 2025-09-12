import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import colors from "@/constants/colors";
import mapBanner from "@/assets/images/image/mapBanner.png";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  isHostel: boolean;
  currentFilters?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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

  // Dropdown states
  const [showCostDropdown, setShowCostDropdown] = useState(false);
  const [showOffersDropdown, setShowOffersDropdown] = useState(false);
  const [showCashbackDropdown, setShowCashbackDropdown] = useState(false);
  const [showVegNonVegDropdown, setShowVegNonVegDropdown] = useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showHostelTypeDropdown, setShowHostelTypeDropdown] = useState(false);
  const [showRoomTypeDropdown, setShowRoomTypeDropdown] = useState(false);
  const [showAcNonAcDropdown, setShowAcNonAcDropdown] = useState(false);

  const amenities = [
    "Wi-Fi",
    "Study Hall",
    "Security",
    "Mess",
    "Common TV",
    "Laundry",
  ];

  // Dropdown options
  const costOptions = ["Low to High", "High to Low"];
  const offerOptions = [
    "Get 10% OFF on your first tiffin order",
    "Get 20% OFF on monthly subscription",
    "Buy 1 Get 1 Free",
  ];
  const cashbackOptions = [
    "Get ₹50 cashback on UPI payment",
    "Get ₹100 cashback on first order",
    "Get 5% cashback on all orders",
  ];
  const vegNonVegOptions = ["Veg", "Non-Veg", "Both"];
  const cuisineOptions = [
    "Roti",
    "Rice",
    "South Indian",
    "North Indian",
    "Chinese",
  ];
  const locationOptions = ["Nagpur", "Mumbai", "Pune", "Delhi", "Bangalore"];
  const hostelTypeOptions = ["Boys", "Girls", "Co-ed"];
  const roomTypeOptions = ["Single", "Double", "Triple", "Dormitory"];
  const acNonAcOptions = ["AC", "Non-AC", "Both"];

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

  const closeAllDropdowns = () => {
    setShowCostDropdown(false);
    setShowOffersDropdown(false);
    setShowCashbackDropdown(false);
    setShowVegNonVegDropdown(false);
    setShowCuisineDropdown(false);
    setShowLocationDropdown(false);
    setShowHostelTypeDropdown(false);
    setShowRoomTypeDropdown(false);
    setShowAcNonAcDropdown(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Map Image - Positioned absolutely to cover header area */}
        <Image source={mapBanner} style={styles.mapImage} resizeMode="cover" />

        {/* Header with transparent background */}
        <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Filter</Text>

            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {isHostel ? (
              // Hostel Filters
              <>
                {/* Location */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Location*</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowLocationDropdown(!showLocationDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{location}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showLocationDropdown && (
                    <View style={styles.dropdownList}>
                      {locationOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setLocation(option);
                            setShowLocationDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              location === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Distance */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Distance*</Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderValue}>
                      {distance.toFixed(1)} km
                    </Text>
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
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>0 km</Text>
                      <Text style={styles.sliderLabel}>10 km</Text>
                    </View>
                  </View>
                </View>

                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Price Range*</Text>
                  <View style={styles.priceRangeContainer}>
                    <Text style={styles.priceText}>
                      ₹{Math.round(priceRange[0])}
                    </Text>
                    <Text style={styles.priceText}>
                      ₹{Math.round(priceRange[1])}
                    </Text>
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
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowHostelTypeDropdown(!showHostelTypeDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{hostelType}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showHostelTypeDropdown && (
                    <View style={styles.dropdownList}>
                      {hostelTypeOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setHostelType(option);
                            setShowHostelTypeDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              hostelType === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Room Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Room-Type</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowRoomTypeDropdown(!showRoomTypeDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{roomType}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showRoomTypeDropdown && (
                    <View style={styles.dropdownList}>
                      {roomTypeOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setRoomType(option);
                            setShowRoomTypeDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              roomType === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* AC/Non-AC */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>AC / Non-AC</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowAcNonAcDropdown(!showAcNonAcDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{acNonAc}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showAcNonAcDropdown && (
                    <View style={styles.dropdownList}>
                      {acNonAcOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setAcNonAc(option);
                            setShowAcNonAcDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              acNonAc === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
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
                        <Ionicons
                          name="star"
                          size={12}
                          color={userReviews === value ? "#fff" : "#FFB800"}
                        />
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
                        <Ionicons
                          name="star"
                          size={12}
                          color={rating === value ? "#fff" : "#FFB800"}
                        />
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
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowCostDropdown(!showCostDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{cost}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showCostDropdown && (
                    <View style={styles.dropdownList}>
                      {costOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCost(option);
                            setShowCostDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              cost === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Offers */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Offers</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowOffersDropdown(!showOffersDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {offers}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showOffersDropdown && (
                    <View style={styles.dropdownList}>
                      {offerOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setOffers(option);
                            setShowOffersDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              offers === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Cashback */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cashback</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowCashbackDropdown(!showCashbackDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {cashback}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showCashbackDropdown && (
                    <View style={styles.dropdownList}>
                      {cashbackOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCashback(option);
                            setShowCashbackDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              cashback === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Veg/Non-veg */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Veg/Non-veg</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowVegNonVegDropdown(!showVegNonVegDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{vegNonVeg}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showVegNonVegDropdown && (
                    <View style={styles.dropdownList}>
                      {vegNonVegOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setVegNonVeg(option);
                            setShowVegNonVegDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              vegNonVeg === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Cuisine */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cuisine</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      closeAllDropdowns();
                      setShowCuisineDropdown(!showCuisineDropdown);
                    }}
                  >
                    <Text style={styles.dropdownText}>{cuisine}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showCuisineDropdown && (
                    <View style={styles.dropdownList}>
                      {cuisineOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCuisine(option);
                            setShowCuisineDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              cuisine === option &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: screenWidth,
    height: 250,
  },
  headerSafeArea: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  resetText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    marginTop: 200,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    position: "relative",
    zIndex: 1,
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
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1F2937",
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
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
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#6B7280",
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
    backgroundColor: "#fff",
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
