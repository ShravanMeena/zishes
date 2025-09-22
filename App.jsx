import React, { useEffect } from "react";
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/store';
import RootNavigator from "./src/navigation/RootNavigator";
import {
  setupNotificationHandlers,
  enablePushAfterLogin,
  configureInAppMessaging,
  triggerOfferForCountry,
} from './src/notifications';
import { useSelector } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

function AppContent() {
  const token = useSelector((s) => s.auth.token);
  const country = useSelector((s) => s.auth.user?.address?.country);
  useEffect(() => {
    // Always set up listeners/channels once
    setupNotificationHandlers();
    configureInAppMessaging();
    // eslint-disable-next-line no-console
    console.log('[IAM] initial configuration requested');
  }, []);

  useEffect(() => {
    if (token) {
      // Only request permission and register when logged-in
      enablePushAfterLogin();
      // eslint-disable-next-line no-console
      console.log('[IAM] push + IAM init gated on login is active');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line no-console
    console.log('[IAM] effect fired for token + country', country || '(missing)');
    triggerOfferForCountry(country);
  }, [country, token]);

  return <RootNavigator />;
}

export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '882224850123-lugva9u6mm3bnhvb9jmjqnq30a7i9pcg.apps.googleusercontent.com',
      iosClientId: '882224850123-ns3924j48sg494aevqo05u1iehtl1ikc.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
