import React, { useEffect } from "react";
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/store';
import RootNavigator from "./src/navigation/RootNavigator";
import { setupNotificationHandlers, enablePushAfterLogin } from './src/notifications';
import { useSelector } from 'react-redux';

function AppContent() {
  const { token } = useSelector((s) => s.auth);
  useEffect(() => {
    // Always set up listeners/channels once
    setupNotificationHandlers();
  }, []);

  useEffect(() => {
    if (token) {
      // Only request permission and register when logged-in
      enablePushAfterLogin();
    }
  }, [token]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
