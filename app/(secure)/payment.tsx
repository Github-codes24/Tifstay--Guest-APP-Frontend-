import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Button from "@/components/Buttons";
import mastercard from "@/assets/images/icons/mastercard.png";
import visa from "@/assets/images/icons/visa.png";
import paypal from "@/assets/images/icons/paypal.png";
import stripe from "@/assets/images/icons/stripe.png";
import wallet from "@/assets/images/icons/wallet.png";
import Header from "@/components/Header";

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
  const { serviceType, amount, serviceId, serviceName } = params;
  const isTiffin = serviceType === "tiffin";

  const [selectedMethod, setSelectedMethod] = useState<string>("mastercard");

  const paymentMethods: PaymentMethod[] = [
    {
      id: "paypal",
      name: "PayPal",
      icon: paypal,
      type: "payment_service",
    },
    {
      id: "mastercard",
      name: "Mastercard",
      type: "card",
      cardNumber: "**76  3054",
      isCard: true,
    },
    {
      id: "visa",
      name: "Visa",
      icon: visa,
      type: "card",
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: stripe,
      type: "payment_service",
    },
    {
      id: "wallet",
      name: "TifStay Wallet",
      icon: wallet,
      type: "wallet",
      balance: "₹25,000.00",
    },
  ];

  // In payment.tsx, update the handleContinue function:
  const handleContinue = () => {
    console.log("Selected payment method:", selectedMethod);
    console.log("Service type:", serviceType);
    console.log("Amount:", amount);

    router.push({
      pathname: "/confirmation",
      params: {
        serviceType,
        amount,
        serviceId,
        serviceName,
        paymentMethod: selectedMethod,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Payment"
        onBack={() => router.back()}
        showBackButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Payment</Text>
          <Text style={styles.subtitle}>
            Select the Payment Method you Want to Use
          </Text>
        </View>

        <View style={styles.paymentInfoBox}>
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoLabel}>
              {isTiffin ? "Tiffin Service" : "Hostel Booking"}
            </Text>
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
            >
              {method.isCard ? (
                <View style={styles.mastercardContent}>
                  <Image source={mastercard} style={styles.mastercardLogo} />
                  <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.methodLeft}>
                    {method.icon && (
                      <View style={styles.iconContainer}>
                        <Image source={method.icon} style={styles.methodIcon} />
                      </View>
                    )}
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      {method.balance && (
                        <Text style={styles.methodBalance}>
                          Available Balance: {method.balance}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title={`Pay ${amount}`}
          onPress={handleContinue}
          width={undefined}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 26,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  paymentInfoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: "#666",
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  paymentInfoDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  paymentInfoAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004AAD",
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: "#F2EFFD",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#004AAD",
  },
  mastercardStyle: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 24,
  },
  mastercardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mastercardLogo: {
    width: 50,
    height: 30,
    resizeMode: "contain",
  },
  cardNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 2,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  methodBalance: {
    fontSize: 13,
    color: "#666",
  },
  buttonContainer: {
    padding: 16,
  },
  continueButton: {
    alignSelf: "center",
  },
});

export default Payment;
