import { Text, View, StyleSheet } from "react-native";

function Notification() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>favorites</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
},
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Notification;
