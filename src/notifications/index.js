import { Alert, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { navigate } from '../navigation/navigationRef';
import store from '../store';
import { fetchMyWallet } from '../store/wallet/walletSlice';
import users from '../services/users';
import { getAccessToken } from '../services/tokenManager';

// Use a fresh, high-importance channel so heads-up notifications show reliably
const CHANNEL_ID = 'zishes_general_high';

let handlersInitialized = false;
let pushEnabled = false;

// Initialize listeners and initial-notification checks. Safe to call once at app start.
export async function setupNotificationHandlers() {
  if (handlersInitialized) return;

  // Create channel for Android
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Zishes Notifications',
    description: 'General notifications from Zishes',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500],
    lights: true,
  });

  // Foreground messages
  messaging().onMessage(async (remoteMessage) => {
    try { maybeHandleAppEvent(remoteMessage?.data || {}); } catch {}
    await displayRemoteMessage(remoteMessage);
  });

  // App opened from background by tapping a system notification
  messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage) {
      try { maybeHandleAppEvent(remoteMessage.data || {}); } catch {}
      handleNotificationOpen(remoteMessage.data || {});
    }
  });

  // App opened from quit by tapping a notification
  const initialNotifee = await notifee.getInitialNotification();
  if (initialNotifee?.notification?.data) {
    try { maybeHandleAppEvent(initialNotifee.notification.data); } catch {}
    handleNotificationOpen(initialNotifee.notification.data);
  } else {
    const initialFCM = await messaging().getInitialNotification();
    if (initialFCM?.data) {
      try { maybeHandleAppEvent(initialFCM.data); } catch {}
      handleNotificationOpen(initialFCM.data);
    }
  }

  // Foreground press handling for Notifee-created notifications
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const data = detail?.notification?.data || {};
      handleNotificationOpen(data);
    }
  });

  // Keep backend in sync if FCM token rotates
  try {
    messaging().onTokenRefresh(async (token) => {
      try {
        const payload = {
          fcmToken: token,
          fcm_token: token,
          device: Platform.OS,
          devicePlatform: (Platform.OS || '').toUpperCase(),
        };
        const bearer = await getAccessToken();
        if (!bearer) return;
        const res = await users.updateMe(payload, { token: bearer });
        // eslint-disable-next-line no-console
        console.log('[Push] onTokenRefresh updated backend:', JSON.stringify(res));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Push] onTokenRefresh update failed:', e?.message || e);
      }
    });
  } catch {}

  handlersInitialized = true;
}

// Call this when user is logged-in to request permission, register and get token
export async function enablePushAfterLogin() {
  if (pushEnabled) return;
  // Request permission on both platforms
  try {
    await notifee.requestPermission();
  } catch {}

  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch {}

  try {
    const token = await messaging().getToken();
    // Send token + device info to backend (include both key variants)
    try {
      const payload = {
        fcmToken: token,
        fcm_token: token,
        device: Platform.OS,
        devicePlatform: (Platform.OS || '').toUpperCase(),
      };
      const bearer = await getAccessToken();
      if (!bearer) return;
      const res = await users.updateMe(payload, { token: bearer });
      // eslint-disable-next-line no-console
      console.log('[Push] Updated FCM on backend:', JSON.stringify(res));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Push] Failed to update FCM token to backend:', e?.message || e);
    }
    // eslint-disable-next-line no-console
    console.log('FCM token:', token);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('FCM getToken failed:', String(e));
  }

  pushEnabled = true;
}

export async function displayRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data || {};
  try { maybeHandleAppEvent(data); } catch {}
  const title = data.title || remoteMessage?.notification?.title || 'Notification';
  const body = data.body || remoteMessage?.notification?.body || '';
  const image = pickImage(data, remoteMessage);
  const imageUrl = isValidHttpUrl(image) ? image : undefined;

  const androidOptions = {
    channelId: CHANNEL_ID,
    smallIcon: 'ic_launcher',
    pressAction: { id: 'default' },
    sound: 'default',
    vibrationPattern: [300, 500],
  };

  if (imageUrl) {
    androidOptions.largeIcon = imageUrl;
    androidOptions.style = { type: AndroidStyle.BIGPICTURE, picture: imageUrl };
  }

  try {
    await notifee.displayNotification({
      title,
      body,
      data,
      android: androidOptions,
      ios: {
        // Show system banner even when app is foreground
        foregroundPresentationOptions: { alert: true, sound: true, badge: true },
        // Attach rich media when provided
        ...(imageUrl ? { attachments: [{ url: imageUrl }] } : {}),
      },
    });
  } catch (err) {
    // Fallback without image-related properties
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
        ios: { foregroundPresentationOptions: { alert: true, sound: true, badge: true } },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Notifee displayNotification failed:', String(e));
    }
  }
}

// If backend webhook broadcasts a wallet update push, refresh store wallet everywhere
function maybeHandleAppEvent(data) {
  const t = String(data?.type || data?.event || '').toLowerCase();
  if (!t) return;
  // Accept a few common variants
  const walletSignals = ['wallet.updated', 'wallet_update', 'wallet:updated', 'wallet'];
  if (walletSignals.some(sig => t === sig || t.includes('wallet'))) {
    try { store.dispatch(fetchMyWallet()); } catch {}
  }
}

function handleNotificationOpen(data) {
  try {
    const pretty = JSON.stringify(data, null, 2);
    Alert.alert('Notification Clicked', pretty, [
      { text: 'OK', onPress: () => routeFromData(data) },
    ]);
  } catch {
    routeFromData(data);
  }
}

function routeFromData(data) {
  // Expecting either `route` or `type` with optional params
  const route = data.route || data.type;
  if (!route) return;
  try {
    const params = data.params ? safeJsonParse(data.params) : {};
    navigate(route, params);
  } catch (e) {
    navigate(route, {});
  }
}

function safeJsonParse(v) {
  try {
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch {
    return {};
  }
}

function pickImage(data, remoteMessage) {
  // Prefer data.image, then notification.android.imageUrl
  const candidate =
    data?.image ||
    data?.imageUrl ||
    remoteMessage?.notification?.android?.imageUrl ||
    remoteMessage?.notification?.ios?.imageUrl ||
    remoteMessage?.notification?.imageUrl ||
    remoteMessage?.notification?.image;
  if (!candidate || (typeof candidate === 'string' && candidate.trim().length === 0)) {
    return undefined;
  }
  return candidate;
}

function isValidHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export { configureInAppMessaging, triggerOfferForCountry } from './inAppMessaging';
