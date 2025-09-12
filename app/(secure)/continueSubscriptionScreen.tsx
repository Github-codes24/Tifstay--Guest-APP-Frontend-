import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import colors from "@/constants/colors";

type ServiceType = "tiffin" | "hostel";
type MealType = "breakfast" | "lunch" | "dinner";

export default function ContinueSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.serviceType as ServiceType) || "tiffin";
  const serviceName = params.serviceName || "";
  const price = params.price || "";

  // Tiffin States
  const [numberOfTiffin, setNumberOfTiffin] = useState("4");
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("4");
  const [mealPreferences, setMealPreferences] = useState({
    breakfast: true,
    lunch: true,
    dinner: false,
  });
  const [foodType, setFoodType] = useState("veg");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [planType, setPlanType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Hostel States
  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<"work" | "leisure">("work");

  // Checkbox Component
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

  // Radio Button Component
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
    <TouchableOpacity style={styles.radioRow} onPress={() => onPress(value)}>
      <View style={styles.radioOuter}>
        {selected === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    if (serviceType === "tiffin") {
      console.log("Tiffin subscription renewed:", {
        numberOfTiffin,
        selectTiffinNumber,
        mealPreferences,
        foodType,
        orderType,
        planType,
        selectedDate,
      });
    } else {
      console.log("Hostel subscription renewed:", {
        hostelPlan,
        checkInDate,
        checkOutDate,
        purposeType,
        message,
      });
    }
    // Navigate to checkout or confirmation
    router.push("/");
  };

  const onChangeTiffinDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setSelectedDate(selectedDate);
  };

  const onChangeCheckInDate = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === "ios");
    if (selectedDate) setCheckInDate(selectedDate);
  };

  const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === "ios");
    if (selectedDate) setCheckOutDate(selectedDate);
  };

  const toggleMealPreference = (meal: MealType) => {
    setMealPreferences((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  // Tiffin Subscription Form
  const renderTiffinForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Booking Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Booking Details</Text>

        <Text style={styles.label}>Number Of Tiffin</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setNumberOfTiffin}
            items={[
              { label: "1", value: "1" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
              { label: "4", value: "4" },
              { label: "5", value: "5" },
              { label: "6", value: "6" },
            ]}
            placeholder={{ label: "Select number", value: null }}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
            }}
            value={numberOfTiffin}
          />
        </View>

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

        {/* Meal Preferences */}
        <Text style={styles.subSectionTitle}>Meal Preference</Text>
        {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
          <View style={styles.checkboxRow} key={meal}>
            <Checkbox
              checked={mealPreferences[meal]}
              onPress={() => toggleMealPreference(meal)}
            />
            <Text style={styles.checkboxLabel}>
              {meal === "breakfast" && "Breakfast (7:00 AM - 9:00 AM)"}
              {meal === "lunch" && "Lunch (12:00 PM - 2:00 PM)"}
              {meal === "dinner" && "Dinner (8:00 PM - 10:00 PM)"}
            </Text>
          </View>
        ))}

        {/* Food Type */}
        <Text style={styles.subSectionTitle}>Food Type</Text>
        <RadioButton
          label="Veg"
          value="veg"
          selected={foodType}
          onPress={setFoodType}
        />
        <RadioButton
          label="Non-Veg"
          value="nonveg"
          selected={foodType}
          onPress={setFoodType}
        />
        <RadioButton
          label="Both Veg & Non-Veg"
          value="both"
          selected={foodType}
          onPress={setFoodType}
        />

        {/* Order Type */}
        <Text style={styles.subSectionTitle}>Choose Order Type</Text>
        <RadioButton
          label="Dining"
          value="dining"
          selected={orderType}
          onPress={(value) => setOrderType(value as "dining" | "delivery")}
        />
        <RadioButton
          label="Delivery"
          value="delivery"
          selected={orderType}
          onPress={(value) => setOrderType(value as "dining" | "delivery")}
        />

        {/* Plan Type */}
        <Text style={styles.subSectionTitle}>Choose Plan Type</Text>
        <RadioButton
          label="Daily (₹120/meal) - Save 10%"
          value="daily"
          selected={planType}
          onPress={setPlanType}
        />
        <RadioButton
          label="Weekly (₹800/week) - Save 15%"
          value="weekly"
          selected={planType}
          onPress={setPlanType}
        />
        <RadioButton
          label="Monthly (₹3200/month) - Save 20%"
          value="monthly"
          selected={planType}
          onPress={setPlanType}
        />

        {/* Select Date */}
        <Text style={styles.subSectionTitle}>Select Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {selectedDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeTiffinDate}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.serviceName}>
          {serviceName || "Maharashtrian Ghar Ka Khana"}
        </Text>
        <Text style={styles.priceText}>Price: ₹120/meal</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Booking Request</Text>
      </TouchableOpacity>

      <Text style={styles.confirmationText}>
        Provider will reach out within 1 hour to confirm.
      </Text>
    </ScrollView>
  );

  // Hostel Subscription Form
  const renderHostelForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Hostel Details */}
      <View style={styles.section}>
        <Text style={styles.hostelName}>
          {serviceName || "Scholars Den Boys Hostel"}
        </Text>

        <Text style={styles.label}>Select Plan</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setHostelPlan}
            items={[
              { label: "Monthly", value: "monthly" },
              { label: "Quarterly", value: "quarterly" },
              { label: "Half Yearly", value: "halfyearly" },
              { label: "Yearly", value: "yearly" },
            ]}
            placeholder={{ label: "Select Plan", value: null }}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
            }}
            value={hostelPlan}
          />
        </View>

        <Text style={styles.priceText}>{price || "₹8000/month"}</Text>
      </View>

      {/* Booking Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Booking Details</Text>

        <Text style={styles.label}>Check-in date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkInDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Check-out date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkOutDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>

        {showCheckInPicker && (
          <DateTimePicker
            value={checkInDate}
            mode="date"
            display="default"
            onChange={onChangeCheckInDate}
            minimumDate={new Date()}
          />
        )}

        {showCheckOutPicker && (
          <DateTimePicker
            value={checkOutDate}
            mode="date"
            display="default"
            onChange={onChangeCheckOutDate}
            minimumDate={checkInDate}
          />
        )}

        <Text style={[styles.label, { marginTop: 15 }]}>
          Message (Optional)
        </Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Enter your complete delivery address with landmarks"
          multiline
          value={message}
          onChangeText={setMessage}
        />

        {/* Purpose Toggle */}
        <View style={styles.purposeContainer}>
          <TouchableOpacity
            style={[
              styles.purposeButton,
              purposeType === "work" && styles.purposeButtonActive,
            ]}
            onPress={() => setPurposeType("work")}
          >
            <Text
              style={[
                styles.purposeText,
                purposeType === "work" && styles.purposeTextActive,
              ]}
            >
              Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.purposeButton,
              purposeType === "leisure" && styles.purposeButtonActive,
            ]}
            onPress={() => setPurposeType("leisure")}
          >
            <Text
              style={[
                styles.purposeText,
                purposeType === "leisure" && styles.purposeTextActive,
              ]}
            >
              Leisure
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Check Out Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Check Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Continue Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {serviceType === "tiffin" ? renderTiffinForm() : renderHostelForm()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
    color: "#000",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  pickerInput: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: "#374151",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  datePickerText: {
    fontSize: 14,
    color: "#000",
  },
  summarySection: {
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  purposeContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  purposeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  purposeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  purposeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  purposeTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
});
