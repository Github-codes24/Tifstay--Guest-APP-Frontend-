import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DeleteAccountScreen = () => {
    const [reason, setReason] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const handleDelete = async () => {
        if (!accepted) {
            Alert.alert("Error", "Please accept the terms & conditions first");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "No token found. Please login again.");
                router.replace("/(auth)/login");
                return;
            }

            const response = await axios.delete(
                "https://tifstay-project-be.onrender.com/api/guest/deleteAccount",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success || response.data.data?.guest?.isDeleted) {
                await AsyncStorage.removeItem("token");
                setSuccessModal(true); // ✅ show modal instead of screen navigation
            } else {
                Alert.alert("Error", response.data.message || "Failed to delete account");
            }
        } catch (error: any) {
            console.log(error.response?.data || error.message);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={18} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delete Account</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.intro}>
                    We are sorry to see you go! Deleting account is a permanent action.
                </Text>

                {/* Dummy bullet list */}
                <View style={styles.bulletList}>
                    {[
                        "Lorem ipsum dolor sit amet consectetur.",
                        "Sed morbi porttitor elit nisi malesuada elementum eget viverra.",
                        "Hendrerit commodo nam a eget vestibulum nunc leo.",
                        "Lobortis aliquam purus lorem erat nullam ac tincidunt ac.",
                        "Vivamus amet euismod semper tortor vestibulum elit nullam.",
                        "Nunc consectetur sed amet interdum vitae.",
                        "Ultrices aenean viverra neque cras egestas commodo enim.",
                        "Vulputate amet nulla diam semper tortor vestibulum elit aliquam.",
                        "Ac curabitur convallis ullamcorper non condimentum est blandit nullam at.",
                        "Aliquam eget sit ac massa vitae.",
                        "Tincidunt consequat duis ac eu nulla donec.",
                        "Vulputate amet nulla diam semper tortor vestibulum elit aliquam.",
                        "Ac curabitur convallis ullamcorper non condimentum est blandit nullam at.",
                        "Aliquam eget sit ac massa vitae.",
                        "Tincidunt consequat duis ac eu nulla donec.",
                    ].map((item, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>


                <Text style={styles.feedbackLabel}>Please tell us why you leaving us</Text>
                <TextInput
                    style={styles.feedbackInput}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    placeholder="Your feedback will help us improve TifStay"
                />
                {/* Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAccepted(!accepted)}
                >
                    <View
                        style={[
                            styles.checkbox,
                            accepted && { backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center' },
                        ]}
                    >
                        {accepted && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                        I have read and agreed to the terms & conditions.
                    </Text>
                </TouchableOpacity>


                {/* Delete Button */}
                <TouchableOpacity
                    style={[styles.deleteButton, !accepted && { opacity: 0.6 }]}
                    onPress={handleDelete}
                    disabled={!accepted || loading}
                >
                    <Text style={styles.deleteButtonText}>
                        {loading ? "Deleting..." : "Delete Account"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ✅ Success Modal */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Account Deleted 🎉</Text>
                        <Text style={styles.modalMessage}>
                            Your account has been permanently deleted.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setSuccessModal(false);
                                router.replace("/(auth)/login"); // go back to login
                            }}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default DeleteAccountScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
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
    intro: { fontSize: 14, color: colors.title, marginVertical: 12, fontWeight: 500 },
    bulletList: { marginVertical: 8 },
    bulletRow: { flexDirection: "row", marginBottom: 8 },
    bullet: { fontSize: 16, marginRight: 6, color: '#0A051F' },
    bulletText: { fontSize: 14, color: colors.grey, flex: 1, lineHeight: 20 },
    feedbackLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
        color: colors.title,
    },
    feedbackInput: {
        minHeight: 150,
        borderWidth: 1,
        borderColor: colors.inputColor,
        borderRadius: 8,
        padding: 19,
        fontSize: 16,
        textAlignVertical: "top",
        color: "#666060",
        backgroundColor:'#F8F5FF'
    },
    checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#FF6B00',
        marginRight: 10,
        borderRadius: 4,
    },
    checkboxText: { fontSize: 13, color: colors.grey, flex: 1 },
    deleteButton: {
        backgroundColor: colors.primary,
        marginTop: 28,
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    deleteButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    modalMessage: { fontSize: 14, color: colors.grey, textAlign: "center" },
    modalButton: {
        marginTop: 16,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
