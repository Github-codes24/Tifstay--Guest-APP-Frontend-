import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { router } from "expo-router";


const referrals = [
    { id: "1", name: "Savannah Nguyen", date: "16 August", points: 201 },
    { id: "2", name: "Brooklyn Simmons", date: "16 August", points: 201 },
    { id: "3", name: "Theresa Webb", date: "16 August", points: 201 },
];

export default function ReferEarnScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Refer & Earn</Text>
            </View>
            <ScrollView style={{ backgroundColor: '#fff', flex: 1 }}>
                {/* Header */}

                {/* Total Points */}
                <View style={styles.pointsCard}>
                    <Text style={styles.pointsLabel}>Total Points</Text>
                    <Text style={styles.pointsValue}>1000.00</Text>
                </View>

                {/* Earned History */}
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Point Earned History</Text>
                    <Text style={styles.historyLink}>See All</Text>
                </View>

                {/* FlatList in scrollable section */}
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={referrals}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <Image
                                    source={require('../../../assets/images/user.png')}
                                    style={{ height: 34, width: 34 }}
                                />
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyName}>{item.name}</Text>
                                    <Text style={styles.historyDate}>{item.date}</Text>
                                </View>
                                <Text style={styles.historyPoints}>{item.points}</Text>
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Refer Section stays pinned at bottom */}
                <View style={styles.referCard}>
                    <Text style={styles.referTitle}>Refer your friends</Text>
                    <Text style={styles.referDesc}>
                        Refer your friends and earn 201 points for every successful referral.
                    </Text>
                    <View style={styles.codeRow}>
                        <Text style={styles.code}>QR7811</Text>
                        <Text style={styles.copy}>Copy</Text>
                    </View>
                    <TouchableOpacity style={styles.referButton}>
                        <Text style={styles.referButtonText}>Refer Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    pointsCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    pointsLabel: {
        fontSize: 14,
        color: colors.grey,
        paddingVertical: 25,
        fontWeight: "600"
    },
    pointsValue: {
        fontSize: 30,
        fontWeight: "700",
        color: colors.title,
        marginTop: 4,
    },
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.title,
    },
    historyLink: {
        fontSize: 14,
        color: colors.primary,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        // borderBottomWidth: 1,
        // borderBottomColor: COLORS.border,
    },
    historyInfo: {
        flex: 1,
        marginLeft: 12,
    },
    historyName: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.grey,
    },
    historyDate: {
        fontSize: 13,
        color: colors.gray,
    },
    historyPoints: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.grey,
    },
    referCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginTop: 24,
    },
    referTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.title,
        marginBottom: 4,
    },
    referDesc: {
        fontSize: 14,
        color: colors.grey,
        marginBottom: 12,
        fontWeight: '600'
    },
    codeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    code: {
        fontSize: 30,
        fontWeight: "700",
        color: colors.title,
    },
    copy: {
        fontSize: 14,
        color: colors.grey,
        fontWeight: "600",
    },
    referButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    referButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" }
});
