import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { router, useLocalSearchParams } from "expo-router";

const renderItem = ({ item }) => (
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
);

export default function ReferEarnScreen() {
    const { id } = useLocalSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReferralData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(
                    `https://tifstay-project-be.onrender.com/api/guest/referAndEarn/getGuestRefferCode/${id}`
                );
                const json = await response.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Error fetching referral data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReferralData();
    }, [id]);

    const historyData = useMemo(() => {
        if (!data || !data.referredUser || data.referredUser.length === 0) {
            return [];
        }
        const pointsPerUser = Math.floor(data.totalPoints / data.referredUser.length);
        const currentDate = new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
        });
        return data.referredUser.map((userId) => ({
            id: userId,
            name: userId.substring(userId.length - 6).toUpperCase(),
            date: currentDate,
            points: pointsPerUser,
        }));
    }, [data]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={16} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Refer & Earn</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text>Loading...</Text>
                </View>
            </View>
        );
    }

    const renderHeader = () => (
        <View>
            {/* Total Points */}
            <View style={styles.pointsCard}>
                <Text style={styles.pointsLabel}>Total Points</Text>
                <Text style={styles.pointsValue}>
                    {data ? data.totalPoints.toFixed(2) : "0.00"}
                </Text>
            </View>

            {/* Earned History */}
            <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Point Earned History</Text>
                <Text style={styles.historyLink}>See All</Text>
            </View>
        </View>
    );

    const renderFooter = () => (
        <View style={styles.footer}>
            {/* Refer Section */}
            <View style={styles.referCard}>
                <Text style={styles.referTitle}>Refer your friends</Text>
                <Text style={styles.referDesc}>
                    Refer your friends and earn 201 points for every successful referral.
                </Text>
                <View style={styles.codeRow}>
                    <Text style={styles.code}>{data ? data.code : "QR7811"}</Text>
                    <Text style={styles.copy}>Copy</Text>
                </View>
                <TouchableOpacity style={styles.referButton}>
                    <Text style={styles.referButtonText}>Refer Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Refer & Earn</Text>
            </View>
            <FlatList
                data={historyData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for footer
            />
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
    footer: {
        paddingTop: 24,
    },
    referCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
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