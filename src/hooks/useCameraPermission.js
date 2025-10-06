import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

const neverAskAgain = PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

// Request camera + gallery access on Android; iOS is handled by the picker
export default function useCameraPermission() {
  const ensure = async () => {
    if (Platform.OS !== 'android') return true;

    const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else if (PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    if (Platform.Version <= 32 && PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE) {
      permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    }

    try {
      const results = await PermissionsAndroid.requestMultiple(permissions);
      const denied = permissions.filter((perm) => results?.[perm] !== PermissionsAndroid.RESULTS.GRANTED);

      if (denied.length === 0) return true;

      const permanentlyDenied = denied.some((perm) => results?.[perm] === neverAskAgain);
      if (permanentlyDenied) {
        Alert.alert(
          'Permission Required',
          'Camera and photo permissions are required to add listing photos. Please enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return false;
    } catch {
      return false;
    }
  };

  return ensure;
}
