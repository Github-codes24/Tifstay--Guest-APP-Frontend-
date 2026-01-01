import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";

type Transaction = {
  _id: string;
  title: string;
  subtitle: string;
  date: string;
  amount: string;
  status: "Approved" | "Pending" | "Rejected" | "None";
  logo?: any;
};

const AllTransactionsScreen = () => {
  const [filter, setFilter] = useState<"All" | "Approved" | "Pending" | "Rejected">("All");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Auth Error", "No token found in AsyncStorage.");
          return;
        }

        const res = await fetch(
          `${BASE_URL}/api/guest/deposit/transactions?page=1&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const json = await res.json();
        console.log("API Response:", json);

        // Map backend data to frontend Transaction type
        const mappedTransactions: Transaction[] = (json?.data || []).map((txn: any) => {
          const statusMap =
            txn.status === "paid"
              ? "Approved"
              : txn.status === "failed"
              ? "Rejected"
              : "Pending";

          return {
            _id: txn._id,
            title: "Deposit from guest", // Fixed title, no guest ID
            subtitle: txn.source || "Payment",
            date: txn.createdAt
              ? new Date(txn.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "",
            amount: txn.amount?.toString() || "0",
            status: statusMap as "Approved" | "Pending" | "Rejected" | "None",
            logo: require("../../../assets/images/visa1.png"), // Always show the deposit logo
          };
        });

        setTransactions(mappedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        Alert.alert("Error", "Failed to fetch transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredData =
    filter === "All"
      ? transactions
      : transactions.filter((item) => item.status === filter);

  const renderItem = ({ item }: { item: Transaction }) => {
    let statusColor =
      item.status === "Approved"
        ? "green"
        : item.status === "Pending"
        ? "orange"
        : item.status === "Rejected"
        ? "red"
        : "black";

    return (
      <TouchableOpacity
        style={styles.transactionRow}
        onPress={() =>
          router.push({
            pathname: "/account/TransactionDetailsScreen",
            params: { transaction: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.iconWrapper}>
          {item.logo ? (
            <Image source={item.logo} style={styles.avatar} />
          ) : item.title?.includes("SBI") ? (
            <Ionicons name="card-outline" size={22} color={colors.primary || "#1A73E8"} />
          ) : (
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/235/235889.png",
              }}
              style={styles.avatar}
            />
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>
            {item.subtitle} · {item.date}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amount}>{item.amount}</Text>
          {item.status !== "None" && (
            <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {["All", "Approved", "Pending", "Rejected"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterButton, filter === tab && styles.filterButtonActive]}
            onPress={() => setFilter(tab as any)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loader or List */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 30, color: "#888" }}>
              No transactions found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AllTransactionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: "600", marginLeft: 12 },
  filterRow: { flexDirection: "row", justifyContent: "flex-start", marginBottom: 10 },
  filterButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  filterText: { fontSize: 14, color: "#004AAD" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: "#eee",
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "600", color: "#000" },
  subtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "600", color: "#000" },
  status: { fontSize: 12, marginTop: 2 },
});
