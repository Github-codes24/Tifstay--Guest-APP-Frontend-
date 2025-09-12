// DepositScreen.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CommonDropdown from "@/components/CommonDropDown";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const DepositScreen = () => {
    const [withdrawOption, setWithdrawOption] = useState<"wallet" | "bank">("bank");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [accountType, setAccountType] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [area, setArea] = useState("");

    const ROLES = [
        { label: "With one meal", value: "With one meal" },
        { label: "With two meal", value: "With two meal" },
        { label: "One meal with breakfast", value: "One meal with breakfast" },
        {
            label: "With Lunch & dinner & breakfast",
            value: "With Lunch & dinner & breakfast",
        },
        { label: "With breakfast", value: "With breakfast" },
    ];
    const handleSend = () => {
        // Handle deposit submission
        console.log({ accountNumber, ifsc, accountType, accountHolder });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Deposite</Text>
            </View>
            <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={80} showsHorizontalScrollIndicator={false}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Deposit Box */}
                <View style={styles.depositBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image source={require('../../../assets/images/deposite.png')} style={{ height: 24, width: 24 }} />
                        <Text style={styles.depositLabel}>Your Security Deposit</Text>
                    </View>
                    <Text style={styles.depositAmount}>₹25,000.00</Text>
                    <TouchableOpacity style={styles.addDepositButton}>
                        <Text style={styles.addDepositText}>Add Deposit Amount</Text>
                    </TouchableOpacity>
                </View>

                {/* Withdraw Options */}
                {/* Withdraw Options */}
                <Text style={styles.withdrawTitle}>Select withdraw options</Text>
                <View style={styles.optionRow}>
                    <View style={styles.radioRow}>
                        <Text style={styles.radioLabel}>Wallet</Text>
                        <TouchableOpacity
                            style={[
                                styles.radioCircle,
                            ]}
                            onPress={() => setWithdrawOption("wallet")}
                        >
                            {withdrawOption === "wallet" && <View style={{ height: 12, width: 12, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center' }} />}

                        </TouchableOpacity>
                    </View>

                    <View style={styles.radioRow}>
                        <Text style={styles.radioLabel}>Bank Account</Text>
                        <TouchableOpacity
                            style={[
                                styles.radioCircle,
                                // withdrawOption === "bank" && styles.radioSelected,
                            ]}
                            onPress={() => setWithdrawOption("bank")}
                        >
                            {withdrawOption === "bank" && <View style={{ height: 12, width: 12, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center' }} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {withdrawOption === "bank" && (
                    <View style={styles.bankForm}>
                        <LabeledInput
                            label="Account Number"
                            placeholder="Enter Account Number"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            autoCapitalize="words"
                            containerStyle={styles.inputMargin}
                            inputContainerStyle={styles.inputTall}
                            labelStyle={styles.label}
                        />
                        <LabeledInput
                            label="IFSC Code"
                            placeholder="Enter IFSC Code"
                            value={ifsc}
                            onChangeText={setIfsc}
                            autoCapitalize="words"
                            containerStyle={styles.inputMargin}
                            inputContainerStyle={styles.inputTall}
                            labelStyle={styles.label}

                        />
                        <CommonDropdown
                            items={ROLES}
                            label="Area/Locality *"
                            placeholder="Account Type"
                            value={area}
                            setValue={(val: any) => { setArea(val) }}
                            containerStyle={{ marginBottom: 0, marginTop: 20 }}
                            labelStyle={{ fontSize: 14, fontWeight: '400', color: colors.title, marginBottom: 8 }}
                        />
                        <LabeledInput
                            label="Account Holder Name"
                            placeholder="Enter Account Holder Name"
                            value={accountHolder}
                            onChangeText={setAccountHolder}
                            autoCapitalize="words"
                            containerStyle={styles.inputMargin}
                            inputContainerStyle={styles.inputTall}
                            labelStyle={styles.label}
                        />
                    </View>
                )}

                <Text style={styles.note}>Note: in bank it may take 1-3 days</Text>

                <CustomButton title={withdrawOption === "wallet" ? "WITHDRAW" : "Send for Approval to Admin"} onPress={() => { withdrawOption !== "wallet" ? router.push('/(secure)/account/withdraw') : {} }} style={{ width: '95%', alignSelf: 'center', marginVertical: 0 }} />

            </ScrollView>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default DepositScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    depositBox: {
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        padding: 16,
        // alignItems: "center",
        marginVertical: 12,
    },
    depositLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "600"
    },
    depositAmount: {
        fontSize: 24,
        fontWeight: "700",
        marginVertical: 25,
    },
    addDepositButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center'
    },
    addDepositText: {
        color: colors.primary,
        fontWeight: "600",
    },
    withdrawTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginHorizontal: 16,
        marginVertical: 12,
    },
    optionRow: {
        flexDirection: "column",
        marginBottom: 16,
        marginHorizontal: 16,
        gap: 18,
    },
    radioRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between'
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#666",
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,

    },
    radioLabel: {
        fontSize: 14,
        flex: 1,
        color: colors.grey,
        fontWeight: '500'
    },
    bankForm: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        marginHorizontal: 16
    },
    note: {
        fontSize: 12,
        color: "#000",
        marginBottom: 14,
        fontWeight: '400',
        textAlign: 'center'
    },
    sendButton: {
        backgroundColor: "#3B5FFF",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    sendButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },

    inputMargin: {
        marginTop: 20,
        paddingHorizontal: 0
    },
    inputTall: {
        minHeight: 56,
    },
    input: {
        minHeight: 56,
    },
    label: {
        fontSize: 14,
        fontWeight: "400",
        color: colors.title,
    },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" }
});