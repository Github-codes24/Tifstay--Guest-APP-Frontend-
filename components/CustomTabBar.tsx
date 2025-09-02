/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import colors from "../constants/colors";

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

  const tabIcons = {
    index: require("@/assets/images/bottomTabIcon/homeTab.png"),
    favorite: require("@/assets/images/bottomTabIcon/favoriteTab.png"),
    booking: require("@/assets/images/bottomTabIcon/bookingTab.png"),
    notification: require("@/assets/images/bottomTabIcon/notificationTab.png"),
    profile: require("@/assets/images/bottomTabIcon/profileTab.png"),
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

          // Icon tint color animation
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
                  <Animated.Image
                    source={tabIcons[route.name as keyof typeof tabIcons]}
                    style={[
                      styles.icon,
                      {
                        opacity: iconOpacity,
                        tintColor: isFocused ? "#FFFFFF" : "#9CA3AF",
                      },
                    ]}
                    resizeMode="contain"
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    height: 55,
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
  },
  activeIconContainer: {
    backgroundColor: colors.primary,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: "500",
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
});

export default CustomTabBar;
