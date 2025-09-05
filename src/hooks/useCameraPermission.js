import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

// Request camera permission on Android; iOS is handled by the picker
export default function useCameraPermission() {
  const ensure = async () => {
    if (Platform.OS === 'android') {
      try {
        const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (status === PermissionsAndroid.RESULTS.GRANTED) return true;
        if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Required',
            'Please enable Camera permission in Settings to take photos.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch {
        return false;
      }
    }
    return true;
  };
  return ensure;
}

