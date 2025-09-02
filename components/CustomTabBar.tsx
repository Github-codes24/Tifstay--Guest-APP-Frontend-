import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [animatedValues] = React.useState(() =>
    state.routes.map(() => new Animated.Value(0))
  );

  React.useEffect(() => {
    const animations = state.routes.map((_, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: state.index === index ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
  }, [state.index]);

  const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    index: "home-outline",
    favorites: "heart-outline",
    bookings: "calendar-outline",
    notifications: "mail-outline",
    profile: "person-circle-outline",
  };

  const activeIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    index: "home-sharp",
    favorites: "heart",
    bookings: "calendar",
    notifications: "mail",
    profile: "person-circle",
  };

  const tabNames: { [key: string]: string } = {
    index: "Home",
    favorites: "Favorites",
    bookings: "Bookings",
    notifications: "Alerts",
    profile: "Profile",
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: insets.bottom || 15,
        },
      ]}
    >
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = isFocused
            ? activeIcons[route.name] || "home"
            : icons[route.name] || "home-outline";
          const translateY = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -18],
          });

          const scale = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          });

          const labelOpacity = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabItemContent,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.activeIconContainer,
                    {
                      transform: [{ scale }],
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? "#FFFFFF" : "#9CA3AF"}
                  />
                </Animated.View>

                <Animated.Text
                  style={[
                    styles.label,
                    isFocused && styles.activeLabel,
                    {
                      opacity: labelOpacity,
                    },
                  ]}
                >
                  {tabNames[route.name] || route.name}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#F7F6F4",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 10,
  },
  tabBarContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 65, // Fixed height to accommodate the elevated active tab
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  tabItemContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: "#2563EB", // Blue background for active tab
  },
  label: {
    fontSize: 12,
    color: "transparent", // Hidden by default
    marginTop: 4,
    fontWeight: "500",
  },
  activeLabel: {
    color: "#2563EB", // Blue color for active label
    fontWeight: "600",
  },
});

export default CustomTabBar;
