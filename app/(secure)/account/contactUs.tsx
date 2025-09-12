import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { router } from "expo-router";
import { call, chat1, mail2 } from "@/assets/images";
import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const ContactUs = () => {
  const handleCall = () => Linking.openURL("tel:5146014598");
  const handleEmail = () => Linking.openURL("mailto:contact@tifstay.com");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Service</Text>
      </View>
      {/* Sub text */}
      <View style={styles.container}>
        <Text style={styles.subText}>
          Don’t hesitate to contact us whether you have a suggestion on our
          improvement, a complain to discuss or an issue to solve.
        </Text>

        {/* Cards */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.card, { flex: 1 }]} onPress={handleCall}>
            <View style={styles.iconBox}>
              <Image source={call} style={{ width: 20, height: 20, tintColor: 'white' }} />
            </View>
            <Text style={styles.cardText}>514-601-4598</Text>
            <Text style={styles.cardTitle}>Call us</Text>
            <Text style={styles.cardFooter}>Our team is on the line{"\n"}Mon-Fri • 9-17</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { flex: 1 }]} onPress={handleEmail}>
            <View style={styles.iconBox}>
              <Image source={mail2} style={{ width: 20, height: 20, tintColor: colors.white }} />
            </View>
            <Text style={styles.cardText}>contact@tifstay.com</Text>
            <Text style={styles.cardTitle}>Email us</Text>
            <Text style={styles.cardFooter}>Our team is online{"\n"}Mon-Fri • 9-17</Text>
          </TouchableOpacity>

        </View>
        <TouchableOpacity style={[styles.card, { alignSelf: "center" }]} onPress={() => { router.push('/account/chatScreen') }}>
          <View style={styles.iconBox}>
            <Image source={chat1} style={{ width: 20, height: 20, tintColor: colors.white }} />
          </View>
          <Text style={styles.cardText}>Chat Support</Text>
          <Text style={styles.cardTitle}>Chat With Admin</Text>
          <Text style={styles.cardFooter}>Our team is on the line{"\n"}Mon-Fri • 9-17</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ContactUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  subText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f7f5ff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 5,
  },
  iconBox: {
    backgroundColor: "#1E40AF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 13,
    color: colors.grey,
    textAlign: "center",
    marginBottom: 4,
    // fontFamily:fonts.interRegular,
    marginTop: 14
  },
  cardTitle: {
    fontSize: 16,
    // fontFamily:fonts.interMedium,
    color: colors.primary,
    marginBottom: 6,
    marginTop: 14
  },
  cardFooter: {
    fontSize: 13,
    color: colors.grey,
    // fontFamily:fonts.interRegular,
    textAlign: "center",
    lineHeight: 16,
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
});
