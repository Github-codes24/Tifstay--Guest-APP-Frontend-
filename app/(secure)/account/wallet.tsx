// WalletScreen.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";

type Txn = {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    amount: number;
    icon?: any;
};

const COLORS = {
    bg: "#FFFFFF",
    text: "#0A0A0A",
    subText: "#6B7280",
    border: "#E5E7EB",
    card: "#F3F4F6",
    blue: "#0B5ED7",
    green: "#13A10E",
};

// Dummy transactions (can be replaced with API later)
const TXNS: Txn[] = [
    {
        id: "1",
        title: "Scholars Den Boys Hostel",
        subtitle: "Hostel Booking",
        date: "17 Aug, 2025",
        amount: -23000,
        icon: require('../../../assets/images/frame.png'),
    },
    {
        id: "2",
        title: "Scholars Den Boys Hostel",
        subtitle: "Money Refund",
        date: "16 Aug, 2025",
        amount: 23000,
        icon: require('../../../assets/images/frame.png'),
    },
    {
        id: "3",
        title: "Scholars Den Boys Hostel",
        subtitle: "Hostel Booking",
        date: "15 Aug, 2025",
        amount: -23000,
        icon: require('../../../assets/images/frame.png'),
    },
    {
        id: "4",
        title: "Visa Card XXXX54",
        subtitle: "Wallet Balance Add",
        date: "14 Aug, 2025",
        amount: 23000,
        icon: require('../../../assets/images/visa1.png'),
    },
];

const formatINR = (value: number, fractionDigits = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(Math.abs(value));

export default function WalletScreen() {
    const [balance, setBalance] = useState<number>(0);

    // Fetch deposit balance from API
// Fetch wallet balance from API
const fetchWalletAmount = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return Alert.alert("Error", "User not authenticated");

        const response = await axios.get(
            "https://tifstay-project-be.onrender.com/api/guest/wallet/getWalletAmount",
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.data?.success) {
            // Assuming your API returns amount in response.data.data.walletAmount
            setBalance(response.data.data?.walletAmount || 0);
        } else {
            Alert.alert("Error", response.data?.message || "Cannot fetch wallet amount");
        }
    } catch (error: any) {
        Alert.alert("Error", error.response?.data?.message || "Something went wrong");
    }
};

useEffect(() => {
    fetchWalletAmount();
}, []);


    const onAddMoney = () => {
        router.push("/(secure)/account/addmoney");
    };

    const onSeeAll = () => {
        // navigate to full history
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Wallet</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceRow}>
                        <View style={styles.walletIcon}>
                            <Image
                                source={require('../../../assets/images/wallet1.png')}
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
                    {TXNS.map((t) => {
                        const isCredit = t.amount > 0;
                        return (
                            <View key={t.id} style={styles.itemRow}>
                                <Image source={t.icon} style={{ height: 32, width: 32 }} />

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                        {t.title}
                                    </Text>
                                    <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                                        <Text style={styles.itemSub}>{t.subtitle}</Text>
                                        <Text style={{}}></Text>
                                        <Text style={styles.itemSub}>{t.date}</Text>
                                    </View>
                                </View>

                                <Text
                                    style={[
                                        styles.amount,
                                        isCredit && { color: colors.green },
                                    ]}
                                >
                                    {isCredit ? `+ ${formatINR(t.amount, 0)}` : formatINR(t.amount, 0)}
                                </Text>
                            </View>
                        );
                    })}
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
    walletIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#EEE7FF", alignItems: "center", justifyContent: "center" },
    balanceLabel: { fontSize: 16, color: colors.grey, fontWeight: "600" },
    balanceValue: { paddingVertical: 25, fontSize: 30, fontWeight: "700", color: colors.title, letterSpacing: 0.5 },
    addBtn: { height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    histHeader: { marginTop: 20, marginBottom: 24, flexDirection: "row", alignItems: "center" },
    histTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.title },
    seeAll: { flexDirection: "row", alignItems: "center", gap: 6 },
    seeAllText: { color: colors.primary, fontWeight: "400", fontSize: 12 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    itemTitle: { fontSize: 14, color: colors.grey, fontWeight: "500" },
    itemSub: { fontSize: 10, color: colors.gray, fontWeight: "400" },
    amount: { fontSize: 14, fontWeight: "500", color: colors.grey, minWidth: 110, textAlign: "right" },
});
