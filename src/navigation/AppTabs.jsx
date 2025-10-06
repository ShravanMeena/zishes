import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTabBar from './CustomTabBar';
import AppStack from "./AppStack";
import ProfileStack from "./ProfileStack";
import WalletStack from "./WalletStack";
import SellScreen from "../screens/sell/SellScreen";
import FavoritesScreen from "../screens/favorites/FavoritesScreen";
import { Home, User, CreditCard, Heart, ShoppingBag } from 'lucide-react-native';
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      backBehavior="history"
      screenOptions={({ route }) => {
        // Hide tab bar when Unity screen is focused inside Home stack
        const focused = getFocusedRouteNameFromRoute(route) ?? 'HomeIndex';
        const hideForUnity = route.name === 'Home' && focused === 'UnityGame';

        return {
          headerShown: false,
          tabBarStyle: hideForUnity
            ? { display: 'none' }
            : {
                backgroundColor: colors.black,
                borderTopColor: '#22252C',
                height: 58 + insets.bottom,
                paddingBottom: insets.bottom,
              },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
        };
      }}
    >
      {/** Use a nested stack so Home can push Details/UnityGame without showing in tabs */}
      <Tab.Screen name="Home" component={AppStack} />
      <Tab.Screen name="Wallet" component={WalletStack} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
