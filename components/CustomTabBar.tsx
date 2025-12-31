import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Text } from "react-native";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants/api';

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isFilterApplied, isSearchFocused } = useAppState();
  const [animatedValues] = React.useState(() =>
    state.routes.map(() => new Animated.Value(0))
  );

  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          if (mounted) setUnreadCount(0);
          return;
        }

        let page = 1;
        let totalPages = 1;
        let allNotifications: any[] = [];

        while (page <= totalPages) {
          const response = await axios.get(
            `${BASE_URL}/api/guest/notification/getAllNotification?page=${page}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            const newNotifs = response.data.data || [];
            allNotifications = [...allNotifications, ...newNotifs];
            totalPages = response.data.pagination?.totalPages || 1;
          }
          page++;
        }

        const unread = allNotifications.filter((n) => !n.isRead).length;
        if (mounted) setUnreadCount(unread);
      } catch (err) {
        if (mounted) setUnreadCount(0);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

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
  if (isFilterApplied || isSearchFocused) {
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
                    {route.name === "notification" && unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                      </View>
                    )}
                </Animated.View>

               <Animated.Text
  numberOfLines={1}
  ellipsizeMode="tail"
  style={[
    styles.label,
    isFocused && styles.activeLabel,
    {
      opacity: labelOpacity,
    },
  ]}
>
  {options.title}
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
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: "500",
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CustomTabBar;
