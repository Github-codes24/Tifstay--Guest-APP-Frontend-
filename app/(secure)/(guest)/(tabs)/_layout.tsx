import colors from "@/constants/colors";
import { Tabs } from "expo-router";
import React from "react";

export default function GuestTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textPrimary,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
          fontFamily: "Nunito_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          //   tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
