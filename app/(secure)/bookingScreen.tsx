/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";
import axios from "axios";
import { BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { theme } from "@/constants/utils";
type MealType = "breakfast" | "lunch" | "dinner";
type BookingType = "tiffin" | "hostel";
type RoomData = {
  roomId: string;
  roomNumber: string | number;
  beds: Array<{ bedId: string; bedNumber: string | number }>;
};
type MealPackage = {
  id: number;
  label: string;
  meals: Record<MealType, boolean>;
  foodType: string;
  planType: string;
};
export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId || ''; // NEW: Extract bookingId for edit mode
  const tiffinServiceId = params.tiffinServiceId || '';
  const isEditMode = params.isEdit === 'true' && !!bookingId; // FIXED: Use params.isEdit and bookingId
  // FIXED: Handle bookingType for edit mode (assume hostel edit)
  let effectiveBookingType: BookingType;
  if (isEditMode) {
    effectiveBookingType = tiffinServiceId ? "tiffin" : "hostel";
  } else {
    effectiveBookingType = (params.bookingType as BookingType) || "tiffin";
  }
  const bookingType = effectiveBookingType;
  // Extract primitive strings for stable dependencies
  const serviceDataStr = params.serviceData || "{}"; // For tiffin
  const hostelDataStr = params.hostelData || "{}";
  const roomDataStr = params.roomData || "{}";
  const roomsDataStr = params.roomsData || "[]"; // NEW: For multiple rooms
  const bedNamesStr = params.bedNames || "{}"; // Add this line
  const userDataStr = params.userData || "{}";
  const planStr = params.plan || "{}";
  const selectedBedsStr = params.selectedBeds || "[]";
  const checkInDateStr = params.checkInDate || "";
  const checkOutDateStr = params.checkOutDate || "";
  const defaultDateStr = params.date || ""; // For tiffin default date
  const defaultPlanStr = params.defaultPlan || "perMeal"; // e.g., 'monthly', 'weekly', 'perMeal'
  const [serviceData, setServiceData] = useState({
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    price: params.price,
    foodType: params.foodType,
    mealPreferences: params.mealPreferences,
    orderTypes: params.orderTypes,
    pricing: params.pricing,
    location: params.location,
    contactInfo: params.contactInfo,
    hostelId: params.hostelId,
    hostelName: params.hostelName,
    monthlyPrice: params.monthlyPrice,
    deposit: params.deposit,
    // NEW: Use rooms array instead of single roomId/roomNumber/beds
    rooms: [] as RoomData[],
    defaultPlan: params.defaultPlan,
    defaultPrice: params.defaultPrice,
    defaultDeposit: params.defaultDeposit,
    email: params.email,
    workType: params.workType,
    adharCardPhoto: params.adharCardPhoto,
    userPhoto: params.userPhoto,
  });
  // NEW: State for bed names (keyed by `${roomId}-${bedId}`)
  const [bedNames, setBedNames] = useState<Record<string, string>>({});
  // Error states for better UX
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Tiffin plan errors (now single)
  const [planError, setPlanError] = useState("");
  // New states for dynamic pricing
  const [pricingData, setPricingData] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [weeklyDeposit, setWeeklyDeposit] = useState(0);
  const [dailyDeposit, setDailyDeposit] = useState(0);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [currentDeposit, setCurrentDeposit] = useState(0);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  // FIXED: Set default picker items for hostel to ensure plans show (all options)
  const [pickerItems, setPickerItems] = useState([
    { label: "Per Day", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ]);
  // Tiffin-specific states
  // FIXED: Fixed to single tiffin
  const [mealLabels, setMealLabels] = useState<Record<MealType, string>>({});
  // NEW: Single fetched pricing
  const [fetchedPricing, setFetchedPricing] = useState({
    perDay: 0,
    weekly: 0,
    monthly: 0,
    offers: "",
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [tiffinService, setTiffinService] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [locality, setLocality] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedfood, setSelectedfood] = useState("");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<
    "work" | "leisure" | "student"
  >("work");
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");
  const [isLoadingHostel, setIsLoadingHostel] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const ranAutofill = useRef(false);
  const [expandedTiffin, setExpandedTiffin] = useState<number | null>(bookingType === "hostel" || bookingType === "reserve" ? 0 : null);
  // NEW: Single tiffin meal preferences
  const [tiffinMeals, setTiffinMeals] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  // NEW: Single tiffin plan type
  const [tiffinPlan, setTiffinPlan] = useState("");
  // FIXED: NEW: Exact planType from selected package (to match API exactly)
  const [selectedPlanType, setSelectedPlanType] = useState(""); // e.g., "Lunch & dinner"
  // NEW: Meal package selection
  const [selectedMealPackage, setSelectedMealPackage] = useState<number>(0);
  // Refs for auto-scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);
  // Tiffin refs
  const streetRef = useRef<TextInput>(null);
  const localityRef = useRef<TextInput>(null);
  const pincodeRef = useRef<TextInput>(null);
  const datePickerRef = useRef<TouchableOpacity>(null);
  const endDateDisplayRef = useRef<View>(null);
  const foodTypeSectionRef = useRef<View>(null);
  const mealPackageSectionRef = useRef<View>(null);
  const subscriptionTypeSectionRef = useRef<View>(null);
  // Hostel refs
  const checkInDateRef = useRef<TouchableOpacity>(null);
  const checkOutDateRef = useRef<View>(null);
  const aadhaarSectionRef = useRef<View>(null);
  const userSectionRef = useRef<View>(null);
  const bedSectionRef = useRef<View>(null);
  const bedNameRefs = useRef<Record<string, TextInput>>({});
  // NEW: Function to fetch existing booking details for edit mode
  const fetchExistingBooking = async () => {
    if (!bookingId) return;
    console.log("Attempting to fetch booking for ID:", bookingId); // DEBUG: Add this
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("No token for fetching booking");
        return;
      }
      const response = await axios.get(
        `${BASE_URL}/api/guest/hostelServices/getDummyHostelBookingById/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Booking API response:", response.data); // DEBUG: Add this
      if (response.data.success) {
        const data = response.data.data;
        console.log("Fetched booking details:", data);
        // Prefill user details
        setFullName(data.fullName || "");
        setPhoneNumber((data.phoneNumber || "").replace(/^\+91\s*/, ""));
        setServiceData((prev) => ({ ...prev, email: data.email || prev.email }));
        // Prefill dates
        if (data.checkInDate) setCheckInDate(new Date(data.checkInDate));
        if (data.checkOutDate) setCheckOutDate(new Date(data.checkOutDate));
        // Prefill purpose type
        const workTypeNormalized = (data.workType || "work").toLowerCase();
        let purpose = "work";
        if (workTypeNormalized.includes("student")) purpose = "student";
        else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
        setPurposeType(purpose as any);
        // Prefill photos (URLs)
        setAadhaarPhoto(data.addharCardPhoto || "");
        setUserPhoto(data.userPhoto || "");
        // Prefill rooms and bed names
        let rooms: RoomData[] = [];
        const parsedRoomsFromParams = safeParse(roomsDataStr);
        if (Array.isArray(parsedRoomsFromParams) && parsedRoomsFromParams.length > 0) {
          rooms = parsedRoomsFromParams; // Prioritize updated from modal
        } else {
          rooms = data.rooms?.map((r: any) => ({
            roomId: r.roomId,
            roomNumber: r.roomNumber,
            beds: r.bedNumber?.map((b: any) => ({ bedId: b.bedId, bedNumber: b.bedNumber })) || [],
          })) || [];
        }
        setServiceData((prev) => ({ ...prev, rooms }));
        // For bed names
        let newBedNames: Record<string, string> = safeParse(bedNamesStr);
        if (Object.keys(newBedNames).length === 0) {
          // Fallback to API only if no params
          data.rooms?.forEach((r: any) => {
            r.bedNumber?.forEach((b: any) => {
              const key = getBedKey(r.roomId, b.bedId);
              newBedNames[key] = b.name || "";
            });
          });
        }
        setBedNames(newBedNames);
        // if (serviceData.rooms.length > 0 && serviceData.rooms[0].beds.length > 0) {
        //   const firstRoom = serviceData.rooms[0];
        //   const firstBed = firstRoom.beds[0];
        //   const firstKey = getBedKey(firstRoom.roomId, firstBed.bedId);
        //   const firstGuestName = newBedNames[firstKey] || data.fullName || "";
        //   setFullName(firstGuestName);
        // }
        // After setBedNames(newBedNames);
        if (Object.keys(newBedNames).length > 0) {
          const firstKey = Object.keys(newBedNames)[0];
          setFullName(newBedNames[firstKey] || data.fullName || "");
        }
        // Prefill hostel plan and pricing
        if (data.selectPlan && data.selectPlan.length > 0) {
          const plan = data.selectPlan[0];
          const planName = plan.name === "perDay" ? "daily" : plan.name;
          setHostelPlan(planName);
          setCurrentPlanPrice(plan.price || 0);
          setCurrentDeposit(plan.depositAmount || 0);
          // Update pricingData for consistency
          setPricingData((prev) => ({
            ...prev,
            [planName]: plan.price || 0,
          }));
        }
        // Update serviceData with hostel details if needed
        setServiceData((prev) => ({
          ...prev,
          hostelId: params.hostelId || data.hostelId?._id || prev.hostelId,
          hostelName: data.hostelId?.hostelName || prev.hostelName,
          monthlyPrice: data.selectPlan?.[0]?.price || prev.monthlyPrice,
          deposit: data.selectPlan?.[0]?.depositAmount || prev.deposit,
        }));
        // Prefill message/special instructions if available
        setMessage(data.remark || data.Remark || ""); // Assuming Remark field
      } else {
        console.error("Failed to fetch booking:", response.data.message);
        // FALLBACK: Use params for dates and other fields if API fails in edit mode
        if (isEditMode) {
          console.log("API fetch failed in edit mode - falling back to params for dates");
          if (checkInDateStr) setCheckInDate(new Date(checkInDateStr));
          if (checkOutDateStr) setCheckOutDate(new Date(checkOutDateStr));
          // Also ensure plan and rooms from params (already done in handleParamsAutofill)
        }
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      // FALLBACK: Use params for dates if error in edit mode
      if (isEditMode) {
        console.log("Fetch error in edit mode - falling back to params for dates");
        if (checkInDateStr) setCheckInDate(new Date(checkInDateStr));
        if (checkOutDateStr) setCheckOutDate(new Date(checkOutDateStr));
      }
    }
  };
  // NEW: Function to fetch existing tiffin booking details for edit mode
  // NEW: Function to fetch existing tiffin booking details for edit mode
  const fetchExistingTiffinBooking = async () => {
    if (!bookingId || !tiffinServiceId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${BASE_URL}/api/guest/tiffinServices/getdummybookingById/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const data = response.data.data;
        console.log("Prefilling from existing tiffin booking:", data);

        // Name & Phone
        setFullName(data.fullName || "");
        setPhoneNumber((data.phoneNumber || "").replace(/^\+91\s*/, ""));

        // Address
        if (data.address) {
          setStreet(data.address.street || "");
          setPincode(data.address.pinCode?.toString() || "");

          // Extract locality (e.g., "Kanpur")
          let localityValue = "";
          const fullAddr = data.address.fullAddress || "";
          if (fullAddr) {
            // Remove street (plus code), pincode, dashes
            let cleaned = fullAddr
              .replace(data.address.street || "", "")
              .replace(/-\s*\d{6}/, "")
              .replace(/\d{6}/, "")
              .replace(/,/g, " ")
              .trim();

            // Remove plus code if still there
            cleaned = cleaned.replace(/^[A-Za-z0-9+]+\s*/, "").trim();

            localityValue = cleaned || "Kanpur"; // fallback if needed
          }
          setLocality(localityValue);
        }

        // Dates
        if (data.date) {
          const startDate = new Date(data.date);
          startDate.setHours(12, 0, 0, 0); // avoid timezone shift
          setDate(startDate);
        }
        if (data.endDate) {
          const endDateVal = new Date(data.endDate);
          endDateVal.setHours(12, 0, 0, 0);
          setEndDate(endDateVal);
        }

        // Food Type
        if (data.foodType) {
          let foodVal = "Veg";
          if (data.foodType === "Non-veg" || data.foodType === "Non-Veg") foodVal = "Non-Veg";
          else if (data.foodType.includes("Both")) foodVal = "Both";
          setSelectedfood(foodVal);
        }

        // Order Type
        if (data.chooseOrderType) {
          const orderVal = data.chooseOrderType.toLowerCase() === "dining" ? "dining" : "delivery";
          setOrderType(orderVal);
        }

        // Subscription Type
        if (data.subscribtionType?.subscribtion) {
          setTiffinPlan(data.subscribtionType.subscribtion); // "weekly"
        }

        // Plan Type (Meal Package) – store for later matching
        if (data.planType) {
          setSelectedPlanType(data.planType); // "Breakfast & dinner"
        }

        // Instructions
        setSpecialInstructions(data.deliveryInstructions || "");
      }
    } catch (error) {
      console.error("Error fetching existing tiffin booking:", error);
    }
  };
  const getMealsFromPlanType = (
    planType: string
  ): Record<MealType, boolean> => {
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
    return mealParts.join(", ");
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
    if (!tiffinService) return [];
    let effectiveFoodType: string;
    if (selectedMealPackage === 0) {
      effectiveFoodType = tiffinService.foodType;
    } else {
      const selectedPkg = mealPackages.find((p) => p.id === selectedMealPackage);
      if (!selectedPkg) return [];
      effectiveFoodType = selectedPkg.foodType;
    }
    return getAvailableFoodOptions(effectiveFoodType);
  }, [selectedMealPackage, mealPackages, tiffinService]);
  const orderTypeOptions = useMemo(() => {
    return (
      tiffinService?.orderTypes?.map((type: string) => ({
        label: type,
        value: type.toLowerCase().replace(" ", ""),
      })) || []
    );
  }, [tiffinService]);
  // NEW: Compute total beds across all rooms
  const totalBedsCount = useMemo(
    () =>
      serviceData.rooms.reduce(
        (acc, room) => acc + (room.beds?.length || 0),
        0
      ),
    [serviceData.rooms]
  );
  // NEW: Helper to get bed key
  const getBedKey = (roomId: string, bedId: string) => `${roomId}-${bedId}`;
  // NEW: Helper to find and prefill first bed
  const prefillFirstBedName = (rooms: RoomData[], primaryName: string) => {
    if (rooms.length > 0 && rooms[0].beds.length > 0) {
      const firstBedKey = getBedKey(rooms[0].roomId, rooms[0].beds[0].bedId);
      setBedNames((prev) => ({ ...prev, [firstBedKey]: primaryName }));
      // Sync back to fullName if needed (initial set)
      setFullName(primaryName);
    }
  };
  // Helper to clear errors for a field
  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  // NEW: Helper for bed name errors (per bed key)
  const getBedNameError = (bedKey: string) => errors[bedKey] || "";
  // NEW: Helper for selected meals summary (single)
  const selectedMealsSummary = () => {
    const selectedMeals = Object.entries(tiffinMeals)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    return selectedMeals.join(", ");
  };
  // NEW: Helper to get base price for a plan
  const getBasePriceForPlan = (plan: string) => {
    const pricingKey = plan as keyof typeof fetchedPricing;
    return fetchedPricing[pricingKey] || 0;
  };
  // FIXED: Validate tiffin form (add selectedPlanType check)
  const validateTiffinForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim() || phoneNumber.length !== 10) newErrors.phoneNumber = "Enter a valid 10-digit mobile number!";
    if (orderType === "delivery") {
      if (!street.trim())
        newErrors.street = "Street address is required for delivery!";
      if (!locality.trim())
        newErrors.locality = "Locality is required for delivery!";
      if (!pincode.trim())
        newErrors.pincode = "Pincode is required for delivery!";
    }
    if (!date) newErrors.date = "Date is required!";
    const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
    if (hasPeriodic && (!endDate || endDate <= date))
      newErrors.endDate = "End date is required and must be after start date!";
    if (!selectedfood) newErrors.selectedfood = "Food Type is required!";
    if (selectedMealPackage === 0) newErrors.mealPackage = "Meal package is required!";
    if (!tiffinPlan) newErrors.tiffinPlan = "Subscription type is required!";
    if (!selectedPlanType) newErrors.selectedPlanType = "Selected meal package invalid!"; // FIXED: New check
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    const firstError = valid ? undefined : Object.keys(newErrors)[0];
    return { valid, firstError };
  };
  // UPDATED: Validate hostel form (add bed names check)
  const validateHostelForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim() || phoneNumber.length !== 10) newErrors.phoneNumber = "Enter a valid 10-digit mobile number!";
    if (!checkInDate) newErrors.checkInDate = "Check-in date is required!";
    if (!checkOutDate) newErrors.checkOutDate = "Check-out date is required!";
    if (checkInDate && checkOutDate && checkInDate >= checkOutDate)
      newErrors.checkOutDate = "Check-out date must be after Check-in date!";
    if (!aadhaarPhoto)
      newErrors.aadhaarPhoto = "Aadhaar Card Photo is required!";
    if (!userPhoto) newErrors.userPhoto = "User Photo is required!";
    // UPDATED: Validate at least one room with beds AND all bed names filled
    let missingNames: string[] = [];
    if (
      !serviceData.rooms ||
      serviceData.rooms.length === 0 ||
      !serviceData.rooms.some((r) => r.beds && r.beds.length > 0)
    ) {
      newErrors.rooms = "Please select at least one bed across rooms!";
    } else {
      // Check bed names
      const allBedKeys = serviceData.rooms.flatMap((room) =>
        room.beds.map((bed) => getBedKey(room.roomId, bed.bedId))
      );
      missingNames = allBedKeys.filter((key) => !bedNames[key]?.trim());
      if (missingNames.length > 0) {
        missingNames.forEach((key) => {
          newErrors[key] = `Name is required for this bed!`;
        });
      }
    }
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    const firstError = valid ? undefined : Object.keys(newErrors)[0];
    return { valid, firstError, hasBedErrors: !!newErrors.rooms || missingNames.length > 0 };
  };
  const scrollToField = (fieldKey: string) => {
    if (fieldKey === 'rooms') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    let targetRef: React.RefObject<View | TextInput | TouchableOpacity> | null = null;
    switch (fieldKey) {
      case 'fullName':
        targetRef = fullNameRef;
        break;
      case 'phoneNumber':
        targetRef = phoneNumberRef;
        break;
      case 'street':
        targetRef = streetRef;
        break;
      case 'locality':
        targetRef = localityRef;
        break;
      case 'pincode':
        targetRef = pincodeRef;
        break;
      case 'date':
        targetRef = datePickerRef;
        break;
      case 'endDate':
        targetRef = endDateDisplayRef;
        break;
      case 'selectedfood':
        targetRef = foodTypeSectionRef;
        break;
      case 'mealPackage':
      case 'selectedPlanType':
        targetRef = mealPackageSectionRef;
        break;
      case 'tiffinPlan':
        targetRef = subscriptionTypeSectionRef;
        break;
      case 'checkInDate':
        targetRef = checkInDateRef;
        break;
      case 'checkOutDate':
        targetRef = checkOutDateRef;
        break;
      case 'aadhaarPhoto':
        targetRef = aadhaarSectionRef;
        break;
      case 'userPhoto':
        targetRef = userSectionRef;
        break;
      case 'rooms':
        targetRef = bedSectionRef;
        break;
      default:
        if (bedNameRefs.current[fieldKey]) {
          targetRef = { current: bedNameRefs.current[fieldKey] };
        }
        break;
    }
    if (targetRef?.current && scrollViewRef.current) {
      targetRef.current.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 120),
            animated: true,
          });
        },
        (error) => {
          console.warn('Error measuring layout for scroll:', error);
          // Fallback to scrolling to top of section if possible
          if (fieldKey === 'rooms' || fieldKey.includes('-')) {
            if (bedSectionRef.current) {
              bedSectionRef.current.measureLayout(
                scrollViewRef.current,
                (sx, sy, sw, sh) => {
                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, sy - 120),
                    animated: true,
                  });
                },
                () => { }
              );
            }
          }
        }
      );
    }
  };
  // NEW: Safe JSON parse helper to prevent errors
  const safeParse = (str: string): any => {
    if (typeof str !== "string") return {};
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn(
        "SafeParse warning - Invalid JSON, returning empty object:",
        str
      );
      return {};
    }
  };
  // Custom toast function for backend errors only (using react-native-toast-message)
  const showCustomToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: "Booking Error",
      text2: message,
    });
  };
  // NEW: Always prefill dates and basic fields from params (before any fetches)
  useEffect(() => {
    // Only set dates from params in edit mode, not for new bookings
    if (isEditMode) {
      if (checkInDateStr) {
        try {
          setCheckInDate(new Date(checkInDateStr));
        } catch (e) {
          console.warn("Invalid checkInDate from params:", checkInDateStr);
        }
      }
      if (checkOutDateStr) {
        try {
          setCheckOutDate(new Date(checkOutDateStr));
        } catch (e) {
          console.warn("Invalid checkOutDate from params:", checkOutDateStr);
        }
      }
    }
    // Basic user fields from params (fallback if no profile/API)
    const parsedUserData = safeParse(userDataStr);
    if (parsedUserData.name) setFullName(parsedUserData.name);
    if (parsedUserData.phoneNumber) {
      setPhoneNumber((parsedUserData.phoneNumber || "").replace(/^\+91\s*/, ""));
    }
    // For hostel: purpose from params
    if ((bookingType === "hostel" || bookingType === "reserve") && parsedUserData.workType) {
      const workTypeNormalized = parsedUserData.workType.toLowerCase();
      let purpose = "work";
      if (workTypeNormalized.includes("student")) purpose = "student";
      else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
      else if (workTypeNormalized.includes("work")) purpose = "work";
      setPurposeType(purpose);
    }
    // Add this block for bedNames
    const parsedBedNames = safeParse(bedNamesStr);
    setBedNames(parsedBedNames);
  }, [checkInDateStr, checkOutDateStr, defaultDateStr, userDataStr, bookingType, bedNamesStr]); // Add bedNamesStr to deps
  useEffect(() => {
    const autofill = async () => {
      const isHostelBooking = bookingType === "hostel" || bookingType === "reserve";
      const isTiffinBooking = bookingType === "tiffin";
      if ((isHostelBooking || isTiffinBooking) && !ranAutofill.current) {
        ranAutofill.current = true;
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            console.warn("No token for profile fetch");
            handleParamsAutofill();
            return;
          }
          // Fetch profile from API
          const profileResponse = await axios.get(
            `${BASE_URL}/api/guest/getProfile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('-------> Profile Response Full:', profileResponse.data);
          if (profileResponse.data.success) {
            const rawData = profileResponse.data.data;
            const profileData = rawData?.guest;
            console.log('-------> profileData:', profileData);
            if (!profileData) {
              console.warn("No guest data in profile response - falling back to params");
              handleParamsAutofill();
              return;
            }
            // Now safe to access
            const userName = profileData.name || "";
            let userPhone = profileData.phoneNumber || "";
            // Strip +91 if present during autofill
            const strippedPhone = userPhone.replace(/^\+91\s*/, '');
            userPhone = strippedPhone;
            // Autofill common fields (override params if profile has better data)
            setFullName(userName);
            setPhoneNumber(userPhone);
            // Autofill address for tiffin
            if (isTiffinBooking && profileData.addresses && profileData.addresses.length > 0) {
              const firstAddress = profileData.addresses[0];
              setStreet(firstAddress.street || "");
              setPincode(firstAddress.postCode || "");
              // Parse locality from address (e.g., "F6H7+8MH, Kanpur" -> "Kanpur")
              const addressParts = firstAddress.address.split(',');
              if (addressParts.length > 1) {
                setLocality(addressParts[1].trim());
              } else {
                setLocality(firstAddress.address);
              }
            }
            // Handle other user data from profile (override params)
            const userEmail = profileData.email || "";
            const userWorkType = profileData.workType || "";
            const userAdharPhoto = profileData.adharCardPhoto || "";
            const userPhotoUrl = profileData.userPhoto || "";
            if (isHostelBooking) {
              setServiceData((prev) => ({
                ...prev,
                email: userEmail || prev.email,
                workType: userWorkType || prev.workType,
                adharCardPhoto: userAdharPhoto || prev.adharCardPhoto,
                userPhoto: userPhotoUrl || prev.userPhoto,
              }));
              setAadhaarPhoto(userAdharPhoto || "");
              setUserPhoto(userPhotoUrl || "");
              const workTypeNormalized = userWorkType.toLowerCase();
              let purpose = "work"; // default
              if (workTypeNormalized.includes("student")) purpose = "student";
              else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
              else if (workTypeNormalized.includes("work")) purpose = "work";
              setPurposeType(purpose);
            }
            // Rest of the autofill logic for service/hostel data remains the same
            if (isHostelBooking) {
              const parsedHostelData = safeParse(hostelDataStr);
              const parsedPlan = safeParse(planStr);
              // NEW: Handle multiple rooms via roomsData, fallback to single room
              let rooms: RoomData[] = [];
              try {
                const parsedRoomsData = safeParse(roomsDataStr);
                if (Array.isArray(parsedRoomsData) && parsedRoomsData.length > 0) {
                  rooms = parsedRoomsData;
                } else {
                  // Backward compat: single room
                  const parsedRoomData = safeParse(roomDataStr);
                  const parsedSelectedBeds = safeParse(selectedBedsStr);
                  rooms = [
                    {
                      roomId: parsedRoomData._id,
                      roomNumber: parsedRoomData.roomNumber,
                      beds: parsedSelectedBeds, // [{bedId, bedNumber}]
                    },
                  ];
                }
              } catch (parseErr) {
                console.error("Error parsing rooms data:", parseErr);
                rooms = [];
              }
              // Update serviceData with minimal data
              setServiceData((prev) => ({
                ...prev,
                hostelId: parsedHostelData.id,
                hostelName: parsedHostelData.name || prev.hostelName, // For UI
                rooms, // NEW: Array of rooms
                monthlyPrice: parsedPlan.price,
                deposit: parsedPlan.depositAmount,
              }));
              setTimeout(() => {
                if (Object.keys(bedNames).length === 0 && rooms.length > 0) {
                  prefillFirstBedName(rooms, userName);
                }
              }, 0);
              setHostelPlan(parsedPlan.name || "monthly");
            }
            if (isTiffinBooking) {
              const parsedServiceData = safeParse(serviceDataStr);
              console.log('Parsed service data for tiffin:', parsedServiceData);

              // CRITICAL: Use tiffinServiceId from params (comes from booking data)
              const serviceIdToUse = tiffinServiceId || parsedServiceData.serviceId || parsedServiceData.id || params.serviceId;
              console.log('TIFFIN SERVICE ID RESOLVED:', serviceIdToUse); // Should log 693976faa1535eab8cdbd878

              setServiceData((prev) => ({
                ...prev,
                serviceId: serviceIdToUse,
                serviceName: parsedServiceData.serviceName || parsedServiceData.name || prev.serviceName,
                // ... keep other fields
              }));

              // Reset defaults first
              setSelectedfood("");
              setOrderType("delivery");
              setTiffinPlan("");
              setSelectedMealPackage(0);
              setDate(null);
              setEndDate(null);

              if (serviceIdToUse) {
                const fetchTiffinService = async () => {
                  try {
                    const token = await AsyncStorage.getItem("token");
                    if (!token) return;

                    const response = await axios.get(
                      `${BASE_URL}/api/guest/tiffinServices/getTiffinServiceById/${serviceIdToUse}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (response.data.success) {
                      const service = response.data.data;
                      setTiffinService(service);

                      // Set initial order type
                      const types = service.orderTypes || [];
                      const initialOrderType = types.includes("Dining") ? "dining" : "delivery";
                      setOrderType(initialOrderType as "dining" | "delivery");

                      // Set meal labels
                      const newMealLabels: Record<MealType, string> = { breakfast: "", lunch: "", dinner: "" };
                      service.mealTimings?.forEach((mt: any) => {
                        const key = mt.mealType.toLowerCase() as MealType;
                        if (key in newMealLabels) {
                          newMealLabels[key] = `${mt.mealType} (${mt.startTime} - ${mt.endTime})`;
                        }
                      });
                      setMealLabels(newMealLabels);

                      // Set default food type
                      let food = "Veg";
                      if (service.foodType === "Non-Veg") food = "Non-Veg";
                      else if (service.foodType.includes("Both")) food = "Both";
                      setSelectedfood(food);
                    }
                  } catch (error) {
                    console.error("Failed to fetch tiffin service:", error);
                  }
                };

                fetchTiffinService();
              }
            }
          } else {
            console.warn("Profile fetch unsuccessful - falling back to params");
            handleParamsAutofill();
          }
        } catch (error) {
          console.error("Error in autofill useEffect:", error);
          handleParamsAutofill();
        }
        // NEW: Fetch existing booking if in edit mode (after basic autofill)
        // NEW: Fetch existing booking if in edit mode (after basic autofill)
        if (isEditMode) {
          if (tiffinServiceId) {
            await fetchExistingTiffinBooking(); // For tiffin edit
          } else {
            await fetchExistingBooking(); // For hostel edit
          }
        }
      }
    };
    const handleParamsAutofill = () => {
      const parsedUserData = safeParse(userDataStr);
      console.log('-------> Params parsedUserData:', parsedUserData);

      // Use params for basics (no API data)
      setFullName(parsedUserData.name || "");
      setPhoneNumber((parsedUserData.phoneNumber || "").replace(/^\+91\s*/, '') || "");

      // Hostel/tiffin specific from params (unchanged logic, but safe)
      if (bookingType === "hostel" || bookingType === "reserve") {
        const userEmail = parsedUserData.email || "";
        const userWorkType = parsedUserData.workType || "";
        const userAdharPhoto = parsedUserData.adharCardPhoto || "";
        const userPhotoUrl = parsedUserData.userPhoto || "";
        setServiceData((prev) => ({
          ...prev,
          email: userEmail || prev.email,
          workType: userWorkType || prev.workType,
          adharCardPhoto: userAdharPhoto || prev.adharCardPhoto,
          userPhoto: userPhotoUrl || prev.userPhoto,
        }));
        setAadhaarPhoto(userAdharPhoto || "");
        setUserPhoto(userPhotoUrl || "");
        const workTypeNormalized = userWorkType.toLowerCase();
        let purpose = "work";
        if (workTypeNormalized.includes("student")) purpose = "student";
        else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
        else if (workTypeNormalized.includes("work")) purpose = "work";
        setPurposeType(purpose);

        // ... (rooms parsing, etc.)
        const parsedHostelData = safeParse(hostelDataStr);
        const parsedPlan = safeParse(planStr);
        let rooms: RoomData[] = [];
        try {
          const parsedRoomsData = safeParse(roomsDataStr);
          if (Array.isArray(parsedRoomsData) && parsedRoomsData.length > 0) {
            rooms = parsedRoomsData;
          } else {
            // Backward compat: single room
            const parsedRoomData = safeParse(roomDataStr);
            const parsedSelectedBeds = safeParse(selectedBedsStr);
            rooms = [
              {
                roomId: parsedRoomData._id,
                roomNumber: parsedRoomData.roomNumber,
                beds: parsedSelectedBeds,
              },
            ];
          }
        } catch (parseErr) {
          console.error("Error parsing rooms data:", parseErr);
          rooms = [];
        }
        setServiceData((prev) => ({
          ...prev,
          hostelId: parsedHostelData.id,
          hostelName: parsedHostelData.name || prev.hostelName,
          rooms,
          monthlyPrice: parsedPlan.price,
          deposit: parsedPlan.depositAmount,
        }));
        setTimeout(() => {
          if (Object.keys(bedNames).length === 0 && rooms.length > 0) {
            prefillFirstBedName(rooms, parsedUserData.name || "");
          }
        }, 0);
        setHostelPlan(parsedPlan.name || "monthly");
      }

      // Tiffin address from params if no API
      if (bookingType === "tiffin") {
        // Params don't have addresses, so skip or use empty
        setStreet("");
        setLocality("");
        setPincode("");

        const parsedServiceData = safeParse(serviceDataStr);
        console.log('Parsed service data for tiffin:', parsedServiceData);

        // FIXED: Prioritize tiffinServiceId from edit mode params
        const serviceIdToUse = tiffinServiceId || parsedServiceData.serviceId || parsedServiceData.id || params.serviceId;
        console.log('Resolved serviceIdToUse:', serviceIdToUse);

        setServiceData((prev) => ({
          ...prev,
          serviceId: serviceIdToUse, // FIXED: Use resolved serviceId
          serviceName: parsedServiceData.serviceName || parsedServiceData.name,
          price: parsedServiceData.price,
          foodType: parsedServiceData.foodType,
          mealPreferences: parsedServiceData.mealPreferences,
          orderTypes: parsedServiceData.orderTypes,
          pricing: parsedServiceData.pricing,
          location: parsedServiceData.location || parsedServiceData.fullAddress,
          contactInfo: parsedServiceData.contactInfo,
        }));

        setSelectedfood("");
        setOrderType("delivery");

        // FIXED: Use resolved serviceIdToUse for condition check
        if (serviceIdToUse) {
          const fetchTiffinService = async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              console.log('Fetching tiffin with ID:', serviceIdToUse);
              const response = await axios.get(
                `${BASE_URL}/api/guest/tiffinServices/getTiffinServiceById/${serviceIdToUse}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.data.success) {
                console.log('Tiffin Service Data:', response.data.data);
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
                    const titleCaseMealType = mt.mealType.charAt(0).toUpperCase() + mt.mealType.slice(1).toLowerCase();
                    newMealLabels[key] = `${titleCaseMealType} (${mt.startTime} - ${mt.endTime})`;
                  }
                });
                setMealLabels(newMealLabels);

                // FIXED: Auto-set initial food type based on service
                const serviceFoodType = response.data.data.foodType;
                let initialFoodValue = "";
                if (serviceFoodType === "Veg") {
                  initialFoodValue = "Veg";
                } else if (serviceFoodType === "Non-Veg") {
                  initialFoodValue = "Non-Veg";
                } else if (serviceFoodType === "Both Veg & Non-Veg") {
                  initialFoodValue = "Both";
                }
                setSelectedfood(initialFoodValue);
              }
            } catch (error) {
              console.error("Error fetching tiffin service:", error);
            }
          };
          fetchTiffinService();
        } else {
          console.warn('No service ID found for tiffin fetch');
        }

        setDate(null);
      }
    };
    autofill();
  }, [
    bookingType,
    serviceDataStr,
    hostelDataStr,
    roomDataStr,
    roomsDataStr,
    userDataStr,
    planStr,
    selectedBedsStr,
    defaultDateStr,
    checkInDateStr,
    checkOutDateStr,
    bookingId, // NEW: Depend on bookingId for edit fetch
    isEditMode, // NEW: Depend on isEditMode
    tiffinServiceId,
  ]);
  // Fetch pricing only for hostel (skip for tiffin to avoid 404)
  useEffect(() => {
    const fetchPricing = async () => {
      if (bookingType !== "hostel" && bookingType !== "reserve") {
        setIsLoadingPricing(false);
        return;
      }
      setIsLoadingPricing(true);
      try {
        let response;
        if (
          (bookingType === "hostel" || bookingType === "reserve") &&
          serviceData.hostelId
        ) {
          const token = await AsyncStorage.getItem("token"); // Fetch token here (add this line)
          if (!token) {
            console.error("No auth token available for pricing fetch");
            // FIXED: Set defaults if no token
            setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
            setSecurityDeposit(5000);
            setWeeklyDeposit(1000);
            setPickerItems([
              { label: "Per Day", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
            ]);
            setCurrentPlanPrice(3200);
            setCurrentDeposit(5000);
            return;
          }
          response = await axios.get(
            `${BASE_URL}/api/guest/hostelServices/getHostelPricing/${serviceData.hostelId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // Add this header
              },
            }
          );
          if (response.data.success) {
            const data = response.data.data;
            setPricingData({
              daily: data.pricing?.perDay || 0,
              weekly: data.pricing?.weekly || 0,
              monthly: data.pricing?.monthly || 0,
            });
            setSecurityDeposit(data.securityDeposit ?? 0);
            setWeeklyDeposit(data.weeklyDeposit ?? 0);
            setDailyDeposit(data.perDayDeposit ?? 0);
            const items = [];
            if (data.pricing?.perDay > 0) {
              items.push({ label: "Per Day", value: "daily" });
            }
            if (data.pricing?.weekly > 0) {
              items.push({ label: "Weekly", value: "weekly" });
            }
            if (data.pricing?.monthly > 0) {
              items.push({ label: "Monthly", value: "monthly" });
            }
            // if (items.length === 0) {
            //   items.push({ label: "Monthly", value: "monthly" });
            // }

            setPickerItems(items);
            setHostelPlan(items[0].value); // Pehla available plan select ho jayega
            // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
          } else {
            console.error("API returned false success:", response.data.message);
            // FIXED: Set defaults on API failure
            setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
            setSecurityDeposit(5000);
            setWeeklyDeposit(1000);
            setPickerItems([
              { label: "Per Day", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
            ]);
            setCurrentPlanPrice(3200);
            setCurrentDeposit(5000);
          }
        } else {
          // FIXED: Set defaults if no hostelId
          setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
          setSecurityDeposit(5000);
          setWeeklyDeposit(1000);
          setPickerItems([
            { label: "Per Day", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
          ]);
          setCurrentPlanPrice(3200);
          setCurrentDeposit(5000);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
        // FIXED: Set defaults on error
        setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
        setSecurityDeposit(5000);
        setWeeklyDeposit(1000);
        setPickerItems([
          { label: "Per Day", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
        ]);
        setCurrentPlanPrice(3200);
        setCurrentDeposit(5000);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    fetchPricing();
  }, [serviceData.hostelId, bookingType]);
  // Update price and deposit based on selections
  useEffect(() => {
    let newPrice = 0;
    let newDeposit = 0;
    if (bookingType === "tiffin") {
      // FIXED: Single price with plan
      const hasMeals = Object.values(tiffinMeals).some(Boolean);
      const plan = tiffinPlan;
      if (hasMeals && plan) {
        newPrice = getBasePriceForPlan(plan);
      }
      newDeposit = 0; // No deposit for tiffin
    } else {
      // FIXED: For hostel, use flat rate (no multiplication by beds)
      const basePlanPrice =
        hostelPlan === "daily"
          ? pricingData.daily
          : hostelPlan === "weekly"
            ? pricingData.weekly
            : pricingData.monthly;
      newPrice = basePlanPrice;
      // FIXED: Use securityDeposit (perDayDeposit) for daily as well
      // Final correct logic: har plan ke liye apna deposit, nahi to 0
      if (hostelPlan === "monthly") {
        newDeposit = securityDeposit;  // ₹3000 ya jo bhi ho, nahi to 0
      } else if (hostelPlan === "weekly") {
        newDeposit = weeklyDeposit;    // ₹300 ya nahi to 0
      } else if (hostelPlan === "daily") {
        newDeposit = dailyDeposit;     // perDayDeposit ya nahi to 0
      } else {
        newDeposit = 0;
      }
    }
    setCurrentPlanPrice(newPrice);
    setCurrentDeposit(newDeposit);
  }, [
    orderType,
    bookingType,
    hostelPlan,
    pricingData,
    securityDeposit,
    weeklyDeposit,
    tiffinMeals, // FIXED: Depend on tiffinMeals
    fetchedPricing,
    tiffinPlan, // NEW: Depend on single plan
    totalBedsCount, // NEW: For hostel pricing
  ]);
  // Auto-fill check-out date based on check-in and plan (for hostel)
  useEffect(() => {
    if (checkInDate && hostelPlan) {
      let daysToAdd = 0;
      if (hostelPlan === "daily") {
        daysToAdd = 1;
      } else if (hostelPlan === "weekly") {
        daysToAdd = 7;
      } else if (hostelPlan === "monthly") {
        daysToAdd = 29;
      }
      const newCheckOut = new Date(checkInDate);
      newCheckOut.setDate(newCheckOut.getDate() + daysToAdd);
      setCheckOutDate(newCheckOut);
    }
  }, [checkInDate, hostelPlan]);
  // FIXED: Auto-fill end date based on start date and plan (for tiffin weekly/monthly)
  useEffect(() => {
    if (date && ["weekly", "monthly"].includes(tiffinPlan)) {
      let daysToAdd = 0;
      if (tiffinPlan === "weekly") {
        daysToAdd = 7;
      } else if (tiffinPlan === "monthly") {
        daysToAdd = 29;
      }
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
    } else {
      setEndDate(null); // Clear end date if no periodic plans
    }
  }, [date, tiffinPlan]);
  // Helper functions
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
    if (selectedDate) {
      // Fix: Set to 12:00 local on selected day to avoid UTC shift to previous day
      selectedDate.setHours(12, 0, 0, 0);
      setCheckInDate(new Date(selectedDate));
      // Auto-fill check-out will happen via useEffect
    }
  };
  // NEW: Image picker functions for hostel uploads
  const pickAadhaarPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setAadhaarPhoto(result.assets[0].uri);
      clearError("aadhaarPhoto");
    }
  };
  const pickUserPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      clearError("userPhoto");
    }
  };
  // FIXED: Single plan details fetch
  const handleGetPlanDetails = async () => {
    // FIXED: Use selectedPlanType for exact match in query
    if (!selectedPlanType) {
      setPlanError("Please select a meal package.");
      return;
    }
    if (!tiffinPlan) {
      setPlanError("Please select subscription type.");
      return;
    }
    let foodTypeStr = "";
    if (selectedfood === "Veg") foodTypeStr = "Veg";
    else if (selectedfood === "Non-Veg") foodTypeStr = "Non-veg";
    else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";
    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);
    const planStr = tiffinPlan;
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setPlanError("Authentication required.");
      return;
    }
    if (!serviceData.serviceId) {
      setPlanError("Service ID not available.");
      return;
    }
    setIsFetchingDetails(true);
    setPlanError("");
    try {
      const queryParams = new URLSearchParams({
        foodType: foodTypeStr,
        orderType: orderTypeStr,
        planType: selectedPlanType, // FIXED: Use exact selectedPlanType
        plan: planStr,
      });
      const url = `${BASE_URL}/api/guest/tiffinServices/getPlanDetailsById/${serviceData.serviceId}?${queryParams.toString()}`;
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
  // NEW: Auto-fetch plan details when meal package is selected or relevant inputs change
  useEffect(() => {
    if (selectedMealPackage > 0 && selectedfood && orderType && tiffinPlan && selectedPlanType) {
      handleGetPlanDetails();
    } else {
      setFetchedPricing({ perDay: 0, weekly: 0, monthly: 0, offers: "" });
    }
  }, [selectedMealPackage, selectedfood, orderType, tiffinPlan, selectedPlanType]); // FIXED: Add selectedPlanType dep

  // NEW: Match meal package when mealPackages become available (for edit mode)
  useEffect(() => {
    console.log("Matching useEffect triggered:", {
      isEditMode,
      hasTiffinServiceId: !!tiffinServiceId,
      selectedPlanType,
      mealPackagesLength: mealPackages.length,
      currentSelectedMealPackage: selectedMealPackage,
      availablePlanTypes: mealPackages.map(p => p.planType)
    });

    if (isEditMode && tiffinServiceId && selectedPlanType && mealPackages.length > 0 && selectedMealPackage === 0) {
      const matchingPkg = mealPackages.find(p => p.planType === selectedPlanType);
      if (matchingPkg) {
        console.log("AUTO-SELECTED MEAL PACKAGE:", matchingPkg.label, matchingPkg.id);
        setSelectedMealPackage(matchingPkg.id);
        setTiffinMeals(matchingPkg.meals);
      } else {
        console.warn("No matching meal package found for:", selectedPlanType);
      }
    }
  }, [isEditMode, tiffinServiceId, selectedPlanType, mealPackages, selectedMealPackage]);
  const handleBack = () => {
    router.back();
  };
  // FIXED: Updated handleTiffinSubmit with exact planName, removed redundant meal check, added ID log
  const handleTiffinSubmit = async () => {
    const validation = validateTiffinForm();
    if (!validation.valid) {
      if (validation.firstError) {
        scrollToField(validation.firstError);
      }
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setErrors((prev) => ({
          ...prev,
          general: "Authentication token is missing!",
        }));
        return;
      }

      if (!serviceData.serviceId) {
        console.error("Service ID is missing!");
        setErrors((prev) => ({
          ...prev,
          general: "Service ID is missing! Check navigation params.",
        }));
        return;
      }

      // Build fullAddress exactly like in the example response
      const combinedAddress = [
        street,
        landmark ? `${landmark},` : "",
        locality,
        pincode ? `- ${pincode}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const chooseOrderTypeStr = orderType === "delivery" ? "Delivery" : "Dining";

      if (selectedMealPackage === 0 || !selectedPlanType) {
        setErrors((prev) => ({
          ...prev,
          general: "Please select a valid meal package!",
        }));
        return;
      }

      const priceForPlan = getBasePriceForPlan(tiffinPlan);

      const subscribtionType = {
        subscribtion: tiffinPlan,
        price: priceForPlan,
      };

      const startDateStr = date ? date.toISOString().split("T")[0] : "";
      const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
      const endDateStr = hasPeriodic && endDate ? endDate.toISOString().split("T")[0] : undefined;

      let foodTypeStr = "";
      if (selectedfood === "Veg") foodTypeStr = "Veg";
      else if (selectedfood === "Non-Veg") foodTypeStr = "Non-veg";
      else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";

      // UPDATED PAYLOAD – Matches backend update API exactly
      const payload: any = {
        fullName,
        phoneNumber: phoneNumber ? `+91${phoneNumber}` : '',
        address: {
          fullAddress: combinedAddress || "Not provided",
          street: street || "",
          pinCode: parseInt(pincode) || 0,
        },
        deliveryInstructions: specialInstructions || "",
        foodType: foodTypeStr,
        chooseOrderType: chooseOrderTypeStr,
        planType: selectedPlanType, // e.g., "Breakfast, lunch & dinner"
        subscribtionType,
        date: startDateStr,
      };

      if (endDateStr) {
        payload.endDate = endDateStr;
      }

      console.log("Sending tiffin payload:", JSON.stringify(payload, null, 2));

      let response;

      if (isEditMode && bookingId) {
        // EDIT MODE → PUT request
        console.log("Updating existing tiffin booking ID:", bookingId);
        response = await axios.put(
          `${BASE_URL}/api/guest/tiffinServices/update/${bookingId}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // NEW BOOKING → POST request
        console.log("Creating new tiffin booking");
        response = await axios.post(
          `${BASE_URL}/api/guest/tiffinServices/create?tiffinServices=${serviceData.serviceId}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        const responseBookingId = response.data.data._id || bookingId;

        Toast.show({
          type: "success",
          text1: "Success",
          text2: isEditMode ? "Tiffin order updated successfully!" : "Tiffin booking created!",
        });

        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "tiffin",
            bookingId: responseBookingId,
            serviceId: serviceData.serviceId,
            totalPrice: priceForPlan.toString(),
            planType: selectedPlanType,
            startDate: startDateStr,
            endDate: endDateStr || "",
            mealPreference: selectedPlanType,
            foodType: foodTypeStr,
            orderType,
            fullName,
          },
        });
      } else {
        const errorMsg = response.data.message || "Unknown error";
        showCustomToast(`Booking failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Error in tiffin booking:", error.response?.data || error.message);
      let errorMsg = "Something went wrong. Please try again.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showCustomToast(errorMsg);
    }
  };
  const handleHostelSubmit = async () => {
    console.log("=== Hostel Submit Debug ===");
    console.log("serviceData:", serviceData);
    console.log("hostelPlan:", hostelPlan);
    console.log("fullName:", fullName);
    console.log("phoneNumber:", phoneNumber);
    console.log("checkInDate:", checkInDate);
    console.log("checkOutDate:", checkOutDate);
    console.log("purposeType:", purposeType);
    console.log("aadhaarPhoto:", aadhaarPhoto);
    console.log("userPhoto:", userPhoto);
    console.log("rooms:", serviceData.rooms);
    console.log("bedNames:", bedNames);
    const validation = validateHostelForm();
    if (!validation.valid) {
      if (validation.hasBedErrors) {
        setExpandedTiffin(0);
        setTimeout(() => {
          if (validation.firstError) {
            scrollToField(validation.firstError);
          }
        }, 300);
      } else if (validation.firstError) {
        scrollToField(validation.firstError);
      }
      return;
    }
    setIsLoadingHostel(true);
    try {
      if (!serviceData.hostelId) {
        console.error("Error: Hostel ID is missing!");
        console.log("hostelId:", serviceData.hostelId);
        setErrors(prev => ({ ...prev, general: "Hostel ID is missing!" }));
        return;
      }
      // NEW: No need for single roomId validation
      if (!serviceData.rooms || serviceData.rooms.length === 0 || totalBedsCount === 0) {
        console.error("Error: No rooms or beds selected!");
        setErrors(prev => ({ ...prev, general: "Please select at least one bed across rooms!" }));
        return;
      }
      const token = await AsyncStorage.getItem("token");
      const guestId = await AsyncStorage.getItem("guestId");
      console.log("token:", token ? "Present" : "Missing");
      console.log("guestId:", guestId ? "Present" : "Missing");
      if (!token || !guestId) {
        console.error("Error: Authentication token or guest ID is missing!");
        setErrors(prev => ({ ...prev, general: "Authentication token or guest ID is missing!" }));
        return;
      }
      // FIXED: Use flat price and deposit for the plan (no per-bed division)
      const planName = hostelPlan === 'daily' ? 'perDay' : hostelPlan; // Fix: Map daily to perDay for backend
      const selectPlan = [
        {
          name: planName,
          price: currentPlanPrice,
          depositAmount: currentDeposit,
        },
      ];
      // UPDATED: Build rooms array from serviceData.rooms, ADD name to each bed
      const roomsPayload = serviceData.rooms.map((room: RoomData) => ({
        roomId: room.roomId,
        roomNumber: String(room.roomNumber || ""), // e.g., "101"
        bedNumber: room.beds.map(bed => ({
          bedId: bed.bedId,
          bedNumber: bed.bedNumber,
          name: bedNames[getBedKey(room.roomId, bed.bedId)] || '', // From state
        })),
      }));
      // UPDATED: For update, use 'addRooms'; for create, use 'rooms'
      const roomsKey = isEditMode ? 'addRooms' : 'rooms';
      // Create FormData for file uploads ONLY if new images; otherwise prepare JSON
      let formData: FormData | undefined;
      let updatePayload: any = {
        fullName,
        phoneNumber: phoneNumber ? `+91${phoneNumber}` : '', // Standardize with +91 for consistency
        email: serviceData.email || "example@example.com",
        workType: purposeType, // Send lowercase to match backend (remove capitalization if backend lowercases)
        [roomsKey]: roomsPayload, // Direct array (no stringify)
        selectPlan, // Direct array (no stringify)
        Remark: message || '',
      };

      // Date handling: Use full ISO with specific times (check-in 18:00, check-out 12:00) to match backend format
      let checkInDateStr: string;
      let checkOutDateStr: string;
      if (checkInDate) {
        const checkIn = new Date(checkInDate);
        checkIn.setHours(18, 30, 0, 0); // Evening arrival
        checkInDateStr = checkIn.toISOString();
      } else {
        checkInDateStr = '';
      }
      if (checkOutDate) {
        const checkOut = new Date(checkOutDate);
        checkOut.setHours(12, 0, 0, 0); // Noon departure
        checkOutDateStr = checkOut.toISOString();
      } else {
        checkOutDateStr = '';
      }
      updatePayload.checkInDate = checkInDateStr;
      updatePayload.checkOutDate = checkOutDateStr;

      // Flags for existing photos
      updatePayload.aadhaarPhoto = aadhaarPhoto.startsWith('http') ? 'Existing' : null;
      updatePayload.userPhoto = userPhoto.startsWith('http') ? 'Existing' : null;

      // If new photos, use FormData and append fields properly
      const hasNewPhotos = (aadhaarPhoto && !aadhaarPhoto.startsWith('http')) || (userPhoto && !userPhoto.startsWith('http'));
      if (hasNewPhotos) {
        formData = new FormData();
        // Append simple string fields as-is
        const simpleFields = {
          fullName: updatePayload.fullName,
          phoneNumber: updatePayload.phoneNumber,
          email: updatePayload.email,
          workType: updatePayload.workType,
          Remark: updatePayload.Remark,
          checkInDate: updatePayload.checkInDate,
          checkOutDate: updatePayload.checkOutDate,
        };
        Object.entries(simpleFields).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        // Append complex fields as JSON strings (backend can parse)
        formData.append('selectPlan', JSON.stringify(updatePayload.selectPlan));
        formData.append(roomsKey, JSON.stringify(updatePayload[roomsKey]));
        // Append photo flags
        if (updatePayload.aadhaarPhoto) formData.append('aadhaarPhoto', updatePayload.aadhaarPhoto);
        if (updatePayload.userPhoto) formData.append('userPhoto', updatePayload.userPhoto);
        // Append new images
        if (aadhaarPhoto && !aadhaarPhoto.startsWith('http')) {
          formData.append('addharCardPhoto', {
            uri: aadhaarPhoto,
            type: 'image/jpeg',
            name: 'aadhar.jpg',
          } as any);
        }
        if (userPhoto && !userPhoto.startsWith('http')) {
          formData.append('userPhoto', {
            uri: userPhoto,
            type: 'image/jpeg',
            name: 'user.jpg',
          } as any);
        }
      }

      if (!isEditMode) {
        updatePayload.guestId = guestId; // Only for create
      }

      console.log("Full Payload: (logged as object for debug)");
      console.log({
        ...updatePayload,
        aadhaarPhoto: aadhaarPhoto ? (aadhaarPhoto.startsWith('http') ? 'Existing' : 'New Attached') : 'Null',
        userPhoto: userPhoto ? (userPhoto.startsWith('http') ? 'Existing' : 'New Attached') : 'Null',
        hasNewPhotos,
      });

      let response;
      if (isEditMode) {
        // UPDATED: Use PUT for update; prefer JSON if no new photos, else FormData
        const headers = hasNewPhotos
          ? { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
          : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        const body = hasNewPhotos ? formData : updatePayload;

        response = await axios.put(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/update/${bookingId}`,
          body,
          { headers }
        );
      } else {
        // For create, always use FormData (consistent with images)
        if (!formData) {
          formData = new FormData();
          // Append simple string fields as-is
          const simpleFields = {
            fullName: updatePayload.fullName,
            phoneNumber: updatePayload.phoneNumber,
            email: updatePayload.email,
            workType: updatePayload.workType,
            Remark: updatePayload.Remark,
            checkInDate: updatePayload.checkInDate,
            checkOutDate: updatePayload.checkOutDate,
            guestId: updatePayload.guestId,
          };
          Object.entries(simpleFields).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formData.append(key, String(value));
            }
          });
          // Append complex fields as JSON strings
          formData.append('selectPlan', JSON.stringify(updatePayload.selectPlan));
          formData.append('rooms', JSON.stringify(updatePayload.rooms)); // For create, always 'rooms'
        }
        response = await axios.post(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createHostelBooking/${serviceData.hostelId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      console.log("API Response:", response.data);
      if (response.data.success) {
        console.log("Booking successful:", response.data.data);
        const updatedData = response.data.data;
        const updatedBookingId = updatedData._id || bookingId;

        // NEW: Client-side verification for key fields (especially in edit mode)
        if (isEditMode) {
          const mismatches: string[] = [];
          if (updatedData.fullName !== fullName) mismatches.push('Full Name');
          if (updatedData.phoneNumber !== `+91${phoneNumber}`) mismatches.push('Phone Number');
          const updatedCheckIn = new Date(updatedData.checkInDate);
          const sentCheckIn = new Date(checkInDateStr);
          if (updatedCheckIn.toDateString() !== sentCheckIn.toDateString()) mismatches.push('Check-in Date');
          const updatedCheckOut = new Date(updatedData.checkOutDate);
          const sentCheckOut = new Date(checkOutDateStr);
          if (updatedCheckOut.toDateString() !== sentCheckOut.toDateString()) mismatches.push('Check-out Date');
          if (updatedData.workType !== purposeType) mismatches.push('Work Type');

          if (mismatches.length > 0) {
            console.warn('Partial update detected:', mismatches);
            Alert.alert(
              'Partial Update Warning',
              `Some fields (${mismatches.join(', ')}) may not have been updated. Please verify your booking details.`,
              [{ text: 'OK' }]
            );
          } else {
            console.log('Full update verified successfully');
          }
        }

        console.log("Navigating to checkout with booking ID:", updatedBookingId);
        // UPDATED: Use response dates for navigation (in case of adjustments)
        const navCheckIn = updatedData.checkInDate ? new Date(updatedData.checkInDate).toISOString().split('T')[0] : checkInDateStr;
        const navCheckOut = updatedData.checkOutDate ? new Date(updatedData.checkOutDate).toISOString().split('T')[0] : checkOutDateStr;
        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "hostel",
            bookingId: updatedBookingId,
            serviceId: serviceData.hostelId,
            checkInDate: navCheckIn,
            checkOutDate: navCheckOut,
          },
        });
      } else {
        console.error("Booking failed:", response.data.message || "Unknown error");
        const errorMsg = response.data.message || "Unknown error";
        setErrors(prev => ({ ...prev, general: `Booking failed: ${errorMsg}` }));
        showCustomToast(`Booking failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Error creating hostel booking:", error.response?.data || error.message);
      console.error("Full error object:", error);
      let errorMsg = "Something went wrong while booking. Please try again.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message; // Use backend error message
      } else if (error.response?.status === 400) {
        errorMsg = "Invalid booking details (e.g., dates or plan type). Please check your selections.";
      }
      setErrors(prev => ({ ...prev, general: errorMsg }));
      showCustomToast(errorMsg);
    } finally {
      setIsLoadingHostel(false);
    }
  };
  // NEW: Bed name input handler (with sync for first bed)
  const handleBedNameChange = (roomId: string, bedId: string, text: string, isFirstBed: boolean) => {
    const key = getBedKey(roomId, bedId);
    setBedNames(prev => ({ ...prev, [key]: text }));
    clearError(key);
    if (isFirstBed) {
      // setFullName(text); // Sync back to primary fullName
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
      {checked && <Text style={styles.checkMark}>✓</Text>}
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
    <TouchableOpacity onPress={() => onPress(value)} style={styles.radioRow}>
      <View style={styles.radioOuter}>
        {selected === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
  // UPDATED: Helper to render selected rooms summary + bed names UI (flattened: no nested cards, use dividers)
  const renderBedNamesSection = () => {
    if (serviceData.rooms.length === 0) return null;
    // Find first bed for prefill logic
    const firstBedRoom = serviceData.rooms[0];
    const firstBed = firstBedRoom?.beds[0];
    const isFirstBed = (room: RoomData, bed: { bedId: string }) => room === firstBedRoom && bed.bedId === firstBed?.bedId;
    return (
      <View ref={bedSectionRef} style={styles.bedNamesSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedTiffin(prev => prev === 0 ? null : 0)} // Reuse expandedTiffin as toggle (0 for beds)
        >
          <View style={styles.sectionHeaderContent}>
            <Ionicons name="person-outline" size={20} color="#004AAD" style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>Selected Rooms & Guest Names</Text>
          </View>
          <Text style={styles.dropdownIcon}>{expandedTiffin === 0 ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {expandedTiffin === 0 && (
          <View style={styles.expandedContent}>
            <Text style={styles.introText}>
              Assign names to each guest bed for a smooth booking process.
            </Text>
            {serviceData.rooms.map((room, roomIndex) => (
              <View key={room.roomId} style={styles.roomContainer}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomTitle}>Room {room.roomNumber}</Text>
                  <Text style={styles.roomSubtitle}>{room.beds.length} Guest(s)</Text>
                </View>
                {room.beds.map((bed, bedIndex) => {
                  const bedKey = getBedKey(room.roomId, bed.bedId);
                  const bedName = bedNames[bedKey] || '';
                  const error = getBedNameError(bedKey);
                  return (
                    <View key={bed.bedId} style={[styles.bedRow, error && styles.bedRowError]}>
                      <View style={styles.bedAvatarContainer}>
                        <View style={styles.bedAvatar}>
                          <Ionicons name="person-outline" size={24} color="#004AAD" style={styles.bedAvatarIcon} />
                        </View>
                        <Text style={styles.bedNumberLabel}>Bed {bed.bedNumber}</Text>
                      </View>
                      <View style={styles.bedNameContainer}>
                        <TextInput
                          ref={(ref) => { if (ref) bedNameRefs.current[bedKey] = ref; }}
                          style={[styles.bedNameInput, error && styles.inputError]}
                          placeholder={`Guest name for Bed ${bed.bedNumber}`}
                          value={bedName}
                          onChangeText={(text) => handleBedNameChange(room.roomId, bed.bedId, text, isFirstBed(room, bed))}
                          onBlur={() => {
                            if (!bedName.trim()) {
                              setErrors(prev => ({ ...prev, [bedKey]: "Name is required for this bed!" }));
                            }
                          }}
                        />
                        {error && <Text style={styles.errorText}>{error}</Text>}
                      </View>
                    </View>
                  );
                })}
                {roomIndex < serviceData.rooms.length - 1 && <View style={styles.roomDivider} />}
              </View>
            ))}
            <View style={styles.totalGuestsFooter}>
              <Text style={styles.totalBedsText}>Total Guests: {totalBedsCount}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };
  // FIXED: Single plan options - Always show all options
  const getPlanOptions = () => {
    return [
      // { label: "Per Day", value: "perDay" },
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
    ];
  };
  const renderHostelBooking = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Booking</Text>
        <Text style={styles.hostelName}>
          {serviceData.hostelName || "Scholars Den Boys Hostel"}
        </Text>
        {/* UPDATED: Render bed names UI instead of simple summary */}
        {renderBedNamesSection()}
        <Text style={styles.label}>Select Plan</Text>
        <TouchableOpacity
          style={styles.pickerWrapper}
          onPress={() => setShowPlanModal(true)}
        >
          <View
            style={[
              styles.pickerInput,
              styles.customPickerInput,
            ]}
          >
            <Text
              style={[
                styles.pickerInputText,
                !hostelPlan && { color: "#999" },
              ]}
            >
              {pickerItems.find((item) => item.value === hostelPlan)?.label || "Select Plan"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </TouchableOpacity>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            ₹{currentPlanPrice} / {(hostelPlan || "monthly").charAt(0).toUpperCase() + (hostelPlan || "monthly").slice(1)}
          </Text>
          <Text style={styles.depositText}>
            Deposit: ₹{currentDeposit}
          </Text>
        </View>
      </View>
      {/* Personal Info */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="person-outline" size={18} color="#004AAD" style={styles.icon} />
          <Text style={styles.sectionTitle}> Personal Information</Text>
        </View>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          ref={fullNameRef}
          style={[styles.input, errors.fullName && styles.inputError]}
          placeholder="Enter your full name"
          placeholderTextColor="#000"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            clearError('fullName');
            // NEW: Sync to first bed if exists
            // const firstRoom = serviceData.rooms[0];
            // if (firstRoom && firstRoom.beds[0]) {
            //   handleBedNameChange(firstRoom.roomId, firstRoom.beds[0].bedId, text, true);
            // }
          }}
          onBlur={() => {
            if (!fullName.trim()) setErrors(prev => ({ ...prev, fullName: "Full Name is required!" }));
          }}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          ref={phoneNumberRef}
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="+91XXXXXXXXXX"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phoneNumber ? '+91' + phoneNumber : ''}
          onChangeText={(text) => {
            const numberPart = text.replace(/^\+91\s*/, '');
            const cleanNumber = numberPart.replace(/[^0-9]/g, '').slice(0, 10);
            setPhoneNumber(cleanNumber);
            clearError("phoneNumber");
          }}
          onBlur={() => {
            if (phoneNumber.length !== 10) {
              setErrors((prev) => ({
                ...prev,
                phoneNumber: "Enter a valid 10-digit mobile number",
              }));
            } else if (!phoneNumber.trim()) {
              setErrors((prev) => ({
                ...prev,
                phoneNumber: "Phone Number is required!",
              }));
            }
          }}
          editable={true}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="id-card-outline" size={18} color="#004AAD" style={styles.icon} />
          <Text style={styles.sectionTitle}>Upload Aadhaar Card Photo *</Text>
        </View>
        <View ref={aadhaarSectionRef}>
          {aadhaarPhoto ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: aadhaarPhoto }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setAadhaarPhoto('');
                  clearError('aadhaarPhoto');
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickAadhaarPhoto}>
              <Text style={styles.uploadButtonText}>Upload photo</Text>
              <Text style={styles.uploadSubtext}>
                Upload clear photo of your Aadhaar card
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {errors.aadhaarPhoto && <Text style={styles.errorText}>{errors.aadhaarPhoto}</Text>}
      </View>
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="person-circle-outline" size={18} color="#004AAD" style={styles.icon} />
          <Text style={styles.sectionTitle}>Upload Your Photo *</Text>
        </View>
        <View ref={userSectionRef}>
          {userPhoto ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: userPhoto }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setUserPhoto('');
                  clearError('userPhoto');
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickUserPhoto}>
              <Text style={styles.uploadButtonText}>Upload photo</Text>
              <Text style={styles.uploadSubtext}>
                Upload clear photo of your selfie or photo from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {errors.userPhoto && <Text style={styles.errorText}>{errors.userPhoto}</Text>}
      </View>
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="calendar-outline" size={18} color="#004AAD" style={styles.icon} />
          <Text style={styles.sectionTitle}>Booking Details</Text>
        </View>
        <Text style={styles.label}>Check-in date *</Text>
        <TouchableOpacity
          ref={checkInDateRef}
          style={[styles.datePickerButton, errors.checkInDate && styles.inputError]}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkInDate ? checkInDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Ionicons name="calendar-outline" size={17} color="#333" style={styles.calendarIcon} />
        </TouchableOpacity>
        {errors.checkInDate && <Text style={styles.errorText}>{errors.checkInDate}</Text>}
        <Text style={styles.label}>Check-out date *</Text>
        <View
          ref={checkOutDateRef}
          style={[
            styles.dateDisplay,
            errors.checkOutDate && styles.inputError
          ]}
        >
          <Text style={[
            styles.dateDisplayText,
            errors.checkOutDate && { color: '#ff0000' }
          ]}>
            {checkOutDate ? checkOutDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Ionicons name="calendar-outline" size={17} color="#999" style={styles.calendarIcon} />
        </View>
        {errors.checkOutDate && <Text style={styles.errorText}>{errors.checkOutDate}</Text>}
        {showCheckInPicker && (
          <DateTimePicker
            value={checkInDate || new Date()}
            mode="date"
            display="default"
            onChange={onChangeCheckInDate}
            minimumDate={new Date()}
          />
        )}
        <Text style={[styles.label, { marginTop: 15 }]}>
          Special Instructions (Optional)
        </Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any special requests or messages"
          placeholderTextColor="#000"
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <View style={styles.section}>
          <Text style={styles.label}>User Stay Type</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-evenly", marginTop: 10 }}>
            {/* Work */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingHorizontal: 10 }}
              onPress={() => setPurposeType("work")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "work" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Work</Text>
            </TouchableOpacity>
            {/* Leisure */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingHorizontal: 10 }}
              onPress={() => setPurposeType("leisure")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "leisure" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Leisure</Text>
            </TouchableOpacity>
            {/* Student */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingHorizontal: 10 }}
              onPress={() => setPurposeType("student")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "student" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Student</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
      {errors.rooms && <Text style={styles.errorText}>{errors.rooms}</Text>}
      <TouchableOpacity
        style={[styles.submitButton, isLoadingHostel && styles.disabledButton]}
        onPress={handleHostelSubmit}
        disabled={isLoadingHostel}
      >
        {isLoadingHostel ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditMode ? "Update Booking" : "Book Now"}
          </Text>
        )}
      </TouchableOpacity>
      <Modal
        visible={showPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlanModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Plan</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {pickerItems.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.modalOption,
                    hostelPlan === item.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setHostelPlan(item.value);
                    setShowPlanModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {hostelPlan === item.value && (
                    <Ionicons name="checkmark" size={20} color="#004AAD" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
  // FIXED: In meal package onPress - Set selectedPlanType to exact API value
  const renderTiffinBooking = () => {
    const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
    return (
      <>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="person-outline" size={18} color="#004AAD" style={styles.icon} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            ref={fullNameRef}
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              clearError("fullName");
            }}
            onBlur={() => {
              if (!fullName.trim())
                setErrors((prev) => ({
                  ...prev,
                  fullName: "Full Name is required!",
                }));
            }}
            editable={true}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            ref={phoneNumberRef}
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="+91 XXXXXXXXXX"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber ? '+91' + phoneNumber : ''}
            onChangeText={(text) => {
              const numberPart = text.replace(/^\+91\s*/, '');
              const cleanNumber = numberPart.replace(/[^0-9]/g, '').slice(0, 10);
              setPhoneNumber(cleanNumber);
              clearError("phoneNumber");
            }}
            onBlur={() => {
              if (phoneNumber.length !== 10) {
                setErrors((prev) => ({
                  ...prev,
                  phoneNumber: "Enter a valid 10-digit mobile number",
                }));
              } else if (!phoneNumber.trim()) {
                setErrors((prev) => ({
                  ...prev,
                  phoneNumber: "Phone Number is required!",
                }));
              }
            }}
            editable={true}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Ionicons name="location-outline" size={18} color="#004AAD" style={styles.icon} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.label}>
            Street Address {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            ref={streetRef}
            style={[
              styles.input,
              errors.street && styles.inputError,
            ]}
            placeholder="Enter your street address"
            placeholderTextColor="#000"
            value={street}
            onChangeText={(text) => {
              setStreet(text);
              clearError("street");
            }}
            onBlur={() => {
              if (orderType === "delivery" && !street.trim())
                setErrors((prev) => ({
                  ...prev,
                  street: "Street address is required for delivery!",
                }));
            }}
          />
          {errors.street && (
            <Text style={styles.errorText}>{errors.street}</Text>
          )}
          <Text style={styles.label}>Landmark (Optional)</Text>
          <TextInput
            style={[
              styles.input,
            ]}
            placeholder="Enter nearby landmark"
            placeholderTextColor="#000"
            value={landmark}
            onChangeText={(text) => {
              setLandmark(text);
              clearError("landmark");
            }}
          />
          <Text style={styles.label}>
            Locality / Area {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            ref={localityRef}
            style={[
              styles.input,
              errors.locality && styles.inputError,
            ]}
            placeholder="Enter locality or area"
            placeholderTextColor="#000"
            value={locality}
            onChangeText={(text) => {
              setLocality(text);
              clearError("locality");
            }}
            onBlur={() => {
              if (orderType === "delivery" && !locality.trim())
                setErrors((prev) => ({
                  ...prev,
                  locality: "Locality is required for delivery!",
                }));
            }}
          />
          {errors.locality && (
            <Text style={styles.errorText}>{errors.locality}</Text>
          )}
          <Text style={styles.label}>
            Pincode {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            ref={pincodeRef}
            style={[
              styles.input,
              errors.pincode && styles.inputError,
            ]}
            placeholder="Enter pincode (6 digits)"
            placeholderTextColor="#000"
            value={pincode}
            onChangeText={(text) => {
              setPincode(text.replace(/[^0-9]/g, "").slice(0, 6));
              clearError("pincode");
            }}
            onBlur={() => {
              if (orderType === "delivery" && !pincode.trim())
                setErrors((prev) => ({
                  ...prev,
                  pincode: "Pincode is required for delivery!",
                }));
            }}
            keyboardType="number-pad"
            maxLength={6}
          />
          {errors.pincode && (
            <Text style={styles.errorText}>{errors.pincode}</Text>
          )}
          <Text style={styles.label}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              { height: 80 },
            ]}
            placeholder="Any dietary preferences, spice level, or special requests"
            placeholderTextColor="#000"
            multiline
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </View>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="calendar-outline" size={18} color="#004AAD" style={styles.icon} />
            <Text style={styles.sectionTitle}>Booking Details</Text>
          </View>
          <View style={styles.tiffinSelectorsContainer}>
            <View style={styles.expandedContent}>
              {/* Food Type */}
              <View ref={foodTypeSectionRef}>
                <Text style={styles.sectionTitle}>Food Type</Text>
                {currentFoodOptions.length > 0 && currentFoodOptions.map((opt) => (
                  <RadioButton
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                    selected={selectedfood}
                    onPress={(value) => {
                      setSelectedfood(value);
                      clearError("selectedfood");
                    }}
                  />
                ))}
              </View>
              {errors.selectedfood && (
                <Text style={styles.errorText}>{errors.selectedfood}</Text>
              )}
              <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
                Choose Order Type
              </Text>
              {orderTypeOptions.map((opt) => (
                <RadioButton
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                  selected={orderType}
                  onPress={(value) => {
                    const newOrderType = value as "dining" | "delivery";
                    setOrderType(newOrderType);
                  }}
                />
              ))}
              <View ref={mealPackageSectionRef}>
                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
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
                        // FIXED: Set exact planType for backend match
                        setSelectedPlanType(selectedPkg.planType);
                        // Reset food type if not compatible
                        const availableValues = getAvailableFoodOptions(
                          selectedPkg.foodType
                        ).map((o) => o.value);
                        if (!availableValues.includes(selectedfood)) {
                          setSelectedfood(availableValues[0] || "Both");
                        }
                      }
                      clearError("mealPreferences");
                    }}
                  />
                ))}
              </View>
              {errors.mealPackage && (
                <Text style={styles.errorText}>{errors.mealPackage}</Text>
              )}
              {errors.selectedPlanType && (
                <Text style={styles.errorText}>{errors.selectedPlanType}</Text>
              )}
              <View ref={subscriptionTypeSectionRef}>
                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
                  Subscription Type *
                </Text>
                {getPlanOptions().map((option) => (
                  <RadioButton
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    selected={tiffinPlan || ""}
                    onPress={(value) => {
                      setTiffinPlan(value);
                      clearError("tiffinPlan");
                    }}
                  />
                ))}
              </View>
              {errors.tiffinPlan && (
                <Text style={styles.errorText}>{errors.tiffinPlan}</Text>
              )}
              {/* FIXED: Show price (dynamic) only when all selected and fetched */}
              {selectedMealPackage > 0 && tiffinPlan ? (
                <View style={styles.priceContainer}>
                  {isFetchingDetails ? (
                    <ActivityIndicator color="#004AAD" />
                  ) : getBasePriceForPlan(tiffinPlan) > 0 ? (
                    <>
                      <Text style={styles.priceText}>
                        ₹{getBasePriceForPlan(tiffinPlan)} /{" "}
                        {tiffinPlan === "perDay" ? "day" : tiffinPlan}
                      </Text>
                      {/* {fetchedPricing.offers && (
                        <Text style={styles.offersText}>
                          {fetchedPricing.offers}
                        </Text>
                      )} */}
                    </>
                  ) : (
                    planError && <Text style={styles.errorText}>{planError}</Text>
                  )}
                </View>
              ) : null}
              <Text style={[styles.label, { marginTop: 10 }]}>
                Select Start Date *
              </Text>
              <TouchableOpacity
                ref={datePickerRef}
                style={[
                  styles.datePickerButton,
                  errors.date && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {date ? date.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
                </Text>
                <Ionicons name="calendar-outline" size={17} color="#333" style={styles.calendarIcon} />
              </TouchableOpacity>
              {errors.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                  minimumDate={new Date()}
                />
              )}
              {hasPeriodic && (
                <>
                  <Text style={styles.label}>End Date</Text>
                  <View ref={endDateDisplayRef} style={styles.dateDisplay}>
                    <Text style={styles.dateDisplayText}>
                      {endDate ? endDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
                    </Text>
                  </View>
                  <Text style={styles.infoText}>Based on your {tiffinPlan} plan</Text>
                  {errors.endDate && (
                    <Text style={styles.errorText}>{errors.endDate}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
        <Buttons
          style={styles.submitButton}
          title="Submit Order Request"
          onPress={handleTiffinSubmit}
        />
        <Text style={styles.confirmationText}>
          Provider will reach out within 1 hour to confirm.
        </Text>
      </>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, marginTop: theme.verticalSpacing.space_10 }}>
        <Header
          title={
            isEditMode
              ? (tiffinServiceId ? "Edit Tiffin Booking" : "Edit Hostel Booking")
              : (bookingType === "tiffin" ? "Tiffin Booking" : "Hostel Booking")
          }
          style={styles.header}
        />
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {bookingType === "tiffin"
              ? renderTiffinBooking()
              : renderHostelBooking()}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
  },
  section: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 1,
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail'
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: "#444",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 5,
    fontSize: 14,
  },
  inputError: {
    borderColor: "#ff0000",
  },
  errorText: {
    color: "#ff0000",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "left",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 1,
    marginBottom: 15,
  },
  pickerInput: {
    height: 51,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "black",
  },
  customPickerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 51,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  pickerInputText: {
    fontSize: 14,
    color: 'black',
  },
  icon: {
    height: 18,
    width: 18,
    margin: 4,
    marginBottom: 15
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#004AAD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#004AAD",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  datePickerText: {
    fontSize: 14,
    color: "black",
  },
  submitButton: {
    backgroundColor: "#004AAD",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  hostelName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004AAD",
  },
  depositText: {
    fontSize: 14,
    color: "#666",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  calendarIcon: {
    width: 17,
    height: 17,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  purposeContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  purposeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  purposeButtonActive: {
    backgroundColor: "#004AAD",
    borderColor: "#004AAD",
  },
  purposeText: {
    fontSize: 14,
    color: "#666",
  },
  purposeTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  offersText: {
    fontSize: 14,
    color: "#FF6600",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
  // UPDATED: Styles for bed names section (to match other sections: white bg, #ccc border, 10px radius, consistent padding)
  bedNamesSection: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 25,
    backgroundColor: "#fff",
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    // Removed: backgroundColor, borderTopLeftRadius, borderTopRightRadius
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionHeaderIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#004AAD",
  },
  expandedContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    // Removed: backgroundColor, borderBottomLeftRadius, borderBottomRightRadius
  },
  introText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 8,
    lineHeight: 20,
  },
  roomContainer: {
    marginVertical: 0, // No extra margins
  },
  roomHeader: {
    paddingVertical: 12,
    paddingHorizontal: 0, // Align with parent padding
    backgroundColor: "transparent", // No background
    borderTopWidth: 0, // No border
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#004AAD",
    marginBottom: 2,
  },
  roomSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  bedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0, // Align with parent padding
    margin: 0, // No margins
    backgroundColor: "transparent", // No background
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0", // Light divider on top
  },
  bedRowError: {
    backgroundColor: "#fff5f5", // Subtle error bg
    borderTopColor: "#ffcccc",
  },
  bedAvatarContainer: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 60,
  },
  bedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "#004AAD",
  },
  bedAvatarIcon: {
    width: 24,
    height: 24,
    tintColor: "#004AAD",
  },
  bedNumberLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  bedNameContainer: {
    flex: 1,
  },
  bedNameInput: {
    borderWidth: 1,
    borderColor: "#aaa", // Match input
    borderRadius: 6,
    paddingHorizontal: 10, // Match input
    paddingVertical: 8, // Match input
    fontSize: 14, // Match input
    backgroundColor: "#fff",
    marginBottom: 5, // Match input
  },
  roomDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 0, // Full width with parent padding
  },
  totalGuestsFooter: {
    paddingVertical: 12,
    paddingHorizontal: 0, // Align with parent padding
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalBedsText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "700",
  },
  // NEW: Styles for tiffin dropdowns
  tiffinSelectorsContainer: {
    marginBottom: 20,
  },
  tiffinDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  tiffinDropdownLabel: {
    fontSize: 14,
    color: "#333",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#666",
  },
  expandedScroll: {
    maxHeight: 500,
  },
  // NEW: Styles for close button on images
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12.5,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: "#FF6600",
    borderColor: "#FF6600",
  },
  checkMark: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  // NEW: Styles for non-editable end date display
  dateDisplay: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    backgroundColor: "#f9f9f9",
  },
  dateDisplayText: {
    fontSize: 14,
    color: "#999",
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  // NEW: Styles for custom plan modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});