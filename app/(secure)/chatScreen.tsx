// TawkChatScreen.tsx
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const TAWK_DIRECT_CHAT_LINK =
  "https://tawk.to/chat/6931375d98a8f2197d548a66/1jbk40hmr";

const TawkChatScreen = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: TAWK_DIRECT_CHAT_LINK }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
};

export default TawkChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
