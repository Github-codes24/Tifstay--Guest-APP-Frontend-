import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddressScreen = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useRouter();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No token found!");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/address/getAllAddresses",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAddresses(response.data.data.addresses || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.log("Error fetching addresses:", error);
      Alert.alert("Error", "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UseFocusEffect ensures screen fetches data whenever it comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const deleteAddress = async (addressId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Error", "No token found!");
                return;
              }

              const response = await axios.delete(
                `https://tifstay-project-be.onrender.com/api/guest/address/deleteAddress/${addressId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                Alert.alert("Success", "Address deleted successfully");
                fetchAddresses(); // Refresh list
              } else {
                Alert.alert("Error", "Failed to delete address");
              }
            } catch (error) {
              console.log("Error deleting address:", error);
              Alert.alert("Error", "Failed to delete address");
            }
          },
        },
      ]
    );
  };

  const renderAddress = ({ item }) => (
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
        <TouchableOpacity
          onPress={() => navigation.push(`/(secure)/account/${item._id}`)}
        >
          <Image
            source={require("../../../assets/images/editicon.png")}
            style={styles.actionIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => deleteAddress(item._id)}>
          <Image
            source={require("../../../assets/images/delete.png")}
            style={styles.actionIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
      </View>

      <Text style={styles.locationLabel}>Location</Text>

      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderAddress}
          ListFooterComponent={() => (
            <>
              <Text style={{ textAlign: "center", paddingVertical: 8, color: "#A5A5A5" }}>
                or
              </Text>
              <TouchableOpacity
                style={styles.addCard}
                onPress={() =>
                  navigation.push("/(secure)/account/addAddress")
                }
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
            </>
          )}
        />
      ) : (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#A5A5A5" }}>
          No addresses found.
        </Text>
      )}
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
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
