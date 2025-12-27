// app/(secure)/account/TransactionDetailsScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import colors from "@/constants/colors";
import { BASE_URL } from "@/constants/api";

type Transaction = {
  _id: string;
  txnId: string;
  amount: number;
  currency: string;
  transactionType: "Debited" | "credited";
  status: "paid" | "failed" | "pending";
  source: string;
  remarks: string;
  createdAt: string;
};

const fetchTransactionById = async (id: string): Promise<Transaction> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await axios.get(
    `${BASE_URL}/api/guest/wallet/transaction/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch transaction");
  }

  return response.data.data;
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + ", " + new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TransactionDetailsScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const router = useRouter();

  const {
    data: txn,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => fetchTransactionById(transactionId!),
    enabled: !!transactionId,
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Could not load transaction details",
      });
    },
  });

  const isCredit = txn?.transactionType?.toLowerCase() === "credited";
  const amountColor = isCredit ? "#13A10E" : "#E11D48";
  const statusColor =
    txn?.status === "paid"
      ? "#13A10E"
      : txn?.status === "failed"
      ? "#E11D48"
      : "#0B5ED7";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !txn) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transaction</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Amount Card */}
        <View style={styles.amountCard}>
          <Image
            source={require("../../../assets/images/frame.png")} 
            style={styles.transactionIcon}
          />
          <Text style={styles.transactionTitle}>
            {txn.remarks || (isCredit ? "Wallet Top-up" : "Hostel Booking")}
          </Text>

          <Text style={[styles.amount, { color: amountColor }]}>
             {formatINR(txn.amount)}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Ionicons
              name={
                txn.status === "paid"
                  ? "checkmark-circle"
                  : txn.status === "failed"
                  ? "close-circle"
                  : "time"
              }
              size={16}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
            </Text>
          </View>

          <Text style={styles.dateText}>{formatDate(txn.createdAt)}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          <DetailRow label="Transaction ID" value={txn.txnId} copyable />
          <DetailRow label="Type" value={isCredit ? "Credited" : "Debited"} />
          <DetailRow label="Source" value={txn.source || "Wallet"} />
          <DetailRow label="Remarks" value={txn.remarks || "—"} />
          <DetailRow label="Currency" value={txn.currency} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Detail Row with optional copy button
const DetailRow = ({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={styles.detailValue}>{value}</Text>
      {copyable && (
        <TouchableOpacity
          onPress={() => {
            // You can integrate Clipboard from @react-native-clipboard/clipboard if needed
            Toast.show({ type: "info", text1: "Copied to clipboard" });
          }}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name="copy-outline" size={18} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginLeft: 12,
    flex: 1,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#888" },

  // Amount Card
  amountCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionIcon: { width: 60, height: 60, marginBottom: 16 },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  amount: {
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 12,
  },
  statusText: { fontSize: 14, fontWeight: "600" },
  dateText: { fontSize: 14, color: "#6B7280", marginTop: 8 },

  // Details Card
  detailsCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    textAlign: "right",
    flexShrink: 1,
  },
});