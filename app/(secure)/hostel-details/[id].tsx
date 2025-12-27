import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import ProductDetails from "@/components/ProductDetails";
import { BASE_URL } from "@/constants/api";

export default function HostelDetailsPage() {
  const { id, type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    console.log("🚀 useEffect running with id:", id);

    const fetchHostel = async () => {
      try {
        console.log("🔑 Fetching token...");
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No auth token found");

        const url = `${BASE_URL}/api/guest/hostelServices/getHostelServicesById/${id}`;
        console.log("🌐 Fetching:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        console.log("📦 API response:", json);

        if (json.success && json.data) {
          setData(json); // ✅ Store the full response object
        } else {
          console.warn("⚠️ API returned no data");
          setData(null);
        }
      } catch (error) {
        console.error("❌ Fetch error:", error);
        setData(null);
      } finally {
        setLoading(false); // ✅ make sure loading is set to false
      }
    };

    fetchHostel();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text>Loading hostel details...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No hostel data found.</Text>
      </View>
    );
  }

  // ✅ Render ProductDetails with the fetched data and type
  return <ProductDetails data={data} type={type as "hostel"} />;
}