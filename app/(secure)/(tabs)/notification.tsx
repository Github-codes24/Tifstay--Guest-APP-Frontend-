import Header from "@/components/Header";
import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
  {
    id: 1,
    date: "Today",
    title: "New Order Received",
    message:
      "You've got a new tiffin order! Tap to view details and start preparing.",
    icon: require("../../../assets/images/newOrder.png"),
    backgroundColor: "#F4F6FF",
  },
  {
    id: 2,
    date: "Today",
    title: "Order Accepted Confirmation",
    message: "You've accepted the order. Keep it ready by the scheduled time!",
    icon: require("../../../assets/images/oederAccepted.png"),
    backgroundColor: "#004AAD",
    textColor: "white",
  },
  {
    id: 3,
    date: "Sunday, July 9, 2025",
    title: "Earnings Summary (Weekly)",
    message: "You earned ₹22000 this week. Keep it up!",
    icon: require("../../../assets/images/earningSummary.png"),
    backgroundColor: "#F4F6FF",
  },
  {
    id: 4,
    date: "Monday, June 16, 2025",
    title: "Tiffin Service Approved",
    message: "Your new tiffin service has been approved and is now live!",
    icon: require("../../../assets/images/tiffinService.png"),
    backgroundColor: "#F4F6FF",
  },
];

export default function NotificationScreen() {
  const grouped = groupByDate(notifications);

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "white" }}>
        <Header title="Notifications" />
      </SafeAreaView>

      <ScrollView style={styles.container}>
        {Object.entries(grouped).map(([date, items]) => (
          <View key={date}>
            <Text style={styles.dateLabel}>{date}</Text>
            {items.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: item.backgroundColor }]}
              >
                <View style={styles.iconWrapper}>
                  <Image source={item.icon} style={styles.icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      item.textColor
                        ? { color: item.textColor }
                        : { color: "#0A051F" },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.message,
                      item.textColor
                        ? { color: item.textColor }
                        : { color: "grey" },
                    ]}
                  >
                    {item.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function groupByDate(data: typeof notifications) {
  const grouped: Record<string, typeof notifications> = {};
  for (const item of data) {
    if (!grouped[item.date]) {
      grouped[item.date] = [];
    }
    grouped[item.date].push(item);
  }
  return grouped;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#Ffffff",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 20,
    marginLeft: 20,
    fontWeight: "bold",
    color: "#0A051F",
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },

  dateLabel: {
    fontSize: 16,
    color: "#9C9BA6",
    marginBottom: 16,
    marginTop: 16,
  },
  card: {
    height: 100,
    flexDirection: "row",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  iconWrapper: {
    width: 52,
    height: 52,
    backgroundColor: "white",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
  },
  icon: {
    width: 52,
    height: 52,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "bold",
  },
  message: {
    fontSize: 13,
    paddingRight: 30,
  },
});
