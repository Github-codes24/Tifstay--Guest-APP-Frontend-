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
import LocationModal from "@/components/LocationModal";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import { food1, foodTray } from "@/assets/images";

export default function DashboardScreen() {
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [userLocation, setUserLocation] = useState("Nagpur, Maharashtra");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHostel, setIsHostel] = useState(false);

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
      image: food1,
      tags: ["Veg"],
      timing: "12:00 PM - 2:00 PM",
      location: "Dharampeth",
    },
    // Add more services as needed
  ];

  const hostels = [
    {
      id: 1,
      name: "Green Valley Boys Hostel",
      type: "Boys Hostel",
      location: "Near KNT, Medical College",
      price: "₹5000/month",
      rating: 4.7,
      amenities: ["WiFi", "Mess", "Security", "Laundry"],
      image: require("../../../assets/images/hostel1.png"),
    },
    // Add more hostels
  ];

  const handleLocationSelected = (location: any) => {
    setShowLocationModal(false);
    console.log("Location selected:", location);
  };

  const handleTiffinPress = (service: any) => {
    // Navigate to tiffin detail screen
    console.log("Tiffin pressed:", service);
  };

  const handleHostelPress = (hostel: any) => {
    // Navigate to hostel detail screen
    console.log("Hostel pressed:", hostel);
  };

  const handleBookPress = (item: any) => {
    // Handle booking
    console.log("Book pressed:", item);
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder={
              isHostel
                ? "Search for hostels..."
                : "Search for tiffin services..."
            }
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

        <View style={styles.banner}>
          <Image
            source={foodTray}
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

        <View style={styles.serviceSection}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
          <View style={styles.serviceButtons}>
            <TouchableOpacity
              style={[
                styles.serviceButton,
                !isHostel && styles.serviceButtonSelected,
              ]}
              onPress={() => setIsHostel(false)}
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
              onPress={() => setIsHostel(true)}
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
              {isHostel ? "Available Hostels" : "Available Tiffin Services"}
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
                {hostels.length} hostels found in {userLocation}
              </Text>
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  onPress={() => handleHostelPress(hostel)}
                  onBookPress={() => handleBookPress(hostel)}
                />
              ))}
            </>
          ) : (
            <>
              <Text style={styles.servicesCount}>
                {tiffinServices.length} services found in {userLocation}
              </Text>
              {tiffinServices.map((service) => (
                <TiffinCard
                  key={service.id}
                  service={service}
                  onPress={() => handleTiffinPress(service)}
                  onBookPress={() => handleBookPress(service)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
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
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serviceButtonSelected: {
    backgroundColor: "#004AAD",
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
});
