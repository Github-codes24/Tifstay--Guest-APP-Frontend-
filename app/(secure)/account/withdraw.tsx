// DocumentsScreen.tsx
import * as React from "react";
import { useState } from "react";
import {
    SafeAreaView,
} from "react-native-safe-area-context";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import colors from "@/constants/colors";

// If you have a colors file, feel free to swap these.
const COLORS = {
    bg: "#FFFFFF",
    text: "#0A0A0A",
    subText: "#6B7280",
    border: "#E5E7EB",
    dashed: "#D1D5DB",
    primaryBlue: "#1A73E8",
    card: "#FFFFFF",
    shadow: "rgba(16, 24, 40, 0.04)",
};

export default function DocumentsScreen() {
    const [imageUri, setImageUri] = useState<string | null>(null);

    const pickImage = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Allow photo library access to upload.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets?.length) {
            setImageUri(result.assets[0].uri);
        }
    };

    const removeImage = () => setImageUri(null);

    const onDigiLocker = () => {
        // TODO: Deep link / WebView to DigiLocker.
        Alert.alert("DigiLocker", "Hook this to your DigiLocker flow.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Documents</Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>Upload your document or digi locker</Text>

                {/* Upload Card */}
                <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                        <Ionicons name="camera-outline" size={18} color="#111" />
                        <Text style={styles.cardTitle}>Upload Aadhaar Card Photo</Text>
                    </View>

                    <Pressable
                        onPress={pickImage}
                        style={({ pressed }) => [
                            styles.dashedArea,
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        {imageUri ? (
                            <View style={{ width: "100%", height: "100%" }}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.preview}
                                    resizeMode="cover"
                                />
                                <View style={styles.previewActions}>
                                    <Pressable onPress={pickImage} style={styles.smallBtn}>
                                        <Text style={styles.smallBtnText}>Change</Text>
                                    </Pressable>
                                    <Pressable onPress={removeImage} style={[styles.smallBtn, { backgroundColor: "#F3F4F6" }]}>
                                        <Text style={[styles.smallBtnText, { color: "#111" }]}>Remove</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            <View style={{ alignItems: "center" }}>
                                {/* <Ionicons name="cloud-upload-outline" size={28} color={COLORS.subText} /> */}
                                <Text style={styles.uploadTitle}>Upload photo</Text>
                                <Text style={styles.uploadHint}>
                                    Upload clear photo of your Aadhaar card
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Or */}
                <Text style={styles.orText}>Or</Text>

                {/* DigiLocker button */}
                <Pressable onPress={onDigiLocker} style={styles.digilockerBtn}>
                    <Text style={styles.digilockerText}>Verify with DigiLocker</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
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
    headerTitle: {
        marginLeft: 12,
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
    },
    pageTitle: {
        fontSize: 16,
        color: colors.title,
        marginBottom: 16,
        fontWeight: "600",
    },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOpacity: 1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    cardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.title,
    },

    dashedArea: {
        height: 160,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: COLORS.dashed,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    uploadTitle: {
        marginTop: 6,
        fontSize: 12,
        color: colors.grey,
        fontWeight: "600",
    },
    uploadHint: {
        marginTop: 4,
        fontSize: 10,
        color: colors.grey,
    },
    preview: {
        width: "100%",
        height: "100%",
    },
    previewActions: {
        position: "absolute",
        right: 8,
        bottom: 8,
        flexDirection: "row",
        gap: 8,
    },
    smallBtn: {
        backgroundColor: COLORS.primaryBlue,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    smallBtnText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },

    orText: {
        textAlign: "center",
        marginVertical: 16,
        color: COLORS.subText,
        fontWeight: "600",
    },

    digilockerBtn: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    digilockerText: {
        color: colors.primary,
        fontWeight: "700",
        fontSize: 14,
    },
});
