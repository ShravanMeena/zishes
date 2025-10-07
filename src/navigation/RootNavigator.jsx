import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';
import { navigationRef } from './navigationRef';
import linking from './linking';
import { useDispatch, useSelector } from 'react-redux';
import AppTabs from "./AppTabs";
import AuthStack from "./AuthStack";
import Splash from "../components/Splash";
import { bootstrapAuth, setUser } from "../store/auth/authSlice";
import { bootstrapApp } from "../store/app/appSlice";
import { bootstrapFavorites } from "../store/favorites/favoritesSlice";
import users from '../services/users';
import { parseDeepLink } from '../utils/deepLinks';

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token, bootstrapped: authBoot, user } = useSelector((s) => s.auth);
  const { bootstrapped: appBoot, onboardingSeen } = useSelector((s) => s.app);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState(null);
  const initialUrlHandledRef = useRef(false);

  useEffect(() => {
    dispatch(bootstrapAuth());
    dispatch(bootstrapApp());
    dispatch(bootstrapFavorites());
  }, [dispatch]);

  // Load user profile (for address.country) when authenticated
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!token) {
        if (!cancelled) {
          setProfileHydrated(true);
        }
        return;
      }

      if (user?.address?.country) {
        if (!cancelled) {
          setProfileHydrated(true);
        }
        return;
      }

      if (!cancelled) {
        setProfileHydrated(false);
      }

      try {
        const me = await users.getMe();
        const doc = me?.data || me;
        if (!cancelled && doc) dispatch(setUser(doc));
      } catch (_) {
        // Allow navigation even if profile fetch fails
      } finally {
        if (!cancelled) {
          setProfileHydrated(true);
        }
      }
    };

    hydrate();

    return () => { cancelled = true; };
  }, [token, user?.address?.country, dispatch]);

  const canEnterApp = token && profileHydrated && !!user?.address?.country;

  useEffect(() => {
    const handleUrl = (incomingUrl) => {
      if (!incomingUrl) return;
      const payload = parseDeepLink(incomingUrl);
      if (!payload) return;

      if (navigationReady && canEnterApp) {
        navigationRef.navigate('Home', {
          screen: 'Details',
          params: { id: payload.id },
        });
      } else {
        setPendingDeepLink(payload);
      }
    };

    if (!initialUrlHandledRef.current) {
      initialUrlHandledRef.current = true;
      Linking.getInitialURL()
        .then((initialUrl) => {
          if (initialUrl) handleUrl(initialUrl);
        })
        .catch(() => {});
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (typeof subscription === 'function') {
        subscription();
      }
    };
  }, [canEnterApp, navigationReady]);

  useEffect(() => {
    if (!pendingDeepLink) return;
    if (!navigationReady || !canEnterApp) return;

    navigationRef.navigate('Home', {
      screen: 'Details',
      params: { id: pendingDeepLink.id },
    });
    setPendingDeepLink(null);
  }, [pendingDeepLink, navigationReady, canEnterApp]);

  if (!authBoot || !appBoot) return <Splash />;

  if (token && !profileHydrated) {
    return <Splash />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => setNavigationReady(true)}
    >
      {token
        ? (
            // Avoid flashing Country screen before user is loaded.
            (!user?.address?.country ? <CountryRequiredGateway /> : <AppTabs />)
          )
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
