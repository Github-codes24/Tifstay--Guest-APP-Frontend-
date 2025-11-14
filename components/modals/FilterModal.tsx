import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import colors from "@/constants/colors";
// import mapBanner from "@/assets/images/image/mapBanner.png";
import Buttons from "@/components/Buttons";
import Dropdown from "@/components/Dropdown";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  isHostel: boolean;
  currentFilters?: any;
  cities?: string[];
  isLoadingCities?: boolean;
  hostelTypes?: string[];
  isLoadingHostelTypes?: boolean;
  roomTypes?: string[];
  isLoadingRoomTypes?: boolean;
  planTypes?: string[];
  isLoadingPlanTypes?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  isHostel,
  currentFilters = {},
  cities = [],
  isLoadingCities = false,
  hostelTypes = [],
  isLoadingHostelTypes = false,
  roomTypes = [],
  isLoadingRoomTypes = false,
  planTypes = [],
  isLoadingPlanTypes = false,
}) => {
  const { top } = useSafeAreaInsets();

  const [rating, setRating] = useState(currentFilters.rating || null);
  const [cost, setCost] = useState(currentFilters.cost || "");
  const [vegNonVeg, setVegNonVeg] = useState(currentFilters.vegNonVeg || "");
  const [location, setLocation] = useState(currentFilters.location || "");
  const [distance, setDistance] = useState(currentFilters.distance || 0);
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange || [0, 20000]);
  const [hostelType, setHostelType] = useState(currentFilters.hostelType || "");
  const [roomType, setRoomType] = useState(currentFilters.roomType || "");
  const [acNonAc, setAcNonAc] = useState(currentFilters.acNonAc || "");
  const [planType, setPlanType] = useState(currentFilters.planType || "");
  const [selectedAmenities, setSelectedAmenities] = useState(currentFilters.amenities || []);
  const [userReviews, setUserReviews] = useState(currentFilters.userReviews || null);

  const [ratingOptions, setRatingOptions] = useState<number[]>([]);
  const [costOptions, setCostOptions] = useState<string[]>([]);
  const [foodTypeOptions, setFoodTypeOptions] = useState<string[]>([]);
  const [isLoadingTiffinFilters, setIsLoadingTiffinFilters] = useState(false);

  const amenities = ["Wi-Fi", "Study Hall", "Security", "Mess", "Common TV", "Laundry"];
  const acNonAcOptions = ["AC", "Non-AC", "Both"];
  const locationOptions = useMemo(() => ["All", ...(Array.isArray(cities) ? cities : [])], [cities]);
  const hostelTypeOptions = useMemo(() => ["All", ...(Array.isArray(hostelTypes) ? hostelTypes : [])], [hostelTypes]);

  // Hardcoded room types as fallback
  // Only API values, empty array if nothing returned
  const roomTypeOptions = useMemo(() => {
    return Array.isArray(roomTypes) ? roomTypes : [];
  }, [roomTypes]);

  const isRoomTypeDropdownDisabled = roomTypeOptions.length === 0;


  const planTypeOptions = useMemo(() => ["All", ...(Array.isArray(planTypes) ? planTypes : [])], [planTypes]);



  // Debug logging for Room Type section
  useEffect(() => {
    console.log("FilterModal Room Type Debug:", {
      isLoadingRoomTypes,
      roomTypes,
      roomTypeOptions,
      visible,
      isHostel,
    });
  }, [isLoadingRoomTypes, roomTypes, roomTypeOptions, visible, isHostel]);

  // Fetch tiffin filter options
  useEffect(() => {
    if (!isHostel && visible && ratingOptions.length === 0) {
      setIsLoadingTiffinFilters(true);
      Promise.all([
        fetch("https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAverageRatingDropdown").then((res) =>
          res.json()
        ),
        fetch("https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getSortOrderDropdown").then((res) =>
          res.json()
        ),
        fetch("https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getFoodTypeDropdown").then((res) =>
          res.json()
        ),
      ])
        .then(([ratingRes, costRes, foodRes]) => {
          if (ratingRes.success) {
            setRatingOptions(ratingRes.data);
          }
          if (costRes.success) {
            setCostOptions(costRes.data);
          }
          if (foodRes.success) {
            setFoodTypeOptions(foodRes.data);
          }
          setIsLoadingTiffinFilters(false);
        })
        .catch((err) => {
          console.error("Error fetching tiffin filters:", err);
          setIsLoadingTiffinFilters(false);
        });
    }
  }, [isHostel, visible, ratingOptions.length]);

  const handleApplyFilters = () => {
    let filters: any = {};

    if (isHostel) {
      if (location && location !== "All") filters.location = location;
      if (distance > 0) filters.distance = distance;
      if (priceRange[0] > 0 || priceRange[1] < 20000) filters.priceRange = priceRange;
      if (hostelType && hostelType !== "All") filters.hostelType = hostelType;
      if (roomType && roomType !== "All") filters.roomType = roomType;
      if (acNonAc && acNonAc !== "All") filters.acNonAc = acNonAc;
      if (planType && planType !== "All") filters.planType = planType;
      if (selectedAmenities.length > 0) filters.amenities = selectedAmenities;
      if (userReviews) filters.userReviews = userReviews;
    } else {
      if (rating) filters.rating = rating;
      if (cost) filters.cost = cost;
      if (vegNonVeg) filters.vegNonVeg = vegNonVeg;
    }

    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    if (isHostel) {
      setLocation("");
      setDistance(0);
      setPriceRange([0, 20000]);
      setHostelType("");
      setRoomType("");
      setAcNonAc("");
      setPlanType("");
      setSelectedAmenities([]);
      setUserReviews(null);
    } else {
      setRating(null);
      setCost("");
      setVegNonVeg("");
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev: string[]) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header directly in container */}
        <View style={[styles.headerSafeArea, { paddingTop: top }]}>
          <View style={styles.headerContainer}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Filter</Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {isHostel ? (
              <>
                {/* Location */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Location*</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingCities && (!cities || cities.length === 0) ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : (
                      <Dropdown
                        options={locationOptions}
                        value={location || "All"}
                        onSelect={setLocation}
                        placeholder="Select Location"
                        disabled={isLoadingCities || locationOptions.length === 1}
                      />
                    )}
                    {!isLoadingCities && locationOptions.length === 1 && (
                      <Text style={styles.noDataText}>No locations available</Text>
                    )}
                  </View>
                </View>

                {/* Distance */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Distance*</Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderValue}>{distance.toFixed(1)} km</Text>
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

                {/* Plan Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Plan Type</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingPlanTypes && (!planTypes || planTypes.length === 0) ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : (
                      <Dropdown
                        options={planTypeOptions}
                        value={planType || "All"}
                        onSelect={setPlanType}
                        placeholder="Select Plan Type"
                        disabled={isLoadingPlanTypes || planTypeOptions.length === 1}
                      />
                    )}
                    {!isLoadingPlanTypes && planTypeOptions.length === 1 && (
                      <Text style={styles.noDataText}>No plan types available</Text>
                    )}
                  </View>
                </View>

                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Price Range*</Text>
                  <View style={styles.priceRangeContainer}>
                    <Text style={styles.priceText}>₹{Math.round(priceRange[0])}</Text>
                    <Text style={styles.priceText}>₹{Math.round(priceRange[1])}</Text>
                  </View>
                  <View style={styles.rangeSliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={20000}
                      value={priceRange[0]}
                      onValueChange={(value) => setPriceRange([value, priceRange[1]])}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor={colors.primary}
                    />
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={20000}
                      value={priceRange[1]}
                      onValueChange={(value) => setPriceRange([priceRange[0], value])}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor={colors.primary}
                    />
                  </View>
                </View>

                {/* Hostel Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Hostel Type</Text>
                  <View style={styles.relativeContainer}>
                    {isLoadingHostelTypes && (!hostelTypes || hostelTypes.length === 0) ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : (
                      <Dropdown
                        options={hostelTypeOptions}
                        value={hostelType || "All"}
                        onSelect={setHostelType}
                        placeholder="Select Hostel Type"
                        disabled={isLoadingHostelTypes || hostelTypeOptions.length === 1}
                      />
                    )}
                    {!isLoadingHostelTypes && hostelTypeOptions.length === 1 && (
                      <Text style={styles.noDataText}>No hostel types available</Text>
                    )}
                  </View>
                </View>

                {/* Room Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Max Bed Num</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingRoomTypes && (!roomTypes || roomTypes.length === 0) ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : (
                      <Dropdown
                        options={roomTypeOptions}
                        value={roomType || "All"}
                        onSelect={setRoomType}
                        placeholder="Select Room Type"
                        disabled={isLoadingRoomTypes || roomTypeOptions.length === 1}
                      />
                    )}
                    {!isLoadingRoomTypes && roomTypeOptions.length === 1 && (
                      <Text style={styles.noDataText}>No room types available</Text>
                    )}
                  </View>
                </View>

                {/* AC / Non-AC */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>AC / Non-AC</Text>
                  <View style={styles.relativeContainer}>
                    <Dropdown
                      options={acNonAcOptions}
                      value={acNonAc || "All"}
                      onSelect={setAcNonAc}
                      placeholder="Select AC/Non-AC"
                    />
                  </View>
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
                          selectedAmenities.includes(amenity) && styles.amenityButtonSelected,
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
                          color={selectedAmenities.includes(amenity) ? "#fff" : colors.primary}
                        />
                        <Text
                          style={[
                            styles.amenityText,
                            selectedAmenities.includes(amenity) && styles.amenityTextSelected,
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
                  <Text style={styles.filterTitle}>User Ratings*</Text>
                  <View style={styles.ratingContainer}>
                    {[3, 4].map((value) => (
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
                          color={userReviews === value ? "#fff" : "#666060"}
                        />
                        <Text
                          style={[
                            styles.ratingText,
                            userReviews === value && styles.ratingTextSelected,
                          ]}
                        >
                          {value} & above
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Non-Hostel filters */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>User Ratings*</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingTiffinFilters ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : ratingOptions.length === 0 ? (
                      <Text style={styles.noDataText}>No ratings available</Text>
                    ) : (
                      <View style={styles.ratingContainer}>
                        {ratingOptions.map((value) => (
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
                              size={17}
                              color={rating === value ? "#fff" : "#666060"}
                            />
                            <Text
                              style={[
                                styles.ratingText,
                                rating === value && styles.ratingTextSelected,
                              ]}
                            >
                              {value} & above
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cost</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingTiffinFilters ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : costOptions.length === 0 ? (
                      <Text style={styles.noDataText}>No cost options available</Text>
                    ) : (
                      <Dropdown
                        options={costOptions}
                        value={cost}
                        onSelect={setCost}
                        placeholder="Select Cost"
                        disabled={isLoadingTiffinFilters || costOptions.length === 0}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Food Type</Text>
                  <View style={{ position: "relative" }}>
                    {isLoadingTiffinFilters ? (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.dropdownLoader} />
                    ) : foodTypeOptions.length === 0 ? (
                      <Text style={styles.noDataText}>No food types available</Text>
                    ) : (
                      <Dropdown
                        options={foodTypeOptions}
                        value={vegNonVeg}
                        onSelect={setVegNonVeg}
                        placeholder="Select Veg/Non-veg"
                        disabled={isLoadingTiffinFilters || foodTypeOptions.length === 0}
                      />
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.bottomContainer}>
            <Buttons title="Apply Filter" onPress={handleApplyFilters} />
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
  // mapImage: {
  //   ...StyleSheet.absoluteFillObject,
  // },
  // mapContainer: {
  //   width: screenWidth,
  //   height: 337,
  // },
  headerSafeArea: {
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.title,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginLeft: 8,
  },
  resetText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  ratingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    alignItems: "center",
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  dropdownLoader: {
    position: "absolute",
    right: 16,
    top: "30%",
  },
  relativeContainer: {
    position: "relative",
  },
});

export default FilterModal;