// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
// } from 'react-native';

// const FilterScreen = () => {
//   return (
//     <ScrollView style={styles.container}>

//       {/* User Ratings */}
//       <Text style={styles.heading}>User Ratings*</Text>
//       <View style={styles.ratingRow}>
//         {['3.5', '3.8', '4.2', '4.5', '4.8', '5.0'].map((rating, index) => (
//           <TouchableOpacity key={index} style={styles.ratingButton}>
//             <Text>{rating}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Filter Sections */}
//       {['Cost', 'Offers', 'Cashback', 'Veg / Non-veg', 'Cuisine'].map((item, idx) => (
//         <TouchableOpacity key={idx} style={styles.dropdown}>
//           <Text style={styles.dropdownText}>{item}</Text>
//           <Image
//             source={require('./assets/arrow-down.png')}
//             style={styles.arrowIcon}
//           />
//         </TouchableOpacity>
//       ))}

//       {/* Apply Filter Button */}
//       <TouchableOpacity style={styles.applyButton}>
//         <Text style={styles.applyButtonText}>Apply Filter</Text>
//       </TouchableOpacity>

//     </ScrollView>
//   );
// };

// export default FilterScreen;
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   heading: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginVertical: 16,
//   },
//   ratingRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   ratingButton: {
//     backgroundColor: '#eee',
//     padding: 10,
//     width: '15%',
//     alignItems: 'center',
//     marginBottom: 10,
//     borderRadius: 6,
//   },
//   dropdown: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     backgroundColor: '#f3f3f3',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 12,
//     alignItems: 'center',
//   },
//   dropdownText: {
//     fontSize: 16,
//     color: '#000',
//   },
//   arrowIcon: {
//     width: 20,
//     height: 20,
//   },
//   applyButton: {
//     backgroundColor: '#007BFF',
//     marginTop: 24,
//     padding: 14,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   applyButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });
// App.js
// import React, { useState } from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// export default function App() {
//   const [message, setMessage] = useState('Hello, World!');

//   const handlePress = () => {
//     setMessage('You pressed the button!');
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>{message}</Text>
//       <Button title="Press Me" onPress={handlePress} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   text: {
//     fontSize: 24,
//     marginBottom: 20,
//   },
// });
