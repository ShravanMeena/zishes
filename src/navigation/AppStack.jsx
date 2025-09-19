import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UnityScreen from "../screens/home/UnityScreen";
import HomeScreen from "../screens/home/HomeScreen";
import DetailsScreen from "../screens/home/DetailsScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import PaymentMethodsScreen from "../screens/wallet/PaymentMethodsScreen";
import BuyCoinsScreen from "../screens/wallet/BuyCoinsScreen";
import MyListingsScreen from "../screens/profile/MyListingsScreen";
import TournamentsWonScreen from "../screens/profile/TournamentsWonScreen";
import EditProfileScreen from "../screens/account/EditProfileScreen";
import AcknowledgeReceiptScreen from "../screens/profile/AcknowledgeReceiptScreen";
import WebsiteTermsScreen from "../screens/misc/WebsiteTermsScreen";
import HyperKycScreen from "../screens/auth/HyperKycScreen";
import CountrySelectScreen from "../screens/auth/CountrySelectScreen";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/** Rename to avoid nested duplicate route name with Tab's Home */}
      <Stack.Screen name="HomeIndex" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="BuyCoins" component={BuyCoinsScreen} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} />
      <Stack.Screen name="TournamentsWon" component={TournamentsWonScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AcknowledgeReceipt" component={AcknowledgeReceiptScreen} />
      <Stack.Screen name="WebsiteTerms" component={WebsiteTermsScreen} />
      <Stack.Screen name="HyperKyc" component={HyperKycScreen} />
      <Stack.Screen name="CountrySelect" component={CountrySelectScreen} />
      <Stack.Screen
        name="UnityGame"
        component={UnityScreen}
        options={{ gestureEnabled: false}}
      />
    </Stack.Navigator>
  );
}
