import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import colors from "@/constants/colors";
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";
import { calender, location1, person } from "@/assets/images";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RoomSelectionModal from "@/components/modals/RoomSelectionModal";// Adjust path as needed to import the RoomSelectionModal

type ServiceType = "tiffin" | "hostel";
type MealType = "breakfast" | "lunch" | "dinner";
type SelectedRoom = {
  roomNumber: string;
  bedNumber: number;
  roomId?: string;
  bedId?: string;
};

interface ContinueRoomSelectionData {
  roomsData: Array<{
    roomId: string;
    roomNumber: string | number;
    beds: Array<{ bedId: string; bedNumber: string | number }>;
  }>;
  plan: any;
  checkInDate: string;
  checkOutDate: string;
  userData: string;
}

type RoomData = Array<{
  roomId: string;
  roomNumber: string | number;
  beds: Array<{ bedId: string; bedNumber: string | number }>;
}>;

export default function ContinueSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.serviceType as ServiceType) || "tiffin";

  const serviceName = params.serviceName || "";
  const price = params.price || "";
  const planPrice = params.planPrice || price || ""; // New: Base plan price from params
  const plan = params.plan || "monthly"; // New: Plan from params (e.g., "monthly", "weekly")
  const serviceId = params.serviceId || "";
  const hostelId = params.hostelId || ""; // From entityId in Booking screen
  const orderId = params.orderId || ""; 
  const bookingId = params.bookingId || ""; // Keep for fallback or custom ID, but prioritize orderId for API
  const fullName = params.fullName || ""; // New: From params
  const checkInDateParam = params.checkInDate || "";
  const checkOutDateParam = params.checkOutDate || "";
  const roomsParamStr = params.rooms as string; // Stringified rooms from params

  // Memoize parsed values to prevent re-creation on every render
  const bookingData = useMemo(() => {
    const rawBookingData = params.bookingData;
    return rawBookingData ? JSON.parse(rawBookingData as string) : null;
  }, [params.bookingData]);

  const parsedRooms = useMemo(() => {
    if (!roomsParamStr) return [];
    try {
      return JSON.parse(roomsParamStr);
    } catch (error) {
      console.error("Error parsing rooms from params:", error);
      return [];
    }
  }, [roomsParamStr]);

  const existingSelectPlan = useMemo(() => 
    bookingData?.selectPlan ? bookingData.selectPlan[0] : null, 
    [bookingData]
  );

  // Tiffin-specific states
  const [numberOfTiffin, setNumberOfTiffin] = useState("1");
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("1");
  const [selectedfood, setSelectedfood] = useState("Both");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [mealPreferences, setMealPreferences] = useState({
    breakfast: true,
    lunch: true,
    dinner: false,
  });
  const [sameAsSelections, setSameAsSelections] = useState({
    sameForAll: false,
    sameAs1: false,
    sameAs2: false,
    sameAs3: false,
  });
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState("perMeal");
  const [selectedMealsSummary, setSelectedMealsSummary] = useState("");
  const [fetchedPlanType, setFetchedPlanType] = useState("");
  const [fetchedPricing, setFetchedPricing] = useState({
    perBreakfast: 0,
    perMeal: 0,
    weekly: 0,
    monthly: 0,
    offers: "",
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [planError, setPlanError] = useState("");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [hostelPlan, setHostelPlan] = useState(plan); // New: Initialize with passed plan
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<
    "work" | "leisure" | "student"
  >("work");

  const [token, setToken] = useState<string | null>(null);

  // Hostel-specific states
  const [hostelPlanTypes, setHostelPlanTypes] = useState<
    { label: string; value: string }[]
  >([]);
  const [isFetchingHostelPlans, setIsFetchingHostelPlans] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(planPrice || price || ""); // New: Prefer planPrice if available

  // Room data state
  const [roomsData, setRoomsData] = useState<RoomData>([]);

  // Room selection modal state (for hostel only)
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [fullBooking, setFullBooking] = useState<any>(null); // New: Full booking object
  const [userData, setUserData] = useState<any>(null); // Updated: Full guest object from booking or profile
  const [parsedRoomsState, setParsedRoomsState] = useState<any[]>(parsedRooms); // Initialize with memoized parsedRooms

  const hostelData = {
    id: hostelId,
    name: serviceName,
    price: planPrice || price, // Use planPrice for base
    deposit: "0", // Assume 0 for now; can be fetched or passed if needed
  };

  // Add this useEffect inside the ContinueSubscriptionScreen component, after the state declarations
  useEffect(() => {
    console.log("=== Continue Subscription Screen Debug ===");
    console.log("Raw Params:", params);
    console.log("Parsed Params:", {
      serviceType,
      serviceName,
      price,
      planPrice,
      plan,
      serviceId,
      hostelId,
      orderId,
      bookingId,
      fullName,
      checkInDateParam,
      checkOutDateParam,
      roomsParamStr,
      parsedRooms,
    });
    console.log("Service Type:", serviceType);
    console.log("Service Name:", serviceName);
    console.log("Price:", price);
    console.log("Plan Price:", planPrice);
    console.log("Plan:", plan);
    console.log("Service ID:", serviceId);
    console.log("Hostel ID:", hostelId);
    console.log("Order ID:", orderId);
    console.log("Booking ID:", bookingId);
    console.log("Full Name from Params:", fullName);
    console.log("Check-in Date from Params:", checkInDateParam);
    console.log("Check-out Date from Params:", checkOutDateParam);
    console.log("Parsed Rooms from Params:", parsedRooms);
    console.log("Booking Data (raw):", params.bookingData);
    console.log("Parsed Booking Data:", bookingData);
    if (bookingData) {
      console.log("Select Plan:", bookingData.selectPlan);
      console.log("Existing Select Plan:", existingSelectPlan);
      console.log("Check-in Date:", bookingData.checkInDate);
      console.log("Check-out Date:", bookingData.checkOutDate);
      console.log("Total Amount:", bookingData.totalAmount);
      console.log("Deposit Amount:", bookingData.depositAmount);
      console.log("Work Type:", bookingData.workType);
      console.log("Rooms:", bookingData.rooms);
      console.log("Full Name:", bookingData.fullName);
      console.log("Phone Number:", bookingData.phoneNumber);
    }
    console.log("Current Check-in Date State:", checkInDate);
    console.log("Current Check-out Date State:", checkOutDate);
    console.log("Current Hostel Plan State:", hostelPlan);
    console.log("Display Price:", displayPrice);
    console.log("Fetched Rooms Data:", roomsData);
    console.log("Selected Rooms:", selectedRooms);
    console.log("Full Booking:", fullBooking);
    console.log("User Data (Full Guest):", userData);
    console.log("=== End Debug ===");
  }, [params, bookingData, existingSelectPlan, checkInDate, checkOutDate, hostelPlan, displayPrice, selectedRooms, roomsData, fullBooking, userData]);

  // Fetch token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const tok = await AsyncStorage.getItem("token");
      // console.log("token", tok);
      setToken(tok);
    };
    fetchToken();
  }, []);

  // Update parsedRoomsState when memoized parsedRooms changes (runs once)
  useEffect(() => {
    setParsedRoomsState(parsedRooms);
  }, [parsedRooms]);

  // New: Fetch full booking details using orderId (for full guest object and existing rooms)
  useEffect(() => {
    const fetchFullBooking = async () => {
      if (orderId && token && serviceType === "hostel") {
        try {
          console.log("Fetching full booking for ID:", orderId);
          // Assuming backend has an endpoint like this; adjust if different
          const response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelBookingById/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            const booking = response.data.data;
            console.log("Full Booking Fetched:", booking);
            setFullBooking(booking);
            // Set userData from full booking (full guest object)
            setUserData({
              name: booking.fullName,
              phoneNumber: booking.phoneNumber,
              email: booking.email || "", // If available
              workType: booking.workType || "Student",
              adharCardPhoto: booking.addharCardPhoto || null,
              userPhoto: booking.userPhoto || null,
            });
            // Override parsedRooms with full booking rooms if available
            if (booking.rooms && booking.rooms.length > 0) {
              setParsedRoomsState(booking.rooms); // FIXED: Use setParsedRoomsState
            }
          }
        } catch (error) {
          console.error("Error fetching full booking:", error);
          // Fallback to AsyncStorage userProfile for guest details
          const profileString = await AsyncStorage.getItem("userProfile");
          if (profileString) {
            const parsed = JSON.parse(profileString);
            if (parsed.guest) {
              setUserData({
                name: parsed.guest.name || fullName,
                phoneNumber: parsed.guest.phoneNumber,
                email: parsed.guest.email || "",
                workType: parsed.guest.workType || "Student",
                adharCardPhoto: parsed.guest.adharCardPhoto || null,
                userPhoto: parsed.guest.userPhoto || null,
              });
            }
          }
        }
      }
    };
    fetchFullBooking();
  }, [token, orderId, serviceType, fullName]); // Stable deps

  // Set existing plan if available (fallback to params if no bookingData)
  useEffect(() => {
    if (existingSelectPlan) {
      setHostelPlan(existingSelectPlan.name);
      setDisplayPrice(existingSelectPlan.price.toString());
    } else if (serviceType === "hostel") {
      // New: Use passed plan and planPrice from params if no existingSelectPlan
      setHostelPlan(plan);
      setDisplayPrice(planPrice);
    }
  }, [existingSelectPlan, plan, planPrice, serviceType]);

  // Set check-in and check-out dates from booking data, params, or fullBooking if available
  useEffect(() => {
    let sourceCheckIn = null;
    let sourceCheckOut = null;
    if (fullBooking) {
      sourceCheckIn = fullBooking.checkInDate;
      sourceCheckOut = fullBooking.checkOutDate;
    } else if (bookingData) {
      sourceCheckIn = bookingData.checkInDate;
      sourceCheckOut = bookingData.checkOutDate;
    } else {
      sourceCheckIn = checkInDateParam;
      sourceCheckOut = checkOutDateParam;
    }
    if (sourceCheckIn) {
      setCheckInDate(new Date(sourceCheckIn));
    }
    if (sourceCheckOut) {
      setCheckOutDate(new Date(sourceCheckOut));
    }
  }, [bookingData, fullBooking, checkInDateParam, checkOutDateParam]);

  // Set selected rooms from fullBooking, booking data, or params if available (for continue mode)
  useEffect(() => {
    let sourceRooms: any[] | null = null;
    if (fullBooking && fullBooking.rooms && Array.isArray(fullBooking.rooms) && fullBooking.rooms.length > 0) {
      sourceRooms = fullBooking.rooms;
    } else if (bookingData && bookingData.rooms && Array.isArray(bookingData.rooms) && bookingData.rooms.length > 0) {
      sourceRooms = bookingData.rooms;
    } else if (parsedRoomsState && Array.isArray(parsedRoomsState) && parsedRoomsState.length > 0) {
      sourceRooms = parsedRoomsState;
    }

    if (sourceRooms) {
      // Flatten rooms with their selected beds (beds is an array in source)
      const restoredRooms: SelectedRoom[] = sourceRooms.flatMap((room: any) =>
        (room.beds || room.bedNumber || []).map((bed: any) => ({
          roomNumber: room.roomNumber?.toString() || room.roomNum?.toString() || room.room_number?.toString() || '',
          bedNumber: typeof bed === 'number' ? Number(bed) : Number(bed.bedNumber || bed.bedNum || bed || 0),
          roomId: room.roomId || room.room_id,
          bedId: typeof bed === 'object' ? (bed.bedId || bed.bed_id || bed._id) : undefined,
        }))
      ).filter(room => room.roomNumber && room.bedNumber > 0); // Filter out invalid rooms/beds

      setSelectedRooms(restoredRooms);
      console.log("Restored selected rooms from source:", restoredRooms); // For debugging
    }
  }, [fullBooking, bookingData, parsedRoomsState]);

  // Auto-fill check-out date based on check-in and plan
  useEffect(() => {
    if (checkInDate && hostelPlan && !fullBooking?.checkOutDate) { // Only auto-fill if not from existing booking
      let daysToAdd = 0;
      switch (hostelPlan) {
        case 'weekly':
          daysToAdd = 7;
          break;
        case 'monthly':
          daysToAdd = 30;
          break;
        case 'quarterly':
          daysToAdd = 90;
          break;
        case 'halfyearly':
          daysToAdd = 182; // Approx 6 months
          break;
        case 'yearly':
          daysToAdd = 365;
          break;
      }
      if (daysToAdd > 0) {
        const newCheckOutDate = new Date(checkInDate);
        newCheckOutDate.setDate(checkInDate.getDate() + daysToAdd);
        newCheckOutDate.setHours(0, 0, 0, 0);
        setCheckOutDate(newCheckOutDate);
      }
    }
  }, [checkInDate, hostelPlan, fullBooking]);

  // Fetch hostel plan types after token is available (skip if existing plan or params plan available)
  useEffect(() => {
    if (token && serviceType === "hostel" && !existingSelectPlan && !plan) {
      fetchHostelPlanTypes();
    }
  }, [token, serviceType, existingSelectPlan, plan]);

  // Fetch rooms data for hostel
  useEffect(() => {
    if (token && serviceType === "hostel" && hostelId) {
      fetchRooms();
    }
  }, [token, serviceType, hostelId]);

  // Handle room selection from modal (for continue mode)
  const handleRoomSelection = (data: ContinueRoomSelectionData) => {
    const selected = data.roomsData.flatMap((room) =>
      room.beds.map((bed) => ({
        roomNumber: room.roomNumber.toString(),
        bedNumber: Number(bed.bedNumber),
        roomId: room.roomId,
        bedId: bed.bedId,
      }))
    );
    setSelectedRooms(selected);
  };

  const fetchHostelPlanTypes = async () => {
    if (!token) return;
    setIsFetchingHostelPlans(true);
    try {
      const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPlanTypes",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        const items = response.data.data.map((plan: string) => ({
          label: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase(),
          value: plan.toLowerCase(),
        }));
        setHostelPlanTypes(items);
      }
    } catch (error) {
      console.error("Failed to fetch hostel plan types:", error);
      // Fallback to hardcoded if fetch fails
      setHostelPlanTypes([
        { label: "Monthly", value: "monthly" },
        { label: "Weekly", value: "weekly" }, // New: Add weekly
        { label: "Quarterly", value: "quarterly" },
        { label: "Half Yearly", value: "halfyearly" },
        { label: "Yearly", value: "yearly" },
      ]);
    } finally {
      setIsFetchingHostelPlans(false);
    }
  };

  const fetchRooms = async () => {
    if (!token || !hostelId) return;
    try {
      const response = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRoomByHostelid/${hostelId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setRoomsData(response.data.data);
        console.log("Fetched rooms data:", response.data.data); // For debugging
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const Checkbox = ({
    checked,
    onPress,
  }: {
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.checkboxBase, checked && styles.checkboxSelected]}
      onPress={onPress}
    >
      {checked && <Text style={styles.checkMark}>✔</Text>}
    </TouchableOpacity>
  );

  const RadioButton = ({
    label,
    value,
    selected,
    onPress,
  }: {
    label: string;
    value: string;
    selected: string;
    onPress: (value: string) => void;
  }) => (
    <TouchableOpacity style={styles.radioRow} onPress={() => onPress(value)}>
      <View style={styles.radioOuter}>
        {selected === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.back();
  };

const handleSubmit = async () => {
  console.log("🔥 handleSubmit called! Service Type:", serviceType);
  console.log("🔍 Current States - checkInDate:", checkInDate, "checkOutDate:", checkOutDate, "token:", !!token, "orderId:", orderId, "selectedRooms.length:", selectedRooms.length);

  if (serviceType === "tiffin") {
    console.log("🍱 Entering Tiffin branch - just logging and returning.");
    console.log("Tiffin subscription renewed:", {
      numberOfTiffin,
      selectTiffinNumber,
      mealPreferences,
      selectedfood,
      orderType,
      selectedPlanType,
      date,
    });
    // TODO: Implement tiffin continue API call and navigate to check-out if needed
    // router.push("/(secure)/check-out");
    return;
  } else {
    console.log("🏠 Entering Hostel branch.");
    // Hostel continue subscription
    if (!checkInDate || !checkOutDate || !token || !orderId) {
      console.log("❌ Validation failed: Missing required info.");
      console.log("  - checkInDate valid?", !!checkInDate);
      console.log("  - checkOutDate valid?", !!checkOutDate);
      console.log("  - token present?", !!token);
      console.log("  - orderId present?", !!orderId);
      Alert.alert("Error", "Missing required information. Please fill all fields.");
      return;
    }

    console.log("✅ Validation passed for required fields.");

    if (selectedRooms.length === 0) {
      console.log("❌ No rooms selected.");
      Alert.alert("Error", "Please select at least one room and bed.");
      return;
    }

    console.log("✅ Rooms selected, proceeding to diff logic.");

    // 🧩 Debug logs to understand source data
    console.log("📦 fullBooking:", fullBooking);
    console.log("📦 bookingData:", bookingData);
    console.log("📦 parsedRoomsState:", parsedRoomsState);
    console.log("🛏️ Selected Rooms:", selectedRooms);
    console.log("🆔 Order ID Received:", orderId);

    // Compute existing beds map from fullBooking, bookingData, or parsedRooms
    const existingBeds = new Map<string, any>();
    let sourceRoomsForExisting: any[] = [];

    if (fullBooking && fullBooking.rooms && Array.isArray(fullBooking.rooms)) {
      sourceRoomsForExisting = fullBooking.rooms;
      console.log("✅ Using rooms from fullBooking");
    } else if (bookingData && bookingData.rooms && Array.isArray(bookingData.rooms)) {
      sourceRoomsForExisting = bookingData.rooms;
      console.log("✅ Using rooms from bookingData");
    } else if (parsedRoomsState && Array.isArray(parsedRoomsState)) {
      sourceRoomsForExisting = parsedRoomsState;
      console.log("✅ Using rooms from parsedRoomsState");
    } else {
      console.log("⚠️ No valid room source found for existing beds");
    }

    console.log("📊 sourceRoomsForExisting length:", sourceRoomsForExisting.length);

    if (sourceRoomsForExisting.length > 0) {
      sourceRoomsForExisting.forEach((room: any) => {
        const beds = room.beds || room.bedNumber || [];
        if (beds && Array.isArray(beds)) {
          beds.forEach((bed: any) => {
            const key = `${room.roomId || room._id}-${bed.bedId || bed._id}`;
            existingBeds.set(key, {
              roomId: room.roomId || room._id,
              roomNumber: room.roomNumber,
              bedId: bed.bedId || bed._id,
              bedNumber: bed.bedNumber,
              name: bed.name || "",
            });
          });
        }
      });
    }

    console.log("🗺️ Existing Beds Map:", Array.from(existingBeds.values()));

    // New beds set for comparison
    const newBedsSet = new Set(
      selectedRooms.map((r) => `${r.roomId || ""}-${r.bedId || ""}`)
    );

    // Add beds: new selections not in existing
    const addBeds: any[] = selectedRooms
      .filter((r) => {
        const key = `${r.roomId || ""}-${r.bedId || ""}`;
        return !existingBeds.has(key);
      })
      .map((r) => ({
        bedId: r.bedId || "",
        bedNumber: r.bedNumber,
        name: "", // New bed, name to be set later
        roomId: r.roomId || "",
        roomNumber: r.roomNumber || "",
      }));

    // Remove beds: existing not in new selections
    const removeBeds: any[] = Array.from(existingBeds.values()).filter((b) => {
      const key = `${b.roomId}-${b.bedId}`;
      return !newBedsSet.has(key);
    });

    console.log("➕ Add Beds:", addBeds);
    console.log("➖ Remove Beds:", removeBeds);

    // Group addRooms
    const addRooms: any[] = [];
    const addRoomMap = new Map<string, any>();
    addBeds.forEach((bed) => {
      const roomId = bed.roomId;
      if (!addRoomMap.has(roomId)) {
        addRoomMap.set(roomId, {
          roomId,
          roomNumber: bed.roomNumber,
          bedNumber: [], // Use bedNumber as per API example
        });
      }
      const room = addRoomMap.get(roomId);
      room.bedNumber.push({
        bedId: bed.bedId,
        bedNumber: bed.bedNumber,
        name: bed.name || "",
      });
      addRoomMap.set(roomId, room);
    });
    addRooms.push(...Array.from(addRoomMap.values()));

    // Group removeRooms
    const removeRooms: any[] = [];
    const removeRoomMap = new Map<string, any>();
    removeBeds.forEach((bed) => {
      const roomId = bed.roomId;
      if (!removeRoomMap.has(roomId)) {
        removeRoomMap.set(roomId, {
          roomId,
          roomNumber: bed.roomNumber,
          bedNumber: [],
        });
      }
      const room = removeRoomMap.get(roomId);
      room.bedNumber.push({
        bedId: bed.bedId,
        bedNumber: bed.bedNumber,
        name: bed.name,
      });
      removeRoomMap.set(roomId, room);
    });
    removeRooms.push(...Array.from(removeRoomMap.values()));

    const requestBody = {
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      addRooms,
      removeRooms,
    };

    console.log("📤 Continue Subscription API Body:", requestBody);
    console.log("👤 Full User/Guest Data Used:", userData);

    // 🆕 Log exactly what’s being sent
    console.log("🆔 Order ID being passed to API:", orderId);
    console.log(
      "🌐 Continue Subscription API URL:",
      `https://tifstay-project-be.onrender.com/api/guest/hostelServices/continueSubscription/${orderId}`
    );

    console.log("🚀 Making API call...");
    try {
      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/continueSubscription/${orderId}`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 API Response:", response.data);

      if (response.data.success) {
        const newBookingData = response.data.data;
        console.log("✅ Continue subscription success:", newBookingData);
        console.log("📘 Status:", newBookingData.status);
        console.log("🧭 Attempting navigation to check-out with new bookingId:", newBookingData._id);
        router.push({
          pathname: "/(secure)/check-out",
          params: {
            bookingId: newBookingData._id,
            serviceType: "hostel",
          },
        });
        console.log("✅ Navigation pushed!");
      } else {
        console.log("❌ API success false:", response.data.message);
        Alert.alert("Error", response.data.message || "Failed to continue subscription.");
      }
    } catch (error) {
      console.error("❌ Continue Subscription API Error:", error);
      if (axios.isAxiosError(error)) {
        console.log("  - Response status:", error.response?.status);
        console.log("  - Response data:", error.response?.data);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Network error occurred."
        );
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  }
};



// Auto-set meal preferences based on selected plan type
useEffect(() => {
  if (selectedPlanType) {
    let prefs = { breakfast: false, lunch: false, dinner: false };
    if (selectedPlanType === "perBreakfast") {
      prefs.breakfast = true;
    } else if (selectedPlanType === "perMeal") {
      prefs.lunch = true;
    } else if (
      selectedPlanType === "weekly" ||
      selectedPlanType === "monthly"
    ) {
      prefs = { breakfast: true, lunch: true, dinner: true };
    }
    setMealPreferences(prefs);
    const selectedMeals = Object.entries(prefs)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    setSelectedMealsSummary(selectedMeals.join(", "));
  }
}, [selectedPlanType]);

// Auto-fill end date based on start date and plan type
useEffect(() => {
  if (date && ["weekly", "monthly"].includes(selectedPlanType)) {
    let daysToAdd = 0;
    if (selectedPlanType === "weekly") {
      daysToAdd = 7;
    } else if (selectedPlanType === "monthly") {
      daysToAdd = 30;
    }
    const newEndDate = new Date(date);
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);
    setEndDate(newEndDate);
  } else if (!["weekly", "monthly"].includes(selectedPlanType)) {
    setEndDate(null);
  }
}, [date, selectedPlanType]);

// Update price based on selections
useEffect(() => {
  let newPrice = 0;
  if (selectedPlanType) {
    let basePrice = 0;
    const pricingKey = selectedPlanType as keyof typeof fetchedPricing;
    if (fetchedPricing && fetchedPricing[pricingKey] > 0) {
      basePrice = fetchedPricing[pricingKey];
    } else {
      if (selectedPlanType === "perBreakfast") {
        basePrice = 120;
      } else if (selectedPlanType === "perMeal") {
        basePrice = 120;
      } else if (selectedPlanType === "weekly") {
        basePrice = 800;
      } else if (selectedPlanType === "monthly") {
        basePrice = 3200;
      }
    }
    const numTiffins = parseInt(numberOfTiffin || "1");
    newPrice = basePrice * numTiffins;
  }
  setCurrentPlanPrice(newPrice);
}, [selectedPlanType, numberOfTiffin, fetchedPricing]);

const onChangeDate = (event: any, selectedDate?: Date) => {
  setShowDatePicker(Platform.OS === "ios");
  if (selectedDate) setDate(selectedDate);
};

const onChangeEndDate = (event: any, selectedDate?: Date) => {
  setShowEndDatePicker(Platform.OS === "ios");
  if (selectedDate) setEndDate(selectedDate);
};

const onChangeCheckInDate = (event: any, selectedDate?: Date) => {
  setShowCheckInPicker(Platform.OS === "ios");
  if (selectedDate) setCheckInDate(selectedDate);
};

const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
  setShowCheckOutPicker(Platform.OS === "ios");
  if (selectedDate) setCheckOutDate(selectedDate);
};

const toggleMealPreference = (meal: MealType) => {
  setMealPreferences((prev) => {
    const newPrefs = { ...prev, [meal]: !prev[meal] };
    const selectedMeals = Object.entries(newPrefs)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    setSelectedMealsSummary(selectedMeals.join(", "));
    return newPrefs;
  });
};

const toggleSameAs = (key: keyof typeof sameAsSelections) => {
  setSameAsSelections((prev) => ({ ...prev, [key]: !prev[key] }));
};

const handleGetPlanDetails = async () => {
  const selectedMeals: string[] = [];
  if (mealPreferences.breakfast) selectedMeals.push("Breakfast");
  if (mealPreferences.lunch) selectedMeals.push("Lunch");
  if (mealPreferences.dinner) selectedMeals.push("Dinner");
  const mealPrefStr = selectedMeals.join(",");
  if (mealPrefStr === "") {
    setPlanError("Please select at least one meal preference.");
    return;
  }

  let foodTypeStr = "";
  if (selectedfood === "Veg") foodTypeStr = "Veg";
  else if (selectedfood === "Non-Veg") foodTypeStr = "Non-Veg";
  else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";

  const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);

  if (!token) {
    setPlanError("Authentication required.");
    return;
  }

  if (!serviceId) {
    setPlanError("Service ID not available.");
    return;
  }

  setIsFetchingDetails(true);
  setPlanError("");
  try {
    const queryParams = new URLSearchParams({
      mealPreference: mealPrefStr,
      foodType: foodTypeStr,
      orderType: orderTypeStr,
    });

    const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${serviceId}?${queryParams.toString()}`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      const data = response.data.data;
      setFetchedPlanType(data.planType);
      setFetchedPricing({
        perBreakfast: data.pricing.perBreakfast || 0,
        perMeal: data.pricing.perMeal || 0,
        weekly: data.pricing.weekly || 0,
        monthly: data.pricing.monthly || 0,
        offers: data.offers || "",
      });
      const totalPricing =
        (data.pricing.perBreakfast || 0) +
        (data.pricing.perMeal || 0) +
        (data.pricing.weekly || 0) +
        (data.pricing.monthly || 0);
      if (totalPricing === 0) {
        setPlanError(
          "No plans available for your selected preferences. Please try different options."
        );
      } else {
        setPlanError("");
      }
    } else {
      setPlanError("Failed to fetch plan details: " + response.data.message);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setPlanError(
        "Failed to fetch plan details: " +
        (error.response?.data?.message || "Network error")
      );
    } else {
      setPlanError("Failed to fetch plan details.");
    }
  } finally {
    setIsFetchingDetails(false);
  }
};

// Hardcoded plan options for fallback
const hardcodedPlanOptions = [
  { label: "Per Breakfast (₹120 / per breakfast)", value: "perBreakfast" },
  { label: "Per Meal (₹120/meal)", value: "perMeal" },
  { label: "Weekly (₹800/weekly) save 15%", value: "weekly" },
  { label: "Monthly (₹3200/monthly) save 15%", value: "monthly" },
];

const getPlanOptions = () => {
  const options: { label: string; value: string }[] = [];
  if (fetchedPricing.perBreakfast > 0) {
    options.push({
      label: `Per Breakfast (₹${fetchedPricing.perBreakfast} / per breakfast)`,
      value: "perBreakfast",
    });
  }
  if (fetchedPricing.perMeal > 0) {
    options.push({
      label: `Per Meal (₹${fetchedPricing.perMeal}/meal)`,
      value: "perMeal",
    });
  }
  if (fetchedPricing.weekly > 0) {
    options.push({
      label: `Weekly (₹${fetchedPricing.weekly}/weekly)`,
      value: "weekly",
    });
  }
  if (fetchedPricing.monthly > 0) {
    options.push({
      label: `Monthly (₹${fetchedPricing.monthly}/monthly)`,
      value: "monthly",
    });
  }
  if (options.length === 0) {
    return hardcodedPlanOptions;
  }
  return options;
};

const renderTiffinForm = () => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.section}>
      <View style={{ flexDirection: "row" }}>
        <Image source={calender} style={styles.icon} />
        <Text style={styles.sectionTitle}> Booking Details</Text>
      </View>
      <Text style={styles.label}>Number Of Tiffin *</Text>
      <TextInput
        style={styles.input}
        value={numberOfTiffin}
        keyboardType="numeric"
        onChangeText={setNumberOfTiffin}
      />
      <Text style={styles.label}>Select Tiffin Number</Text>
      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          onValueChange={setSelectTiffinNumber}
          items={[
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ]}
          placeholder={{ label: "Select Tiffin Number", value: null }}
          style={{
            inputIOS: styles.pickerInput,
            inputAndroid: styles.pickerInput,
          }}
          value={selectTiffinNumber}
        />
      </View>

      {/* <Text style={[styles.subSectionTitle]}>Apply Preferences</Text> */}
      {Object.entries(sameAsSelections).map(([key, value]) => (
        <View style={styles.checkboxRow} key={key}>
          <Checkbox
            checked={value}
            onPress={() => toggleSameAs(key as keyof typeof sameAsSelections)}
          />
          <Text style={styles.checkboxLabel}>
            {key === "sameForAll"
              ? "Same For All"
              : `Same As ${key.slice(-1)}`}
          </Text>
        </View>
      ))}

      <Text style={styles.subSectionTitle}>Meal Preference</Text>
      {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
        <View style={styles.checkboxRow} key={meal}>
          <Checkbox
            checked={mealPreferences[meal]}
            onPress={() => toggleMealPreference(meal)}
          />
          <Text style={styles.checkboxLabel}>
            {meal === "breakfast" && "Breakfast (7:00 AM - 9:00 AM)"}
            {meal === "lunch" && "Lunch (12:00 PM - 2:00 PM)"}
            {meal === "dinner" && "Dinner (8:00 PM - 10:00 PM)"}
          </Text>
        </View>
      ))}
      {selectedMealsSummary && (
        <Text
          style={[
            styles.label,
            { fontSize: 12, color: "#666", marginTop: 5 },
          ]}
        >
          Selected: {selectedMealsSummary}
        </Text>
      )}

      <Text style={styles.subSectionTitle}>Food Type</Text>
      <RadioButton
        label="Veg"
        value="Veg"
        selected={selectedfood}
        onPress={setSelectedfood}
      />
      <RadioButton
        label="Non-Veg"
        value="Non-Veg"
        selected={selectedfood}
        onPress={setSelectedfood}
      />
      <RadioButton
        label="Both Veg & Non-Veg"
        value="Both"
        selected={selectedfood}
        onPress={setSelectedfood}
      />

      <Text style={styles.subSectionTitle}>Choose Order Type</Text>
      {["dining", "delivery"].map((type) => (
        <View style={styles.checkboxRow} key={type}>
          <TouchableOpacity
            style={[
              styles.checkboxBase,
              orderType === type && styles.checkboxSelected,
            ]}
            onPress={() => setOrderType(type as "dining" | "delivery")}
          >
            {orderType === type && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </View>
      ))}

      <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
        Get Plan Details
      </Text>
      <TouchableOpacity
        style={[
          styles.submitButton,
          (Object.values(mealPreferences).filter(Boolean).length === 0 ||
            isFetchingDetails) &&
          styles.disabledButton,
        ]}
        onPress={handleGetPlanDetails}
        disabled={
          Object.values(mealPreferences).filter(Boolean).length === 0 ||
          isFetchingDetails
        }
      >
        {isFetchingDetails ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Get Plan Details</Text>
        )}
      </TouchableOpacity>
      {planError ? (
        <Text style={styles.errorText}>{planError}</Text>
      ) : fetchedPricing.offers ? (
        <Text style={styles.offersText}>{fetchedPricing.offers}</Text>
      ) : null}

      <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
        Choose Plan Type
      </Text>
      {getPlanOptions().map((option) => (
        <RadioButton
          key={option.value}
          label={option.label}
          value={option.value}
          selected={selectedPlanType}
          onPress={setSelectedPlanType}
        />
      ))}

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>₹{currentPlanPrice}</Text>
        <Text style={styles.depositText}>No Deposit</Text>
      </View>

      <Text style={styles.label}>Select Start Date *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerText}>
          {date ? date.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
        </Text>
        <Image source={calender} style={styles.calendarIcon} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      {["weekly", "monthly"].includes(selectedPlanType) && (
        <>
          <Text style={styles.label}>Select End Date *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {endDate ? endDate.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
            </Text>
            <Image source={calender} style={styles.calendarIcon} />
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date(date || new Date())}
              mode="date"
              display="default"
              onChange={onChangeEndDate}
              minimumDate={date || new Date()}
            />
          )}
        </>
      )}
    </View>

    <View style={styles.summarySection}>
      <Text style={styles.serviceName}>
        {serviceName || "Maharashtrian Ghar Ka Khana"}
      </Text>
      <Text style={styles.priceText}>Price: ₹120/meal</Text>
    </View>

    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
      <Text style={styles.submitButtonText}>Submit Booking Request</Text>
    </TouchableOpacity>

    <Text style={styles.confirmationText}>
      Provider will reach out within 1 hour to confirm.
    </Text>
  </ScrollView>
);

const renderHostelForm = () => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.section}>
      <Text style={styles.hostelName}>
        {serviceName || "Scholars Den Boys Hostel"}
      </Text>

      <Text style={styles.label}>Plan</Text>
      <View style={styles.pickerWrapper}>
        <Text style={[styles.pickerInput, { color: "#000", paddingHorizontal: 12, paddingVertical: 12 }]}>
          {existingSelectPlan
            ? `${existingSelectPlan.name.charAt(0).toUpperCase() + existingSelectPlan.name.slice(1)} Plan (₹${existingSelectPlan.price}/${existingSelectPlan.name})`
            : `${hostelPlan.charAt(0).toUpperCase() + hostelPlan.slice(1)} Plan (₹${displayPrice}/${hostelPlan})`
          }
        </Text>
      </View>

      <Text style={styles.priceText}>
        {existingSelectPlan
          ? `₹${existingSelectPlan.price}/${existingSelectPlan.name}`
          : `${displayPrice || "₹8000/month"}`
        }
      </Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Booking Details</Text>

      <Text style={styles.label}>Check-in date *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckInPicker(true)}
      >
        <Text style={styles.datePickerText}>
          {checkInDate ? checkInDate.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={styles.label}>Check-out date *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckOutPicker(true)}
      >
        <Text style={styles.datePickerText}>
          {checkOutDate ? checkOutDate.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>

      {showCheckInPicker && (
        <DateTimePicker
          value={checkInDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeCheckInDate}
          minimumDate={new Date()}
        />
      )}

      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOutDate || new Date(checkInDate || new Date())}
          mode="date"
          display="default"
          onChange={onChangeCheckOutDate}
          minimumDate={checkInDate || new Date()}
        />
      )}

      {/* New: Button to open Room Selection Modal */}
      <Text style={styles.label}>Select Rooms & Beds *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowRoomModal(true)}
        disabled={!hostelId || roomsData.length === 0}
      >
        <Text style={styles.datePickerText}>
          {hostelId && roomsData.length > 0
            ? (selectedRooms.length > 0 ? "Edit Selection" : "Tap to Select Rooms & Beds")
            : "Loading Rooms..."
          }
        </Text>
        <Ionicons name="bed-outline" size={20} color="#666" />
      </TouchableOpacity>

      {/* Show selected rooms */}
      {selectedRooms.length > 0 && (
        <View style={styles.selectedRoomsContainer}>
          <Text style={styles.label}>Selected Rooms:</Text>
          {selectedRooms.map((room, index) => (
            <View key={index} style={styles.selectedRoomItem}>
              <Text style={styles.selectedRoomText}>
                Room {room.roomNumber} - Bed {room.bedNumber}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 15 }]}>
        Message (Optional)
      </Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Enter your complete delivery address with landmarks"
        multiline
        value={message}
        onChangeText={setMessage}
      />
    </View>

    <Buttons
      title="Check Out"
      onPress={handleSubmit}
      style={styles.submitButton}
      textStyle={styles.submitButtonText}
    />
  </ScrollView>
);

return (
  <SafeAreaView style={styles.container}>
    {/* Header */}
    <Header
      title="Continue Subscription"
      onBack={handleBack}
      showBackButton={true}
    />
    {/* Main Content */}
    <View style={styles.content}>
      {serviceType === "tiffin" ? renderTiffinForm() : renderHostelForm()}
    </View>

    {/* Room Selection Modal for Hostel */}
    {serviceType === "hostel" && userData && ( // Ensure userData for modal
      <RoomSelectionModal
        visible={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        hostelData={hostelData}
        roomsData={roomsData} // Pass fetched rooms data
        isContinueMode={true}
        selectedRooms={selectedRooms} // Pass pre-selected rooms for continue mode
        onContinueSelection={handleRoomSelection}
        token={token} // Pass the token
      />
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
    color: "#000",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  pickerInput: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxBase: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkMark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: "#374151",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  datePickerText: {
    fontSize: 14,
    color: "#000",
  },
  summarySection: {
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  purposeContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  icon: {
    height: 18,
    width: 16,
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  depositText: {
    fontSize: 14,
    color: "#666",
  },
  calendarIcon: {
    width: 17,
    height: 17,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "left",
  },
  offersText: {
    fontSize: 14,
    color: "#FF6600",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
  // New styles for selected rooms
  selectedRoomsContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  selectedRoomItem: {
    paddingVertical: 4,
  },
  selectedRoomText: {
    fontSize: 14,
    color: "#0ea5e9",
    fontWeight: "500",
  },
});