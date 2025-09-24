import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/constants/colors";

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: "1", text: "consequat nunc vitae tincidunt risus quam lectus.", time: "06:33 AM", sender: "me" },
    { id: "2", text: "Lorem ipsum dolor sit amet consectetur. Turpis vivamus pretium ac diam vitae cursus. Dictumst id consequat nunc vitae tincidunt risus quam lectus.", time: "06:34 AM", sender: "other" },
    { id: "3", text: "Lorem ipsum dolor sit amet consectetur. Turpis vivamus pretium ac diam vitae cursus. Dictumst id consequat nunc vitae tincidunt risus quam lectus.", time: "06:35 AM", sender: "me" },
    { id: "4", text: "Lorem ipsum dolor sit amet consectetur. Turpis vivamus pretium ac diam vitae cursus. Dictumst id consequat nunc vitae tincidunt risus quam lectus.", time: "06:36 AM", sender: "other" },
    { id: "5", text: "Lorem ipsum dolor sit amet consectetur. Turpis vivamus pretium ac diam vitae cursus. Dictumst id consequat nunc vitae tincidunt risus quam lectus.", time: "06:37 AM", sender: "me" },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sender: "me",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender === "me";
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMe && { color: colors.white, textAlign: "right" }]}>{item.text}</Text>
        <Text style={[styles.timeText, isMe ? { color: colors.white } : { color: colors.grey }]}>{item.time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Service</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
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
            <Image source={require("../../../assets/images/send.png")} style={{ width: 40, height: 39 }} />
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
  container: { flex: 1, backgroundColor: colors.white },
  messageContainer: { maxWidth: "80%", borderRadius: 12, padding: 10, marginVertical: 5 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#5E9BED", borderBottomRightRadius: 0 },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#F5F5F5", borderBottomLeftRadius: 0 },
  messageText: { fontSize: 14, lineHeight: 18, marginBottom: 4 },
  timeText: { fontSize: 11, textAlign: "right" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, borderColor: "#ddd", backgroundColor: "#fff" },
  input: { flex: 1, backgroundColor: "#F8F5FF", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: "#ddd", marginRight: 10, height: 56 },
  sendButton: { borderRadius: 50 },
});