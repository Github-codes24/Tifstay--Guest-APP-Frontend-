import React, { useState } from "react";
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
import LocationModal from "../../components/LocationModal";

export default function DashboardScreen() {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [userLocation, setUserLocation] = useState("Nagpur, Maharashtra");
  const [searchQuery, setSearchQuery] = useState("");

  const tiffinServices = [
    {
      id: 1,
      name: "Maharashtrian Ghar Ka Khana",
      description:
        "Authentic Maharashtrian home-style cooking with fresh ingredients",
      price: "₹120/meal",
      oldPrice: "₹3200/month",
      rating: 4.7,
      reviews: 150,
      image: require("../../assets/images/food1.png"), // Add your images
      tags: ["Veg"],
      timing: "12:00 PM - 2:00 PM",
      location: "Dharampeth",
    },
    // Add more services as needed
  ];

  const handleLocationSelected = (location: any) => {
    setShowLocationModal(false);
    // Handle location data
    console.log("Location selected:", location);
  };

  const navigateToService = (type: "tiffin" | "hostels") => {
    router.push(`/(secure)/(${type})`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="home" size={20} color="#000" />
          <Text style={styles.locationText}>Home Location</Text>
          <Ionicons name="chevron-down" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.locationSubtext}>{userLocation}</Text>

        <TouchableOpacity style={styles.profileButton}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search for tiffin services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <TouchableOpacity>
            <Ionicons name="mic" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#004AAD" />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={require("../../assets/images/food-tray.png")}
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

        {/* Service Selection */}
        <View style={styles.serviceSection}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
          <View style={styles.serviceButtons}>
            <TouchableOpacity
              style={[styles.serviceButton, styles.tiffinButton]}
              onPress={() => navigateToService("tiffin")}
            >
              <Ionicons name="restaurant" size={24} color="#fff" />
              <Text style={styles.serviceButtonText}>Tiffin/Restaurants</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.serviceButton, styles.hostelsButton]}
              onPress={() => navigateToService("hostels")}
            >
              <Ionicons name="business" size={24} color="#004AAD" />
              <Text style={[styles.serviceButtonText, { color: "#004AAD" }]}>
                PG/Hostels
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Services */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Tiffin Services</Text>
            <TouchableOpacity style={styles.vegToggle}>
              <Text style={styles.vegText}>Veg</Text>
              <View style={styles.vegSwitch} />
            </TouchableOpacity>
          </View>
          <Text style={styles.servicesCount}>
            {tiffinServices.length} services found in {userLocation}
          </Text>

          {tiffinServices.map((service) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard}>
              <Image source={service.image} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFA500" />
                    <Text style={styles.rating}>{service.rating}</Text>
                    <Text style={styles.reviews}>({service.reviews})</Text>
                  </View>
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{service.price}</Text>
                  <Text style={styles.oldPrice}>{service.oldPrice}</Text>
                  <View style={styles.discount}>
                    <Text style={styles.discountText}>10% OFF</Text>
                  </View>
                </View>
                <View style={styles.serviceFooter}>
                  <View style={styles.tagContainer}>
                    {service.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.timingContainer}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.location}>{service.location}</Text>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.timing}>{service.timing}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Location Modal */}
      <LocationModal
        visible={showLocationModal}
        onClose={() => router.back()}
        onLocationSelected={handleLocationSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    position: "absolute",
    right: 20,
    top: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  tiffinButton: {
    backgroundColor: "#004AAD",
  },
  hostelsButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  servicesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
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
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  serviceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviews: {
    fontSize: 12,
    color: "#6B7280",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  oldPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discount: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 4,
  },
  tag: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "500",
  },
  timingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
  },
  timing: {
    fontSize: 12,
    color: "#6B7280",
  },
  bookButton: {
    backgroundColor: "#004AAD",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  bookButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
