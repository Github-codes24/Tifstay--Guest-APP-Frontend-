import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import CustomToast from "@/components/CustomToast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

const AddressScreen = () => {
  const navigation = useRouter();
  const queryClient = useQueryClient();
  const isInitialMount = useRef(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: addresses = [], isLoading, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Toast.show({ type: "error", text1: "Error", text2: "No token found!" });
          return [];
        }
        const response = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/address/getAllAddresses",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data.success ? response.data.data.addresses || [] : [];
      } catch (error) {
        console.log("Error fetching addresses:", error);
        Toast.show({ type: "error", text1: "Error", text2: "Failed to fetch addresses" });
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.delete(
        `https://tifstay-project-be.onrender.com/api/guest/address/deleteAddress/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data.success) throw new Error(response.data.message || "Failed to delete");
      return response.data;
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Success", text2: "Address deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to delete address" });
    },
  });

  const handleDelete = (addressId: string) => deleteMutation.mutate(addressId);

  // Address Card with Ionicons instead of images
  const renderAddress = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="home-outline" size={32} color={colors.primary || "#7B61FF"} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.label}</Text>
        <Text style={styles.address}>
          {item.address}, {item.street}{"\n"}Nagpur - {item.postCode}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.push(`/(secure)/account/${item._id}`)}>
          <Ionicons name="pencil" size={22} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginLeft: 16 }}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add Address Card (reused in list and empty state)
  const AddAddressCard = ({ isEmpty = false }) => (
    <TouchableOpacity
      style={[styles.addCard, isEmpty && styles.addCardEmpty]}
      onPress={() => navigation.push("/(secure)/account/addAddress")}
    >
      <View style={styles.addIconContainer}>
        <Ionicons name="add" size={34} color={colors.primary || "#7B61FF"} />
      </View>
      <View style={styles.addTextContainer}>
        <Text style={styles.addTitle}>Add a new address</Text>
        {isEmpty && <Text style={styles.addSubtitle}>Tap to add your first delivery address</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.primary || "#7B61FF"} />
    </TouchableOpacity>
  );

  // Beautiful Empty State using only Ionicons
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.illustration}>
        <View style={styles.iconBgCircle} />
        <Ionicons name="location-outline" size={110} color={colors.primary || "#7B61FF"} />
        <View style={styles.overlayQuestion}>
          <Ionicons name="help-circle" size={44} color="#FFF" />
        </View>
      </View>

      <Text style={styles.emptyTitle}>No saved addresses yet</Text>
      <Text style={styles.emptySubtitle}>
        Add an address to speed up checkout and delivery!
      </Text>

      <View style={{ marginTop: 40, width: "100%" }}>
        <AddAddressCard isEmpty />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary || "#7B61FF"} />
        </View>
      ) : (
        <>
          {/* <Text style={styles.locationLabel}>Location</Text> */}

          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            renderItem={renderAddress}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={
              addresses.length > 0 ? (
                <View>
                  <Text style={styles.footerText}>or</Text>
                  <AddAddressCard />
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </>
      )}

      <CustomToast />
    </SafeAreaView>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
  locationLabel: { marginHorizontal: 16, marginTop: 8, fontSize: 14, color: "#666" },

  // Address Card
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#F7F5FF",
    borderRadius: 16,
    height: 101,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8E0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 16 },
  title: { fontWeight: "700", color: "#333", fontSize: 15 },
  address: { marginTop: 4, fontSize: 14, color: "#555", lineHeight: 20 },
  actions: { flexDirection: "row", position: "absolute", right: 16, top: 16 },

  // Add Card
  addCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 100,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary || "#7B61FF",
    borderStyle: "dashed",
  },
  addCardEmpty: { marginHorizontal: 32 },
  addIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0EBFF",
    justifyContent: "center",
    alignItems: "center",
  },
  addTextContainer: { flex: 1, marginLeft: 16 },
  addTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  addSubtitle: { fontSize: 13, color: "#888", marginTop: 4 },

  footerText: { textAlign: "center", paddingVertical: 16, color: "#A5A5A5", fontSize: 14 },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  illustration: { position: "relative", width: 180, height: 180, justifyContent: "center", alignItems: "center" },
  iconBgCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F0EBFF",
    opacity: 0.7,
  },
  overlayQuestion: {
    position: "absolute",
    bottom: 20,
    right: 10,
    backgroundColor: colors.primary || "#7B61FF",
    borderRadius: 28,
    padding: 6,
  },
  emptyTitle: { fontSize: 24, fontWeight: "700", color: "#333", marginTop: 32, textAlign: "center" },
  emptySubtitle: { fontSize: 15, color: "#777", textAlign: "center", marginTop: 12, lineHeight: 22 },
});