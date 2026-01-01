import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Header from "@/components/Header";
import colors from "@/constants/colors";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/constants/api";

interface TrackOrderModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  serviceType: "tiffin" | "hostel";
  bookingId: string;
}

interface TrackingData {
  currentMeal: string | null;
  currentMealStatus: string | null;
  summaryEntry?: {
    orderId?: string;
    breakfastStatus?: string;
    lunchStatus?: string;
    dinnerStatus?: string;
  };
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  visible,
  onClose,
  orderId,
  serviceType,
}) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch tracking data
  const fetchTracking = async (showLoading: boolean = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/guest/tiffinServices/trackOrder/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setTrackingData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch + silent auto-refresh every 5 seconds
  useEffect(() => {
    if (visible && orderId && serviceType === "tiffin") {
      fetchTracking(true); // show loading only on first fetch

      const interval = setInterval(() => {
        fetchTracking(false); // silent refresh
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [visible, orderId]);

  const statusToStep: { [key: string]: number } = {
    "Out For Delivery": 0,
    "On the way": 1,
    "Delivered": 2,
  };

  const trimmedStatus = trackingData?.currentMealStatus?.trim();
  const currentStep = trimmedStatus ? statusToStep[trimmedStatus] ?? 0 : 0;

  const steps = [
    { status: "Out For Delivery" },
    { status: "On the way" },
    { status: `${trackingData?.currentMeal || "Meal"} Delivered` },
  ];

  const showWaitingProviderUpdate =
    trackingData?.currentMeal &&
    (!trackingData.currentMealStatus ||
      trackingData.currentMealStatus === "Not Selected");

  if (loading && !trackingData) {
    // show spinner only on initial load
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          <Header
            title="Track Order"
            backIconName="chevron-back"
            onBack={onClose}
            style={styles.headerStyle}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary || "#ff7f00"}
            />
            <Text style={styles.loadingText}>Loading tracking info...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Header
          title="Track Order"
          backIconName="chevron-back"
          onBack={onClose}
          style={styles.headerStyle}
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.orderIdText}>
                Order ID:{" "}
                <Text style={styles.orderId}>
                  #{trackingData?.orderId || orderId}
                </Text>
              </Text>
              <Text style={styles.mealText}>
                {trackingData?.currentMeal || ""}
              </Text>
            </View>

            {/* Timeline or waiting card */}
            {showWaitingProviderUpdate ? (
              <View style={styles.noMealContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>⏰</Text>
                </View>
                <Text style={styles.noMealTitle}>Waiting for Provider Update</Text>
                <Text style={styles.noMealSubText}>
                  Your tiffin time is here, but the provider hasn’t updated the status yet. Hang tight!
                </Text>
              </View>
            ) : trackingData?.currentMeal ? (
              <View style={styles.timeline}>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.lineContainer}>
                      <View
                        style={[
                          styles.circle,
                          index <= currentStep
                            ? styles.circleActive
                            : styles.circleInactive,
                        ]}
                      />
                      {index < steps.length - 1 && (
                        <View
                          style={[
                            index < currentStep
                              ? styles.verticalLine
                              : index === currentStep
                                ? styles.verticalDashedLine
                                : styles.verticalLineInactive,
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.statusText,
                        index <= currentStep
                          ? styles.statusTextActive
                          : styles.statusTextInactive,
                      ]}
                    >
                      {step.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMealContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>⏰</Text>
                </View>
                <Text style={styles.noMealTitle}>Meal Time Not Active</Text>
                <Text style={styles.noMealSubText}>
                  Your delicious meal will be ready at the scheduled time. Hang tight and get ready to enjoy!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerStyle: { paddingTop: 16 },
  scrollView: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 10,
    borderColor: colors.border || "#E5E7EB",
    borderWidth: 1,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  orderIdText: { fontSize: 14, fontWeight: "400", color: "#444" },
  orderId: { fontSize: 14, fontWeight: "500", color: "#0A051F" },
  mealText: { fontSize: 14, fontWeight: "600", color: "#0A051F" },
  timeline: { marginTop: 10, marginBottom: 12, alignSelf: "center" },
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  lineContainer: { alignItems: "center", marginRight: 12 },
  circle: { width: 12, height: 12, borderRadius: 6 },
  circleActive: { backgroundColor: "#ff7f00" },
  circleInactive: { backgroundColor: "#f0cbb6" },
  verticalLine: { width: 2, height: 60, backgroundColor: "#ff7f00", marginTop: 2 },
  verticalDashedLine: { width: 2, height: 60, borderStyle: "dashed", borderWidth: 1, borderColor: "#f0cbb6", marginTop: 2 },
  verticalLineInactive: { width: 2, height: 60, backgroundColor: "#f0cbb6", marginTop: 2 },
  statusText: { marginLeft: 10, fontSize: 14 },
  statusTextActive: { color: "#222", fontWeight: "600" },
  statusTextInactive: { color: "#ccc" },

  noMealContainer: {
    marginTop: 30,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#004AAD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#432399",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: { fontSize: 28, color: "#fff" },
  noMealTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8, textAlign: "center" },
  noMealSubText: { fontSize: 14, color: "#d1d9eb", textAlign: "center", lineHeight: 20 },
});

export default TrackOrderModal;