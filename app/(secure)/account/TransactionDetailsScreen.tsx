import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

const TransactionDetailsScreen = () => {
  const router = useRouter();
  const { transaction } = useLocalSearchParams();
  const data = transaction ? JSON.parse(transaction as string) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0A051F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Transaction Details</Text>
        <View style={{ width: 24 }} /> {/* spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
       {/* Top Section */}
<View style={styles.topCard}>
  <Image
    source={{
      uri: "https://cdn-icons-png.flaticon.com/512/235/235889.png",
    }}
    style={styles.avatar}
  />
  <Text style={styles.toText}>To {data?.title}</Text>
  <Text style={styles.amount}>{data?.amount}</Text>

  {/* ✅ remove this old divider */}
  {/* <View style={styles.divider} /> */}

  <View style={styles.statusRow}>
    <Ionicons name="checkmark-circle" size={18} color="green" />
    <Text style={styles.statusCompleted}>Completed</Text>
  </View>

  {/* ✅ New divider between Completed and Date */}
  <View style={styles.divider} />

  <Text style={styles.date}>{data?.date}</Text>
</View>


        {/* Detail Card */}
        <View style={styles.detailCard}>
          {/* Title row */}
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle" size={20} color="green" />
            <Text style={styles.cardTitle}>
              {data?.amount} {data?.subtitle} Paid
            </Text>
            <Ionicons name="chevron-down" size={20} color="#0A051F" />
          </View>

          {/* Divider between Security Deposit Paid and Payment Started */}
          <View style={styles.smallDivider} />

          {/* Steps with vertical line */}
          <View style={styles.stepsContainer}>
            {/* Payment Started */}
            <View style={styles.stepRow}>
              <View style={styles.iconCol}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="green"
                />
                <View style={styles.verticalLine} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.stepTitle}>Payment Started</Text>
                <Text style={styles.stepDate}>{data?.date}</Text>
              </View>
            </View>

            {/* Amount Paid */}
            <View style={styles.stepRow}>
              <View style={styles.iconCol}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="green"
                />
                <View style={styles.verticalLine} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.stepTitle}>Amount Paid</Text>
                <Text style={styles.stepDate}>{data?.date}</Text>
              </View>
            </View>

            {/* Deposit Approved */}
            <View style={styles.stepRow}>
              <View style={styles.iconCol}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="green"
                />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.stepTitle}>Deposit Approved</Text>
                <Text style={styles.stepDate}>18 Aug, 2025</Text>
              </View>
            </View>
          </View>

          {/* Divider between Deposit Approved and Transaction Info */}
          <View style={styles.smallDivider} />

          {/* Transaction Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Transaction ID</Text>
            <Text style={styles.infoValue}>985735917285</Text>

            <Text style={styles.infoLabel}>Approval Reference Number</Text>
            <Text style={styles.infoValue}>6547861975437</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 30 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.8,
    borderColor: "#eee",
  },
// Header text
headerText: { 
  flex: 1,
  fontSize: 16, 
  fontWeight: "600", 
  color: "#0A051F",
  textAlign: "left",
  marginLeft: 10,
},


  // Top Section
  topCard: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 12 },
  toText: { fontSize: 15, fontWeight: "500", marginBottom: 6, color: "#0A051F" },
  amount: { fontSize: 24, fontWeight: "700", color: "#0A051F" },
  divider: {
    width: "40%",
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  smallDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  statusCompleted: {
    fontSize: 14,
    color: "#0A051F" ,
    marginLeft: 4,
  },
  date: { fontSize: 13, color: "#666" },

  // Detail Card
  detailCard: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
    color: "#0A051F",
  },

  // Steps
  stepsContainer: { marginLeft: 4 },
  stepRow: { flexDirection: "row", marginBottom: 14 },
  iconCol: { alignItems: "center", width: 24 },
  verticalLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#ddd",
    marginTop: 2,
  },
  textCol: { marginLeft: 10 },
  stepTitle: { fontSize: 14, fontWeight: "500", color: "#0A051F" },
  stepDate: { fontSize: 12, color: "#777" },

  // Info
  infoBox: { marginTop: 10 },
  infoLabel: { fontSize: 14, color: "#0A051F" , marginTop: 10 },
  infoValue: { fontSize: 13, fontWeight: "500", color: "#888" },
});
