import React, { useEffect, useState, useMemo } from "react";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../Header";
import colors from "@/constants/colors";
import Buttons from "../Buttons";

const { width: screenWidth } = Dimensions.get("window");

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
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [userData, setUserData] = useState<{
    name?: string;
    phoneNumber?: string;
    email?: string;
    workType?: string;
    adharCardPhoto?: string | null;
    userPhoto?: string | null;
  } | null>(null);

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRoomByHostelid/${hostelData.id}`
      );
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
        if (data.data.length > 0) setSelectedRoomId(data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setUserLoading(true);
      const profileString = await AsyncStorage.getItem("userProfile");
      if (profileString) {
        const parsed = JSON.parse(profileString);
        if (parsed.guest) {
          setUserData({
            name: parsed.guest.name,
            phoneNumber: parsed.guest.phoneNumber,
            email: parsed.guest.email || "example@example.com",
            workType: parsed.guest.workType || "Student",
            adharCardPhoto: parsed.guest.adharCardPhoto || null,
            userPhoto: parsed.guest.userPhoto || null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (visible && hostelData?.id) {
      fetchRooms();
      fetchUserProfile();
    }
  }, [visible, hostelData]);

  const currentRoom = rooms.find((room) => room._id === selectedRoomId);

  const plan = useMemo(() => {
    if (!currentRoom) return null;
    let p = currentRoom.selectPlan?.find((p: any) => p.name === "monthly");
    if (!p) {
      p = {
        name: "monthly",
        price: Number(hostelData.price?.replace(/\D/g, "")) || 0,
        depositAmount: Number(hostelData.deposit) || 0,
      };
    } else {
      p.price = Number(p.price);
      p.depositAmount = Number(p.depositAmount);
    }
    return p;
  }, [currentRoom, hostelData]);

  const toggleBedSelection = (bedId: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bedId) ? prev.filter((id) => id !== bedId) : [...prev, bedId]
    );
  };

  const handleReserve = async () => {
  console.log("handleReserve called (Reserve button - no API call)");

  if (loading || userLoading || !userData) {
    Alert.alert("Loading", "Please wait for data to load.");
    return;
  }

  if (!selectedRoomId || selectedBeds.length === 0) {
    Alert.alert("Error", "Please select at least one bed.");
    return;
  }

  const currentRoomData = rooms.find((r) => r._id === selectedRoomId);
  if (!currentRoomData) {
    Alert.alert("Error", "Selected room is invalid.");
    return;
  }

  // Plan info
  let planData = currentRoomData.selectPlan?.find((p: any) => p.name === "monthly");
  if (!planData) {
    planData = {
      name: "monthly",
      price: Number(hostelData.price?.replace(/\D/g, "")) || 0,
      depositAmount: Number(hostelData.deposit) || 0,
    };
  } else {
    planData.price = Number(planData.price);
    planData.depositAmount = Number(planData.depositAmount);
  }

  // Check-in/out dates
  const today = new Date();
  const checkInDateObj = new Date(today);
  checkInDateObj.setDate(today.getDate() + 1);
  checkInDateObj.setHours(0, 0, 0, 0);
  const checkInDate = checkInDateObj.toISOString();

  const checkOutDateObj = new Date(checkInDateObj);
  checkOutDateObj.setDate(checkInDateObj.getDate() + 7);
  checkOutDateObj.setHours(0, 0, 0, 0);
  const checkOutDate = checkOutDateObj.toISOString();

  // Selected beds details
  const selectedBedDetails = currentRoomData.totalBeds
    .filter((bed: any) => selectedBeds.includes(bed._id))
    .map((bed: any) => ({
      bedId: bed._id,
      bedNumber: bed.bedNumber,
    }));

  // Log params being passed to next screen
  const params = {
    hostelData: JSON.stringify(hostelData),
    roomData: JSON.stringify(currentRoomData),
    selectedBeds: JSON.stringify(selectedBedDetails),
    plan: JSON.stringify(planData),
    checkInDate,
    checkOutDate,
    userData: JSON.stringify(userData),
    bookingType: "reserve", // flag to indicate it's a reserve
  };
  console.log("Params being passed to next screen:", params);

  // Pass data to next screen
  router.push({
    pathname: "/bookingScreen",
    params,
  });
};


  const renderBedRow = ({ item }: { item: any }) => {
    const isAvailable =
      item.status.toLowerCase() === "unoccupied" &&
      item.Availability.toLowerCase() === "available";
    const isSelected = selectedBeds.includes(item._id);

    return (
      <View style={styles.bedRow}>
        <View style={styles.bedInfo}>
          <Ionicons
            name="bed-outline"
            size={20}
            color={isAvailable ? "#1F2937" : "#9CA3AF"}
          />
          <Text style={[styles.bedNumber, !isAvailable && styles.occupiedText]}>
            Bed {item.bedNumber}
          </Text>
        </View>
        <Text style={[styles.status, !isAvailable && styles.occupiedText]}>
          {item.status}
        </Text>
        <Text style={[styles.availability, !isAvailable && styles.occupiedText]}>
          {item.Availability}
        </Text>
        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => isAvailable && toggleBedSelection(item._id)}
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

  const isButtonDisabled = selectedBeds.length === 0 || loading || userLoading || !userData;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <Header title="Rooms" onBack={onClose} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 50, alignSelf: "center" }}
            />
          ) : rooms.length === 0 ? (
            <Text style={styles.errorText}>No rooms available.</Text>
          ) : (
            <>
              <View style={styles.roomNavigation}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {rooms.map((room) => (
                    <TouchableOpacity
                      key={room._id}
                      style={[
                        styles.roomTab,
                        selectedRoomId === room._id && styles.roomTabActive,
                      ]}
                      onPress={() => {
                        setSelectedRoomId(room._id);
                        setSelectedBeds([]);
                      }}
                    >
                      <Text
                        style={[
                          styles.roomTabText,
                          selectedRoomId === room._id && styles.roomTabTextActive,
                        ]}
                      >
                        Room {room.roomNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {currentRoom && (
                <>
                  <View style={styles.imageContainer}>
                    {currentRoom.photos?.[0] && (
                      <Image
                        source={{ uri: currentRoom.photos[0] }}
                        style={styles.roomImage}
                      />
                    )}
                    <View style={styles.roomBadge}>
                      <Text style={styles.roomBadgeText}>
                        Room {currentRoom.roomNumber}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.roomDetails}>
                    <Text style={styles.roomTitle}>
                      Room {currentRoom.roomNumber}
                    </Text>
                    {currentRoom.description && (
                      <Text style={styles.description}>
                        {currentRoom.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerText, styles.bedNoHeader]}>
                        Bed No
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
                    <View style={styles.totalBedsRow}>
                      <Text style={styles.totalBedsText}>
                        Total: {currentRoom.totalBeds.length} Beds
                      </Text>
                    </View>
                    <FlatList
                      data={currentRoom.totalBeds || []}
                      renderItem={renderBedRow}
                      keyExtractor={(item) => item._id}
                      scrollEnabled={false}
                    />
                  </View>
                  {selectedBeds.length > 0 && plan && (
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionText}>
                        You've selected {selectedBeds.length} bed(s)
                      </Text>
                      <Text style={styles.priceInfo}>
                        ₹{plan.price} per month per bed
                        {selectedBeds.length > 1 && ` (Total: ₹${plan.price * selectedBeds.length})`}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
        <View style={styles.bottomContainer}>
          <View style={styles.buttonWrapper}>
            <Buttons
              title="Reserve"
              onPress={handleReserve}
              disabled={isButtonDisabled}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1, marginHorizontal: 16, marginVertical: 16, borderWidth: 1, borderColor: "#A5A5A5", borderRadius: 10 },
  errorText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 12 },
  imageContainer: { margin: 16, borderRadius: 12, overflow: "hidden", position: "relative" },
  roomImage: { width: "100%", height: 200, resizeMode: "cover" },
  roomBadge: { position: "absolute", bottom: 16, left: 16, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roomBadgeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  roomDetails: { paddingHorizontal: 16, marginBottom: 24 },
  roomTitle: { fontSize: 20, fontWeight: "700", color: "#000", marginBottom: 8 },
  description: { fontSize: 14, color: "#666", lineHeight: 20 },
  tableContainer: { marginHorizontal: 16, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F3F4F6", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  bedNoHeader: { flex: 2 },
  statusHeader: { flex: 2 },
  availabilityHeader: { flex: 2.5 },
  selectHeader: { flex: 1, textAlign: "center" },
  totalBedsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalBedsText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  bedRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  bedInfo: { flex: 2, flexDirection: "row", alignItems: "center", gap: 8 },
  bedNumber: { fontSize: 14, color: "#1F2937" },
  status: { flex: 2, fontSize: 14, color: "#1F2937" },
  availability: { flex: 2.5, fontSize: 14, color: "#1F2937" },
  selectContainer: { flex: 1, alignItems: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: colors.primary },
  checkboxDisabled: { borderColor: "#D1D5DB", backgroundColor: "#F9FAFB" },
  occupiedText: { color: "#9CA3AF" },
  roomNavigation: { marginTop: 24, paddingHorizontal: 16 },
  roomTab: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 12, borderRadius: 20, backgroundColor: "#F3F4F6" },
  roomTabActive: { backgroundColor: colors.primary },
  roomTabText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  roomTabTextActive: { color: "#fff" },
  selectionInfo: { marginHorizontal: 16, marginTop: 20, padding: 16, backgroundColor: "#F0F4FF", borderRadius: 12, borderWidth: 1, borderColor: "#E0E7FF" },
  selectionText: { fontSize: 16, fontWeight: "600", color: colors.primary, marginBottom: 4 },
  priceInfo: { fontSize: 14, color: "#4B5563" },
  bottomContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  buttonWrapper: { alignItems: "center" },
  reserveButton: { backgroundColor: colors.primary },
  disabledButton: { backgroundColor: "#D1D5DB" },
});

export default RoomSelectionModal;