// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
//   Image,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { calender, location1, person } from "@/assets/images";

// type MealType = "breakfast" | "lunch" | "dinner";

// export default function BookTiffinScreen() {
//   const [fullName, setFullName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [address, setAddress] = useState("");
//   const [specialInstructions, setSpecialInstructions] = useState("");
//   const [numberOfTiffin, setNumberOfTiffin] = useState("4");
//   const [selectTiffinNumber, setSelectTiffinNumber] = useState("4");
//   const [selectedPlan, setSelectedPlan] = useState("daily");
//   const [selectedfood, setSelectedfood] = useState("veg");
//   const [orderType, setOrderType] = useState<"dining" | "delivery">("delivery");
//   const [mealPreferences, setMealPreferences] = useState({
//     breakfast: true,
//     lunch: true,
//     dinner: false,
//   });
//   const [sameAsSelections, setSameAsSelections] = useState({
//     sameForAll: false,
//     sameAs1: false,
//     sameAs2: false,
//     sameAs3: false,
//   });
//   const [date, setDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   const toggleMealPreference = (meal: MealType) => {
//     setMealPreferences((prev) => ({ ...prev, [meal]: !prev[meal] }));
//   };
//   const toggleSameAs = (key: keyof typeof sameAsSelections) => {
//     setSameAsSelections((prev) => ({ ...prev, [key]: !prev[key] }));
//   };
//   const onChangeDate = (event: any, selectedDate?: Date) => {
//     setShowDatePicker(Platform.OS === "ios");
//     if (selectedDate) setDate(selectedDate);
//   };

//   const Checkbox = ({
//     checked,
//     onPress,
//   }: {
//     checked: boolean;
//     onPress: () => void;
//   }) => (
//     <TouchableOpacity
//       style={[styles.checkboxBase, checked && styles.checkboxSelected]}
//       onPress={onPress}
//     >
//       {checked && <Text style={styles.checkMark}>✓</Text>}
//     </TouchableOpacity>
//   );
//   const RadioButton = ({
//     label,
//     value,
//     selected,
//     onPress,
//   }: {
//     label: string;
//     value: string;
//     selected: string;
//     onPress: (value: string) => void;
//   }) => (
//     <TouchableOpacity style={styles.radioRow} onPress={() => onPress(value)}>
//       <View style={styles.radioOuter}>
//         {selected === value && <View style={styles.radioInner} />}
//       </View>
//       <Text style={styles.radioLabel}>{label}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <TouchableOpacity style={styles.backButton}>
//         <Text style={styles.backButtonText}>{"‹"} Book Tiffin</Text>
//       </TouchableOpacity>

//       {/* Personal Info */}
//       <View style={styles.section}>
//         <View style={{ flexDirection: "row" }}>
//           <Image source={person} style={styles.icon} />
//           <Text style={styles.sectionTitle}> Personal Information</Text>
//         </View>
//         <Text style={styles.label}>Full Name *</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter your full name"
//           value={fullName}
//           onChangeText={setFullName}
//         />
//         <Text style={styles.label}>Phone Number *</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter your phone number"
//           keyboardType="phone-pad"
//           value={phoneNumber}
//           onChangeText={setPhoneNumber}
//         />
//       </View>

//       {/* Delivery Address */}
//       <View style={styles.section}>
//         <View style={{ flexDirection: "row" }}>
//           <Image source={location1} style={styles.icon} />
//           <Text style={styles.sectionTitle}> Delivery Address</Text>
//         </View>
//         <Text style={styles.label}>Select Address</Text>
//         <View style={styles.pickerWrapper}>
//           <RNPickerSelect
//             onValueChange={setAddress}
//             items={[
//               { label: "Home Address", value: "home" },
//               { label: "Office Address", value: "office" },
//               { label: "Other", value: "other" },
//             ]}
//             placeholder={{ label: "Home Address", value: null }}
//             style={{
//               inputIOS: styles.pickerInput,
//               inputAndroid: styles.pickerInput,
//             }}
//             value={address}
//             disabled={orderType === "dining"}
//           />
//         </View>
//         <Text style={styles.label}>Special Instructions (Optional)</Text>
//         <TextInput
//           style={[
//             styles.input,
//             { height: 80 },
//             orderType === "dining" && { backgroundColor: "#eee" },
//           ]}
//           placeholder="Any dietary preferences, spice level, or special requests"
//           multiline
//           value={specialInstructions}
//           onChangeText={setSpecialInstructions}
//           editable={orderType === "delivery"}
//         />
//       </View>

//       {/* Booking Details */}
//       <View style={styles.section}>
//         <View style={{ flexDirection: "row" }}>
//           <Image source={calender} style={styles.icon} />
//           <Text style={styles.sectionTitle}> Booking Details</Text>
//         </View>
//         <Text style={styles.label}>Number Of Tiffin</Text>
//         <TextInput
//           style={styles.input}
//           value={numberOfTiffin}
//           keyboardType="numeric"
//           onChangeText={setNumberOfTiffin}
//         />
//         <Text style={styles.label}>Select Tiffin Number</Text>
//         <View style={styles.pickerWrapper}>
//           <RNPickerSelect
//             onValueChange={setSelectTiffinNumber}
//             items={[
//               { label: "1", value: "1" },
//               { label: "2", value: "2" },
//               { label: "3", value: "3" },
//               { label: "4", value: "4" },
//             ]}
//             placeholder={{ label: "Select Tiffin Number", value: null }}
//             style={{
//               inputIOS: styles.pickerInput,
//               inputAndroid: styles.pickerInput,
//             }}
//             value={selectTiffinNumber}
//           />
//         </View>

//         {/* Apply Preferences */}
//         <Text style={[styles.sectionTitle]}>Apply Preferences</Text>
//         {Object.entries(sameAsSelections).map(([key, value]) => (
//           <View style={styles.checkboxRow} key={key}>
//             <Checkbox
//               checked={value}
//               onPress={() => toggleSameAs(key as keyof typeof sameAsSelections)}
//             />
//             <Text style={styles.checkboxLabel}>
//               {key === "sameForAll"
//                 ? "Same For All"
//                 : `Same As ${key.slice(-1)}`}
//             </Text>
//           </View>
//         ))}

//         {/* Meal Preferences */}
//         <Text style={[styles.sectionTitle]}>Meal Preference</Text>
//         {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
//           <View style={styles.checkboxRow} key={meal}>
//             <Checkbox
//               checked={mealPreferences[meal]}
//               onPress={() => toggleMealPreference(meal)}
//             />
//             <Text style={styles.checkboxLabel}>
//               {meal.charAt(0).toUpperCase() + meal.slice(1)}
//             </Text>
//           </View>
//         ))}

//         {/* Food Type */}
//         <Text style={[styles.sectionTitle]}>Food Type</Text>
//         <RadioButton
//           label="Veg"
//           value="veg"
//           selected={selectedfood}
//           onPress={setSelectedfood}
//         />
//         <RadioButton
//           label="Non-Veg"
//           value="nonveg"
//           selected={selectedfood}
//           onPress={setSelectedfood}
//         />
//         <RadioButton
//           label="Both"
//           value="both"
//           selected={selectedfood}
//           onPress={setSelectedfood}
//         />

//         {/* Date Picker */}
//         <Text style={[styles.sectionTitle]}>Select Date</Text>
//         <TouchableOpacity
//           style={styles.datePickerButton}
//           onPress={() => setShowDatePicker(true)}
//         >
//           <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
//         </TouchableOpacity>
//         {showDatePicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="default"
//             onChange={onChangeDate}
//             minimumDate={new Date()}
//           />
//         )}

//         {/* Order Type */}
//         <Text style={[styles.sectionTitle]}>Choose Order Type</Text>
//         {["dining", "delivery"].map((type) => (
//           <View style={styles.checkboxRow} key={type}>
//             <TouchableOpacity
//               style={[
//                 styles.checkboxBase,
//                 orderType === type && styles.checkboxSelected,
//               ]}
//               onPress={() => setOrderType(type as any)}
//             >
//               {orderType === type && <Text style={styles.checkMark}>✓</Text>}
//             </TouchableOpacity>
//             <Text style={styles.checkboxLabel}>
//               {type.charAt(0).toUpperCase() + type.slice(1)}
//             </Text>
//           </View>
//         ))}

//         {/* Plan Type */}
//         <Text style={[styles.sectionTitle]}> Choose Plan Type</Text>
//         {["daily", "weekly", "monthly"].map((plan) => (
//           <RadioButton
//             key={plan}
//             label={plan.charAt(0).toUpperCase() + plan.slice(1)}
//             value={plan}
//             selected={selectedPlan}
//             onPress={setSelectedPlan}
//           />
//         ))}
//       </View>

//       {/* Summary & Submit */}
//       <View style={styles.summaryBox}>
//         <Text style={styles.summaryTitle}>Maharashtrian Ghar Ka Khana</Text>
//         <Text style={styles.summaryPrice}>Total Price: ₹120</Text>
//       </View>
//       <TouchableOpacity style={styles.submitButton}>
//         <Text style={styles.submitButtonText}>Submit Order Request</Text>
//       </TouchableOpacity>
//       <Text style={styles.confirmationText}>
//         Provider will reach out within 1 hour to confirm.
//       </Text>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, backgroundColor: "#fff" },
//   backButton: { marginBottom: 20 },
//   backButtonText: { fontSize: 16, color: "#333" },
//   section: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 25,
//   },
//   sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
//   label: { fontSize: 14, marginBottom: 5, color: "#444", fontWeight: "bold" },
//   input: {
//     borderWidth: 1,
//     borderColor: "#aaa",
//     borderRadius: 6,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     marginBottom: 15,
//     fontSize: 14,
//   },
//   pickerWrapper: {
//     borderWidth: 1,
//     borderColor: "#aaa",
//     borderRadius: 6,
//     marginBottom: 15,
//   },
//   pickerInput: {
//     height: 51,
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     fontSize: 14,
//     color: "black",
//   },

//   checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
//   checkboxLabel: { fontSize: 14 },
//   icon: { height: 18, width: 16 },
//   checkboxBase: {
//     width: 24,
//     height: 24,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: "#ccc",
//     backgroundColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 8,
//   },
//   checkboxSelected: { backgroundColor: "#FF6600", borderColor: "#FF6600" },
//   checkMark: { color: "white", fontWeight: "bold", fontSize: 16 },
//   radioRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   radioOuter: {
//     height: 20,
//     width: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#004AAD",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 10,
//   },
//   radioInner: {
//     height: 10,
//     width: 10,
//     borderRadius: 5,
//     backgroundColor: "#004AAD",
//   },
//   radioLabel: { fontSize: 14, color: "#333" },
//   datePickerButton: {
//     borderWidth: 1,
//     borderColor: "#aaa",
//     borderRadius: 6,
//     paddingVertical: 12,
//     paddingHorizontal: 10,
//     justifyContent: "center",
//     marginBottom: 15,
//   },
//   datePickerText: { fontSize: 14, color: "black" },
//   summaryBox: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 10,
//     padding: 10,
//     marginBottom: 20,
//     backgroundColor: "#fff",
//   },
//   summaryTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
//   summaryPrice: { fontSize: 14, color: "#004AAD", marginBottom: 15 },
//   submitButton: {
//     backgroundColor: "#004AAD",
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     marginBottom: 10,
//   },
//   submitButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 16,
//     textAlign: "center",
//   },
//   confirmationText: { fontSize: 12, color: "#666", textAlign: "center" },
// });
