import colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

const fetchPendingTiffin = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const response = await axios.get(
    "https://tifstay-project-be.onrender.com/api/guest/tiffinServices/GetPendingBookingForCart",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data || [];
};

const fetchPendingHostel = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("No token found");
  const response = await axios.get(
    "https://tifstay-project-be.onrender.com/api/guest/hostelServices/getPendingBookingForCart",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data || [];
};

const PendingTiffinCard = ({ booking, onContinue }: { booking: any; onContinue: () => void }) => {
  const createdDateFromApi = booking.createdDate || (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : null);
  const createdTimeFromApi = booking.createdTime || (booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : null);
  return (
    <View style={pendingCardStyles.card}>
      <View style={pendingCardStyles.cardContent}>
        <Text style={pendingCardStyles.name}>{booking.tiffinServiceName}</Text>
        {/* created date/time */}
        {(createdDateFromApi || createdTimeFromApi) && (
          <View style={pendingCardStyles.createdRow}>
            <Text style={pendingCardStyles.createdLabel}>Booked on:</Text>
            <Text style={pendingCardStyles.createdValue}>
              {createdDateFromApi ? createdDateFromApi : ''}{createdDateFromApi && createdTimeFromApi ? ' • ' : ''}{createdTimeFromApi ? createdTimeFromApi : ''}
            </Text>
          </View>
        )}
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Plan Type:</Text>
          <Text style={pendingCardStyles.value}>{booking.planType}</Text>
        </View>

        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Food Type:</Text>
          <Text style={pendingCardStyles.value}>{booking.foodType}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Order Type:</Text>
          <Text style={pendingCardStyles.value}>{booking.orderType}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Start Date:</Text>
          <Text style={pendingCardStyles.value}>{new Date(booking.date).toLocaleDateString()}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>End Date:</Text>
          <Text style={pendingCardStyles.value}>{booking.endDate}</Text>
        </View>
        <View style={pendingCardStyles.priceRow}>
          <Text style={pendingCardStyles.price}>₹{booking.price}</Text>
        </View>
        <TouchableOpacity style={pendingCardStyles.continueButton} onPress={onContinue}>
          <Text style={pendingCardStyles.continueText}>Continue Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PendingHostelCard = ({ booking, onContinue }: { booking: any; onContinue: () => void }) => {
  const bedsList = booking.rooms?.[0]?.bedNumber?.map((bed: any) => `${bed.bedNumber} (${bed.name})`).join(', ') || 'N/A';
  const planName = booking.selectPlan?.[0]?.name || 'N/A';
  const planPrice = booking.selectPlan?.[0]?.price || 'N/A';
  const roomNumber = booking.rooms?.[0]?.roomNumber || 'N/A';
  const createdDateFromApi = booking.createdDate || (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : null);
  const createdTimeFromApi = booking.createdTime || (booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : null);
  return (
    <View style={pendingCardStyles.card}>
      <View style={pendingCardStyles.cardContent}>
        <Text style={pendingCardStyles.name}>{booking.hostelId?.hostelName}</Text>
        {(createdDateFromApi || createdTimeFromApi) && (
          <View style={pendingCardStyles.createdRow}>
            <Text style={pendingCardStyles.createdLabel}>Booked on:</Text>
            <Text style={pendingCardStyles.createdValue}>
              {createdDateFromApi ? createdDateFromApi : ''}
              {createdDateFromApi && createdTimeFromApi ? ' • ' : ''}
              {createdTimeFromApi ? createdTimeFromApi : ''}
            </Text>
          </View>
        )}
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Room:</Text>
          <Text style={pendingCardStyles.value}>{roomNumber}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Beds:</Text>
          <Text style={pendingCardStyles.value}>{bedsList}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Plan:</Text>
          <Text style={pendingCardStyles.value}>{planName}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Check-in:</Text>
          <Text style={pendingCardStyles.value}>{new Date(booking.checkInDate).toLocaleDateString()}</Text>
        </View>
        <View style={pendingCardStyles.row}>
          <Text style={pendingCardStyles.label}>Check-out:</Text>
          <Text style={pendingCardStyles.value}>{new Date(booking.checkOutDate).toLocaleDateString()}</Text>
        </View>
        <View style={pendingCardStyles.priceRow}>
          <Text style={pendingCardStyles.price}>₹{planPrice}</Text>
        </View>
        <View style={pendingCardStyles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={pendingCardStyles.locationText}>{booking.hostelId?.location?.fullAddress || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={pendingCardStyles.continueButton} onPress={onContinue}>
          <Text style={pendingCardStyles.continueText}>Continue Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CartScreen = () => {
  const {
    data: tiffinData = [],
    isLoading: tiffinLoading,
    refetch: refetchTiffin,
  } = useQuery({
    queryKey: ["pendingTiffin"],
    queryFn: fetchPendingTiffin,
  });
  const {
    data: hostelData = [],
    isLoading: hostelLoading,
    refetch: refetchHostel,
  } = useQuery({
    queryKey: ["pendingHostel"],
    queryFn: fetchPendingHostel,
  });
  useFocusEffect(
    React.useCallback(() => {
      refetchTiffin();
      refetchHostel();
    }, [refetchTiffin, refetchHostel])
  );

  const [activeTab, setActiveTab] = useState('tiffin');

  useEffect(() => {
    if (!tiffinLoading && !hostelLoading) {
      if (tiffinData.length > 0) {
        setActiveTab('tiffin');
      } else if (hostelData.length > 0) {
        setActiveTab('hostel');
      }
    }
  }, [tiffinData.length, hostelData.length, tiffinLoading, hostelLoading]);

  const totalTiffin = tiffinData.reduce((acc, item) => acc + parseFloat(item.price || 0), 0);
  const totalHostel = hostelData.reduce((acc, item) => {
    const price = item.selectPlan?.[0]?.price || 0;
    return acc + parseFloat(price);
  }, 0);
  const total = totalTiffin + totalHostel;

  const isLoadingOverall = tiffinLoading || hostelLoading;
  const isEmpty = tiffinData.length === 0 && hostelData.length === 0;

  const handleContinueTiffin = (id: string) => {
    const params = { bookingId: id, type: "tiffin" };
    console.log("Navigating to checkout with params:", params);
    router.push({
      pathname: "/(secure)/check-out",
      params,
    });
  };
  const handleContinueHostel = (id: string) => {
    const params = { bookingId: id, type: "hostel" };
    console.log("Navigating to checkout with params:", params);
    router.push({
      pathname: "/(secure)/check-out",
      params,
    });
  };
  const renderTiffinItem = ({ item }: { item: any }) => (
    <PendingTiffinCard booking={item} onContinue={() => handleContinueTiffin(item._id)} />
  );
  const renderHostelItem = ({ item }: { item: any }) => (
    <PendingHostelCard booking={item} onContinue={() => handleContinueHostel(item._id)} />
  );

  const renderTabContent = () => {
    if (activeTab === 'tiffin') {
      if (tiffinData.length > 0) {
        return (
          <FlatList
            data={tiffinData}
            renderItem={renderTiffinItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        );
      } else {
        return (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>No pending tiffin bookings</Text>
          </View>
        );
      }
    } else {
      if (hostelData.length > 0) {
        return (
          <FlatList
            data={hostelData}
            renderItem={renderHostelItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        );
      } else {
        return (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>No pending hostel bookings</Text>
          </View>
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingOverall ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No pending bookings</Text>
          </View>
        ) : (
          <>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'tiffin' && styles.activeTab]}
                onPress={() => setActiveTab('tiffin')}
              >
                <Text style={[styles.tabText, activeTab === 'tiffin' && styles.activeTabText]}>
                  Tiffin Booking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'hostel' && styles.activeTab]}
                onPress={() => setActiveTab('hostel')}
              >
                <Text style={[styles.tabText, activeTab === 'hostel' && styles.activeTabText]}>
                  Hostel Booking
                </Text>
              </TouchableOpacity>
            </View>
            {renderTabContent()}
            {/* <View style={styles.amountContainer}>
              <Text style={styles.amountTitle}>Amount to Pay</Text>
              <Text style={styles.totalText}>₹{total.toFixed(2)}</Text>
            </View> */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f4f4" },
  scrollContent: { paddingBottom: 40, flexGrow: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.title,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 16, color: "#000" },
  loadingContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 0,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyTab: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyTabText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  amountContainer: {
    backgroundColor: "white",
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  totalText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 16, color: "#6B7280", marginTop: 8 },
});

const pendingCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: { padding: 16 },
  name: { fontSize: 17, fontWeight: "bold", color: "#1A1A1A", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  value: { fontSize: 13, color: "#1A1A1A", flex: 1, textAlign: "right" },
  priceRow: { alignItems: "flex-end", marginTop: 4, marginBottom: 12 },
  price: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  locationText: { fontSize: 13, color: "#6B7280", marginLeft: 4, flex: 1 },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  continueText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  createdRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  createdLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  createdValue: { fontSize: 12, color: '#1A1A1A', textAlign: 'right', flex: 1 },

});

export default CartScreen;