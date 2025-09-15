import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface CartItemData {
  id: string;
  title: string;
  imageUrl: string;
  mealType: string;
  foodType: string;
  startDate: string;
  plan: string;
  orderType: string;
  price: string;
  profileImageUrl?: string;
}

interface CartComponentProps {
  cartItems?: CartItemData[];
  onBackPress?: () => void;
  onCheckoutPress?: () => void;
  onCalendarPress?: (itemId: string) => void;
  headerTitle?: string;
  checkoutButtonText?: string;
  showStatusBar?: boolean;
}

export const CartCard: React.FC<CartComponentProps> = ({
  cartItems = [],
  onBackPress,
  onCheckoutPress,
  onCalendarPress,
  headerTitle = "My Cart",
  checkoutButtonText = "Go to Checkout",
  showStatusBar = true,
}) => {
  // Default cart item if no items provided
  const defaultCartItems: CartItemData[] =
    cartItems.length > 0
      ? cartItems
      : [
          {
            id: "1",
            title: "Maharashtrian Ghar Ka Khana",
            imageUrl:
              "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
            mealType: "Lunch",
            foodType: "Veg",
            startDate: "21/07/25",
            plan: "Daily",
            orderType: "Delivery",
            price: "₹120/meal",
          },
        ];

  return (
    <SafeAreaView style={styles.container}>
      {showStatusBar && (
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {defaultCartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.cartItemContent}>
              {/* Food Image */}
              <Image source={{ uri: item.imageUrl }} style={styles.foodImage} />

              {/* Item Details */}
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle}>{item.title}</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Meal Type</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.mealType}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Food Type</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.foodType}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.startDate}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plan</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.plan}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Type</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.orderType}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailColon}>:</Text>
                  <Text style={styles.detailValue}>{item.price}</Text>
                </View>
              </View>
            </View>

            {/* Calendar Icon */}
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => onCalendarPress?.(item.id)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Checkout Button */}
        <View style={styles.checkoutContainer}>
          <TouchableOpacity
            onPress={onCheckoutPress}
            style={styles.checkoutButton}
          >
            <Text style={styles.checkoutText}>{checkoutButtonText}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: "#000",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cartItemContent: {
    flexDirection: "row",
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    width: 80,
  },
  detailColon: {
    fontSize: 13,
    color: "#666",
    marginHorizontal: 8,
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  calendarButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  checkoutContainer: {
    padding: 16,
    marginTop: 8,
    marginHorizontal: -16,
    borderRadius: 12,
  },
  checkoutButton: {
    backgroundColor: "#2B52B5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
