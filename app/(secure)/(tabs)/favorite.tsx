// 📁 components/FavoritesScreen.tsx
// ✅ Instant optimistic add + remove updates
// ✅ Auto refresh on screen focus + Pull to Refresh
// ✅ React Query caching + Expo Router navigation

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useFavorites } from "@/context/FavoritesContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import Toast from "react-native-toast-message";
import { BASE_URL } from "@/constants/api";

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { favoritesUpdated, removeFromFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const getToken = async () => await AsyncStorage.getItem("token");

  // ==================== FETCH QUERIES ====================
  const { data: hostelFavorites = [], isLoading: hostelLoading } = useQuery({
    queryKey: ["favoriteHostels", favoritesUpdated],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      try {
        const response = await fetch(
          `${BASE_URL}/api/guest/hostelServices/getFavouriteHostelServices`,
          { method: "GET", headers }
        );
        if (!response.ok) return [];
        const result = await response.json();
        return (result.data || []).map(mapHostelService);
      } catch (err) {
        console.error("Error fetching favorite hostels:", err);
        return [];
      }
    },
  });

  const { data: tiffinFavorites = [], isLoading: tiffinLoading } = useQuery({
    queryKey: ["favoriteTiffins", favoritesUpdated],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      let favoriteTiffins: any[] = [];
      try {
        // 1️⃣ Get favorite IDs
        const favRes = await fetch(
          `${BASE_URL}/api/guest/tiffinServices/getFavouriteTiffinServices`,
          { method: "GET", headers }
        );
        let favIds: string[] = [];
        if (favRes.ok) {
          const favJson = await favRes.json();
          favIds = (favJson.data || []).map(
            (f: any) => f._id || f.tiffinServiceId || f.id
          );
        }
        // 2️⃣ Get ALL tiffins → filter favorites
        const allRes = await fetch(
          `${BASE_URL}/api/guest/tiffinServices/getAllTiffinServices`,
          { method: "GET", headers }
        );
        if (allRes.ok) {
          const allJson = await allRes.json();
          favoriteTiffins = (allJson.data || [])
            .filter((t: any) => favIds.includes(t._id || t.id))
            .map(mapTiffinService);
        }
      } catch (err) {
        console.error("Error fetching favorite tiffins:", err);
      }
      return favoriteTiffins;
    },
  });

  const loading = hostelLoading || tiffinLoading;
  const hasFavorites = tiffinFavorites.length > 0 || hostelFavorites.length > 0;

  // ==================== PULL TO REFRESH ====================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["favoriteHostels"] }),
      queryClient.invalidateQueries({ queryKey: ["favoriteTiffins"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  // ==================== AUTO REFRESH ON FOCUS ====================
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["favoriteTiffins"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteHostels"] });
    }, [queryClient])
  );

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["favoriteTiffins"] });
    queryClient.invalidateQueries({ queryKey: ["favoriteHostels"] });
  }, [favoritesUpdated, queryClient]);

  // ==================== MUTATIONS ====================
  const addFavoriteMutation = useMutation({
    mutationFn: async ({
      service,
      serviceType,
    }: {
      service: any;
      serviceType: "tiffin" | "hostel";
    }) => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const url =
        serviceType === "hostel"
          ? `${BASE_URL}/api/guest/hostelServices/addFavouriteHostelService`
          : `${BASE_URL}/api/guest/tiffinServices/addFavouriteTiffinService`;
      const body =
        serviceType === "hostel"
          ? { hostelServiceId: service.id }
          : { tiffinServiceId: service.id };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onMutate: async ({ service, serviceType }) => {
      if (serviceType === "hostel") {
        queryClient.setQueryData(
          ["favoriteHostels", favoritesUpdated],
          (old: any[] = []) => [...old, service]
        );
      } else {
        queryClient.setQueryData(
          ["favoriteTiffins", favoritesUpdated],
          (old: any[] = []) => [...old, service]
        );
      }
    },
    onError: (err, { service, serviceType }) => {
      if (serviceType === "hostel") {
        queryClient.setQueryData(
          ["favoriteHostels", favoritesUpdated],
          (old: any[] = []) => old.filter((h) => h.id !== service.id)
        );
      } else {
        queryClient.setQueryData(
          ["favoriteTiffins", favoritesUpdated],
          (old: any[] = []) => old.filter((t) => t.id !== service.id)
        );
      }
      Toast.show({
        type: "error",
        text1: "Failed to add to favorites",
      });
    },
    onSuccess: (res) => {
      if (!res?.success) {
        Toast.show({
          type: "error",
          text1: res?.message || "Failed to add favorite",
        });
      }
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async ({
      serviceId,
      serviceType,
    }: {
      serviceId: string;
      serviceType: "tiffin" | "hostel";
    }) => {
      return await removeFavoriteFromBackend(serviceId, serviceType);
    },
    onMutate: async (variables) => {
      const { serviceId, serviceType } = variables;
      if (serviceType === "hostel") {
        await queryClient.cancelQueries(["favoriteHostels", favoritesUpdated]);
      } else {
        await queryClient.cancelQueries(["favoriteTiffins", favoritesUpdated]);
      }
      const previousHostels = queryClient.getQueryData([
        "favoriteHostels",
        favoritesUpdated,
      ]);
      const previousTiffins = queryClient.getQueryData([
        "favoriteTiffins",
        favoritesUpdated,
      ]);
      if (serviceType === "hostel") {
        queryClient.setQueryData(
          ["favoriteHostels", favoritesUpdated],
          (old: any[] = []) => old.filter((h) => h.id !== serviceId)
        );
      } else {
        queryClient.setQueryData(
          ["favoriteTiffins", favoritesUpdated],
          (old: any[] = []) => old.filter((t) => t.id !== serviceId)
        );
      }
      return { previousHostels, previousTiffins, serviceType };
    },
    onError: (err, variables, context: any) => {
      if (context) {
        if (context.serviceType === "hostel") {
          queryClient.setQueryData(
            ["favoriteHostels", favoritesUpdated],
            context.previousHostels
          );
        } else {
          queryClient.setQueryData(
            ["favoriteTiffins", favoritesUpdated],
            context.previousTiffins
          );
        }
      }
      Toast.show({
        type: "error",
        text1: "Failed to remove from favorites",
      });
    },
    onSuccess: (result, variables, context: any) => {
      if (!result?.success) {
        if (context) {
          if (variables.serviceType === "hostel") {
            queryClient.setQueryData(
              ["favoriteHostels", favoritesUpdated],
              context.previousHostels
            );
          } else {
            queryClient.setQueryData(
              ["favoriteTiffins", favoritesUpdated],
              context.previousTiffins
            );
          }
        }
        Toast.show({
          type: "error",
          text1: result?.message || "Failed to remove from favorites",
        });
        return;
      }

      removeFromFavorites(variables.serviceId, variables.serviceType);

      // ✅ Success toast instead of Alert
      Toast.show({
        type: "success",
        text1: "Removed from favorites",
      });
    },
  });

  // ==================== HANDLERS ====================
  const handleTiffinPress = (service: any) => {
    router.push({
      pathname: "/tiffin-details/[id]",
      params: { id: service.id, type: "tiffin", fullServiceData: JSON.stringify(service) },
    });
  };

  const handleHostelPress = (hostel: any) => {
    router.push({
      pathname: "/hostel-details/[id]",
      params: { id: hostel.id, type: "hostel", fullServiceData: JSON.stringify(hostel) },
    });
  };


const handleBookPress = (item: any) => {
  if (item.serviceType === "tiffin") {
   
    router.push({
      pathname: "/tiffin-details/[id]",
      params: {
        id: item.id,
        type: "tiffin",
        fullServiceData: JSON.stringify(item),
      },
    });
  } else if (item.serviceType === "hostel") {
  
    router.push({
      pathname: "/hostel-details/[id]",
      params: {
        id: item.id,
        type: "hostel",
        fullServiceData: JSON.stringify(item),
      },
    });
  }
};

  const handleAddFavorite = (item: any) => {
    const type = item.serviceType === "tiffin" ? "tiffin" : "hostel";
    addFavoriteMutation.mutate({ service: item, serviceType: type });
  };

  const handleRemoveFavorite = (item: any) => {
    const type = item.serviceType === "tiffin" ? "tiffin" : "hostel";
    removeFavoriteMutation.mutate({ serviceId: item.id, serviceType: type });
  };

  // ==================== BACKEND HELPERS ====================
  const removeFavoriteFromBackend = useCallback(
    async (serviceId: string, serviceType: "tiffin" | "hostel") => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return { success: false };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const url =
        serviceType === "hostel"
          ? `${BASE_URL}/api/guest/hostelServices/addFavouriteHostelService`
          : `${BASE_URL}/api/guest/tiffinServices/addFavouriteTiffinService`;
      const body =
        serviceType === "hostel"
          ? { hostelServiceId: serviceId }
          : { tiffinServiceId: serviceId };
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        return await response.json();
      } catch (error) {
        console.error(`Failed to remove favorite ${serviceType}:`, error);
        return { success: false };
      }
    },
    []
  );

  // ==================== MAPPERS ====================
  const mapTiffinService = (item: any) => {
    const allPhotos = [...(item.vegPhotos || []), ...(item.nonVegPhotos || [])];
    // Compute highest price from all pricing options
    const allPrices = (item.pricing || []).map((p: any) => p.monthlyDelivery || 0);
    const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
    return {
      id: item._id || item.id,
      serviceType: "tiffin",
      name: item.tiffinName || "No Name",
      description: item.description || "No description available",
      photos: allPhotos,
      rating: item.averageRating || 0,
      lowestPrice: item.lowestPricing ?? 0,
      reviews: item.totalReviews || 0,
      foodType: item.pricing?.[0]?.foodType || "Both",
      mealTimings: item.mealTimings || [],
      location: item.location || {},
      pricing: item.pricing || [],
      tags: item.pricing?.[0]?.foodType ? [item.pricing[0].foodType] : ["Both"],
      image: allPhotos.length ? { uri: allPhotos[0] } : undefined,
      price: item.pricing?.[0]?.monthlyDelivery
        ? `₹${item.pricing[0].monthlyDelivery}`
        : "-",
      oldPrice: item.pricing?.[0]?.monthlyDining
        ? `₹${item.pricing[0].monthlyDining}`
        : "-",
      highestPrice,
      timing: item.mealTimings?.[0]
        ? `${item.mealTimings[0].startTime} - ${item.mealTimings[0].endTime}`
        : "-",
    };
  };

  const mapHostelService = (item: any) => ({
    id: item._id || item.id,
    serviceType: "hostel",
    name: item.hostelName || "Unknown Hostel",
    type: item.hostelType || "Hostel",
    description: item.description || "No description available",
    image: item.hostelPhotos?.length ? { uri: item.hostelPhotos[0] } : undefined,
    price: item.pricing?.monthly
      ? `₹${item.pricing.monthly}/month`
      : "-",
    oldPrice: "-",
    rating: item.averageRating || 0,
    reviews: item.totalReviews || 0,
    amenities: item.amenities || [],
    location: item.location?.fullAddress || "Unknown Location",
    availableBeds: item.availableBeds || 0,
    deposit: item.deposit || "₹15000",
  });

  // ==================== RENDER ====================
  if (loading && !hasFavorites) {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
                    onFavoritePress={() => handleRemoveFavorite(item)}
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
                    onFavoritePress={() => handleRemoveFavorite(item)}
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

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#6B7280" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#374151", marginTop: 24, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A1A", marginBottom: 16 },
});