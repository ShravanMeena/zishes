import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UnityScreen from "../screens/home/UnityScreen";
import HomeScreen from "../screens/home/HomeScreen";
import DetailsScreen from "../screens/home/DetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/** Rename to avoid nested duplicate route name with Tab's Home */}
      <Stack.Screen name="HomeIndex" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen
        name="UnityGame"
        component={UnityScreen}
        options={{ gestureEnabled: false }} // Optional
      />
    </Stack.Navigator>
  );
}
