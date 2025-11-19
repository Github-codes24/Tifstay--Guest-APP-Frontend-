import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl, // Add this import for pull-to-refresh
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import colors from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/Buttons";
import TrackOrderModal from "@/components/modals/TrackOrderModal";
import fallbackDp from "@/assets/images/fallbackdp.png"; // Added import for fallback profile image
interface Order {
  id: string;
  bookingId: string;
  serviceType: "tiffin" | "hostel";
  serviceName: string;
  customer: string;
  startDate?: string;
  endDate?: string;
  mealType?: string;
  foodType?: string;
  plan?: string;
  orderType?: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled" | "completed" | "rejected";
  checkInDate?: string;
  checkOutDate?: string;
  price?: string;
  planPrice?: string; // New: Base plan price (e.g., "₹900")
  // image?: string;
  entityId?: string; // Actual _id string for the service/hostel (for reviews/navigation)
  rooms?: Array<{
    roomId: string;
    roomNumber: string;
    bedNumber?: Array<{
      bedId: string;
      bedNumber: number;
      name?: string;
    }>;
  }>;
  tiffinServiceId?: string; // Tiffin-specific: Service ID
  guestId?: string; // Tiffin-specific: Guest ID
  guestName?: string; // Tiffin-specific: Guest full name
}
const fetchHostelOrders = async (tab: "pending" | "confirmed" | "rejected"): Promise<Order[]> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  let hostelUrl: string;
  if (tab === "pending") {
    hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPendingHostelBookings";
  } else if (tab === "confirmed") {
    hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getConfirmedHostelBookings";
  } else {
    hostelUrl = "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRejectedHostelBookings";
  }
  const hostelResponse = await axios.get(hostelUrl, { headers });
  console.log("Hostel API Response:", hostelResponse.data);
  if (!hostelResponse.data.success) {
    throw new Error("Failed to fetch hostel orders");
  }
  const fetchedHostelOrders: Order[] = hostelResponse.data.data.map((item: any) => {
    // Normalize price value: accept 0 as valid, prefer applied coupon for rejected
    let priceValue = item.price;
    if (tab === "rejected") {
      // Use finalprice when available, otherwise fall back to item.price
      priceValue = item.AppiledCoupon?.finalprice ?? item.price ?? 0;
    }
    const selectPlan = item.selectPlan?.[0] || { name: "monthly", price: 0 };
    // Helper to format price safely (handles numbers and already-formatted strings)
    const formatPrice = (val: any) => {
      if (val === null || val === undefined) return "₹0";
      const s = String(val).trim();
      if (s === "") return "₹0";
      return s.startsWith("₹") ? s : `₹${s}`;
    };
    return {
      id: item._id,
      bookingId: item.bookingId || item._id, // Use bookingId if available, fallback to _id
      serviceType: "hostel" as const,
      serviceName: item.hostelId?.hostelName || "Unknown Hostel",
      customer: item.fullName || "Unknown User",
      checkInDate: item.checkInDate
        ? new Date(item.checkInDate).toLocaleDateString()
        : "",
      checkOutDate: item.checkOutDate
        ? new Date(item.checkOutDate).toLocaleDateString()
        : "",
      endDate: item.checkOutDate
        ? new Date(item.checkOutDate).toLocaleDateString()
        : "",
      status: item.status.toLowerCase() as Order["status"],
      // image: item.userPhoto,
      price: formatPrice(priceValue),
      planPrice: formatPrice(selectPlan.price), // New: Base plan price
      plan: selectPlan.name || "monthly", // New: Pass plan name (e.g., "monthly", "weekly")
      // FIXED: Extract _id as string; handle object or string input
      entityId: typeof item.hostelId === "object" ? item.hostelId?._id : (typeof item.hostelId === "string" ? item.hostelId : undefined),
      rooms: item.rooms || [],
    };
  });
  // DEBUG: Log hostel orders statuses
  console.log("Fetched Hostel Orders:", fetchedHostelOrders.map(o => ({ id: o.id, status: o.status, serviceType: o.serviceType, plan: o.plan })));
  return fetchedHostelOrders;
};
const fetchTiffinOrders = async (tab: "pending" | "confirmed" | "rejected"): Promise<Order[]> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  let tiffinUrl: string;
  if (tab === "pending") {
    tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPendingTiffinOrder";
  } else if (tab === "confirmed") {
    tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getConfirmedTiffinOrder";
  } else {
    tiffinUrl = "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getRejectedTiffinOrder";
  }
  const tiffinResponse = await axios.get(tiffinUrl, { headers });
  console.log("Token res:", token);
  console.log("Tiffin API Response:", tiffinResponse);
  if (!tiffinResponse.data.success) {
    throw new Error("Failed to fetch tiffin orders");
  }
  const fetchedTiffinOrders: Order[] = tiffinResponse.data.data.map((item: any) => {
    // FIXED: Use direct fields from API (no tiffins array assumption)
    const serviceName = (item.tiffinServiceName && item.tiffinServiceName !== "N/A" && item.tiffinServiceName.trim() !== "")
      ? item.tiffinServiceName
      : "Unknown Tiffin Service";
    return {
      id: item._id,
      bookingId: item.bookingId,
      serviceType: "tiffin" as const,
      serviceName,
      customer: "You",
      startDate: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
      endDate: item.endDate ? new Date(item.endDate).toLocaleDateString() : "", // FIXED: Use endDate from API
      mealType: item.planType || "", // FIXED: Direct from planType (e.g., "Lunch & dinner")
      foodType: item.foodType || "", // FIXED: Direct from API (e.g., "Veg")
      plan: item.plan || "", // FIXED: Use planType as fallback (e.g., "Lunch & dinner")
      orderType: item.orderType || "", // FIXED: Direct from API (e.g., "Delivery")
      status: (item.status || "").toLowerCase() as Order["status"],
      price: item.price ? `₹${item.price}` : "₹0", // FIXED: Direct price from API (e.g., "₹2500")
      // image: undefined,
      // FIXED: Extract _id as string from tiffinServiceId (object); fallback if string (undefined without backend update)
      entityId: typeof item.tiffinServiceId === "object" ? item.tiffinServiceId?._id : (typeof item.tiffinServiceId === "string" ? item.tiffinServiceId : undefined),
      // NEW: Tiffin-specific fields
      tiffinServiceId: item.tiffinServiceId || "",
      guestId: item.guestId || "",
      guestName: item.guestName || "",
    };
  });
  // DEBUG: Log tiffin orders statuses (especially for "confirmed" tab)
  console.log("Fetched Tiffin Orders:", fetchedTiffinOrders.map(o => ({ id: o.id, status: o.status, serviceType: o.serviceType })));
  return fetchedTiffinOrders;
};
const Booking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "rejected">(
    "pending"
  );
  const [refreshing, setRefreshing] = useState(false); // Add state for pull-to-refresh
  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  // Full details modal state
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const { profileData, fetchProfile } = useAuthStore();
  // --- Fetch profile if not loaded ---
  React.useEffect(() => {
    if (!profileData) {
      fetchProfile();
    }
  }, [profileData, fetchProfile]);
  // Hostel queries for each tab
  const {
    data: pendingHostelData = [],
    isPending: pendingHostelLoading,
    refetch: refetchPendingHostel,
  } = useQuery<Order[]>({
    queryKey: ["hostelOrders", "pending"],
    queryFn: () => fetchHostelOrders("pending"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching hostel orders:", error);
      Alert.alert("Error", "Failed to fetch hostel orders");
    },
  });
  const {
    data: confirmedHostelData = [],
    isPending: confirmedHostelLoading,
    refetch: refetchConfirmedHostel,
  } = useQuery<Order[]>({
    queryKey: ["hostelOrders", "confirmed"],
    queryFn: () => fetchHostelOrders("confirmed"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching hostel orders:", error);
      Alert.alert("Error", "Failed to fetch hostel orders");
    },
  });
  const {
    data: rejectedHostelData = [],
    isPending: rejectedHostelLoading,
    refetch: refetchRejectedHostel,
  } = useQuery<Order[]>({
    queryKey: ["hostelOrders", "rejected"],
    queryFn: () => fetchHostelOrders("rejected"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching hostel orders:", error);
      Alert.alert("Error", "Failed to fetch hostel orders");
    },
  });
  // Tiffin queries for each tab
  const {
    data: pendingTiffinData = [],
    isPending: pendingTiffinLoading,
    refetch: refetchPendingTiffin,
  } = useQuery<Order[]>({
    queryKey: ["tiffinOrders", "pending"],
    queryFn: () => fetchTiffinOrders("pending"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching tiffin orders:", error);
      Alert.alert("Error", "Failed to fetch tiffin orders");
    },
  });
  const {
    data: confirmedTiffinData = [],
    isPending: confirmedTiffinLoading,
    refetch: refetchConfirmedTiffin,
  } = useQuery<Order[]>({
    queryKey: ["tiffinOrders", "confirmed"],
    queryFn: () => fetchTiffinOrders("confirmed"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching tiffin orders:", error);
      Alert.alert("Error", "Failed to fetch tiffin orders");
    },
  });
  const {
    data: rejectedTiffinData = [],
    isPending: rejectedTiffinLoading,
    refetch: refetchRejectedTiffin,
  } = useQuery<Order[]>({
    queryKey: ["tiffinOrders", "rejected"],
    queryFn: () => fetchTiffinOrders("rejected"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching tiffin orders:", error);
      Alert.alert("Error", "Failed to fetch tiffin orders");
    },
  });
  const hostelOrders = useMemo(() => {
    switch (activeTab) {
      case "pending": return pendingHostelData;
      case "confirmed": return confirmedHostelData;
      case "rejected": return rejectedHostelData;
      default: return [];
    }
  }, [activeTab, pendingHostelData, confirmedHostelData, rejectedHostelData]);
  const tiffinOrders = useMemo(() => {
    switch (activeTab) {
      case "pending": return pendingTiffinData;
      case "confirmed": return confirmedTiffinData;
      case "rejected": return rejectedTiffinData;
      default: return [];
    }
  }, [activeTab, pendingTiffinData, confirmedTiffinData, rejectedTiffinData]);
  const currentHostelLoading = useMemo(() => {
    switch (activeTab) {
      case "pending": return pendingHostelLoading;
      case "confirmed": return confirmedHostelLoading;
      case "rejected": return rejectedHostelLoading;
      default: return false;
    }
  }, [activeTab, pendingHostelLoading, confirmedHostelLoading, rejectedHostelLoading]);
  const currentTiffinLoading = useMemo(() => {
    switch (activeTab) {
      case "pending": return pendingTiffinLoading;
      case "confirmed": return confirmedTiffinLoading;
      case "rejected": return rejectedTiffinLoading;
      default: return false;
    }
  }, [activeTab, pendingTiffinLoading, confirmedTiffinLoading, rejectedTiffinLoading]);
  const loading = currentHostelLoading || currentTiffinLoading;
  const refetchCurrentHostel = useCallback(() => {
    switch (activeTab) {
      case "pending": return refetchPendingHostel();
      case "confirmed": return refetchConfirmedHostel();
      case "rejected": return refetchRejectedHostel();
      default: return Promise.resolve();
    }
  }, [activeTab, refetchPendingHostel, refetchConfirmedHostel, refetchRejectedHostel]);
  const refetchCurrentTiffin = useCallback(() => {
    switch (activeTab) {
      case "pending": return refetchPendingTiffin();
      case "confirmed": return refetchConfirmedTiffin();
      case "rejected": return refetchRejectedTiffin();
      default: return Promise.resolve();
    }
  }, [activeTab, refetchPendingTiffin, refetchConfirmedTiffin, refetchRejectedTiffin]);
  // Add handleRefresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCurrentHostel(),
        refetchCurrentTiffin(),
      ]);
    } catch (error) {
      console.error("Error during refresh:", error);
      Alert.alert("Error", "Failed to refresh orders");
    } finally {
      setRefreshing(false);
    }
  }, [refetchCurrentHostel, refetchCurrentTiffin]);
  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchPendingHostel(),
      refetchConfirmedHostel(),
      refetchRejectedHostel(),
      refetchPendingTiffin(),
      refetchConfirmedTiffin(),
      refetchRejectedTiffin(),
    ]);
  }, [refetchPendingHostel, refetchConfirmedHostel, refetchRejectedHostel, refetchPendingTiffin, refetchConfirmedTiffin, refetchRejectedTiffin]);
  useFocusEffect(
    useCallback(() => {
      refetchAll();
    }, [refetchAll])
  );
  const isWithin5DaysOfEnd = (order: Order) => {
    const endDateStr = order.endDate || order.checkOutDate;
    if (!endDateStr) return false;
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return false;
    const fiveDaysBefore = new Date(end.getTime() - 5 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return now >= fiveDaysBefore && now < end;
  };
  const handleTrackOrder = (order: Order) => {
    console.log("=== DEBUG: handleTrackOrder called ===");
    console.log("Track order clicked for bookingId:", order.bookingId);
    console.log("Order details:", { id: order.id, status: order.status, serviceType: order.serviceType });
    console.log("Current modal state before set:", { showTrackOrderModal, trackingOrder: trackingOrder ? 'exists' : null });
   
    if (!order.id) {
      console.error("=== ERROR: Invalid order ID for tracking ===");
      Alert.alert("Error", "Cannot track this order. Invalid details.");
      return;
    }
   
    setTrackingOrder(order);
    setShowTrackOrderModal(true);
   
    // Note: State updates are async, so log after a tick if needed (use setTimeout for immediate check)
    setTimeout(() => {
      console.log("=== DEBUG: Modal state after set (next tick) ===");
      console.log("showTrackOrderModal:", true);
      console.log("trackingOrder:", order.id);
    }, 0);
  };
// Updated handleContinueSubscription in Booking screen
// Updated handleContinueSubscription in Booking screen
const handleContinueSubscription = (order: Order) => {
  if (!order.id) { // Enforce _id as mandatory for all orders (esp. tiffin)
    console.error("Missing _id (orderId) – cannot continue subscription");
    return; // Early exit; handle UI error as needed
  }
  console.log("Continue subscription:", order.id);

  // Helper to clean and format price (reusable for price/planPrice)
  const formatPrice = (rawPrice?: string): string => {
    if (!rawPrice) return "₹8000";
    const cleaned = rawPrice.replace('₹', '').trim();
    return `₹${cleaned}`;
  };

  // NEW: Helper to add 1 day to a "DD/MM/YYYY" date string and return formatted
  const addOneDay = (dateStr?: string): string => {
    if (!dateStr || dateStr.trim() === '') {
      // Fallback: Use current date +1 day if endDate missing (format as DD/MM/YYYY)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;
    }

    // Parse DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.warn("Invalid endDate format, using fallback");
      return addOneDay(); // Recursive fallback to current +1
    }

    const endDate = new Date(year, month - 1, day); // JS months 0-indexed
    if (isNaN(endDate.getTime())) {
      console.warn("Invalid endDate, using fallback");
      return addOneDay(); // Fallback
    }

    // Add 1 day
    const newStart = new Date(endDate);
    newStart.setDate(endDate.getDate() + 1);

    // Format back to DD/MM/YYYY
    return `${String(newStart.getDate()).padStart(2, '0')}/${String(newStart.getMonth() + 1).padStart(2, '0')}/${newStart.getFullYear()}`;
  };

  let params: any = {
    serviceType: order.serviceType,
    serviceName: order.serviceName || order.tiffinServiceName || "", // Fallback for tiffin
    price: formatPrice(order.price), // FIXED: No double ₹
    planPrice: formatPrice(order.planPrice || order.price), // FIXED: No double ₹
    plan: order.plan || order.planType || "monthly", // Use planType for tiffin
    orderId: order.id, // _id is now mandatory
    bookingId: order.bookingId || "",
    fullName: order.customer || "You", // Keep fallback; fetch full guest in screen via guestId
  };

  // Branch for tiffin-specific params (no rooms/hostelId, use dates from tiffin response)
  if (order.serviceType === 'tiffin') {
    // Tiffin-specific details including service ID and guest info
    params.tiffinServiceId = order.tiffinServiceId || ""; // <-- This line already passes tiffinServiceId to the next screen
    params.guestId = order.guestId || "";
    params.fullName = order.guestName || params.fullName; // Prioritize guestName for tiffin
    params.orderType = order.orderType || "";
    params.foodType = order.foodType || "";
    params.status = order.status || "";
   
    // UPDATED: For continuation, auto-set checkInDate as endDate +1 day (new start)
    // Keep original checkOutDate for reference/UI context
    const originalCheckOut = order.endDate || ""; 
    params.checkOutDate = originalCheckOut;
    params.checkInDate = addOneDay(originalCheckOut); // Auto-fill start as next day after checkout
    
    // Skip rooms and hostelId – they remain undefined (not passed)
    console.log("Tiffin-specific params applied with auto-forwarded checkInDate");
  } else {
    // Hostel/default: Existing rooms/hostel logic (unchanged)
    const roomsData = order.rooms?.map((room) => ({
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      beds: room.bedNumber?.map((bed) => ({
        bedId: bed.bedId,
        bedNumber: bed.bedNumber,
        name: bed.name,
      })) || [],
    })) || [];
    params.hostelId = order.entityId || "";
    params.checkInDate = order.checkInDate || "";
    params.checkOutDate = order.checkOutDate || "";
    params.rooms = JSON.stringify(roomsData); // Stringify for params
  }

  console.log("Continue Subscription Params:", params);
  console.log("Full Order Details Passed:", {
    id: order.id,
    bookingId: order.bookingId,
    serviceName: order.serviceName || order.tiffinServiceName,
    customer: order.serviceType === 'tiffin' ? order.guestName : order.customer, // Use guestName for tiffin
    // UPDATED: Log old vs. new dates for debugging
    originalCheckIn: order.startDate,
    originalCheckOut: order.endDate,
    newCheckInDate: params.checkInDate, // Should be originalCheckOut +1
    checkOutDate: params.checkOutDate, // Original for reference
    rooms: params.rooms || "N/A (tiffin)",
    entityId: order.entityId || "N/A",
    plan: params.plan,
    price: order.price,
    planPrice: order.planPrice,
    // Additional tiffin details for logging
    ...(order.serviceType === 'tiffin' && {
      tiffinServiceId: order.tiffinServiceId,
      guestId: order.guestId,
      orderType: order.orderType,
      foodType: order.foodType,
      status: order.status,
    }),
  });

  router.push({
    pathname: "/continueSubscriptionScreen",
    params,
  });
};
  const handleRateNow = (order: Order) => {
    console.log("Rate now:", order.bookingId);
    const type = order.serviceType === "tiffin" ? "service" : "hostel";
   
    if (!order.entityId) {
      console.error("Missing entityId for order:", order);
      Alert.alert("Error", "Invalid service details. Please try again.");
      return;
    }
    const params = {
      serviceId: order.entityId, // Now guaranteed string
      guestId: order.id,
      type: type,
    };
    console.log("Passing params to RateNowScreen:", params);
    router.push({
      pathname: "/account/RateNowScreen",
      params,
    });
  };
  const handleSeeDetails = (order: Order) => {
    console.log(
      "See details:",
      order.bookingId,
      "using entityId:",
      order.entityId,
    );
    let pathname;
    let params;
    if (order.serviceType === "hostel") {
      pathname = "/(secure)/hostel-details/[id]";
      params = {
        id: order.entityId,
        bookingId: order.id,
        type: order.serviceType,
      };
    } else {
      pathname = "/(secure)/tiffin-order-details/[id]";
      params = {
        id: order.id,
        type: order.serviceType,
      };
    }
    router.push({
      pathname,
      params,
    });
  };
  const handleRepeatOrder = (order: Order) => {
    console.log("Repeat order:", order.bookingId);
    const pathname =
      order.serviceType === "hostel"
        ? "/hostel-details/[id]"
        : "/tiffin-details/[id]";
    // FIXED: Null check for entityId
    if (!order.entityId) {
      Alert.alert("Error", "Invalid service details for repeat order.");
      return;
    }
    router.push({
      pathname,
      params: { id: order.entityId, repeatOrder: "true" },
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
      case "delivered":
        return "#10B981";
      case "completed":
        return "#6B7280";
      case "cancelled":
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };
  const isHistoryOrder = (status: string) =>
    ["delivered", "completed"].includes(status);
  const handleProfilePress = () => router.push("/account/profile");
  const renderOrderCard = (order: Order) => {
    // DEBUG: Log order details and conditions for button visibility
    console.log("=== DEBUG: Rendering Order Card ===");
    console.log("Order:", { id: order.id, status: order.status, serviceType: order.serviceType, activeTab });
    console.log("Conditions check:", {
      isConfirmedTab: activeTab === "confirmed",
      statusIsConfirmed: order.status === "confirmed",
      isNotHistory: !isHistoryOrder(order.status),
      isTiffin: order.serviceType === "tiffin",
      within5Days: isWithin5DaysOfEnd(order),
    });
    console.log("Track button should show:", activeTab === "confirmed" && order.status === "confirmed" && !isHistoryOrder(order.status) && order.serviceType === "tiffin");
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          setDetailsOrder(order);
          setShowFullDetailsModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.bookingId}>
            {order.serviceType === "hostel"
              ? `Booking #${order.bookingId}` // UPDATED: Show booking ID for hostel as well
              : `Booking #${order.bookingId}`}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(order.status)}20` },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(order.status) }]}
            >
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        {order.serviceType !== "hostel" && (
          <Text style={styles.orderedOneLbl}>Order On {order.startDate}</Text>
        )}
        <View style={styles.orderDetails}>
          {order.serviceType === "hostel" ? (
            <>
              {/* Hostel Booking Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hostel Booking:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.serviceName}
                  </Text>
                </View>
              </View>
              {/* UPDATED: Plan Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.plan}
                  </Text>
                </View>
              </View>
              {/* Check-in Date Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in date:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.checkInDate}
                  </Text>
                </View>
              </View>
              {/* Check-out Date Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-out date:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.checkOutDate}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Tiffin Service Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tiffin Service:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.serviceName}
                  </Text>
                </View>
              </View>
              {/* Check-in Date Row (Tiffin) */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start date:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.startDate}
                  </Text>
                </View>
              </View>
              {/* Check-out Date Row (Tiffin) */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End date:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.endDate}
                  </Text>
                </View>
              </View>
              {/* Meal Type Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan Type:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.mealType}
                  </Text>
                </View>
              </View>
              {/* Food Type Row (Conditional) */}
              {order.foodType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Food Type:</Text>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      style={styles.detailValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {order.foodType}
                    </Text>
                  </View>
                </View>
              )}
              {/* Plan Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.plan}
                  </Text>
                </View>
              </View>
              {/* Order Type Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Type:</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.orderType}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
        {activeTab === "pending" ? null : (
          <>
            {order.status === "confirmed" && !isHistoryOrder(order.status) && (
              <View>
                {order.serviceType === "tiffin" ? (
                  <View>
                    <View style={styles.buttonRow}>
                      <Button
                        title="Rate Now"
                        onPress={() => handleRateNow(order)}
                        style={styles.rateButtonStyle}
                        textStyle={styles.secondaryButtonTextStyle}
                        width={160}
                        height={48}
                      />
                      <Button
                        title="See Details"
                        onPress={() => handleSeeDetails(order)}
                        style={styles.repeatButtonStyle}
                        width={160}
                        height={48}
                      />
                    </View>
                    <Button
                      title="Track Now"
                      onPress={() => {
                        // DEBUG: Log button click
                        console.log("=== DEBUG: Track Now Button Clicked ===");
                        console.log("Order for track:", { id: order.id, bookingId: order.bookingId });
                        handleTrackOrder(order);
                      }}
                      style={styles.primaryButtonStyle}
                      height={48}
                    />
                    <Button
                      title="Continue Subscription"
                      onPress={() => handleContinueSubscription(order)}
                      style={styles.primaryButtonStyle}
                      height={48}
                    />
                  </View>
                ) : (
                  <View>
                    <Button
                      title="Continue Subscription"
                      onPress={() => handleContinueSubscription(order)}
                      style={styles.primaryButtonStyle}
                      height={48}
                    />
                    <Button
                      title="Rate Now"
                      onPress={() => handleRateNow(order)}
                      textStyle={styles.secondaryButtonTextStyle}
                      style={[styles.rateButtonStyle, { width: '100%' ,marginTop:10 }]}
                      height={48}
                    />
                  </View>
                )}
              </View>
            )}
            {order.status === "rejected" && (
              <View style={styles.buttonRow}>
                {/* <Button
                  title="See Details"
                  onPress={() => handleSeeDetails(order)}
                  style={styles.rateButtonStyle}
                  textStyle={styles.secondaryButtonTextStyle}
                  width={160}
                  height={48}
                /> <Button
                  title="Repeat Order"
                  onPress={() => handleRepeatOrder(order)}
                  style={styles.repeatButtonStyle}
                  width={160}
                  height={48}
                /> */} */}
               
              </View>
            )}
            {isHistoryOrder(order.status) && (
              <View style={styles.buttonRow}>
                <Button
                  title="Rate Now"
                  onPress={() => handleRateNow(order)}
                  style={styles.rateButtonStyle}
                  textStyle={styles.secondaryButtonTextStyle}
                  width={160}
                  height={48}
                />
                <Button
                  title="Repeat Order"
                  onPress={() => handleRepeatOrder(order)}
                  style={styles.repeatButtonStyle}
                  width={160}
                  height={48}
                />
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={styles.emptyStateSubtext}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const hasHostelOrders = hostelOrders.length > 0;
  const hasTiffinOrders = tiffinOrders.length > 0;
  const hasAnyOrders = hasHostelOrders || hasTiffinOrders;
  // Debug log for tab data
  console.log(
    `Rendering ${activeTab} tab - Hostels: ${hostelOrders.length}, Tiffins: ${tiffinOrders.length}`,
  );
  // Added profileSource computation for fallback image handling
  const profileSource = profileData?.profileImage ? { uri: profileData.profileImage } : fallbackDp;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track your bookings</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
        >
          <Image
            source={profileSource} // Updated to use conditional source with local fallback
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "confirmed" && styles.activeTab]}
          onPress={() => setActiveTab("confirmed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "confirmed" && styles.activeTabText,
            ]}
          >
            Confirmed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rejected" && styles.activeTab]}
          onPress={() => setActiveTab("rejected")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rejected" && styles.activeTabText,
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        } // Add pull-to-refresh here
      >
        {!hasAnyOrders ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "pending"
                ? "You don't have any pending orders"
                : activeTab === "confirmed"
                ? "You don't have any confirmed orders"
                : "You don't have any rejected orders"}
            </Text>
          </View>
        ) : (
          <>
            {hasHostelOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="home" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Hostel Bookings ({hostelOrders.length})
                  </Text>
                </View>
                {hostelOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
            {hasTiffinOrders && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="restaurant"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    Tiffin Orders ({tiffinOrders.length})
                  </Text>
                </View>
                {tiffinOrders.map((order) => renderOrderCard(order))}
              </View>
            )}
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {/* DEBUG: Log before modal render */}
      {console.log("=== DEBUG: Checking Modal Render ===", {
        trackingOrder: trackingOrder ? trackingOrder.id : null,
        showTrackOrderModal,
        orderId: trackingOrder?.id,
        serviceType: trackingOrder?.serviceType
      })}
     
      {trackingOrder && (
        <TrackOrderModal
          visible={showTrackOrderModal}
          onClose={() => {
            console.log("=== DEBUG: Modal Close Called ===");
            setShowTrackOrderModal(false);
            setTrackingOrder(null);
          }}
          orderId={trackingOrder.id}
          serviceType={trackingOrder.serviceType}
        />
      )}
      {/* Full Details Modal (for pending items) */}
      {detailsOrder && (
        <Modal
          visible={showFullDetailsModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowFullDetailsModal(false);
            setDetailsOrder(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowFullDetailsModal(false);
                    setDetailsOrder(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Booking ID</Text>
                  <Text style={styles.modalValue}>{detailsOrder.bookingId || detailsOrder.id}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Service</Text>
                  <Text style={styles.modalValue}>{detailsOrder.serviceName}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Type</Text>
                  <Text style={styles.modalValue}>{detailsOrder.serviceType}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <Text style={styles.modalValue}>{getStatusText(detailsOrder.status)}</Text>
                </View>
                {activeTab === "rejected" && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Price</Text>
                    <Text style={styles.modalValue}>{detailsOrder.price || "N/A"}</Text>
                  </View>
                )}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Plan</Text>
                  <Text style={styles.modalValue}>{detailsOrder.plan || "N/A"}</Text>
                </View>
                {detailsOrder.serviceType === "tiffin" ? (
                  <>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Guest</Text>
                      <Text style={styles.modalValue}>{detailsOrder.guestName || detailsOrder.customer || "You"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Start date</Text>
                      <Text style={styles.modalValue}>{detailsOrder.startDate || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>End date</Text>
                      <Text style={styles.modalValue}>{detailsOrder.endDate || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Meal Type</Text>
                      <Text style={styles.modalValue}>{detailsOrder.mealType || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Food Type</Text>
                      <Text style={styles.modalValue}>{detailsOrder.foodType || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Order Type</Text>
                      <Text style={styles.modalValue}>{detailsOrder.orderType || "N/A"}</Text>
                    </View>
                    {/* <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Tiffin Service ID</Text>
                      <Text style={styles.modalValue}>{detailsOrder.tiffinServiceId || detailsOrder.entityId || "N/A"}</Text>
                    </View> */}
                  </>
                ) : (
                  <>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Customer</Text>
                      <Text style={styles.modalValue}>{detailsOrder.customer || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Check-in</Text>
                      <Text style={styles.modalValue}>{detailsOrder.checkInDate || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Check-out</Text>
                      <Text style={styles.modalValue}>{detailsOrder.checkOutDate || detailsOrder.endDate || "N/A"}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Rooms</Text>
                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        {detailsOrder.rooms && detailsOrder.rooms.length > 0 ? (
                          detailsOrder.rooms.map((r, idx) => (
                            <Text key={idx} style={styles.modalValue}>{`${r.roomNumber}${r.bedNumber && r.bedNumber.length ? ` (beds: ${r.bedNumber.map(b=>b.bedNumber).join(",")})` : ""}`}</Text>
                          ))
                        ) : (
                          <Text style={styles.modalValue}>N/A</Text>
                        )}
                      </View>
                    </View>
                    {/* <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Hostel ID</Text>
                      <Text style={styles.modalValue}>{detailsOrder.entityId || "N/A"}</Text>
                    </View> */}
                  </>
                )}
                {/* Optionally show image */}
                {detailsOrder.image && (
                  <View style={{ alignItems: "center", marginTop: 12 }}>
                    <Image source={{ uri: detailsOrder.image }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                  </View>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  activeTab: {
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    paddingVertical: 0,
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 3,
    alignItems: "center",
  },
  orderedOneLbl: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
    flex: 1,
    marginTop: -14,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "400",
    minWidth: 120,
    flexShrink: 1,
  },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    textAlign: "right",
  },
  primaryButtonStyle: {
    backgroundColor: colors.primary,
    marginTop: 8,
    width: "100%",
   
  },
  secondaryButtonStyle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    width: "100%",
  },
  secondaryButtonTextStyle: {
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 12,
  },
 rateButtonStyle: {
  backgroundColor: "transparent",
  borderWidth: 1,
  borderColor: colors.primary,
  width: 230,
  alignSelf: "center",
},
  repeatButtonStyle: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  // Modal styles for Full details
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  modalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  modalValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
    textAlign: "right",
  },
  bottomSpacer: {
    height: 25,
  },
});
export default Booking;