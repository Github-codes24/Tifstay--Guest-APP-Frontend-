import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Header from "@/components/Header";
import colors from "@/constants/colors";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TrackOrderModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  serviceType: "tiffin" | "hostel";
}

interface TrackingData {
  currentMeal: string;
  currentMealStatus: string;
  // Add other fields if needed
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  visible,
  onClose,
  orderId,
  serviceType,
}) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && orderId && serviceType === "tiffin") {
      fetchTracking();
    }
  }, [visible, orderId]);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/trackOrder/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setTrackingData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      // Optionally show alert
    } finally {
      setLoading(false);
    }
  };

  const statusToStep: { [key: string]: number } = {
    "Out For Delivery": 0,
    "On the way": 1,
    "Delivered": 2,
  };

  const currentStep = trackingData
    ? statusToStep[trackingData.currentMealStatus] || 0
    : 0;

  const steps = [
    { status: "Out for Delivery", time: "11:30am" },
    { status: "On the way", time: "01:40pm" },
    { status: `${trackingData?.currentMeal || "Meal"} Delivered`, time: "02:30pm" },
  ];

  if (loading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <Header
            title="Track Order"
            backIconName="chevron-back"
            onBack={onClose}
            style={styles.headerStyle}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary || "#ff7f00"} />
            <Text style={styles.loadingText}>Loading tracking info...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Header
          title="Track Order"
          backIconName="chevron-back"
          onBack={onClose}
          style={styles.headerStyle}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.orderIdText}>
                Order ID: <Text style={styles.orderId}>#{orderId}</Text>
              </Text>
              <Text style={styles.today}>Today</Text>
            </View>

            {/* Timeline */}
            <View style={styles.timeline}>
  {steps.map((step, index) => (
    <View key={index} style={styles.stepRow}>
      {/* remove timing column */}
      <View style={styles.lineContainer}>
        <View
          style={[
            styles.circle,
            index <= currentStep ? styles.circleActive : styles.circleInactive,
          ]}
        />
        {index < steps.length - 1 && (
          <View
            style={[
              styles.verticalLine,
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

          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerStyle: {
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#444",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "400",
    color: "#0A051F",
  },
  today: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A051F",
  },
  timeline: {
    marginTop: 10,
    marginBottom: 12,
    alignSelf: "center",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timeText: {
    marginRight: 25,
    fontSize: 11.5,
    fontWeight: "400",
    color: "#000",
    flexShrink: 0,
    textAlign: "right",
    minWidth: 60,
  },
  timeTextInactive: {
    marginRight: 25,
    fontSize: 11.5,
    color: "#ccc",
    flexShrink: 0,
    textAlign: "right",
    minWidth: 60,
  },
  lineContainer: {
    alignItems: "center",
    marginRight: 12,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff7f00",
    zIndex: 2,
  },
  circleActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff7f00",
    zIndex: 2,
  },
  circleInactive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#f0cbb6",
  },
  verticalLine: {
    width: 2,
    height: 60,
    backgroundColor: "#ff7f00",
    marginTop: 2,
  },
  verticalDashedLine: {
    width: 2,
    height: 60,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#f0cbb6",
    marginTop: 2,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#222",
  },
  statusTextActive: {
    marginLeft: 10,
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
  },
  statusTextInactive: {
    marginLeft: 10,
    fontSize: 14,
    color: "#ccc",
  },
  verticalLineInactive: {
  width: 2,
  height: 60,
  backgroundColor: "#f0cbb6",
  marginTop: 2,
},

});

export default TrackOrderModal;