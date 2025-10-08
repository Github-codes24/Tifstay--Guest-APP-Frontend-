// DepositScreen.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CommonDropdown from "@/components/CommonDropDown";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DepositScreen = () => {
    const [withdrawOption, setWithdrawOption] = useState<"wallet" | "bank">("bank");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [accountType, setAccountType] = useState("");
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const ACCOUNT_TYPES = [
        { label: "Savings", value: "Savings" },
        { label: "Current", value: "Current" },
    ];

    // Fetch deposit amount
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
            } else {
                console.log("Error fetching deposit:", response.data?.message);
            }
        } catch (error: any) {
            console.log("API error:", error.response?.data?.message || error.message);
            Alert.alert("Error", "Unable to fetch deposit amount.");
        }
    };

    useEffect(() => {
        fetchDepositAmount();
    }, []);

    // 📌 Withdraw by Wallet
    const handleWalletWithdraw = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            const response = await axios.post(
                "https://tifstay-project-be.onrender.com/api/guest/withdrawal/withdraw-by-wallet",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                Alert.alert("Success", "Amount withdrawn to wallet successfully");
                fetchDepositAmount(); // refresh balance
            } else {
                Alert.alert("Error", response.data?.message || "Something went wrong");
            }
        } catch (error: any) {
            console.log("Wallet withdraw error:", error.response?.data || error);
            Alert.alert("Error", error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // 📌 Withdraw by Bank
    const handleBankWithdraw = async () => {
        if (!accountNumber || !ifsc || !accountHolder || !accountType) {
            Alert.alert("Validation Error", "Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            const body = {
                accountNumber,
                ifscCode: ifsc,
                accountType,
                accountHolderName: accountHolder,
            };

            const response = await axios.post(
                "https://tifstay-project-be.onrender.com/api/guest/withdrawal/withdraw-by-bank",
                body,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                Alert.alert("Success", "Bank withdrawal request submitted successfully");
                setAccountNumber("");
                setIfsc("");
                setAccountHolder("");
                setAccountType("");
                fetchDepositAmount(); // refresh balance
            } else {
                Alert.alert("Error", response.data?.message || "Something went wrong");
            }
        } catch (error: any) {
            console.log("Bank withdraw error:", error.response?.data || error);
            Alert.alert("Error", error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // 📌 Handle Withdraw button
    const handleWithdraw = () => {
        if (withdrawOption === "wallet") {
            handleWalletWithdraw();
        } else {
            handleBankWithdraw();
        }
    };

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
                <TouchableOpacity onPress={() => router.push("/(secure)/account/AllTransactionsScreen")}>
                    <Text style={styles.allTransactionsText}>All Transactions</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={80} showsHorizontalScrollIndicator={false}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Deposit Box */}
                    <View style={styles.depositBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Image source={require('../../../assets/images/deposite.png')} style={{ height: 24, width: 24 }} />
                            <Text style={styles.depositLabel}>Your Security Deposit</Text>
                        </View>
                        <Text style={styles.depositAmount}>
                            ₹{depositAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </Text>
                        <TouchableOpacity
                            style={styles.addDepositButton}
                            onPress={() => router.push("/(secure)/account/depositmoney")}
                        >
                            <Text style={styles.addDepositText}>Add Deposit Amount</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Withdraw Options */}
                    <Text style={styles.withdrawTitle}>Select withdraw options</Text>
                    <View style={styles.optionRow}>
                        <View style={styles.radioRow}>
                            <Text style={styles.radioLabel}>Wallet</Text>
                            <TouchableOpacity
                                style={styles.radioCircle}
                                onPress={() => setWithdrawOption("wallet")}
                            >
                                {withdrawOption === "wallet" && (
                                    <View style={styles.radioSelected} />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.radioRow}>
                            <Text style={styles.radioLabel}>Bank Account</Text>
                            <TouchableOpacity
                                style={styles.radioCircle}
                                onPress={() => setWithdrawOption("bank")}
                            >
                                {withdrawOption === "bank" && (
                                    <View style={styles.radioSelected} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bank Form */}
                    {withdrawOption === "bank" && (
                        <View style={styles.bankForm}>
                            <LabeledInput
                                label="Account Number"
                                placeholder="Enter Account Number"
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                                containerStyle={styles.inputMargin}
                                inputContainerStyle={styles.inputTall}
                                labelStyle={styles.label}
                            />
                            <LabeledInput
                                label="IFSC Code"
                                placeholder="Enter IFSC Code"
                                value={ifsc}
                                onChangeText={setIfsc}
                                containerStyle={styles.inputMargin}
                                inputContainerStyle={styles.inputTall}
                                labelStyle={styles.label}
                            />
                            <CommonDropdown
                                items={ACCOUNT_TYPES}
                                label="Account Type"
                                placeholder="Select Account Type"
                                value={accountType}
                                setValue={setAccountType}
                                containerStyle={{ marginBottom: 0, marginTop: 20 }}
                                labelStyle={{ fontSize: 14, fontWeight: '400', color: colors.title, marginBottom: 8 }}
                            />
                            <LabeledInput
                                label="Account Holder Name"
                                placeholder="Enter Account Holder Name"
                                value={accountHolder}
                                onChangeText={setAccountHolder}
                                containerStyle={styles.inputMargin}
                                inputContainerStyle={styles.inputTall}
                                labelStyle={styles.label}
                            />
                        </View>
                    )}

                    <Text style={styles.note}>Note: Bank withdrawal may take 1-3 business days.</Text>

                    <CustomButton
                        title={loading ? "Please wait..." : withdrawOption === "wallet" ? "WITHDRAW TO WALLET" : "SEND REQUEST"}
                        disabled={loading}
                        onPress={handleWithdraw}
                        style={{ width: '95%', alignSelf: 'center', marginVertical: 0 }}
                    />

                    {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />}
                </ScrollView>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default DepositScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    container: { paddingHorizontal: 16, paddingBottom: 40 },
    depositBox: { backgroundColor: "#F5F5F5", borderRadius: 12, padding: 16, marginVertical: 12 },
    depositLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
    depositAmount: { fontSize: 24, fontWeight: "700", marginVertical: 25 },
    addDepositButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
    addDepositText: { color: colors.primary, fontWeight: "600" },
    withdrawTitle: { fontSize: 16, fontWeight: "600", marginHorizontal: 16, marginVertical: 12 },
    optionRow: { flexDirection: "column", marginBottom: 16, marginHorizontal: 16, gap: 18 },
    radioRow: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between' },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#666", justifyContent: 'center', alignItems: 'center' },
    radioSelected: { height: 12, width: 12, borderRadius: 25, backgroundColor: colors.primary },
    radioLabel: { fontSize: 14, flex: 1, color: colors.grey, fontWeight: '500' },
    bankForm: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 16, marginHorizontal: 16 },
    note: { fontSize: 12, color: "#000", marginBottom: 14, fontWeight: '400', textAlign: 'center' },
    inputMargin: { marginTop: 20, paddingHorizontal: 0 },
    inputTall: { minHeight: 56 },
    label: { fontSize: 14, fontWeight: "400", color: colors.title },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
    allTransactionsText: { fontSize: 14, fontWeight: "500", color: "#004AAD" }
});
