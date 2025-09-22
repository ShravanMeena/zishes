import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

/**
 * Simple, reusable hook-like helper for gallery permission.
 * Usage: const ensure = useGalleryPermission(); const ok = await ensure();
 */
export default function useGalleryPermission() {
  const ensure = async () => {
    if (Platform.OS === 'android') {
      try {
        const sdk = Platform.Version;
        const perms = sdk >= 33
          ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES]
          : [
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ].filter(Boolean);

        const results = await PermissionsAndroid.requestMultiple(perms);
        const granted = Object.values(results || {}).some((r) => r === PermissionsAndroid.RESULTS.GRANTED);
        if (granted) return true;

        const neverAsk = Object.values(results || {}).some((r) => r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
        if (neverAsk) {
          Alert.alert(
            'Permission Required',
            'Please enable Photos permission in Settings to add images to your listing.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (e) {
        return false;
      }
    }

    // iOS: The picker prompts automatically when Info.plist has Photo Library usage description.
    return true;
  };

  return ensure;
}
