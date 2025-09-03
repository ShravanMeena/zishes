import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VerifyScreen from '../screens/auth/VerifyScreen';
import CountrySelectScreen from '../screens/auth/CountrySelectScreen';

const Stack = createNativeStackNavigator();

export default function VerifyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen name="CountrySelect" component={CountrySelectScreen} />
    </Stack.Navigator>
  );
}

