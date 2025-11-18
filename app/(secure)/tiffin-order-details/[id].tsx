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
  Switch,
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

interface SkippedMeal {
  date: string;
  meals: {
    lunch: boolean;
    dinner: boolean;
  };
}

export default function TiffinOrderDetails() {
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSkipMeal, setShowSkipMeal] = useState(false);
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [skipMeals, setSkipMeals] = useState({
    lunch: false,
    dinner: false,
  });
  const [skippedMealsHistory, setSkippedMealsHistory] = useState<SkippedMeal[]>(
    []
  );
  const [fullExtensionAllocations, setFullExtensionAllocations] = useState([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedSkip, setSelectedSkip] = useState(null);
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
    mealType: "Lunch & Dinner",
    plan: "Monthly",
    orderType: "Delivery",
    endDate: "2025-10-17",
  });

  const [skips, setSkips] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { profileData, fetchProfile } = useAuthStore();

  const profileSource = profileData?.profileImage ? { uri: profileData.profileImage } : fallbackDp;

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
        
        setBookingData((prev) => ({
          ...prev,
          bookingId: data.summary.bookingId,
          tiffinServiceName: data.summary.tiffinServiceName || "N/A",
          customer: data.summary.customerName,
          startDate: formatShortDate(data.summary.startDate),
          mealType: data.summary.planType || "Lunch & Dinner",
          plan: (data.summary.plan || "Monthly").charAt(0).toUpperCase() + (data.summary.plan || "Monthly").slice(1).toLowerCase(),
          orderType: data.summary.orderType,
          endDate: formatShortDate(data.summary.endDate),
        }));

        setSkips(data.fullSkipHistory || []);
        setFullExtensionAllocations(data.fullExtensionAllocations || []);

        const history = (data.fullSkipHistory || []).map((skip: any) => ({
          date: formatDate(new Date(skip.skipDateLocal)),
          meals: {
            lunch: false,
            dinner: false,
          },
        }));
        setSkippedMealsHistory(history);
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
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const getMonthYearString = (date: Date) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleSaveSkipMeal = async () => {
    // Format selected date as YYYY-MM-DD
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Collect selected meals
    const selectedMeals: string[] = [];
    if (skipMeals.lunch) selectedMeals.push("lunch");
    if (skipMeals.dinner) selectedMeals.push("dinner");

    // Prepare request body
    const body: any = { date: formattedDate };
    if (selectedMeals.length === 1) {
      body.mealType = selectedMeals[0]; // single string
    } else if (selectedMeals.length > 1) {
      body.mealType = selectedMeals; // array when both selected
    } else if (selectedMeals.length === 0) {
      body.mealType = "all"; // if none selected, perhaps skip all? But adjust as needed
    }

    console.log("Saving skip meal with body:", body);

    try {
      const saveResponse = await fetch(
        `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/addSkipMean/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!saveResponse.ok) {
        let errorMessage = "Failed to skip meal. Please try again.";
        try {
          const errText = await saveResponse.text();
          console.error("Server response:", errText);

          // Map server error messages to user-friendly ones
          if (errText.toLowerCase().includes("limit") || errText.toLowerCase().includes("exceed")) {
            errorMessage = "You have reached the maximum limit for skipping meals this month. Please contact support if needed.";
          } else if (errText.toLowerCase().includes("invalid date") || errText.toLowerCase().includes("date")) {
            errorMessage = "The selected date is invalid or outside the booking period. Please choose a valid date.";
          } else if (errText.toLowerCase().includes("already")) {
            errorMessage = "Meals for this date have already been skipped. No changes made.";
          } else if (errText.toLowerCase().includes("network") || errText.toLowerCase().includes("connection")) {
            errorMessage = "Network issue. Please check your connection and try again.";
          } else {
            errorMessage = errText || "You have reached the skip meal limit. Please upgrade your plan for more skips.";
          }
        } catch (parseError) {
          console.error("Error parsing server error:", parseError);
          errorMessage = "An unexpected error occurred. Please try again.";
        }
        setModalMessage(errorMessage);
        setIsSuccess(false);
        setShowModal(true);
        return; // Exit early without refreshing data
      }

      await fetchData();
      setShowSkipMeal(false);
      setSkipMeals({ lunch: false, dinner: false });

      setModalMessage("Meal skip preferences saved successfully!");
      setIsSuccess(true);
      setShowModal(true);
    } catch (error: any) {
      console.error("Error saving skip meal:", error);
      let errorMessage = "Failed to skip meal. Please try again.";

      // Handle common network or other errors
      if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message.includes("limit")) {
        errorMessage = "You have reached the maximum limit for skipping meals this month. Please contact support if needed.";
      } else if (error.message.includes("invalid") || error.message.includes("date")) {
        errorMessage = "Invalid date selected. Please choose a date within your booking period.";
      } else {
        errorMessage =
          error?.message ||
          (typeof error === "string" ? error : "An unexpected error occurred. Please try again later.");
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
    const skip = skips.find((s: any) => {
      const skipDate = new Date(s.skipDateLocal);
      return (
        targetDate.getFullYear() === skipDate.getFullYear() &&
        targetDate.getMonth() === skipDate.getMonth() &&
        targetDate.getDate() === skipDate.getDate()
      );
    });
    if (skip) {
      const skipped = {
        lunch: false,
        dinner: false,
      };
      const mealType = skip.mealType;
      if (Array.isArray(mealType)) {
        skipped.lunch = mealType.includes("lunch");
        skipped.dinner = mealType.includes("dinner");
      } else if (mealType === "all") {
        skipped.lunch = true;
        skipped.dinner = true;
      } else if (mealType === "lunch") {
        skipped.lunch = true;
      } else if (mealType === "dinner") {
        skipped.dinner = true;
      }
      return skipped;
    }
    return null;
  };

  const getAllocatedMealsForExtension = (ext: any) => {
    const allocated = {
      lunch: false,
      dinner: false,
    };
    const mealType = ext.mealType;
    if (Array.isArray(mealType)) {
      allocated.lunch = mealType.includes("lunch");
      allocated.dinner = mealType.includes("dinner");
    } else if (mealType === "all") {
      allocated.lunch = true;
      allocated.dinner = true;
    } else if (mealType === "lunch") {
      allocated.lunch = true;
    } else if (mealType === "dinner") {
      allocated.dinner = true;
    }
    return allocated;
  };

  const isDateSkipped = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      12
    );
    const skip = skips.find((s: any) => {
      const skipDate = new Date(s.skipDateLocal);
      return (
        date.getFullYear() === skipDate.getFullYear() &&
        date.getMonth() === skipDate.getMonth() &&
        date.getDate() === skipDate.getDate()
      );
    });
    return !!skip;
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDayEmpty} />;
    }

    const isToday =
      day === new Date().getDate() &&
      currentMonth.getMonth() === new Date().getMonth() &&
      currentMonth.getFullYear() === new Date().getFullYear();

    const dateForMeals = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      12
    );
    const isInPeriod =
      dateForMeals >= startDateFull && dateForMeals <= endDateFull;
    const isEndDate =
      formatShortDate(dateForMeals) === formatShortDate(endDateFull);
    const isSkippedDate = skips.some((skip: any) => {
      const skipDate = new Date(skip.skipDateLocal);
      return (
        dateForMeals.getFullYear() === skipDate.getFullYear() &&
        dateForMeals.getMonth() === skipDate.getMonth() &&
        dateForMeals.getDate() === skipDate.getDate()
      );
    });
    const isExtensionDate = fullExtensionAllocations.some((ext: any) => {
      const extDate = new Date(ext.dateLocal);
      return (
        dateForMeals.getFullYear() === extDate.getFullYear() &&
        dateForMeals.getMonth() === extDate.getMonth() &&
        dateForMeals.getDate() === extDate.getDate()
      );
    });

    let dayStyle = [styles.calendarDay];
    let textStyle = [styles.calendarDayText];
    // console.log("Rendering day:", day, { dateForMeals });

    if (isSkippedDate) {
      textStyle.push(styles.calendarDayTextSkipped);
    } else if (isExtensionDate) {
      textStyle.push(styles.calendarDayTextExtension);
    } else if (isEndDate) {
      textStyle.push(styles.calendarDayTextEnd);
    } else if (isInPeriod) {
      textStyle.push(styles.calendarDayTextPeriod);
    }

    return (
      <TouchableOpacity
        key={`day-${day}`}
        style={dayStyle}
        onPress={
          isInPeriod && !isSkippedDate
            ? () => {
                const newDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
                );
                setSelectedDate(newDate);
                setShowSkipMeal(true);
                setSkipMeals({ lunch: false, dinner: false });
              }
            : isSkippedDate
            ? () => {
                const newDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
                );
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
                const ext = fullExtensionAllocations.find((e: any) => {
                  const extDate = new Date(e.dateLocal);
                  return (
                    dateForMeals.getFullYear() === extDate.getFullYear() &&
                    dateForMeals.getMonth() === extDate.getMonth() &&
                    dateForMeals.getDate() === extDate.getDate()
                  );
                });
                setSelectedExtension(ext);
                setShowExtensionModal(true);
              }
            : undefined
        }
      >
        <Text style={textStyle}>{day}</Text>
      </TouchableOpacity>
    );
  };

  const renderSelectedDateMeals = () => {
    const skippedMeals = getSkippedMealsForDate(selectedDate);

    if (!skippedMeals) {
      return (
        <View style={styles.selectedDateMeals}>
          <Text style={styles.selectedDateText}>
            Date: {formatDate(selectedDate)}
          </Text>
          <View style={styles.mealStatusRow}>
            <View style={styles.mealStatus}>
              <Text style={styles.mealStatusLabel}>Lunch</Text>
              <Ionicons name="checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.mealStatus}>
              <Text style={styles.mealStatusLabel}>Dinner</Text>
              <Ionicons name="checkmark" size={20} color="#10B981" />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.selectedDateMeals}>
        <Text style={styles.selectedDateText}>
          Date: {formatDate(selectedDate)}
        </Text>
        <View style={styles.mealStatusRow}>
          <View style={styles.mealStatus}>
            <Text style={styles.mealStatusLabel}>Lunch</Text>
            {skippedMeals.lunch ? (
              <Ionicons name="close" size={20} color="#EF4444" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#10B981" />
            )}
          </View>
          <View style={styles.mealStatus}>
            <Text style={styles.mealStatusLabel}>Dinner</Text>
            {skippedMeals.dinner ? (
              <Ionicons name="close" size={20} color="#EF4444" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#10B981" />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderExtensionModal = () => {
    if (!selectedExtension) return null;
    const allocatedMeals = getAllocatedMealsForExtension(selectedExtension);

    return (
      <Modal
        visible={showExtensionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowExtensionModal(false);
          setSelectedExtension(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Extension Details</Text>
            <Text style={[styles.modalText, { fontSize: 14, marginBottom: 20 }]}>
              Date: {selectedExtension.dateLocal}
            </Text>
            <View style={styles.mealStatusRow}>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusLabel}>Lunch</Text>
                {allocatedMeals.lunch ? (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                ) : (
                  <Ionicons name="close" size={20} color="#EF4444" />
                )}
              </View>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusLabel}>Dinner</Text>
                {allocatedMeals.dinner ? (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                ) : (
                  <Ionicons name="close" size={20} color="#EF4444" />
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowExtensionModal(false);
                setSelectedExtension(null);
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSkipModal = () => {
    if (!selectedSkip) return null;

    const skippedMeals = {
      lunch: false,
      dinner: false,
    };
    const mealType = selectedSkip.mealType;
    if (Array.isArray(mealType)) {
      if (mealType.includes("lunch")) skippedMeals.lunch = true;
      if (mealType.includes("dinner")) skippedMeals.dinner = true;
    } else if (mealType === "all") {
      skippedMeals.lunch = true;
      skippedMeals.dinner = true;
    } else if (mealType === "lunch") {
      skippedMeals.lunch = true;
    } else if (mealType === "dinner") {
      skippedMeals.dinner = true;
    }

    return (
      <Modal
        visible={showSkipModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSkipModal(false);
          setSelectedSkip(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Skipped Meals</Text>
            <Text style={[styles.modalText, { fontSize: 14, marginBottom: 20 }]}>
              Date: {formatShortDate(selectedSkip.skipDateLocal)}
            </Text>
            <View style={styles.mealStatusRow}>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusLabel}>Lunch</Text>
                {skippedMeals.lunch ? (
                  <Ionicons name="close" size={20} color="#EF4444" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                )}
              </View>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusLabel}>Dinner</Text>
                {skippedMeals.dinner ? (
                  <Ionicons name="close" size={20} color="#EF4444" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowSkipModal(false);
                setSelectedSkip(null);
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.headerLeft}>
          <Header title="Order Details" />
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.profileButton}
          >
            <Image
              source={profileSource}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Track your tiffin bookings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Details Card */}
        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>
            Booking #{bookingData.bookingId}
          </Text>
          <Text style={styles.orderedOn}>
            Ordered on {bookingData.orderedOn}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tiffin Service:</Text>
              <Text style={styles.detailValue}>
                {bookingData.tiffinServiceName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailValue}>{bookingData.customer}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{bookingData.startDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date:</Text>
              <Text style={styles.detailValue}>{bookingData.endDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan Type:</Text>
              <Text style={styles.detailValue}>{bookingData.mealType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan:</Text>
              <Text style={styles.detailValue}>{bookingData.plan}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Type:</Text>
              <Text style={styles.detailValue}>{bookingData.orderType}</Text>
            </View>
          </View>

          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePreviousMonth}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {getMonthYearString(currentMonth)}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, index) =>
                renderCalendarDay(day, index)
              )}
            </View>
          </View>

          {renderSelectedDateMeals()}

          {bookingData?.plan?.toLowerCase() === "monthly" && (
            <View style={styles.skipMealSection}>
              <View style={styles.skipMealHeader}>
                <View style={styles.skipMealIcon}>
                  <Ionicons name="restaurant" size={20} color="#666" />
                </View>
                <Text style={styles.skipMealText}>Want to skip meal?</Text>
                <Switch
                  value={showSkipMeal}
                  onValueChange={setShowSkipMeal}
                  trackColor={{ false: "#E5E7EB", true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {showSkipMeal && (
                <View style={styles.skipMealForm}>
                  <Text style={styles.datePickerLabel}>
                    Date: {formatDate(selectedDate)}
                  </Text>

                  <View style={styles.mealCheckboxes}>
                    <Text style={styles.checkboxLabel}>Select Meal</Text>

                    <TouchableOpacity
                      style={styles.mealCheckbox}
                      onPress={() =>
                        setSkipMeals({ ...skipMeals, lunch: !skipMeals.lunch })
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          skipMeals.lunch && styles.checkboxChecked,
                        ]}
                      >
                        {skipMeals.lunch && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>Lunch</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mealCheckbox}
                      onPress={() =>
                        setSkipMeals({
                          ...skipMeals,
                          dinner: !skipMeals.dinner,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          skipMeals.dinner && styles.checkboxChecked,
                        ]}
                      >
                        {skipMeals.dinner && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>Dinner</Text>
                    </TouchableOpacity>
                  </View>

                  <Button
                    title="Save"
                    onPress={handleSaveSkipMeal}
                    style={styles.saveButton}
                    height={48}
                  />
                </View>
              )}
            </View>
          )}

          {latestSkip && (
            <View style={styles.skipHistorySection}>
              <View key={latestSkip.date} style={styles.skipHistoryItem}>
                <View style={styles.skipHistoryDetails}>
                  <Text style={styles.skipHistoryTitle}>
                    Previously Skipped Meal
                  </Text>
                  <Text style={styles.skipHistoryDate}>
                    Date: {latestSkip.skipDateLocal || latestSkip.date}
                  </Text>
                  <Text style={styles.skipHistoryMeals}>
                    Meal Type:{" "}
                    {latestSkip.mealType === "all"
                      ? "Lunch & Dinner"
                      : Array.isArray(latestSkip.mealType)
                      ? latestSkip.mealType.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(" & ")
                      : latestSkip.mealType ? latestSkip.mealType.charAt(0).toUpperCase() + latestSkip.mealType.slice(1) : "Unknown"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {showFromDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromDatePicker(false);
            if (selectedDate) {
              setSkipFromDate(formatDate(selectedDate));
            }
          }}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToDatePicker(false);
            if (selectedDate) {
              setSkipToDate(formatDate(selectedDate));
            }
          }}
        />
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalText, { color: isSuccess ? "#000" : "#EF4444" }]}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderExtensionModal()}
      {renderSkipModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerWrapper: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 26,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    marginRight: 16,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666060",
    paddingHorizontal: 40,
    marginBottom: 30,
    marginTop: -14,
    width: "100%",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bookingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  orderedOn: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  calendarSection: {
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  calendarDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  calendarDayHeader: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 1,
    paddingVertical: 2,
  },
  calendarDayEmpty: {
    width: "14.28%",
    aspectRatio: 1,
  },
  calendarDayToday: {
    backgroundColor: "#E3F2FD",
  },
  calendarDayText: {
    fontSize: 14,
    color: "#000",
  },
  calendarDayTextToday: {
    color: colors.primary,
    fontWeight: "600",
  },
  calendarDayTextPeriod: {
    color: "#1DB435",
    fontWeight: "500",
  },
  calendarDayTextEnd: {
    color: "#0088FF",
    fontWeight: "500",
  },
  calendarDayTextSkipped: {
    color: "#E51A1A",
  },
  calendarDayTextExtension: {
    color: "#0000FF",
    fontWeight: "500",
  },
  selectedDateMeals: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  mealStatusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  mealStatus: {
    alignItems: "center",
    flex: 1,
  },
  mealStatusLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  skipMealSection: {
    marginTop: 20,
  },
  skipMealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  skipMealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  skipMealText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  skipMealForm: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
  },
  datePickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  datePickerItem: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 16,
    color: "#111111",
    marginBottom: 15,
    marginLeft: 5,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: "#000",
  },
  mealCheckboxes: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  mealCheckbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#FFA500",
    borderColor: "#FFA500",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#000",
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  skipHistorySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  skipHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  skipHistoryItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  skipHistoryDetails: {
    marginBottom: 8,
  },
  skipHistoryDate: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  skipHistoryMeals: {
    fontSize: 13,
    color: "#666",
  },
  changeSkipDate: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});