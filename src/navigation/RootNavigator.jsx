import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from './navigationRef';
import { useDispatch, useSelector } from 'react-redux';
import AppTabs from "./AppTabs";
import AuthStack from "./AuthStack";
import VerifyStack from "./VerifyStack";
import Splash from "../components/Splash";
import { bootstrapAuth } from "../store/auth/authSlice";
import { bootstrapApp } from "../store/app/appSlice";
import { bootstrapFavorites } from "../store/favorites/favoritesSlice";

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token, bootstrapped: authBoot, needsVerification } = useSelector((s) => s.auth);
  const { bootstrapped: appBoot, onboardingSeen } = useSelector((s) => s.app);

  useEffect(() => {
    dispatch(bootstrapAuth());
    dispatch(bootstrapApp());
    dispatch(bootstrapFavorites());
  }, [dispatch]);

  if (!authBoot || !appBoot) return <Splash />;

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? (needsVerification ? <VerifyStack /> : <AppTabs />) : (onboardingSeen ? <AuthStack /> : <OnboardingGateway />)}
    </NavigationContainer>
  );
}

// Inline gateway component to keep file cohesive
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
function OnboardingGateway() {
  return <OnboardingScreen />;
}
