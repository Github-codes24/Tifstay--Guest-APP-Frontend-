import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function ThanksScreen() {
    const router = useRouter();

    // Auto redirect after 3 seconds
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         router.replace("/"); // redirects to home
    //     }, 3000);

    //     return () => clearTimeout(timer);
    // }, []);

    return (
        <View style={styles.container}>
            {/* Icon */}
            <View style={styles.iconContainer}>
                <Image
                    source={require("@/assets/images/App_icon.png")}
                    style={styles.icon}
                />

            </View>

            {/* Text */}
            <Text style={styles.title}>Thanks!</Text>
            <Text style={styles.subtitle}>
                Your review has been submitted and helps others discover great deals.
            </Text>

            {/* Manual back button (optional) */}
            <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
                <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
        </View>
    );
}

// 💅 Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    icon: {
        width: 90,
        height: 90,
        resizeMode: "contain",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E2A78",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        color: "#444",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#004AAD",
        paddingVertical: 12,
        borderRadius: 8,
        width: "100%",          
        height: 60,
        justifyContent: "center", 
        alignItems: "center",     
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },

});
