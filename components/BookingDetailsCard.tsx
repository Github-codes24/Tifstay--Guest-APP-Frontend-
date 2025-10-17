import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

interface BookingDetailsCardProps {
  type: "tiffin" | "hostel";
  serviceName: string;
  price: string;
  image?: any;
}

const BookingDetailsCard: React.FC<BookingDetailsCardProps> = ({
  type,
  serviceName,
  price,
  image,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {image && <Image source={image} style={styles.image} />}
        <View style={styles.textContainer}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
          <Text style={styles.priceLabel}>
            {type === "tiffin" ? "Total Price: " : "Monthly Rent: "}
            <Text style={styles.price}>{price}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  price: {
    color: "#004AAD",
    fontWeight: "700",
  },
});

export default BookingDetailsCard;
