import React, { useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import { calender, location1, person } from "@/assets/images";
import Header from "@/components/Header";
import Buttons from "@/components/Buttons";

type MealType = "breakfast" | "lunch" | "dinner";
type BookingType = "tiffin" | "hostel";

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingType = (params.bookingType as BookingType) || "tiffin";

  const serviceData = {
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    price: params.price,
    // For Hostel
    hostelId: params.hostelId,
    hostelName: params.hostelName,
    monthlyPrice: params.monthlyPrice,
    deposit: params.deposit,
  };

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [numberOfTiffin, setNumberOfTiffin] = useState("4");
  const [selectTiffinNumber, setSelectTiffinNumber] = useState("4");
  const [selectedPlan, setSelectedPlan] = useState("daily");
  const [selectedfood, setSelectedfood] = useState("veg");
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
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [hostelPlan, setHostelPlan] = useState("monthly");
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [purposeType, setPurposeType] = useState<"work" | "leisure">("work");
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");

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

  const onChangeCheckInDate = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === "ios");
    if (selectedDate) setCheckInDate(selectedDate);
  };

  const onChangeCheckOutDate = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === "ios");
    if (selectedDate) setCheckOutDate(selectedDate);
  };

  const handleBack = () => {
    router.back();
  };

  const handleTiffinSubmit = () => {
    const bookingData = {
      serviceType: "tiffin",
      fullName,
      phoneNumber,
      address,
      numberOfTiffin,
      selectedPlan,
      mealPreferences,
      orderType,
      serviceName: serviceData.serviceName || "Maharashtrian Ghar Ka Khana",
      price: serviceData.price || "₹120",
      serviceId: serviceData.serviceId,
    };

    console.log("Tiffin order submitted", bookingData);

    router.push({
      pathname: "/check-out",
      params: {
        serviceType: "tiffin",
        bookingData: JSON.stringify(bookingData),
      },
    });
  };

  const handleHostelSubmit = () => {
    const bookingData = {
      serviceType: "hostel",
      fullName,
      phoneNumber,
      hostelPlan,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      purposeType,
      hostelName: serviceData.hostelName || "Scholars Den Boys Hostel",
      monthlyPrice: serviceData.monthlyPrice || "₹8000/month",
      deposit: serviceData.deposit || "₹15000",
      hostelId: serviceData.hostelId,
    };

    console.log("Hostel booking submitted", bookingData);

    router.push({
      pathname: "/check-out",
      params: {
        serviceType: "hostel",
        bookingData: JSON.stringify(bookingData),
      },
    });
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
    <TouchableOpacity style={styles.radioRow} onPress={() => onPress(value)}>
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
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            {serviceData.monthlyPrice || "₹8000/month"}
          </Text>
          <Text style={styles.depositText}>
            Deposit: {serviceData.deposit || "₹15000"}
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
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Aadhaar Card Photo</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload photo</Text>
          <Text style={styles.uploadSubtext}>
            Upload clear photo of your Aadhaar card
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Your Photo</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload photo</Text>
          <Text style={styles.uploadSubtext}>
            Upload clear photo of your selfie or photo from gallery
          </Text>
        </TouchableOpacity>
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
          <Image source={calender} style={styles.calendarIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Check-out date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {checkOutDate.toLocaleDateString()}
          </Text>
          <Image source={calender} style={styles.calendarIcon} />
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

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleHostelSubmit}
      >
        <Text style={styles.submitButtonText}>Book Now</Text>
      </TouchableOpacity>
    </>
  );

  const renderTiffinBooking = () => (
    <ScrollView>
      {/* Personal Info */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row" }}>
          <Image source={person} style={styles.icon} />
          <Text style={styles.sectionTitle}> Personal Information</Text>
        </View>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row" }}>
          <Image source={location1} style={styles.icon} />
          <Text style={styles.sectionTitle}> Delivery Address</Text>
        </View>
        <Text style={styles.label}>Select Address</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setAddress}
            items={[
              { label: "Home Address", value: "home" },
              { label: "Office Address", value: "office" },
              { label: "Other", value: "other" },
            ]}
            placeholder={{ label: "Home Address", value: null }}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
            }}
            value={address}
            disabled={orderType === "dining"}
          />
        </View>
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

      {/* Booking Details */}
      <View style={styles.section}>
        <View style={{ flexDirection: "row" }}>
          <Image source={calender} style={styles.icon} />
          <Text style={styles.sectionTitle}> Booking Details</Text>
        </View>
        <Text style={styles.label}>Number Of Tiffin</Text>
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

        {/* Apply Preferences */}
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

        {/* Meal Preferences */}
        <Text style={[styles.sectionTitle]}>Meal Preference</Text>
        {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
          <View style={styles.checkboxRow} key={meal}>
            <Checkbox
              checked={mealPreferences[meal]}
              onPress={() => toggleMealPreference(meal)}
            />
            <Text style={styles.checkboxLabel}>
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </Text>
          </View>
        ))}

        {/* Food Type */}
        <Text style={[styles.sectionTitle]}>Food Type</Text>
        <RadioButton
          label="Veg"
          value="veg"
          selected={selectedfood}
          onPress={setSelectedfood}
        />
        <RadioButton
          label="Non-Veg"
          value="nonveg"
          selected={selectedfood}
          onPress={setSelectedfood}
        />
        <RadioButton
          label="Both"
          value="both"
          selected={selectedfood}
          onPress={setSelectedfood}
        />

        {/* Date Picker */}
        <Text style={[styles.sectionTitle]}>Select Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}

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

        {/* Plan Type */}
        <Text style={[styles.sectionTitle]}>Choose Plan Type</Text>
        {["daily", "weekly", "monthly"].map((plan) => (
          <RadioButton
            key={plan}
            label={plan.charAt(0).toUpperCase() + plan.slice(1)}
            value={plan}
            selected={selectedPlan}
            onPress={setSelectedPlan}
          />
        ))}
      </View>

      {/* Summary & Submit */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>
          {serviceData.serviceName || "Maharashtrian Ghar Ka Khana"}
        </Text>
        <Text style={styles.summaryPrice}>
          Total Price: {serviceData.price || "₹120"}
        </Text>
      </View>
      <Buttons
        style={styles.submitButton}
        title="Submit Order Request"
        onPress={handleTiffinSubmit}
      />
      <Text style={styles.confirmationText}>
        Provider will reach out within 1 hour to confirm.
      </Text>
    </ScrollView>
  );

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
    marginBottom: 15,
    fontSize: 14,
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
    marginBottom: 12,
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
    marginBottom: 15,
  },
  datePickerText: {
    fontSize: 14,
    color: "black",
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  summaryPrice: {
    fontSize: 14,
    color: "#004AAD",
    marginBottom: 15,
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
  // Hostel specific styles
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
    width: 20,
    height: 20,
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
});
