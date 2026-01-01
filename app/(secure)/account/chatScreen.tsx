import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/constants/colors";
import { BASE_URL } from "@/constants/api";

const ChatScreen = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // 🔹 Fetch chat and adminId
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Error", "Token missing from storage");
          return;
        }

        const res = await fetch(
         `${BASE_URL}/api/guest/message/getGuestPreviousChat`,
          {
            method: "GET",
            headers: { Authorization: "Bearer " + token },
          }
        );
        const json = await res.json();
        console.log("Chat API:", json);

        if (json.success) {
          // Handle adminId
          let adminIdFromAPI = json.data?.adminInfo?.adminId;
          if (!adminIdFromAPI) {
            // fallback for new users if no conversation exists
            adminIdFromAPI = "68d4dad8fe31c5dc1f5d294d"; // default adminId
          }
          await AsyncStorage.setItem("adminId", adminIdFromAPI);

          // Format messages
          const formatted = json.data.messages?.map((m: any, idx: number) => ({
            id: idx.toString(),
            text: m.message,
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sender: m.senderName ? "other" : "me",
          })) || [];
          setMessages(formatted);
        } else {
          Alert.alert("Error", json.message || "Failed to load chat");
        }
      } catch (err) {
        console.log("Chat fetch error:", err);
        Alert.alert("Error", "Failed to fetch chat");
      }
    };
    fetchChat();
  }, []);

  // 🔹 Send message
  const sendMessage = async () => {
    if (!input.trim()) {
      Alert.alert("Validation", "Message cannot be empty");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const guestId = await AsyncStorage.getItem("guestId");
      const adminId = await AsyncStorage.getItem("adminId");

      if (!token || !guestId || !adminId) {
        Alert.alert(
          "Error",
          `Missing values:\nToken: ${!!token}\nGuestId: ${!!guestId}\nAdminId: ${!!adminId}`
        );
        return;
      }

      const newMessage = {
        id: Date.now().toString(),
        text: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: "me",
      };

      setMessages(prev => [...prev, newMessage]);
      const messageToSend = input;
      setInput("");

      const res = await fetch(
        `${BASE_URL}/api/guest/message/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            senderId: guestId,
            receiverId: adminId,
            message: messageToSend,
          }),
        }
      );

      const json = await res.json();
      console.log("Send API:", json);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.log("Send error:", err);
      Alert.alert("Error", "Failed to send message");
    }
  };

  // 🔹 Render message bubble
  const renderMessage = ({ item }: any) => {
    const isMe = item.sender === "me";
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMe && { color: colors.white, textAlign: "right" }]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isMe ? { color: colors.white } : { color: colors.grey }]}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Service</Text>
      </View>

      {/* Chat list + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input box */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type Message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Image
              source={require("../../../assets/images/send.png")}
              style={{ width: 40, height: 39 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 28, height: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.title, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
  messageContainer: { maxWidth: "80%", borderRadius: 12, padding: 10, marginVertical: 5 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#5E9BED", borderBottomRightRadius: 0 },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#F5F5F5", borderBottomLeftRadius: 0 },
  messageText: { fontSize: 14, lineHeight: 18, marginBottom: 4 },
  timeText: { fontSize: 11, textAlign: "right" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, borderColor: "#ddd", backgroundColor: "#fff" },
  input: { flex: 1, backgroundColor: "#F8F5FF", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: "#ddd", marginRight: 10, height: 56 },
  sendButton: { borderRadius: 50 },
});
