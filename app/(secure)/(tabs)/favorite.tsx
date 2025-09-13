// app/(tabs)/favorites.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "@/context/FavoritesContext";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const router = useRouter();

  const tiffinFavorites = favorites.filter((item) => item.type === "tiffin");
  const hostelFavorites = favorites.filter((item) => item.type === "hostel");

  const handleTiffinPress = (service: any) => {
    router.navigate(`/tiffin-details/${service.id}`);
  };

  const handleHostelPress = (hostel: any) => {
    router.navigate(`/hostel-details/${hostel.id}`);
  };

  const handleBookPress = (item: any) => {
    console.log("Book pressed:", item);
  };

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
        {favorites.length === 0 ? (
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
                    key={`tiffin-${item.id}`}
                    service={item.data}
                    onPress={() => handleTiffinPress(item.data)}
                    onBookPress={() => handleBookPress(item.data)}
                  />
                ))}
              </View>
            )}

            {hostelFavorites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hostels & PGs</Text>
                {hostelFavorites.map((item) => (
                  <HostelCard
                    key={`hostel-${item.id}`}
                    hostel={item.data}
                    onPress={() => handleHostelPress(item.data)}
                    onBookPress={() => handleBookPress(item.data)}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
});
