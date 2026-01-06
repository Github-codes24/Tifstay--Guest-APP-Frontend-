import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mastercard from "@/assets/images/icons/mastercard.png";
import CheckoutItemCard, {
  TiffinCheckoutData,
  HostelCheckoutData,
} from "@/components/CheckoutItemCard";
import Header from "@/components/Header";
import Toast from 'react-native-toast-message';
import { theme } from "@/constants/utils";
import { BASE_URL } from "@/constants/api";

const Checkout: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [insufficientModalVisible, setInsufficientModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'wallet' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [tiffinOrderDetails, setTiffinOrderDetails] = useState<any | null>(null);


  console.log('tiffinOrderDetails98765678', tiffinOrderDetails)
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
    type,
  } = params;
  const effectiveServiceType = (type as string) || (serviceType as string);
  const isTiffin = effectiveServiceType === "tiffin";
  const isHostel = effectiveServiceType === "hostel";
  const firstParam = (val: string | string[] | undefined): string | undefined => {
    if (val === undefined) return undefined;
    return Array.isArray(val) ? val[0] : val;
  };
  const parsedHostelData = hostelDataStr ? JSON.parse(hostelDataStr as string) : {};
  const parsedRoomData = roomDataStr ? JSON.parse(roomDataStr as string) : {};
  const parsedSelectedBeds = selectedBedsStr ? JSON.parse(selectedBedsStr as string) : [];
  const parsedPlan = planStr ? JSON.parse(planStr as string) : {};
  const parsedUserData = userDataStr ? JSON.parse(userDataStr as string) : {};


  console.log("Dynamic Checkout Params:", {
    effectiveServiceType,
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
    // NEW: Fallback params (unchanged)
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


  const tiffinData: TiffinCheckoutData = useMemo(() => {
    // Ultimate fallback (जब कुछ भी नहीं मिले)
    if (!tiffinOrderDetails && !tiffinService) {
      const fallbackPrice = parseInt(firstParam(totalPrice) || "120");
      return {
        id: firstParam(bookingId) || firstParam(serviceId) || "1",
        title: "Maharashtrian Ghar Ka Khana",
        imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
        foodType: foodType || "Veg",
        startDate: startDate
          ? new Date(startDate as string).toLocaleDateString("en-IN")
          : checkInDate
            ? new Date(checkInDate as string).toLocaleDateString("en-IN")
            : "21/07/25",
        endDate: endDate
          ? new Date(endDate as string).toLocaleDateString("en-IN")
          : checkOutDate
            ? new Date(checkOutDate as string).toLocaleDateString("en-IN")
            : "28/07/25",
        plan: planType || "Per meal",
        orderType: orderType || "Delivery",
        price: `₹${fallbackPrice}/meal`,
        marketPlaceFee: 0,
        totalAmount: `₹${fallbackPrice}`,
      };
    }

    // MAIN CASE: जब tiffinOrderDetails API से आया हो (सबसे important)
    if (tiffinOrderDetails) {
      // Subscription details से सही price और plan निकालो
      const subscription = tiffinOrderDetails.subscribtionAmount;
      const basePrice = subscription?.price ?? tiffinOrderDetails.price ?? 500;
      const planFromSubscription = subscription?.subscribtion ?? "weekly"; // weekly, monthly, daily

      // Desired format: 500/weekly  या  ₹500/weekly
      const formattedPrice = `₹${basePrice}/${planFromSubscription.toLowerCase()}`;
      // अगर सिर्फ 500/weekly चाहिए (बिना ₹ के) तो ऊपर की लाइन को बदल दें:
      // const formattedPrice = `${basePrice}/${planFromSubscription.toLowerCase()}`;

      const marketPlaceFee = tiffinOrderDetails.marketPlaceFee || 0;
      const calculatedTotal = basePrice + marketPlaceFee;

      return {
        id: firstParam(bookingId) || firstParam(serviceId) || "1",
        title: tiffinOrderDetails.tiffinServiceName || "Maharashtrian Ghar Ka Khana",
        imageUrl: tiffinOrderDetails.servicePhoto || tiffinOrderDetails.imageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
        foodType: tiffinOrderDetails.foodType || "Veg",
        startDate: new Date(tiffinOrderDetails.startDate).toLocaleDateString("en-IN"),
        endDate: new Date(tiffinOrderDetails.endDate).toLocaleDateString("en-IN"),
        plan: tiffinOrderDetails.planType || "Dinner", // Lunch/Dinner/Both
        orderType: tiffinOrderDetails.orderType || "Delivery",
        price: formattedPrice,                 // ← अब दिखेगा: ₹500/weekly
        marketPlaceFee,
        totalAmount: `₹${calculatedTotal}`,
      };
    }

    // Fallback: अगर tiffinOrderDetails नहीं आया, लेकिन tiffinService है
    const priceNum = tiffinService?.price || parseInt(firstParam(totalPrice) || "120");
    const marketPlaceFee = tiffinService?.marketPlaceFee || 0;
    const totalAmount = priceNum + marketPlaceFee;

    return {
      id: firstParam(serviceId) || "1",
      title: tiffinService?.tiffinName || tiffinService?.tiffinServiceName || "Maharashtrian Ghar Ka Khana",
      imageUrl: tiffinService?.image || tiffinService?.imageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
      foodType: firstParam(foodType) || tiffinService?.foodType || "Veg",
      startDate: startDate
        ? new Date(firstParam(startDate) as string).toLocaleDateString("en-IN")
        : checkInDate
          ? new Date(firstParam(checkInDate) as string).toLocaleDateString("en-IN")
          : "21/07/25",
      endDate: endDate
        ? new Date(firstParam(endDate) as string).toLocaleDateString("en-IN")
        : checkOutDate
          ? new Date(firstParam(checkOutDate) as string).toLocaleDateString("en-IN")
          : "28/07/25",
      plan: firstParam(planType) || "Per meal",
      orderType: firstParam(orderType) || "Delivery",
      price: `₹${priceNum}/meal`,
      marketPlaceFee,
      totalAmount: `₹${totalAmount}`,
    };
  }, [
    tiffinOrderDetails,
    tiffinService,
    bookingId,
    serviceId,
    totalPrice,
    planType,
    startDate,
    endDate,
    foodType,
    orderType,
    checkInDate,
    checkOutDate,
  ]);

  console.log("Constructed tiffinData:", tiffinData);

  // FIXED: Wrap in useMemo for reactivity - unchanged
  const hostelData: HostelCheckoutData = useMemo(() => {
    const fallbackRent = parsedPlan.price || 100;
    const fallbackDeposit = parsedPlan.depositAmount || 200;

    // Priority order: API → parsedPlan → fallback
    const rawPlanName =
      bookingDetails?.selectPlan?.[0]?.name ||
      parsedPlan?.name ||
      'monthly'; // safe fallback

    console.log("Raw Plan Name from API/Params:", rawPlanName); // Debug के लिए रखो

    // सही display text decide करो - exact match
    let planUnit = 'per month'; // default

    if (rawPlanName) {
      const lower = rawPlanName.toLowerCase().trim();

      if (lower === 'weekly') {
        planUnit = 'per week';
      } else if (lower === 'monthly') {
        planUnit = 'per month';
      } else if (lower === 'daily' || lower === 'perday' || lower === 'per day') {
        planUnit = 'per day';
      }
      // अगर backend से "perDay" आता है (कभी-कभी आता है)
      else if (lower === 'perday') {
        planUnit = 'per day';
      }
    }

    const rentPrice =
      bookingDetails?.selectPlan?.[0]?.price ||
      bookingDetails?.Rent ||
      bookingDetails?.price ||
      parsedPlan?.price ||
      fallbackRent;

    const depositAmount =
      bookingDetails?.totalDeposit ||
      bookingDetails?.selectPlan?.[0]?.depositAmount ||
      fallbackDeposit;

    return {
      id: firstParam(bookingId) || "2",
      title: bookingDetails?.hostelName || parsedHostelData.name || "Fallback Hostel Name",
      imageUrl:
        bookingDetails?.hostelimage ||
        parsedRoomData.photos?.[0] ||
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
      guestName: bookingDetails?.guestName || parsedUserData.name || "Fallback Name",
      contact: bookingDetails?.contact || parsedUserData.phoneNumber || "Fallback Phone",
      checkInDate: bookingDetails?.checkInDate
        ? new Date(bookingDetails.checkInDate).toLocaleDateString('en-IN')
        : checkInDate
          ? new Date(checkInDate as string).toLocaleDateString('en-IN')
          : "31/01/2026",
      checkOutDate: bookingDetails?.checkOutDate
        ? new Date(bookingDetails.checkOutDate).toLocaleDateString('en-IN')
        : checkOutDate
          ? new Date(checkOutDate as string).toLocaleDateString('en-IN')
          : "01/02/2026",
      rent: `₹${rentPrice}/${planUnit}`, // अब सही दिखेगा: ₹500/per week
      deposit: `₹${depositAmount}`,
    };
  }, [
    bookingDetails,
    parsedHostelData,
    parsedRoomData,
    parsedUserData,
    parsedPlan,
    bookingId,
    checkInDate,
    checkOutDate,
  ]);

  console.log("Constructed hostelData:", hostelData);

  const checkoutData = isTiffin ? tiffinData : hostelData;
  console.log('checkoutData098', checkoutData)


  console.log("Service ID from BookingScreen:", serviceId);
  console.log("Full checkoutData ID :", checkoutData.id);

  // FIXED: Use correct keys in hostel logic
  // UPDATED: getTransactionDetails with proper hostel calculation (defensive)
  // FIXED: For tiffin, use tiffinOrderDetails instead of bookingDetails
  const getTransactionDetails = useMemo(() => {
    console.log("🔄 getTransactionDetails - isTiffin:", isTiffin);
    if (isTiffin) {
      // TIFFIN LOGIC — Price based on plan (daily/weekly/monthly), no deposit
      // Extract price from various possible sources - FIXED for tiffin
      const rawPrice = tiffinOrderDetails?.price
        ?? tiffinOrderDetails?.choosePlanType?.price
        ?? parsedPlan?.price
        ?? Number((tiffinData?.price || '').replace(/[^0-9.]/g, ''))
        ?? 120;
      // Plan type for multiplier (if duration-based; for now, assume price is for full plan unit)
      const plan = tiffinOrderDetails?.planType || tiffinOrderDetails?.choosePlanType?.planName || tiffinData?.plan || 'per meal';
      let multiplier = 1; // Default: 1 unit (week/month)
      // Number of tiffins
      const numTiffin = parseInt(tiffinOrderDetails?.numberOfTiffin?.toString() || firstParam(numberOfTiffin) || '1');
      if (plan === 'per meal') {
        multiplier = numTiffin;
      } else {
        // For duration-based plans
        const start = tiffinOrderDetails?.startDate || tiffinOrderDetails?.date || startDate || checkInDate;
        const end = tiffinOrderDetails?.endDate || endDate || checkOutDate;
        if (start && end) {
          const daysDiff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1; // Inclusive
          if (plan.toLowerCase().includes('daily')) multiplier = daysDiff * numTiffin;
          else if (plan.toLowerCase().includes('weekly')) multiplier = Math.ceil(daysDiff / 7) * numTiffin;
          else if (plan.toLowerCase().includes('monthly')) multiplier = Math.ceil(daysDiff / 30) * numTiffin;
        } else {
          multiplier = numTiffin;
        }
      }
      const price = Number(rawPrice);
      const totalTiffin = price * multiplier;
      const total = totalTiffin;
      console.log("🍲 TIFFIN BREAKDOWN:", {
        rawPrice,
        price,
        plan,
        multiplier,
        numTiffin,
        totalTiffin,
        total,
        startDate: startDate || tiffinOrderDetails?.date,
        endDate: endDate || tiffinOrderDetails?.endDate
      });
      return {
        rent: price, // Reuse 'rent' key for UI compatibility (represents tiffin cost per unit)
        months: multiplier, // Reuse 'months' as units (days/weeks/months)
        totalRent: totalTiffin,
        deposit: 0, // No deposit for tiffin
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
    let months = 1; // Default fallback
    if (checkIn && checkOut) {
      const checkInDateObj = new Date(checkIn);
      const checkOutDateObj = new Date(checkOut);
      months = Math.max(1, (checkOutDateObj.getFullYear() - checkInDateObj.getFullYear()) * 12 + (checkOutDateObj.getMonth() - checkInDateObj.getMonth()));
    }
    const totalRent = planPrice * months;
    const total = totalRent;
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
  }, [isTiffin, bookingDetails, parsedPlan, checkInDate, checkOutDate, tiffinData, tiffinOrderDetails, numberOfTiffin, startDate, endDate]); // UPDATED: Use isTiffin (which uses effectiveServiceType)

  const transaction = getTransactionDetails;
  console.log("Transaction Details:", transaction);

const fetchFinalPricing = async (coupon: string) => {
  if (!bookingId || !coupon.trim()) return;

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const url = isTiffin
      ? `${BASE_URL}/api/guest/tiffinServices/AppliedCoupon/${bookingId}`
      : `${BASE_URL}/api/guest/hostelServices/AppliedCoupon/${bookingId}`;

    const response = await axios.post(url, { coupon }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data?.success) {
      const pricingData = response.data.data;
      console.log("=== COUPON APPLIED RESPONSE ===", pricingData);

      // दोनों services के लिए finalPricing set करो
      setFinalPricing(pricingData);

      setAppliedCoupon(coupon.trim());
      setCouponCode('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Coupon applied successfully!',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.data?.message || "Invalid coupon",
      });
    }
  } catch (error: any) {
    console.error("Coupon apply error:", error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.response?.data?.message || "Failed to apply coupon",
    });
  }
};

const handleRemoveCoupon = async () => {
  setAppliedCoupon(null);
  setFinalPricing(null);
  setCouponCode('');

  // Original data लाने के लिए refetch (beforeDiscountValue + fee के लिए)
  if (isHostel && bookingId) {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${BASE_URL}/api/guest/hostelServices/gethostelBookingByIdbeforePayment/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setBookingDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error refetching on remove:", error);
    }
  }

  // Tiffin के लिए भी (optional)
  if (isTiffin && bookingId) {
    // same as before
  }

  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: "Coupon removed successfully",
  });
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
          `${BASE_URL}/api/guest/hostelServices/gethostelBookingByIdbeforePayment/${bookingId}`,
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
  }, [isHostel, bookingId]); // UPDATED: Use isHostel (which uses effectiveServiceType)

  // Fetch initial final pricing for hostel from API (base pricing)
  useEffect(() => {
    if (isHostel && !loadingBooking && bookingDetails && !finalPricing) {
      fetchFinalPricing(null); // Fetch base pricing (coupon: null) from API
    }
  }, [isHostel, loadingBooking, bookingDetails, finalPricing]); // UPDATED: Use isHostel

  // Fetch initial final pricing for tiffin from API (base pricing)
  useEffect(() => {
    if (isTiffin && !loadingTiffin && tiffinOrderDetails && !finalPricing) {
      fetchFinalPricing(null); // Fetch base pricing (coupon: null) from API
    }
  }, [isTiffin, loadingTiffin, tiffinOrderDetails, finalPricing]); // UPDATED: Use isTiffin

  useEffect(() => {
    const fetchTiffinOrderDetails = async () => {
      if (!isTiffin || !bookingId) {
        console.warn("Cannot fetch tiffin details: isTiffin =", isTiffin, "bookingId =", bookingId);
        return;
      }

      setLoadingTiffin(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("No token found");
          return;
        }

        console.log("Fetching tiffin details for bookingId:", bookingId);

        const response = await axios.get(
          `${BASE_URL}/api/guest/tiffinServices/getTiffinBookingByIdbeforePayment/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Tiffin API Response:", response.data);

        if (response.data?.success && response.data.data) {
          setTiffinOrderDetails(response.data.data);
        } else {
          console.warn("No success or data in response", response.data);
          // Optional: fallback to params
        }
      } catch (error: any) {
        console.error("Failed to fetch tiffin details:", error.response?.data || error.message);
        // Alert.alert("Error", "Unable to load tiffin details");
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
          `${BASE_URL}/api/guest/tiffinServices/getTiffinServiceById/${serviceId}`,
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
  }, [isTiffin, serviceId]); // UPDATED: Use isTiffin

  // Fetch wallet balance - Initial load with loading state
  useEffect(() => {
    const fetchWalletAmount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const response = await axios.get(
          `${BASE_URL}/api/guest/wallet/getWalletAmount`,
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

  // Refetch wallet balance on screen focus (e.g., after returning from add funds)
  useFocusEffect(
    useCallback(() => {
      const refreshWalletBalance = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          const response = await axios.get(
            `${BASE_URL}/api/guest/wallet/getWalletAmount`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data?.success) {
            setWalletBalance(response.data.data?.walletAmount || 0);
            console.log("Refetched wallet balance on focus:", response.data.data?.walletAmount);
          }
        } catch (error: any) {
          console.error("Error refetching wallet amount on focus:", error);
        }
      };
      refreshWalletBalance();
    }, [])
  );

  const depositAmount = transaction?.deposit || (finalPricing?.depositAmount || 0) || 0;
  const adjustedFinalPrice = finalPricing?.finalPrice ?? null;
  const paymentAmount = adjustedFinalPrice ?? transaction?.net ?? transaction?.total ?? 0;


  // Fetch all coupons - UPDATED: Support both hostel and tiffin APIs - UPDATED to use effectiveServiceType via isTiffin/isHostel
  const fetchCoupons = async () => {
    if (!serviceId) {
      console.warn("No serviceId available for fetching coupons");
      setCoupons([]);
      return;
    }
    setLoadingCoupons(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      let url;
      let serviceCouponsKey;
      let guestCouponsKey = 'guestCoupons';
      if (isTiffin) {
        url = `${BASE_URL}/api/guest/tiffinServices/getCouponForTiffinService/${serviceId}`;
        serviceCouponsKey = 'tiffinServiceCoupons';
      } else {
        url = `${BASE_URL}/api/guest/hostelServices/getCouponCodeForHostel/${serviceId}`;
        serviceCouponsKey = 'hostelCoupons';
      }
      const response = await axios.get(
        url,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data?.success) {
        const data = response.data.data || {};
        const fetchedCoupons = [
          ...(data[serviceCouponsKey] || []),
          ...(data[guestCouponsKey] || [])
        ];
        setCoupons(fetchedCoupons);
        // console.log("Fetched coupons:", fetchedCoupons); // Debug log
      } else {
        setCoupons([]);
      }
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: "Failed to fetch coupons"
      });
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a coupon code'
      });
      return;
    }
    await fetchFinalPricing(couponCode.trim());
  };

  const handleViewCoupons = async () => {
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
        `${BASE_URL}/api/guest/hostelServices/createPaymentLink/${bookingId}`,
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
        `${BASE_URL}/api/guest/tiffinServices/paymentByBank/${bookingId}`,
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
        // FIXED: Always use original bookingId for confirmation (ignore API-returned IDs)
        const confirmationId = finalBookingId;
        const confirmationServiceType = effectiveServiceType as string; // UPDATED: Use effectiveServiceType
        const confirmationServiceName = checkoutData.title || "Fallback Service Name";
        const confirmationGuestName = (isHostel ? (bookingDetails?.guestName || parsedUserData.name || "Fallback Name") : (tiffinOrderDetails?.guestName || tiffinService?.guestName || parsedUserData.name || "Fallback Name"));
        const confirmationAmount = paymentAmount;

        // console.log("=== ONLINE PAYMENT: Sending to Confirmation Screen ===");
        // console.log("confirmationId (booking/order ID):", confirmationId);
        // console.log("Full params:", { id: confirmationId, serviceType: confirmationServiceType, serviceName: confirmationServiceName, guestName: confirmationGuestName, amount: confirmationAmount, checkInDate, checkOutDate });
        // console.log("========================================================");
        setTimeout(() => {
          router.push({
            pathname: "/(secure)/Confirmation",
            params: {
              id: confirmationId,
              serviceType: confirmationServiceType,
              serviceName: confirmationServiceName,
              guestName: confirmationGuestName,
              amount: confirmationAmount,
              checkInDate,
              checkOutDate,
              startDate,
              endDate,
              foodType,
              orderType,
              planType,
              mealType: mealPreference,
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
      setInsufficientModalVisible(true);
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
      let newBalance = walletBalance;
      if (isHostel) {
        // Call the wallet booking API for hostel
        const response = await axios.post(
          `${BASE_URL}/api/guest/hostelServices/createBookingBywallet/${bookingId}`,
          {}, // No body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data?.success) {
          const { data } = response.data;
          newBalance = data.remainingWallet;
          // FIXED: Log new ID but use original for confirmation
          console.log("Wallet booking created successfully (new ID):", data.hostelBookingId, "Original ID:", bookingId);
        } else {
          Alert.alert("Error", response.data?.message || "Failed to create booking with wallet");
          return;
        }
      } else {
        // For tiffin, call the wallet payment API
        const response = await axios.post(
          `${BASE_URL}/api/guest/tiffinServices/payByWallet/${bookingId}`,
          {}, // No body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data?.success) {
          const { data } = response.data;
          newBalance = data.remainingWallet;
          // FIXED: Log new ID but use original for confirmation
          console.log("Wallet payment for tiffin successful (new ID):", data.tiffinOrderId, "Original ID:", bookingId);
        } else {
          Alert.alert("Error", response.data?.message || "Failed to pay with wallet for tiffin");
          return;
        }
      }
      // Update local wallet balance
      setWalletBalance(newBalance);
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Booking submitted successfully!'
      });
      // FIXED: Always use original bookingId for confirmation
      const confirmationId = bookingId as string;
      const confirmationServiceType = effectiveServiceType as string; // UPDATED: Use effectiveServiceType
      const confirmationServiceName = checkoutData.title || "Fallback Service Name";
      const confirmationGuestName = (isHostel ? (bookingDetails?.guestName || parsedUserData.name || "Fallback Name") : (tiffinOrderDetails?.guestName || tiffinService?.guestName || parsedUserData.name || "Fallback Name"));
      const confirmationAmount = paymentAmount;

      // console.log("=== WALLET PAYMENT: Sending to Confirmation Screen ===");
      console.log("confirmationId (booking/order ID):", confirmationId);
      console.log("Full params:", { id: confirmationId, serviceType: confirmationServiceType, serviceName: confirmationServiceName, guestName: confirmationGuestName, amount: confirmationAmount, checkInDate, checkOutDate });
      console.log("========================================================");
      setTimeout(() => {
        router.push({
          pathname: "/(secure)/Confirmation",
          params: {
            id: confirmationId,
            serviceType: confirmationServiceType,
            serviceName: confirmationServiceName,
            guestName: confirmationGuestName,
            amount: confirmationAmount,
            checkInDate,
            checkOutDate,
            startDate,
            endDate,
            foodType,
            orderType,
            planType,
            mealType: mealPreference,
          },
        });
      }, 2000);
    } catch (error: any) {
      console.error("Error in wallet payment:", error);
      console.error("Backend response:", error.response?.data);
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
    if (isHostel) {
      setDepositModalVisible(true);
    } else {
      setSelectedMethod(null); // Reset selection when opening modal
      setModalVisible(true);
    }
  };

  const handleContinue = () => {
    if (selectedMethod === 'online') {
      handlePayOnline();
    } else if (selectedMethod === 'wallet') {
      handlePayWallet();
    }
  };

  const handleDepositContinue = () => {
    setDepositModalVisible(false);
    setSelectedMethod(null);
    setModalVisible(true);
  };

  const handleInsufficientClose = () => {
    setInsufficientModalVisible(false);
  };

  const handleAddFunds = () => {
    setInsufficientModalVisible(false);
    // Navigate to wallet top-up screen or open add funds flow
    router.push('/(secure)/account/wallet');
    // Assuming a WalletTopUp screen exists; adjust as needed
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

  if (loadingWallet || (isHostel && loadingBooking) || (isTiffin && loadingTiffin)) { // UPDATED: Use effective isTiffin/isHostel
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, marginTop: theme.verticalSpacing.space_20 }}>
          <Header
            title="Checkout"
            onBack={() => router.back()}
            showBackButton={true}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const discountValueNum = Number(finalPricing?.discountValue || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, marginTop: theme.verticalSpacing.space_30 }}>

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
              {/* <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceText}>↓ Invoice</Text>
            </TouchableOpacity> */}
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
                <Text style={styles.viewCouponsText}>View Coupons</Text>2
              </TouchableOpacity>
            </View>
            {/* Input Row */}
            <View style={styles.couponInputContainer}>
              {appliedCoupon ? (
                // Show applied coupon as a themed tag with inline remove
                <View style={styles.appliedCouponContainer}>
                  <View style={styles.appliedTag}>
                    <Text style={styles.appliedTagText}>✓ {appliedCoupon}</Text>
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={handleRemoveCoupon}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Remove coupon"
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Original input and apply
                <>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter Coupon Code"
                    placeholderTextColor="#000"
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                  <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          {/* Complete Breakdown - Tiffin & Hostel (with/without coupon) */}
                {/* Unified Breakdown for Tiffin & Hostel */}
          <View style={styles.transactionSection}>
            {/* Original Amount */}
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>
                {isTiffin ? 'Tiffin Price' : `Total Beds (${bookingDetails?.totalBeds || 0})`}
              </Text>
              <Text style={styles.transactionValue}>
                ₹{isTiffin
                  ? (tiffinOrderDetails?.beforeDiscountValue ?? tiffinOrderDetails?.price ?? finalPricing?.totalAmount ?? 0)
                 : (bookingDetails?.beforeDiscountValue ?? 0)
                }
              </Text>
            </View>

            {/* Coupon Discount - appliedCoupon true हो और discount > 0 हो */}
           {appliedCoupon && finalPricing?.discountValue > 0 && (
  <>
    <View style={styles.transactionRow}>
      <Text style={styles.transactionLabel}>Coupon Discount</Text>
      <Text style={styles.transactionValue} style={{color: 'green'}}>
        -₹{finalPricing.discountValue}
      </Text>
    </View>
    <View style={styles.transactionRow}>
      <Text style={styles.transactionLabel}>Rent after discount</Text>
      <Text style={styles.transactionValue}>
        ₹{finalPricing.afterDiscount ?? finalPricing.finalPrice}
      </Text>
    </View>
  </>
)}

            {/* Marketplace Fee */}
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Marketplace Fee</Text>
              <Text style={styles.transactionValue}>
                ₹{isTiffin ? (tiffinOrderDetails?.marketPlaceFee ?? 0) : (bookingDetails?.marketPlaceFee ?? 0)}
              </Text>
            </View>

            {/* Total Payable */}
<View style={styles.netRow}>
  <Text style={styles.netLabel}>Total Payable</Text>
  <Text style={styles.netValue}>
    ₹{
      appliedCoupon && finalPricing
        ? (finalPricing.finalPrice ?? finalPricing.afterDiscount ?? 0)
          + (bookingDetails?.marketPlaceFee ?? tiffinOrderDetails?.marketPlaceFee ?? 0)
        : (bookingDetails?.beforeDiscountValue ?? bookingDetails?.Rent ?? 0)
          + (bookingDetails?.marketPlaceFee ?? tiffinOrderDetails?.marketPlaceFee ?? 0)
    }
  </Text>
</View>
          </View>
          {/* Cancellation Policy */}
          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>Cancellation Policy:</Text>
            <Text style={styles.policyText}>
              Please double-check your order and address details.{"\n"}
              Orders are non-refundable once placed.
            </Text>
          </View>
          {isHostel && (
            <View style={styles.policySection}>
              <Text style={styles.policyTitle}>Note:</Text>
              <Text style={styles.policyText}>
                The deposit is refundable & payable only at the owner’s property, When you visit, the owner will collect the deposit amount as part of the check-in process.

              </Text>
            </View>
          )}
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
                    size: 12,
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
    Pay ₹{
      appliedCoupon && finalPricing
        ? (finalPricing.finalPrice ?? finalPricing.afterDiscount ?? 0)
          + (bookingDetails?.marketPlaceFee ?? tiffinOrderDetails?.marketPlaceFee ?? 0)
        : (bookingDetails?.beforeDiscountValue ?? bookingDetails?.Rent ?? 0)
          + (bookingDetails?.marketPlaceFee ?? tiffinOrderDetails?.marketPlaceFee ?? 0)
    }
  </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Deposit Modal - NEW */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={depositModalVisible}
          onRequestClose={() => setDepositModalVisible(false)}
        >
          <View style={styles.depositModalOverlay}>
            <View style={styles.depositModalContainer}>
              <Text style={styles.depositModalTitle}>Important Notice</Text>
              <Text style={styles.depositModalText}>
                You have to pay ₹{depositAmount} at the owner property
                and it is refundable
              </Text>
              <TouchableOpacity
                style={styles.depositContinueButton}
                onPress={handleDepositContinue}
              >
                <Text style={styles.depositContinueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Insufficient Balance Modal - NEW */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={insufficientModalVisible}
          onRequestClose={handleInsufficientClose}
        >
          <View style={styles.insufficientModalOverlay}>
            <View style={styles.insufficientModalContainer}>
              <Ionicons name="wallet-outline" size={48} color="#FF6B6B" />
              <Text style={styles.insufficientModalTitle}>Insufficient Balance</Text>
              <Text style={styles.insufficientModalText}>
                Your wallet balance is ₹{walletBalance.toFixed(2)}.{"\n"}
                Please add more funds to proceed with the payment.
              </Text>
              <View style={styles.insufficientModalButtons}>
                <TouchableOpacity
                  style={styles.addFundsButton}
                  onPress={handleAddFunds}
                >
                  <Text style={styles.addFundsButtonText}>Add Funds</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleInsufficientClose}
                >
                  <Text style={styles.cancelButtonText}>Try Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
      </View>
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
    backgroundColor: '#f9f9f9',  // Optional: Consider '#fff' for pure white if contrast is still an issue
    marginRight: 8,
    color: '#000',
    placeholderTextColor: '#666',  // Darker gray—try '#555' or '#333' if needed for even more contrast
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
  appliedCouponContainer: {
    flex: 1,
    marginTop: 12,
  },
  appliedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', // Light blue matching theme
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB', // Softer blue border
  },
  appliedTagText: {
    color: '#1976D2', // Deeper blue for text, theme-aligned
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  removeTagButton: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#2854C5', // Pay button blue
    marginLeft: 4,
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
    marginLeft: 20,
    marginRight: 20
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
  discountRow: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 20,
    marginRight: 20
  },
  discountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  discountValue: {
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
    bottom: 10,
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
    height: 120
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
    paddingVertical: 13,
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
  // NEW: Deposit Modal Styles
  depositModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositModalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  depositModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  depositModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  depositContinueButton: {
    backgroundColor: '#2854C5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  depositContinueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // NEW: Insufficient Balance Modal Styles
  insufficientModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insufficientModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  insufficientModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  insufficientModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  insufficientModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  addFundsButton: {
    flex: 1,
    backgroundColor: '#2854C5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  addFundsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
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