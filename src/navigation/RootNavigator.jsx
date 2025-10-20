import React, { useCallback, useEffect, useRef, useState } from "react";
import { CommonActions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BackHandler, Linking } from 'react-native';
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
  const navigateToDeepLink = useCallback((payload) => {
    if (!payload) return;
    switch (payload.type) {
      case 'wallet':
        navigationRef.navigate('Wallet', { screen: 'WalletHome' });
        break;
      case 'product':
        navigationRef.navigate('Home', { screen: 'Details', params: { id: payload.id } });
        break;
      case 'leaderboard':
        if (payload.tournamentId) {
          navigationRef.navigate('Home', {
            screen: 'Leaderboard',
            params: {
              tournamentId: payload.tournamentId,
              productId: payload.productId || null,
            },
          });
        } else if (payload.productId) {
          navigationRef.navigate('Home', { screen: 'Details', params: { id: payload.productId } });
        }
        break;
      case 'uploadProof':
        navigationRef.navigate('Wallet', {
          screen: 'UploadProof',
          params: { productId: payload.productId, focus: 'proof' },
        });
        break;
      case 'acknowledgement':
        if (payload.tournamentId) {
          navigationRef.navigate('Home', {
            screen: 'AcknowledgeReceipt',
            params: {
              tournamentId: payload.tournamentId,
              productId: payload.productId || null,
            },
          });
        } else if (payload.productId) {
          navigationRef.navigate('Home', { screen: 'Details', params: { id: payload.productId } });
        }
        break;
      default:
        break;
    }
  }, []);

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

  const handleHardwareBack = useCallback(() => {
    if (!navigationRef.isReady()) {
      return false;
    }

    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(CommonActions.goBack());
      return true;
    }

    const rootState = navigationRef.getRootState();
    if (rootState) {
      const history = Array.isArray(rootState?.history) ? rootState.history : [];
      if (rootState?.type === 'tab' && history.length > 1) {
        const previousEntry = history[history.length - 2];
        if (previousEntry?.type === 'route') {
          const targetRoute = rootState.routes?.find((route) => route.key === previousEntry.key);
          if (targetRoute) {
            navigationRef.dispatch(
              CommonActions.navigate({
                name: targetRoute.name,
                key: targetRoute.key,
                params: targetRoute.params,
                merge: true,
              })
            );
            return true;
          }
        }
      }
    }

    return false;
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [handleHardwareBack]);

  useEffect(() => {
    const handleUrl = (incomingUrl) => {
      if (!incomingUrl) return;
      const payload = parseDeepLink(incomingUrl);
      if (!payload) return;

      if (navigationReady && canEnterApp) {
        navigateToDeepLink(payload);
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
  }, [canEnterApp, navigationReady, navigateToDeepLink]);

  useEffect(() => {
    if (!pendingDeepLink) return;
    if (!navigationReady || !canEnterApp) return;

    navigateToDeepLink(pendingDeepLink);
    setPendingDeepLink(null);
  }, [pendingDeepLink, navigationReady, canEnterApp, navigateToDeepLink]);

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
