import Constants from 'expo-constants';

// Get the base URL from environment variables
export const BASE_URL = Constants.expoConfig?.extra?.baseUrl || 
                        process.env.EXPO_PUBLIC_BASE_URL || 
                        'https://tifstay-project-be-1.onrender.com';

// You can define API endpoints here
export const API_ENDPOINTS = {
  // Example endpoints
  AUTH: `${BASE_URL}/auth`,
  USERS: `${BASE_URL}/users`,
  HOSTELS: `${BASE_URL}/hostels`,
  TIFFIN: `${BASE_URL}/tiffin`,
  BOOKINGS: `${BASE_URL}/bookings`,
  PAYMENTS: `${BASE_URL}/payments`,
  // Add more endpoints as needed
};

export default {
  BASE_URL,
  API_ENDPOINTS,
};
