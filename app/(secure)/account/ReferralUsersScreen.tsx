import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { theme } from "@/constants/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/constants/api";

/* 🔹 API CALL */
const fetchReferralUsers = async () => {
  const guestId = await AsyncStorage.getItem("guestId");
  const token = await AsyncStorage.getItem("token");

  if (!guestId || !token) {
    throw new Error("GuestId or Token missing");
  }

  const res = await fetch(
    `${BASE_URL}/api/guest/referAndEarn/getGuestRefferCode/${guestId}`,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("Failed to fetch referred users");
  }

  return json.data.referredUsers || [];
};

/* 🔹 LIST ITEM */
const renderItem = ({ item }) => (
  <View style={styles.card}>
    <Image
      source={require("../../../assets/images/user.png")}
      style={styles.avatar}
    />

    <View style={{ flex: 1 }}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.date}>
        Joined on{" "}
        {new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Text>
    </View>

    <Text style={styles.points}>+{item.points}</Text>
  </View>
);

export default function ReferralUsersScreen() {
  const {
    data: referredUsers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["referredUsers"],
    queryFn: fetchReferralUsers,
  });

  /* 🔹 LOADING STATE */
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* 🔹 HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Referred Users</Text>
        </View>

        {/* 🔹 LIST */}
        <FlatList
          data={referredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                You haven’t referred anyone yet 
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* 🔹 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.horizontalSpacing.space_16,
    marginTop: theme.verticalSpacing.space_30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 12,
    color: colors.title,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    marginRight: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.title,
  },

  date: {
    fontSize: 13,
    color: colors.grey,
    marginTop: 2,
  },

  points: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },

  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: colors.grey,
    fontWeight:400,
  },
});
