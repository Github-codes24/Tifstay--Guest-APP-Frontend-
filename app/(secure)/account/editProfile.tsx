import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import LabeledInput from "@/components/LabeledInput";
import CustomButton from "@/components/CustomButton";
import colors from "@/constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { calender } from "@/assets/images";


const EditProfile = () => {
  const [name, setName] = useState("Onil Karmokar");
  const [email, setEmail] = useState("maharashtrian@gmail.com");
  const [phone, setPhone] = useState("12.09.2008");
  const [accountNumber, setAccountNumber] = useState("98765432101");
  const [ifsc, setIfsc] = useState("SBIN0001234");
  const [accountType, setAccountType] = useState("Savings");
  const [accountHolder, setAccountHolder] = useState("Mahesh Pawar");

  const handleSave = () => {
    console.log("Saved!");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      <KeyboardAwareScrollView
        style={{ flex: 1, paddingHorizontal: 12, marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
      // keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // adjust this value
      >
        {/* Profile Header */}
        <View style={styles.profileContainer}>
          <Image source={require('../../../assets/images/user.png')} style={styles.profileImage} />
          <Text style={styles.headerTitle}>{name}</Text>
        </View>

        {/* Personal Details */}
        <View style={{ gap: 8 }}>
          <LabeledInput
            label="Name"
            value={name}
            onChangeText={setName}
            labelStyle={styles.label}
            containerStyle={{ marginTop: 20 }}
          />
          <LabeledInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            labelStyle={styles.label}
            containerStyle={{ marginTop: 20 }}
          />
          <LabeledInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            labelStyle={styles.label}
            containerStyle={{ marginTop: 20 }}
          />
        
<LabeledInput
  label="Date of Birth"
  value={phone}
  onChangeText={setPhone}
  keyboardType="phone-pad"
  labelStyle={styles.label}
  containerStyle={{ marginTop: 20 }}
 
/>
 {/* <Image source={calender} style={{ width: 20, height: 20, resizeMode: 'contain' }} /> */}



        </View>
        {/* Fixed Save Button */}
      </KeyboardAwareScrollView>
      <CustomButton title="Save" onPress={() => { }} style={{ width: '90%', alignSelf: 'center', marginVertical: 0 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 28
  },
  profileImage: {
    width: 86,
    height: 86,
    borderRadius: 50,
    marginBottom: 12,
  },
  label: {
    color: colors.title,
    fontSize: 14,
    // fontFamily: fonts.interSemibold,
    marginBottom: 8,
  },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});

export default EditProfile;
