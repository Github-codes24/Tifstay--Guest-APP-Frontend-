import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import colors from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DepositScreen = () => {
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ================== FETCH DEPOSIT AMOUNT ==================
    const fetchDepositAmount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const response = await axios.get(
                "https://tifstay-project-be.onrender.com/api/guest/deposit/getDepositAmount",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                setDepositAmount(response.data.data?.depositedAmount || 0);
            }
        } catch (error: any) {
            Alert.alert("Error", "Unable to fetch deposit amount.");
        }
    };

    // ================== FETCH TRANSACTIONS ==================
    const fetchDepositTransactions = async () => {
        try {
            setTxLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const response = await axios.get(
                "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getalldepositTransaction",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                setTransactions(response.data.data || []);
            }
        } catch (error: any) {
            console.log("Transaction error:", error.response?.data || error);
        } finally {
            setTxLoading(false);
        }
    };

    // ================== ON SCREEN FOCUS ==================
    useFocusEffect(
        useCallback(() => {
            fetchDepositAmount();
            fetchDepositTransactions();
        }, [])
    );

    // ================== PULL TO REFRESH ==================
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            fetchDepositAmount(),
            fetchDepositTransactions(),
        ]);
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={16} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Deposit</Text>
                </View>
            </View>

            <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={80}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* ================== DEPOSIT BOX ================== */}
                    <View style={styles.depositBox}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Image
                                source={require("../../../assets/images/deposite.png")}
                                style={{ height: 24, width: 24 }}
                            />
                            <Text style={styles.depositLabel}>Your Security Deposit</Text>
                        </View>

                        <Text style={styles.depositAmount}>
                            ₹{depositAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </Text>
                    </View>

                    {/* ================== TRANSACTIONS ================== */}
                    <Text style={styles.txTitle}>All Transactions</Text>

                    {txLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No transactions found</Text>
                    ) : (
                        transactions.map((item) => {
                            const isCredit = item.transactionType === "credited";

                            return (
                                <View key={item._id} style={styles.txRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.txRemark}>{item.remarks}</Text>
                                        <Text style={styles.txDate}>
                                            {new Date(item.createdAt).toLocaleDateString("en-IN")}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[
                                            styles.txAmount,
                                            { color: isCredit ? "#1DB954" : "#E53935" },
                                        ]}
                                    >
                                        {isCredit ? "+" : "-"}₹{item.amount}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default DepositScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    container: { paddingHorizontal: 16, paddingBottom: 40 },

    depositBox: {
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
    },
    depositLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
    depositAmount: { fontSize: 24, fontWeight: "700", marginVertical: 25 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 28,
        height: 28,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.title,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 16,
        color: "#000",
    },

    /* Transactions */
    txTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginVertical: 16,
        color: "#000",
    },
    txRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#EEE",
    },
    txRemark: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000",
    },
    txDate: {
        fontSize: 12,
        color: "#777",
        marginTop: 4,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "700",
    },
    emptyText: {
        textAlign: "center",
        color: "#777",
        marginVertical: 20,
    },
});
