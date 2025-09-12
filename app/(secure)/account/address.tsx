import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddressScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
      </View>
      <Text style={styles.locationLabel}>Location</Text>

      <View style={styles.card}>
        <Image source={require('../../../assets/images/home.png')} style={styles.image} resizeMode="contain" />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.address}>
            123 Main Street, Dharampeth, {"\n"}Nagpur - 440010
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            position: "absolute",
            right: 19,
            top: 19,
          }}
        >
          <TouchableOpacity onPress={() => { router.push('/') }}>
            <Image
              source={require("../../../assets/images/editicon.png")}
              style={styles.actionIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { }}>
            <Image
              source={require("../../../assets/images/delete.png")}
              style={styles.actionIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.card]}>
        <Image source={require('../../../assets/images/bag.png')} style={styles.image} resizeMode="contain" />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.address}>
            123 Main Street, Dharampeth, {"\n"}Nagpur - 440010
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            position: "absolute",
            right: 19,
            top: 19,
          }}
        >
          <TouchableOpacity onPress={() => { router.push('/account/editAddress') }}>
            <Image
              source={require("../../../assets/images/editicon.png")}
              style={styles.actionIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { }}>
            <Image
              source={require("../../../assets/images/delete.png")}
              style={styles.actionIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={{ textAlign: 'center', paddingVertical: 8, color: '#A5A5A5' }}>or</Text>
      <View style={[styles.card, { height: 77 }]}>
        <Image source={require('../../../assets/images/add.png')} style={styles.image} resizeMode="contain" />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Add a new address</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddressScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  locationLabel: {
    marginHorizontal: 16,
    fontSize: 14,
    // fontFamily: fonts.interSemibold,
  },
  card: {
    margin: 16,
    backgroundColor: "#F7F5FF",
    borderRadius: 12,
    height: 101,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    height: 52,
    width: 52,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontWeight: "700",
    color: "#9C9BA6",
    fontSize: 14,
  },
  address: {
    marginTop: 4,
    fontSize: 14,
    color: "#333",
  },
  actionIcon: {
    height: 20,
    width: 20,
    marginLeft: 10,
    // marginTop: -25,
  },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
});
