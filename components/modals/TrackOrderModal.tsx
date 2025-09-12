import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import Header from "@/components/Header";
import colors from "@/constants/colors";

interface TrackOrderModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  serviceType: "tiffin" | "hostel";
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  visible,
  onClose,
  orderId,
  serviceType,
}) => {
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
              {/* Step 1 - Accepted */}
              <View style={styles.stepRow}>
                <Text style={styles.timeText}>11:30pm</Text>
                <View style={styles.lineContainer}>
                  <View style={styles.circle} />
                  <View style={styles.verticalLine} />
                </View>
                <Text style={styles.statusText}>Accepted</Text>
              </View>

              {/* Step 2 - Processing */}
              <View style={styles.stepRow}>
                <Text style={styles.timeText}>01:40pm</Text>
                <View style={styles.lineContainer}>
                  <View style={styles.circle} />
                  <View style={styles.verticalLine} />
                </View>
                <Text style={styles.statusText}>Processing</Text>
              </View>

              {/* Step 3 - On the way */}
              <View style={styles.stepRow}>
                <Text style={styles.timeText}>02:30pm</Text>
                <View style={styles.lineContainer}>
                  <View style={styles.circleActive} />
                  <View style={styles.verticalDashedLine} />
                </View>
                <View style={styles.onTheWayContainer}>
                  <Text style={styles.statusTextActive}>On the way</Text>
                </View>
              </View>

              {/* Step 4 - Delivered */}
              <View style={styles.stepRow}>
                <Text style={styles.timeTextInactive}>012:45pm</Text>
                <View style={styles.lineContainer}>
                  <View style={styles.circleInactive} />
                </View>
                <Text style={styles.statusTextInactive}>Delivered</Text>
              </View>
            </View>
          </View>

          {/* Delivery Info Card */}
          <View style={styles.card}>
            <View style={styles.deliveryRow}>
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/men/32.jpg",
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.driverName}>Biswajit Chatterjee</Text>
                <Text style={styles.subtext}>10 minutes on the way</Text>
              </View>
            </View>

            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryLabel}>Estimated Delivery Time:</Text>
              <Text style={styles.deliveryTime}>12:45</Text>
            </View>

            <View style={styles.orderDetailsRow}>
              <Text style={styles.orderLabel}>My Order:</Text>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Details</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.trackButton}>
              <Text style={styles.trackButtonText}>📞 Call to Track</Text>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
    marginRight: 12,
    fontSize: 12,
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
    borderRadius: 7,
    backgroundColor: "#ff7f00",
    zIndex: 2,
  },
  circleInactive: {
    marginLeft: 15,
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
    height: 50,
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
  onTheWayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverName: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtext: {
    fontSize: 12,
    color: "#666",
  },
  deliveryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 13,
    color: "#555",
  },
  deliveryTime: {
    fontSize: 15,
    fontWeight: "bold",
  },
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 13,
    color: "#555",
  },
  detailsButton: {
    backgroundColor: "#fff",
    borderColor: "#ff7f00",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  detailsButtonText: {
    color: "#ff7f00",
    fontSize: 12,
    fontWeight: "500",
  },
  trackButton: {
    backgroundColor: "#0047AB",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  trackButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default TrackOrderModal;
