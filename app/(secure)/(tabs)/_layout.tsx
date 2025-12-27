import { Tabs } from "expo-router";
import React from "react";
import CustomTabBar from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
        }}
      />

      <Tabs.Screen
        name="favorite"
        options={{
          title: "Favorites",
        }}
      />

      <Tabs.Screen
        name="booking"
        options={{
          title: "Bookings",
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          title: "Notifications",
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
        }}
      />
    </Tabs>
  );
}
