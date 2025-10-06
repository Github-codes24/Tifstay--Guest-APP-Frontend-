import React, { useState, useEffect, useRef } from "react";
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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MealType = "breakfast" | "lunch" | "dinner";
type BookingType = "tiffin" | "hostel";

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log("BookingScreen params:", params);
  const bookingType = (params.bookingType as BookingType) || "tiffin";
  console.log("bookingType:", bookingType);

  // Extract primitive strings for stable dependencies
  const hostelDataStr = params.hostelData || '{}';
  const roomDataStr = params.roomData || '{}';
  const userDataStr = params.userData || '{}';
  const planStr = params.plan || '{}';
  const selectedBedsStr = params.selectedBeds || '[]';
  const checkInDateStr = params.checkInDate || '';
  const checkOutDateStr = params.checkOutDate || '';

  const [serviceData, setServiceData] = useState({
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    price: params.price,
    hostelId: params.hostelId,
    hostelName: params.hostelName,
    monthlyPrice: params.monthlyPrice,
    deposit: params.deposit,
    roomId: params.roomId,
    roomNumber: params.roomNumber,
    beds: params.beds ? JSON.parse(params.beds as string) : [],
    defaultPlan: params.defaultPlan,
    defaultPrice: params.defaultPrice,
    defaultDeposit: params.defaultDeposit,
    email: params.email,
    workType: params.workType,
    adharCardPhoto: params.adharCardPhoto,
    userPhoto: params.userPhoto,
  });

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

  const ranAutofill = useRef(false);

useEffect(() => {
  console.log("=== Autofill useEffect triggered ===");
  console.log("bookingType:", bookingType);

  const isHostelBooking = bookingType === "hostel" || bookingType === "reserve";
  if (isHostelBooking && !ranAutofill.current) {
    ranAutofill.current = true;
    try {
      const parsedHostelData = JSON.parse(hostelDataStr);
      const parsedRoomData = JSON.parse(roomDataStr);
      const parsedUserData = JSON.parse(userDataStr);
      const parsedPlan = JSON.parse(planStr);
      const parsedSelectedBeds = JSON.parse(selectedBedsStr);

      console.log("Parsed Hostel Data:", parsedHostelData);
      console.log("Parsed Room Data:", parsedRoomData);
      console.log("Parsed User Data:", parsedUserData);
      console.log("Parsed Plan:", parsedPlan);
      console.log("Parsed Selected Beds:", parsedSelectedBeds);

      // Update serviceData with minimal data (no bed enrichment needed)
      setServiceData(prev => ({
        ...prev,
        hostelId: parsedHostelData.id,
        hostelName: parsedHostelData.name || prev.hostelName, // For UI
        roomId: parsedRoomData._id,
        roomNumber: parsedRoomData.roomNumber,
        beds: parsedSelectedBeds, // Minimal: [{bedId, bedNumber}]
        monthlyPrice: parsedPlan.price,
        deposit: parsedPlan.depositAmount,
        email: parsedUserData.email || prev.email,
        workType: parsedUserData.workType || prev.workType,
        adharCardPhoto: parsedUserData.adharCardPhoto || prev.adharCardPhoto,
        userPhoto: parsedUserData.userPhoto || prev.userPhoto,
      }));

      console.log("Extracted Hostel ID:", parsedHostelData.id);
      console.log("Extracted Room ID:", parsedRoomData._id);

      // Autofill other fields (unchanged)
      setFullName(parsedUserData.name || '');
      setPhoneNumber(parsedUserData.phoneNumber || '');
      setHostelPlan(parsedPlan.name || "monthly");
      setAadhaarPhoto(parsedUserData.adharCardPhoto || "");
      setUserPhoto(parsedUserData.userPhoto || "");
      setCheckInDate(new Date(checkInDateStr || Date.now()));
      setCheckOutDate(new Date(checkOutDateStr || Date.now()));
      const workType = parsedUserData.workType || "Student";
      setPurposeType(workType === "Student" ? "leisure" : "work");

      console.log("Autofill completed");
    } catch (error) {
      console.error("Error parsing params for autofill:", error);
    }
  }
}, [bookingType, hostelDataStr, roomDataStr, userDataStr, planStr, selectedBedsStr, checkInDateStr, checkOutDateStr]);


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
    // Check for missing fields
    console.log("=== Tiffin Submit Debug ===");
    console.log("fullName:", fullName);
    console.log("phoneNumber:", phoneNumber);
    console.log("address:", address);
    console.log("numberOfTiffin:", numberOfTiffin);
    console.log("selectedPlan:", selectedPlan);
    console.log("mealPreferences:", mealPreferences);
    console.log("orderType:", orderType);
    console.log("serviceData:", serviceData);

    if (!fullName) {
      console.error("Error: Full Name is missing!");
      alert("Full Name is required!");
      return;
    }
    if (!phoneNumber) {
      console.error("Error: Phone Number is missing!");
      alert("Phone Number is required!");
      return;
    }
    if (orderType === "delivery" && !address) {
      console.error("Error: Address is missing for delivery!");
      alert("Address is required for delivery!");
      return;
    }
    if (!numberOfTiffin || parseInt(numberOfTiffin) <= 0) {
      console.error("Error: Number of Tiffin is invalid!");
      alert("Valid Number of Tiffin is required!");
      return;
    }

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
    console.log("Navigating to checkout with params:", {
      serviceType: "tiffin",
      bookingData: JSON.stringify(bookingData),
    });

    router.push({
      pathname: "/check-out",
      params: {
        serviceType: "tiffin",
        bookingData: JSON.stringify(bookingData),
      },
    });
  };

const handleHostelSubmit = async () => {
  console.log("=== Hostel Submit Debug ===");
  console.log("serviceData:", serviceData);
  console.log("hostelPlan:", hostelPlan);
  console.log("fullName:", fullName);
  console.log("phoneNumber:", phoneNumber);
  console.log("checkInDate:", checkInDate);
  console.log("checkOutDate:", checkOutDate);
  console.log("purposeType:", purposeType);
  console.log("aadhaarPhoto:", aadhaarPhoto);
  console.log("userPhoto:", userPhoto);
  console.log("beds:", serviceData.beds);

  try {
    if (!serviceData.hostelId || !serviceData.roomId) {
      console.error("Error: Hostel ID or Room ID is missing!");
      console.log("hostelId:", serviceData.hostelId);
      console.log("roomId:", serviceData.roomId);
      alert("Hostel ID or Room ID is missing!");
      return;
    }

    if (!fullName) {
      console.error("Error: Full Name is missing!");
      alert("Full Name is required!");
      return;
    }
    if (!phoneNumber) {
      console.error("Error: Phone Number is missing!");
      alert("Phone Number is required!");
      return;
    }
    if (checkInDate >= checkOutDate) {
      console.error("Error: Invalid dates - Check-out must be after Check-in!");
      alert("Check-out date must be after Check-in date!");
      return;
    }

    if (!serviceData.beds || serviceData.beds.length === 0) {
      console.error("Error: No beds selected!");
      alert("Please select at least one bed!");
      return;
    }

    const token = await AsyncStorage.getItem("token");
    const guestId = await AsyncStorage.getItem("guestId");

    console.log("token:", token ? "Present" : "Missing");
    console.log("guestId:", guestId ? "Present" : "Missing");

    if (!token || !guestId) {
      console.error("Error: Authentication token or guest ID is missing!");
      alert("Authentication token or guest ID is missing!");
      return;
    }

    const selectPlan = [
      {
        name: hostelPlan,
        price: Number(serviceData.monthlyPrice) || 0,
        depositAmount: Number(serviceData.deposit) || 0,
      },
    ];

    // Minimal bedNumber: only bedId and bedNumber
    const bedNumber = serviceData.beds.map((bed: any) => ({
      bedId: bed.bedId,
      bedNumber: bed.bedNumber,
    }));

    // Minimal payload matching backend expectations
    const bookingPayload = {
      fullName,
      phoneNumber,
      email: serviceData.email || "example@example.com",
      workType: "10", // Matches success response (Student); map to "1" if purposeType === "work"
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      selectPlan,
      addharCardPhoto: aadhaarPhoto || null,
      userPhoto: userPhoto || null,
      guestId,
      rooms: [
        {
          roomId: serviceData.roomId,
          roomNumber: String(serviceData.roomNumber || ""), // e.g., "101"
          bedNumber, // Minimal array
        },
      ],
    };

    console.log("Full Booking Payload:", JSON.stringify(bookingPayload, null, 2));

    const response = await axios.post(
      `https://tifstay-project-be.onrender.com/api/guest/hostelServices/createHostelBooking/${serviceData.hostelId}?roomId=${serviceData.roomId}`,
      bookingPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("API Response:", response.data);

    if (response.data.success) {
      console.log("Booking successful:", response.data.data);
      // alert("Hostel booking created successfully!");

      const bookingId = response.data.data._id;

      console.log("Navigating to checkout with booking ID:", bookingId);

      router.push({
        pathname: "/check-out",
        params: {
          serviceType: "hostel",
          bookingId,
        },
      });
    } else {
      console.error("Booking failed:", response.data.message || "Unknown error");
      alert("Booking failed: " + (response.data.message || "Unknown error"));
    }
  } catch (error: any) {
    console.error("Error creating hostel booking:", error.response?.data || error.message);
    console.error("Full error object:", error);
    alert("Something went wrong while booking. Please try again.");
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
    <TouchableOpacity onPress={() => onPress(value)}>
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
            {serviceData.defaultPrice || serviceData.monthlyPrice || "₹8000/month"}
          </Text>
          <Text style={styles.depositText}>
            Deposit: {serviceData.defaultDeposit || serviceData.deposit || "₹15000"}
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
        {aadhaarPhoto ? (
          <Image source={{ uri: aadhaarPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
        ) : (
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload photo</Text>
            <Text style={styles.uploadSubtext}>
              Upload clear photo of your Aadhaar card
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Upload Your Photo</Text>
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={{ width: 100, height: 100, marginTop: 10 }} />
        ) : (
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload photo</Text>
            <Text style={styles.uploadSubtext}>
              Upload clear photo of your selfie or photo from gallery
            </Text>
          </TouchableOpacity>
        )}
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
          Special Instructions (Optional)
        </Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Any special requests or messages"
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <View style={styles.section}>
          <Text style={styles.label}>Purpose of Stay</Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {/* Work */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
              onPress={() => setPurposeType("work")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "work" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Work</Text>
            </TouchableOpacity>

            {/* Leisure */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => setPurposeType("leisure")}
            >
              <View style={styles.radioOuter}>
                {purposeType === "leisure" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Leisure</Text>
            </TouchableOpacity>
          </View>
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
    <>
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
    </>
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