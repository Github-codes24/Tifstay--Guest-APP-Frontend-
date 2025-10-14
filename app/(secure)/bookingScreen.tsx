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
import * as ImagePicker from 'expo-image-picker';
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

  // Error states for better UX
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [planError, setPlanError] = useState<string>('');

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
  const [fetchedPlanType, setFetchedPlanType] = useState('');
  const [fetchedPricing, setFetchedPricing] = useState({
    perBreakfast: 0,
    perMeal: 0,
    weekly: 0,
    monthly: 0,
    offers: '',
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [numberOfTiffin, setNumberOfTiffin] = useState("1"); // Changed default to 1
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("1");
  const [selectedfood, setSelectedfood] = useState("Both");
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
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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

  // Helper to clear errors for a field
  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Helper to validate and set errors
  const validateTiffinForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full Name is required!";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required!";
    if (orderType === "delivery" && !address.trim()) newErrors.address = "Address is required for delivery!";
    if (!numberOfTiffin || parseInt(numberOfTiffin) <= 0) newErrors.numberOfTiffin = "Valid Number of Tiffin is required!";
    if (!date) newErrors.date = "Date is required!";
    if (['weekly', 'monthly'].includes(selectedPlanType) && (!endDate || endDate <= date)) newErrors.endDate = "End date is required and must be after start date!";
    if (!selectedfood) newErrors.selectedfood = "Food Type is required!";
    if (!selectedPlanType) newErrors.selectedPlanType = "Plan type is required!";
    if (!fetchedPlanType) newErrors.fetchedPlanType = "Please get plan details first!";
    // NEW: Validate at least one meal selected
    const numMealsSelected = Object.values(mealPreferences).filter(Boolean).length;
    if (numMealsSelected === 0) newErrors.mealPreferences = "At least one meal preference is required!";

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
            email: userEmail || prev.email,
            workType: userWorkType || prev.workType,
            adharCardPhoto: userAdharPhoto || prev.adharCardPhoto,
            userPhoto: userPhotoUrl || prev.userPhoto,
          }));

          console.log("Extracted Hostel ID:", parsedHostelData.id);
          console.log("Extracted Room ID:", parsedRoomData._id);

          // Autofill other fields (except check-in and check-out dates)
          setHostelPlan(parsedPlan.name || "monthly");
          setAadhaarPhoto(userAdharPhoto || "");
          setUserPhoto(userPhotoUrl || "");
          // Do not auto-fill checkInDate or checkOutDate - let user select
          const workType = userWorkType || "Student";
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
          const planFoodType = firstPlan?.foodType?.toLowerCase() || "Veg";
          setSelectedfood(planFoodType.includes("Both") ? "Both" : planFoodType.includes("Non") ? "Non-Veg" : "Veg");
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
        // Use fetched pricing if available, else fallback to hardcoded
        const pricingKey = selectedPlanType as keyof typeof fetchedPricing;
        if (fetchedPricing && fetchedPricing[pricingKey] > 0) {
          basePrice = fetchedPricing[pricingKey];
        } else {
          // Hardcoded fallback
          if (selectedPlanType === "perBreakfast") {
            basePrice = 120; // Assume delivery
          } else if (selectedPlanType === "perMeal") {
            basePrice = 120;
          } else if (selectedPlanType === "weekly") {
            basePrice = 800; // Discounted price
          } else if (selectedPlanType === "monthly") {
            basePrice = 3200; // Discounted price
          }
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
    fetchedPricing,
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

  // Auto-fill check-out date based on check-in and plan (for hostel)
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

  // Auto-fill end date based on start date and plan type (for tiffin weekly/monthly)
  useEffect(() => {
    if (date && ['weekly', 'monthly'].includes(selectedPlanType)) {
      let daysToAdd = 0;
      if (selectedPlanType === 'weekly') {
        daysToAdd = 7;
      } else if (selectedPlanType === 'monthly') {
        daysToAdd = 30; // Approximate for a month
      }

      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
    } else if (!['weekly', 'monthly'].includes(selectedPlanType)) {
      setEndDate(null); // Clear end date for per meal plans
    }
  }, [date, selectedPlanType]);

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
      allowsEditing: true,
      aspect: [4, 3],
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      clearError('userPhoto');
    }
  };

  const handleGetPlanDetails = async () => {
    const selectedMeals: string[] = [];
    if (mealPreferences.breakfast) selectedMeals.push('Breakfast');
    if (mealPreferences.lunch) selectedMeals.push('Lunch');
    if (mealPreferences.dinner) selectedMeals.push('Dinner');
    const mealPrefStr = selectedMeals.join(',');
    if (mealPrefStr === '') {
      setPlanError('Please select at least one meal preference.');
      return;
    }

    let foodTypeStr = '';
    if (selectedfood === 'Veg') foodTypeStr = 'Veg';
    else if (selectedfood === 'Non-Veg') foodTypeStr = 'Non-Veg';
    else if (selectedfood === 'Both') foodTypeStr = 'Both Veg & Non-Veg';

    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setPlanError('Authentication required.');
      return;
    }

    if (!serviceData.serviceId) {
      setPlanError('Service ID not available.');
      return;
    }

    setIsFetchingDetails(true);
    setPlanError('');
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
        setFetchedPlanType(data.planType);
        setFetchedPricing({
          perBreakfast: data.pricing.perBreakfast || 0,
          perMeal: data.pricing.perMeal || 0,
          weekly: data.pricing.weekly || 0,
          monthly: data.pricing.monthly || 0,
          offers: data.offers || '',
        });
        // Check if no plans found
        const totalPricing = (data.pricing.perBreakfast || 0) + (data.pricing.perMeal || 0) + (data.pricing.weekly || 0) + (data.pricing.monthly || 0);
        if (totalPricing === 0) {
          setPlanError('No plans available for your selected preferences. Please try different options.');
        } else {
          setPlanError('');
        }
        console.log(`✅ Fetched details:`, data);
      } else {
        console.log(`❌ API false:`, response.data.message);
        setPlanError('Failed to fetch plan details: ' + response.data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Error: Status ${error.response?.status}, Data:`, error.response?.data);
        setPlanError('Failed to fetch plan details: ' + (error.response?.data?.message || 'Network error'));
      } else {
        console.error(`❌ Non-Axios error:`, error);
        setPlanError('Failed to fetch plan details.');
      }
    } finally {
      setIsFetchingDetails(false);
    }
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
  console.log("endDate:", endDate);
  console.log("serviceData:", serviceData);
  console.log("fetchedPlanType:", fetchedPlanType);

  if (validateTiffinForm()) {
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

      // FIXED: For API, use single meal (first selected or fallback to "Lunch") instead of joined string
      const selectedMeals = Object.entries(mealPreferences)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
      // NEW: Default to first selected meal for backend compatibility
      const mealPreference = selectedMeals.length > 0 ? selectedMeals[0] : "Lunch";  // Fallback to "Lunch" as per example

      // FIXED: Use short form for payload body (matches backend validation)
      const foodTypeMap = {
        Veg: "Veg",
        "Non-Veg": "Non-Veg",
        Both: "Both"  // Shortened for create payload
      };
      const foodType = foodTypeMap[selectedfood as keyof typeof foodTypeMap] || "Veg";

      const chooseOrderType = orderType === "delivery" ? "Delivery" : "Dining";

      // FIXED: Use short, capitalized selectedPlanType for planName (e.g., "Monthly") to match backend expectations
      const planNameMap: Record<string, string> = {
        perBreakfast: "Per Breakfast",
        perMeal: "Per Meal",
        weekly: "Weekly",
        monthly: "Monthly"
      };
      const planName = planNameMap[selectedPlanType] || selectedPlanType.charAt(0).toUpperCase() + selectedPlanType.slice(1);
      const choosePlanType = {
        planName,  // Now short, e.g., "Monthly"
        price: currentPlanPrice
      };

      // FIXED: Conditionally add sameUs only if sameForAll is checked (omit empty to avoid enum validation)
      const tiffinNumberObj: { tiffinNumber: number; sameUs?: string } = {
        tiffinNumber: parseInt(selectTiffinNumber),
      };
      if (sameAsSelections.sameForAll) {
        tiffinNumberObj.sameUs = "All";
      }
      

      const selectTiffinNumberArray = [tiffinNumberObj];

      const payload = {
        fullName,
        phoneNumber,
        address,
        specialInstructions,
        numberOfTiffin: parseInt(numberOfTiffin),
        selectTiffinNumber: selectTiffinNumberArray,
        mealPreference, 
        foodType,
        chooseOrderType,
        choosePlanType,
        date: date?.toISOString().split('T')[0] || '',
      };

      
      if (['weekly', 'monthly'].includes(selectedPlanType)) {
        payload.endDate = endDate?.toISOString().split('T')[0] || '';
      }

      console.log("Tiffin Booking Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/create?tiffinServiceId=${serviceData.serviceId}`,
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

        console.log("Navigating to checkout with booking ID:", bookingId,serviceData);

        router.push({
          pathname: "/check-out",
          params: {
            serviceType: "tiffin",
            bookingId,
            serviceId: serviceData.serviceId,
            // NEW: Pass key booking data as fallback (strings for params)
            totalPrice: currentPlanPrice.toString(),
            planType: selectedPlanType,
            startDate: date?.toISOString().split('T')[0] || '',
            endDate: endDate?.toISOString().split('T')[0] || '',
            mealPreference: mealPreference,
            foodType: selectedfood,
            orderType: orderType,
            numberOfTiffin: numberOfTiffin,
            fullName: fullName,  // If needed for display
          },
        });
      } else {
        console.error("Booking failed:", response.data.message || "Unknown error");
        setErrors(prev => ({ ...prev, general: "Booking failed: " + (response.data.message || "Unknown error") }));
      }
    } catch (error: any) {
      console.error("Error creating tiffin booking:", error.response?.data || error.message);
      console.error("Full error object:", error);
      setErrors(prev => ({ ...prev, general: "Something went wrong while booking. Please try again." }));
    }
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

    if (validateHostelForm()) {
      try {
        if (!serviceData.hostelId || !serviceData.roomId) {
          console.error("Error: Hostel ID or Room ID is missing!");
          console.log("hostelId:", serviceData.hostelId);
          console.log("roomId:", serviceData.roomId);
          setErrors(prev => ({ ...prev, general: "Hostel ID or Room ID is missing!" }));
          return;
        }

        if (!serviceData.beds || serviceData.beds.length === 0) {
          console.error("Error: No beds selected!");
          setErrors(prev => ({ ...prev, general: "Please select at least one bed!" }));
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
          <Image source={{ uri: aadhaarPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
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
          <Image source={{ uri: userPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
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

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

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
    { label: "Per Meal (₹120/meal)", value: "perMeal" },
    { label: "Weekly (₹800/weekly) save 15%", value: "weekly" },
    { label: "Monthly (₹3200/monthly) save 15%", value: "monthly" },
  ];

  const getPlanOptions = () => {
    const options: { label: string; value: string }[] = [];
    if (fetchedPricing.perBreakfast > 0) {
      options.push({ label: `Per Breakfast (₹${fetchedPricing.perBreakfast} / per breakfast)`, value: "perBreakfast" });
    }
    if (fetchedPricing.perMeal > 0) {
      options.push({ label: `Per Meal (₹${fetchedPricing.perMeal}/meal)`, value: "perMeal" });
    }
    if (fetchedPricing.weekly > 0) {
      options.push({ label: `Weekly (₹${fetchedPricing.weekly}/weekly)`, value: "weekly" });
    }
    if (fetchedPricing.monthly > 0) {
      options.push({ label: `Monthly (₹${fetchedPricing.monthly}/monthly)`, value: "monthly" });
    }
    // If no dynamic options, fallback to hardcoded
    if (options.length === 0) {
      return hardcodedPlanOptions;
    }
    return options;
  };

  // NEW: Helper for selected meals summary in UI
  const selectedMealsSummary = React.useMemo(() => {
    const selectedMeals = Object.entries(mealPreferences)
      .filter(([_, checked]) => checked)
      .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
    return selectedMeals.join(", ");
  }, [mealPreferences]);

  const renderTiffinBooking = () => {
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
          <Text style={styles.label}>Number Of Tiffin *</Text>
          <TextInput
            style={[styles.input, errors.numberOfTiffin && styles.inputError]}
            value={numberOfTiffin}
            keyboardType="numeric"
            onChangeText={(text) => {
              setNumberOfTiffin(text);
              clearError('numberOfTiffin');
            }}
            onBlur={() => {
              if (!numberOfTiffin || parseInt(numberOfTiffin) <= 0) setErrors(prev => ({ ...prev, numberOfTiffin: "Valid Number of Tiffin is required!" }));
            }}
          />
          {errors.numberOfTiffin && <Text style={styles.errorText}>{errors.numberOfTiffin}</Text>}
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
          {/* NEW: Display selected meals summary */}
          {selectedMealsSummary && (
            <Text style={[styles.label, { fontSize: 12, color: "#666", marginTop: 5 }]}>
              Selected: {selectedMealsSummary}
            </Text>
          )}
          {errors.mealPreferences && <Text style={styles.errorText}>{errors.mealPreferences}</Text>}

          <Text style={[styles.sectionTitle]}>Food Type</Text>
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

          {/* Get Plan Details Button */}
          <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Get Plan Details</Text>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (Object.values(mealPreferences).filter(Boolean).length === 0 || isFetchingDetails) && styles.disabledButton
            ]}
            onPress={handleGetPlanDetails}
            disabled={Object.values(mealPreferences).filter(Boolean).length === 0 || isFetchingDetails}
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

          <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Choose Plan Type</Text>
          {getPlanOptions().map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              selected={selectedPlanType}
              onPress={(value) => {
                setSelectedPlanType(value);
                clearError('selectedPlanType');
              }}
            />
          ))}
          {errors.selectedPlanType && <Text style={styles.errorText}>{errors.selectedPlanType}</Text>}
          {errors.fetchedPlanType && <Text style={styles.errorText}>{errors.fetchedPlanType}</Text>}

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              ₹{currentPlanPrice}
            </Text>
            <Text style={styles.depositText}>
              No Deposit
            </Text>
          </View>

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

          {['weekly', 'monthly'].includes(selectedPlanType) && (
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
});