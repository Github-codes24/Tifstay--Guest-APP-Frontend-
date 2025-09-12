// AddMoneyScreen.tsx
import * as React from "react";
import { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";

export default function Method() {
    const currentBalance = 25000;
    const [amountStr, setAmountStr] = useState<string>("0");
    const amount = useMemo(() => parseInt(amountStr || "0", 10) || 0, [amountStr]);
    const onSelectCard = () => {
        // navigate to payment method list if needed
    };

    const onAddMoney = () => {
        router.push('/(secure)/account/payment')
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Add Money</Text>
            </View>
            <Text style={{ paddingHorizontal: 16, fontWeight: '600', fontSize: 14 }}>Payment Method</Text>
            <Text style={{ padding: 16, fontWeight: '500', fontSize: 12 }}>Select the Payment Methods you Want to Use</Text>
            <View style={{ marginHorizontal: 16 }}>
                {/* Selected card row */}
                <Pressable style={styles.cardRow} onPress={onSelectCard}>
                    <View style={styles.mcWrap}>
                        <Image source={require('../../../assets/images/paypal.png')} style={{ height: 32, width: 32 }} />
                    </View>
                    {/* <Text style={styles.cardRowText}>**** **** **76 3054</Text> */}
                </Pressable>
                <Pressable style={[styles.cardRow, { backgroundColor: '#0A051F' }]} onPress={onSelectCard}>
                    <View style={styles.mcWrap}>
                        <Image source={require('../../../assets/images/master.png')} style={{ height: 32, width: 32 }} />
                    </View>
                    <Text style={[styles.cardRowText, { color: '#fff' }]}>**** **** **76 3054</Text>
                </Pressable>
                <Pressable style={styles.cardRow} onPress={onSelectCard}>
                    <View style={styles.mcWrap}>
                        <Image source={require('../../../assets/images/visa1.png')} style={{ height: 32, width: 32 }} />
                    </View>
                    {/* <Text style={styles.cardRowText}>**** **** **76 3054</Text> */}
                </Pressable>

                <Pressable style={styles.cardRow} onPress={onSelectCard}>
                    <View style={styles.mcWrap}>
                        <Image source={require('../../../assets/images/stripe.png')} style={{ height: 32, width: 32 }} />
                    </View>
                    {/* <Text style={styles.cardRowText}>**** **** **76 3054</Text> */}
                </Pressable>

                {/* CTA */}
                <TouchableOpacity
                    onPress={onAddMoney}
                    style={[styles.primaryBtn]}
                >
                    <Text style={styles.primaryBtnText}>Add New Card</Text>
                </TouchableOpacity>
            </View>


        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    amountCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EDF0F6",
        marginTop: 6,
        marginHorizontal: 16
    },
    cardTitle: { textAlign: "center", fontSize: 14, fontWeight: "500", color: colors.title },
    cardSub: { textAlign: "center", fontSize: 12, color: colors.grey, marginTop: 2, fontWeight: '500' },
    bigAmount: {
        textAlign: "center",
        fontSize: 30,
        fontWeight: "700",
        color: colors.title,
        marginTop: 16,
    },
    quickRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginTop: 16,
    },
    quickChip: {
        // backgroundColor: COLORS.chip,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: colors.lightBg,
    },
    quickText: { fontWeight: "500", color: colors.title, fontSize: 12 },

    cardRow: {
        // marginTop: 18,
        height: 56,
        borderRadius: 10,
        backgroundColor: "#DFE1E6",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20
    },
    mcWrap: { flexDirection: "row", alignItems: "center" },
    mcDot: { width: 16, height: 16, borderRadius: 8 },
    cardRowText: {
        flex: 1,
        color: colors.title,
        fontSize: 14,
        fontWeight: "400",
        letterSpacing: 0.2,
    },

    keypad: { marginVertical: 18, gap: 12, marginHorizontal: 16 },
    keypadRow: { flexDirection: "row", gap: 12, backgroundColor: '#F2F2F2' },
    key: {
        flex: 1,
        height: 60,
        borderRadius: 12,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    keyGhost: {
        flex: 1,
        height: 60,
        borderRadius: 12,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    keyText: { fontSize: 22, fontWeight: "400", color: "#111827" },

    primaryBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        // marginHorizontal: 16,
        // marginBottom: 16,
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" }
});
