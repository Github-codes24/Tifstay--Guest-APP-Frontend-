import React, { useState, useEffect, useRef } from "react";
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
import { calender, location1, person } from "@/assets/images";
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MealType = "breakfast" | "lunch" | "dinner";
type BookingType = "tiffin" | "hostel";

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
    roomId: params.roomId,
    roomNumber: params.roomNumber,
    beds: params.beds ? JSON.parse(params.beds as string) : [],
    defaultPlan: params.defaultPlan,
    defaultPrice: params.defaultPrice,
    defaultDeposit: params.defaultDeposit,
    email: params.email,
    workType: params.workType,
    adharCardPhoto: params.adharCardPhoto,
    userPhoto: params.userPhoto,
  });

  // New states for dynamic pricing
  const [pricingData, setPricingData] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [currentDeposit, setCurrentDeposit] = useState(0);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [pickerItems, setPickerItems] = useState([]); // For plan types (tiffin) or plans (hostel)
  // Tiffin-specific states
  const [selectedPlanType, setSelectedPlanType] = useState("perMeal"); // Default to perMeal
  const [mealLabels, setMealLabels] = useState<Record<MealType, string>>({});
  // New state for fetched plan details
  const [plansDetails, setPlansDetails] = useState<Record<string, any>>({});

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [numberOfTiffin, setNumberOfTiffin] = useState("1"); // Changed default to 1
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("1");
  const [selectedfood, setSelectedfood] = useState("both");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [mealPreferences, setMealPreferences] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });
  const [sameAsSelections, setSameAsSelections] = useState({
    sameForAll: false,
    sameAs1: false,
    sameAs2: false,
    sameAs3: false,
  });
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<"work" | "leisure">("work");
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");

  const ranAutofill = useRef(false);

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

        // Common user autofill
        setFullName(parsedUserData.name || '');
        setPhoneNumber(parsedUserData.phoneNumber || '');

        if (isHostelBooking) {
          const parsedHostelData = JSON.parse(hostelDataStr);
          const parsedRoomData = JSON.parse(roomDataStr);
          const parsedPlan = JSON.parse(planStr);
          const parsedSelectedBeds = JSON.parse(selectedBedsStr);

          console.log("Parsed Hostel Data:", parsedHostelData);
          console.log("Parsed Room Data:", parsedRoomData);
          console.log("Parsed Plan:", parsedPlan);
          console.log("Parsed Selected Beds:", parsedSelectedBeds);

          // Update serviceData with minimal data (no bed enrichment needed)
          setServiceData(prev => ({
            ...prev,
            hostelId: parsedHostelData.id,
            hostelName: parsedHostelData.name || prev.hostelName, // For UI
            roomId: parsedRoomData._id,
            roomNumber: parsedRoomData.roomNumber,
            beds: parsedSelectedBeds, // Minimal: [{bedId, bedNumber}]
            monthlyPrice: parsedPlan.price,
            deposit: parsedPlan.depositAmount,
            email: parsedUserData.email || prev.email,
            workType: parsedUserData.workType || prev.workType,
            adharCardPhoto: parsedUserData.adharCardPhoto || prev.adharCardPhoto,
            userPhoto: parsedUserData.userPhoto || prev.userPhoto,
          }));

          console.log("Extracted Hostel ID:", parsedHostelData.id);
          console.log("Extracted Room ID:", parsedRoomData._id);

          // Autofill other fields (except check-in and check-out dates)
          setHostelPlan(parsedPlan.name || "monthly");
          setAadhaarPhoto(parsedUserData.adharCardPhoto || "");
          setUserPhoto(parsedUserData.userPhoto || "");
          // Do not auto-fill checkInDate or checkOutDate - let user select
          const workType = parsedUserData.workType || "Student";
          setPurposeType(workType === "Student" ? "leisure" : "work");
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

          // Autofill tiffin-specific fields
          // NEW: Use first available plan's foodType (handles mismatches)
          const firstPlan = parsedServiceData.pricing?.[0];
          const planFoodType = firstPlan?.foodType?.toLowerCase() || "veg";
          setSelectedfood(planFoodType.includes("both") ? "both" : planFoodType.includes("non") ? "nonveg" : "veg");
          // Set meal preferences from data (assume types like "Breakfast" -> "breakfast")
          const defaultMealPrefs = { breakfast: false, lunch: false, dinner: false };
          parsedServiceData.mealPreferences?.forEach((meal: any) => {
            const key = meal.type.toLowerCase() as MealType;
            if (key in defaultMealPrefs) {
              defaultMealPrefs[key] = true;
            }
          });
          console.log("mealPreferences set to:", defaultMealPrefs);
          setMealPreferences(defaultMealPrefs);

          // Set meal labels with timings
          const mealLabelMap: Record<MealType, string> = { breakfast: '', lunch: '', dinner: '' };
          parsedServiceData.mealPreferences?.forEach((meal: any) => {
            const key = meal.type.toLowerCase() as MealType;
            if (key in mealLabelMap) {
              mealLabelMap[key] = `${meal.type} ${meal.time}`;
            }
          });
          setMealLabels(mealLabelMap);

          setOrderType(parsedServiceData.orderTypes?.includes("Delivery") ? "delivery" : "dining");
          // Default date from params - but set to null for user selection
          setDate(null);
        }

        console.log("Autofill completed");
      } catch (error) {
        console.error("Error parsing params for autofill:", error);
      }
    }
  }, [bookingType, serviceDataStr, hostelDataStr, roomDataStr, userDataStr, planStr, selectedBedsStr, defaultDateStr]);


useEffect(() => {
  const fetchSelectedPlanDetails = async () => {
    if (bookingType !== "tiffin" || !serviceData.pricing || serviceData.pricing.length === 0) {
      console.log("⚠️ No pricing data available for fetch");
      return;
    }

    // Compute selected meals from state
    const selectedMeals: string[] = [];
    if (mealPreferences?.breakfast) selectedMeals.push('breakfast');
    if (mealPreferences?.lunch) selectedMeals.push('lunch');
    if (mealPreferences?.dinner) selectedMeals.push('dinner');
    const mealPrefStr = selectedMeals.join(',');
    const numMeals = selectedMeals.length;

    // Guard: Skip if no meals or no plan
    if (!selectedPlanType || numMeals === 0) {
      console.log("⏭️ Skipping plan details fetch: No selected plan or meals (using local pricing)");
      setPlansDetails({});
      return;
    }

    console.log(`🔍 Fetching details for selected plan: ${selectedPlanType} | Meals: ${mealPrefStr} (${numMeals} meals) | FoodType: ${serviceData.foodType}`);

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.warn("No token available – skipping");
      return;
    }

    if (!serviceData.serviceId) {
      console.warn("⚠️ No serviceId – skipping");
      return;
    }

    const selectedPlan = serviceData.pricing.find((p: any) => p.planType === selectedPlanType);
    if (!selectedPlan || !selectedPlan._id) {
      console.warn(`⚠️ Selected plan not found: ${selectedPlanType}`);
      return;
    }

    // NEW: Guard for foodType mismatch (esp. for third plan)
    if (selectedPlan.foodType !== serviceData.foodType && selectedPlan.foodType !== "Both Veg & Non-Veg") {
      console.warn(`⚠️ FoodType mismatch: Plan ${selectedPlan.foodType} vs Service ${serviceData.foodType} – skipping fetch`);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        planType: selectedPlan.planType,
        foodType: selectedPlan.foodType,  // Use plan's foodType
        orderType: orderType.toLowerCase(),
        mealPreference: mealPrefStr,
      });

      const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${selectedPlan._id}?${queryParams.toString()}`;
      console.log("🔗 Full API URL:", url);

      const response = await axios.get(url, {
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
      });

      console.log(`📥 Response for ${selectedPlan.planType}:`, JSON.stringify(response, null, 2));

      if (response.data.success) {
        const details = { [selectedPlan.planType]: response.data.data };
        setPlansDetails(details);
        console.log(`✅ Fetched details for ${selectedPlan._id}:`, response.data.data);
      } else {
        console.log(`❌ API false for ${selectedPlan.planType}:`, response.data.message);
        setPlansDetails({});
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Error for ${selectedPlan._id}: Status ${error.response?.status}, Data:`, error.response?.data);
      } else {
        console.error(`❌ Non-Axios error:`, error);
      }
      setPlansDetails({});
    }
  };

  fetchSelectedPlanDetails();
}, [serviceData.pricing, bookingType, orderType, selectedPlanType, mealPreferences]);  // Reactive deps

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
              weekly: data.pricing?.weekly || 0,
              monthly: data.pricing?.monthly || 0,
            });
            setSecurityDeposit(data.securityDeposit || 0);

            // Dynamically create picker items based on available plans
            const items = [];
            if (data.pricing?.weekly > 0) {
              items.push({ label: "Weekly", value: "weekly" });
            }
            if (data.pricing?.monthly > 0) {
              items.push({ label: "Monthly", value: "monthly" });
            }
            setPickerItems(items);

            // Set initial price for monthly if available
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

    // NEW: Compute numMeals for logging
    const numMeals = Object.values(mealPreferences).filter(Boolean).length;

    console.log("Price useEffect: selectedPlanType", selectedPlanType, "orderType", orderType, "numberOfTiffin", numberOfTiffin);

    if (bookingType === "tiffin") {
      if (selectedPlanType) {
        let basePrice = 0;
        // Hardcoded prices based on plan type and order type (delivery/dining)
        if (selectedPlanType === "perBreakfast") {
          basePrice = orderType === "delivery" ? 120 : 100; // Assume dining cheaper
        } else if (selectedPlanType === "perMeal") {
          basePrice = orderType === "delivery" ? 120 : 100;
        } else if (selectedPlanType === "weekly") {
          basePrice = orderType === "delivery" ? 800 : 700; // Discounted price
        } else if (selectedPlanType === "monthly") {
          basePrice = orderType === "delivery" ? 3200 : 3000; // Discounted price
        }
        const numTiffins = parseInt(numberOfTiffin || "1");
        newPrice = basePrice * numTiffins;
        console.log("final newPrice:", newPrice);
      }
      newDeposit = 0; // No deposit for tiffin
    } else {
      if (hostelPlan === "weekly") {
        newPrice = pricingData.weekly;
        newDeposit = securityDeposit;
      } else if (hostelPlan === "monthly") {
        newPrice = pricingData.monthly;
        newDeposit = securityDeposit;
      }
    }

    console.log(`💰 Updated prices - Total: ₹${newPrice}, Deposit: ₹${newDeposit}`);
    setCurrentPlanPrice(newPrice);
    setCurrentDeposit(newDeposit);
  }, [
    selectedPlanType,
    orderType,
    numberOfTiffin,
    bookingType,
    hostelPlan,
    pricingData,
    securityDeposit,
    mealPreferences,  // NEW: For numMeals calc in log
  ]);

  // Auto-set meal preferences based on selected plan type
  useEffect(() => {
    if (selectedPlanType) {
      let prefs = { breakfast: false, lunch: false, dinner: false };
      if (selectedPlanType === "perBreakfast") {
        prefs.breakfast = true;
      } else if (selectedPlanType === "perMeal") {
        prefs.lunch = true; // Assume lunch for per meal
      } else if (selectedPlanType === "weekly" || selectedPlanType === "monthly") {
        prefs = { breakfast: true, lunch: true, dinner: true }; // Full plan
      }
      setMealPreferences(prefs);
      console.log(`💡 Auto-set meals for ${selectedPlanType}:`, prefs);
    }
  }, [selectedPlanType]);

  // Auto-fill check-out date based on check-in and plan
  useEffect(() => {
    if (checkInDate && hostelPlan) {
      let daysToAdd = 0;
      if (hostelPlan === 'weekly') {
        daysToAdd = 7;
      } else if (hostelPlan === 'monthly') {
        daysToAdd = 30; // Approximate for a month
      }

      const newCheckOut = new Date(checkInDate);
      newCheckOut.setDate(newCheckOut.getDate() + daysToAdd);
      setCheckOutDate(newCheckOut);
    }
  }, [checkInDate, hostelPlan]);

  // Helper functions
  const toggleMealPreference = (meal: MealType) => {
    setMealPreferences((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  const toggleSameAs = (key: keyof typeof sameAsSelections) => {
    setSameAsSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
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

  const handleBack = () => {
    router.back();
  };

  const handleTiffinSubmit = async () => {
    console.log("=== Tiffin Submit Debug ===");
    console.log("fullName:", fullName);
    console.log("phoneNumber:", phoneNumber);
    console.log("address:", address);
    console.log("numberOfTiffin:", numberOfTiffin);
    console.log("selectedPlanType:", selectedPlanType);
    console.log("mealPreferences:", mealPreferences);
    console.log("orderType:", orderType);
    console.log("selectedfood:", selectedfood);
    console.log("specialInstructions:", specialInstructions);
    console.log("date:", date);
    console.log("serviceData:", serviceData);

    // Validation
    if (!fullName) {
      alert("Full Name is required!");
      return;
    }
    if (!phoneNumber) {
      alert("Phone Number is required!");
      return;
    }
    if (orderType === "delivery" && !address) {
      alert("Address is required for delivery!");
      return;
    }
    if (!numberOfTiffin || parseInt(numberOfTiffin) <= 0) {
      alert("Valid Number of Tiffin is required!");
      return;
    }
    if (!date) {
      alert("Date is required!");
      return;
    }
    if (!selectedfood) {
      alert("Food Type is required!");
      return;
    }
    if (!selectedPlanType) {
      alert("Plan type is required!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const guestId = await AsyncStorage.getItem("guestId");

      if (!token || !guestId) {
        alert("Authentication token or guest ID is missing!");
        return;
      }

      if (!serviceData.serviceId) {
        alert("Service ID is missing!");
        return;
      }

      // Derive selectTiffinNumber
      const numTiffins = parseInt(numberOfTiffin);
      let selectTiffinNumber = [];
      if (sameAsSelections.sameForAll) {
        selectTiffinNumber = [{ tiffinNumber: 1, sameUs: "All" }];
      } else {
        for (let i = 1; i <= numTiffins; i++) {
          selectTiffinNumber.push({ tiffinNumber: i, sameUs: `Same As ${i}` });
        }
      }

      // Derive mealPreference
      const selectedMeals = Object.entries(mealPreferences)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1))
        .join(", ");
      const mealPreference = selectedMeals || "Lunch";

      // Derive plan (price already includes numTiffins)
      const choosePlanType = {
        planName: selectedPlanType,
        price: currentPlanPrice,
      };

      // API Payload
      const bookingPayload = {
        fullName,
        phoneNumber,
        address: orderType === "delivery" ? address : "",
        specialInstructions,
        numberOfTiffin: numTiffins,
        selectTiffinNumber,
        mealPreference,
        foodType: selectedfood === "both" ? "Both Veg & Non-Veg" : selectedfood.charAt(0).toUpperCase() + selectedfood.slice(1),
        chooseOrderType: orderType.charAt(0).toUpperCase() + orderType.slice(1),
        choosePlanType,
        date: date.toISOString().split("T")[0],
        serviceId: serviceData.serviceId,
        guestId,
      };

      console.log("Tiffin Booking Payload:", JSON.stringify(bookingPayload, null, 2));

      const response = await axios.post(
        "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/create",
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
        const bookingId = response.data.data._id;
        console.log("Tiffin booking successful, ID:", bookingId);

        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "tiffin",
            bookingId,
          },
        });
      } else {
        alert("Booking failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error creating tiffin booking:", error.response?.data || error.message);
      alert("Something went wrong while booking. Please try again.");
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
    console.log("beds:", serviceData.beds);

    try {
      if (!serviceData.hostelId || !serviceData.roomId) {
        console.error("Error: Hostel ID or Room ID is missing!");
        console.log("hostelId:", serviceData.hostelId);
        console.log("roomId:", serviceData.roomId);
        alert("Hostel ID or Room ID is missing!");
        return;
      }

      if (!fullName) {
        console.error("Error: Full Name is missing!");
        alert("Full Name is required!");
        return;
      }
      if (!phoneNumber) {
        console.error("Error: Phone Number is missing!");
        alert("Phone Number is required!");
        return;
      }
      if (!checkInDate || !checkOutDate) {
        console.error("Error: Check-in and Check-out dates are required!");
        alert("Check-in and Check-out dates are required!");
        return;
      }
      if (checkInDate >= checkOutDate) {
        console.error("Error: Invalid dates - Check-out must be after Check-in!");
        alert("Check-out date must be after Check-in date!");
        return;
      }

      if (!serviceData.beds || serviceData.beds.length === 0) {
        console.error("Error: No beds selected!");
        alert("Please select at least one bed!");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const guestId = await AsyncStorage.getItem("guestId");

      console.log("token:", token ? "Present" : "Missing");
      console.log("guestId:", guestId ? "Present" : "Missing");

      if (!token || !guestId) {
        console.error("Error: Authentication token or guest ID is missing!");
        alert("Authentication token or guest ID is missing!");
        return;
      }

      const selectPlan = [
        {
          name: hostelPlan,
          price: currentPlanPrice,
          depositAmount: currentDeposit,
        },
      ];

      // Minimal bedNumber: only bedId and bedNumber
      const bedNumber = serviceData.beds.map((bed: any) => ({
        bedId: bed.bedId,
        bedNumber: bed.bedNumber,
      }));

      // Minimal payload matching backend expectations
      const bookingPayload = {
        fullName,
        phoneNumber,
        email: serviceData.email || "example@example.com",
        workType: purposeType === "work" ? "1" : "10",
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        selectPlan,
        addharCardPhoto: aadhaarPhoto || null,
        userPhoto: userPhoto || null,
        guestId,
        rooms: [
          {
            roomId: serviceData.roomId,
            roomNumber: String(serviceData.roomNumber || ""), // e.g., "101"
            bedNumber, // Minimal array
          },
        ],
      };

      console.log("Full Booking Payload:", JSON.stringify(bookingPayload, null, 2));

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createHostelBooking/${serviceData.hostelId}?roomId=${serviceData.roomId}`,
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
          },
        });
      } else {
        console.error("Booking failed:", response.data.message || "Unknown error");
        alert("Booking failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error creating hostel booking:", error.response?.data || error.message);
      console.error("Full error object:", error);
      alert("Something went wrong while booking. Please try again.");
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

  const renderHostelBooking = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Booking</Text>
        <Text style={styles.hostelName}>
          {serviceData.hostelName || "Scholars Den Boys Hostel"}
        </Text>

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
            ₹{currentPlanPrice} / {hostelPlan.charAt(0).toUpperCase() + hostelPlan.slice(1)}
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
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Aadhaar Card Photo</Text>
        {aadhaarPhoto ? (
          <Image source={{ uri: aadhaarPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
        ) : (
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload photo</Text>
            <Text style={styles.uploadSubtext}>
              Upload clear photo of your Aadhaar card
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Your Photo</Text>
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
        ) : (
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload photo</Text>
            <Text style={styles.uploadSubtext}>
              Upload clear photo of your selfie or photo from gallery
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Booking Details</Text>

        <Text style={styles.label}>Check-in date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkInDate ? checkInDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Check-out date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkOutDate ? checkOutDate.toLocaleDateString('en-IN') : 'DD/MM/YYYY'}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
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
          <Text style={styles.label}>Purpose of Stay</Text>
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
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => setPurposeType("leisure")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "leisure" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Leisure</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleHostelSubmit}
      >
        <Text style={styles.submitButtonText}>Book Now</Text>
      </TouchableOpacity>
    </>
  );

  const renderTiffinBooking = () => {
    // Hardcoded plan options
    const planOptions = [
      { label: "Per Breakfast (₹120 / per breakfast)", value: "perBreakfast" },
      { label: "Per Meal (₹120/meal)", value: "perMeal" },
      { label: "Weekly (₹800/weekly) save 15%", value: "weekly" },
      { label: "Monthly (₹3200/monthly) save 15%", value: "monthly" },
    ];

    return (
      <>
        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={person} style={styles.icon} />
            <Text style={styles.sectionTitle}> Personal Information</Text>
          </View>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row" }}>
            <Image source={location1} style={styles.icon} />
            <Text style={styles.sectionTitle}> Delivery Address</Text>
          </View>
          <Text style={styles.label}>Select Address</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setAddress}
              items={[
                { label: "Home Address", value: "home" },
                { label: "Office Address", value: "office" },
                { label: "Other", value: "other" },
              ]}
              placeholder={{ label: "Home Address", value: null }}
              style={{
                inputIOS: styles.pickerInput,
                inputAndroid: styles.pickerInput,
              }}
              value={address}
              disabled={orderType === "dining"}
            />
          </View>
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

          <Text style={[styles.sectionTitle]}>Apply Preferences</Text>
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

          <Text style={[styles.sectionTitle]}>Meal Preference</Text>
          {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
            <View style={styles.checkboxRow} key={meal}>
              <Checkbox
                checked={mealPreferences[meal]}
                onPress={() => toggleMealPreference(meal)}
              />
              <Text style={styles.checkboxLabel}>
                {mealLabels[meal] || (meal.charAt(0).toUpperCase() + meal.slice(1))}
              </Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle]}>Food Type</Text>
          <RadioButton
            label="Veg"
            value="veg"
            selected={selectedfood}
            onPress={setSelectedfood}
          />
          <RadioButton
            label="Non-Veg"
            value="nonveg"
            selected={selectedfood}
            onPress={setSelectedfood}
          />
          <RadioButton
            label="Both Veg & Non-Veg"
            value="both"
            selected={selectedfood}
            onPress={setSelectedfood}
          />

          {/* Order Type */}
          <Text style={[styles.sectionTitle]}>Choose Order Type</Text>
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

          <Text style={[styles.sectionTitle]}>Choose Plan Type</Text>
          {planOptions.map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              selected={selectedPlanType}
              onPress={setSelectedPlanType}
            />
          ))}

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              ₹{currentPlanPrice}
            </Text>
            <Text style={styles.depositText}>
              No Deposit
            </Text>
          </View>

          <Text style={[styles.sectionTitle]}>Select Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {date ? date.toLocaleDateString("en-US") : "mm/dd/yyyy"}
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
        </View>
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
    marginBottom: 15,
    fontSize: 14,
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
    marginBottom: 15,
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
});