import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Linking,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mastercard from "@/assets/images/icons/mastercard.png";
import CheckoutItemCard, {
  TiffinCheckoutData,
  HostelCheckoutData,
} from "@/components/CheckoutItemCard";
import Header from "@/components/Header";

const Checkout: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'wallet' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [tiffinOrderDetails, setTiffinOrderDetails] = useState<any | null>(null);
  const [tiffinService, setTiffinService] = useState<any | null>(null);
  const [loadingTiffin, setLoadingTiffin] = useState(false);
  const [finalPricing, setFinalPricing] = useState<any | null>(null);

  const params = useLocalSearchParams();
  const {
    serviceType,
    bookingId,
    serviceId,
    hostelData: hostelDataStr,
    roomData: roomDataStr,
    selectedBeds: selectedBedsStr,
    plan: planStr,
    checkInDate,
    checkOutDate,
    userData: userDataStr,
    bookingType,
    // NEW: Fallback params from booking screen
    totalPrice,
    planType,
    startDate,
    endDate,
    mealPreference,
    foodType,
    orderType,
    numberOfTiffin,
    fullName,
  } = params;

  const isTiffin = serviceType === "tiffin";
  const isHostel = serviceType === "hostel";

  // Helper to normalize values from useLocalSearchParams which may be string | string[] | undefined
  const firstParam = (val: string | string[] | undefined): string | undefined => {
    if (val === undefined) return undefined;
    return Array.isArray(val) ? val[0] : val;
  };

  // Parse JSON strings if they exist (fallback to empty objects/arrays)
  const parsedHostelData = hostelDataStr ? JSON.parse(hostelDataStr as string) : {};
  const parsedRoomData = roomDataStr ? JSON.parse(roomDataStr as string) : {};
  const parsedSelectedBeds = selectedBedsStr ? JSON.parse(selectedBedsStr as string) : [];
  const parsedPlan = planStr ? JSON.parse(planStr as string) : {};
  const parsedUserData = userDataStr ? JSON.parse(userDataStr as string) : {};

  // Log received params explicitly
  console.log("=== Received Params in Checkout ===");
  console.log("serviceType:", serviceType);
  console.log("bookingId:", bookingId);
  console.log("serviceId:", serviceId);
  console.log("bookingType:", bookingType);
  console.log("checkInDate:", checkInDate);
  console.log("checkOutDate:", checkOutDate);
  console.log("hostelDataStr (raw):", hostelDataStr);
  console.log("roomDataStr (raw):", roomDataStr);
  console.log("selectedBedsStr (raw):", selectedBedsStr);
  console.log("planStr (raw):", planStr);
  console.log("userDataStr (raw):", userDataStr);
  console.log("=== Parsed Data ===");
  console.log("parsedHostelData:", parsedHostelData);
  console.log("parsedRoomData:", parsedRoomData);
  console.log("parsedSelectedBeds:", parsedSelectedBeds);
  console.log("parsedPlan:", parsedPlan);
  console.log("parsedUserData:", parsedUserData);

  // Log dynamic params for debugging
  console.log("Dynamic Checkout Params:", {
    serviceType,
    bookingId,
    serviceId,
    parsedHostelData,
    parsedRoomData,
    parsedSelectedBeds,
    parsedPlan,
    checkInDate,
    checkOutDate,
    parsedUserData,
    bookingType,
    // NEW: Fallback params
    totalPrice,
    planType,
    startDate,
    endDate,
    mealPreference,
    foodType,
    orderType,
    numberOfTiffin,
    fullName,
  });
  console.log("Received bookingId in Checkout:", bookingId);

  // NEW: Memoized tiffinData with priority: fetched > params > service > hardcoded
  const tiffinData: TiffinCheckoutData = useMemo(() => {
    // Prioritize fetched order details
    if (tiffinOrderDetails) {
      return {
        id: (firstParam(bookingId) || firstParam(serviceId) || "1"),
        title: tiffinOrderDetails.tiffinServiceName || "Maharashtrian Ghar Ka Khana",
        imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
        mealType: Array.isArray(tiffinOrderDetails.mealPreference) ? (tiffinOrderDetails.mealPreference[0] || "Lunch") : (tiffinOrderDetails.mealPreference || "Lunch"),
        foodType: tiffinOrderDetails.foodType || "Veg",
        startDate: tiffinOrderDetails.date ? new Date(tiffinOrderDetails.date).toLocaleDateString('en-IN') : (startDate ? new Date(startDate as string).toLocaleDateString('en-IN') : "21/07/25"),
        plan: tiffinOrderDetails.choosePlanType?.planName || planType || "Per meal",
        orderType: tiffinOrderDetails.chooseOrderType || orderType || "Delivery",
        price: `₹${(tiffinOrderDetails.choosePlanType?.price || parseInt(firstParam(totalPrice) || '120') || 120).toFixed(0)}/meal`,
      };
    }
    // Fallback to service details + params
    if (tiffinService) {
      return {
        id: firstParam(serviceId) || "1",
        title: tiffinService.tiffinName || tiffinService.tiffinServiceName || "Maharashtrian Ghar Ka Khana",
        imageUrl: tiffinService.image || tiffinService.imageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
        mealType: firstParam(mealPreference) || "Lunch",
        foodType: firstParam(foodType) || tiffinService.foodType || "Veg",
        startDate: startDate ? new Date(firstParam(startDate) as string).toLocaleDateString('en-IN') : (checkInDate ? new Date(firstParam(checkInDate) as string).toLocaleDateString('en-IN') : "21/07/25"),
        plan: firstParam(planType) || "Per meal",
        orderType: firstParam(orderType) || "Delivery",
        price: `₹${parseInt(firstParam(totalPrice) || (tiffinService.price || '120').toString()) || 120}/meal`,
      };
    }
    // Ultimate fallback with params
    return {
      id: (firstParam(bookingId) || firstParam(serviceId) || "1"),
      title: "Maharashtrian Ghar Ka Khana",
      imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
      mealType: mealPreference || "Lunch",
      foodType: foodType || "Veg",
      startDate: startDate ? new Date(startDate as string).toLocaleDateString('en-IN') : (checkInDate ? new Date(checkInDate as string).toLocaleDateString('en-IN') : "21/07/25"),
      plan: planType || "Per meal",
      orderType: orderType || "Delivery",
      price: `₹${parseInt(firstParam(totalPrice) || '120')}/meal`,
    };
  }, [tiffinOrderDetails, tiffinService, bookingId, serviceId, totalPrice, planType, startDate, endDate, mealPreference, foodType, orderType, checkInDate]);

  console.log("Constructed tiffinData:", tiffinData);

  // FIXED: Wrap in useMemo for reactivity
  const hostelData: HostelCheckoutData = useMemo(() => ({
    id: firstParam(bookingId) || "2",  // Use real bookingId
    title: bookingDetails?.hostelName || parsedHostelData.name || "Fallback Hostel Name",  // e.g., "Testing is it working"
    imageUrl: parsedRoomData.photos?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",  // First room photo
    guestName: bookingDetails?.guestName || parsedUserData.name || "Fallback Name",  // e.g., "F"
    contact: bookingDetails?.contact || parsedUserData.phoneNumber || "Fallback Phone",  // e.g., "8080805522"
    checkInDate: bookingDetails?.checkInDate ? new Date(bookingDetails.checkInDate).toLocaleDateString('en-IN') : (checkInDate ? new Date(checkInDate as string).toLocaleDateString('en-IN') : "Fallback Date"),  // e.g., "06/10/2025"
    checkOutDate: bookingDetails?.checkOutDate ? new Date(bookingDetails.checkOutDate).toLocaleDateString('en-IN') : (checkOutDate ? new Date(checkOutDate as string).toLocaleDateString('en-IN') : "Fallback Date"),  // e.g., "13/10/2025"
    // FIX: Use PascalCase keys from API response
    rent: `₹${(bookingDetails?.Rent || parsedPlan.price || 0)}/month`,  // Now 10000
    deposit: `₹${(bookingDetails?.totalDeposit || parsedPlan.depositAmount || 0)}`,  // Now 10000
  }), [bookingDetails, parsedHostelData, parsedRoomData, parsedUserData, parsedPlan, bookingId, checkInDate, checkOutDate]);

  console.log("Constructed hostelData:", hostelData);

  const checkoutData = isTiffin ? tiffinData : hostelData;

  console.log("Service ID from BookingScreen:", serviceId);
  console.log("Full checkoutData ID :", checkoutData.id);

  // FIXED: Use correct keys in hostel logic
  // UPDATED: getTransactionDetails with proper hostel calculation (defensive)
  const getTransactionDetails = useMemo(() => {
    console.log("🔄 getTransactionDetails - isTiffin:", isTiffin);

  if (isTiffin) {
    // TIFFIN LOGIC — Price based on plan (daily/weekly/monthly), no deposit
    // Extract price from various possible sources
    const rawPrice = bookingDetails?.price
      ?? bookingDetails?.selectPlan?.[0]?.price
      ?? parsedPlan?.price
      ?? tiffinData?.price  // If tiffinData is available as state/prop
      ?? 0;

    // Parse numeric value from string like '₹870/meal' or '₹3500/Month'
    const priceMatch = rawPrice.toString().match(/₹?(\d+(?:\.\d+)?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Plan type for multiplier (if duration-based; for now, assume price is for full plan unit)
    const plan = bookingDetails?.plan || parsedPlan?.plan || tiffinData?.plan || 'monthly';
    let multiplier = 1; // Default: 1 unit (week/month)

    // Optional: If startDate/endDate available, calculate multiplier (e.g., number of weeks/months)
    const startDate = bookingDetails?.startDate || tiffinData?.startDate;
    const endDate = bookingDetails?.endDate; // If available
    if (startDate && endDate && plan) {
      const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      if (plan === 'daily') multiplier = daysDiff;
      else if (plan === 'weekly') multiplier = Math.ceil(daysDiff / 7);
      else if (plan === 'monthly') multiplier = Math.ceil(daysDiff / 30);
    }

    const totalTiffin = price * multiplier;
    const total = totalTiffin;

    console.log("🍲 TIFFIN BREAKDOWN:", {
      rawPrice,
      price,
      plan,
      multiplier,
      totalTiffin,
      total,
      startDate,
      endDate
    });

    return {
      rent: price,  // Reuse 'rent' key for UI compatibility (represents tiffin cost per unit)
      months: multiplier,  // Reuse 'months' as units (weeks/months)
      totalRent: totalTiffin,
      deposit: 0,  // No deposit for tiffin
      total,
      net: total,
    };
  }

    // HOSTEL LOGIC — only Rent + Deposit (defensive)
    // Try multiple possible paths from the API/params to find price and deposit
    const rawPlanPrice = bookingDetails?.selectPlan?.[0]?.price
      ?? bookingDetails?.price
      ?? parsedPlan?.price
      ?? bookingDetails?.Rent
      ?? 0;

    const rawDeposit = bookingDetails?.selectPlan?.[0]?.depositAmount
      ?? bookingDetails?.depositAmount
      ?? parsedPlan?.depositAmount
      ?? bookingDetails?.totalDeposit
      ?? 0;

    // Coerce to numbers safely
    const planPrice = Number(rawPlanPrice) || 0;
    const depositAmount = Number(rawDeposit) || 0;

    // Check-in / Check-out (optional calculation for multiple months)
    const checkIn = bookingDetails?.checkInDate || checkInDate;
    const checkOut = bookingDetails?.checkOutDate || checkOutDate;
    const months = (checkIn && checkOut)
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 1;

  const totalRent = planPrice * months;
  const total = totalRent + depositAmount;  // Include deposit in total for hostel

    console.log("🛏️ HOSTEL SIMPLE BREAKDOWN:", {
      rawPlanPrice,
      rawDeposit,
      planPrice,
      depositAmount,
      months,
      totalRent,
      total,
      checkIn,
      checkOut
    });

  return {
    rent: planPrice,
    months,
    totalRent,
    deposit: depositAmount,
    total,
    net: total,
  };
}, [isTiffin, bookingDetails, parsedPlan, checkInDate, checkOutDate, tiffinData]);  // Added tiffinData to deps if used


  const transaction = getTransactionDetails;

  console.log("Transaction Details:", transaction); 


  const fetchFinalPricing = async (coupon: string | null = null) => {
    if (!isHostel) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !bookingId) {
        console.error("Token or booking ID missing");
        return;
      }

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/AppliedCoupon/${bookingId}`,
        { coupon },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        setFinalPricing(response.data.data);
        if (coupon && coupon.trim()) {
          Alert.alert('Coupon Applied!', `Coupon ${coupon} applied successfully.`);
          setCouponCode('');
        }
      } else {
        if (coupon && coupon.trim()) {
          Alert.alert("Error", response.data?.message || "Failed to apply coupon");
        }
      }
    } catch (error: any) {
      console.error("Error fetching/applying pricing:", error);
      if (coupon && coupon.trim()) {
        Alert.alert("Error", error.response?.data?.message || "Failed to apply coupon");
      }
    }
  };

  // Fetch booking details for hostel
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!isHostel || !bookingId) return;
      setLoadingBooking(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/gethostelBookingByIdbeforePayment/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setBookingDetails(response.data.data);
          console.log("Fetched booking details:", response.data.data);
        }
      } catch (error: any) {
        console.error("Error fetching booking details:", error);
        Alert.alert("Error", "Failed to fetch booking details");
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBookingDetails();
  }, [isHostel, bookingId]);

  // Fetch initial final pricing for hostel from API (base pricing)
  useEffect(() => {
    if (isHostel && !loadingBooking && bookingDetails && !finalPricing) {
      fetchFinalPricing(null); // Fetch base pricing (coupon: null) from API
    }
  }, [isHostel, loadingBooking, bookingDetails, finalPricing]);

  // Set initial final pricing for tiffin
  useEffect(() => {
    if (isTiffin && !loadingTiffin && (tiffinOrderDetails || tiffinService) && !finalPricing && transaction.total > 0) {
      setFinalPricing({
        totalAmount: transaction.total,
        afterDiscount: transaction.total,
        discountValue: 0,
        TPS: 0,
        TVQ: 0,
        finalPrice: transaction.total,
        couponApplied: null
      });
    }
  }, [isTiffin, loadingTiffin, tiffinOrderDetails, tiffinService, finalPricing, transaction.total]);

  // UPDATED: Fetch tiffin order details with fixed URL
  useEffect(() => {
    const fetchTiffinOrderDetails = async () => {
      if (!isTiffin || !bookingId) return;
      setLoadingTiffin(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        // FIXED: Add / before 'beforePayment' for correct route
        const response = await axios.get(
          `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinBookingById/${bookingId}/beforePayment`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setTiffinOrderDetails(response.data.data);
          console.log("Fetched tiffin booking details:", response.data.data);
        }
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.warn("Booking details 404 - using fallback params/service data");
        } else {
          console.error("Error fetching tiffin booking details:", error);
          Alert.alert("Error", "Failed to fetch tiffin booking details");
        }
      } finally {
        setLoadingTiffin(false);
      }
    };

    fetchTiffinOrderDetails();
  }, [isTiffin, bookingId]);

  // Fetch tiffin service details
  useEffect(() => {
    const fetchTiffinServiceDetails = async () => {
      if (!isTiffin || !serviceId) return;
      setLoadingTiffin(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinServiceById/${serviceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setTiffinService(response.data.data);
          console.log("Fetched tiffin service details:", response.data.data);
        }
      } catch (error: any) {
        console.error("Error fetching tiffin service details:", error);
        Alert.alert("Error", "Failed to fetch tiffin service details");
      } finally {
        setLoadingTiffin(false);
      }
    };

    fetchTiffinServiceDetails();
  }, [isTiffin, serviceId]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletAmount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          "https://tifstay-project-be.onrender.com/api/guest/wallet/getWalletAmount",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setWalletBalance(response.data.data?.walletAmount || 0);
        }
      } catch (error: any) {
        console.error("Error fetching wallet amount:", error);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWalletAmount();
  }, []);

  const paymentAmount = finalPricing?.finalPrice ?? transaction.net ?? transaction.total ?? 0;

  // Fetch all coupons - UPDATED: Use new API endpoint for hostel/service ID
  const fetchCoupons = async () => {
    // Only fetch for hostel (tiffin endpoint not provided)
    if (isTiffin) {
      setCoupons([]);
      return;
    }
    if (!serviceId) {
      console.warn("No serviceId available for fetching coupons");
      setCoupons([]);
      return;
    }
    setLoadingCoupons(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getCouponCodeForHostel/${serviceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        const data = response.data.data || {};
        const fetchedCoupons = [
          ...(data.hostelCoupons || []),
          ...(data.guestCoupons || [])
        ];
        setCoupons(fetchedCoupons);
        console.log("Fetched coupons:", fetchedCoupons); // Debug log
      } else {
        setCoupons([]);
      }
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      Alert.alert("Error", "Failed to fetch coupons");
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Please enter a coupon code');
      return;
    }

    if (!isHostel) {
      Alert.alert("Info", "Coupons are not available for this service.");
      return;
    }

    await fetchFinalPricing(couponCode.trim());
  };

  const handleViewCoupons = async () => {
    if (isTiffin) {
      Alert.alert("Info", "Coupons are not available for tiffin services at this time.");
      return;
    }
    await fetchCoupons();
    setCouponModalVisible(true);
  };

  const createPaymentLink = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !bookingId) {
        Alert.alert("Error", "Token or booking ID missing");
        return null;
      }

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createPaymentLink/${bookingId}`,
        {}, // Assuming no body needed, adjust if required
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        return response.data.data;
      } else {
        Alert.alert("Error", response.data?.message || "Failed to create payment link");
        return null;
      }
    } catch (error: any) {
      console.error("Error creating payment link:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
      return null;
    }
  };

  const createTiffinPaymentLink = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !bookingId) {
        Alert.alert("Error", "Token or booking ID missing");
        return null;
      }

      const response = await axios.post(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/paymentByBank/${bookingId}`,
        {}, // No body needed
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        return response.data.data;
      } else {
        Alert.alert("Error", response.data?.message || "Failed to create payment link");
        return null;
      }
    } catch (error: any) {
      console.error("Error creating tiffin payment link:", error);
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
      return null;
    }
  };

  const handlePayOnline = async () => {
    setModalVisible(false);
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      return;
    }

    const finalBookingId = bookingId as string;

    const paymentData = isTiffin ? await createTiffinPaymentLink() : await createPaymentLink();
    if (paymentData && paymentData.paymentLinkUrl) {
      const supported = await Linking.canOpenURL(paymentData.paymentLinkUrl);
      if (supported) {
        await Linking.openURL(paymentData.paymentLinkUrl);
        // TODO: For proper Razorpay integration, use Razorpay SDK with callbacks.
        // After opening the link, navigate to confirmation assuming success (or implement deep link handling for redirect back).
        // For now, simulate navigation after opening (in real app, handle via deep links or polling).
        // Assuming the bookingId remains the same after payment confirmation on backend.
        setTimeout(() => {
          router.push({
            pathname: "/(secure)/Confirmation",
            params: {
              id: (isTiffin ? (paymentData.tiffinOrderId || finalBookingId) : finalBookingId),
              serviceType: serviceType as string,
              serviceName: checkoutData.title || "Fallback Service Name",
              guestName: (isHostel ? (bookingDetails?.guestName || parsedUserData.name || "Fallback Name") : (tiffinOrderDetails?.guestName || tiffinService?.guestName || parsedUserData.name || "Fallback Name")),
              amount: paymentAmount,
            },
          });
        }, 2000); // Delay to simulate processing
      } else {
        Alert.alert("Error", "Cannot open payment link");
      }
    }
  };

  const handlePayWallet = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      setModalVisible(false);
      return;
    }

    if (walletBalance < paymentAmount) {
      Alert.alert(
        "Insufficient Balance",
        `Your wallet balance is ₹${walletBalance}. Please add more funds to proceed.`
      );
      setModalVisible(false);
      return;
    }

    setModalVisible(false);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !bookingId) {
        Alert.alert("Error", "Token or booking ID missing");
        return;
      }

      let finalBookingId = bookingId as string;
      let newBalance = walletBalance;

      if (isHostel) {
        // Call the wallet booking API for hostel
        const response = await axios.post(
          `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createBookingBywallet/${bookingId}`,
          {}, // No body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          const { data } = response.data;
          newBalance = data.remainingWallet;
          finalBookingId = data.hostelBookingId || bookingId; // Use returned ID or fallback to original
          console.log("Wallet booking created successfully:", data);
        } else {
          Alert.alert("Error", response.data?.message || "Failed to create booking with wallet");
          return;
        }
      } else {
        // For tiffin, call the wallet payment API
        const response = await axios.post(
          `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/payByWallet/${bookingId}`,
          {}, // No body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          const { data } = response.data;
          newBalance = data.remainingWallet;
          finalBookingId = data.tiffinOrderId || bookingId; // Use returned ID or fallback to original
          console.log("Wallet payment for tiffin successful:", data);
        } else {
          Alert.alert("Error", response.data?.message || "Failed to pay with wallet for tiffin");
          return;
        }
      }

      // Update local wallet balance
      setWalletBalance(newBalance);

      Alert.alert(
        "Success!",
        "Booking submitted successfully!",
        [
          {
            text: "Cancel",
            style: "cancel", // iOS me thoda alag dikhai dega
            onPress: () => {
              // Alert close only (kuch navigate nahi hoga)
            },
          },
          {
            text: "OK",
            onPress: () => {
              // Navigate to confirmation screen on OK
              router.push({
                pathname: "/(secure)/Confirmation",
                params: {
                  id: finalBookingId,
                  serviceType: serviceType as string,
                  serviceName: checkoutData.title || "Fallback Service Name",
                  guestName: (isHostel ? (bookingDetails?.guestName || parsedUserData.name || "Fallback Name") : (tiffinOrderDetails?.guestName || tiffinService?.guestName || parsedUserData.name || "Fallback Name")),
                  amount: paymentAmount,
                },
              });
            },
          },
        ]
      );

    } catch (error: any) {
      console.error("Error in wallet payment:", error);
      Alert.alert("Error", error.response?.data?.message || "Wallet payment failed. Please try again.");
    }
  };

  const openPaymentModal = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Cannot proceed to payment because the amount is missing or zero."
      );
      return;
    }
    setSelectedMethod(null); // Reset selection when opening modal
    setModalVisible(true);
  };

  const handleContinue = () => {
    if (selectedMethod === 'online') {
      handlePayOnline();
    } else if (selectedMethod === 'wallet') {
      handlePayWallet();
    }
  };

  // Render coupon item in modal
  const renderCouponItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.couponItem}
      onPress={() => {
        setCouponCode(item.couponCode || '');
        setCouponModalVisible(false);
      }}
    >
      <Text style={styles.couponTitle}>{item.couponCode || 'N/A'}</Text>
      <Text style={styles.couponDescription}>
        {item.offerType === 'Discount' ? `Discount: ${item.discountPercentage ? `${item.discountPercentage}%` : `₹${item.discountAmount}`}` : `Cashback: ₹${item.cashbackAmount}`}
        {' '} | Expires: {new Date(item.endDate).toLocaleDateString('en-IN')}
      </Text>
    </TouchableOpacity>
  );

  if (loadingWallet || (isHostel && loadingBooking) || (isTiffin && loadingTiffin)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Checkout"
          onBack={() => router.back()}
          showBackButton={true}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Checkout"
        onBack={() => router.back()}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemOrderedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Item ordered</Text>
            <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceText}>↓ Invoice</Text>
            </TouchableOpacity>
          </View>

          <CheckoutItemCard
            serviceType={isTiffin ? "tiffin" : "hostel"}
            data={checkoutData}
          />
        </View>

        <View style={styles.couponSection}>
          {/* Header Row */}
          <View style={styles.couponHeader}>
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
            <TouchableOpacity onPress={handleViewCoupons}>
              <Text style={styles.viewCouponsText}>View Coupons</Text>
            </TouchableOpacity>
          </View>

          {/* Input Row */}
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter Coupon Code"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {finalPricing && finalPricing.discountValue > 0 && (
          <View style={styles.transactionSection}>
            <Text style={styles.paymentSectionTitle}>Price Breakdown</Text>
            <View style={styles.transactionDetails}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Total Amount</Text>
                <Text style={styles.transactionValue}>₹{finalPricing.totalAmount}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Discount</Text>
                <Text style={styles.transactionValue}>-₹{finalPricing.discountValue}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>After Discount</Text>
                <Text style={styles.transactionValue}>₹{finalPricing.afterDiscount}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>TPS</Text>
                <Text style={styles.transactionValue}>₹{finalPricing.TPS}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>TVQ</Text>
                <Text style={styles.transactionValue}>₹{finalPricing.TVQ}</Text>
              </View>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Final Price</Text>
                <Text style={styles.netValue}>₹{finalPricing.finalPrice}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{paymentAmount.toFixed(2)}</Text>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policySection}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <Text style={styles.policyText}>
            Please double-check your order and address details.{"\n"}
            Orders are non-refundable once placed.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Payment Method */}
      <View style={styles.paymentSection}>
        <View style={styles.paymentContent}>
          <View style={styles.paymentMethodContainer}>
            <View style={styles.paymentMethodLeft}>
              {/* <Image source={mastercard} style={styles.cardIcon} /> */}
              {/* <View style={styles.paymentTextContainer}>
                <View style={styles.payUsingRow}>
                  <Text style={styles.payUsing}>Pay Using</Text>
                  <Ionicons
                    name="caret-up"
                    size={12}
                    color="#000"
                    style={styles.caretIcon}
                  />
                </View>
                <Text style={styles.cardDetails}>Credit Card | **3054</Text>
              </View> */}
            </View>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={openPaymentModal}
          >
            <Text style={styles.payButtonText}>
              Pay ₹{paymentAmount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Payment Method</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              {/* Online Payment Option */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedMethod === 'online' && styles.selectedOption
                ]}
                onPress={() => setSelectedMethod('online')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="card-outline" size={24} color="#2854C5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Pay Online through Razorpay</Text>
                  <Text style={styles.optionSubtitle}>Secure payment gateway</Text>
                </View>
                {selectedMethod === 'online' ? (
                  <Ionicons name="checkmark" size={20} color="#2854C5" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>

              {/* Wallet Payment Option */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedMethod === 'wallet' && styles.selectedOption
                ]}
                onPress={() => setSelectedMethod('wallet')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="wallet-outline" size={24} color="#2854C5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Pay through Wallet</Text>
                  <View style={styles.walletBalanceContainer}>
                    <Text style={styles.walletBalanceLabel}>Wallet Balance:</Text>
                    <Text style={styles.walletBalance}>₹{walletBalance}</Text>
                  </View>
                </View>
                {selectedMethod === 'wallet' ? (
                  <Ionicons name="checkmark" size={20} color="#2854C5" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>

              {/* Continue Button */}
              <View style={styles.continueButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    !selectedMethod && styles.continueButtonDisabled
                  ]}
                  disabled={!selectedMethod}
                  onPress={handleContinue}
                >
                  <Text style={[
                    styles.continueButtonText,
                    !selectedMethod && styles.continueButtonTextDisabled
                  ]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Coupons Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={couponModalVisible}
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <View style={styles.couponModalOverlay}>
          <View style={styles.couponModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Coupons</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.couponModalOptions}>
              {loadingCoupons ? (
                <Text style={styles.loadingText}>Loading coupons...</Text>
              ) : coupons.length > 0 ? (
                <FlatList
                  data={coupons}
                  keyExtractor={(item, index) => item._id || index.toString()}
                  renderItem={renderCouponItem}
                  style={styles.couponsList}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              ) : (
                <Text style={styles.noCouponsText}>No coupons available</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 26,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  itemOrderedSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceText: {
    color: "#4A90E2",
    fontSize: 14,
  },
  couponSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  couponInputContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#2854C5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewCouponsButton: {
    marginTop: 12,
  },
  viewCouponsText: {
    color: '#4A90E2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // sectionTitle already defined above; removed duplicate to avoid key collision

  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  transactionSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 8,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  transactionDetails: {
    marginTop: 4,
    marginHorizontal: 20,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  transactionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  transactionValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "400",
  },
  totalRow: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft:20,
    marginRight:20
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  lessOffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  netRow: {
    paddingTop: 14,
    marginTop: 0,
    marginBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  netValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  policySection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  policyText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  paymentSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2EFFD",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentMethodContainer: {
    flex: 1,
    marginRight: 12,
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 32,
    height: 20,
    marginRight: 12,
    resizeMode: "contain",
  },
  paymentTextContainer: {
    flex: 1,
  },
  payUsingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  payUsing: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  caretIcon: {
    marginLeft: 4,
  },
  cardDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  payButton: {
    backgroundColor: "#2854C5",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 120,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalOptions: {
    paddingHorizontal: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EFFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  walletBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  walletBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2854C5',
  },
  continueButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: '#2854C5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
  // Coupon Modal Styles
  couponModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    height: '80%',
    paddingBottom: 20,
    flexDirection: 'column',
  },
  couponModalOptions: {
    flex: 1,
    paddingHorizontal: 20,
  },
  couponsList: {
    flex: 1,
  },
  couponItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  noCouponsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
});

export default Checkout;