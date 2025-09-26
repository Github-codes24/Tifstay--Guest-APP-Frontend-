import CustomButton from "@/components/CustomButton";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AddressScreen = () => {
    const { addressId } = useLocalSearchParams(); // Get addressId from route
    const [isHome, setIsHome] = useState(false);
    const [address, setAddress] = useState("");
    const [street, setStreet] = useState("");
    const [postCode, setPostCode] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (addressId) fetchAddressById();
        else setLoading(false);
    }, [addressId]);

    // Fetch address by ID
    const fetchAddressById = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return Alert.alert("Error", "No token found!");

            const response = await axios.get(
                `https://tifstay-project-be.onrender.com/api/guest/address/getAddress/${addressId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const data = response.data.data.address;
                setAddress(data.address);
                setStreet(data.street);
                setPostCode(data.postCode);
                setIsHome(data.label === "Home");
            } else {
                Alert.alert("Error", "Failed to fetch address");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to fetch address");
        } finally {
            setLoading(false);
        }
    };

    // Update address by ID
    const updateAddress = async () => {
        if (!address || !street || !postCode) return Alert.alert("Error", "All fields are required!");
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return Alert.alert("Error", "No token found!");

            const response = await axios.put(
                `https://tifstay-project-be.onrender.com/api/guest/address/editAddress/${addressId}`,
                {
                    address,
                    street,
                    postCode,
                    label: isHome ? "Home" : "Work",
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                Alert.alert("Success", "Address updated successfully", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                Alert.alert("Error", "Failed to update address");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to update address");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{addressId ? "Edit Address" : "Add Address"}</Text>
            </View>
            <KeyboardAwareScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                enableOnAndroid
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
            >
                <Image source={require('../../../assets/images/map.png')} style={styles.mapImage} />
                <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', marginTop: 20, gap: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 8 }}>
                    <Image source={require('../../../assets/images/basil.png')} style={{ height: 20, width: 20, marginLeft: 12 }} />
                    <Text style={{ fontSize: 14, fontWeight: "400", color: colors.primary }}>Use my current location</Text>
                </View>

                <LabeledInput
                    label="Address"
                    containerStyle={styles.inputMargin}
                    inputContainerStyle={styles.inputTall}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    labelStyle={styles.label}
                />

                <View style={styles.row}>
                    <LabeledInput
                        label="Street"
                        containerStyle={styles.flexInput}
                        inputContainerStyle={styles.input}
                        value={street}
                        onChangeText={setStreet}
                        multiline
                        labelStyle={styles.label}
                    />
                    <LabeledInput
                        label="Post Code"
                        containerStyle={styles.flexInput}
                        inputContainerStyle={styles.input}
                        value={postCode}
                        onChangeText={setPostCode}
                        multiline
                        labelStyle={styles.label}
                    />
                </View>

                <View style={styles.labelSection}>
                    <Text style={styles.labelTitle}>Label as</Text>
                    <View style={styles.labelRow}>
                        <TouchableOpacity
                            onPress={() => setIsHome(true)}
                            style={[styles.iconWrapper, isHome ? styles.activeBg : styles.inactiveBg]}
                        >
                            <Image
                                source={require("../../../assets/images/home1.png")}
                                style={styles.icon}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsHome(false)}
                            style={[styles.iconWrapper, !isHome ? styles.activeBg : styles.inactiveBg]}
                        >
                            <Image
                                source={require("../../../assets/images/work.png")}
                                style={styles.icon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <CustomButton title="Save" onPress={updateAddress} style={{ width: '90%', alignSelf: 'center', marginVertical: 0 }} />
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
        fontWeight: "600",
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    backButton: {
        width: 28,
        height: 28,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.title,
        justifyContent: "center",
        alignItems: "center"
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 16,
        color: "#000"
    },
    mapImage: { width: "100%", height: 226, resizeMode: "cover", marginTop: 28 }
});
