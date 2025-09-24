import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Header from "../Header";
import colors from "@/constants/colors";
import Buttons from "../Buttons";

const { width: screenWidth } = Dimensions.get("window");

interface Bed {
  id: string;
  bedNumber: number;
  status: "available" | "occupied";
  availability: string;
}

interface Room {
  id: string;
  roomNumber: string;
  totalBeds: number;
  description: string;
  image: any;
  beds: Bed[];
}

interface RoomSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  hostelData: {
    id: string;
    name: string;
    price: string;
    deposit: string;
  };
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  visible,
  onClose,
  hostelData,
}) => {
  const router = useRouter();
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("101");

  // Demo room data
  const rooms: Room[] = [
    {
      id: "1",
      roomNumber: "101",
      totalBeds: 3,
      description: "Spacious room with natural lighting and study area",
      image: require("@/assets/images/image/roomBanner.png"),
      beds: [
        {
          id: "1",
          bedNumber: 1,
          status: "occupied",
          availability: "1st-30th Sep",
        },
        {
          id: "2",
          bedNumber: 2,
          status: "occupied",
          availability: "1st-30th Sep",
        },
        {
          id: "3",
          bedNumber: 3,
          status: "available",
          availability: "1st-7th Sep",
        },
      ],
    },
   
  
  ];

  const currentRoom =
    rooms.find((room) => room.roomNumber === selectedRoom) || rooms[0];

  const toggleBedSelection = (bedId: string) => {
    setSelectedBeds((prev) => {
      if (prev.includes(bedId)) {
        return prev.filter((id) => id !== bedId);
      } else {
        return [...prev, bedId];
      }
    });
  };

  const handleReserve = () => {
    if (selectedBeds.length === 0) {
      // Show alert or toast
      return;
    }

    // Close modal first
    onClose();

    // Navigate to booking screen with selected room and bed info
    router.push({
      pathname: "/bookingScreen",
      params: {
        bookingType: "hostel",
        hostelId: hostelData.id,
        hostelName: hostelData.name,
        monthlyPrice: hostelData.price,
        deposit: hostelData.deposit,
        roomNumber: currentRoom.roomNumber,
        selectedBeds: selectedBeds.join(","),
      },
    });
  };

  const renderBedRow = ({ item }: { item: Bed }) => {
    const isAvailable = item.status === "available";
    const isSelected = selectedBeds.includes(item.id);

    return (
      <View style={styles.bedRow}>
        <View style={styles.bedInfo}>
          <Ionicons
            name="bed-outline"
            size={20}
            color={isAvailable ? "#000" : "#999"}
          />
          <Text style={[styles.bedNumber, !isAvailable && styles.occupiedText]}>
            Bed {item.bedNumber}
          </Text>
        </View>
        <Text style={[styles.status, !isAvailable && styles.occupiedText]}>
          {item.status === "available" ? "Available" : "Occupied"}
        </Text>
        <Text
          style={[styles.availability, !isAvailable && styles.occupiedText]}
        >
          {item.availability}
        </Text>
        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => isAvailable && toggleBedSelection(item.id)}
          disabled={!isAvailable}
        >
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              !isAvailable && styles.checkboxDisabled,
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Header title="Rooms" onBack={onClose} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Room Image */}
          <View style={styles.imageContainer}>
            <Image source={currentRoom.image} style={styles.roomImage} />
            {/* Room Number Badge */}
            <View style={styles.roomBadge}>
              <Text style={styles.roomBadgeText}>
                Room {currentRoom.roomNumber}
              </Text>
            </View>
          </View>

          {/* Room Details */}
          <View style={styles.roomDetails}>
            <Text style={styles.roomTitle}>
              Room No.: {currentRoom.roomNumber}
            </Text>
            <Text style={styles.totalBeds}>
              Total Beds: {currentRoom.totalBeds}
            </Text>
            <Text style={styles.description}>{currentRoom.description}</Text>
          </View>

          {/* Bed Selection Table */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.bedNoHeader]}>
                Bed No.
              </Text>
              <Text style={[styles.headerText, styles.statusHeader]}>
                Status
              </Text>
              <Text style={[styles.headerText, styles.availabilityHeader]}>
                Availability
              </Text>
              <Text style={[styles.headerText, styles.selectHeader]}>
                Select
              </Text>
            </View>

            {/* Table Body */}
            <FlatList
              data={currentRoom.beds}
              renderItem={renderBedRow}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Room Navigation (if multiple rooms) */}
          {rooms.length > 1 && (
            <View style={styles.roomNavigation}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomTab,
                      selectedRoom === room.roomNumber && styles.roomTabActive,
                    ]}
                    onPress={() => {
                      setSelectedRoom(room.roomNumber);
                      setSelectedBeds([]);
                    }}
                  >
                    <Text
                      style={[
                        styles.roomTabText,
                        selectedRoom === room.roomNumber &&
                          styles.roomTabTextActive,
                      ]}
                    >
                      Room {room.roomNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Beds Info */}
          {selectedBeds.length > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                Selected: {selectedBeds.length} bed(s)
              </Text>
              <Text style={styles.priceInfo}>
                Monthly Rent: {hostelData.price} per bed
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Reserve Button */}
        <View style={styles.bottomContainer}>
          <Buttons
            title="Reserve"
            onPress={handleReserve}
            width={screenWidth - 32}
            height={56}
            style={
              selectedBeds.length === 0
                ? styles.disabledButton
                : styles.reserveButton
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    borderWidth:1,
    borderColor:'#A5A5A5',
    borderRadius:10,
    marginHorizontal:16,
    marginVertical:16,
    marginBottom:30,
    // padding:10,
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  roomImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  roomBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roomBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  roomDetails: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  totalBeds: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  tableContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  bedNoHeader: {
    flex: 2,
  },
  statusHeader: {
    flex: 2,
  },
  availabilityHeader: {
    flex: 2.5,
  },
  selectHeader: {
    flex: 1,
    textAlign: "center",
  },
  bedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bedInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bedNumber: {
    fontSize: 14,
    color: "#1F2937",
  },
  status: {
    flex: 2,
    fontSize: 14,
    color: "#1F2937",
  },
  availability: {
    flex: 2.5,
    fontSize: 14,
    color: "#1F2937",
  },
  selectContainer: {
    flex: 1,
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  occupiedText: {
    color: "#9CA3AF",
  },
  roomNavigation: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  roomTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  roomTabActive: {
    backgroundColor: colors.primary,
  },
  roomTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  roomTabTextActive: {
    color: "#fff",
  },
  selectionInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  priceInfo: {
    fontSize: 14,
    color: "#4B5563",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  reserveButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
});

export default RoomSelectionModal;
