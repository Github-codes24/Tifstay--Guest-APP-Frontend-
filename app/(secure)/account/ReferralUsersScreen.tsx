import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";
import { theme } from "@/constants/utils";

/* 🔹 DUMMY REFERRED USERS DATA */
const dummyReferredUsers = [
  {
    id: "1",
    name: "Rahul Sharma",
    joinedOn: "12 July 2024",
    pointsEarned: 50,
  },
  {
    id: "2",
    name: "Amit Verma",
    joinedOn: "18 July 2024",
    pointsEarned: 50,
  },
  {
    id: "3",
    name: "Neha Singh",
    joinedOn: "25 July 2024",
    pointsEarned: 50,
  },
  {
    id: "4",
    name: "Pooja Patel",
    joinedOn: "01 August 2024",
    pointsEarned: 50,
  },
];

const renderItem = ({ item }) => (
  <View style={styles.card}>
    <Image
      source={require("../../../assets/images/user.png")}
      style={styles.avatar}
    />

    <View style={{ flex: 1 }}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.date}>Joined on {item.joinedOn}</Text>
    </View>

    <Text style={styles.points}>+{item.pointsEarned}</Text>
  </View>
);

export default function ReferralUsersScreen() {
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
          data={dummyReferredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                You haven’t referred anyone yet 😔
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

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
  },
});
