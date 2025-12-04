import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Alert, // UPDATED: Added for potential alerts if needed
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "@/components/Buttons";
import Logo from "@/components/Logo";
import TiffinCard from "@/components/TiffinCard";
import HostelCard from "@/components/HostelCard";
import demoData from "@/data/demoData.json";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 40; // 20px padding on each side
const CARD_MARGIN = 10;
const Confirmation: React.FC = () => {
  const params = useLocalSearchParams();
  const { serviceType, serviceName, id, guestName: paramGuestName, amount: paramAmount, checkInDate: paramCheckIn, checkOutDate: paramCheckOut, startDate: paramStartDate, endDate: paramEndDate, foodType: paramFoodType, orderType: paramOrderType, planType: paramPlanType, mealType: paramMealType } = params;
  const isTiffin = serviceType === "tiffin";
  const [bookingDetails, setBookingDetails] = useState(null);
  const [tiffinDetails, setTiffinDetails] = useState(null);
  const [randomTiffin, setRandomTiffin] = useState(null);
  const [randomTiffins, setRandomTiffins] = useState([]);
  const [randomHostels, setRandomHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | null>(null);
  const [callNumber, setCallNumber] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Handle DD/MM/YYYY format (common in your API)
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Validate parts (optional but recommended to avoid NaN)
      if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`Invalid date: ${dateString}`);
        return dateString; // Fallback to raw string
      }
      
      const date = new Date(year, month - 1, day);
      
      // Double-check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date after parsing: ${dateString}`);
        return dateString;
      }
      
      const formattedDay = date.getDate().toString().padStart(2, '0');
      const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      const formattedYear = date.getFullYear().toString().slice(-2);
      
      return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    }
    
    // Fallback for other formats (e.g., ISO or MM/DD/YYYY)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    }
    
    return dateString; // Ultimate fallback
  };
  const cleanImageUrl = (url: string): string => {
    if (!url) return url;
    if (url.includes('cloudinary.com')) {
      // Only add auto-format transformation; don't touch extensions/public IDs
      return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    // Fallback for non-Cloudinary: minimal cleanup if needed
    return url;
  };
  // NEW: Helper to format nearbyLandmarks array into a readable string
  const formatNearbyLandmarks = (landmarks: any[]): string => {
    if (!Array.isArray(landmarks) || landmarks.length === 0) return '';
    return landmarks.slice(0, 2).map((l: any) => `${l.name}${l.distance ? ` (${l.distance})` : ''}`).join(', ');
  };
  const fetchBeforeDetails = async (token: string) => {
    const beforeUrl = isTiffin
      ? `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinBookingByIdbeforePayment/${id}`
      : `https://tifstay-project-be.onrender.com/api/guest/hostelServices/gethostelBookingByIdbeforePayment/${id}`;
    try {
      const beforeResponse = await axios.get(beforeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (beforeResponse.data.success) {
        const data = beforeResponse.data.data;
        if (isTiffin) {
          setTiffinDetails({
            ...data,
            amount: data.totalAmount,
          });
        } else {
          setBookingDetails({
            ...data,
            amount: data.totalPayment,
          });
        }
        setCallNumber(data.contact || '');
        setWhatsappNumber(data.contact || '');
        setPaymentStatus('unpaid');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error fetching before payment details:", error);
      return false;
    }
  };
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (id) {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            setLoading(false);
            setPaymentStatus('unpaid');
            return;
          }
          const afterUrl = isTiffin
            ? `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getTiffinBookingByIdafterPayment/${id}`
            : `https://tifstay-project-be.onrender.com/api/guest/hostelServices/gethostelBookingByIdafterPayment/${id}`;
          const response = await axios.get(afterUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            const data = response.data.data;
            if (isTiffin) {
              setTiffinDetails(data);
              setCallNumber(data.contactInfoforcall ? `+91${data.contactInfoforcall}` : '');
              setWhatsappNumber(data.contactInfoforwhatsapp ? `+91${data.contactInfoforwhatsapp}` : '');
            } else {
              setBookingDetails(data);
              setCallNumber(data.contactforcall ? `+91${data.contactforcall}` : '');
              setWhatsappNumber(data.contactForWhatsapp ? `+91${data.contactForWhatsapp}` : '');
            }
            setPaymentStatus('paid');
          } else {
            // Fetch before payment details
            const beforeSuccess = await fetchBeforeDetails(token);
            if (!beforeSuccess) {
              console.warn("Payment verification failed and before details unavailable:", response.data.message || "Unknown error");
              setPaymentStatus('unpaid');
            }
          }
        } catch (error) {
          console.error("Error fetching after payment details:", error);
          // Fetch before payment details on error
          try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
              const beforeSuccess = await fetchBeforeDetails(token);
              if (!beforeSuccess) {
                setPaymentStatus('unpaid');
              }
            } else {
              setPaymentStatus('unpaid');
            }
          } catch (beforeError) {
            console.error("Error fetching before payment details:", beforeError);
            setPaymentStatus('unpaid');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setPaymentStatus('unpaid');
      }
    };
    fetchBookingDetails();
  }, [id, isTiffin]);
  useEffect(() => {
    if (!id) {
      setPaymentStatus('unpaid');
    }
  }, [id]);
  useEffect(() => {
    const fetchRandomTiffins = async () => {
      if (!isTiffin) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          const tiffins = [];
          for (let i = 0; i < 3; i++) {
            const response = await axios.get(
              "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getRandomTiffinService",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (response.data.success) {
              const service = response.data.data;
              // Ensure arrays
              service.vegPhotos = Array.isArray(service.vegPhotos) ? service.vegPhotos : service.vegPhotos ? [service.vegPhotos] : [];
              service.nonVegPhotos = Array.isArray(service.nonVegPhotos) ? service.nonVegPhotos : service.nonVegPhotos ? [service.nonVegPhotos] : [];
              // Set image for card - first available
              const allPhotos = [...service.vegPhotos, ...service.nonVegPhotos];
              const firstPhotoUrl = allPhotos.length > 0 ? cleanImageUrl(allPhotos[0]) : "https://via.placeholder.com/400x300?text=No+Image";
              service.image = { uri: firstPhotoUrl };
              // Derive price from first pricing (prefer monthlyDelivery)
              const firstPricing = service.pricing?.[0];
              service.price = firstPricing ? `₹${firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0}/month` : "-";
              service.oldPrice = firstPricing ? `₹${Math.round((firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0) * 1.1)}/month` : "-";
              service.rating = parseFloat(service.averageRating) || 0;
              service.reviews = service.totalReviews || 0;
              service.foodType = service.foodType || firstPricing?.foodType || "Both";
              service.description = service.description || "Delicious home-cooked meals.";
              service.timing = service.mealTimings?.map((m: any) => `${m.startTime} - ${m.endTime}`).join(' | ') || "-";
              // Tags from foodType
              service.tags = [service.foodType?.includes('Veg') ? 'Veg' : '', service.foodType?.includes('Non-Veg') ? 'Non-Veg' : ''].filter(Boolean);
              const locationString = service.location
                ? `${service.location.area || ''}${service.location.nearbyLandmarks ? `, ${service.location.nearbyLandmarks}` : ''}${service.location.fullAddress ? `, ${service.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
                : 'Location not available';
              // Trim location to max 60 chars for 1-2 lines
              service.location = locationString.length > 60 ? locationString.substring(0, 60) + '...' : locationString;
              // Trim name to max 25 chars for 1 line
              service.name = (service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || "Unnamed Tiffin Service").length > 25
                ? (service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || "Unnamed Tiffin Service").substring(0, 25) + '...'
                : service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || "Unnamed Tiffin Service";
              tiffins.push(service);
            }
          }
          setRandomTiffins(tiffins);
          if (tiffins.length > 0) {
            setRandomTiffin(tiffins[0]);
          }
        } catch (error) {
          console.error("Error fetching random tiffins:", error);
        }
      }
    };
    fetchRandomTiffins();
  }, [isTiffin]);
  useEffect(() => {
    const fetchRandomHostels = async () => {
      if (isTiffin) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          const hostels = [];
          for (let i = 0; i < 3; i++) {
            const response = await axios.get(
              "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getRandomHostelServices",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (response.data.success) {
              const hostel = response.data.data;
              // Ensure array
              hostel.hostelPhotos = Array.isArray(hostel.hostelPhotos) ? hostel.hostelPhotos : hostel.hostelPhotos ? [hostel.hostelPhotos] : [];
              // Set image for card - first available with fallback
              const photoUrl = hostel.hostelPhotos.length > 0 ? cleanImageUrl(hostel.hostelPhotos[0]) : "https://via.placeholder.com/400x300?text=No+Image";
              hostel.image = { uri: photoUrl };
              // Derive price (monthly preferred)
              hostel.price = hostel.pricing?.monthly ? `₹${hostel.pricing.monthly}/month` : `₹${hostel.pricing?.perDay || 0}/day`;
              hostel.oldPrice = "-";
              hostel.type = hostel.hostelType || "Hostel";
              hostel.rating = parseFloat(hostel.averageRating) || 0;
              hostel.reviews = hostel.totalReviews || 0;
              hostel.availableBeds = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.filter((bed: any) => bed.status === "Unoccupied") || []).length, 0) || 0;
              const totalBedsCount = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.length || 0), 0) || 0;
              hostel.occupiedBeds = totalBedsCount - hostel.availableBeds;
              hostel.amenities = (hostel.facilities || []).map((f: any) => f.name || f).filter(Boolean);
              hostel.deposit = `₹${hostel.securityDeposit || 15000}`;
              hostel.description = hostel.description || "Comfortable stay with all amenities.";
              // FIXED: Format nearbyLandmarks properly before using in locationString and subLocation
              const nearbyLandmarksStr = formatNearbyLandmarks(hostel.location?.nearbyLandmarks || []);
              const locationString = hostel.location
                ? `${hostel.location.area || ''}${nearbyLandmarksStr ? `, ${nearbyLandmarksStr}` : ''}${hostel.location.fullAddress ? `, ${hostel.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
                : 'Location not available';
              // Trim location to max 60 chars for 1-2 lines
              hostel.location = locationString.length > 60 ? locationString.substring(0, 60) + '...' : locationString;
              // FIXED: Set subLocation as formatted string and trim
              hostel.subLocation = nearbyLandmarksStr.length > 50 ? nearbyLandmarksStr.substring(0, 50) + '...' : nearbyLandmarksStr;
              // Trim name to max 25 chars for 1 line
              hostel.name = (hostel.hostelName || "Unnamed Hostel").length > 25
                ? (hostel.hostelName || "Unnamed Hostel").substring(0, 25) + '...'
                : hostel.hostelName || "Unnamed Hostel";
              hostels.push(hostel);
            }
          }
          setRandomHostels(hostels);
        } catch (error) {
          console.error("Error fetching random hostels:", error);
        }
      }
    };
    fetchRandomHostels();
  }, [isTiffin]);
  useFocusEffect(
  React.useCallback(() => {
    const onBackPress = () => {
      router.replace("/(secure)/(tabs)");
      return true; // Prevent default back action
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [])
);
  const tiffinBookingDetails = tiffinDetails ? {
    bookingId: tiffinDetails.bookingId,
    tiffinService: tiffinDetails.tiffinServiceName,
    customer: tiffinDetails.guestName,
    amount: tiffinDetails.amount,
    startDate: formatDate(tiffinDetails.startDate),
    endDate: formatDate(tiffinDetails.endDate),
    mealType: tiffinDetails.mealType || "Lunch",
    foodType: tiffinDetails.foodType || "Veg",
    orderType: tiffinDetails.orderType || "Delivery",
    planType: tiffinDetails.planType || "Daily",
  } : {
    bookingId: id || `${isTiffin ? "mk" : "hkl"}${Math.floor(
      Math.random() * 10000000
    )}`,
    tiffinService: serviceName || "Maharashtrian Ghar Ka Khana",
    customer: paramGuestName || "Onil Karmokar",
    amount: paramAmount || 'N/A',
    startDate: formatDate(paramStartDate as string),
    endDate: formatDate(paramEndDate as string),
    mealType: paramMealType as string,
    foodType: paramFoodType as string,
    orderType: paramOrderType as string,
    planType: paramPlanType as string,
  };
  const hostelBookingDetails = bookingDetails ? {
    id: id,
    hostelBooking: bookingDetails.hostelName,
    customer: bookingDetails.guestName,
    checkInDate: formatDate(bookingDetails.checkInDate),
    checkOutDate: formatDate(bookingDetails.checkOutDate),
    amount: bookingDetails.amount,
  } : {
    id: id || `${isTiffin ? "mk" : "hkl"}${Math.floor(
      Math.random() * 10000000
    )}`,
    hostelBooking: serviceName || "Scholars Den Boys Hostel",
    customer: paramGuestName || "Onil Karmokar",
    checkInDate: formatDate(paramCheckIn as string),
    checkOutDate: formatDate(paramCheckOut as string),
    amount: paramAmount || 'N/A',
  };
  // UPDATED: New handler for cart button (navigates back to cart/booking based on serviceType)
  const handleRetryBooking = () => {
    // Navigate to cart or booking screen based on serviceType
    const cartPath = isTiffin ? "/(secure)/Cartscreen" : "/(secure)/Cartscreen"; // Adjust paths as per your app structure
    router.push({
      pathname: cartPath,
      params: { serviceType: isTiffin ? "tiffin" : "hostel" }, // Pass serviceType to resume
    });
  };

  const handlePrintInvoice = async () => {
  const details = isTiffin ? tiffinBookingDetails : hostelBookingDetails;
  const filteredDetails = Object.entries(details).filter(([key]) => key !== 'mealType');
  const htmlContent = `
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h2 style="text-align: center;">TifStay - Booking Invoice</h2>
        <hr />
        <h3>Booking Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${filteredDetails
            .map(
              ([key, value]) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;"><b>${key}</b></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${value}</td>
              </tr>`
            )
            .join("")}
        </table>
        <hr />
        <p style="text-align:center;">Thank you for booking with TifStay!</p>
      </body>
    </html>
  `;
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      alert("Invoice saved at: " + uri);
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
  }
};
  const currentBookingDetails = isTiffin ? tiffinBookingDetails : hostelBookingDetails;
  const getRecommendations = () => {
    if (isTiffin) {
      return randomHostels.length > 0
        ? randomHostels
        : (demoData.hostels?.slice(0, 3) || []).map((hostel, index) => {
          // Ensure arrays and set props for demoData
          hostel.hostelPhotos = Array.isArray(hostel.hostelPhotos) ? hostel.hostelPhotos : hostel.hostelPhotos ? [hostel.hostelPhotos] : [];
          const demoImageUrl = hostel.hostelPhotos.length > 0 ? cleanImageUrl(hostel.hostelPhotos[0]) : (typeof hostel.image === 'string' ? hostel.image : hostel.image?.uri) || 'https://via.placeholder.com/400x300?text=No+Image';
          hostel.image = { uri: demoImageUrl };
          hostel.price = hostel.pricing?.monthly ? `₹${hostel.pricing.monthly}/month` : `₹${hostel.pricing?.perDay || 0}/day`;
          hostel.type = hostel.hostelType || "Hostel";
          hostel.rating = parseFloat(hostel.averageRating) || 0;
          hostel.reviews = hostel.totalReviews || 0;
          hostel.availableBeds = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.filter((bed: any) => bed.status === "Unoccupied") || []).length, 0) || 0;
          const totalBedsCount = hostel.rooms?.reduce((acc, room) => acc + (room.totalBeds?.length || 0), 0) || 0;
          hostel.occupiedBeds = totalBedsCount - hostel.availableBeds;
          hostel.amenities = (hostel.facilities || []).map((f: any) => f.name || f).filter(Boolean);
          hostel.deposit = `₹${hostel.securityDeposit || 15000}`;
          hostel.description = hostel.description || "Comfortable stay with all amenities.";
          // FIXED: Same fix for demoData - format nearbyLandmarks
          const nearbyLandmarksStr = formatNearbyLandmarks(hostel.location?.nearbyLandmarks || []);
          const locationString = hostel.location
            ? `${hostel.location.area || ''}${nearbyLandmarksStr ? `, ${nearbyLandmarksStr}` : ''}${hostel.location.fullAddress ? `, ${hostel.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
            : 'Location not available';
          // Trim location to max 60 chars for 1-2 lines
          hostel.location = locationString.length > 60 ? locationString.substring(0, 60) + '...' : locationString;
          hostel.subLocation = nearbyLandmarksStr.length > 50 ? nearbyLandmarksStr.substring(0, 50) + '...' : nearbyLandmarksStr;
          // Trim name to max 25 chars for 1 line
          hostel.name = (hostel.hostelName || hostel.name || `Demo Hostel ${index + 1}`).length > 25
            ? (hostel.hostelName || hostel.name || `Demo Hostel ${index + 1}`).substring(0, 25) + '...'
            : hostel.hostelName || hostel.name || `Demo Hostel ${index + 1}`;
          return hostel;
        });
    } else {
      return randomTiffins.length > 0 ? randomTiffins : (demoData.tiffinServices?.slice(0, 3) || []).map((service, index) => {
        // Ensure arrays and set props for demoData
        service.vegPhotos = Array.isArray(service.vegPhotos) ? service.vegPhotos : service.vegPhotos ? [service.vegPhotos] : [];
        service.nonVegPhotos = Array.isArray(service.nonVegPhotos) ? service.nonVegPhotos : service.nonVegPhotos ? [service.nonVegPhotos] : [];
        const allPhotos = [...service.vegPhotos, ...service.nonVegPhotos];
        const firstPhotoUrl = allPhotos.length > 0 ? cleanImageUrl(allPhotos[0]) : "https://via.placeholder.com/400x300?text=No+Image";
        service.image = { uri: firstPhotoUrl };
        const firstPricing = service.pricing?.[0];
        service.price = firstPricing ? `₹${firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0}/month` : "-";
        service.oldPrice = firstPricing ? `₹${Math.round((firstPricing.monthlyDelivery || firstPricing.monthlyDining || 0) * 1.1)}/month` : "-";
        service.rating = parseFloat(service.averageRating) || 0;
        service.reviews = service.totalReviews || 0;
        service.foodType = service.foodType || firstPricing?.foodType || "Both";
        service.description = service.description || "Delicious home-cooked meals.";
        service.timing = service.mealTimings?.map((m: any) => `${m.startTime} - ${m.endTime}`).join(' | ') || "-";
        service.tags = [service.foodType?.includes('Veg') ? 'Veg' : '', service.foodType?.includes('Non-Veg') ? 'Non-Veg' : ''].filter(Boolean);
        const locationString = service.location
          ? `${service.location.area || ''}${service.location.nearbyLandmarks ? `, ${service.location.nearbyLandmarks}` : ''}${service.location.fullAddress ? `, ${service.location.fullAddress}` : ''}`.replace(/^, /, '').trim()
          : 'Location not available';
        // Trim location to max 60 chars for 1-2 lines
        service.location = locationString.length > 60 ? locationString.substring(0, 60) + '...' : locationString;
        // Trim name to max 25 chars for 1 line
        service.name = (service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || `Demo Tiffin ${index + 1}`).length > 25
          ? (service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || `Demo Tiffin ${index + 1}`).substring(0, 25) + '...'
          : service.tiffinName || service.tiffinServiceName || service.serviceName || service.name || `Demo Tiffin ${index + 1}`;
        return service;
      });
    }
  };
  const recommendations = getRecommendations();
  const handleCallAdmin = () => {
    const number = callNumber || '5146014598';
    Linking.openURL(`tel:${number}`);
  };
  const handleWhatsappChat = () => {
    if (!whatsappNumber) {
      Alert.alert('WhatsApp not available', 'Please contact via call or in-app chat.');
      return;
    }
    Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
  };
  const handleChatAdmin = () => {
    router.push('/account/chatScreen');
  };
  const handleViewPress = (item: any) => {
    const serviceId = item.id || item._id;
    const pathname = isTiffin ? `/hostel-details/${serviceId}` : `/tiffin-details/${serviceId}`;
    const type = isTiffin ? 'hostel' : 'tiffin';
    router.push({
      pathname,
      params: { id: serviceId, type, intent: 'view' }
    });
  };
  const handleBookPress = (item: any) => {
    const serviceId = item.id || item._id;
    const pathname = isTiffin ? `/hostel-details/${serviceId}` : `/tiffin-details/${serviceId}`;
    const type = isTiffin ? 'hostel' : 'tiffin';
    router.push({
      pathname,
      params: { id: serviceId, type, intent: 'book' }
    });
  };
  const handleGoToOrder = () => {
    router.push({
      pathname: "/booking",
      params: {
        serviceType: isTiffin ? "tiffin" : "hostel",
      },
    });
  };
  const handleBackToHome = () => {
    router.push("/");
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const statusColor = paymentStatus === 'paid' ? '#22c55e' : '#ef4444';
  const statusText = paymentStatus === 'paid' ? 'Paid' : 'Unpaid';
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Logo />
        </View>
        {/* UPDATED: Conditionally render success title only if payment successful */}
        {paymentStatus === 'paid' && (
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Booking Submitted!</Text>
            <Text style={styles.subtitle}>
              Your {isTiffin ? "tiffin" : "hostel"} booking request has been sent
              successfully.
            </Text>
          </View>
        )}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            {/* UPDATED: Conditionally render Invoice button only if paymentStatus === 'paid' */}
            {paymentStatus === 'paid' && (
              <TouchableOpacity style={styles.invoiceButton} onPress={handlePrintInvoice}>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.invoiceText}>Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* UPDATED: Conditionally render error message and cart button if paymentStatus === 'unpaid' */}
          {paymentStatus === 'unpaid' && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#ef4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>Booking unsuccessful—payment not confirmed. Let's try again!</Text>
              <TouchableOpacity style={styles.cartButton} onPress={handleRetryBooking}>
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {isTiffin ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tiffin Service:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {tiffinBookingDetails.tiffinService}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {tiffinBookingDetails.customer}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.startDate}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.endDate}
                </Text>
              </View>
              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.mealType}
                </Text>
              </View> */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.foodType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.orderType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan Type:</Text>
                <Text style={styles.detailValue}>
                  {tiffinBookingDetails.planType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  ₹{tiffinBookingDetails.amount || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: statusColor }]}>
                  {statusText}
                </Text>
              </View>
              <View style={[styles.detailRow]}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.orderId}>#{tiffinBookingDetails.bookingId}</Text>
              </View>
            </>
          ) : (
            // Hostel booking summary
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hostel Booking :</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {hostelBookingDetails.hostelBooking}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer :</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {hostelBookingDetails.customer}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in date :</Text>
                <Text style={styles.detailValue}>
                  {hostelBookingDetails.checkInDate}
                </Text>
              </View>
               <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-Out date :</Text>
                <Text style={styles.detailValue}>
                  {hostelBookingDetails.checkOutDate}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount :</Text>
                <Text style={styles.detailValue}>
                  ₹{hostelBookingDetails.amount || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: statusColor }]}>
                  {statusText}
                </Text>
              </View>
              <View style={[styles.detailRow]}>
                {/* <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.orderId}>#{hostelBookingDetails.id}</Text> */}
              </View>
            </>
          )}
        </View>
        {/* FIXED: Updated admin contact layout - first two buttons in a row (half width each), WhatsApp full width below */}
        <View style={styles.adminContactContainer}>
          <View style={styles.adminContactRow}>
            <TouchableOpacity
              style={[styles.contactButton, styles.halfWidthButton]}
              onPress={handleCallAdmin}
            >
              <Ionicons name="call-outline" size={20} color="#004AAD" />
              <Text style={styles.contactButtonText}>Call to Owner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.halfWidthButton]}
              onPress={handleChatAdmin}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#004AAD" />
              <Text style={styles.contactButtonText}>Help</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.contactButton, styles.fullWidthButton]}
            onPress={handleWhatsappChat}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.contactNote}>
          Having issue? Contact our support team at +34 12345 5210
        </Text>
        {isTiffin && (
          <View style={styles.whatsNextSection}>
            <Text style={styles.sectionTitle}>{"What's Next?"}</Text>
            <View style={styles.preferenceCard}>
              <Text style={styles.preferenceTitle}>Meal Preference</Text>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>1</Text>
                <Text style={styles.preferenceText}>Provider Contact</Text>
              </View>
              <Text style={styles.preferenceDescription} numberOfLines={2} ellipsizeMode="tail">
                The tiffin provider will contact you within 1 hours to confirm
                your booking.
              </Text>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>2</Text>
                <Text style={styles.preferenceText}>Delivery Setup</Text>
              </View>
              <Text style={styles.preferenceDescription} numberOfLines={2} ellipsizeMode="tail">
                Discuss delivery address, timing, and any special requirements.
              </Text>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceNumberText}>3</Text>
                <Text style={styles.preferenceText}>Enjoy Your Meals</Text>
              </View>
              <Text style={styles.preferenceDescription} numberOfLines={2} ellipsizeMode="tail">
                Fresh, homemade tiffin will be delivered to your schedule.
              </Text>
            </View>
          </View>
        )}
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationTitle}>
            {isTiffin ? "Recommended Hostels" : "Recommended Tiffin Services"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
            decelerationRate="fast"
            contentContainerStyle={styles.recommendationsContent}
            style={styles.recommendationsScroll}
          >
            {recommendations.map((item: any, index: number) => (
              <View key={item.id || item._id || index} style={styles.cardWrapper}>
                <View style={styles.recommendationCard}>
                  {isTiffin ? (
                    <HostelCard
                      hostel={item}
                      onPress={() => handleViewPress(item)}
                      onBookPress={() => handleBookPress(item)}
                      horizontal={true}
                    />
                  ) : (
                    <TiffinCard
                      service={item}
                      onPress={() => handleViewPress(item)}
                      onBookPress={() => handleBookPress(item)}
                      horizontal={true}
                    />
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isTiffin && (
            <Button
              title="Go To Order Screen"
              onPress={handleGoToOrder}
              width={undefined}
              style={styles.orderButton}
            />
          )}
          <Button
            title="Back to Home"
            onPress={handleBackToHome}
            width={undefined}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#004AAD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  invoiceText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  // UPDATED: New styles for error banner and cart button
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2', // Light red background
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626', // Red text
    fontWeight: '500',
  },
  cartButton: {
    backgroundColor: '#ef4444', // Red button to match theme
    padding: 8,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    flexShrink: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#004AAD",
  },
  // FIXED: Updated styles for admin contact layout
  adminContactContainer: {
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  adminContactRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  halfWidthButton: {
    flex: 1,
  },
  fullWidthButton: {
    width: "100%",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactButtonText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    marginLeft: 8,
  },
  contactNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  whatsNextSection: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  preferenceCard: {
    marginTop: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    marginLeft: 12,
  },
  preferenceNumberText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#004AAD",
    lineHeight: 24,
  },
  preferenceDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 36,
    marginBottom: 12,
    lineHeight: 18,
  },
  recommendationsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingHorizontal: 20,
    color: "#1F2937",
  },
  recommendationsScroll: {
    flexGrow: 0,
  },
  recommendationsContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN,
  },
  cardWrapper: {
    width: CARD_WIDTH + CARD_MARGIN * 2,
    paddingHorizontal: CARD_MARGIN,
  },
  recommendationCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: "#fff",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
    overflow: "hidden",
  },
  actionButtons: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  orderButton: {
    marginBottom: 16,
    width: "100%",
  },
  backButton: {
    backgroundColor: "transparent",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#004AAD",
    width: "100%",
  },
  backButtonText: {
    fontSize: 14,
    color: "#004AAD",
    fontWeight: "600",
    textAlign: "center",
  },
});
export default Confirmation;