import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Logo from "../../components/Logo";
import { useAuthStore } from "@/store/authStore";

export default function SuccessScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        // Navigate to dashboard after successful login
        router.replace("/(secure)/(tabs)");
      } else {
        // Fallback to login if something went wrong
        router.replace("/(auth)/login");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Logo showText={false} />
      <Text style={styles.title}>Congrats!</Text>
      <Text style={styles.subtitle}>Login successful.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "700", marginTop: 24 },
  subtitle: { fontSize: 14, color: "#444", marginTop: 8 },
});
