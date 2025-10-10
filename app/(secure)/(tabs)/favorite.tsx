import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import { useRouter, useFocusEffect } from "expo-router";
import { useFavorites } from "@/context/FavoritesContext"; // Context for favorites updates

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoritesUpdated } = useFavorites(); // toggled when favorites change
  const [hostelFavorites, setHostelFavorites] = useState<any[]>([]);
  const [tiffinFavorites, setTiffinFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTiffinPress = (service: any) => {
    router.navigate(`/tiffin-details/${service.id}`);
  };

  const handleHostelPress = (hostel: any) => {
    router.navigate(`/hostel-details/${hostel.id}`);
  };

  const handleBookPress = (item: any) => {};

  // Map API tiffin object to TiffinCard props
  const mapTiffinService = (item: any) => ({
    id: item._id || item.id,
    name: item.tiffinName || "No Name",
    description: item.description || "No description available",
    photos: item.photos || [],
    rating: item.averageRating || 0,
    reviews: item.totalReviews || 0,
    foodType: item.foodType || "Both",
    mealTimings: item.mealTimings || [],
    location: item.location || {},
    pricing: item.pricing || [],
    tags: item.foodType ? [item.foodType] : ["Both"],
    image:
      item.photos && item.photos.length > 0 ? { uri: item.photos[0] } : undefined,
    price: item.pricing?.[0]?.perMealDelivery
      ? `${item.pricing[0].perMealDelivery}/meal`
      : "-",
    oldPrice: item.pricing?.[0]?.perMealDining
      ? `${item.pricing[0].perMealDining}/meal`
      : "-",
    timing: item.mealTimings?.[0]
      ? `${item.mealTimings[0].startTime} - ${item.mealTimings[0].endTime}`
      : "-",
  });

  const mapHostelService = (item: any) => ({
    id: item._id || item.id,
    name: item.hostelName || 'Unknown Hostel',
    type: item.type || 'Hostel',
    description: item.description || 'No description available',
    image:
      item.photos && item.photos.length > 0 ? { uri: item.photos[0] } : undefined,
    price: item.pricing?.[0]?.monthlyRent ? `₹${item.pricing[0].monthlyRent}/month` : "-",
    oldPrice: "-",
    rating: item.averageRating || 0,
    reviews: item.totalReviews || 0,
    amenities: item.amenities || [],
    location: item.location?.address || 'Unknown Location',
    availableBeds: item.availableBeds || 0,
    deposit: item.deposit || '₹15000',
  });

 // FavoritesScreen.tsx
const fetchFavorites = async () => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // Fetch favorite tiffin IDs
    const tiffinFavRes = await fetch(
      "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getFavouriteTiffinServices",
      { method: "GET", headers }
    );
    if (!tiffinFavRes.ok) {
      console.error(`Failed to fetch tiffin favorites: ${tiffinFavRes.status} ${tiffinFavRes.statusText}`);
    } else {
      const tiffinFavJson = await tiffinFavRes.json();
      const tiffinFavoriteIds = tiffinFavJson.data?.map((f: any) => f._id) || [];

      // Fetch all tiffin services (so we get full description)
      const allTiffinRes = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAllTiffinServices",
        { method: "GET", headers }
      );
      if (!allTiffinRes.ok) {
        console.error(`Failed to fetch all tiffin services: ${allTiffinRes.status} ${allTiffinRes.statusText}`);
      } else {
        const allTiffinJson = await allTiffinRes.json();

        // Filter only favorite tiffins
        const favoriteTiffinsFull = allTiffinJson.data
          .filter((t: any) => tiffinFavoriteIds.includes(t._id))
          .map(mapTiffinService);

        setTiffinFavorites(favoriteTiffinsFull);
        console.log(`Tiffin favorites loaded: ${favoriteTiffinsFull.length}`);
      }
    }

    // Fetch favorite hostels directly (assuming it returns full data)
    const hostelFavRes = await fetch(
      "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getFavouriteHostelServices",
      { method: "GET", headers }
    );
    if (!hostelFavRes.ok) {
      console.error(`Failed to fetch hostel favorites: ${hostelFavRes.status} ${hostelFavRes.statusText}`);
      setHostelFavorites([]);
      console.log("Hostel favorites: 0 (endpoint error)");
    } else {
      const hostelFavJson = await hostelFavRes.json();
      const favoriteHostelsFull = hostelFavJson.data?.map(mapHostelService) || [];
      setHostelFavorites(favoriteHostelsFull);
      console.log(`Hostel favorites loaded: ${favoriteHostelsFull.length}`);
    }
  } catch (err) {
    console.log("❌ Error fetching favorites:", err);
  } finally {
    setLoading(false);
  }
};


  // Refetch favorites whenever they are updated
  useEffect(() => {
    fetchFavorites();
  }, [favoritesUpdated]);

  const hasFavorites = tiffinFavorites.length > 0 || hostelFavorites.length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            Your saved tiffin services and hostels
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.headerSubtitle}>
          Your saved tiffin services and hostels
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!hasFavorites ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Start adding your favorite tiffin services and hostels
            </Text>
          </View>
        ) : (
          <>
            {tiffinFavorites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tiffin Services</Text>
                {tiffinFavorites.map((item) => (
                  <TiffinCard
                    key={item.id}
                    service={item}
                    onPress={() => handleTiffinPress(item)}
                    onBookPress={() => handleBookPress(item)}
                  />
                ))}
              </View>
            )}

            {hostelFavorites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hostels & PGs</Text>
                {hostelFavorites.map((item) => (
                  <HostelCard
                    key={item.id}
                    hostel={item}
                    onPress={() => handleHostelPress(item)}
                    onBookPress={() => handleBookPress(item)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#374151", marginTop: 24, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A1A", marginBottom: 16 },
});