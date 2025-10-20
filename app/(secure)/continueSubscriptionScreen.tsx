import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import colors from "@/constants/colors";
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";
import { calender, location1, person } from "@/assets/images";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ServiceType = "tiffin" | "hostel";
type MealType = "breakfast" | "lunch" | "dinner";

export default function ContinueSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.serviceType as ServiceType) || "tiffin";

  const serviceName = params.serviceName || "";
  const price = params.price || "";
  const serviceId = params.serviceId || "";

  // Tiffin-specific states
  const [numberOfTiffin, setNumberOfTiffin] = useState("1");
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("1");
  const [selectedfood, setSelectedfood] = useState("Both");
  const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
  const [mealPreferences, setMealPreferences] = useState({
    breakfast: true,
    lunch: true,
    dinner: false,
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
  const [selectedPlanType, setSelectedPlanType] = useState("perMeal");
  const [selectedMealsSummary, setSelectedMealsSummary] = useState("");
  const [fetchedPlanType, setFetchedPlanType] = useState("");
  const [fetchedPricing, setFetchedPricing] = useState({
    perBreakfast: 0,
    perMeal: 0,
    weekly: 0,
    monthly: 0,
    offers: "",
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [planError, setPlanError] = useState("");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<
    "work" | "leisure" | "student"
  >("work");

  const [token, setToken] = useState<string | null>(null);

  // Hostel-specific states
  const [hostelPlanTypes, setHostelPlanTypes] = useState<
    { label: string; value: string }[]
  >([]);
  const [isFetchingHostelPlans, setIsFetchingHostelPlans] = useState(false);

  // Fetch token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const tok = await AsyncStorage.getItem("token");
      // console.log("token", tok);
      setToken(tok);
    };
    fetchToken();
  }, []);

  // Fetch hostel plan types after token is available
  useEffect(() => {
    if (token && serviceType === "hostel") {
      fetchHostelPlanTypes();
    }
  }, [token, serviceType]);

  const fetchHostelPlanTypes = async () => {
    if (!token) return;
    setIsFetchingHostelPlans(true);
    try {
      const response = await axios.get(
        "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPlanTypes",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        const items = response.data.data.map((plan: string) => ({
          label: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase(),
          value: plan.toLowerCase(),
        }));
        setHostelPlanTypes(items);
      }
    } catch (error) {
      console.error("Failed to fetch hostel plan types:", error);
      // Fallback to hardcoded if fetch fails
      setHostelPlanTypes([
        { label: "Monthly", value: "monthly" },
        { label: "Quarterly", value: "quarterly" },
        { label: "Half Yearly", value: "halfyearly" },
        { label: "Yearly", value: "yearly" },
      ]);
    } finally {
      setIsFetchingHostelPlans(false);
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
      {checked && <Text style={styles.checkMark}>✔</Text>}
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
        selectedfood,
        orderType,
        selectedPlanType,
        date,
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
    // router.push("/check-out");
  };

  // Auto-set meal preferences based on selected plan type
  useEffect(() => {
    if (selectedPlanType) {
      let prefs = { breakfast: false, lunch: false, dinner: false };
      if (selectedPlanType === "perBreakfast") {
        prefs.breakfast = true;
      } else if (selectedPlanType === "perMeal") {
        prefs.lunch = true;
      } else if (
        selectedPlanType === "weekly" ||
        selectedPlanType === "monthly"
      ) {
        prefs = { breakfast: true, lunch: true, dinner: true };
      }
      setMealPreferences(prefs);
      const selectedMeals = Object.entries(prefs)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
      setSelectedMealsSummary(selectedMeals.join(", "));
    }
  }, [selectedPlanType]);

  // Auto-fill end date based on start date and plan type
  useEffect(() => {
    if (date && ["weekly", "monthly"].includes(selectedPlanType)) {
      let daysToAdd = 0;
      if (selectedPlanType === "weekly") {
        daysToAdd = 7;
      } else if (selectedPlanType === "monthly") {
        daysToAdd = 30;
      }
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
    } else if (!["weekly", "monthly"].includes(selectedPlanType)) {
      setEndDate(null);
    }
  }, [date, selectedPlanType]);

  // Update price based on selections
  useEffect(() => {
    let newPrice = 0;
    if (selectedPlanType) {
      let basePrice = 0;
      const pricingKey = selectedPlanType as keyof typeof fetchedPricing;
      if (fetchedPricing && fetchedPricing[pricingKey] > 0) {
        basePrice = fetchedPricing[pricingKey];
      } else {
        if (selectedPlanType === "perBreakfast") {
          basePrice = 120;
        } else if (selectedPlanType === "perMeal") {
          basePrice = 120;
        } else if (selectedPlanType === "weekly") {
          basePrice = 800;
        } else if (selectedPlanType === "monthly") {
          basePrice = 3200;
        }
      }
      const numTiffins = parseInt(numberOfTiffin || "1");
      newPrice = basePrice * numTiffins;
    }
    setCurrentPlanPrice(newPrice);
  }, [selectedPlanType, numberOfTiffin, fetchedPricing]);

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
    if (selectedDate) setCheckInDate(selectedDate);
  };

  const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === "ios");
    if (selectedDate) setCheckOutDate(selectedDate);
  };

  const toggleMealPreference = (meal: MealType) => {
    setMealPreferences((prev) => {
      const newPrefs = { ...prev, [meal]: !prev[meal] };
      const selectedMeals = Object.entries(newPrefs)
        .filter(([_, checked]) => checked)
        .map(([meal]) => meal.charAt(0).toUpperCase() + meal.slice(1));
      setSelectedMealsSummary(selectedMeals.join(", "));
      return newPrefs;
    });
  };

  const toggleSameAs = (key: keyof typeof sameAsSelections) => {
    setSameAsSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGetPlanDetails = async () => {
    const selectedMeals: string[] = [];
    if (mealPreferences.breakfast) selectedMeals.push("Breakfast");
    if (mealPreferences.lunch) selectedMeals.push("Lunch");
    if (mealPreferences.dinner) selectedMeals.push("Dinner");
    const mealPrefStr = selectedMeals.join(",");
    if (mealPrefStr === "") {
      setPlanError("Please select at least one meal preference.");
      return;
    }

    let foodTypeStr = "";
    if (selectedfood === "Veg") foodTypeStr = "Veg";
    else if (selectedfood === "Non-Veg") foodTypeStr = "Non-Veg";
    else if (selectedfood === "Both") foodTypeStr = "Both Veg & Non-Veg";

    const orderTypeStr = orderType.charAt(0).toUpperCase() + orderType.slice(1);

    if (!token) {
      setPlanError("Authentication required.");
      return;
    }

    if (!serviceId) {
      setPlanError("Service ID not available.");
      return;
    }

    setIsFetchingDetails(true);
    setPlanError("");
    try {
      const queryParams = new URLSearchParams({
        mealPreference: mealPrefStr,
        foodType: foodTypeStr,
        orderType: orderTypeStr,
      });

      const url = `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getPlanDetailsById/${serviceId}?${queryParams.toString()}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        setFetchedPlanType(data.planType);
        setFetchedPricing({
          perBreakfast: data.pricing.perBreakfast || 0,
          perMeal: data.pricing.perMeal || 0,
          weekly: data.pricing.weekly || 0,
          monthly: data.pricing.monthly || 0,
          offers: data.offers || "",
        });
        const totalPricing =
          (data.pricing.perBreakfast || 0) +
          (data.pricing.perMeal || 0) +
          (data.pricing.weekly || 0) +
          (data.pricing.monthly || 0);
        if (totalPricing === 0) {
          setPlanError(
            "No plans available for your selected preferences. Please try different options."
          );
        } else {
          setPlanError("");
        }
      } else {
        setPlanError("Failed to fetch plan details: " + response.data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPlanError(
          "Failed to fetch plan details: " +
            (error.response?.data?.message || "Network error")
        );
      } else {
        setPlanError("Failed to fetch plan details.");
      }
    } finally {
      setIsFetchingDetails(false);
    }
  };

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
      options.push({
        label: `Per Breakfast (₹${fetchedPricing.perBreakfast} / per breakfast)`,
        value: "perBreakfast",
      });
    }
    if (fetchedPricing.perMeal > 0) {
      options.push({
        label: `Per Meal (₹${fetchedPricing.perMeal}/meal)`,
        value: "perMeal",
      });
    }
    if (fetchedPricing.weekly > 0) {
      options.push({
        label: `Weekly (₹${fetchedPricing.weekly}/weekly)`,
        value: "weekly",
      });
    }
    if (fetchedPricing.monthly > 0) {
      options.push({
        label: `Monthly (₹${fetchedPricing.monthly}/monthly)`,
        value: "monthly",
      });
    }
    if (options.length === 0) {
      return hardcodedPlanOptions;
    }
    return options;
  };

  const renderTiffinForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* <Text style={[styles.subSectionTitle]}>Apply Preferences</Text> */}
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
        {selectedMealsSummary && (
          <Text
            style={[
              styles.label,
              { fontSize: 12, color: "#666", marginTop: 5 },
            ]}
          >
            Selected: {selectedMealsSummary}
          </Text>
        )}

        <Text style={styles.subSectionTitle}>Food Type</Text>
        <RadioButton
          label="Veg"
          value="Veg"
          selected={selectedfood}
          onPress={setSelectedfood}
        />
        <RadioButton
          label="Non-Veg"
          value="Non-Veg"
          selected={selectedfood}
          onPress={setSelectedfood}
        />
        <RadioButton
          label="Both Veg & Non-Veg"
          value="Both"
          selected={selectedfood}
          onPress={setSelectedfood}
        />

        <Text style={styles.subSectionTitle}>Choose Order Type</Text>
        {["dining", "delivery"].map((type) => (
          <View style={styles.checkboxRow} key={type}>
            <TouchableOpacity
              style={[
                styles.checkboxBase,
                orderType === type && styles.checkboxSelected,
              ]}
              onPress={() => setOrderType(type as "dining" | "delivery")}
            >
              {orderType === type && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        ))}

        <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
          Get Plan Details
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (Object.values(mealPreferences).filter(Boolean).length === 0 ||
              isFetchingDetails) &&
              styles.disabledButton,
          ]}
          onPress={handleGetPlanDetails}
          disabled={
            Object.values(mealPreferences).filter(Boolean).length === 0 ||
            isFetchingDetails
          }
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

        <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>
          Choose Plan Type
        </Text>
        {getPlanOptions().map((option) => (
          <RadioButton
            key={option.value}
            label={option.label}
            value={option.value}
            selected={selectedPlanType}
            onPress={setSelectedPlanType}
          />
        ))}

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{currentPlanPrice}</Text>
          <Text style={styles.depositText}>No Deposit</Text>
        </View>

        <Text style={styles.label}>Select Start Date *</Text>
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

        {["weekly", "monthly"].includes(selectedPlanType) && (
          <>
            <Text style={styles.label}>Select End Date *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {endDate ? endDate.toLocaleDateString("en-US") : "mm/dd/yyyy"}
              </Text>
              <Image source={calender} style={styles.calendarIcon} />
            </TouchableOpacity>
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

      <View style={styles.summarySection}>
        <Text style={styles.serviceName}>
          {serviceName || "Maharashtrian Ghar Ka Khana"}
        </Text>
        <Text style={styles.priceText}>Price: ₹120/meal</Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Booking Request</Text>
      </TouchableOpacity>

      <Text style={styles.confirmationText}>
        Provider will reach out within 1 hour to confirm.
      </Text>
    </ScrollView>
  );

  const renderHostelForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.hostelName}>
          {serviceName || "Scholars Den Boys Hostel"}
        </Text>

        <Text style={styles.label}>Select Plan</Text>
        <View style={styles.pickerWrapper}>
          {isFetchingHostelPlans ? (
            <ActivityIndicator
              size="small"
              color="#666"
              style={{ padding: 12 }}
            />
          ) : (
            <RNPickerSelect
              onValueChange={setHostelPlan}
              items={hostelPlanTypes}
              placeholder={{ label: "Select Plan", value: null }}
              style={{
                inputIOS: styles.pickerInput,
                inputAndroid: styles.pickerInput,
              }}
              value={hostelPlan}
            />
          )}
        </View>

        <Text style={styles.priceText}>{price || "₹8000/month"}</Text>
      </View>

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

        <Text style={styles.subSectionTitle}>User Stay Type</Text>
        <View style={styles.purposeContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPurposeType("work")}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {purposeType === "work" && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioText}>Work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPurposeType("leisure")}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {purposeType === "leisure" && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioText}>Leisure</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPurposeType("student")}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {purposeType === "student" && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioText}>Student</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Buttons
        title="Check Out"
        onPress={handleSubmit}
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title="Continue Subscription"
        onBack={handleBack}
        showBackButton={true}
      />
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkMark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
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
    width: "100%",
    marginTop: 20,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#ccc",
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
    marginTop: 16,
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  icon: {
    height: 18,
    width: 16,
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  depositText: {
    fontSize: 14,
    color: "#666",
  },
  calendarIcon: {
    width: 17,
    height: 17,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "left",
  },
  offersText: {
    fontSize: 14,
    color: "#FF6600",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
});
