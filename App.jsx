import React, { useEffect, useState } from "react";
import { Provider } from 'react-redux';
import { StatusBar, View, Text, Platform } from 'react-native';
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
import { StripeProvider } from '@stripe/stripe-react-native';
import paymentsService from './src/services/payments';
import appVersionService from './src/services/appVersion';
import Splash from './src/components/Splash';
import AppUpdateModal from './src/components/modals/AppUpdateModal';
import { isVersionLessThan } from './src/utils/version';
import pkg from './package.json';

const APP_VERSION = pkg?.version || '0.0.0';

function StripeProviderGate({ children }) {
  const [publishableKey, setPublishableKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateConfig, setUpdateConfig] = useState(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [stripeResult, versionResult] = await Promise.allSettled([
          paymentsService.getStripeKey(),
          appVersionService.getLatestAppVersion(),
        ]);

        if (stripeResult.status === 'fulfilled') {
          const stripeData = stripeResult.value;
          const key = stripeData?.key || stripeData?.publishableKey || null;
          if (!key) throw new Error('Missing Stripe publishable key');
          if (active) setPublishableKey(key);
        } else {
          throw stripeResult.reason;
        }

        if (versionResult.status === 'fulfilled' && versionResult.value) {
          const versionData = versionResult.value;
          const platformCfg = Platform.OS === 'ios' ? versionData?.ios : versionData?.android;
          if (platformCfg) {
            const latest = platformCfg.latestVersion;
            const minRequired = platformCfg.minRequiredVersion;
            const updateType = String(platformCfg.updateType || '').toLowerCase();
            const storeUrl = platformCfg.storeUrl;

            const belowMin = minRequired ? isVersionLessThan(APP_VERSION, minRequired) : false;
            const belowLatest = latest ? isVersionLessThan(APP_VERSION, latest) : false;

            if (belowMin || (belowLatest && updateType === 'force')) {
              if (active) {
                setUpdateConfig({ type: 'force', latestVersion: latest, minRequiredVersion: minRequired, storeUrl });
                setUpdateVisible(true);
              }
            } else if (belowLatest && updateType === 'soft') {
              if (active) {
                setUpdateConfig({ type: 'soft', latestVersion: latest, minRequiredVersion: minRequired, storeUrl });
                setUpdateVisible(true);
              }
            }
          }
        }
      } catch (err) {
        if (active) setError(err);
        try { console.warn('[Stripe] Failed to fetch publishable key:', err); } catch {}
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <Splash />;
  if (!publishableKey) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>Payments unavailable</Text>
        <Text style={{ color: '#b0b3c6', textAlign: 'center', marginTop: 12 }}>
          We could not connect to our payment provider. Please check your connection and try again.
        </Text>
        {error ? (
          <Text style={{ color: '#6b6f83', textAlign: 'center', marginTop: 12 }}>
            {String(error?.message || error)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.com.zishes" setUrlSchemeOnAndroid>
      {children}
      <AppUpdateModal
        visible={updateVisible}
        type={updateConfig?.type}
        latestVersion={updateConfig?.latestVersion}
        minRequiredVersion={updateConfig?.minRequiredVersion}
        storeUrl={updateConfig?.storeUrl}
        onLater={() => setUpdateVisible(false)}
      />
    </StripeProvider>
  );
}

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

  return (
    <StripeProviderGate>
      <RootNavigator />
    </StripeProviderGate>
  );
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
