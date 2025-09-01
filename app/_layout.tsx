import { Stack } from "expo-router";
import { AppStateProvider, useAppState } from "../context/AppStateProvider";

const Navigation = () => {
  const { user } = useAppState();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect={user} />
      <Stack.Screen name="(secure)" redirect={!user} />
    </Stack>
  );
};

export default function RootLayout() {
  // const [fontsLoaded, setFontsLoaded] = useState(false);

  // useEffect(() => {
  //   async function loadFonts() {
  //     await Font.loadAsync({
  //       "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
  //       "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  //       "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
  //     });
  //     setFontsLoaded(true);
  //   }
  //   loadFonts();
  // }, []);

  // if (!fontsLoaded) {
  //   return null;
  // }

  return (
    <AppStateProvider>
      <Navigation />
    </AppStateProvider>
  );
}
