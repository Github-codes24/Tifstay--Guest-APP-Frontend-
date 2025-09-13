// components/CustomTabBar.tsx
/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import colors from "../constants/colors";
import { useAppState } from "@/context/AppStateProvider";
import {
  accountTab,
  bookingTab,
  favoriteTab,
  homeTab,
  notificationTab,
} from "@/assets/images";

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isFilterApplied } = useAppState();
  const [animatedValues] = React.useState(() =>
    state.routes.map(() => new Animated.Value(0))
  );

  // IMPORTANT: All hooks must be called before any conditional returns
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
    index: homeTab,
    favorite: favoriteTab,
    booking: bookingTab,
    notification: notificationTab,
    account: accountTab,
  };

  // NOW we can conditionally return after all hooks have been called
  if (isFilterApplied) {
    return null;
  }

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
                  {isFocused && options.title}
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
    paddingTop: 8,
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
    top: 6,
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
