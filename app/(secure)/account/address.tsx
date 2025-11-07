import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
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
import { useFocusEffect } from "@react-navigation/native"; // ← Added for screen-focus refetch

const AddressScreen = () => {
  const navigation = useRouter();
  const queryClient = useQueryClient();

  // Track initial mount so we don't force-refetch on first load (useQuery already handles it)
  const isInitialMount = useRef(true);

  // Manual pull-to-refresh state (background refetches will be silent)
  const [refreshing, setRefreshing] = useState(false);

  // ── Cached fetch of addresses ─────────────────────────────────────
  const { data: addresses = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "No token found!",
          });
          return [];
        }
        const response = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/address/getAllAddresses",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          return response.data.data.addresses || [];
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to fetch addresses",
          });
          return [];
        }
      } catch (error) {
        console.log("Error fetching addresses:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch addresses",
        });
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Refetch automatically when screen comes into focus (e.g. after adding/editing) ──
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      // Silent background refetch – no spinner unless user pulls
      refetch();
    }, [refetch])
  );

  // ── Manual pull-to-refresh handler ───────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      // Optional: show toast on refresh failure
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to refresh addresses",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // ── Delete mutation (invalidates cache → auto-refetch) ───────────
  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.delete(
        `https://tifstay-project-be.onrender.com/api/guest/address/deleteAddress/${addressId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete");
      }
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Address deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete address",
      });
    },
  });

  const handleDelete = (addressId: string) => {
    deleteMutation.mutate(addressId);
  };

  const renderAddress = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image
        source={require("../../../assets/images/home.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.label}</Text>
        <Text style={styles.address}>
          {item.address}, {item.street}{"\n"}Nagpur - {item.postCode}
        </Text>
      </View>
      <View style={{ flexDirection: "row", position: "absolute", right: 19, top: 12 }}>
        <TouchableOpacity onPress={() => navigation.push(`/(secure)/account/${item._id}`)}>
          <Image
            source={require("../../../assets/images/editicon.png")}
            style={styles.actionIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Image
            source={require("../../../assets/images/delete.png")}
            style={styles.actionIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const AddAddressCard = () => (
    <TouchableOpacity
      style={styles.addCard}
      onPress={() => navigation.push("/(secure)/account/addAddress")}
    >
      <Image
        source={require("../../../assets/images/add.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Add a new address</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.locationLabel}>Location</Text>

          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            renderItem={renderAddress}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={{ marginTop: 20, alignItems: "center" }}>
                <Text style={{ textAlign: "center", color: "#A5A5A5" }}>
                  No addresses found.
                </Text>
                <View style={{ marginTop: 20 }}>
                  <AddAddressCard />
                </View>
              </View>
            }
            ListFooterComponent={
              addresses.length > 0 ? (
                <>
                  <Text style={{ textAlign: "center", paddingVertical: 8, color: "#A5A5A5" }}>
                    or
                  </Text>
                  <AddAddressCard />
                </>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
      <CustomToast />
    </SafeAreaView>
  );
};
export default AddressScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  locationLabel: { marginHorizontal: 16, fontSize: 14 },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#F7F5FF",
    borderRadius: 12,
    height: 101,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  addCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#F7F5FF",
    borderRadius: 12,
    height: 101,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  image: { height: 52, width: 52 },
  textContainer: { flex: 1, marginLeft: 12 },
  title: { fontWeight: "700", color: "#9C9BA6", fontSize: 14 },
  address: { marginTop: 4, fontSize: 14, color: "#333" },
  actionIcon: { height: 20, width: 20, marginLeft: 10 },
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
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});