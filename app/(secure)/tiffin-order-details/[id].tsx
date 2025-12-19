/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redeclare */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
import Header from "@/components/Header";
import { useAuthStore } from "@/store/authStore";
import fallbackDp from "@/assets/images/fallbackdp.png";
import { theme } from "@/constants/utils";

interface SkippedMeal {
  date: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

export default function TiffinOrderDetails() {
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fullExtensionAllocations, setFullExtensionAllocations] = useState([]);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedSkip, setSelectedSkip] = useState<any>(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [selectedOfflineDay, setSelectedOfflineDay] = useState<{ date: string; reason: string } | null>(null);
  const { id, bookingId, type } = params;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDateFull, setStartDateFull] = useState(new Date());
  const [endDateFull, setEndDateFull] = useState(new Date());
  const [bookingData, setBookingData] = useState({
    bookingId: "5648904",
    orderedOn: "13/10/2025",
    tiffinServiceName: "N/A",
    customer: "Rahul",
    startDate: "13/10/25",
    mealType: "Breakfast & Lunch",
    plan: "Monthly",
    orderType: "Delivery",
    endDate: "2025-10-17",
  });
  const [skips, setSkips] = useState<any[]>([]);
  const [offlineDays, setOfflineDays] = useState<{ date: string; reason: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { profileData, fetchProfile } = useAuthStore();
  const profileSource = profileData?.profileImage ? { uri: profileData.profileImage } : fallbackDp;

  const hasBreakfast = useMemo(() => bookingData.mealType.toLowerCase().includes("breakfast"), [bookingData.mealType]);
  const hasLunch = useMemo(() => bookingData.mealType.toLowerCase().includes("lunch"), [bookingData.mealType]);
  const hasDinner = useMemo(() => bookingData.mealType.toLowerCase().includes("dinner"), [bookingData.mealType]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatShortDate = (isoString: string) => {
    const date = new Date(isoString);
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear().toString().slice(2);
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    if (!profileData) {
      fetchProfile();
    }
  }, [profileData, fetchProfile]);

  useEffect(() => {
    const today = new Date();
    setSkipFromDate(formatDate(today));
    setSkipToDate(formatDate(today));
  }, []);

  const fetchData = useCallback(async () => {
    console.log("Fetching data for ID:", id);
    if (!id) return;
    try {
      const res = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getSkippedMeals/${id}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const { success, data } = await res.json();
      console.log("API Response:", { success, data });
      if (success && data) {
        setStartDateFull(new Date(data.summary.startDate));
        setEndDateFull(new Date(data.summary.endDate));
        setCurrentMonth(new Date(data.summary.startDate));
        setSelectedDate(new Date(data.summary.startDate));

        let planType = data.summary.planType || "Breakfast & Lunch";
        planType = planType.replace(/\blunch\b/g, "Lunch").replace(/\bdinner\b/g, "Dinner");
        setBookingData((prev) => ({
          ...prev,
          bookingId: data.summary.bookingId,
          tiffinServiceName: data.summary.tiffinServiceName || "N/A",
          customer: data.summary.customerName,
          startDate: formatShortDate(data.summary.startDate),
          mealType: planType,
          plan: (data.summary.plan || "Monthly").charAt(0).toUpperCase() + (data.summary.plan || "Monthly").slice(1).toLowerCase(),
          orderType: data.summary.orderType,
          endDate: formatShortDate(data.summary.endDate),
        }));
        setSkips(data.fullSkipHistory || []);
        setFullExtensionAllocations(data.fullExtensionAllocations || []);
        setOfflineDays(data.offlineDaysThisMonth || []); // NEW: Store offline days
      } else {
        setModalMessage("Failed to fetch booking details. Please try again.");
        setIsSuccess(false);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setModalMessage("Unable to load booking details. Please check your connection and try again.");
      setIsSuccess(false);
      setShowModal(true);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [id, fetchData]);

  const latestSkip = useMemo(() => {
    if (skips.length === 0) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let latest = null;
    let latestDate = new Date(0);
    skips.forEach((skip) => {
      const skipDate = new Date(skip.skipDateLocal);
      skipDate.setHours(0, 0, 0, 0);
      if (skipDate <= today && skipDate > latestDate) {
        latestDate = skipDate;
        latest = skip;
      }
    });
    return latest;
  }, [skips]);

  const isSelectedInPeriod = useMemo(() => {
    const sel = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const start = new Date(startDateFull.getFullYear(), startDateFull.getMonth(), startDateFull.getDate());
    const end = new Date(endDateFull.getFullYear(), endDateFull.getMonth(), endDateFull.getDate());
    return sel >= start && sel <= end;
  }, [selectedDate, startDateFull, endDateFull]);

  const isSelectedExtension = useMemo(() => {
    return fullExtensionAllocations.some((e: any) => {
      const extDate = new Date(e.dateLocal);
      return (
        selectedDate.getFullYear() === extDate.getFullYear() &&
        selectedDate.getMonth() === extDate.getMonth() &&
        selectedDate.getDate() === extDate.getDate()
      );
    });
  }, [selectedDate, fullExtensionAllocations]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    const startMonthYear = new Date(startDateFull.getFullYear(), startDateFull.getMonth(), 1);
    if (newMonth < startMonthYear) {
      return;
    }
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    const endMonthYear = new Date(endDateFull.getFullYear(), endDateFull.getMonth() + 1, 0);
    if (newMonth > endMonthYear) {
      return;
    }
    setCurrentMonth(newMonth);
  };

  const canGoPrevious = useMemo(() => {
    const currentMonthYear = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startMonthYear = new Date(startDateFull.getFullYear(), startDateFull.getMonth(), 1);
    return currentMonthYear > startMonthYear;
  }, [currentMonth, startDateFull]);

  const canGoNext = useMemo(() => {
    const currentMonthYear = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const endMonthYear = new Date(endDateFull.getFullYear(), endDateFull.getMonth() + 1, 0);
    return currentMonthYear < endMonthYear;
  }, [currentMonth, endDateFull]);

  const getMonthYearString = (date: Date) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleSaveSkipMeal = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    selDate.setHours(0, 0, 0, 0);
    if (selDate.getTime() === today.getTime()) {
      setModalMessage("You cannot skip meals for today. Please select a future date within your booking period.");
      setIsSuccess(false);
      setShowModal(true);
      return;
    }

    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    const body = { date: formattedDate };

    try {
      const saveResponse = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/addSkipMean/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!saveResponse.ok) {
        let errorMessage = "Failed to skip meal. Please try again.";
        try {
          const errText = await saveResponse.text();
          if (errText.toLowerCase().includes("limit") || errText.toLowerCase().includes("exceed")) {
            errorMessage = "You have reached the maximum limit for skipping meals this month. Please contact support if needed.";
          } else if (errText.toLowerCase().includes("invalid date") || errText.toLowerCase().includes("date")) {
            errorMessage = "The selected date is invalid or outside the booking period. Please choose a valid date.";
          } else if (errText.toLowerCase().includes("already")) {
            errorMessage = "Meals for this date have already been skipped. No changes made.";
          } else {
            errorMessage = errText || "You have reached the skip meal limit. Please upgrade your plan for more skips.";
          }
        } catch {}
        setModalMessage(errorMessage);
        setIsSuccess(false);
        setShowModal(true);
        return;
      }
      await fetchData();
      setModalMessage(`${getSkipText()} skip saved successfully!`);
      setIsSuccess(true);
      setShowModal(true);
    } catch (error: any) {
      let errorMessage = "Failed to skip meal. Please try again.";
      if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      setModalMessage(errorMessage);
      setIsSuccess(false);
      setShowModal(true);
    }
  };

  const handleProfilePress = () => {
    router.push("/account/profile");
  };

  const getSkippedMealsForDate = (targetDate: Date) => {
    const skipForDate = skips.find((s: any) => {
      const skipDate = new Date(s.skipDateLocal);
      return (
        targetDate.getFullYear() === skipDate.getFullYear() &&
        targetDate.getMonth() === skipDate.getMonth() &&
        targetDate.getDate() === skipDate.getDate()
      );
    });
    if (!skipForDate) return { breakfast: false, lunch: false, dinner: false };
    const mealTypeLower = skipForDate.mealType.toLowerCase();
    return {
      breakfast: mealTypeLower.includes("breakfast"),
      lunch: mealTypeLower.includes("lunch"),
      dinner: mealTypeLower.includes("dinner"),
    };
  };

  const getAllocatedMealsForExtension = (ext: any) => {
    const allocated = { breakfast: false, lunch: false, dinner: false };
    const mealTypeLower = ext.mealType.toLowerCase();
    allocated.breakfast = mealTypeLower.includes("breakfast");
    allocated.lunch = mealTypeLower.includes("lunch");
    allocated.dinner = mealTypeLower.includes("dinner");
    return allocated;
  };

  // NEW: Check if date is offline
  const isDateOffline = (targetDate: Date) => {
    const dateStr = formatDate(targetDate); // DD/MM/YYYY
    return offlineDays.some((off) => {
      const [y, m, d] = off.date.split("-");
      const formatted = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      return formatted === dateStr;
    });
  };

  // NEW: Get offline reason
  const getOfflineReason = (targetDate: Date) => {
    const dateStr = formatDate(targetDate);
    const off = offlineDays.find((off) => {
      const [y, m, d] = off.date.split("-");
      const formatted = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      return formatted === dateStr;
    });
    return off?.reason || "Service unavailable";
  };

  const isDateSkipped = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12);
    return skips.some((s: any) => {
      const skipDate = new Date(s.skipDateLocal);
      return (
        date.getFullYear() === skipDate.getFullYear() &&
        date.getMonth() === skipDate.getMonth() &&
        date.getDate() === skipDate.getDate()
      );
    });
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDayEmpty} />;
    }

    const dateForMeals = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12);
    const isInPeriod = dateForMeals >= startDateFull && dateForMeals <= endDateFull;
    const isSkippedDate = isDateSkipped(day);
    const isExtensionDate = fullExtensionAllocations.some((ext: any) => {
      const extDate = new Date(ext.dateLocal);
      return (
        dateForMeals.getFullYear() === extDate.getFullYear() &&
        dateForMeals.getMonth() === extDate.getMonth() &&
        dateForMeals.getDate() === extDate.getDate()
      );
    });
    const isOfflineDate = isDateOffline(dateForMeals);
    const isSelected =
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === day;

    let dayStyle = [styles.calendarDay];
    let textStyle = [styles.calendarDayText];

    if (isSelected) dayStyle.push(styles.selectedDay);
    if (isOfflineDate) {
      dayStyle.push(styles.calendarDayOffline);
      textStyle.push(styles.calendarDayTextOffline);
    } else if (isSkippedDate) {
      textStyle.push(styles.calendarDayTextSkipped);
    } else if (isExtensionDate) {
      textStyle.push(styles.calendarDayTextExtension);
    } else if (isInPeriod) {
      textStyle.push(styles.calendarDayTextPeriod);
    }

    return (
      <TouchableOpacity
        key={`day-${day}`}
        style={dayStyle}
        onPress={
          isOfflineDate
            ? () => {
                const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                setSelectedDate(newDate);
                setSelectedOfflineDay({
                  date: formatDate(newDate),
                  reason: getOfflineReason(newDate),
                });
                setShowOfflineModal(true);
              }
            : isInPeriod && !isSkippedDate
            ? () => {
                const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                setSelectedDate(newDate);
              }
            : isSkippedDate
            ? () => {
                const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                setSelectedDate(newDate);
                const skip = skips.find((s: any) => {
                  const skipDate = new Date(s.skipDateLocal);
                  return (
                    dateForMeals.getFullYear() === skipDate.getFullYear() &&
                    dateForMeals.getMonth() === skipDate.getMonth() &&
                    dateForMeals.getDate() === skipDate.getDate()
                  );
                });
                setSelectedSkip(skip);
                setShowSkipModal(true);
              }
            : isExtensionDate
            ? () => {
                const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                setSelectedDate(newDate);
              }
            : undefined
        }
      >
        <Text style={textStyle}>{day}</Text>
      </TouchableOpacity>
    );
  };

  const renderMealStatusRow = (label: string, status: boolean) => (
    <View style={styles.mealStatus}>
      <Text style={styles.mealStatusLabel}>{label}</Text>
      {status ? (
        <Ionicons name="checkmark" size={20} color="#10B981" />
      ) : (
        <Ionicons name="close" size={20} color="#EF4444" />
      )}
    </View>
  );

  const renderSelectedDateMeals = () => {
    const skippedMeals = getSkippedMealsForDate(selectedDate);
    const ext = fullExtensionAllocations.find((e: any) => {
      const extDate = new Date(e.dateLocal);
      return (
        selectedDate.getFullYear() === extDate.getFullYear() &&
        selectedDate.getMonth() === extDate.getMonth() &&
        selectedDate.getDate() === extDate.getDate()
      );
    });

    let mealStatuses = { breakfast: false, lunch: false, dinner: false };
    let showStatuses = { breakfast: false, lunch: false, dinner: false };

    if (ext) {
      const allocated = getAllocatedMealsForExtension(ext);
      if (allocated.breakfast) { mealStatuses.breakfast = true; showStatuses.breakfast = true; }
      if (allocated.lunch) { mealStatuses.lunch = true; showStatuses.lunch = true; }
      if (allocated.dinner) { mealStatuses.dinner = true; showStatuses.dinner = true; }
    } else {
      if (hasBreakfast) { mealStatuses.breakfast = true; showStatuses.breakfast = true; }
      if (hasLunch) { mealStatuses.lunch = true; showStatuses.lunch = true; }
      if (hasDinner) { mealStatuses.dinner = true; showStatuses.dinner = true; }

      if (skippedMeals.breakfast) mealStatuses.breakfast = false;
      if (skippedMeals.lunch) mealStatuses.lunch = false;
      if (skippedMeals.dinner) mealStatuses.dinner = false;
    }

    const rows = [];
    if (showStatuses.breakfast) rows.push(renderMealStatusRow("Breakfast", mealStatuses.breakfast));
    if (showStatuses.lunch) rows.push(renderMealStatusRow("Lunch", mealStatuses.lunch));
    if (showStatuses.dinner) rows.push(renderMealStatusRow("Dinner", mealStatuses.dinner));

    return (
      <View style={styles.selectedDateMeals}>
        <Text style={styles.selectedDateText}>Date: {formatDate(selectedDate)}</Text>
        <View style={styles.mealStatusRow}>
          {rows}
          {rows.length === 0 && <Text style={styles.mealStatusLabel}>No meals in this plan</Text>}
        </View>
      </View>
    );
  };

  const renderSkipModal = () => {
    if (!selectedSkip) return null;
    const skipDate = new Date(selectedSkip.skipDateLocal);
    const skippedMeals = getSkippedMealsForDate(skipDate);
    const rows = [];
    if (hasBreakfast) rows.push(renderMealStatusRow("Breakfast", !skippedMeals.breakfast));
    if (hasLunch) rows.push(renderMealStatusRow("Lunch", !skippedMeals.lunch));
    if (hasDinner) rows.push(renderMealStatusRow("Dinner", !skippedMeals.dinner));

    return (
      <Modal visible={showSkipModal} transparent animationType="fade" onRequestClose={() => { setShowSkipModal(false); setSelectedSkip(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Skipped Meals</Text>
            <Text style={[styles.modalText, { fontSize: 14, marginBottom: 20 }]}>
              Date: {formatShortDate(selectedSkip.skipDateLocal)}
            </Text>
            <View style={styles.mealStatusRow}>{rows}</View>
            <TouchableOpacity onPress={() => { setShowSkipModal(false); setSelectedSkip(null); }} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // NEW: Offline modal
  const renderOfflineModal = () => {
    if (!selectedOfflineDay) return null;
    return (
      <Modal visible={showOfflineModal} transparent animationType="fade" onRequestClose={() => { setShowOfflineModal(false); setSelectedOfflineDay(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#F59E0B" style={{ marginBottom: 16 }} />
            <Text style={styles.modalText}>Service Offline</Text>
            <Text style={[styles.modalText, { fontSize: 14, marginVertical: 12, color: "#666" }]}>
              Date: {selectedOfflineDay.date}
            </Text>
            <Text style={{ fontSize: 15, textAlign: "center", color: "#444", marginBottom: 20 }}>
              {selectedOfflineDay.reason}
            </Text>
            <TouchableOpacity onPress={() => { setShowOfflineModal(false); setSelectedOfflineDay(null); }} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const isSelectedDateSkipped = useMemo(() => {
    const targetDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return skips.some((s: any) => {
      const skipDate = new Date(s.skipDateLocal);
      return (
        targetDate.getFullYear() === skipDate.getFullYear() &&
        targetDate.getMonth() === skipDate.getMonth() &&
        targetDate.getDate() === skipDate.getDate()
      );
    });
  }, [selectedDate, skips]);

  const getSkipText = () => {
    const meals = [];
    if (hasBreakfast) meals.push("Breakfast");
    if (hasLunch) meals.push("Lunch");
    if (hasDinner) meals.push("Dinner");
    if (meals.length === 0) return "meals";
    if (meals.length === 1) return meals[0];
    return meals.slice(0, -1).join(" and ") + " and " + meals[meals.length - 1];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{flex:1}}>
      <View style={styles.headerWrapper}>
        <View style={styles.headerLeft}>
          <Header title="Order Details" />
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <Image source={profileSource} style={styles.profileImage} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Track your tiffin bookings</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>Booking #{bookingData.bookingId}</Text>
          <Text style={styles.orderedOn}>Ordered on {bookingData.orderedOn}</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Tiffin Service:</Text><Text style={styles.detailValue}>{bookingData.tiffinServiceName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Customer:</Text><Text style={styles.detailValue}>{bookingData.customer}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Start Date:</Text><Text style={styles.detailValue}>{bookingData.startDate}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>End Date:</Text><Text style={styles.detailValue}>{bookingData.endDate}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Plan Type:</Text><Text style={styles.detailValue}>{bookingData.mealType}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Plan:</Text><Text style={styles.detailValue}>{bookingData.plan}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Order Type:</Text><Text style={styles.detailValue}>{bookingData.orderType}</Text></View>
          </View>
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>Note : Select a date to skip {getSkipText()} for that day</Text>
          </View>
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              {canGoPrevious && (
                <TouchableOpacity onPress={handlePreviousMonth}>
                  <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              <Text style={styles.calendarMonth}>{getMonthYearString(currentMonth)}</Text>
              {canGoNext && (
                <TouchableOpacity onPress={handleNextMonth}>
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.calendarDaysHeader}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, index) => renderCalendarDay(day, index))}
            </View>
          </View>
          {renderSelectedDateMeals()}
          {isSelectedInPeriod && !isSelectedDateSkipped && bookingData?.plan?.toLowerCase() === "monthly" && (
            <View style={styles.skipMealSection}>
              <View style={styles.skipMealHeader}>
                <View style={styles.skipMealIcon}><Ionicons name="restaurant" size={20} color="#666" /></View>
                <Text style={styles.skipMealText}>Skip {getSkipText()} for this day</Text>
              </View>
              <View style={styles.skipMealForm}>
                <Text style={styles.datePickerLabel}>Date: {formatDate(selectedDate)}</Text>
                <Text style={styles.skipDayText}>Skipping {getSkipText()} for the selected date.</Text>
                <Button title="Tap To Skip For This Day" onPress={handleSaveSkipMeal} style={styles.saveButton} height={48} />
              </View>
            </View>
          )}
          {latestSkip && (
            <View style={styles.skipHistorySection}>
              <View style={styles.skipHistoryItem}>
                <View style={styles.skipHistoryDetails}>
                  <Text style={styles.skipHistoryTitle}>Previously Skipped Meal</Text>
                  <Text style={styles.skipHistoryDate}>Date: {latestSkip.skipDateLocal || latestSkip.date}</Text>
                  <Text style={styles.skipHistoryMeals}>Meal Type: {latestSkip.mealType || bookingData.mealType}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {showFromDatePicker && (
        <DateTimePicker value={new Date()} mode="date" display="default" onChange={(event, selectedDate) => {
          setShowFromDatePicker(false);
          if (selectedDate) setSkipFromDate(formatDate(selectedDate));
        }} />
      )}
      {showToDatePicker && (
        <DateTimePicker value={new Date()} mode="date" display="default" onChange={(event, selectedDate) => {
          setShowToDatePicker(false);
          if (selectedDate) setSkipToDate(formatDate(selectedDate));
        }} />
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalText, { color: isSuccess ? "#000" : "#EF4444" }]}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderSkipModal()}
      {renderOfflineModal()}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor: "#ffffff" },
  headerWrapper: { flexDirection: "column", alignItems: "center", paddingHorizontal: 26 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileButton: { marginRight: 16 },
  profileImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#E5E7EB" },
  headerSubtitle: { fontSize: 14, color: "#666060", paddingHorizontal: 40, marginBottom: 30, marginTop: -14, width: "100%", flex: 1 },
  noteContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 12, paddingHorizontal: 0, marginVertical: 16, alignItems: 'center' },
  noteText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  scrollView: { flex: 1 },
  bookingCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E0E0E0" },
  bookingTitle: { fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 4 },
  orderedOn: { fontSize: 13, color: "#666", marginBottom: 16 },
  detailsContainer: { marginBottom: 20 },
  detailRow: { flexDirection: "row", marginBottom: 10, flex: 1 },
  detailLabel: { fontSize: 14, color: "#666", width: 120 },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1, textAlign: "right" },
  calendarSection: { marginTop: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 12, padding: 16 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  calendarMonth: { fontSize: 16, fontWeight: "600", color: "#000" },
  calendarDaysHeader: { flexDirection: "row", justifyContent: "space-around" },
  calendarDayHeader: { fontSize: 12, color: "#666", fontWeight: "500", textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 25, marginBottom: 1, paddingVertical: 2 },
  selectedDay: { borderWidth: 1, borderColor: colors.primary },
  calendarDayEmpty: { width: "14.28%", aspectRatio: 1 },
  calendarDayText: { fontSize: 14, color: "#000" },
  calendarDayTextPeriod: { color: "#1DB435", fontWeight: "500" },
  calendarDayTextSkipped: { color: "#E51A1A" },
  calendarDayTextExtension: { color: "#0000FF", fontWeight: "500" },
  calendarDayOffline: { backgroundColor: "#F3F4F6" },
  calendarDayTextOffline: { color: "#9CA3AF", textDecorationLine: "line-through", fontStyle: "italic" },
  selectedDateMeals: { backgroundColor: "#F8F9FA", borderRadius: 8, padding: 12, marginBottom: 16 },
  selectedDateText: { fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 12 },
  mealStatusRow: { flexDirection: "row", justifyContent: "space-around" },
  mealStatus: { alignItems: "center", flex: 1 },
  mealStatusLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  skipMealSection: { marginTop: 20 },
  skipMealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  skipMealIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginRight: 12 },
  skipMealText: { fontSize: 16, fontWeight: "600", color: "#000", flex: 1 },
  skipMealForm: { backgroundColor: "#F8F9FA", borderRadius: 8, padding: 16 },
  datePickerLabel: { fontSize: 16, color: "#111111", marginBottom: 15, marginLeft: 5 },
  skipDayText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  saveButton: { backgroundColor: colors.primary },
  skipHistorySection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  skipHistoryItem: { backgroundColor: "#F8F9FA", borderRadius: 8, padding: 12, marginBottom: 8 },
  skipHistoryDetails: { marginBottom: 8 },
  skipHistoryTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 12 },
  skipHistoryDate: { fontSize: 13, color: "#666", marginBottom: 4 },
  skipHistoryMeals: { fontSize: 13, color: "#666" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "#ffffff", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
  modalText: { fontSize: 16, textAlign: "center", marginBottom: 20, fontWeight: "500" },
  modalButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minWidth: 80, alignItems: "center" },
  modalButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});