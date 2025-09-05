import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { displayRemoteMessage } from './index';

// Android-only background handlers
if (Platform.OS === 'android') {
  // Handle FCM data-only messages in the background/quit state
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    await displayRemoteMessage(remoteMessage);
  });

  // Handle when a user taps a Notifee notification in the background
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      // No UI here; actual routing is handled on app start via getInitialNotification
    }
  });
}
