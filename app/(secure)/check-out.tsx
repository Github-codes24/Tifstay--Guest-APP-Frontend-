// app/checkout.tsx
import React from "react";
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
import { mastercard } from "@/assets/images";
import CheckoutItemCard, {
  TiffinCheckoutData,
  HostelCheckoutData,
} from "@/components/CheckoutItemCard";

const Checkout: React.FC = () => {
  const { serviceType } = useLocalSearchParams();
  const isTiffin = serviceType === "tiffin";
  const isHostel = serviceType === "hostel";
  console.log("Service Type:", serviceType);

  // Sample data - replace with actual data from navigation params or context
  const tiffinData: TiffinCheckoutData = {
    id: "1",
    title: "Maharashtrian Ghar Ka Khana",
    imageUrl:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    mealType: "Lunch",
    foodType: "Veg",
    startDate: "21/07/25",
    plan: "Daily",
    orderType: "Delivery",
    price: "₹120/meal",
  };

  const hostelData: HostelCheckoutData = {
    id: "2",
    title: "Scholars Den Boys Hostel",
    imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
    guestName: "Onil Karmokar",
    contact: "0190825000",
    checkInDate: "01/08/25",
    checkOutDate: "01/09/25",
    rent: "₹8000/month",
    deposit: "₹15000",
  };

  const checkoutData = isTiffin ? tiffinData : hostelData;

  // Calculate transaction details based on service type
  const getTransactionDetails = () => {
    if (isTiffin) {
      return {
        subtotal: 120,
        tps: 20,
        tvq: 30,
        total: 120.5,
        discount: 20,
        net: 100.5,
      };
    } else {
      return {
        rent: 8000,
        tps: 15000, // Using TPS for deposit display
        tvq: 200,
        total: 23200,
        net: 23200,
      };
    }
  };

  const transaction = getTransactionDetails();

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Ordered Section */}
        <View style={styles.itemOrderedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Item ordered</Text>
            <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceText}>↓ Invoice</Text>
            </TouchableOpacity>
          </View>

          {/* Use the reusable component */}
          <CheckoutItemCard
            serviceType={isTiffin ? "tiffin" : "hostel"}
            data={checkoutData}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionSection}>
          <Text style={styles.paymentSectionTitle}>Transaction Details</Text>

          <View style={styles.transactionDetails}>
            {isTiffin ? (
              // Tiffin Transaction Details
              <>
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>
                    Subtotal (1 items)
                  </Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.subtotal}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>TPS (5%)</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.tps}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>TVQ (9.975%)</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.tvq}
                  </Text>
                </View>

                <View style={[styles.totalRow]}>
                  <Text>Total</Text>
                  <Text style={styles.totalValue}>₹{transaction.total}</Text>
                </View>

                <View style={styles.lessOffRow}>
                  <Text style={styles.transactionLabel}>Less off 10%</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.discount}
                  </Text>
                </View>

                <View style={[styles.netRow]}>
                  <Text style={styles.netLabel}>Net</Text>
                  <Text style={styles.netValue}>₹{transaction.net}</Text>
                </View>
              </>
            ) : (
              // Hostel Transaction Details
              <>
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Rent</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.rent}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>TPS (5%)</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.tps}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>TVQ (9.975%)</Text>
                  <Text style={styles.transactionValue}>
                    ₹{transaction.tvq}
                  </Text>
                </View>

                <View style={[styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{transaction.total}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policySection}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <Text style={styles.policyText}>
            Please double-check your order and address details.{"\n"}
            Orders are non-refundable once placed.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Payment Method */}
      <View style={styles.paymentSection}>
        <View style={styles.paymentContent}>
          <View style={styles.paymentMethodContainer}>
            <View style={styles.paymentMethodLeft}>
              <Image source={mastercard} style={styles.cardIcon} />
              <View style={styles.paymentTextContainer}>
                <View style={styles.payUsingRow}>
                  <Text style={styles.payUsing}>Pay Using</Text>
                  <Ionicons
                    name="caret-up"
                    size={12}
                    color="#000"
                    style={styles.caretIcon}
                  />
                </View>
                <Text style={styles.cardDetails}>Credit Card | **3054</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={() => {
              router.push({
                pathname: "/payment",
                params: {
                  serviceType: isTiffin ? "tiffin" : "hostel",
                  amount: `₹${transaction.net || transaction.total}`,
                  serviceId: checkoutData.id,
                  serviceName: checkoutData.title,
                },
              });
            }}
          >
            <Text style={styles.payButtonText}>
              Pay ₹{transaction.net || transaction.total}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
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
  scrollView: {
    flex: 1,
  },
  itemOrderedSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceText: {
    color: "#4A90E2",
    fontSize: 14,
  },
  transactionSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 8,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  transactionDetails: {
    marginTop: 4,
    marginHorizontal: 20,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  transactionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  transactionValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "400",
  },
  totalRow: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  lessOffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  netRow: {
    paddingTop: 14,
    marginTop: 0,
    marginBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  netValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  policySection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  policyText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  paymentSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2EFFD",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentMethodContainer: {
    flex: 1,
    marginRight: 12,
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 32,
    height: 20,
    marginRight: 12,
    resizeMode: "contain",
  },
  paymentTextContainer: {
    flex: 1,
  },
  payUsingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  payUsing: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  caretIcon: {
    marginLeft: 4,
  },
  cardDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  payButton: {
    backgroundColor: "#2854C5",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 120,
  },
});

export default Checkout;
