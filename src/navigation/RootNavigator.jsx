import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './navigationRef';
import linking from './linking';
import { useDispatch, useSelector } from 'react-redux';
import AppTabs from "./AppTabs";
import AuthStack from "./AuthStack";
import VerifyStack from "./VerifyStack";
import Splash from "../components/Splash";
import { bootstrapAuth, setUser } from "../store/auth/authSlice";
import { bootstrapApp } from "../store/app/appSlice";
import { bootstrapFavorites } from "../store/favorites/favoritesSlice";
import users from '../services/users';

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token, bootstrapped: authBoot, needsVerification, user } = useSelector((s) => s.auth);
  const { bootstrapped: appBoot, onboardingSeen } = useSelector((s) => s.app);

  useEffect(() => {
    dispatch(bootstrapAuth());
    dispatch(bootstrapApp());
    dispatch(bootstrapFavorites());
  }, [dispatch]);

  // Load user profile (for address.country) when authenticated
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (token && !user) {
        try {
          const me = await users.getMe();
          const doc = me?.data || me;
          if (!cancelled && doc) dispatch(setUser(doc));
        } catch (_) {}
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token, user, dispatch]);

  if (!authBoot || !appBoot) return <Splash />;

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {token
        ? (needsVerification
            ? <VerifyStack />
            : (
              // Avoid flashing Country screen before user is loaded.
              user == null
                ? <AppTabs />
                : (!user?.address?.country ? <CountryRequiredGateway /> : <AppTabs />)
            ))
        : (onboardingSeen ? <AuthStack /> : <OnboardingGateway />)}
    </NavigationContainer>
  );
}

// Inline gateway component to keep file cohesive
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import CountrySelectScreen from '../screens/auth/CountrySelectScreen';
function OnboardingGateway() {
  return <OnboardingScreen />;
}

const CountryStack = createNativeStackNavigator();
function CountryRequiredGateway() {
  return (
    <CountryStack.Navigator screenOptions={{ headerShown: false }}>
      <CountryStack.Screen name="CountrySelect" component={CountrySelectScreen} />
    </CountryStack.Navigator>
  );
}
