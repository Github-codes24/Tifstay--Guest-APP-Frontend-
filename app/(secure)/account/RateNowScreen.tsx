import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RateNowScreen() {
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [review, setReview] = useState<string>("");

  const router = useRouter();
  const { serviceId, guestId, type } = useLocalSearchParams(); 
  /**
   * 📝 `type` me "hostel" ya "service" milega
   * 📝 `serviceId` me hostelId ya serviceId
   * 📝 `guestId` me guest ID (backend se handle hoga)
   */

  // Log received params
  console.log("Received params in RateNowScreen:", { serviceId, guestId, type });

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handlePost = async () => {
    if (!title.trim() || !review.trim() || rating === 0) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (!serviceId || !type) {
      Alert.alert("Error", "Service/Hostel ID or type is missing.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      // Common base URL
      const baseUrl = "https://tifstay-project-be.onrender.com/api/guest";
      
      let endpoint = "";
      if (type === "hostel") {
        endpoint = `/hostelServices/review/${serviceId}`; // Matches docs for hostel (:id = hostelId)
      } else if (type === "service") {
        endpoint = `/hostelServices/review/${serviceId}`; // Matches docs for service (:serviceId)
      } else {
        Alert.alert("Error", "Invalid service type.");
        return;
      }

      const url = `${baseUrl}${endpoint}`;

      // Debug log for serviceId
      console.log("Using serviceId:", serviceId);

      // Updated payload: Include 'type' to help backend distinguish and query correct model (hostel vs service)
      // This assumes backend updates to use req.body.type for finding the record
      const payload = {
        title: title.trim(),
        review: review.trim(),
        rating,
        type: type, 
        date: new Date().toISOString(),
      };

      console.log("Posting review with payload:", payload);
      console.log("To URL:", url);
      console.log("Review type:", type); // Extra log for debugging

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        Alert.alert("Success", "Review submitted successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit review.");
      }
    } catch (error: any) {
      console.log("Error in handlePost:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit review."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Now</Text>
        </View>

        {/* Score */}
        <Text style={styles.label}>
          Score<Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => handleRating(star)}>
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color="#FFB300"
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>
          Title<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder="Write here.."
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor="#A9A9A9"
        />

        {/* Review */}
        <Text style={styles.label}>
          Review<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder="Write here.."
          value={review}
          onChangeText={setReview}
          style={[styles.input, styles.textArea]}
          placeholderTextColor="#A9A9A9"
          multiline
        />

        {/* Buttons */}
        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postText}>Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: "600", marginLeft: 10 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 8 },
  required: { color: "red" },
  starsContainer: { flexDirection: "row", marginBottom: 20 },
  star: { marginRight: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9FF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  postButton: {
    backgroundColor: "#0056D2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  postText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#0056D2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { color: "#0056D2", fontSize: 16, fontWeight: "600" },
});