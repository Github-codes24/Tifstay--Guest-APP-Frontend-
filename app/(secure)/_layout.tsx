import { Stack } from "expo-router";
import { useAppState } from "../../context/AppStateProvider";

export default function SecureLayout() {
  const { serviceType } = useAppState();
  console.log({ serviceType });

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(guest)" redirect={serviceType !== 0} />
      <Stack.Screen
        name="(provider)"
        redirect={serviceType !== 1 && serviceType !== 0}
      />
      <Stack.Screen
        name="(owner)"
        redirect={serviceType !== 2 && serviceType !== 1}
      />
    </Stack>
  );
}
