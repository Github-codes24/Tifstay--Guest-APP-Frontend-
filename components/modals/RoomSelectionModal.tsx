import React, { useEffect, useState, useMemo, useRef } from "react";
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
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Header from "../Header";
import colors from "@/constants/colors";
import Buttons from "../Buttons";

const { width: screenWidth } = Dimensions.get("window");
const HORIZONTAL_MARGIN = 16;
const IMAGE_WIDTH = screenWidth - HORIZONTAL_MARGIN * 2;
const IMAGE_HEIGHT = 200;

type SelectedRoom = {
  roomNumber: string;
  bedNumber: number;
  roomId?: string;
  bedId?: string;
  name?: string;
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
  roomsData?: RoomData;
  isContinueMode?: boolean;
  selectedRooms?: SelectedRoom[];
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  onContinueSelection?: (selectedData: any) => void;
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  visible,
  onClose,
  hostelData,
  roomsData: propRoomsData,
  isContinueMode = false,
  selectedRooms = [],
  bookingId,
  checkInDate: propCheckInDate,
  checkOutDate: propCheckOutDate,
  onContinueSelection,
}) => {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBedsByRoom, setSelectedBedsByRoom] = useState<Record<string, string[]>>({});
  const [bedNames, setBedNames] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState<any>(null);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let data: RoomData = [];

      if (propRoomsData && propRoomsData.length > 0) {
        data = propRoomsData;
      } else {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const params = new URLSearchParams();
        if (propCheckInDate) params.append("checkInDate", propCheckInDate);
        if (propCheckOutDate) params.append("checkOutDate", propCheckOutDate);
        if (isContinueMode && bookingId) params.append("excludeBookingId", bookingId);

        const url = `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRoomByHostelid/${hostelData.id}${
          params.toString() ? "?" + params.toString() : ""
        }`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          data = response.data.data;
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

  // Pre-select beds in edit mode
  useEffect(() => {
    if (visible && isContinueMode && selectedRooms.length > 0 && rooms.length > 0) {
      const newSelectedBedsByRoom: Record<string, string[]> = {};
      const newBedNames: Record<string, string> = {};

      selectedRooms.forEach((selRoom) => {
        const room = rooms.find(
          (r) => r._id === selRoom.roomId || r.roomNumber.toString() === selRoom.roomNumber
        );
        if (room) {
          const bed = room.totalBeds.find(
            (b) =>
              b._id === selRoom.bedId ||
              b.bedNumber.toString() === selRoom.bedNumber.toString()
          );
          if (bed) {
            const roomId = room._id;
            if (!newSelectedBedsByRoom[roomId]) {
              newSelectedBedsByRoom[roomId] = [];
            }
            newSelectedBedsByRoom[roomId].push(bed._id);
            if (selRoom.name) {
             newBedNames[`${room._id}-${bed._id}`] = selRoom.name;
            }
          }
        }
      });

      setSelectedBedsByRoom(newSelectedBedsByRoom);
      setBedNames(newBedNames);
    }
  }, [visible, isContinueMode, selectedRooms, rooms]);

  useEffect(() => {
    if (visible && hostelData?.id) {
      fetchRooms();
      fetchUserProfile();
    }
  }, [visible, hostelData?.id, propCheckInDate, propCheckOutDate, bookingId]);

  useEffect(() => {
    setActiveImageIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [selectedRoomId]);

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
      const currentRoomBeds = prev[selectedRoomId || ""] || [];
      const newRoomBeds = currentRoomBeds.includes(bedId)
        ? currentRoomBeds.filter((id) => id !== bedId)
        : [...currentRoomBeds, bedId];
      return { ...prev, [selectedRoomId || ""]: newRoomBeds };
    });
  };

  // ====== CORRECTED renderBedRow ======
  const renderBedRow = ({ item }: { item: any }) => {
    const isActuallyAvailable =
      item.Availability?.toLowerCase() === "available" &&
      item.status?.toLowerCase() === "unoccupied";

    const isSelected = (selectedBedsByRoom[selectedRoomId || ""] || []).includes(item._id);

    // Allow selection if bed is available OR it's the user's own selected bed in edit mode
    const canInteract = isActuallyAvailable || (isContinueMode && isSelected);

    const bedName = isSelected ? bedNames[item._id] : undefined;

    return (
      <View style={styles.bedRow}>
        <View style={styles.bedInfo}>
          <Ionicons
            name="bed-outline"
            size={20}
            color={canInteract ? "#1F2937" : "#9CA3AF"}
          />
          <Text
            style={[styles.bedNumber, !canInteract && styles.occupiedText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`Bed ${item.bedNumber}${isSelected && bedName ? ` (${bedName})` : ""}`}
          </Text>
        </View>
        <Text style={[styles.status, !canInteract && styles.occupiedText]}>
          {item.status}
        </Text>
        <Text style={[styles.availability, !canInteract && styles.occupiedText]}>
          {item.Availability}
        </Text>
        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => canInteract && toggleBedSelection(item._id)}
          disabled={!canInteract}
        >
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              !canInteract && styles.checkboxDisabled,
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const collectSelectedData = () => {
    const totalSelectedBeds = Object.values(selectedBedsByRoom).reduce(
      (acc, beds) => acc + beds.length,
      0
    );
    if (totalSelectedBeds === 0) return null;

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
            roomId,
            roomNumber: roomData.roomNumber,
            beds: selectedBedDetails,
          });
        }
      }
    });

    if (roomsData.length === 0) return null;

    let planData = rooms[0]?.selectPlan?.find((p: any) => p.name === "monthly");
    if (!planData) {
      planData = {
        name: "monthly",
        price: Number(hostelData.price?.replace(/\D/g, "")) || 0,
        depositAmount: Number(hostelData.deposit) || 0,
      };
    }

    const today = new Date();
    let checkInDateObj = propCheckInDate ? new Date(propCheckInDate) : new Date(today);
    if (!propCheckInDate) checkInDateObj.setDate(today.getDate() + 1);
    checkInDateObj.setHours(0, 0, 0, 0);
    const checkInDateStr = checkInDateObj.toISOString();

    let checkOutDateObj = propCheckOutDate ? new Date(propCheckOutDate) : new Date(checkInDateObj);
    if (!propCheckOutDate) checkOutDateObj.setDate(checkInDateObj.getDate() + 7);
    checkOutDateObj.setHours(0, 0, 0, 0);
    const checkOutDateStr = checkOutDateObj.toISOString();

    return {
      roomsData,
      plan: planData,
      checkInDate: checkInDateStr,
      checkOutDate: checkOutDateStr,
      userData,
      bedNames,
    };
  };

  const handleBook = async () => {
    if (loading || userLoading || !userData) {
      Alert.alert("Loading", "Please wait for data to load.");
      return;
    }

    const selectedData = collectSelectedData();
    if (!selectedData) {
      Alert.alert("Error", "Please select at least one bed.");
      return;
    }

    if (isContinueMode && bookingId) {
      const params = {
        bookingId,
        hostelId: hostelData.id,
        hostelData: JSON.stringify(hostelData),
        roomsData: JSON.stringify(selectedData.roomsData),
        bedNames: JSON.stringify(selectedData.bedNames),
        plan: JSON.stringify(selectedData.plan),
        checkInDate: selectedData.checkInDate,
        checkOutDate: selectedData.checkOutDate,
        userData: JSON.stringify(selectedData.userData),
        bookingType: "edit",
        isEdit: "true",
      };

      onClose();
      setTimeout(() => {
        router.push({
          pathname: "/bookingScreen",
          params,
        });
      }, 300);
    } else {
      onContinueSelection?.(selectedData);
      onClose();
    }
  };

  const handleReserve = async () => {
    if (loading || userLoading || !userData) {
      Alert.alert("Loading", "Please wait for data to load.");
      return;
    }

    const selectedData = collectSelectedData();
    if (!selectedData) {
      Alert.alert("Error", "Please select at least one bed.");
      return;
    }

    const params = {
      hostelData: JSON.stringify(hostelData),
      roomsData: JSON.stringify(selectedData.roomsData),
      bedNames: JSON.stringify(selectedData.bedNames),
      plan: JSON.stringify(selectedData.plan),
      checkInDate: selectedData.checkInDate,
      checkOutDate: selectedData.checkOutDate,
      userData: JSON.stringify(selectedData.userData),
      bookingType: "reserve",
    };

    router.push({
      pathname: "/bookingScreen",
      params,
    });
    onClose();
  };

  const totalSelectedBeds = useMemo(
    () => Object.values(selectedBedsByRoom).reduce((acc, beds) => acc + beds.length, 0),
    [selectedBedsByRoom]
  );

  const numRoomsWithSelections = useMemo(
    () => Object.values(selectedBedsByRoom).filter((beds) => beds.length > 0).length,
    [selectedBedsByRoom]
  );

  const isButtonDisabled = totalSelectedBeds === 0 || loading || userLoading || !userData;
  const buttonTitle = isContinueMode ? "Book" : "Reserve";
  const onButtonPress = isContinueMode ? handleBook : handleReserve;

  const onImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / IMAGE_WIDTH);
    if (idx !== activeImageIndex) setActiveImageIndex(idx);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      hardwareAccelerated
    >
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                        onPress={() => setSelectedRoomId(room._id)}
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
                  {currentRoom.photos && currentRoom.photos.length > 0 && (
                    <View style={styles.imageContainer}>
                      <ScrollView
                        ref={(ref) => (scrollRef.current = ref)}
                        horizontal
                        pagingEnabled
                        snapToInterval={IMAGE_WIDTH}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        onScroll={onImageScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={{ alignItems: "center" }}
                      >
                        {currentRoom.photos.map((photo, index) => (
                          <View key={index} style={{ width: IMAGE_WIDTH, alignItems: "center" }}>
                            <Image source={{ uri: photo }} style={styles.roomImage} resizeMode="cover" />
                          </View>
                        ))}
                      </ScrollView>

                      {currentRoom.photos.length > 1 && (
                        <View style={styles.dotsContainer}>
                          {currentRoom.photos.map((_, idx) => (
                            <View
                              key={idx}
                              style={[styles.dot, idx === activeImageIndex ? styles.dotActive : undefined]}
                            />
                          ))}
                        </View>
                      )}

                      <View style={styles.roomBadge}>
                        <Text style={styles.roomBadgeText}>Room {currentRoom.roomNumber}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.roomDetails}>
                    <Text style={styles.roomTitle}>Room {currentRoom.roomNumber}</Text>
                    {currentRoom.description && (
                      <Text style={styles.description}>{currentRoom.description}</Text>
                    )}
                  </View>

                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerText, styles.bedNoHeader]}>Bed No</Text>
                      <Text style={[styles.headerText, styles.statusHeader]}>Status</Text>
                      <Text style={[styles.headerText, styles.availabilityHeader]}>Availability</Text>
                      <Text style={[styles.headerText, styles.selectHeader]}>Select</Text>
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
            <Buttons title={buttonTitle} onPress={onButtonPress} disabled={isButtonDisabled} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: {
    flex: 1,
    marginHorizontal: HORIZONTAL_MARGIN,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#A5A5A5",
    borderRadius: 10,
  },
  errorText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 12 },
  imageContainer: { margin: 16, borderRadius: 12, overflow: "hidden", position: "relative", alignItems: "center" },
  roomImage: { width: IMAGE_WIDTH - 0, height: IMAGE_HEIGHT, borderRadius: 12 },
  roomBadge: { position: "absolute", bottom: 40, left: 16, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roomBadgeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  dotsContainer: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#E5E7EB", marginHorizontal: 4 },
  dotActive: { backgroundColor: colors.primary, width: 10, height: 10 },
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
  bedInfo: { flex: 2, flexDirection: "row", alignItems: "center" },
  bedNumber: { fontSize: 14, color: "#1F2937", marginLeft: 8, flexShrink: 1 },
  status: { flex: 2, fontSize: 14, color: "#1F2937", flexShrink: 1 },
  availability: { flex: 2.5, fontSize: 14, color: "#1F2937", flexShrink: 1 },
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
  bottomContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  buttonWrapper: { alignItems: "center" },
});

export default RoomSelectionModal;