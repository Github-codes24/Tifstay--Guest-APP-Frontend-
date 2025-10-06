import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mastercard from "@/assets/images/icons/mastercard.png";
import CheckoutItemCard, {
  TiffinCheckoutData,
  HostelCheckoutData,
} from "@/components/CheckoutItemCard";
import Header from "@/components/Header";

const Checkout: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'wallet' | null>(null);

  const {
    serviceType,
    bookingId,
    hostelData: hostelDataStr,
    roomData: roomDataStr,
    selectedBeds: selectedBedsStr,
    plan: planStr,
    checkInDate,
    checkOutDate,
    userData: userDataStr,
    bookingType,
  } = useLocalSearchParams();

  const isTiffin = serviceType === "tiffin";
  const isHostel = serviceType === "hostel";

  // Parse JSON strings if they exist (fallback to empty objects/arrays)
  const parsedHostelData = hostelDataStr ? JSON.parse(hostelDataStr as string) : {};
  const parsedRoomData = roomDataStr ? JSON.parse(roomDataStr as string) : {};
  const parsedSelectedBeds = selectedBedsStr ? JSON.parse(selectedBedsStr as string) : [];
  const parsedPlan = planStr ? JSON.parse(planStr as string) : {};
  const parsedUserData = userDataStr ? JSON.parse(userDataStr as string) : {};

  // Log dynamic params for debugging
  console.log("Dynamic Checkout Params:", {
    serviceType,
    bookingId,
    parsedHostelData,
    parsedRoomData,
    parsedSelectedBeds,
    parsedPlan,
    checkInDate,
    checkOutDate,
    parsedUserData,
    bookingType,
  });
  console.log("Received bookingId in Checkout:", bookingId);

  const tiffinData: TiffinCheckoutData = {
    id: bookingId || "1",  // Use dynamic if available, fallback
    title: "Maharashtrian Ghar Ka Khana",  // TODO: Make dynamic for tiffin if params provided
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
    id: bookingId || "2",  // Use real bookingId
    title: parsedHostelData.name || "Fallback Hostel Name",  // e.g., "Testing is it working"
    imageUrl: parsedRoomData.photos?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",  // First room photo
    guestName: parsedUserData.name || "Fallback Name",  // e.g., "F"
    contact: parsedUserData.phoneNumber || "Fallback Phone",  // e.g., "8080805522"
    checkInDate: checkInDate ? new Date(checkInDate as string).toLocaleDateString('en-IN') : "Fallback Date",  // e.g., "06/10/2025"
    checkOutDate: checkOutDate ? new Date(checkOutDate as string).toLocaleDateString('en-IN') : "Fallback Date",  // e.g., "13/10/2025"
    rent: `₹${parsedPlan.price || 0}/month`,  // e.g., "₹0/month"
    deposit: `₹${parsedPlan.depositAmount || 0}`,  // e.g., "₹15000"
  };

  const checkoutData = isTiffin ? tiffinData : hostelData;

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
      const rent = parsedPlan.price || 0;
      const deposit = parsedPlan.depositAmount || 0;
      const tps = deposit;  // As per original logic (TPS for deposit)
      const tvq = 200;  // TODO: Make dynamic if needed
      const total = rent + deposit + tps + tvq;
      return {
        rent,
        tps,
        tvq,
        total,
        net: total,  // No discount for hostel
      };
    }
  };

  const transaction = getTransactionDetails();

  console.log("Transaction Details:", transaction);  // Log transaction for debugging

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletAmount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/wallet/getWalletAmount",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setWalletBalance(response.data.data?.walletAmount || 0);
        }
      } catch (error: any) {
        console.error("Error fetching wallet amount:", error);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWalletAmount();
  }, []);

  const paymentAmount = transaction.net ?? transaction.total ?? 0;

  const createPaymentLink = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !bookingId) {
        Alert.alert("Error", "Token or booking ID missing");
        return null;
      }

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createPaymentLink/${bookingId}`,
        {}, // Assuming no body needed, adjust if required
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        return response.data.data;
      } else {
        Alert.alert("Error", response.data?.message || "Failed to create payment link");
        return null;
      }
    } catch (error: any) {
      console.error("Error creating payment link:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
      return null;
    }
  };

  const handlePayOnline = async () => {
    setModalVisible(false);
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      return;
    }

    // Only for hostel, as per API endpoint; adjust for tiffin if needed
    if (!isHostel) {
      // Fallback for tiffin - navigate to payment
      console.log("Navigating to Payment with bookingId:", bookingId, "Amount:", paymentAmount);
      router.push({
        pathname: "/payment",
        params: {
          serviceType: isTiffin ? "tiffin" : "hostel",
          amount: `₹${paymentAmount}`,
          bookingId: bookingId as string,
          serviceName: checkoutData.title || "Fallback Hostel Name",
        },
      });
      return;
    }

    const paymentData = await createPaymentLink();
    if (paymentData && paymentData.paymentLinkUrl) {
      const supported = await Linking.canOpenURL(paymentData.paymentLinkUrl);
      if (supported) {
        await Linking.openURL(paymentData.paymentLinkUrl);
      } else {
        Alert.alert("Error", "Cannot open payment link");
      }
    }
  };

  const handlePayWallet = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      setModalVisible(false);
      return;
    }

    if (walletBalance < paymentAmount) {
      Alert.alert(
        "Insufficient Balance",
        `Your wallet balance is ₹${walletBalance}. Please add more funds to proceed.`
      );
      setModalVisible(false);
      return;
    }

    setModalVisible(false);
    // TODO: Navigate to wallet payment confirmation or handle wallet deduction
    console.log("Proceeding with wallet payment for bookingId:", bookingId, "Amount:", paymentAmount);
    // For now, you can navigate to a wallet confirmation screen or directly process
    // router.push({ pathname: "/wallet-payment", params: { ... } });
  };

  const openPaymentModal = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      return;
    }
    setSelectedMethod(null); // Reset selection when opening modal
    setModalVisible(true);
  };

  const handleContinue = () => {
    if (selectedMethod === 'online') {
      handlePayOnline();
    } else if (selectedMethod === 'wallet') {
      handlePayWallet();
    }
  };

  if (loadingWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Checkout"
          onBack={() => router.back()}
          showBackButton={true}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Checkout"
        onBack={() => router.back()}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemOrderedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Item ordered</Text>
            <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceText}>↓ Invoice</Text>
            </TouchableOpacity>
          </View>

          <CheckoutItemCard
            serviceType={isTiffin ? "tiffin" : "hostel"}
            data={checkoutData}
          />
        </View>

        <View style={styles.transactionSection}>
          <Text style={styles.paymentSectionTitle}>Transaction Details</Text>

          <View style={styles.transactionDetails}>
            {isTiffin ? (
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
            onPress={openPaymentModal}
          >
            <Text style={styles.payButtonText}>
              Pay ₹{paymentAmount}
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Payment Method</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              {/* Online Payment Option */}
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  selectedMethod === 'online' && styles.selectedOption
                ]} 
                onPress={() => setSelectedMethod('online')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="card-outline" size={24} color="#2854C5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Pay Online through Razorpay</Text>
                  <Text style={styles.optionSubtitle}>Secure payment gateway</Text>
                </View>
                {selectedMethod === 'online' ? (
                  <Ionicons name="checkmark" size={20} color="#2854C5" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>

              {/* Wallet Payment Option */}
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  selectedMethod === 'wallet' && styles.selectedOption
                ]} 
                onPress={() => setSelectedMethod('wallet')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="wallet-outline" size={24} color="#2854C5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Pay through Wallet</Text>
                  <View style={styles.walletBalanceContainer}>
                    <Text style={styles.walletBalanceLabel}>Wallet Balance:</Text>
                    <Text style={styles.walletBalance}>₹{walletBalance}</Text>
                  </View>
                </View>
                {selectedMethod === 'wallet' ? (
                  <Ionicons name="checkmark" size={20} color="#2854C5" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>

              {/* Continue Button */}
              <View style={styles.continueButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    !selectedMethod && styles.continueButtonDisabled
                  ]}
                  disabled={!selectedMethod}
                  onPress={handleContinue}
                >
                  <Text style={[
                    styles.continueButtonText,
                    !selectedMethod && styles.continueButtonTextDisabled
                  ]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalOptions: {
    paddingHorizontal: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EFFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  walletBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  walletBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2854C5',
  },
  continueButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: '#2854C5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
});

export default Checkout;