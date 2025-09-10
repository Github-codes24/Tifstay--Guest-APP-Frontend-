// screens/Checkout.tsx
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
import { CartItemData } from "@/components/CartCard";

const Checkout: React.FC = () => {
  const { serviceType } = useLocalSearchParams();
  const isTiffin = serviceType === "tiffin";

  console.log({ serviceType });
  const cartItem: CartItemData = {
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

          {/* Cart Item */}
          <View style={styles.cartItemContainer}>
            <Image
              source={{ uri: cartItem.imageUrl }}
              style={styles.foodImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.foodTitle}>{cartItem.title}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Meal Type</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.mealType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Type</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.foodType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.startDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.plan}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Type</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.orderType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{cartItem.price}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionSection}>
          <Text style={styles.paymentSectionTitle}>Transaction Details</Text>

          <View style={styles.transactionDetails}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Subtotal (1 items)</Text>
              <Text style={styles.transactionValue}>₹120</Text>
            </View>

            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>TPS (5%)</Text>
              <Text style={styles.transactionValue}>₹ 20</Text>
            </View>

            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>TVQ (9.975%)</Text>
              <Text style={styles.transactionValue}>₹ 30</Text>
            </View>

            <View style={[styles.totalRow]}>
              <Text>Total</Text>
              <Text style={styles.totalValue}>₹120.50</Text>
            </View>

            <View style={styles.lessOffRow}>
              <Text style={styles.transactionLabel}>Less off 10%</Text>
              <Text style={styles.transactionValue}>₹20</Text>
            </View>

            <View style={[styles.netRow]}>
              <Text style={styles.netLabel}>Net</Text>
              <Text style={styles.netValue}>₹100.50</Text>
            </View>
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

        {/* Pay Button */}

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
            onPress={() => router.push("/payment")}
          >
            <Text style={styles.payButtonText}>Pay ₹100.50</Text>
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
  cartItemContainer: {
    flexDirection: "row",
    position: "relative",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    width: 70,
  },
  detailColon: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 6,
  },
  detailValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  calendarIcon: {
    position: "absolute",
    right: 0,
    bottom: 0,
    padding: 4,
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
  lessOffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  lessOffLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
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
    paddingBottom: 34, // Account for home indicator on iPhone
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
    height: 120, // Increase to account for fixed payment section
  },
});

export default Checkout;
