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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../Header";
import colors from "@/constants/colors";
import Buttons from "../Buttons";

const { width: screenWidth } = Dimensions.get("window");

type SelectedRoom = {
  roomNumber: string;
  bedNumber: number;
  roomId?: string;
  bedId?: string;
};

type RoomData = Array<{
  _id: string;
  roomId: string;
  roomNumber: string | number;
  totalBeds: Array<{
    _id: string;
    bedId: string;
    bedNumber: string | number;
    status: string;
    Availability: string;
  }>;
  selectPlan?: Array<any>;
  photos?: string[];
  description?: string;
}>;

interface RoomSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  hostelData: {
    id: string;
    name: string;
    price: string;
    deposit: string;
  };
  roomsData?: RoomData; // Optional: Pre-fetched rooms data
  isContinueMode?: boolean;
  selectedRooms?: SelectedRoom[]; // Pre-selected rooms for continue mode
  onContinueSelection?: (selectedData: {
    roomsData: Array<{
      roomId: string;
      roomNumber: string | number;
      beds: Array<{ bedId: string; bedNumber: string | number }>;
    }>;
    plan: any;
    checkInDate: string;
    checkOutDate: string;
    userData: any;
  }) => void;
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  visible,
  onClose,
  hostelData,
  roomsData: propRoomsData, // Use prop if provided
  isContinueMode = false,
  selectedRooms = [], // Default empty
  onContinueSelection,
}) => {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBedsByRoom, setSelectedBedsByRoom] = useState<Record<string, string[]>>({});
  const [userData, setUserData] = useState<{
    name?: string;
    phoneNumber?: string;
    email?: string;
    workType?: string;
    adharCardPhoto?: string | null;
    userPhoto?: string | null;
  } | null>(null);

  // Fetch rooms (use prop if available, else API)
  const fetchRooms = async () => {
    try {
      setLoading(true);
      let data: RoomData = [];
      if (propRoomsData && propRoomsData.length > 0) {
        // Use passed rooms data
        data = propRoomsData;
      } else {
        // Fallback to API
        const response = await fetch(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRoomByHostelid/${hostelData.id}`
        );
        const apiData = await response.json();
        if (apiData.success) {
          data = apiData.data;
        }
      }
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0]._id);
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

  // Initialize pre-selections for continue mode
  useEffect(() => {
    if (visible && isContinueMode && selectedRooms.length > 0 && rooms.length > 0) {
      const newSelectedBedsByRoom: Record<string, string[]> = {};
      selectedRooms.forEach((selRoom) => {
        const room = rooms.find(r => r._id === selRoom.roomId || r.roomNumber.toString() === selRoom.roomNumber);
        if (room) {
          const roomId = room._id;
          const bed = room.totalBeds.find(b => 
            (b._id === selRoom.bedId) || 
            (b.bedNumber.toString() === selRoom.bedNumber.toString())
          );
          if (bed && !newSelectedBedsByRoom[roomId]) {
            newSelectedBedsByRoom[roomId] = [bed._id];
          } else if (bed) {
            newSelectedBedsByRoom[roomId] = [...(newSelectedBedsByRoom[roomId] || []), bed._id];
          }
        }
      });
      setSelectedBedsByRoom(newSelectedBedsByRoom);
      console.log("Pre-selected beds initialized:", newSelectedBedsByRoom); // Debug
    }
  }, [visible, isContinueMode, selectedRooms, rooms]);

  useEffect(() => {
    if (visible && hostelData?.id) {
      fetchRooms();
      fetchUserProfile();
    }
  }, [visible, hostelData, propRoomsData]); // Depend on propRoomsData

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
    setSelectedBedsByRoom((prev) => {
      const currentRoomBeds = prev[selectedRoomId || ''] || [];
      const newRoomBeds = currentRoomBeds.includes(bedId) 
        ? currentRoomBeds.filter((id) => id !== bedId) 
        : [...currentRoomBeds, bedId];
      return { ...prev, [selectedRoomId || '']: newRoomBeds };
    });
  };

  // Collect selected data (shared logic)
  const collectSelectedData = () => {
    // Compute total selected beds across all rooms
    const totalSelectedBeds = Object.values(selectedBedsByRoom).reduce((acc, beds) => acc + beds.length, 0);
    if (totalSelectedBeds === 0) return null;

    // Collect rooms data with selected beds
    const roomsData: Array<{
      roomId: string;
      roomNumber: string | number;
      beds: Array<{ bedId: string; bedNumber: string | number }>;
    }> = [];

    Object.entries(selectedBedsByRoom).forEach(([roomId, bedIds]) => {
      if (bedIds.length > 0) {
        const roomData = rooms.find((r) => r._id === roomId);
        if (roomData) {
          const selectedBedDetails = roomData.totalBeds
            .filter((bed: any) => bedIds.includes(bed._id))
            .map((bed: any) => ({
              bedId: bed._id,
              bedNumber: bed.bedNumber,
            }));
          roomsData.push({
            roomId: roomId,
            roomNumber: roomData.roomNumber,
            beds: selectedBedDetails,
          });
        }
      }
    });

    if (roomsData.length === 0) return null;

    // Plan info (assuming same for all rooms in hostel)
    let planData = rooms[0].selectPlan?.find((p: any) => p.name === "monthly");
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

    // Default check-in/out dates (fallback for non-continue mode)
    const today = new Date();
    const checkInDateObj = new Date(today);
    checkInDateObj.setDate(today.getDate() + 1);
    checkInDateObj.setHours(0, 0, 0, 0);
    const checkInDateStr = checkInDateObj.toISOString();

    const checkOutDateObj = new Date(checkInDateObj);
    checkOutDateObj.setDate(checkInDateObj.getDate() + 7);
    checkOutDateObj.setHours(0, 0, 0, 0);
    const checkOutDateStr = checkOutDateObj.toISOString();

    return {
      roomsData,
      plan: planData,
      checkInDate: checkInDateStr,
      checkOutDate: checkOutDateStr,
      userData,
    };
  };

  const handleBook = () => {
    if (loading || userLoading || !userData) {
      Alert.alert("Loading", "Please wait for data to load.");
      return;
    }

    const selectedData = collectSelectedData();
    if (!selectedData) {
      Alert.alert("Error", "Please select at least one bed.");
      return;
    }

    onContinueSelection?.(selectedData);
    onClose();
  };

  const handleReserve = async () => {
    console.log("handleReserve called (Reserve button - no API call)");

    if (loading || userLoading || !userData) {
      Alert.alert("Loading", "Please wait for data to load.");
      return;
    }

    const selectedData = collectSelectedData();
    if (!selectedData) {
      Alert.alert("Error", "Please select at least one bed.");
      return;
    }

    // Log params being passed to next screen
    const params = {
      hostelData: JSON.stringify(hostelData),
      ...selectedData,
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
    const isAvailable = isContinueMode
      ? true
      : item.status.toLowerCase() === "unoccupied" && item.Availability.toLowerCase() === "available";
    const currentRoomBeds = selectedBedsByRoom[selectedRoomId || ''] || [];
    const isSelected = currentRoomBeds.includes(item._id);

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

  // Compute total selected
  const totalSelectedBeds = useMemo(() => 
    Object.values(selectedBedsByRoom).reduce((acc, beds) => acc + beds.length, 0), 
    [selectedBedsByRoom]
  );
  const numRoomsWithSelections = useMemo(() => 
    Object.values(selectedBedsByRoom).filter(beds => beds.length > 0).length, 
    [selectedBedsByRoom]
  );

  const isButtonDisabled = totalSelectedBeds === 0 || loading || userLoading || !userData;

  const buttonTitle = isContinueMode ? "Book" : "Reserve";
  const onButtonPress = isContinueMode ? handleBook : handleReserve;

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
                  {rooms.map((room) => {
                    const roomBeds = selectedBedsByRoom[room._id] || [];
                    const hasSelections = roomBeds.length > 0;
                    return (
                      <TouchableOpacity
                        key={room._id}
                        style={[
                          styles.roomTab,
                          selectedRoomId === room._id && styles.roomTabActive,
                        ]}
                        onPress={() => {
                          setSelectedRoomId(room._id);
                        }}
                      >
                        <Text
                          style={[
                            styles.roomTabText,
                            selectedRoomId === room._id && styles.roomTabTextActive,
                          ]}
                        >
                          Room {room.roomNumber}
                          {hasSelections && ` (${roomBeds.length})`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
                  {totalSelectedBeds > 0 && plan && (
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionText}>
                        You've selected {totalSelectedBeds} bed(s) across {numRoomsWithSelections} room(s)
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
              title={buttonTitle}
              onPress={onButtonPress}
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