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
  Modal,
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
  name?: string;
};
interface ContinueRoomSelectionData {
  roomsData: Array<{
    roomId: string;
    roomNumber: string | number;
    beds: Array<{ bedId: string; bedNumber: string | number; name?: string }>;
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
type MealPackage = {
  id: number;
  label: string;
  meals: Record<MealType, boolean>;
  foodType: string;
  planType: string;
};
export default function ContinueSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.serviceType as ServiceType) || "tiffin";
  const serviceName = params.serviceName || "";
  const price = params.price || "";
  const planPrice = params.planPrice || price || ""; // New: Base plan price from params
  const plan = params.plan || "monthly"; // New: Plan from params (e.g., "monthly", "weekly")
  const serviceId = params.serviceId || "";
  const tiffinServiceId = params.tiffinServiceId || "";
  const effectiveServiceId = serviceType === "tiffin" ? tiffinServiceId : serviceId;
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
  // Tiffin-specific states (restored/added for full flow)
  const [tiffinService, setTiffinService] = useState<any>(null);
  const [tiffinOrder, setTiffinOrder] = useState<any>(null);
  const [tiffinMeals, setTiffinMeals] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [selectedMealPackage, setSelectedMealPackage] = useState<number>(0);
  const [selectedPlanType, setSelectedPlanType] = useState<string>("");
  const [tiffinPlan, setTiffinPlan] = useState("weekly"); // Default to weekly (limited options)
  const [selectedfood, setSelectedfood] = useState("Both");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedMealsSummary, setSelectedMealsSummary] = useState("");
  const [fetchedPricing, setFetchedPricing] = useState({
    weekly: 0,
    monthly: 0,
    offers: "",
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [planError, setPlanError] = useState("");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [mealLabels, setMealLabels] = useState<Record<MealType, string>>({});
  const [deliveryInstructions, setDeliveryInstructions] = useState(""); // New: For tiffin delivery instructions
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
  // Error modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hostelData = {
    id: hostelId,
    name: serviceName,
    price: planPrice || price, // Use planPrice for base
    deposit: "0", // Assume 0 for now; can be fetched or passed if needed
  };
  // Helper to normalize beds array from room data
  const getBedsArray = (room: any): any[] => {
    if (Array.isArray(room.beds)) return room.beds;
    if (Array.isArray(room.bedNumber)) return room.bedNumber;
    if (typeof room.bedNumber === 'number') return [{ bedNumber: room.bedNumber }];
    if (room.bedNumber) return [room.bedNumber];
    return [];
  };
  // Helper to generate consistent key for room-bed pair
  const getBedKey = (roomId: string | undefined, bedId: string | undefined | number, bedNumber?: number): string => {
    const effectiveBedId = bedId || (typeof bedNumber === 'number' ? bedNumber.toString() : '');
    return `${roomId || ''}-${effectiveBedId}`;
  };
  // Helper to normalize stored/DB foodType (full label) to short UI/backend value
  const normalizeFoodType = (storedType: string): string => {
    const lower = storedType.toLowerCase().trim();
    if (lower.includes('veg') && !lower.includes('non')) return 'Veg';
    if (lower.includes('non') && !lower.includes('veg')) return 'Non-Veg';
    if (lower.includes('both')) return 'Both';
    return 'Both'; // Default fallback
  };
  // Helper to map short to full for endpoints that expect it (e.g., getPlanDetails)
  const getFullFoodType = (shortType: string): string => {
    switch (shortType) {
      case 'Both': return 'Both Veg & Non-Veg';
      case 'Veg': return 'Veg';
      case 'Non-Veg': return 'Non-veg';
      default: return 'Both Veg & Non-Veg';
    }
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
      tiffinServiceId,
      effectiveServiceId,
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
    console.log("Tiffin Service ID:", tiffinServiceId);
    console.log("Effective Service ID:", effectiveServiceId);
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
    console.log("Tiffin Service:", tiffinService);
    console.log("Tiffin Order:", tiffinOrder);
    console.log("=== End Debug ===");
  }, [params, bookingData, existingSelectPlan, checkInDate, checkOutDate, hostelPlan, displayPrice, selectedRooms, roomsData, fullBooking, userData, tiffinService, tiffinOrder]);
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
          console.log("🔍 Fetching full booking details using ID:", orderId); // Log the ID being used for fetch
          // Assuming backend has an endpoint like this; adjust if different
          const response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getBookingById/${orderId}`,
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
    if (sourceCheckIn && !isNaN(Date.parse(sourceCheckIn))) {
      setCheckInDate(new Date(sourceCheckIn));
    }
    if (sourceCheckOut && !isNaN(Date.parse(sourceCheckOut))) {
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
      // Flatten rooms with their selected beds using helper
      let restoredRooms: SelectedRoom[] = sourceRooms.flatMap((room: any) => {
        const beds = getBedsArray(room);
        return beds.map((bed: any) => ({
          roomNumber: room.roomNumber?.toString() || room.roomNum?.toString() || room.room_number?.toString() || '',
          bedNumber: typeof bed === 'number' ? Number(bed) : Number(bed.bedNumber || bed.bedNum || bed || 0),
          roomId: room.roomId || room.room_id || room._id,
          bedId: typeof bed === 'object' ? (bed.bedId || bed.bed_id || bed._id) : undefined,
          name: bed?.name || '',
        }));
      }).filter(room => room.roomNumber && room.bedNumber > 0); // Filter out invalid rooms/beds
      // Set first bed name to fullName if not set
      if (restoredRooms.length > 0 && (!restoredRooms[0].name || restoredRooms[0].name.trim() === '')) {
        restoredRooms[0].name = fullName || userData?.name || bookingData?.fullName || '';
      }
      setSelectedRooms(restoredRooms);
      console.log("Restored selected rooms from source:", restoredRooms); // For debugging
    }
  }, [fullBooking, bookingData, parsedRoomsState, fullName, userData]);
  // Auto-fill check-out date based on check-in and plan
  useEffect(() => {
    if (checkInDate && hostelPlan) {
      let daysToAdd = 0;
      switch (hostelPlan) {
        case 'daily':
          daysToAdd = 1;
          break;
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
  }, [checkInDate, hostelPlan]);
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
  // NEW: Fetch tiffin service details for meal packages (on mount for continue)
  useEffect(() => {
    if (serviceType === "tiffin" && token && effectiveServiceId) {
      const fetchTiffinService = async () => {
        try {
          const response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinServiceById/${effectiveServiceId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.success) {
            console.log('dattttttaaaa', response.data.data);
            setTiffinService(response.data.data);
            // Set initial order type
            const types = response.data.data.orderTypes || [];
            if (types.length > 0) {
              const initialType = types.includes("Delivery")
                ? "delivery"
                : types[0].toLowerCase().replace(" ", "");
              setOrderType(initialType as "dining" | "delivery");
            }
            // Set meal labels from mealTimings
            const newMealLabels: Record<MealType, string> = {
              breakfast: "",
              lunch: "",
              dinner: "",
            };
            response.data.data.mealTimings?.forEach((mt: any) => {
              const key = mt.mealType.toLowerCase() as MealType;
              if (key in newMealLabels) {
                newMealLabels[key] =
                  `${mt.mealType} (${mt.startTime} - ${mt.endTime})`;
              }
            });
            setMealLabels(newMealLabels);
          }
        } catch (error) {
          console.error("Error fetching tiffin service:", error);
        }
      };
      fetchTiffinService();
    }
  }, [serviceType, token, effectiveServiceId]);
  // NEW: Fetch existing tiffin order details for pre-filling form
  useEffect(() => {
    const fetchTiffinOrderDetails = async () => {
      if (serviceType === "tiffin" && token && orderId) {
        try {
          const response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinOrderById/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.success) {
            const orderData = response.data.data;
            console.log("Fetched Tiffin Order Details:", orderData);
            setTiffinOrder(orderData);
            // Pre-fill states
            setSelectedfood(normalizeFoodType(orderData.foodType || params.foodType || "Both Veg & Non-Veg"));
            const orderTypeStr = orderData.orderType || "Delivery";
            setOrderType(orderTypeStr.toLowerCase() === "delivery" ? "delivery" : "dining");
            // Dates
            if (orderData.startDate) {
              setDate(new Date(orderData.startDate));
            }
            if (orderData.endDate) {
              setEndDate(new Date(orderData.endDate));
            }
            // For subscription type, calculate from dates
            if (orderData.startDate && orderData.endDate) {
              const diffTime = new Date(orderData.endDate).getTime() - new Date(orderData.startDate).getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 7 || Math.abs(diffDays - 7) < 2) {
                setTiffinPlan("weekly");
              } else if (diffDays === 30 || Math.abs(diffDays - 30) < 5) {
                setTiffinPlan("monthly");
              } else {
                setTiffinPlan("monthly"); // default
              }
            }
            // Price
            if (orderData.price) {
              setCurrentPlanPrice(orderData.price);
            }
            // Delivery instructions (if available in order, otherwise empty)
            if (orderData.deliveryInstructions) {
              setDeliveryInstructions(orderData.deliveryInstructions);
            }
          } else {
            // Fallback: Use params if fetch fails (normalize full to short)
            console.warn("Order fetch failed, using params fallback");
            setSelectedfood(normalizeFoodType(params.foodType as string || "Both Veg & Non-Veg"));
            if (params.checkInDate) setDate(new Date(params.checkInDate as string));
            if (params.checkOutDate) setEndDate(new Date(params.checkOutDate as string));
          }
        } catch (error) {
          console.error("Error fetching tiffin order details:", error);
          // Fallback to params on error
          setSelectedfood(normalizeFoodType(params.foodType as string || "Both Veg & Non-Veg"));
        }
      } else {
        // No orderId: Pure fallback to params
        setSelectedfood(normalizeFoodType(params.foodType as string || "Both Veg & Non-Veg"));
      }
    };
    fetchTiffinOrderDetails();
  }, [serviceType, token, orderId, params.foodType, params.checkInDate, params.checkOutDate]);
  // Match and set selected meal package once order and service are loaded
  useEffect(() => {
    if (tiffinOrder && tiffinService && mealPackages.length > 0) {
      const orderPlanType = tiffinOrder.planType || (params.plan as string) || ""; // Fallback to params
      // IMPROVED: Exact match first, then partial
      let matchingPkg = mealPackages.find(pkg =>
        pkg.planType.toLowerCase() === orderPlanType.toLowerCase() // Exact
      );
      if (!matchingPkg) {
        matchingPkg = mealPackages.find(pkg =>
          pkg.planType.toLowerCase().includes(orderPlanType.toLowerCase()) ||
          orderPlanType.toLowerCase().includes(pkg.planType.toLowerCase())
        );
      }
      if (matchingPkg) {
        setSelectedMealPackage(matchingPkg.id);
        setSelectedPlanType(matchingPkg.planType);
        console.log(`Matched package for planType "${orderPlanType}":`, matchingPkg.planType);
      } else {
        console.warn(`No matching package for order/params planType: "${orderPlanType}"`);
        // Fallback: Use params.plan if available
        const paramMatching = mealPackages.find(pkg =>
          pkg.planType.toLowerCase().includes((params.plan as string || '').toLowerCase())
        );
        if (paramMatching) setSelectedMealPackage(paramMatching.id);
        if (paramMatching) setSelectedPlanType(paramMatching.planType);
      }
    }
  }, [tiffinOrder, tiffinService, mealPackages, params.plan]);
  // Fallback: Set dates from params if no order fetched
  useEffect(() => {
    if (checkInDateParam && serviceType === 'tiffin' && !date) {
      setDate(new Date(checkInDateParam));
    }
    if (checkOutDateParam && serviceType === 'tiffin' && !endDate) {
      setEndDate(new Date(checkOutDateParam));
    }
  }, [checkInDateParam, checkOutDateParam, serviceType, date, endDate]);
  // Handle room selection from modal (for continue mode) - Set full updated selection to support add/remove
  const handleRoomSelection = (data: ContinueRoomSelectionData) => {
    const updatedSelected = data.roomsData.flatMap((room) =>
      room.beds.map((bed) => ({
        roomNumber: room.roomNumber.toString(),
        bedNumber: Number(bed.bedNumber),
        roomId: room.roomId,
        bedId: bed.bedId,
        name: bed.name || '',
      }))
    );
    // Set first bed name if not set
    if (updatedSelected.length > 0 && (!updatedSelected[0].name || updatedSelected[0].name.trim() === '')) {
      updatedSelected[0].name = fullName || userData?.name || bookingData?.fullName || '';
    }
    setSelectedRooms(updatedSelected); // Set full updated list (supports deselection/removal)
    console.log("Updated selected rooms from modal:", updatedSelected); // Debug
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
    console.log(
      "🔍 Current States - checkInDate:", checkInDate,
      "checkOutDate:", checkOutDate,
      "token:", !!token,
      "orderId:", orderId,
      "selectedRooms.length:", selectedRooms.length
    );
    if (serviceType === "tiffin") {
      console.log("🍱 Entering Tiffin branch.");
      // Tiffin validations
      if (!date) {
        setErrorMessage("Please select a start date.");
        setShowErrorModal(true);
        return;
      }
      if (!tiffinPlan) {
        setErrorMessage("Please select a subscription type.");
        setShowErrorModal(true);
        return;
      }
      if (selectedMealPackage === 0) {
        setErrorMessage("Please select a meal package.");
        setShowErrorModal(true);
        return;
      }
      const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
      if (hasPeriodic && !endDate) {
        setErrorMessage("Please select an end date.");
        setShowErrorModal(true);
        return;
      }
      if (currentPlanPrice === 0) {
        setErrorMessage("No pricing available for this selection. Please try different options.");
        setShowErrorModal(true);
        return;
      }
      if (!token) {
        setErrorMessage("Authentication required.");
        setShowErrorModal(true);
        return;
      }
      if (!effectiveServiceId && !orderId) {
        setErrorMessage("Service ID or Order ID not available.");
        setShowErrorModal(true);
        return;
      }
      // Build payload
      const selectedMeals = Object.entries(tiffinMeals)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
      const planTypeStr = selectedPlanType || selectedMeals.join(" & ");
      // Prefer existing order's foodType for updates (server expects stored enum)
      let foodTypeStr = "";
      if (tiffinOrder && tiffinOrder.foodType) {
        foodTypeStr = tiffinOrder.foodType;
      } else {
        if (selectedfood === "Veg") foodTypeStr = "Veg";
        else if (selectedfood === "Non-Veg") foodTypeStr = "Non-veg";
        else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";
        else foodTypeStr = selectedfood;
      }
      const chooseOrderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);
      const dateStr = date.toISOString().split("T")[0];
      const endDateStr = endDate ? endDate.toISOString().split("T")[0] : dateStr;
      const payload: any = {
        deliveryInstructions: deliveryInstructions || "",
        chooseOrderType: chooseOrderTypeStr,
        planType: planTypeStr,
        subscribtionType: { // FIXED: Match booking's typo 'subscribtionType'
          subscribtion: tiffinPlan,
          price: currentPlanPrice,
        },
        date: dateStr,
        endDate: endDateStr,
        ...(orderId && { remarks: "Continue Subscription" }),
      };
      // Include foodType and basic guest info to match BookingScreen payload shape
      payload.foodType = foodTypeStr;
      // Prefer params -> userData -> tiffinOrder -> bookingData for personal info
      const pFullName = (params.fullName as string) || userData?.name || tiffinOrder?.fullName || bookingData?.fullName;
      const pPhone = (params.phoneNumber as string) || userData?.phoneNumber || tiffinOrder?.phoneNumber || bookingData?.phoneNumber;
      const pAddress = tiffinOrder?.address || bookingData?.address || undefined;
      if (pFullName) payload.fullName = pFullName;
      if (pPhone) payload.phoneNumber = pPhone;
      if (pAddress) payload.address = pAddress;
      console.log("📤 Tiffin Subscription API Payload:", payload);
      // Determine URL based on whether it's create or update
      const tiffinUrl = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/tiffinSubscription/${orderId}`;
      console.log("🌐 Tiffin API URL:", tiffinUrl);
      try {
        console.log("🚀 Making Tiffin Subscription API call...");
        const response = await axios.post(
          tiffinUrl,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("📥 Tiffin API Response:", response.data);
        if (response.data.success) {
          const newBookingData = response.data.data;
          console.log("✅ Tiffin subscription success:", newBookingData);
          router.push({
            pathname: "/(secure)/check-out",
            params: {
              bookingId: newBookingData._id,
              serviceType: "tiffin",
              serviceId: newBookingData.tiffinServiceId || params.tiffinServiceId,
            },
          });
          console.log("✅ Navigation to checkout complete!");
        } else {
          console.log("❌ API success false:", response.data.message);
          setErrorMessage(response.data.message || "Failed to create tiffin subscription.");
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error("❌ Tiffin Subscription API Error:", error);
        let errMsg = "An unexpected error occurred.";
        if (axios.isAxiosError(error)) {
          console.log(" - Response status:", error.response?.status);
          console.log(" - Response data:", error.response?.data);
          errMsg = error.response?.data?.message || "Network error occurred.";
        }
        setErrorMessage(errMsg);
        setShowErrorModal(true);
      }
      return;
    }
    // 🏠 HOSTEL SECTION
    console.log("🏠 Entering Hostel branch.");
    if (!checkInDate || !checkOutDate || !token || !orderId) {
      console.log("❌ Validation failed: Missing required info.");
      setErrorMessage("Missing required information. Please fill all fields.");
      setShowErrorModal(true);
      return;
    }
    if (selectedRooms.length === 0) {
      console.log("❌ No rooms selected.");
      setErrorMessage("Please select at least one room and bed.");
      setShowErrorModal(true);
      return;
    }
    console.log("✅ Validation passed and rooms selected.");
    // Build existing beds map
    const existingBeds = new Map();
    let sourceRoomsForExisting = [];
    if (fullBooking?.rooms?.length) {
      sourceRoomsForExisting = fullBooking.rooms;
      console.log("✅ Using rooms from fullBooking");
    } else if (bookingData?.rooms?.length) {
      sourceRoomsForExisting = bookingData.rooms;
      console.log("✅ Using rooms from bookingData");
    } else if (Array.isArray(parsedRoomsState)) {
      sourceRoomsForExisting = parsedRoomsState;
      console.log("✅ Using rooms from parsedRoomsState");
    } else {
      console.log("⚠️ No valid room source found for existing beds");
    }
    sourceRoomsForExisting.forEach((room) => {
      const beds = getBedsArray(room);
      beds.forEach((bed) => {
        const roomId = room.roomId || room._id || room.room_id;
        const bedId = bed?.bedId || bed?._id || bed?.bed_id;
        const bedNumber = bed?.bedNumber || bed?.bedNum || bed || 0;
        const key = getBedKey(roomId, bedId, bedNumber);
        existingBeds.set(key, {
          roomId,
          roomNumber: room.roomNumber || room.roomNum || room.room_number,
          bedId,
          bedNumber,
          name: bed?.name || "",
        });
      });
    });
    console.log("🗺️ Existing Beds Map:", Array.from(existingBeds.values()));
    // New selections
    const newBedsSet = new Set(
      selectedRooms.map((r) => getBedKey(r.roomId, r.bedId, r.bedNumber))
    );
    // ➕ Add Beds
    const addBeds = selectedRooms
      .filter((r) => !existingBeds.has(getBedKey(r.roomId, r.bedId, r.bedNumber)))
      .map((r) => ({
        bedId: r.bedId,
        bedNumber: r.bedNumber,
        name: r.name || "",
        roomId: r.roomId,
        roomNumber: r.roomNumber,
      }));
    // ➖ Remove Beds
    const removeBeds = Array.from(existingBeds.values()).filter(
      (b) => !newBedsSet.has(getBedKey(b.roomId, b.bedId, b.bedNumber))
    );
    console.log("➕ Add Beds:", addBeds);
    console.log("➖ Remove Beds:", removeBeds);
    // Group into rooms helper
    const groupByRoom = (bedsArray) => {
      const map = new Map();
      bedsArray.forEach((bed) => {
        if (!map.has(bed.roomId)) {
          map.set(bed.roomId, {
            roomId: bed.roomId,
            roomNumber: bed.roomNumber,
            bedNumber: [],
          });
        }
        const room = map.get(bed.roomId);
        room.bedNumber.push({
          bedId: bed.bedId,
          bedNumber: bed.bedNumber,
          name: bed.name,
        });
      });
      return Array.from(map.values());
    };
    // ✅ Build grouped data from selected and removed beds
    const addRooms = groupByRoom(selectedRooms); // 👈 fixed here
    const removeRooms = groupByRoom(removeBeds);
    // 🧾 Final Request Body (no mergedRooms now)
    const requestBody = {
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      addRooms, // current final selection (includes old + new, excluding removed)
    };
    if (removeRooms.length > 0) requestBody.removeRooms = removeRooms;
    console.log("📤 Final Continue Subscription API Body:", requestBody);
    console.log("🆔 Order ID being passed to API:", orderId);
    console.log(
      "🌐 Continue Subscription API URL:",
      `https://tifstay-project-be.onrender.com/api/guest/hostelServices/continueSubscription/${orderId}`
    );
    try {
      console.log("🚀 Making API call...");
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
  const checkoutParams = {
    bookingId: newBookingData._id,
    serviceType: "hostel",
    rooms: JSON.stringify(selectedRooms),
    serviceId: newBookingData.hostelId,
  };
  console.log("📤 Navigating to checkout with params:", checkoutParams);
  router.push({
    pathname: "/(secure)/check-out",
    params: checkoutParams,
  });
  console.log("✅ Navigation to checkout complete!");
}else {
        console.log("❌ API success false:", response.data.message);
        setErrorMessage(response.data.message || "Failed to continue subscription.");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("❌ Continue Subscription API Error:", error);
      let errMsg = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        console.log(" - Response status:", error.response?.status);
        console.log(" - Response data:", error.response?.data);
        errMsg = error.response?.data?.message || "Network error occurred.";
      }
      setErrorMessage(errMsg);
      setShowErrorModal(true);
    }
  };
  // Tiffin helpers (restored from BookingScreen)
  const getMealsFromPlanType = (planType: string): Record<MealType, boolean> => {
    const lower = planType.toLowerCase();
    const meals: Record<MealType, boolean> = {
      breakfast: false,
      lunch: false,
      dinner: false,
    };
    if (lower.includes("breakfast")) meals.breakfast = true;
    if (lower.includes("lunch")) meals.lunch = true;
    if (lower.includes("dinner")) meals.dinner = true;
    return meals;
  };
  const getLabel = (planType: string): string => {
    const lower = planType.toLowerCase();
    const mealParts: string[] = [];
    if (lower.includes("breakfast")) mealParts.push("Breakfast");
    if (lower.includes("lunch")) mealParts.push("Lunch");
    if (lower.includes("dinner")) mealParts.push("Dinner");
    // Format: single -> "Breakfast", two -> "Breakfast & Lunch", three -> "Breakfast, Lunch & Dinner"
    if (mealParts.length === 0) return "";
    if (mealParts.length === 1) return mealParts[0];
    if (mealParts.length === 2) return `${mealParts[0]} & ${mealParts[1]}`;
    return `${mealParts[0]}, ${mealParts[1]} & ${mealParts[2]}`;
  };
  const mealPackages: MealPackage[] = useMemo(() => {
    console.log('------->', tiffinService);
    if (!tiffinService?.pricing) return [];
    return tiffinService.pricing.map((p: any, index: number) => ({
      id: index + 1,
      label: getLabel(p.planType),
      meals: getMealsFromPlanType(p.planType),
      foodType: p.foodType,
      planType: p.planType,
    }));
  }, [tiffinService]);
  const getAvailableFoodOptions = (foodType: string) => {
    if (foodType === "Both Veg & Non-Veg") {
      return [
        { label: "Veg", value: "Veg" },
        { label: "Non-Veg", value: "Non-Veg" },
        { label: "Both Veg & Non-Veg", value: "Both" },
      ];
    } else if (foodType === "Veg") {
      return [{ label: "Veg", value: "Veg" }];
    } else if (foodType === "Non-Veg") {
      return [{ label: "Non-Veg", value: "Non-Veg" }];
    }
    return [];
  };
  const currentFoodOptions = useMemo(() => {
    if (selectedMealPackage === 0 || !tiffinService) {
      return [
        { label: "Veg", value: "Veg" },
        { label: "Non-Veg", value: "Non-Veg" },
        { label: "Both Veg & Non-Veg", value: "Both" },
      ];
    }
    const selectedPkg = mealPackages.find((p) => p.id === selectedMealPackage);
    if (!selectedPkg) return [];
    return getAvailableFoodOptions(selectedPkg.foodType);
  }, [selectedMealPackage, mealPackages, tiffinService]);
  const orderTypeOptions = useMemo(() => {
    return (
      tiffinService?.orderTypes?.map((type: string) => ({
        label: type,
        value: type.toLowerCase().replace(" ", ""),
      })) || []
    );
  }, [tiffinService]);
  // Auto-set meal preferences based on selected package
  useEffect(() => {
    if (selectedMealPackage > 0) {
      const selectedPkg = mealPackages.find((p) => p.id === selectedMealPackage);
      if (selectedPkg) {
        setTiffinMeals(selectedPkg.meals);
        const selectedMeals = Object.entries(selectedPkg.meals)
          .filter(([_, checked]) => checked)
          .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
        setSelectedMealsSummary(selectedMeals.join(", "));
      }
    }
  }, [selectedMealPackage, mealPackages]);
  // Auto-fill end date based on start date and plan type
  useEffect(() => {
    if (date && ["weekly", "monthly"].includes(tiffinPlan)) {
      let daysToAdd = 0;
      if (tiffinPlan === "weekly") {
        daysToAdd = 7;
      } else if (tiffinPlan === "monthly") {
        daysToAdd = 30;
      }
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
    } else if (!["weekly", "monthly"].includes(tiffinPlan)) {
      setEndDate(null);
    }
  }, [date, tiffinPlan]);
  // Update price based on selections
  useEffect(() => {
    let newPrice = 0;
    if (tiffinPlan) {
      let basePrice = 0;
      const pricingKey = tiffinPlan as keyof typeof fetchedPricing;
      if (fetchedPricing && fetchedPricing[pricingKey] > 0) {
        basePrice = fetchedPricing[pricingKey];
      } else {
        if (tiffinPlan === "weekly") {
          basePrice = 800;
        } else if (tiffinPlan === "monthly") {
          basePrice = 3200;
        }
      }
      newPrice = basePrice;
    }
    setCurrentPlanPrice(newPrice);
  }, [tiffinPlan, fetchedPricing]);
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
  const handleGetPlanDetails = async () => {
    const selectedMeals = Object.entries(tiffinMeals)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    const planTypeStr = selectedPlanType || selectedMeals.join(" & ");
    if (planTypeStr === "") {
      setPlanError("Please select a meal package.");
      return;
    }
    if (!tiffinPlan) {
      setPlanError("Please select subscription type.");
      return;
    }
    // FIXED: Map short selectedfood to full for getPlanDetails (matches booking)
    const foodTypeStr = getFullFoodType(selectedfood);
    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);
    const planStr = tiffinPlan;
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setPlanError("Authentication required.");
      return;
    }
    if (!effectiveServiceId) {
      setPlanError("Service ID not available.");
      return;
    }
    setIsFetchingDetails(true);
    setPlanError("");
    try {
      const queryParams = new URLSearchParams({
        foodType: foodTypeStr, // Full
        orderType: orderTypeStr,
        planType: planTypeStr,
        plan: planStr,
      });
      const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${effectiveServiceId}?${queryParams.toString()}`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const data = response.data.data;
        if (data.price > 0) {
          const newPricing = {
            ...fetchedPricing,
            [planStr]: data.price,
            offers: data.offers || "",
          };
          setFetchedPricing(newPricing);
          setPlanError("");
        } else {
          setPlanError("No pricing available for this selection.");
        }
      } else {
        setPlanError("Failed to fetch plan details: " + response.data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `❌ Error: Status ${error.response?.status}, Data:`,
          error.response?.data
        );
        setPlanError(
          "Failed to fetch plan details: " +
          (error.response?.data?.message || "Network error")
        );
      } else {
        console.error(`❌ Non-Axios error:`, error);
        setPlanError("Failed to fetch plan details.");
      }
    } finally {
      setIsFetchingDetails(false);
    }
  };
  // Auto-fetch plan details when selections change
  useEffect(() => {
    if (selectedMealPackage > 0 && selectedfood && orderType && tiffinPlan) {
      handleGetPlanDetails();
    } else {
      setFetchedPricing({ weekly: 0, monthly: 0, offers: "" });
    }
  }, [selectedMealPackage, selectedfood, orderType, tiffinPlan]);
  const getPlanOptions = () => {
    // Always present both Weekly and Monthly options (match BookingScreen)
    return [
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
    ];
  };
  // Helper to format date safely
  const formatDate = (d: Date | null): string => {
    if (!d || isNaN(d.getTime())) return "dd/mm/yyyy";
    return d.toLocaleDateString("en-GB");
  };
  const renderTiffinForm = () => {
    const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={18} color="#000" />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Booking Details</Text>
          </View>
          {/* Food Type */}
          <Text style={styles.subSectionTitle}>Food Type</Text>
          {currentFoodOptions.map((opt) => (
            <RadioButton
              key={opt.value}
              label={opt.label}
              value={opt.value}
              selected={selectedfood}
              onPress={setSelectedfood}
            />
          ))}
          {/* Choose Order Type */}
          <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
            Choose Order Type
          </Text>
          {orderTypeOptions.map((opt) => (
            <RadioButton
              key={opt.value}
              label={opt.label}
              value={opt.value}
              selected={orderType}
              onPress={(value) => setOrderType(value as "dining" | "delivery")}
            />
          ))}
          {/* Select Meal Package */}
          <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
            Select Meal Package *
          </Text>
          {mealPackages.map((pkg) => (
            <RadioButton
              key={pkg.id}
              label={pkg.label}
              value={pkg.id.toString()}
              selected={selectedMealPackage.toString()}
              onPress={(value) => {
                const id = parseInt(value);
                setSelectedMealPackage(id);
                const selectedPkg = mealPackages.find((p) => p.id === id);
                if (selectedPkg) {
                  setTiffinMeals(selectedPkg.meals);
                  setSelectedPlanType(selectedPkg.planType);
                  const availableValues = getAvailableFoodOptions(
                    selectedPkg.foodType
                  ).map((o) => o.value);
                  if (!availableValues.includes(selectedfood)) {
                    setSelectedfood(availableValues[0] || "Both");
                  }
                }
              }}
            />
          ))}
          {/* Subscription Type */}
          <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
            Subscription Type *
          </Text>
          {getPlanOptions().map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              selected={tiffinPlan}
              onPress={setTiffinPlan}
            />
          ))}
          {/* Price */}
          {selectedMealPackage > 0 && tiffinPlan ? (
            <View style={styles.priceContainer}>
              {isFetchingDetails ? (
                <ActivityIndicator color="#004AAD" />
              ) : currentPlanPrice > 0 ? (
                <>
                  <Text style={styles.priceText}>
                    ₹{currentPlanPrice} / {tiffinPlan}
                  </Text>
                  {fetchedPricing.offers && (
                    <Text style={styles.offersText}>
                      {fetchedPricing.offers}
                    </Text>
                  )}
                </>
              ) : (
                planError && <Text style={styles.errorText}>{planError}</Text>
              )}
            </View>
          ) : null}
          {/* Select Start Date */}
          <Text style={styles.label}>Select Start Date *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {formatDate(date)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
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
          {/* End Date if periodic */}
          {hasPeriodic && (
            <>
              <Text style={styles.label}>Select End Date *</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.disabledDateButton]}
                pointerEvents="none"
              >
                <Text style={[styles.datePickerText, { color: "#999" }]}>
                  {formatDate(endDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#999" />
              </TouchableOpacity>
            </>
          )}
          {/* New: Delivery Instructions */}
          <Text style={[styles.label, { marginTop: 15 }]}>
            Delivery Instructions (Optional)
          </Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Enter any special instructions (e.g., Call before delivery)"
            multiline
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
          />
        </View>
        {/*
      <View style={styles.summarySection}>
        <Text style={styles.serviceName}>
          {serviceName || "Maharashtrian Ghar Ka Khana"}
        </Text>
        <Text style={styles.priceText}>Price: ₹120/meal</Text>
      </View> */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Booking Request</Text>
        </TouchableOpacity>
        {/* <Text style={styles.confirmationText}>
        Provider will reach out within 1 hour to confirm.
      </Text> */}
      </ScrollView>
    );
  };
  const updateBedName = (index: number, newName: string) => {
    if (index === 0) return; // First bed name cannot be changed
    setSelectedRooms(prev => prev.map((room, i) => i === index ? { ...room, name: newName } : room));
  };
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
              ? `${existingSelectPlan.name.charAt(0).toUpperCase() + existingSelectPlan.name.slice(1)} Plan`
              : `${hostelPlan.charAt(0).toUpperCase() + hostelPlan.slice(1)} Plan`
            }
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="calendar-outline" size={18} color="#000" />
          <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Booking Details</Text>
        </View>
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
          style={[styles.datePickerButton, styles.disabledDateButton]}
          pointerEvents="none"
        >
          <Text style={[styles.datePickerText, { color: "#999" }]}>
            {checkOutDate ? checkOutDate.toLocaleDateString("en-GB") : "dd/mm/yyyy"}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#999" />
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
            <Text style={styles.subSectionTitle}>Selected Beds ({selectedRooms.length})</Text>
            {selectedRooms.map((room, index) => (
              <View key={index} style={styles.selectedRoomItem}>
                <View style={styles.roomBedRow}>
                  <Ionicons name="bed-outline" size={16} color="#666" />
                  <Text style={styles.selectedRoomText}>
                    Room {room.roomNumber} - Bed {room.bedNumber}
                  </Text>
                </View>
                {index === 0 ? (
                  <Text style={[styles.nameInput, styles.primaryGuestName]}>
                    {room.name || fullName || userData?.name || bookingData?.fullName || 'User'}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Guest Name *"
                    value={room.name || ''}
                    onChangeText={(text) => updateBedName(index, text)}
                  />
                )}
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
      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.submitButton, styles.closeButton]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.submitButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  disabledDateButton: {
    opacity: 0.5,
    backgroundColor: '#f9fafb',
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
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedRoomItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomBedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedRoomText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginLeft: 8,
  },
  nameInput: {
    borderWidth: 0,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f9fafb",
  },
  primaryGuestName: {
    fontWeight: "600",
    color: "#000",
  },
  // Error Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    width: "100%",
  },
});