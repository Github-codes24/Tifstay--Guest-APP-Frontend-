// app/tiffin-order-details/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "@/constants/colors";
import Button from "@/components/Buttons";
import Header from "@/components/Header";
import Profile from "../account/profile";

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
  const [showSkipMeal, setShowSkipMeal] = useState(false);
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [skipMeals, setSkipMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [skippedMealsHistory, setSkippedMealsHistory] = useState<SkippedMeal[]>(
    [
      {
        date: "22/07/2025 - 25/07/2025",
        meals: { breakfast: false, lunch: true, dinner: false },
      },
    ]
  );

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Demo booking data
  const bookingData = {
    bookingId: "TF2024002",
    orderedOn: "21/07/2025",
    serviceName: "Maharashtrian Ghar Ka Khana",
    customer: "Onil Karmokar",
    startDate: "21/07/25",
    mealType: "Breakfast, Lunch, Dinner",
    plan: "Monthly",
    orderType: "Delivery",
  };

  useEffect(() => {
    const today = new Date();
    setSkipFromDate(formatDate(today));
    setSkipToDate(formatDate(today));
  }, []);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  const handleSaveSkipMeal = () => {
    if (!skipFromDate || !skipToDate) {
      Alert.alert("Error", "Please select both From and To dates");
      return;
    }

    if (!skipMeals.breakfast && !skipMeals.lunch && !skipMeals.dinner) {
      Alert.alert("Error", "Please select at least one meal to skip");
      return;
    }

    // Add to history
    const newSkippedMeal: SkippedMeal = {
      date: `${skipFromDate} - ${skipToDate}`,
      meals: { ...skipMeals },
    };

    setSkippedMealsHistory([...skippedMealsHistory, newSkippedMeal]);
    setShowSkipMeal(false);
    setSkipMeals({ breakfast: false, lunch: false, dinner: false });

    Alert.alert("Success", "Meal skip preferences saved successfully");
  };

  const handleProfilePress = () => {
    router.push("/account/profile");
  };

  const isDateSkipped = (day: number) => {
    // This is a simple example - you'd need more complex logic for date ranges
    return [20, 21, 22, 23, 24, 25].includes(day);
  };

  const getSkippedMealsForDate = (day: number) => {
    // Example logic - you'd implement actual date checking
    if (day === 20) {
      return { breakfast: false, lunch: true, dinner: false };
    }
    return null;
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDayEmpty} />;
    }

    const isToday =
      day === new Date().getDate() &&
      currentMonth.getMonth() === new Date().getMonth() &&
      currentMonth.getFullYear() === new Date().getFullYear();

    const isSkipped = isDateSkipped(day);
    const skippedMeals = getSkippedMealsForDate(day);

    return (
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.calendarDay,
          isToday && styles.calendarDayToday,
          isSkipped && styles.calendarDaySkipped,
        ]}
        onPress={() =>
          setSelectedDate(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          )
        }
      >
        <Text
          style={[
            styles.calendarDayText,
            isToday && styles.calendarDayTextToday,
            isSkipped && styles.calendarDayTextSkipped,
          ]}
        >
          {day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSelectedDateMeals = () => {
    const day = selectedDate.getDate();
    const skippedMeals = getSkippedMealsForDate(day);

    if (!skippedMeals) {
      return (
        <View style={styles.selectedDateMeals}>
          <Text style={styles.selectedDateText}>
            Date: {formatDate(selectedDate)}
          </Text>
          <View style={styles.mealStatusRow}>
            <View style={styles.mealStatus}>
              <Text style={styles.mealStatusLabel}>Breakfast</Text>
              <Ionicons name="checkmark" size={20} color="#10B981" />
            </View>
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
            <Text style={styles.mealStatusLabel}>Breakfast</Text>
            {skippedMeals.breakfast ? (
              <Ionicons name="close" size={20} color="#EF4444" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#10B981" />
            )}
          </View>
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
              source={{ uri: "https://i.pravatar.cc/100" }}
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
              <Text style={styles.detailValue}>{bookingData.serviceName}</Text>
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
              <Text style={styles.detailLabel}>Meal Type:</Text>
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

          {/* Calendar Section */}
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

            {/* Calendar Days Header */}
            <View style={styles.calendarDaysHeader}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, index) =>
                renderCalendarDay(day, index)
              )}
            </View>
          </View>

          {/* Selected Date Meal Status */}
          {renderSelectedDateMeals()}

          {/* Skip Meal Toggle */}
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
                <View style={styles.datePickerRow}>
                  <View style={styles.datePickerItem}>
                    <Text style={styles.datePickerLabel}>From</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowFromDatePicker(true)}
                    >
                      <Text style={styles.datePickerText}>{skipFromDate}</Text>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.datePickerItem}>
                    <Text style={styles.datePickerLabel}>To</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowToDatePicker(true)}
                    >
                      <Text style={styles.datePickerText}>{skipToDate}</Text>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.mealCheckboxes}>
                  <TouchableOpacity
                    style={styles.mealCheckbox}
                    onPress={() =>
                      setSkipMeals({
                        ...skipMeals,
                        breakfast: !skipMeals.breakfast,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        skipMeals.breakfast && styles.checkboxChecked,
                      ]}
                    >
                      {skipMeals.breakfast && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Breakfast</Text>
                  </TouchableOpacity>

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
                      setSkipMeals({ ...skipMeals, dinner: !skipMeals.dinner })
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

          {/* Previously Skipped Meals */}
          {skippedMealsHistory.length > 0 && (
            <View style={styles.skipHistorySection}>
              <Text style={styles.skipHistoryTitle}>
                Previously Meal Skip Date
              </Text>
              {skippedMealsHistory.map((skip, index) => (
                <View key={index} style={styles.skipHistoryItem}>
                  <View style={styles.skipHistoryDetails}>
                    <Text style={styles.skipHistoryDate}>
                      Skip Meals Date: {skip.date}
                    </Text>
                    <Text style={styles.skipHistoryMeals}>
                      Skip meals type:{" "}
                      {Object.entries(skip.meals)
                        .filter(([_, value]) => value)
                        .map(
                          ([meal]) =>
                            meal.charAt(0).toUpperCase() + meal.slice(1)
                        )
                        .join(", ")}
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.changeSkipDate}>Change Skip Date</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Pickers */}
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
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: "left",
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
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
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
  calendarDaySkipped: {
    backgroundColor: "#FEE2E2",
  },
  calendarDayText: {
    fontSize: 14,
    color: "#000",
  },
  calendarDayTextToday: {
    color: colors.primary,
    fontWeight: "600",
  },
  calendarDayTextSkipped: {
    color: "#EF4444",
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
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
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
});
