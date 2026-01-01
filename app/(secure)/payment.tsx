import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Button from "@/components/Buttons";
import mastercard from "@/assets/images/icons/mastercard.png";
import visa from "@/assets/images/icons/visa.png";
import paypal from "@/assets/images/icons/paypal.png";
import stripe from "@/assets/images/icons/stripe.png";
import wallet from "@/assets/images/icons/wallet.png";
import Header from "@/components/Header";
import { BASE_URL } from "@/constants/api";

interface PaymentMethod {
  id: string;
  name: string;
  icon?: any;
  type: "card" | "wallet" | "payment_service";
  cardNumber?: string;
  balance?: string;
  isCard?: boolean;
}

const Payment: React.FC = () => {
  const params = useLocalSearchParams();
  const { serviceType, amount, bookingId, serviceName } = params;

  if (!bookingId || !amount) {
    Alert.alert(
      "Missing Data",
      "Booking ID or Amount is missing. Please go back and try again.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  const isTiffin = serviceType === "tiffin";
  const numericAmount = Number(String(amount).replace(/[^0-9.-]+/g, ""));

  const [selectedMethod, setSelectedMethod] = useState<string>("mastercard");
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    { id: "paypal", name: "PayPal", icon: paypal, type: "payment_service" },
    { id: "mastercard", name: "Mastercard", type: "card", cardNumber: "**76 3054", isCard: true },
    { id: "visa", name: "Visa", icon: visa, type: "card" },
    { id: "stripe", name: "Stripe", icon: stripe, type: "payment_service" },
    { id: "wallet", name: "TifStay Wallet", icon: wallet, type: "wallet", balance: "₹25,000.00" },
  ];
  

  const handleContinue = async () => {
    if (isLoading) return;

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "The payment amount is invalid.");
      return;
    }

    setIsLoading(true);

    try {
      if (serviceType !== "hostel") {
        throw new Error("Tiffin payment not implemented yet");
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing. Please log in again.");

      const apiUrl = `${BASE_URL}/api/guest/hostelServices/createPaymentLink/${bookingId}`;
      const payload = {
        totalAmount: numericAmount,
        currency: "INR",
        paymentMethod: selectedMethod,
      };

      console.log("🧾 Payload:", payload);

      const response = await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Payment Link Response:", response.data);

      if (!response.data.success) throw new Error(response.data.message);

      const { paymentLinkUrl, paymentLinkId, totalAmount: backendTotal, currency, hostelBookingId } = response.data.data;

      const canOpen = await Linking.canOpenURL(paymentLinkUrl);
      if (!canOpen) throw new Error("Cannot open payment link");

      await Linking.openURL(paymentLinkUrl);

      router.push({
        pathname: "/confirmation",
        params: {
          serviceType,
          amount,
          bookingId,
          serviceName,
          paymentMethod: selectedMethod,
          paymentLinkId,
          totalAmount: backendTotal,
          currency,
          hostelBookingId,
        },
      });
    } catch (error: any) {
      console.error("❌ Payment Error:", error.message);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        Alert.alert("Session Expired", "Please log in again.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
        return;
      }

      Alert.alert("Payment Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Payment" onBack={() => router.back()} showBackButton={true} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Payment</Text>
          <Text style={styles.subtitle}>Select the Payment Method you want to use</Text>
        </View>

        <View style={styles.paymentInfoBox}>
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoLabel}>{isTiffin ? "Tiffin Service" : "Hostel Booking"}</Text>
            <Text style={styles.paymentInfoValue}>{serviceName}</Text>
          </View>
          <View style={styles.paymentInfoDivider} />
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoLabel}>Amount to Pay</Text>
            <Text style={styles.paymentInfoAmount}>{amount}</Text>
          </View>
        </View>

        <View style={styles.methodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedCard,
                method.isCard && styles.mastercardStyle,
              ]}
              onPress={() => setSelectedMethod(method.id)}
              disabled={isLoading}
            >
              {method.isCard ? (
                <View style={styles.mastercardContent}>
                  <Image source={mastercard} style={styles.mastercardLogo} />
                  <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                </View>
              ) : (
                <View style={styles.methodLeft}>
                  {method.icon && (
                    <View style={styles.iconContainer}>
                      <Image source={method.icon} style={styles.methodIcon} />
                    </View>
                  )}
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    {method.balance && <Text style={styles.methodBalance}>Available Balance: {method.balance}</Text>}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Processing..." : `Pay ${amount}`}
          onPress={handleContinue}
          disabled={isLoading}
          width={undefined}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { flex: 1, padding: 16 },
  titleSection: { marginBottom: 24 },
  mainTitle: { fontSize: 24, fontWeight: "700", color: "#000", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666" },
  paymentInfoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentInfoLabel: { fontSize: 14, color: "#666" },
  paymentInfoValue: { fontSize: 14, fontWeight: "500", color: "#333" },
  paymentInfoDivider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  paymentInfoAmount: { fontSize: 18, fontWeight: "700", color: "#004AAD" },
  methodsContainer: { gap: 12 },
  methodCard: { backgroundColor: "#F2EFFD", borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  selectedCard: { borderWidth: 2, borderColor: "#004AAD" },
  mastercardStyle: { backgroundColor: "#1E1E1E", paddingVertical: 24 },
  mastercardContent: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mastercardLogo: { width: 50, height: 30, resizeMode: "contain" },
  cardNumber: { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 2 },
  methodLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  methodIcon: { width: 30, height: 30, resizeMode: "contain" },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  methodBalance: { fontSize: 13, color: "#666" },
  buttonContainer: { padding: 16 },
  continueButton: { alignSelf: "center" },
});

export default Payment;
