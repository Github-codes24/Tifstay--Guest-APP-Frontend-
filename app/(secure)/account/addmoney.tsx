import * as React from "react";
import { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";

const INR = (n: number, fd = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(n);

export default function AddMoneyScreen() {
  const currentBalance = 25000;
  const [amountStr, setAmountStr] = useState<string>("0");
  const amount = useMemo(() => parseInt(amountStr || "0", 10) || 0, [amountStr]);
  const insets = useSafeAreaInsets();

  const appendDigit = (d: number) => {
    setAmountStr((prev) => {
      if (prev === "0") return String(d);
      if (prev.length >= 9) return prev;
      return prev + String(d);
    });
  };

  const backspace = () => {
    setAmountStr((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const quickAdd = (inc: number) => {
    setAmountStr(String((parseInt(amountStr || "0", 10) || 0) + inc));
  };

  const onSelectCard = () => {};

const onAddMoney = async () => {
  if (amount <= 0) return;

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Error", "User not authenticated");

    const response = await axios.post(
      "https://tifstay-project-be.onrender.com/api/guest/wallet/create-link",
      { amount },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data?.success) {
      const paymentUrl = response.data.data?.paymentLinkUrl; 
      if (paymentUrl) {
        const supported = await Linking.canOpenURL(paymentUrl);
        if (supported) {
          Alert.alert("Redirecting", "Opening payment link...");
          await Linking.openURL(paymentUrl);
        } else {
          Alert.alert("Error", "Cannot open payment link.");
        }
      } else {
        Alert.alert("Success", "Payment link created.");
      }
    } else {
      Alert.alert("Error", response.data?.message || "Something went wrong");
    }
  } catch (error: any) {
    Alert.alert("Error", error.response?.data?.message || "Something went wrong");
  }
};




  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Money</Text>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.cardTitle}>Current Balance</Text>
        <Text style={styles.cardSub}>{INR(currentBalance, 2)}</Text>
        <Text style={styles.bigAmount}>{INR(amount, 0)}</Text>

        <View style={styles.quickRow}>
          {[
            { label: "+ ₹1,000", val: 1000 },
            { label: "+ ₹5,000", val: 5000 },
            { label: "+ ₹10,000", val: 10000 },
          ].map((q) => (
            <Pressable
              key={q.label}
              onPress={() => quickAdd(q.val)}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.quickText}>{q.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "rgba(242, 237, 237, 0.6)",
          position: "absolute",
          bottom: insets.bottom ? insets.bottom : 0,
          right: 0,
          left: 0,
        }}
      >
        <Pressable style={styles.cardRow} onPress={onSelectCard}>
          <View style={styles.mcWrap}>
            <View style={[styles.mcDot, { backgroundColor: "#EA001B" }]} />
            <View style={[styles.mcDot, { backgroundColor: "#F79E1B", marginLeft: -10 }]} />
          </View>
          <Text style={styles.cardRowText}>**** **** **76 3054</Text>
          <Ionicons name="chevron-forward" size={18} color="#111" />
        </Pressable>

        <View style={[styles.keypad]}>
          <View style={styles.keypadRow}>
            <Key keyLabel="1" onPress={() => appendDigit(1)} />
            <Key keyLabel="2" onPress={() => appendDigit(2)} />
            <Key keyLabel="3" onPress={() => appendDigit(3)} />
          </View>
          <View style={styles.keypadRow}>
            <Key keyLabel="4" onPress={() => appendDigit(4)} />
            <Key keyLabel="5" onPress={() => appendDigit(5)} />
            <Key keyLabel="6" onPress={() => appendDigit(6)} />
          </View>
          <View style={styles.keypadRow}>
            <Key keyLabel="7" onPress={() => appendDigit(7)} />
            <Key keyLabel="8" onPress={() => appendDigit(8)} />
            <Key keyLabel="9" onPress={() => appendDigit(9)} />
          </View>
          <View style={styles.keypadRow}>
            <View style={{ flex: 1 }} />
            <Key keyLabel="0" onPress={() => appendDigit(0)} />
            <Key
              ghost
              icon={<Ionicons name="backspace-outline" size={26} color="#111" />}
              onPress={backspace}
            />
          </View>
        </View>

        <Pressable
          onPress={onAddMoney}
          style={[styles.primaryBtn, amount <= 0 && { opacity: 0.5 }]}
          disabled={amount <= 0}
        >
          <Text style={styles.primaryBtnText}>Add Money</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Key({
  keyLabel,
  icon,
  onPress,
  ghost = false,
}: {
  keyLabel?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  ghost?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        ghost && styles.keyGhost,
        pressed && { opacity: 0.85 },
      ]}
      hitSlop={8}
    >
      {keyLabel ? <Text style={styles.keyText}>{keyLabel}</Text> : icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
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
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
  amountCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDF0F6",
    marginTop: 6,
    marginHorizontal: 16,
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: colors.title,
  },
  cardSub: {
    textAlign: "center",
    fontSize: 12,
    color: colors.grey,
    marginTop: 2,
    fontWeight: "500",
  },
  bigAmount: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "700",
    color: colors.title,
    marginTop: 16,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.lightBg,
  },
  quickText: { fontWeight: "500", color: colors.title, fontSize: 12 },
  cardRow: {
    height: 56,
    borderRadius: 10,
    backgroundColor: "#DFE1E6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mcWrap: { flexDirection: "row", alignItems: "center" },
  mcDot: { width: 16, height: 16, borderRadius: 8 },
  cardRowText: {
    flex: 1,
    color: colors.title,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  keypad: { marginVertical: 18, gap: 12, marginHorizontal: 16 },
  keypadRow: { flexDirection: "row", gap: 12, backgroundColor: "#F2F2F2" },
  key: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  keyGhost: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 22, fontWeight: "400", color: "#111827" },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
