// WalletTransactionsScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import colors from "@/constants/colors";

type Txn = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  transactionType: "Debited" | "credited";
  icon?: any;
};

const fetchTransactions = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const response = await axios.get(
    "https://tifstay-project-be.onrender.com/api/guest/wallet/transactions",
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 50 },
    }
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Cannot fetch transactions");
  }

  const txnData = response.data.data?.transactions || [];

  const mapped: Txn[] = txnData.map((txn: any) => {
    const raw = txn.raw?.payload;
    const desc = raw?.payment_link?.entity?.description || "";
    const isTopUp = desc.includes("Wallet top-up");
    const source = txn.source || "Payment";

    return {
      id: txn._id || "",
      title: isTopUp ? "Wallet Top-up" : txn.remarks || "Transaction",
      subtitle: source,
      date: txn.createdAt
        ? new Date(txn.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "",
      amount: txn.amount || 0,
      transactionType: txn.transactionType as "Debited" | "credited",
      icon: isTopUp
        ? require("../../../assets/images/visa1.png")
        : require("../../../assets/images/frame.png"),
    };
  });

  return mapped;
};

const WalletTransactionsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const {
    data: transactions = [],
    isPending: loading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["walletTransactions"],
    queryFn: fetchTransactions,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Something went wrong",
      });
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error during refresh:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to refresh transactions",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      Math.abs(val)
    );

  const renderItem = ({ item }: { item: Txn }) => {
    const isCredit = item.transactionType === "credited";
    const amountColor = isCredit ? colors.green : colors.red;
    const amountPrefix = isCredit ? "+" : "-";
    const typeLabel = isCredit ? "Credited" : "Debited";
    const typeColor = isCredit ? colors.green : colors.red;

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() =>
          router.push({
            pathname: "/(secure)/account/TransactionDetailsScreen",
            params: { transaction: JSON.stringify(item) },
          })
        }
      >
        <Image source={item.icon} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSub}>
            {item.subtitle} · {item.date}
          </Text>
        </View>

        {/* Amount + Type Label */}
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix} {formatINR(item.amount)}
          </Text>
          <Text
            style={{
              color: typeColor,
              fontSize: 10,
              fontWeight: "500",
              marginTop: 2,
            }}
          >
            {typeLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 30, color: "#777" }}>
              No transactions found
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default WalletTransactionsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { marginLeft: 12, fontSize: 18, fontWeight: "600", color: "#000" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: "#eee",
  },
  icon: { width: 32, height: 32 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#000" },
  itemSub: { fontSize: 12, color: "#888", marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "600" },
});