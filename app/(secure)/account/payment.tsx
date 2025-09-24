// AddCardScreen.tsx
import CustomButton from "@/components/CustomButton";
import LabeledInput from "@/components/LabeledInput";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

const PLACEHOLDER_NUM = "**** **** **** ****";

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const AddCardScreen = () => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const displayNumber = useMemo(() => {
    const f = formatCardNumber(cardNumber);
    return f || '';
  }, [cardNumber]);

  const displayName = cardholderName || "Cardholder Name";
  const displayExpiry = expiry || "--/--";

  const handleSave = () => {
    // validate and continue
    // router.back();
  };

  // Form validation: Save enabled only if all fields are valid
  const isFormValid =
    cardNumber.replace(/\s/g, "").length >= 12 &&
    cardholderName.trim().length > 0 &&
    expiry.trim().length === 5 &&
    cvv.trim().length >= 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Card</Text>
      </View>

      {/* Orange card preview */}
      <View style={styles.previewWrap}>
        <View style={styles.cardPreview}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardNumber}>{displayNumber ? displayNumber : '**** **** **** ****'}</Text>
            {!isFormValid ? <Image
              source={require("../../../assets/images/chip.png")}
              style={{ width: 48, height: 32, resizeMode: "contain" }}
            /> : <Image
              source={require("../../../assets/images/visa.png")}
              style={{ width: 48, height: 48, resizeMode: "contain" }}
            />}
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardLabel}>Cardholder Name</Text>
              <Text style={styles.cardValue}>{displayName}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>Expiry Date</Text>
              <Text style={styles.cardValue}>{displayExpiry}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LabeledInput
          label="Card Number"
          placeholder={PLACEHOLDER_NUM}
          value={displayNumber}
          onChangeText={(t: string) => setCardNumber(t)}
          inputMode="numeric"
          containerStyle={styles.inputMargin}
          inputContainerStyle={styles.inputTall}
          labelStyle={styles.label}
          maxLength={19}
        />

        <View style={{ marginTop: 20 }}>
          <LabeledInput
            label="Cardholder Name"
            placeholder="Enter Cardholder Name"
            value={cardholderName}
            onChangeText={setCardholderName}
            autoCapitalize="words"
            containerStyle={styles.inputMargin}
            inputContainerStyle={styles.inputTall}
            labelStyle={styles.label}
          />
        </View>

        <View style={styles.row}>
          <LabeledInput
            label="Expiry Date"
            placeholder="MM/YY"
            value={expiry}
            onChangeText={(t: string) => setExpiry(formatExpiry(t))}
            inputMode="numeric"
            containerStyle={styles.flexInput}
            inputContainerStyle={styles.input}
            labelStyle={styles.label}
            rightIconSource={require("../../../assets/images/calender.png")}
            maxLength={5}
          />
          <View style={{ width: 12 }} />
          <LabeledInput
            label="CVV / CVC"
            placeholder="Enter CVV"
            value={cvv}
            onChangeText={(t: string) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            containerStyle={styles.flexInput}
            inputContainerStyle={styles.input}
            labelStyle={styles.label}
            secureTextEntry
            maxLength={4}
          />
        </View>
        <CustomButton
          title="Save"
          onPress={handleSave}
          disabled={!isFormValid}
          style={[
            { width: "95%", alignSelf: "center", marginVertical: 40 },
            !isFormValid && { opacity: 0.5 },
          ]}
        />
      </KeyboardAwareScrollView>

    </SafeAreaView>
  );
};

export default AddCardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: "#000",
  },

  // Preview
  previewWrap: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  cardPreview: {
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: 20,
    height: 180,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardNumber: {
    color: "#fff",
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: "600",
    maxWidth: "78%",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Form
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  inputMargin: {
    marginTop: 20,
  },
  inputTall: {
    minHeight: 56,
  },
  input: {
    minHeight: 56,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.title,
  },
  row: {
    flexDirection: "row",
    marginTop: 28,
    alignItems: "flex-start",
  },
  flexInput: {
    flex: 1,
  },
});