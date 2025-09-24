import CustomButton from "@/components/CustomButton";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChangePasswordScreen = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSave = () => {
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }

        console.log("Password changed successfully!");
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Card</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={{ paddingHorizontal: 12 }}>
                    <LabeledInput
                        label="Old Password"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="XXXXXXXX"
                        labelStyle={styles.label}
                        containerStyle={{ marginBottom: 20 }}
                    />

                    <LabeledInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="XXXXXXXX"
                        labelStyle={styles.label}
                        containerStyle={{ marginBottom: 20 }}
                    />

                    <LabeledInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="XXXXXXXX"
                        labelStyle={styles.label}
                        containerStyle={{ marginBottom: 20 }}
                    />
                </View>

                <CustomButton title="Save"
                    onPress={handleSave}
                    style={{ width: '90%', alignSelf: 'center' }}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 40,
        paddingBottom: 20,
        backgroundColor: "#fff",
        flexGrow: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
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
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
        color: "#0A051F",
    },
    label: {
        color: colors.title,
        fontSize: 14,
        fontWeight: '600',
        // fontFamily:fonts.interSemibold,
        marginBottom: 8,

    },
});

export default ChangePasswordScreen;
