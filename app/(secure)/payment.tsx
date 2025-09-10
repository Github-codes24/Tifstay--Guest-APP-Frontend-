// screens/Payment.tsx
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
import { router } from "expo-router";
import Button from "../../components/Buttons";
import { mastercard, visa, paypal, stripe, wallet } from "@/assets/images";

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

  const handleContinue = () => {
    console.log("Selected payment method:", selectedMethod);
    router.push("/confirmation");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Payment</Text>
          <Text style={styles.subtitle}>
            Select the Payment Methods you Want to Use
          </Text>
        </View>

        {/* Payment Methods */}
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
                // Special styling for Mastercard
                <View style={styles.mastercardContent}>
                  <Image source={mastercard} style={styles.mastercardLogo} />
                  <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                </View>
              ) : (
                // Regular payment method layout
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

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          width={undefined} // Will use default 80% width
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
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#004AAD",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#004AAD",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#004AAD",
  },
  buttonContainer: {
    padding: 16,
  },
  continueButton: {
    alignSelf: "center",
  },
});

export default Payment;
