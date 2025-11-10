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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { calender, location1, person } from "@/assets/images";
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
};
export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingType = (params.bookingType as BookingType) || "tiffin";
  // Extract primitive strings for stable dependencies
  const serviceDataStr = params.serviceData || "{}"; // For tiffin
  const hostelDataStr = params.hostelData || "{}";
  const roomDataStr = params.roomData || "{}";
  const roomsDataStr = params.roomsData || "[]"; // NEW: For multiple rooms
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
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [currentDeposit, setCurrentDeposit] = useState(0);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  // FIXED: Set default picker items for hostel to ensure plans show
  const [pickerItems, setPickerItems] = useState([
    { label: "Monthly", value: "monthly" },
  ]); // Default to monthly
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
  const [selectedfood, setSelectedfood] = useState("Both");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<
    "work" | "leisure" | "student"
  >("work");
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");
  const [isLoadingHostel, setIsLoadingHostel] = useState(false);
  const ranAutofill = useRef(false);
  // NEW: Single tiffin meal preferences
  const [tiffinMeals, setTiffinMeals] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  // NEW: Single tiffin plan type
  const [tiffinPlan, setTiffinPlan] = useState("");
  // NEW: Meal package selection
  const [selectedMealPackage, setSelectedMealPackage] = useState<number>(0);
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
    if (lower.includes("breakfast")) mealParts.push("BF");
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
    if (fetchedPricing[pricingKey] > 0) {
      return fetchedPricing[pricingKey];
    }
    // Hardcoded fallback
    switch (plan) {
      case "perDay":
        return 250;
      case "weekly":
        return 1600;
      case "monthly":
        return 6400;
      default:
        return 0;
    }
  };
  // Validate tiffin form (single)
  const validateTiffinForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim())
      newErrors.phoneNumber = "Phone Number is required!";
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // UPDATED: Validate hostel form (add bed names check)
  const validateHostelForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim())
      newErrors.phoneNumber = "Phone Number is required!";
    if (!checkInDate) newErrors.checkInDate = "Check-in date is required!";
    if (!checkOutDate) newErrors.checkOutDate = "Check-out date is required!";
    if (checkInDate && checkOutDate && checkInDate >= checkOutDate)
      newErrors.checkOutDate = "Check-out date must be after Check-in date!";
    if (!aadhaarPhoto)
      newErrors.aadhaarPhoto = "Aadhaar Card Photo is required!";
    if (!userPhoto) newErrors.userPhoto = "User Photo is required!";
    // UPDATED: Validate at least one room with beds AND all bed names filled
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
      const missingNames = allBedKeys.filter((key) => !bedNames[key]?.trim());
      if (missingNames.length > 0) {
        missingNames.forEach((key) => {
          newErrors[key] = `Name is required for this bed!`;
        });
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  useEffect(() => {
    const isHostelBooking =
      bookingType === "hostel" || bookingType === "reserve";
    const isTiffinBooking = bookingType === "tiffin";
    if ((isHostelBooking || isTiffinBooking) && !ranAutofill.current) {
      ranAutofill.current = true;
      try {
        const parsedUserData = safeParse(userDataStr);
        // Handle user data structure: direct or nested under 'guest'
        const userName =
          parsedUserData.name || parsedUserData.guest?.name || "";
        const userPhone =
          parsedUserData.phoneNumber || parsedUserData.guest?.phoneNumber || "";
        const userEmail =
          parsedUserData.email || parsedUserData.guest?.email || "";
        const userWorkType =
          parsedUserData.workType || parsedUserData.guest?.workType || "";
        const userAdharPhoto =
          parsedUserData.adharCardPhoto ||
          parsedUserData.guest?.adharCardPhoto ||
          "";
        const userPhotoUrl =
          parsedUserData.userPhoto || parsedUserData.guest?.userPhoto || "";
        // Common user autofill for both
        setFullName(userName);
        setPhoneNumber(userPhone);
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
            email: userEmail || prev.email,
            workType: userWorkType || prev.workType,
            adharCardPhoto: userAdharPhoto || prev.adharCardPhoto,
            userPhoto: userPhotoUrl || prev.userPhoto,
          }));
          setTimeout(() => prefillFirstBedName(rooms, userName), 0);
          setHostelPlan(parsedPlan.name || "monthly");
          setAadhaarPhoto(userAdharPhoto || "");
          setUserPhoto(userPhotoUrl || "");
          const workTypeNormalized = userWorkType.toLowerCase();
          let purpose = "work"; // default
          if (workTypeNormalized.includes("student")) purpose = "student";
          else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
          else if (workTypeNormalized.includes("work")) purpose = "work";
          setPurposeType(purpose);
        }
        if (isTiffinBooking) {
          const parsedServiceData = safeParse(serviceDataStr);
          // Update serviceData for tiffin
          setServiceData((prev) => ({
            ...prev,
            serviceId: parsedServiceData.serviceId || parsedServiceData.id,
            serviceName:
              parsedServiceData.serviceName || parsedServiceData.name,
            price: parsedServiceData.price,
            foodType: parsedServiceData.foodType,
            mealPreferences: parsedServiceData.mealPreferences,
            orderTypes: parsedServiceData.orderTypes,
            pricing: parsedServiceData.pricing, // This is now used directly
            location:
              parsedServiceData.location || parsedServiceData.fullAddress,
              contactInfo: parsedServiceData.contactInfo,
            }));
            // FIXED: No prefill for meals or food type - start blank
            setSelectedfood("Both");
            setOrderType("delivery");
            if (parsedServiceData.serviceId) {
            
            const fetchTiffinService = async () => {
              try {
                const token = await AsyncStorage.getItem("token");
                if (!token) return;
                const response = await axios.get(
                  `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinServiceById/${parsedServiceData.serviceId}`,
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
          // Default date from params - but set to null for user selection
          setDate(null);
        }
      } catch (error) {
        console.error("Error in autofill useEffect:", error);
      }
    }
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
            setPickerItems([{ label: "Monthly", value: "monthly" }]);
            setCurrentPlanPrice(3200);
            setCurrentDeposit(5000);
            return;
          }
          response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelPricing/${serviceData.hostelId}`,
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
            setSecurityDeposit(data.securityDeposit || 0);
            setWeeklyDeposit(data.weeklyDeposit || 0);
            // Dynamically create picker items based on available plans
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
            // FIXED: Ensure at least monthly if no items
            if (items.length === 0) {
              items.push({ label: "Monthly", value: "monthly" });
            }
            setPickerItems(items);
            // Set initial price for monthly if available (will be multiplied by beds in price useEffect)
            if (data.pricing?.monthly > 0) {
              setCurrentPlanPrice(data.pricing.monthly);
              setCurrentDeposit(data.securityDeposit || 0);
            } else {
              // Default fallback
              setCurrentPlanPrice(3200);
              setCurrentDeposit(5000);
            }
          } else {
            console.error("API returned false success:", response.data.message);
            // FIXED: Set defaults on API failure
            setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
            setSecurityDeposit(5000);
            setWeeklyDeposit(1000);
            setPickerItems([{ label: "Monthly", value: "monthly" }]);
            setCurrentPlanPrice(3200);
            setCurrentDeposit(5000);
          }
        } else {
          // FIXED: Set defaults if no hostelId
          setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
          setSecurityDeposit(5000);
          setWeeklyDeposit(1000);
          setPickerItems([{ label: "Monthly", value: "monthly" }]);
          setCurrentPlanPrice(3200);
          setCurrentDeposit(5000);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
        // FIXED: Set defaults on error
        setPricingData({ daily: 0, weekly: 0, monthly: 3200 });
        setSecurityDeposit(5000);
        setWeeklyDeposit(1000);
        setPickerItems([{ label: "Monthly", value: "monthly" }]);
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
      newDeposit =
        hostelPlan === "weekly"
          ? weeklyDeposit
          : hostelPlan === "daily"
            ? 0
            : securityDeposit;
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
        daysToAdd = 30; // Approximate for a month
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
        daysToAdd = 30;
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
  const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === "ios");
    if (selectedDate) {
      // Same fix for check-out
      selectedDate.setHours(12, 0, 0, 0);
      setCheckOutDate(new Date(selectedDate));
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
    const selectedMeals = Object.entries(tiffinMeals)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    const mealPrefStr = selectedMeals.join(",");
    if (mealPrefStr === "") {
      setPlanError("Please select a meal package.");
      return;
    }
    let foodTypeStr = "";
    if (selectedfood === "Veg") foodTypeStr = "Veg";
    else if (selectedfood === "Non-Veg") foodTypeStr = "Non-Veg";
    else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";
    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);
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
        mealPreference: mealPrefStr,
        foodType: foodTypeStr,
        orderType: orderTypeStr,
      });
      const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${serviceData.serviceId}?${queryParams.toString()}`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const data = response.data.data;
        const newPricing = {
          perDay: data.pricing.perDay || 0,
          weekly: data.pricing.weekly || 0,
          monthly: data.pricing.monthly || 0,
          offers: data.offers || "",
        };
        setFetchedPricing(newPricing);
        // Check if no plans found
        const totalPricing = Object.values(newPricing).reduce(
          (acc, v) => acc + (typeof v === "number" ? v : 0),
          0
        );
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
    if (selectedMealPackage > 0) {
      handleGetPlanDetails();
    }
  }, [selectedMealPackage, selectedfood, orderType]);
  const handleBack = () => {
    router.back();
  };
  const handleTiffinSubmit = async () => {
    if (!validateTiffinForm()) {
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
        setErrors((prev) => ({ ...prev, general: "Service ID is missing!" }));
        return;
      }
      const combinedAddress = [
        street,
        landmark ? `${landmark},` : "",
        locality,
        `- ${pincode}`,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      const chooseOrderTypeStr =
        orderType === "delivery" ? "Delivery" : "Dining";
      const getFoodTypeStr = (food: string) =>
        food === "Both" ? "Both Veg & Non-Veg" : food;
      const foodTypeStr = getFoodTypeStr(selectedfood);
      const planNameMap: Record<string, string> = {
        perDay: "Per Day",
        weekly: "Weekly",
        monthly: "Monthly",
      };
      const selectedMealsForTiffin = Object.entries(tiffinMeals)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
      const plan = tiffinPlan;
      const planName =
        planNameMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
      const priceForThis = getBasePriceForPlan(plan);
      const selectTiffinNumberArray = [
        {
          tiffinNumber: 1,
          foodType: foodTypeStr,
          chooseOrderType: chooseOrderTypeStr,
          choosePlanType: {
            planName,
            price: priceForThis,
          },
          mealType: selectedMealsForTiffin,
        },
      ];
      if (selectTiffinNumberArray.length === 0) {
        setErrors((prev) => ({
          ...prev,
          general: "Please fill meal preferences!",
        }));
        return;
      }
      const filledNumTiffins = 1;
      const startDateISO = date ? new Date(date).toISOString() : "";
      const payload: any = {
        fullName,
        phoneNumber,
        address: combinedAddress,
        specialInstructions,
        numberOfTiffin: filledNumTiffins,
        selectTiffinNumber: selectTiffinNumberArray,
        date: startDateISO,
      };
      const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
      if (hasPeriodic) {
        const endDateISO = endDate ? new Date(endDate).toISOString() : "";
        payload.endDate = endDateISO;
      }
      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/create?tiffinServices=${serviceData.serviceId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        const bookingId = response.data.data._id;
        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "tiffin",
            bookingId,
            serviceId: serviceData.serviceId,
            totalPrice: currentPlanPrice.toString(),
            planType: "",
            startDate: startDateISO.split("T")[0] || "",
            endDate: payload.endDate
              ? (payload.endDate as string).split("T")[0]
              : "",
            mealPreference: selectedMealsForTiffin.join(","),
            foodType: selectedfood,
            orderType,
            numberOfTiffin: filledNumTiffins.toString(),
            fullName,
          },
        });
      } else {
        console.error(
          "Booking failed:",
          response.data.message || "Unknown error"
        );
        setErrors((prev) => ({
          ...prev,
          general:
            "Booking failed: " + (response.data.message || "Unknown error"),
        }));
      }
    } catch (error: any) {
      console.error(
        "Error creating tiffin booking:",
        error.response?.data || error.message
      );
      console.error("Full error object:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong while booking. Please try again.",
      }));
    }
  };
  const handleHostelSubmit = async () => {
    if (!validateHostelForm()) {
      // NEW: Auto-expand beds section if bed name errors are present for better UX
      const allBedKeys = serviceData.rooms.flatMap((room) =>
        room.beds.map((bed) => getBedKey(room.roomId, bed.bedId))
      );
      const hasMissingBedNames = allBedKeys.some(
        (key) => !bedNames[key]?.trim()
      );
      if (hasMissingBedNames) {
        // Note: expandedTiffin removed for tiffin, but for hostel we can use a separate state if needed
      }
      return;
    }
    setIsLoadingHostel(true);
    try {
      if (!serviceData.hostelId) {
        console.error("Error: Hostel ID is missing!");
        setErrors((prev) => ({ ...prev, general: "Hostel ID is missing!" }));
        return;
      }
      // NEW: No need for single roomId validation
      if (
        !serviceData.rooms ||
        serviceData.rooms.length === 0 ||
        totalBedsCount === 0
      ) {
        console.error("Error: No rooms or beds selected!");
        setErrors((prev) => ({
          ...prev,
          general: "Please select at least one bed across rooms!",
        }));
        return;
      }
      const token = await AsyncStorage.getItem("token");
      const guestId = await AsyncStorage.getItem("guestId");
      if (!token || !guestId) {
        console.error("Error: Authentication token or guest ID is missing!");
        setErrors((prev) => ({
          ...prev,
          general: "Authentication token or guest ID is missing!",
        }));
        return;
      }
      // FIXED: Use flat price and deposit for the plan (no per-bed division)
      const selectPlan = [
        {
          name: hostelPlan,
          price: currentPlanPrice,
          depositAmount: currentDeposit,
        },
      ];
      // UPDATED: Build rooms array from serviceData.rooms, ADD name to each bed
      const roomsPayload = serviceData.rooms.map((room: RoomData) => ({
        roomId: room.roomId,
        roomNumber: String(room.roomNumber || ""), // e.g., "101"
        bedNumber: room.beds.map((bed) => ({
          bedId: bed.bedId,
          bedNumber: bed.bedNumber,
          name: bedNames[getBedKey(room.roomId, bed.bedId)] || "", // From state
        })),
      }));
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phoneNumber", phoneNumber);
      formData.append("email", serviceData.email || "example@example.com");
      formData.append("checkInDate", checkInDate.toISOString());
      formData.append("checkOutDate", checkOutDate.toISOString());
      formData.append("workType", purposeType);
      formData.append("guestId", guestId);
      // Append rooms as JSON string (now with names)
      formData.append("rooms", JSON.stringify(roomsPayload));
      // Append plan as JSON string
      formData.append("selectPlan", JSON.stringify(selectPlan));
      // Append images as files (if selected)
      if (aadhaarPhoto) {
        formData.append("addharCardPhoto", {
          uri: aadhaarPhoto,
          type: "image/jpeg", // Adjust based on actual type (e.g., from result.type)
          name: "aadhar.jpg",
        } as any);
      }
      if (userPhoto) {
        formData.append("userPhoto", {
          uri: userPhoto,
          type: "image/jpeg",
          name: "user.jpg",
        } as any);
      }
      // NEW: API URL uses only hostelId (remove roomId query param)
      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createHostelBooking/${serviceData.hostelId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        // alert("Hostel booking created successfully!");
        const bookingId = response.data.data._id;
        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "hostel",
            bookingId,
            serviceId: serviceData.hostelId,
          },
        });
      } else {
        console.error(
          "Booking failed:",
          response.data.message || "Unknown error"
        );
        setErrors((prev) => ({
          ...prev,
          general:
            "Booking failed: " + (response.data.message || "Unknown error"),
        }));
      }
    } catch (error: any) {
      console.error(
        "Error creating hostel booking:",
        error.response?.data || error.message
      );
      console.error("Full error object:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong while booking. Please try again.",
      }));
    } finally {
      setIsLoadingHostel(false);
    }
  };
  // NEW: Bed name input handler (with sync for first bed)
  const handleBedNameChange = (
    roomId: string,
    bedId: string,
    text: string,
    isFirstBed: boolean
  ) => {
    const key = getBedKey(roomId, bedId);
    setBedNames((prev) => ({ ...prev, [key]: text }));
    clearError(key);
    if (isFirstBed) {
      setFullName(text); // Sync back to primary fullName
    }
  };
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
    const isFirstBed = (room: RoomData, bed: { bedId: string }) =>
      room === firstBedRoom && bed.bedId === firstBed?.bedId;
    return (
      <View style={styles.bedNamesSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => {
            // Toggle logic without expandedTiffin
            // You can add a separate state for hostel expansion if needed
          }}
        >
          <View style={styles.sectionHeaderContent}>
            <Image source={person} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>
              Selected Rooms & Guest Names
            </Text>
          </View>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        <View style={styles.expandedContent}>
          <Text style={styles.introText}>
            Assign names to each guest bed for a smooth booking process.
          </Text>
          {serviceData.rooms.map((room, roomIndex) => (
            <View key={room.roomId} style={styles.roomContainer}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomTitle}>Room {room.roomNumber}</Text>
                <Text style={styles.roomSubtitle}>
                  {room.beds.length} Guest(s)
                </Text>
              </View>
              {room.beds.map((bed, bedIndex) => {
                const bedKey = getBedKey(room.roomId, bed.bedId);
                const bedName = bedNames[bedKey] || "";
                const error = getBedNameError(bedKey);
                return (
                  <View
                    key={bed.bedId}
                    style={[styles.bedRow, error && styles.bedRowError]}
                  >
                    <View style={styles.bedAvatarContainer}>
                      <View style={styles.bedAvatar}>
                        <Image source={person} style={styles.bedAvatarIcon} />
                      </View>
                      <Text style={styles.bedNumberLabel}>
                        Bed {bed.bedNumber}
                      </Text>
                    </View>
                    <View style={styles.bedNameContainer}>
                      <TextInput
                        style={[
                          styles.bedNameInput,
                          error && styles.inputError,
                        ]}
                        placeholder={`Guest name for Bed ${bed.bedNumber}`}
                        value={bedName}
                        onChangeText={(text) =>
                          handleBedNameChange(
                            room.roomId,
                            bed.bedId,
                            text,
                            isFirstBed(room, bed)
                          )
                        }
                        onBlur={() => {
                          if (!bedName.trim()) {
                            setErrors((prev) => ({
                              ...prev,
                              [bedKey]: "Name is required for this bed!",
                            }));
                          }
                        }}
                      />
                      {error && <Text style={styles.errorText}>{error}</Text>}
                    </View>
                  </View>
                );
              })}
              {roomIndex < serviceData.rooms.length - 1 && (
                <View style={styles.roomDivider} />
              )}
            </View>
          ))}
          <View style={styles.totalGuestsFooter}>
            <Text style={styles.totalBedsText}>
              Total Guests: {totalBedsCount}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  // FIXED: Single plan options
  const getPlanOptions = () => {
    const options: { label: string; value: string }[] = [];
    if (fetchedPricing.perDay > 0) {
      options.push({
        label: `Per Day`,
        value: "perDay",
      });
    }
    if (fetchedPricing.weekly > 0) {
      options.push({
        label: `Weekly`,
        value: "weekly",
      });
    }
    if (fetchedPricing.monthly > 0) {
      options.push({
        label: `Monthly`,
        value: "monthly",
      });
    }
    // If no dynamic options, fallback to hardcoded
    if (options.length === 0) {
      return [
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
      ];
    }
    return options;
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
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setHostelPlan}
            items={pickerItems}
            placeholder={{ label: "Select Plan", value: null }}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
            }}
            value={hostelPlan}
          />
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            ₹{currentPlanPrice} /{" "}
            {(hostelPlan || "monthly").charAt(0).toUpperCase() +
              (hostelPlan || "monthly").slice(1)}
          </Text>
          <Text style={styles.depositText}>Deposit: ₹{currentDeposit}</Text>
        </View>
      </View>
      {/* Personal Info */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={person} style={styles.icon} />
          <Text style={styles.sectionTitle}> Personal Information</Text>
        </View>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            clearError("fullName");
            // NEW: Sync to first bed if exists
            const firstRoom = serviceData.rooms[0];
            if (firstRoom && firstRoom.beds[0]) {
              handleBedNameChange(
                firstRoom.roomId,
                firstRoom.beds[0].bedId,
                text,
                true
              );
            }
          }}
          onBlur={() => {
            if (!fullName.trim())
              setErrors((prev) => ({
                ...prev,
                fullName: "Full Name is required!",
              }));
          }}
        />
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName}</Text>
        )}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            clearError("phoneNumber");
          }}
          onBlur={() => {
            if (!phoneNumber.trim())
              setErrors((prev) => ({
                ...prev,
                phoneNumber: "Phone Number is required!",
              }));
          }}
        />
        {errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Aadhaar Card Photo *</Text>
        {aadhaarPhoto ? (
          <View style={{ position: "relative", marginTop: 10 }}>
            <Image
              source={{ uri: aadhaarPhoto }}
              style={{ width: 100, height: 100 }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setAadhaarPhoto("");
                clearError("aadhaarPhoto");
              }}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickAadhaarPhoto}
          >
            <Text style={styles.uploadButtonText}>Upload photo</Text>
            <Text style={styles.uploadSubtext}>
              Upload clear photo of your Aadhaar card
            </Text>
          </TouchableOpacity>
        )}
        {errors.aadhaarPhoto && (
          <Text style={styles.errorText}>{errors.aadhaarPhoto}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Your Photo *</Text>
        {userPhoto ? (
          <View style={{ position: "relative", marginTop: 10 }}>
            <Image
              source={{ uri: userPhoto }}
              style={{ width: 100, height: 100 }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setUserPhoto("");
                clearError("userPhoto");
              }}
            >
              <Text style={styles.closeText}>×</Text>
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
        {errors.userPhoto && (
          <Text style={styles.errorText}>{errors.userPhoto}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Booking Details</Text>
        <Text style={styles.label}>Check-in date *</Text>
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            errors.checkInDate && styles.inputError,
          ]}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkInDate
              ? checkInDate.toLocaleDateString("en-IN")
              : "DD/MM/YYYY"}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>
        {errors.checkInDate && (
          <Text style={styles.errorText}>{errors.checkInDate}</Text>
        )}
        <Text style={styles.label}>Check-out date *</Text>
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            errors.checkOutDate && styles.inputError,
          ]}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkOutDate
              ? checkOutDate.toLocaleDateString("en-IN")
              : "DD/MM/YYYY"}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>
        {errors.checkOutDate && (
          <Text style={styles.errorText}>{errors.checkOutDate}</Text>
        )}
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
        <Text style={[styles.label, { marginTop: 15 }]}>
          Special Instructions (Optional)
        </Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any special requests or messages"
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <View style={styles.section}>
          <Text style={styles.label}>User Stay Type</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-around",
              marginTop: 10,
            }}
          >
            {/* Work */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              onPress={() => setPurposeType("work")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "work" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Work</Text>
            </TouchableOpacity>
            {/* Leisure */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              onPress={() => setPurposeType("leisure")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "leisure" && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Leisure</Text>
            </TouchableOpacity>
            {/* Student */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              onPress={() => setPurposeType("student")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "student" && (
                  <View style={styles.radioInner} />
                )}
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
          <Text style={styles.submitButtonText}>Book Now</Text>
        )}
      </TouchableOpacity>
    </>
  );
  const renderTiffinBooking = () => {
    const hasPeriodic = ["weekly", "monthly"].includes(tiffinPlan);
    return (
      <>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={person} style={styles.icon} />
            <Text style={styles.sectionTitle}> Personal Information</Text>
          </View>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
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
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              clearError("phoneNumber");
            }}
            onBlur={() => {
              if (!phoneNumber.trim())
                setErrors((prev) => ({
                  ...prev,
                  phoneNumber: "Phone Number is required!",
                }));
            }}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={location1} style={styles.icon} />
            <Text style={styles.sectionTitle}> Delivery Address</Text>
          </View>
          <Text style={styles.label}>
            Street Address {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.street && styles.inputError,
              orderType === "dining" && { backgroundColor: "#eee" },
            ]}
            placeholder="Enter your street address"
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
            editable={orderType === "delivery"}
          />
          {errors.street && (
            <Text style={styles.errorText}>{errors.street}</Text>
          )}
          <Text style={styles.label}>Landmark (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              orderType === "dining" && { backgroundColor: "#eee" },
            ]}
            placeholder="Enter nearby landmark"
            value={landmark}
            onChangeText={(text) => {
              setLandmark(text);
              clearError("landmark");
            }}
            editable={orderType === "delivery"}
          />
          <Text style={styles.label}>
            Locality / Area {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.locality && styles.inputError,
              orderType === "dining" && { backgroundColor: "#eee" },
            ]}
            placeholder="Enter locality or area"
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
            editable={orderType === "delivery"}
          />
          {errors.locality && (
            <Text style={styles.errorText}>{errors.locality}</Text>
          )}
          <Text style={styles.label}>
            Pincode {orderType === "delivery" && "*"}
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.pincode && styles.inputError,
              orderType === "dining" && { backgroundColor: "#eee" },
            ]}
            placeholder="Enter pincode (6 digits)"
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
            editable={orderType === "delivery"}
          />
          {errors.pincode && (
            <Text style={styles.errorText}>{errors.pincode}</Text>
          )}
          <Text style={styles.label}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              { height: 80 },
              orderType === "dining" && { backgroundColor: "#eee" },
            ]}
            placeholder="Any dietary preferences, spice level, or special requests"
            multiline
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            editable={orderType === "delivery"}
          />
        </View>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={calender} style={styles.icon} />
            <Text style={styles.sectionTitle}> Booking Details</Text>
          </View>
          <View style={styles.tiffinSelectorsContainer}>
            <View style={styles.expandedContent}>
              {/* Food Type */}
              <Text style={styles.sectionTitle}>Food Type</Text>
              {currentFoodOptions.map((opt) => (
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
                    setOrderType(value as "dining" | "delivery");
                  }}
                />
              ))}
              {/* {planError ? (
                <Text style={styles.errorText}>{planError}</Text>
              ) : fetchedPricing.offers ? (
                <Text style={styles.offersText}>{fetchedPricing.offers}</Text>
              ) : null} */}
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
              {errors.mealPreferences && (
                <Text style={styles.errorText}>{errors.mealPreferences}</Text>
              )}
              <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
                Subscription Type
              </Text>
              {getPlanOptions().map((option) => (
                <RadioButton
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={tiffinPlan || ""}
                  onPress={(value) => {
                    setTiffinPlan(value);
                    clearError("plan");
                  }}
                />
              ))}
              {errors.plan && (
                <Text style={styles.errorText}>{errors.plan}</Text>
              )}
              {/* FIXED: Show price (dynamic) */}
              {tiffinPlan && (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>
                    ₹{getBasePriceForPlan(tiffinPlan)} /{" "}
                    {tiffinPlan === "perDay" ? "day" : tiffinPlan}
                  </Text>
                  <Text style={styles.depositText}>No Deposit</Text>
                </View>
              )}
              <Text style={[styles.label, { marginTop: 10 }]}>
                Select Start Date *
              </Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  errors.date && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {date ? date.toLocaleDateString("en-US") : "mm/dd/yyyy"}
                </Text>
                <Image source={calender} style={styles.calendarIcon} />
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
                  <Text style={styles.label}>Select End Date *</Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      errors.endDate && styles.inputError,
                    ]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {endDate
                        ? endDate.toLocaleDateString("en-US")
                        : "mm/dd/yyyy"}
                    </Text>
                    <Image source={calender} style={styles.calendarIcon} />
                  </TouchableOpacity>
                  {errors.endDate && (
                    <Text style={styles.errorText}>{errors.endDate}</Text>
                  )}
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
      <Header
        title={bookingType === "tiffin" ? "Tiffin Booking" : "Hostel Booking"}
        style={styles.header}
      />
      <View style={styles.container}>
        <ScrollView scrollEnabled={true} showsVerticalScrollIndicator={false}>
          {bookingType === "tiffin"
            ? renderTiffinBooking()
            : renderHostelBooking()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
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
    borderRadius: 6,
    marginBottom: 15,
  },
  pickerInput: {
    height: 51,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "black",
  },
  icon: {
    height: 18,
    width: 16,
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
  // UPDATED: Styles for bed names section (flattened: single cohesive card with dividers, no nested borders/radii)
  bedNamesSection: {
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    padding: 0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e3e8ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#004AAD",
  },
  expandedContent: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  roomDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
  totalGuestsFooter: {
    paddingVertical: 12,
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
  closeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});