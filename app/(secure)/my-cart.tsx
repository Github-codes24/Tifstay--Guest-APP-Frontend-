// screens/MyCart.tsx
import React from "react";
import { router } from "expo-router";
import { CartCard, CartItemData } from "../../components/CartCard";

const MyCart: React.FC = () => {
  // Your cart items data
  const cartItems: CartItemData[] = [
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
      profileImageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    // Add more items as needed
  ];

  return (
    <CartCard
      cartItems={cartItems}
      onBackPress={() => router.back()}
      onCheckoutPress={() => router.push("/check-out?serviceType=tiffin")}
      onCalendarPress={(itemId) => console.log("Calendar pressed for:", itemId)}
      headerTitle="My Cart"
      checkoutButtonText="Go to Checkout"
    />
  );
};

export default MyCart;
