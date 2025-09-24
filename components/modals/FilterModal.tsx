import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import colors from "@/constants/colors";
import mapBanner from "@/assets/images/image/mapBanner.png";
import Buttons from "@/components/Buttons";
import Dropdown from "@/components/Dropdown";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  isHostel: boolean;
  currentFilters?: any;
}

const { width: screenWidth } = Dimensions.get("window");

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  isHostel,
  currentFilters = {},
}) => {
  const { top } = useSafeAreaInsets();

  const [rating, setRating] = useState(currentFilters.rating || null);
  const [cost, setCost] = useState(currentFilters.cost || "");
  const [offers, setOffers] = useState(currentFilters.offers || "");
  const [cashback, setCashback] = useState(currentFilters.cashback || "");
  const [vegNonVeg, setVegNonVeg] = useState(currentFilters.vegNonVeg || "");
  const [cuisine, setCuisine] = useState(currentFilters.cuisine || "");

  const [location, setLocation] = useState(currentFilters.location || "");
  const [distance, setDistance] = useState(currentFilters.distance || 0);
  const [priceRange, setPriceRange] = useState(
    currentFilters.priceRange || [0, 20000]
  );
  const [hostelType, setHostelType] = useState(currentFilters.hostelType || "");
  const [roomType, setRoomType] = useState(currentFilters.roomType || "");
  const [acNonAc, setAcNonAc] = useState(currentFilters.acNonAc || "");
  const [selectedAmenities, setSelectedAmenities] = useState(
    currentFilters.amenities || []
  );
  const [userReviews, setUserReviews] = useState(
    currentFilters.userReviews || null
  );

  const amenities = [
    "Wi-Fi",
    "Study Hall",
    "Security",
    "Mess",
    "Common TV",
    "Laundry",
  ];

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
    let filters: any = {};

    if (isHostel) {
      if (location) filters.location = location;
      if (distance > 0) filters.distance = distance;
      if (priceRange[0] > 0 || priceRange[1] < 20000)
        filters.priceRange = priceRange;
      if (hostelType) filters.hostelType = hostelType;
      if (roomType) filters.roomType = roomType;
      if (acNonAc && acNonAc !== "") filters.acNonAc = acNonAc;
      if (selectedAmenities.length > 0) filters.amenities = selectedAmenities;
      if (userReviews) filters.userReviews = userReviews;
    } else {
      if (rating) filters.rating = rating;
      if (cost) filters.cost = cost;
      if (offers) filters.offers = offers;
      if (cashback) filters.cashback = cashback;
      if (vegNonVeg) filters.vegNonVeg = vegNonVeg;
      if (cuisine) filters.cuisine = cuisine;
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
      setSelectedAmenities([]);
      setUserReviews(null);
    } else {
      setRating(null);
      setCost("");
      setOffers("");
      setCashback("");
      setVegNonVeg("");
      setCuisine("");
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
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <Image
            style={styles.mapImage}
            source={mapBanner}
            resizeMode="cover"
          />
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
        </View>

        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {isHostel ? (
              <>
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Location*</Text>
                  <Dropdown
                    options={locationOptions}
                    value={location}
                    onSelect={setLocation}
                    placeholder="Select Location"
                  />
                </View>

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

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Hostel Type</Text>
                  <Dropdown
                    options={hostelTypeOptions}
                    value={hostelType}
                    onSelect={setHostelType}
                    placeholder="Select"
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Room-Type</Text>
                  <Dropdown
                    options={roomTypeOptions}
                    value={roomType}
                    onSelect={setRoomType}
                    placeholder="Select"
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>AC / Non-AC</Text>
                  <Dropdown
                    options={acNonAcOptions}
                    value={acNonAc}
                    onSelect={setAcNonAc}
                    placeholder="Select"
                  />
                </View>

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

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cost</Text>
                  <Dropdown
                    options={costOptions}
                    value={cost}
                    onSelect={setCost}
                    placeholder="Select"
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Offers</Text>
                  <Dropdown
                    options={offerOptions}
                    value={offers}
                    onSelect={setOffers}
                    placeholder="Select Offer"
                    numberOfLines={1}
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cashback</Text>
                  <Dropdown
                    options={cashbackOptions}
                    value={cashback}
                    onSelect={setCashback}
                    placeholder="Select Cashback"
                    numberOfLines={1}
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Veg/Non-veg</Text>
                  <Dropdown
                    options={vegNonVegOptions}
                    value={vegNonVeg}
                    onSelect={setVegNonVeg}
                    placeholder="Select"
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Cuisine</Text>
                  <Dropdown
                    options={cuisineOptions}
                    value={cuisine}
                    onSelect={setCuisine}
                    placeholder="Select"
                  />
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
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mapContainer: {
    width: screenWidth,
    height: 337,
  },
  headerSafeArea: {},
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
    alignItems: "center",
    marginBottom: 20,
  },
});

export default FilterModal;
