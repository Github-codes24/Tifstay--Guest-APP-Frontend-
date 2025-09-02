import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

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

  // Define tab icons with error handling
  const getTabIcon = (routeName: string) => {
    try {
      switch (routeName) {
        case "index":
          return require("@/assets/images/bottomTabIcon/homeTab.png");
        case "favorite":
          return require("@/assets/images/bottomTabIcon/favoriteTab.png");
        case "booking":
          return require("@/assets/images/bottomTabIcon/bookingTab.png");
        case "notification":
          return require("@/assets/images/bottomTabIcon/notificationTab.png");
        case "profile":
          return require("@/assets/images/bottomTabIcon/profileTab.png");
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Failed to load icon for ${routeName}:`, error);
      return null;
    }
  };

  // Fallback icons using Ionicons
  const fallbackIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    index: "home",
    favorite: "heart",
    booking: "calendar",
    notification: "notifications",
    profile: "person",
  };

  const tabNames: { [key: string]: string } = {
    index: "Home",
    favorite: "Favorites",
    booking: "Bookings",
    notification: "Alerts",
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
          const tabIcon = getTabIcon(route.name);

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

          const iconOpacity = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1],
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
                  {tabIcon ? (
                    <Animated.Image
                      source={tabIcon}
                      style={[
                        styles.icon,
                        {
                          opacity: iconOpacity,
                          tintColor: isFocused ? "#FFFFFF" : "#9CA3AF",
                        },
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    // Fallback to Ionicons if image fails to load
                    <Ionicons
                      name={fallbackIcons[route.name] || "help-circle"}
                      size={24}
                      color={isFocused ? "#FFFFFF" : "#9CA3AF"}
                    />
                  )}
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
    height: 65,
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
    backgroundColor: "#2563EB",
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    color: "transparent",
    marginTop: 4,
    fontWeight: "500",
  },
  activeLabel: {
    color: "#2563EB",
    fontWeight: "600",
  },
});

export default CustomTabBar;
