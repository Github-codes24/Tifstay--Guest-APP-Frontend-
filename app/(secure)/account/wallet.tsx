import * as React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";

type Txn = {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    amount: number;
    status: "Approved" | "Pending" | "Rejected";
    icon?: any;
    transactionType?: string;
};

const COLORS = {
    bg: "#FFFFFF",
    text: "#0A0A0A",
    subText: "#6B7280",
    border: "#E5E7EB",
    card: "#F3F4F6",
    blue: "#0B5ED7",
    green: "#13A10E",
    red: "#E11D48",
};

const formatINR = (value: number, fractionDigits = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(Math.abs(value));

const fetchWalletAmount = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/wallet/getWalletAmount",
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.data?.success) {
        throw new Error(response.data?.message || "Cannot fetch wallet amount");
    }

    return response.data.data?.walletAmount || 0;
};

const fetchTransactions = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/wallet/transactions",
        {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, limit: 10 },
        }
    );

    if (!response.data?.success) {
        throw new Error(response.data?.message || "Cannot fetch transactions");
    }

    const txnData = response.data.data?.transactions || [];

    const mappedTransactions: Txn[] = txnData.map((txn: any) => {
        const raw = txn.raw?.payload;
        const paymentLinkDesc = raw?.payment_link?.entity?.description || "";
        const isTopUp = paymentLinkDesc.includes("Wallet top-up");
        const source = txn.source || "Payment";

        let statusLabel: "Approved" | "Pending" | "Rejected";
        if (txn.status === "paid") statusLabel = "Approved";
        else if (txn.status === "failed") statusLabel = "Rejected";
        else statusLabel = "Pending";

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
            status: statusLabel,
            icon: isTopUp
                ? require("../../../assets/images/visa1.png")
                : require("../../../assets/images/frame.png"),
            transactionType: txn.transactionType,
        };
    });

    return mappedTransactions;
};

export default function WalletScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: balance = 0,
        isPending: walletLoading,
        refetch: refetchWallet,
        error: walletError,
    } = useQuery({
        queryKey: ["walletAmount"],
        queryFn: fetchWalletAmount,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Something went wrong",
            });
        },
    });

    const {
        data: transactions = [],
        isPending: transactionsLoading,
        refetch: refetchTransactions,
        error: transactionsError,
    } = useQuery({
        queryKey: ["walletTransactions"],
        queryFn: fetchTransactions,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Something went wrong",
            });
        },
    });

    const loading = walletLoading || transactionsLoading;

    useFocusEffect(
        useCallback(() => {
            refetchWallet();
            refetchTransactions();
        }, [refetchWallet, refetchTransactions])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetchWallet(), refetchTransactions()]);
        } catch (error) {
            console.error("Error during refresh:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to refresh wallet data",
            });
        } finally {
            setRefreshing(false);
        }
    }, [refetchWallet, refetchTransactions]);

   const onAddMoney = () => {
  router.push({
    pathname: "/(secure)/account/addmoney",
    params: { balance: balance?.toString() }
  });
};

    const onSeeAll = () => {
        router.push("/account/WalletTransactionsScreen");
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={16} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Wallet</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Wallet</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceRow}>
                        <View style={styles.walletIcon}>
                            <Image
                                source={require("../../../assets/images/wallet1.png")}
                                style={{ height: 24, width: 24 }}
                            />
                        </View>
                        <Text style={styles.balanceLabel}>Wallet Balance</Text>
                    </View>

                    <Text style={styles.balanceValue}>{formatINR(balance, 2)}</Text>

                    <Pressable style={styles.addBtn} onPress={onAddMoney}>
                        <Text style={styles.addBtnText}>Add Money</Text>
                    </Pressable>
                </View>

                {/* History Header */}
                <View style={styles.histHeader}>
                    <Text style={styles.histTitle}>Transaction History</Text>
                    <Pressable style={styles.seeAll} onPress={onSeeAll}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.subText} />
                    </Pressable>
                </View>

                {/* Transactions */}
                <View style={{ gap: 24 }}>
                    {transactions.length > 0 ? (
                        transactions.map((t) => {
                            const isCredit = t.transactionType?.toLowerCase() === "credited";
                            const amountColor = isCredit ? COLORS.green : COLORS.red;
                            const amountPrefix = isCredit ? "+" : "-";
                            const typeLabel = isCredit ? "Credited" : "Debited";
                            const typeColor = isCredit ? COLORS.green : COLORS.red;

                            return (
                                <Pressable
                                    key={t.id}
                                    style={styles.itemRow}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(secure)/account/TransactionDetailsScreen",
                                            params: { transaction: JSON.stringify(t) },
                                        })
                                    }
                                >
                                    <Image source={t.icon} style={{ height: 32, width: 32 }} />

                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>
                                            {t.title}
                                        </Text>
                                        <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                                            <Text style={styles.itemSub}>{t.subtitle}</Text>
                                            <Text style={styles.itemSub}>{t.date}</Text>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={[styles.amount, { color: amountColor }]}>
                                            {`${amountPrefix} ${formatINR(t.amount, 0)}`}
                                        </Text>
                                        <Text
                                            style={[
                                                {
                                                    color: typeColor,
                                                    fontSize: 10,
                                                    fontWeight: "500",
                                                    marginTop: 2,
                                                }
                                            ]}
                                        >
                                            {typeLabel}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })
                    ) : (
                        <Text style={{ textAlign: "center", color: colors.grey }}>
                            No transactions found
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 28,
        height: 28,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.title,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { marginLeft: 12, fontSize: 18, fontWeight: "600", color: COLORS.text },
    balanceCard: {
        backgroundColor: "#F5F5F5",
        borderRadius: 16,
        padding: 16,
        marginTop: 6,
        borderWidth: 1,
        borderColor: "#EEF2F6",
    },
    balanceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    walletIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: "#EEE7FF",
        alignItems: "center",
        justifyContent: "center",
    },
    balanceLabel: { fontSize: 16, color: colors.grey, fontWeight: "600" },
    balanceValue: {
        paddingVertical: 25,
        fontSize: 30,
        fontWeight: "700",
        color: colors.title,
        letterSpacing: 0.5,
    },
    addBtn: {
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    histHeader: {
        marginTop: 20,
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
    },
    histTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.title },
    seeAll: { flexDirection: "row", alignItems: "center", gap: 6 },
    seeAllText: { color: colors.primary, fontWeight: "400", fontSize: 12 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    itemTitle: { fontSize: 14, color: colors.grey, fontWeight: "500" },
    itemSub: { fontSize: 10, color: colors.gray, fontWeight: "400" },
    amount: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.grey,
        minWidth: 110,
        textAlign: "right",
    },
});