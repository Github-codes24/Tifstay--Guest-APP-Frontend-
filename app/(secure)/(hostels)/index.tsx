import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HostelsScreen() {
  const router = useRouter();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PG/Hostels</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {hostels.map((hostel) => (
          <TouchableOpacity key={hostel.id} style={styles.hostelCard}>
            <Image source={hostel.image} style={styles.hostelImage} />
            <View style={styles.hostelInfo}>
              <Text style={styles.hostelName}>{hostel.name}</Text>
              <View style={styles.typeTag}>
                <Text style={styles.typeText}>{hostel.type}</Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.locationText}>{hostel.location}</Text>
              </View>
              <View style={styles.amenitiesRow}>
                {hostel.amenities.slice(0, 3).map((amenity) => (
                  <View key={amenity} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{hostel.price}</Text>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  hostelCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  hostelImage: {
    width: "100%",
    height: 200,
  },
  hostelInfo: {
    padding: 16,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: "#4338CA",
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
  },
  amenitiesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  amenityTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amenityText: {
    fontSize: 12,
    color: "#4B5563",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#004AAD",
  },
  bookButton: {
    backgroundColor: "#004AAD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
