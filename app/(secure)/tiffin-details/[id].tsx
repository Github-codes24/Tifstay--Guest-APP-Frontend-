import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TiffinDetails() {
  const params: any = useLocalSearchParams();
  const id = parseInt(params?.id);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tiffin Details {id}</Text>
      <Text onPress={() => router.back()}>Go Back</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
  },
});
