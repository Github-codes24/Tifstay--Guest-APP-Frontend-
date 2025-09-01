import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Logo from "../../components/Logo";

export default function SuccessScreen() {
  const router = useRouter();

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/auth/login");
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Logo showText={false} />
      <Text style={styles.title}>Congrats!</Text>
      <Text style={styles.subtitle}>Password reset successful.</Text>
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
