// 📁 components/ProductDetails.tsx (Favorites Screen) — unchanged except pathname fix + logs
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import { useFavorites } from "@/context/FavoritesContext";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoritesUpdated } = useFavorites();

  const [hostelFavorites, setHostelFavorites] = useState<any[]>([]);
  const [tiffinFavorites, setTiffinFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧭 Navigate to details with ID + type
  const handleTiffinPress = (service: any) => {
    console.log('Navigating to tiffin details:', { id: service.id, type: "tiffin" }); // Debug: Check if press fires
    router.push({
      pathname: "/details/[id]",
      params: { id: service.id, type: "tiffin" },
    });
  };

  const handleHostelPress = (hostel: any) => {
    console.log('Navigating to hostel details:', { id: hostel.id, type: "hostel" }); // Debug: Check if press fires
    router.push({
      pathname: "/details/[id]",
      params: { id: hostel.id, type: "hostel" },
    });
  };

  // 🧾 Optional — Navigate to booking screen (FIX: Changed to "/bookingScreen" to match your routes)
  const handleBookPress = (item: any) => {
    console.log('Navigating to booking:', { id: item.id, serviceType: item.serviceType }); // Debug
    router.push({
      pathname: "/bookingScreen",  // ✅ Matches your existing route in children list
      params: {
        id: item.id,
        serviceType: item.serviceType,
      },
    });
  };

  // 🥘 Map Tiffin Service data
  const mapTiffinService = (item: any) => ({
    id: item._id || item.id,
    serviceType: "tiffin",
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

  // 🏠 Map Hostel data
  const mapHostelService = (item: any) => ({
    id: item._id || item.id,
    serviceType: "hostel",
    name: item.hostelName || "Unknown Hostel",
    type: item.type || "Hostel",
    description: item.description || "No description available",
    image:
      item.photos && item.photos.length > 0 ? { uri: item.photos[0] } : undefined,
    price: item.pricing?.[0]?.monthlyRent
      ? `₹${item.pricing[0].monthlyRent}/month`
      : "-",
    oldPrice: "-",
    rating: item.averageRating || 0,
    reviews: item.totalReviews || 0,
    amenities: item.amenities || [],
    location: item.location?.address || "Unknown Location",
    availableBeds: item.availableBeds || 0,
    deposit: item.deposit || "₹15000",
  });

  // 📡 Fetch Favorites
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setHostelFavorites([]);
        setTiffinFavorites([]);
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 🥘 Tiffin Favorites
      const tiffinFavRes = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getFavouriteTiffinServices",
        { method: "GET", headers }
      );

      if (tiffinFavRes.ok) {
        const tiffinFavJson = await tiffinFavRes.json();
        const tiffinFavoriteIds = tiffinFavJson.data?.map((f: any) => f._id) || [];

        const allTiffinRes = await fetch(
          "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getAllTiffinServices",
          { method: "GET", headers }
        );

        if (allTiffinRes.ok) {
          const allTiffinJson = await allTiffinRes.json();
          const favoriteTiffinsFull = allTiffinJson.data
            .filter((t: any) => tiffinFavoriteIds.includes(t._id))
            .map(mapTiffinService);

          setTiffinFavorites(favoriteTiffinsFull);
        } else {
          console.error("❌ Failed to fetch all tiffin services");
        }
      } else {
        console.error("❌ Failed to fetch tiffin favorites");
      }

      // 🏠 Hostel Favorites
      const hostelFavRes = await fetch(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getFavouriteHostelServices",
        { method: "GET", headers }
      );

      if (hostelFavRes.ok) {
        const hostelFavJson = await hostelFavRes.json();
        const favoriteHostelsFull = hostelFavJson.data?.map(mapHostelService) || [];
        setHostelFavorites(favoriteHostelsFull);
      } else {
        console.error("❌ Failed to fetch hostel favorites");
        setHostelFavorites([]);
      }
    } catch (err) {
      console.log("❌ Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔁 Re-fetch when favorites update
  useEffect(() => {
    fetchFavorites();
  }, [favoritesUpdated, fetchFavorites]);

  // ⏪ Re-fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
});