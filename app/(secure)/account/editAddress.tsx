import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

const AddressScreen = () => {
    const [isHome, setIsHome] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Address</Text>
            </View>
            <KeyboardAwareScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                enableOnAndroid
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Image source={require('../../../assets/images/map.png')} style={styles.mapImage} />
                <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', marginTop: 20, gap: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 8 }}>
                    <Image source={require('../../../assets/images/basil.png')} style={{ height: 20, width: 20, marginLeft: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: 400, color: colors.primary }}>Use my current location</Text>
                </View>
                <LabeledInput
                    label="Address"
                    containerStyle={styles.inputMargin}
                    inputContainerStyle={styles.inputTall}
                    value="123 Main Street, Dharampeth, Nagpur - 440010"
                    multiline
                    labelStyle={styles.label}
                />

                <View style={styles.row}>
                    <LabeledInput
                        label="Street"
                        containerStyle={styles.flexInput}
                        inputContainerStyle={styles.input}
                        value="123 Main Street"
                        multiline
                        labelStyle={styles.label}
                    />
                    <LabeledInput
                        label="Post Code"
                        containerStyle={styles.flexInput}
                        inputContainerStyle={styles.input}
                        value="440010"
                        multiline
                        labelStyle={styles.label}
                    />
                </View>

                <View style={styles.labelSection}>
                    <Text style={styles.labelTitle}>Label as</Text>
                    <View style={styles.labelRow}>
                        <TouchableOpacity
                            onPress={() => setIsHome(true)}
                            style={[
                                styles.iconWrapper,
                                isHome ? styles.inactiveBg : styles.activeBg,
                            ]}
                        >
                            <Image
                                source={require("../../../assets/images/home1.png")}
                                style={[
                                    styles.icon,
                                    { tintColor: isHome ? colors.primary : colors.white },
                                ]}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsHome(false)}
                            style={[
                                styles.iconWrapper,
                                isHome ? styles.activeBg : styles.inactiveBg,
                            ]}
                        >
                            <Image
                                source={require("../../../assets/images/work.png")}
                                style={[
                                    styles.icon,
                                    { tintColor: isHome ? colors.white : colors.primary },
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* <CommonButton title="Save" buttonStyle={styles.saveButton} onPress={() => {}} /> */}
            </KeyboardAwareScrollView>
            <CustomButton title="Save" onPress={() => { }} style={{ width: '90%', alignSelf: 'center', marginVertical: 0 }} />
        </SafeAreaView>
    );
};

export default AddressScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    mapImage: {
        width: "100%",
        height: 226,
        resizeMode: "cover",
        marginTop: 28
    },
    inputMargin: {
        marginTop: 20,
    },
    inputTall: {
        minHeight: 75,
    },
    input: {
        minHeight: 56,
    },
    label: {
        fontSize: 14,
        // fontFamily: fonts.interSemibold,
        fontWeight: 600,
        color: colors.title,
    },
    row: {
        flexDirection: "row",
        marginTop: 48,
    },
    flexInput: {
        flex: 1,
    },
    labelSection: {
        marginTop: 24,
        paddingHorizontal: 16
    },
    labelTitle: {
        fontSize: 14,
        marginBottom: 8,
        // fontFamily: fonts.interSemibold,
        color: colors.title,
    },
    labelRow: {
        flexDirection: "row",
        gap: 12,
    },
    iconWrapper: {
        height: 52,
        width: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    activeBg: {
        backgroundColor: colors.primary,
    },
    inactiveBg: {
        backgroundColor: colors.inputColor,
    },
    icon: {
        height: 24,
        width: 24,
    },
    saveButton: {
        marginTop: 40,
    },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" }
});
