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
import * as ImagePicker from 'expo-image-picker';
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

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // console.log("BookingScreen params:", params);
  const bookingType = (params.bookingType as BookingType) || "tiffin";
  console.log("bookingType:", bookingType);

  // Extract primitive strings for stable dependencies
  const serviceDataStr = params.serviceData || '{}'; // For tiffin
  const hostelDataStr = params.hostelData || '{}';
  const roomDataStr = params.roomData || '{}';
  const roomsDataStr = params.roomsData || '[]'; // NEW: For multiple rooms
  const userDataStr = params.userData || '{}';
  const planStr = params.plan || '{}';
  const selectedBedsStr = params.selectedBeds || '[]';
  const checkInDateStr = params.checkInDate || '';
  const checkOutDateStr = params.checkOutDate || '';
  const defaultDateStr = params.date || ''; // For tiffin default date
  const defaultPlanStr = params.defaultPlan || 'perMeal'; // e.g., 'monthly', 'weekly', 'perMeal'

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

  // Error states for better UX
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Tiffin plan errors per tiffin
  const [planErrors, setPlanErrors] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (let i = 1; i <= 4; i++) {
      initial[i] = '';
    }
    return initial;
  });

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
  const [pickerItems, setPickerItems] = useState([]); // For plan types (tiffin) or plans (hostel)
  // Tiffin-specific states
  // FIXED: Fixed to 4 tiffins, no dynamic number
  const [mealLabels, setMealLabels] = useState<Record<MealType, string>>({});
  // NEW: Per-tiffin fetched pricing
  const [fetchedPricings, setFetchedPricings] = useState<Record<number, {
    perBreakfast: number;
    perLunch: number;
    perMeal: number;
    weekly: number;
    monthly: number;
    offers: string;
  }>>(() => {
    const initial: Record<number, any> = {};
    for (let i = 1; i <= 4; i++) {
      initial[i] = { perBreakfast: 0, perLunch: 0, perMeal: 0, weekly: 0, monthly: 0, offers: '' };
    }
    return initial;
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [expandedTiffin, setExpandedTiffin] = useState<number | null>(null);
  const [applyToAllFor1, setApplyToAllFor1] = useState(false);
  const [tiffin2Option, setTiffin2Option] = useState<"sameAll" | "same1">("sameAll");
  // NEW: States for copy options
  const [sameAs1For2, setSameAs1For2] = useState(false);
  // NEW: For tiffin 3 and 4, use radio-like selection
  const [copyFor3, setCopyFor3] = useState<'1' | '2' | null>(null);
  const [copyFor4, setCopyFor4] = useState<'1' | '2' | '3' | null>(null);
  // NEW: Per-tiffin meal preferences (fixed to 4 tiffins)
  const [tiffinMeals, setTiffinMeals] = useState<Record<number, Record<MealType, boolean>>>(() => {
    const initial = {};
    for (let i = 1; i <= 4; i++) {
      initial[i] = { breakfast: false, lunch: false, dinner: false };
    }
    return initial;
  });
  // NEW: Per-tiffin plan types
  const [tiffinPlans, setTiffinPlans] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (let i = 1; i <= 4; i++) {
      initial[i] = '';
    }
    return initial;
  });

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
  const [purposeType, setPurposeType] = useState<"work" | "leisure" | "student">("work");
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");

  const ranAutofill = useRef(false);

  // NEW: Compute total beds across all rooms
  const totalBedsCount = useMemo(() => 
    serviceData.rooms.reduce((acc, room) => acc + (room.beds?.length || 0), 0), 
    [serviceData.rooms]
  );

  // Helper to clear errors for a field
  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // NEW: Helper for selected meals summary per tiffin
  const selectedMealsSummaryForNum = (num: number) => {
    const selectedMeals = Object.entries(tiffinMeals[num] || {})
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    return selectedMeals.join(", ");
  };

  // NEW: Helper to get base price for a plan and tiffin num
  const getBasePriceForPlan = (num: number, plan: string) => {
    const thisPricing = fetchedPricings[num];
    const pricingKey = plan as keyof typeof fetchedPricings[1];
    if (thisPricing && thisPricing[pricingKey] > 0) {
      return thisPricing[pricingKey];
    }
    // Hardcoded fallback
    switch (plan) {
      case "perBreakfast":
        return 120;
      case "perLunch":
        return 130;
      case "perMeal":
        return 120;
      case "weekly":
        return 800;
      case "monthly":
        return 3200;
      default:
        return 0;
    }
  };

  // Validate tiffin form
  const validateTiffinForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required!";
    if (orderType === "delivery" && !address.trim()) newErrors.address = "Address is required for delivery!";
    if (!date) newErrors.date = "Date is required!";
    const hasPeriodic = Object.values(tiffinPlans).some(p => ['weekly', 'monthly'].includes(p));
    if (hasPeriodic && (!endDate || endDate <= date)) newErrors.endDate = "End date is required and must be after start date!";
    if (!selectedfood) newErrors.selectedfood = "Food Type is required!";
    // FIXED: Check total meals across all tiffins
    const totalSelectedMeals = Object.values(tiffinMeals).reduce((acc: number, meals) => {
      return acc + Object.values(meals || {}).filter((v: boolean) => v).length;
    }, 0);
    if (totalSelectedMeals === 0) newErrors.mealPreferences = "At least one meal preference is required!";
    // NEW: Validate plan for each filled tiffin
    for (let i = 1; i <= 4; i++) {
      const hasMeals = Object.values(tiffinMeals[i] || {}).some((v: boolean) => v);
      if (hasMeals && !tiffinPlans[i]) {
        newErrors[`plan${i}`] = `Plan type is required for Tiffin ${i}!`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate hostel form
  const validateHostelForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required!";
    if (!checkInDate) newErrors.checkInDate = "Check-in date is required!";
    if (!checkOutDate) newErrors.checkOutDate = "Check-out date is required!";
    if (checkInDate && checkOutDate && checkInDate >= checkOutDate) newErrors.checkOutDate = "Check-out date must be after Check-in date!";
    if (!aadhaarPhoto) newErrors.aadhaarPhoto = "Aadhaar Card Photo is required!";
    if (!userPhoto) newErrors.userPhoto = "User Photo is required!";
    // NEW: Validate at least one room with beds
    if (!serviceData.rooms || serviceData.rooms.length === 0 || !serviceData.rooms.some(r => r.beds && r.beds.length > 0)) {
      newErrors.rooms = "Please select at least one bed across rooms!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    console.log("=== Autofill useEffect triggered ===");
    console.log("bookingType:", bookingType);

    const isHostelBooking = bookingType === "hostel" || bookingType === "reserve";
    const isTiffinBooking = bookingType === "tiffin";

    if ((isHostelBooking || isTiffinBooking) && !ranAutofill.current) {
      ranAutofill.current = true;
      try {
        const parsedUserData = JSON.parse(userDataStr);
        console.log("Parsed User Data:", parsedUserData);

        // Handle user data structure: direct or nested under 'guest'
        const userName = parsedUserData.name || parsedUserData.guest?.name || '';
        const userPhone = parsedUserData.phoneNumber || parsedUserData.guest?.phoneNumber || '';
        const userEmail = parsedUserData.email || parsedUserData.guest?.email || '';
        const userWorkType = parsedUserData.workType || parsedUserData.guest?.workType || '';
        const userAdharPhoto = parsedUserData.adharCardPhoto || parsedUserData.guest?.adharCardPhoto || '';
        const userPhotoUrl = parsedUserData.userPhoto || parsedUserData.guest?.userPhoto || '';

        // Common user autofill for both
        setFullName(userName);
        setPhoneNumber(userPhone);

        if (isHostelBooking) {
          const parsedHostelData = JSON.parse(hostelDataStr);
          const parsedPlan = JSON.parse(planStr);

          console.log("Parsed Hostel Data:", parsedHostelData);
          console.log("Parsed Plan:", parsedPlan);

          // NEW: Handle multiple rooms via roomsData, fallback to single room
          let rooms: RoomData[] = [];
          try {
            const parsedRoomsData = JSON.parse(roomsDataStr);
            if (Array.isArray(parsedRoomsData) && parsedRoomsData.length > 0) {
              rooms = parsedRoomsData;
              console.log("Parsed Multiple Rooms Data:", parsedRoomsData);
            } else {
              // Backward compat: single room
              const parsedRoomData = JSON.parse(roomDataStr);
              const parsedSelectedBeds = JSON.parse(selectedBedsStr);
              rooms = [{
                roomId: parsedRoomData._id,
                roomNumber: parsedRoomData.roomNumber,
                beds: parsedSelectedBeds, // [{bedId, bedNumber}]
              }];
              console.log("Parsed Single Room Data:", parsedRoomData);
              console.log("Parsed Selected Beds:", parsedSelectedBeds);
            }
          } catch (parseErr) {
            console.error("Error parsing rooms data:", parseErr);
            rooms = [];
          }

          // Update serviceData with minimal data
          setServiceData(prev => ({
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

          console.log("Extracted Hostel ID:", parsedHostelData.id);
          console.log("Total Rooms:", rooms.length);

          // Autofill other fields (except check-in and check-out dates)
          setHostelPlan(parsedPlan.name || "monthly");
          setAadhaarPhoto(userAdharPhoto || "");
          setUserPhoto(userPhotoUrl || "");
          // Set dates if provided
          if (checkInDateStr) setCheckInDate(new Date(checkInDateStr));
          if (checkOutDateStr) setCheckOutDate(new Date(checkOutDateStr));
          // FIXED: Better mapping for purposeType from userWorkType (handles casing and "leisure")
          const workTypeNormalized = userWorkType.toLowerCase();  // Normalize for matching
          let purpose = "work";  // default
          if (workTypeNormalized.includes("student")) purpose = "student";
          else if (workTypeNormalized.includes("leisure")) purpose = "leisure";
          else if (workTypeNormalized.includes("work")) purpose = "work";
          setPurposeType(purpose);
        }

        if (isTiffinBooking) {
          const parsedServiceData = JSON.parse(serviceDataStr);
          console.log("Parsed Tiffin Service Data:", parsedServiceData);

          // Update serviceData for tiffin
          setServiceData(prev => ({
            ...prev,
            serviceId: parsedServiceData.serviceId || parsedServiceData.id,
            serviceName: parsedServiceData.serviceName || parsedServiceData.name,
            price: parsedServiceData.price,
            foodType: parsedServiceData.foodType,
            mealPreferences: parsedServiceData.mealPreferences,
            orderTypes: parsedServiceData.orderTypes,
            pricing: parsedServiceData.pricing, // This is now used directly
            location: parsedServiceData.location || parsedServiceData.fullAddress,
            contactInfo: parsedServiceData.contactInfo,
          }));

          // FIXED: No prefill for meals or food type - start blank
          setSelectedfood("Both");
          setOrderType("delivery");
          // Set meal labels with timings (service info, keep)
          const mealLabelMap: Record<MealType, string> = { breakfast: '', lunch: '', dinner: '' };
          parsedServiceData.mealPreferences?.forEach((meal: any) => {
            const key = meal.type.toLowerCase() as MealType;
            if (key in mealLabelMap) {
              mealLabelMap[key] = `${meal.type} ${meal.time}`;
            }
          });
          setMealLabels(mealLabelMap);
          // Default date from params - but set to null for user selection
          setDate(null);
        }

        console.log("Autofill completed");
      } catch (error) {
        console.error("Error parsing params for autofill:", error);
      }
    }
  }, [bookingType, serviceDataStr, hostelDataStr, roomDataStr, roomsDataStr, userDataStr, planStr, selectedBedsStr, defaultDateStr, checkInDateStr, checkOutDateStr]);


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
        if ((bookingType === "hostel" || bookingType === "reserve") && serviceData.hostelId) {
          response = await axios.get(
            `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getHostelPricing/${serviceData.hostelId}`,
            {
              headers: {
                "Content-Type": "application/json",
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
            setPickerItems(items);

            // Set initial price for monthly if available (will be multiplied by beds in price useEffect)
            if (data.pricing?.monthly > 0) {
              setCurrentPlanPrice(data.pricing.monthly);
              setCurrentDeposit(data.securityDeposit || 0);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
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

    console.log("Price useEffect: orderType", orderType);

    if (bookingType === "tiffin") {
      // FIXED: Sum prices across filled tiffins with their specific plans
      for (let i = 1; i <= 4; i++) {
        const hasMeals = Object.values(tiffinMeals[i] || {}).some(Boolean);
        const plan = tiffinPlans[i];
        if (hasMeals && plan) {
          newPrice += getBasePriceForPlan(i, plan);
        }
      }
      console.log("final newPrice:", newPrice);
      newDeposit = 0; // No deposit for tiffin
    } else {
      // FIXED: For hostel, use flat rate (no multiplication by beds)
      const basePlanPrice = hostelPlan === "daily" ? pricingData.daily : hostelPlan === "weekly" ? pricingData.weekly : pricingData.monthly;
      newPrice = basePlanPrice;
     newDeposit = hostelPlan === "weekly" ? weeklyDeposit : hostelPlan === "daily" ? 0 : securityDeposit;
    }

    console.log(`💰 Updated prices - Total: ₹${newPrice}, Deposit: ₹${newDeposit}`);
    setCurrentPlanPrice(newPrice);
    setCurrentDeposit(newDeposit);
  }, [
    orderType,
    bookingType,
    hostelPlan,
    pricingData,
    securityDeposit,
    weeklyDeposit,
    tiffinMeals,  // FIXED: Depend on full tiffinMeals for filled count
    fetchedPricings,
    tiffinPlans, // NEW: Depend on per-tiffin plans
    totalBedsCount, // NEW: For hostel pricing
  ]);

  // Auto-fill check-out date based on check-in and plan (for hostel)
  useEffect(() => {
    if (checkInDate && hostelPlan) {
      let daysToAdd = 0;
      if (hostelPlan === 'daily') {
        daysToAdd = 1;
      } else if (hostelPlan === 'weekly') {
        daysToAdd = 7;
      } else if (hostelPlan === 'monthly') {
        daysToAdd = 30; // Approximate for a month
      }

      const newCheckOut = new Date(checkInDate);
      newCheckOut.setDate(newCheckOut.getDate() + daysToAdd);
      setCheckOutDate(newCheckOut);
    }
  }, [checkInDate, hostelPlan]);

  // FIXED: Auto-fill end date based on start date and plans (for tiffin weekly/monthly, if any)
  useEffect(() => {
    const periodicPlans = Object.values(tiffinPlans).filter(p => ['weekly', 'monthly'].includes(p));
    if (date && periodicPlans.length > 0) {
      // Assume all periodic are same type, take first
      const firstPeriodic = periodicPlans[0];
      let daysToAdd = 0;
      if (firstPeriodic === 'weekly') {
        daysToAdd = 7;
      } else if (firstPeriodic === 'monthly') {
        daysToAdd = 30;
      }
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
    } else {
      setEndDate(null); // Clear end date if no periodic plans
    }
  }, [date, tiffinPlans]);

  // Helper functions
  const toggleMealPreference = (num: number, meal: MealType) => {
    setTiffinMeals((prev) => ({
      ...prev,
      [num]: {
        ...prev[num],
        [meal]: !prev[num][meal]
      }
    }));
  };

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
      setCheckInDate(selectedDate);
      // Auto-fill check-out will happen via useEffect
    }
  };

  const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === "ios");
    if (selectedDate) setCheckOutDate(selectedDate);
  };

  // NEW: Image picker functions for hostel uploads
  const pickAadhaarPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setAadhaarPhoto(result.assets[0].uri);
      clearError('aadhaarPhoto');
    }
  };

  const pickUserPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      clearError('userPhoto');
    }
  };

  // FIXED: Per-tiffin plan details fetch
  const handleGetPlanDetails = async (num: number) => {
    const selectedMeals = Object.entries(tiffinMeals[num] || {})
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    const mealPrefStr = selectedMeals.join(',');
    if (mealPrefStr === '') {
      setPlanErrors(prev => ({ ...prev, [num]: 'Please select at least one meal preference.' }));
      return;
    }

    let foodTypeStr = '';
    if (selectedfood === 'Veg') foodTypeStr = 'Veg';
    else if (selectedfood === 'Non-Veg') foodTypeStr = 'Non-Veg';
    else if (selectedfood === 'Both') foodTypeStr = 'Both Veg & Non-Veg';

    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setPlanErrors(prev => ({ ...prev, [num]: 'Authentication required.' }));
      return;
    }

    if (!serviceData.serviceId) {
      setPlanErrors(prev => ({ ...prev, [num]: 'Service ID not available.' }));
      return;
    }

    setIsFetchingDetails(true);
    setPlanErrors(prev => ({ ...prev, [num]: '' }));
    try {
      const queryParams = new URLSearchParams({
        mealPreference: mealPrefStr,
        foodType: foodTypeStr,
        orderType: orderTypeStr,
      });

      const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${serviceData.serviceId}?${queryParams.toString()}`;
      console.log("🔗 Full API URL:", url);

      const response = await axios.get(url, {
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
      });

      console.log(`📥 Response:`, JSON.stringify(response, null, 2));

      if (response.data.success) {
        const data = response.data.data;
        const newPricing = {
          perBreakfast: data.pricing.perBreakfast || 0,
          perLunch: data.pricing.perLunch || 0,
          perMeal: data.pricing.perMeal || 0,
          weekly: data.pricing.weekly || 0,
          monthly: data.pricing.monthly || 0,
          offers: data.offers || '',
        };
        setFetchedPricings(prev => ({ ...prev, [num]: newPricing }));
        // Check if no plans found
        const totalPricing = Object.values(newPricing).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
        if (totalPricing === 0) {
          setPlanErrors(prev => ({ ...prev, [num]: 'No plans available for your selected preferences. Please try different options.' }));
        } else {
          setPlanErrors(prev => ({ ...prev, [num]: '' }));
        }
        console.log(`✅ Fetched details:`, data);
      } else {
        console.log(`❌ API false:`, response.data.message);
        setPlanErrors(prev => ({ ...prev, [num]: 'Failed to fetch plan details: ' + response.data.message }));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Error: Status ${error.response?.status}, Data:`, error.response?.data);
        setPlanErrors(prev => ({ ...prev, [num]: 'Failed to fetch plan details: ' + (error.response?.data?.message || 'Network error') }));
      } else {
        console.error(`❌ Non-Axios error:`, error);
        setPlanErrors(prev => ({ ...prev, [num]: 'Failed to fetch plan details.' }));
      }
    } finally {
      setIsFetchingDetails(false);
    }
  };

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
      setErrors(prev => ({ ...prev, general: "Authentication token is missing!" }));
      return;
    }

    if (!serviceData.serviceId) {
      setErrors(prev => ({ ...prev, general: "Service ID is missing!" }));
      return;
    }

    const chooseOrderTypeStr = orderType === "delivery" ? "Delivery" : "Dining";

    const foodTypeMap = {
      Veg: "Veg",
      "Non-Veg": "Non-Veg",
      Both: "Both"
    };
    const foodTypeStr = foodTypeMap[selectedfood as keyof typeof foodTypeMap] || "Veg";

    const planNameMap: Record<string, string> = {
      perBreakfast: "Per Breakfast",
      perLunch: "Per Lunch",
      perMeal: "Per Meal",
      weekly: "Weekly",
      monthly: "Monthly"
    };

    const selectTiffinNumberArray = [];

    for (let i = 1; i <= 4; i++) {
      const selectedMealsForTiffin = Object.entries(tiffinMeals[i] || {})
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));

    
      if (selectedMealsForTiffin.length > 0) {
        const plan = tiffinPlans[i];
        const planName = planNameMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
        const priceForThis = getBasePriceForPlan(i, plan);

        const tiffinObj = {
          tiffinNumber: i,
          foodType: foodTypeStr,
          chooseOrderType: chooseOrderTypeStr,
          choosePlanType: {
            planName,
            price: priceForThis
          },
          
          mealType: selectedMealsForTiffin
        };

        selectTiffinNumberArray.push(tiffinObj);
      }
    }

    if (selectTiffinNumberArray.length === 0) {
      setErrors(prev => ({ ...prev, general: "Please fill meal preferences for at least one tiffin!" }));
      return;
    }

    const filledNumTiffins = selectTiffinNumberArray.length;
    const startDateISO = date ? new Date(date).toISOString() : '';

    const payload: any = {
      fullName,
      phoneNumber,
      address,
      specialInstructions,
      numberOfTiffin: filledNumTiffins,
      selectTiffinNumber: selectTiffinNumberArray,
      date: startDateISO,
    };

    const hasPeriodic = Object.values(tiffinPlans).some(p => ['weekly', 'monthly'].includes(p));
    if (hasPeriodic) {
      const endDateISO = endDate ? new Date(endDate).toISOString() : '';
      payload.endDate = endDateISO;
    }

    console.log("Tiffin Booking Payload:", JSON.stringify(payload, null, 2));

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

    console.log("API Response:", response.data);

    if (response.data.success) {
      console.log("Tiffin booking successful:", response.data.data);
      const bookingId = response.data.data._id;

      router.push({
        pathname: "/check-out",
        params: {
          serviceType: "tiffin",
          bookingId,
          serviceId: serviceData.serviceId,
          totalPrice: currentPlanPrice.toString(),
          planType: '',
          startDate: startDateISO.split('T')[0] || '',
          endDate: payload.endDate ? (payload.endDate as string).split('T')[0] : '',
          mealPreference: Object.entries(tiffinMeals[1] || {})
            .filter(([_, checked]) => checked)
            .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1))
            .join(','),
          foodType: selectedfood,
          orderType,
          numberOfTiffin: filledNumTiffins.toString(),
          fullName,
        },
      });
    } else {
      console.error("Booking failed:", response.data.message || "Unknown error");
      setErrors(prev => ({
        ...prev,
        general: "Booking failed: " + (response.data.message || "Unknown error"),
      }));
    }
  } catch (error: any) {
    console.error("Error creating tiffin booking:", error.response?.data || error.message);
    console.error("Full error object:", error);
    setErrors(prev => ({
      ...prev,
      general: "Something went wrong while booking. Please try again.",
    }));
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

    if (validateHostelForm()) {
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
        const selectPlan = [
          {
            name: hostelPlan,
            price: currentPlanPrice,
            depositAmount: currentDeposit,
          },
        ];

        // NEW: Build rooms array from serviceData.rooms
        const roomsPayload = serviceData.rooms.map((room: RoomData) => ({
          roomId: room.roomId,
          roomNumber: String(room.roomNumber || ""), // e.g., "101"
          bedNumber: room.beds, // Already [{bedId, bedNumber}]
        }));

        const bookingPayload = {
          fullName,
          phoneNumber,
          email: serviceData.email || "example@example.com",
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          selectPlan,
          addharCardPhoto: aadhaarPhoto || null,
          userPhoto: userPhoto || null,
          guestId,
          rooms: roomsPayload,
        };

        // FIXED: Add workType as the selected purposeType string (shows "work", "leisure", or "student" in response)
        bookingPayload.workType = purposeType;

        console.log("Full Booking Payload:", JSON.stringify(bookingPayload, null, 2));

        // NEW: API URL uses only hostelId (remove roomId query param)
        const response = await axios.post(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createHostelBooking/${serviceData.hostelId}`,
          bookingPayload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API Response:", response.data);

        if (response.data.success) {
          console.log("Booking successful:", response.data.data);
          // alert("Hostel booking created successfully!");

          const bookingId = response.data.data._id;

          console.log("Navigating to checkout with booking ID:", bookingId);

          router.push({
            pathname: "/check-out",
            params: {
              serviceType: "hostel",
              bookingId,
              serviceId: serviceData.hostelId,
            },
          });
        } else {
          console.error("Booking failed:", response.data.message || "Unknown error");
          setErrors(prev => ({ ...prev, general: "Booking failed: " + (response.data.message || "Unknown error") }));
        }
      } catch (error: any) {
        console.error("Error creating hostel booking:", error.response?.data || error.message);
        console.error("Full error object:", error);
        setErrors(prev => ({ ...prev, general: "Something went wrong while booking. Please try again." }));
      }
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

  // NEW: Helper to render selected rooms summary
  const selectedRoomsSummary = useMemo(() => {
    if (serviceData.rooms.length === 0) return null;
    return serviceData.rooms.map(room => 
      `${room.roomNumber} (Beds: ${room.beds.map(b => b.bedNumber).join(', ')})`
    ).join(', ');
  }, [serviceData.rooms]);

  // FIXED: Per-tiffin plan options
  const getPlanOptionsForNum = (num: number) => {
    const thisPricing = fetchedPricings[num];
    const options: { label: string; value: string }[] = [];
    if (thisPricing.perBreakfast > 0) {
      options.push({ label: `Per Breakfast (₹${thisPricing.perBreakfast} / per breakfast)`, value: "perBreakfast" });
    }
    if (thisPricing.perLunch > 0) {
      options.push({ label: `Per Lunch (₹${thisPricing.perLunch} / per lunch)`, value: "perLunch" });
    }
    if (thisPricing.perMeal > 0) {
      options.push({ label: `Per Meal (₹${thisPricing.perMeal}/meal)`, value: "perMeal" });
    }
    if (thisPricing.weekly > 0) {
      options.push({ label: `Weekly (₹${thisPricing.weekly}/weekly)`, value: "weekly" });
    }
    if (thisPricing.monthly > 0) {
      options.push({ label: `Monthly (₹${thisPricing.monthly}/monthly)`, value: "monthly" });
    }
    // If no dynamic options, fallback to hardcoded
    if (options.length === 0) {
      return hardcodedPlanOptions;
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

        {/* NEW: Display selected rooms/beds */}
        {selectedRoomsSummary && (
          <View style={styles.selectedRoomsContainer}>
            <Text style={styles.label}>Selected Rooms</Text>
            <Text style={styles.selectedRoomsText}>{selectedRoomsSummary}</Text>
            <Text style={styles.totalBedsText}>Total Beds: {totalBedsCount}</Text>
          </View>
        )}

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
            clearError('fullName');
          }}
          onBlur={() => {
            if (!fullName.trim()) setErrors(prev => ({ ...prev, fullName: "Full Name is required!" }));
          }}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            clearError('phoneNumber');
          }}
          onBlur={() => {
            if (!phoneNumber.trim()) setErrors(prev => ({ ...prev, phoneNumber: "Phone Number is required!" }));
          }}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Aadhaar Card Photo *</Text>
        {aadhaarPhoto ? (
          <View style={{ position: 'relative', marginTop: 10 }}>
            <Image source={{ uri: aadhaarPhoto }} style={{ width: 100, height: 100 }} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setAadhaarPhoto('');
                clearError('aadhaarPhoto');
              }}
            >
              <Text style={styles.closeText}>×</Text>
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
        {errors.aadhaarPhoto && <Text style={styles.errorText}>{errors.aadhaarPhoto}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Your Photo *</Text>
        {userPhoto ? (
          <View style={{ position: 'relative', marginTop: 10 }}>
            <Image source={{ uri: userPhoto }} style={{ width: 100, height: 100 }} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setUserPhoto('');
                clearError('userPhoto');
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
        {errors.userPhoto && <Text style={styles.errorText}>{errors.userPhoto}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Booking Details</Text>

        <Text style={styles.label}>Check-in date *</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, errors.checkInDate && styles.inputError]}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkInDate ? checkInDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>
        {errors.checkInDate && <Text style={styles.errorText}>{errors.checkInDate}</Text>}

        <Text style={styles.label}>Check-out date *</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, errors.checkOutDate && styles.inputError]}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkOutDate ? checkOutDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>
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
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {/* Work */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
              onPress={() => setPurposeType("work")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "work" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Work</Text>
            </TouchableOpacity>

            {/* Leisure */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
              onPress={() => setPurposeType("leisure")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "leisure" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Leisure</Text>
            </TouchableOpacity>

            {/* Student */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
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
        style={styles.submitButton}
        onPress={handleHostelSubmit}
      >
        <Text style={styles.submitButtonText}>Book Now</Text>
      </TouchableOpacity>
    </>
  );

  // Hardcoded plan options for fallback
  const hardcodedPlanOptions = [
    { label: "Per Breakfast (₹120 / per breakfast)", value: "perBreakfast" },
    { label: "Per Lunch (₹130 / per lunch)", value: "perLunch" },
    { label: "Per Meal (₹120/meal)", value: "perMeal" },
    { label: "Weekly (₹800/weekly) save 15%", value: "weekly" },
    { label: "Monthly (₹3200/monthly) save 15%", value: "monthly" },
  ];

  const renderTiffinBooking = () => {
    const hasPeriodic = Object.values(tiffinPlans).some(p => ['weekly', 'monthly'].includes(p));
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
              clearError('fullName');
            }}
            onBlur={() => {
              if (!fullName.trim()) setErrors(prev => ({ ...prev, fullName: "Full Name is required!" }));
            }}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              clearError('phoneNumber');
            }}
            onBlur={() => {
              if (!phoneNumber.trim()) setErrors(prev => ({ ...prev, phoneNumber: "Phone Number is required!" }));
            }}
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={location1} style={styles.icon} />
            <Text style={styles.sectionTitle}> Delivery Address</Text>
          </View>
          <Text style={styles.label}>Address {orderType === "delivery" && "*"}</Text>
          <TextInput
            style={[
              styles.input,
              errors.address && styles.inputError,
              orderType === "dining" && { backgroundColor: "#eee" }
            ]}
            placeholder="Enter your full address"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              clearError('address');
            }}
            onBlur={() => {
              if (orderType === "delivery" && !address.trim()) setErrors(prev => ({ ...prev, address: "Address is required for delivery!" }));
            }}
            editable={orderType === "delivery"}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          <Text style={styles.label}>Special Instructions (Optional)</Text>
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
          {/* FIXED: Removed picker for number of tiffins; fixed to 4 */}
          <View style={styles.tiffinSelectorsContainer}>
            {Array.from({ length: 4 }, (_, index) => index + 1).map((num) => {
              const isExpanded = expandedTiffin === num;
              return (
                <View key={num}>
                  <TouchableOpacity
                    style={styles.tiffinDropdown}
                    onPress={() => setExpandedTiffin(prev => prev === num ? null : num)}
                  >
                    <Text style={styles.tiffinDropdownLabel}>Select Tiffin {num}</Text>
                    <Text style={styles.dropdownIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* NEW: Apply Pref section (conditional based on num) */}
                      <Text style={styles.sectionTitle}>Apply Pref</Text>
                      {num === 1 && true && (
                        <View style={styles.checkboxRow}>
                          <Checkbox
                            checked={applyToAllFor1}
                            onPress={() => {
                              const newVal = !applyToAllFor1;
                              setApplyToAllFor1(newVal);
                              if (newVal) {
                                const pref1 = tiffinMeals[1];
                                setTiffinMeals(prev => {
                                  const updated = { ...prev };
                                  for (let j = 2; j <= 4; j++) {
                                    updated[j] = { ...pref1 };
                                  }
                                  return updated;
                                });
                              }
                            }}
                          />
                          <Text style={styles.checkboxLabel}>same for all</Text>
                        </View>
                      )}
                      {num === 2 && true && (
                        <View style={styles.checkboxRow}>
                          <Checkbox
                            checked={sameAs1For2}
                            onPress={() => {
                              const newVal = !sameAs1For2;
                              setSameAs1For2(newVal);
                              if (newVal) {
                                setTiffinMeals(prev => ({
                                  ...prev,
                                  2: { ...prev[1] }
                                }));
                              }
                            }}
                          />
                          <Text style={styles.checkboxLabel}>same as 1</Text>
                        </View>
                      )}
                      {num === 3 && true && (
                        <>
                          <RadioButton
                            label="same as 1"
                            value="1"
                            selected={copyFor3 || ''}
                            onPress={(value) => {
                              setCopyFor3(value as '1');
                              setTiffinMeals(prev => ({
                                ...prev,
                                3: { ...prev[1] }
                              }));
                            }}
                          />
                          <RadioButton
                            label="same as 2"
                            value="2"
                            selected={copyFor3 || ''}
                            onPress={(value) => {
                              setCopyFor3(value as '2');
                              setTiffinMeals(prev => ({
                                ...prev,
                                3: { ...prev[2] }
                              }));
                            }}
                          />
                        </>
                      )}
                      {num === 4 && true && (
                        <>
                          <RadioButton
                            label="same as 1"
                            value="1"
                            selected={copyFor4 || ''}
                            onPress={(value) => {
                              setCopyFor4(value as '1');
                              setTiffinMeals(prev => ({
                                ...prev,
                                4: { ...prev[1] }
                              }));
                            }}
                          />
                          <RadioButton
                            label="same as 2"
                            value="2"
                            selected={copyFor4 || ''}
                            onPress={(value) => {
                              setCopyFor4(value as '2');
                              setTiffinMeals(prev => ({
                                ...prev,
                                4: { ...prev[2] }
                              }));
                            }}
                          />
                          <RadioButton
                            label="same as 3"
                            value="3"
                            selected={copyFor4 || ''}
                            onPress={(value) => {
                              setCopyFor4(value as '3');
                              setTiffinMeals(prev => ({
                                ...prev,
                                4: { ...prev[3] }
                              }));
                            }}
                          />
                        </>
                      )}
                      {/* Meal Preference section for all */}
                      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Meal Preference</Text>
                      {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
                        <View style={styles.checkboxRow} key={meal}>
                          <Checkbox
                            checked={tiffinMeals[num]?.[meal] || false}
                            onPress={() => toggleMealPreference(num, meal)}
                          />
                          <Text style={styles.checkboxLabel}>
                            {mealLabels[meal] || (meal.charAt(0).toUpperCase() + meal.slice(1))}
                          </Text>
                        </View>
                      ))}
                      {selectedMealsSummaryForNum(num) && (
                        <Text style={[styles.label, { fontSize: 12, color: "#666", marginTop: 5 }]}>
                          Selected: {selectedMealsSummaryForNum(num)}
                        </Text>
                      )}
                      {num === 1 && errors.mealPreferences && <Text style={styles.errorText}>{errors.mealPreferences}</Text>}
                      
                      {/* FIXED: Other options now shown for ALL tiffins (global state, but visible everywhere) */}
                      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Food Type</Text>
                      <RadioButton
                        label="Veg"
                        value="Veg"
                        selected={selectedfood}
                        onPress={(value) => {
                          setSelectedfood(value);
                          clearError('selectedfood');
                        }}
                      />
                      <RadioButton
                        label="Non-Veg"
                        value="Non-Veg"
                        selected={selectedfood}
                        onPress={(value) => {
                          setSelectedfood(value);
                          clearError('selectedfood');
                        }}
                      />
                      <RadioButton
                        label="Both Veg & Non-Veg"
                        value="Both"
                        selected={selectedfood}
                        onPress={(value) => {
                          setSelectedfood(value);
                          clearError('selectedfood');
                        }}
                      />
                      {errors.selectedfood && <Text style={styles.errorText}>{errors.selectedfood}</Text>}

                      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Choose Order Type</Text>
                      {["dining", "delivery"].map((type) => (
                        <View style={styles.checkboxRow} key={type}>
                          <TouchableOpacity
                            style={[
                              styles.checkboxBase,
                              orderType === type && styles.checkboxSelected,
                            ]}
                            onPress={() => setOrderType(type as any)}
                          >
                            {orderType === type && <Text style={styles.checkMark}>✓</Text>}
                          </TouchableOpacity>
                          <Text style={styles.checkboxLabel}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </View>
                      ))}

                      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Get Plan Details</Text>
                      <TouchableOpacity
                        style={[
                          styles.submitButton,
                          (Object.values(tiffinMeals[num] || {}).filter(Boolean).length === 0 || isFetchingDetails) && styles.disabledButton
                        ]}
                        onPress={() => handleGetPlanDetails(num)}
                        disabled={Object.values(tiffinMeals[num] || {}).filter(Boolean).length === 0 || isFetchingDetails}
                      >
                        {isFetchingDetails ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitButtonText}>Get Plan Details</Text>
                        )}
                      </TouchableOpacity>
                      {planErrors[num] ? (
                        <Text style={styles.errorText}>{planErrors[num]}</Text>
                      ) : fetchedPricings[num].offers ? (
                        <Text style={styles.offersText}>{fetchedPricings[num].offers}</Text>
                      ) : null}

                      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Choose Plan Type</Text>
                      {getPlanOptionsForNum(num).map((option) => (
                        <RadioButton
                          key={option.value}
                          label={option.label}
                          value={option.value}
                          selected={tiffinPlans[num] || ''}
                          onPress={(value) => {
                            setTiffinPlans((prev) => ({ ...prev, [num]: value }));
                            clearError(`plan${num}`);
                          }}
                        />
                      ))}
                      {errors[`plan${num}`] && <Text style={styles.errorText}>{errors[`plan${num}`]}</Text>}

                      {/* FIXED: Show per-tiffin price under each tiffin (dynamic) */}
                      {tiffinPlans[num] && (
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>
                            ₹{getBasePriceForPlan(num, tiffinPlans[num])} / {tiffinPlans[num].charAt(0).toUpperCase() + tiffinPlans[num].slice(1)}
                          </Text>
                          <Text style={styles.depositText}>
                            No Deposit
                          </Text>
                        </View>
                      )}

                      <Text style={styles.label}>Select Start Date *</Text>
                      <TouchableOpacity
                        style={[styles.datePickerButton, errors.date && styles.inputError]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={styles.datePickerText}>
                          {date ? date.toLocaleDateString("en-US") : "mm/dd/yyyy"}
                        </Text>
                        <Image source={calender} style={styles.calendarIcon} />
                      </TouchableOpacity>
                      {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
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
                            style={[styles.datePickerButton, errors.endDate && styles.inputError]}
                            onPress={() => setShowEndDatePicker(true)}
                          >
                            <Text style={styles.datePickerText}>
                              {endDate ? endDate.toLocaleDateString("en-US") : "mm/dd/yyyy"}
                            </Text>
                            <Image source={calender} style={styles.calendarIcon} />
                          </TouchableOpacity>
                          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
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
                  )}
                </View>
              );
            })}
          </View>
        </View>
        {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  icon: {
    height: 18,
    width: 16,
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
  // NEW: Styles for selected rooms
  selectedRoomsContainer: {
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  selectedRoomsText: {
    fontSize: 14,
    color: "#004AAD",
    marginBottom: 5,
  },
  totalBedsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
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
  expandedContent: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  expandedScroll: {
    maxHeight: 500,
  },
  // NEW: Styles for close button on images
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});