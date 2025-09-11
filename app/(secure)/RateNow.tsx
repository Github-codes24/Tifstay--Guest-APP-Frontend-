import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { pen } from "@/assets/images";
import CustomButton from "@/components/CustomButton";

const RateNowScreen = () => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");

  const handleRating = (value: number) => setRating(value);

  const handleCancel = () => {
    setRating(0);
    setTitle("");
    setReview("");
  };

  const handlePost = () => {
    console.log({ rating, title, review });
    // post logic here
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} />
        <Text style={styles.headerTitle}>Rate Now</Text>
      </View>

      {/* Score */}
      <Text style={styles.label}>
        Score<Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((item) => (
          <TouchableOpacity key={item} onPress={() => handleRating(item)}>
            <AntDesign
              name={item <= rating ? "star" : "staro"}
              size={30}
              color="orange"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Title Input */}
      <Text style={styles.label}>
        Title<Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.inputWrapper}>
        <Image source={pen} style={styles.icon} />
        <TextInput
          placeholder="Write here.."
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      {/* Review Input */}
      <Text style={styles.label}>
        Review<Text style={styles.required}>*</Text>
      </Text>
      <View
        style={[
          styles.inputWrapper,
          { height: 100, alignItems: "flex-start" },
        ]}
      >
        <Image source={pen} style={styles.icon1} />
        <TextInput
          placeholder="Write here.."
          placeholderTextColor="#999"
          multiline
          value={review}
          onChangeText={setReview}
          style={[styles.input, { height: "100%", textAlignVertical: "top" }]}
        />
      </View>

      {/* Cancel Button (works + styled) */}
      <CustomButton
        title="Cancel"
        onPress={handleCancel}
        style={styles.cancelBtn}
        textStyle={{ color: "#004AAD" }}
      />

      {/* Post Button */}
      <CustomButton
        title="Post"
        onPress={handlePost}
        style={styles.postBtn}
        textStyle={{ color: "#fff" }}
      />
    </View>
  );
};

export default RateNowScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 6,
  },
  required: {
    color: "red",
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F5FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 10,
  },
  icon1: {
    height: 16,
    width: 16,
    marginTop: 13,
  },
  icon: {
    height: 16,
    width: 16,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#004AAD",
    marginTop: 10,
  },
  postBtn: {
    backgroundColor: "#004AAD",
    marginTop: 10,
  },
});
